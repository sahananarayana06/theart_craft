  const express = require('express');
  const path = require('path');
  const sqlite3 = require('sqlite3').verbose();
  const fs = require('fs');
  const multer = require('multer');

  const app = express();
  const PORT = process.env.PORT || 3000;
  const ADMIN_KEY = process.env.ADMIN_KEY || 'adminsecret';

  const DB_FILE = path.join(__dirname, 'data.db');
  const db = new sqlite3.Database(DB_FILE);

  // ensure uploads folder exists
  const UPLOADS_DIR = path.join(__dirname, 'uploads');
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

  // multer setup
  const storage = multer.diskStorage({
    destination: function (req, file, cb) { cb(null, UPLOADS_DIR); },
    filename: function (req, file, cb) { cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_')); }
  });
  const upload = multer({ storage });

  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      description TEXT,
      price REAL,
      image TEXT,
      category TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      productId INTEGER,
      category TEXT,
      name TEXT,
      rating INTEGER,
      message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    db.run('ALTER TABLE reviews ADD COLUMN category TEXT', () => {});
  });

  app.use(express.json());
  app.use(express.static(path.join(__dirname)));
  app.use('/uploads', express.static(UPLOADS_DIR));

  // Upload image (admin)
  app.post('/api/upload', (req, res) => {
    if (req.headers['x-admin-key'] !== ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
    upload.single('image')(req, res, function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
      const url = `/uploads/${req.file.filename}`;
      res.json({ url });
    });
  });

  // Admin verify
  app.get('/api/admin/verify', (req, res) => {
    if (req.headers['x-admin-key'] === ADMIN_KEY) return res.json({ok: true});
    res.status(401).json({error: 'Unauthorized'});
  });

  // Products
  app.get('/api/products', (req, res) => {
    db.all('SELECT * FROM products ORDER BY id DESC', (err, rows) => {
      if (err) return res.status(500).json({error: err.message});
      res.json(rows);
    });
  });

  app.post('/api/products', (req, res) => {
    if (req.headers['x-admin-key'] !== ADMIN_KEY) return res.status(401).json({error: 'Unauthorized'});
    const { title, description, price, image, category } = req.body;
    const stmt = db.prepare('INSERT INTO products (title,description,price,image,category) VALUES (?,?,?,?,?)');
    stmt.run(title, description, price || 0, image || '', category || '', function (err) {
      if (err) return res.status(500).json({error: err.message});
      db.get('SELECT * FROM products WHERE id = ?', [this.lastID], (e, row) => {
        if (e) return res.status(500).json({error: e.message});
        res.json(row);
      });
    });
    stmt.finalize();
  });

  app.put('/api/products/:id', (req, res) => {
    if (req.headers['x-admin-key'] !== ADMIN_KEY) return res.status(401).json({error: 'Unauthorized'});
    const id = req.params.id;
    const { title, description, price, image, category } = req.body;
    db.run('UPDATE products SET title=?,description=?,price=?,image=?,category=? WHERE id=?', [title, description, price, image, category, id], function (err) {
      if (err) return res.status(500).json({error: err.message});
      db.get('SELECT * FROM products WHERE id = ?', [id], (e, row) => {
        if (e) return res.status(500).json({error: e.message});
        res.json(row);
      });
    });
  });

  app.delete('/api/products/:id', (req, res) => {
    if (req.headers['x-admin-key'] !== ADMIN_KEY) return res.status(401).json({error: 'Unauthorized'});
    const id = req.params.id;
    db.run('DELETE FROM products WHERE id = ?', [id], function (err) {
      if (err) return res.status(500).json({error: err.message});
      res.json({ok: true, deletedId: Number(id)});
    });
  });

  // Reviews
  app.get('/api/reviews', (req, res) => {
    const productId = req.query.productId;
    const sql = productId ? 'SELECT * FROM reviews WHERE productId = ? ORDER BY created_at DESC' : 'SELECT * FROM reviews ORDER BY created_at DESC';
    const params = productId ? [productId] : [];
    db.all(sql, params, (err, rows) => {
      if (err) return res.status(500).json({error: err.message});
      res.json(rows);
    });
  });

  app.post('/api/reviews', (req, res) => {
    const { productId, category, name, rating, message } = req.body;
    if (!name || !message) return res.status(400).json({error: 'Name and message are required'});
    const stmt = db.prepare('INSERT INTO reviews (productId,category,name,rating,message) VALUES (?,?,?,?,?)');
    stmt.run(productId || null, category || null, name, rating || 5, message, function (err) {
      if (err) return res.status(500).json({error: err.message});
      db.get('SELECT * FROM reviews WHERE id = ?', [this.lastID], (e, row) => {
        if (e) return res.status(500).json({error: e.message});
        res.json(row);
      });
    });
    stmt.finalize();
  });

  // Delete review (admin)
  app.delete('/api/reviews/:id', (req, res) => {
    if (req.headers['x-admin-key'] !== ADMIN_KEY) return res.status(401).json({error: 'Unauthorized'});
    const id = req.params.id;
    db.run('DELETE FROM reviews WHERE id = ?', [id], function (err) {
      if (err) return res.status(500).json({error: err.message});
      res.json({ok: true, deletedId: Number(id)});
    });
  });

  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
