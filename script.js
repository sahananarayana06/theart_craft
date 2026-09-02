const products = [];
const categories=[
  "All",
  "Keychains",
  "Frames",
  "Misc",
];
const categoryOrder = ["All", "Keychains", "Frames", "Misc"];
const why=[
 ["fa-hand-holding-heart","100% Handmade","Every piece crafted with care"],
 ["fa-gem","Premium Quality","Best materials used"],
 ["fa-palette","Customized Designs","Tailored to your needs"],
 ["fa-tag","Affordable Prices","Quality at fair prices"],
 ["fa-box","Secure Packaging","Safe delivery guaranteed"],
 ["fa-heart","Made with Love","Passion in every product"]
];

let selected="All";
const grid=document.getElementById("productGrid");
const filters=document.getElementById("filters");
const gallery=document.getElementById("galleryGrid");
const search=document.getElementById("searchInput");
const empty=document.getElementById("emptyState");

function renderFilters(){
  const dynamicCategories = [...new Set(products.map(p => p.category).filter(Boolean))];
  const available = [
    "All",
    ...dynamicCategories.sort((a, b) => {
      const indexA = categoryOrder.indexOf(a);
      const indexB = categoryOrder.indexOf(b);
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    })
  ];
  if (!products.length) {
    filters.innerHTML = "";
    return;
  }
  filters.innerHTML = available.map(c => `<button class="filter ${c===selected?"active":""}" onclick="selectCategory('${c}')">${c}</button>`).join("");
}
function selectCategory(c){selected=c;renderFilters();renderProducts();}
function renderProducts(){
  const term=search.value.trim().toLowerCase();
  const list=products.filter(p=>(selected==="All"||p.category===selected)&&
    (p.name.toLowerCase().includes(term)||p.description.toLowerCase().includes(term)));
  if (!products.length) {
    grid.innerHTML = "";
    empty.style.display = "block";
    return;
  }
  grid.innerHTML=list.map(p=>`
    <article class="product reveal visible">
      <div class="product-img"><img src="${p.image}" alt="${p.name}" loading="lazy"><span class="badge">${p.category}</span></div>
      <div class="product-body">
        <h3>${p.name}</h3><div class="description-wrap"><p class="product-desc truncated" id="description-${p.id}">${p.description}</p><button type="button" class="show-more" data-description-id="description-${p.id}" aria-expanded="false" aria-label="See full product description" onclick="toggleProductDescription(this)">See more</button></div>
        <div class="product-bottom"><span class="price">${p.price}</span><span class="stars">${'★'.repeat(Math.round(p.ratingAvg||0)) + '☆'.repeat(Math.max(0,5-Math.round(p.ratingAvg||0)))}${p.ratingCount?(' <small style="color:#666;margin-left:6px">('+p.ratingCount+')</small>'):''}</span></div>
        <button class="btn btn-gold" onclick="orderWhatsApp('${p.name.replaceAll("'","\\'")}')">Order on WhatsApp</button>
      </div>
    </article>`).join("");
  empty.style.display=list.length?"none":"block";
}
function toggleProductDescription(button){
  const description=document.getElementById(button.dataset.descriptionId);
  if(!description) return;
  const expanded=description.classList.toggle('expanded');
  description.classList.toggle('truncated', !expanded);
  button.textContent=expanded?'See less':'See more';
  button.setAttribute('aria-expanded', String(expanded));
  button.setAttribute('aria-label', expanded?'Collapse product description':'See full product description');
}
function renderGallery(){
  const galleryEl = document.getElementById('galleryGrid');
  if(!galleryEl) return;
  if(!products || products.length === 0){
    galleryEl.innerHTML = '<p style="color:var(--gray)">No gallery items to show.</p>';
    return;
  }
  const placeholderSvg = encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400'><rect fill='%23f3efe9' width='100%' height='100%'/><text x='50%' y='50%' font-size='20' text-anchor='middle' fill='%23999' dy='.3em'>No image</text></svg>`);
  galleryEl.innerHTML = products.map(p=>{
    const src = p.image && p.image.trim() ? p.image : `data:image/svg+xml;utf8,${placeholderSvg}`;
    const safeName = (p.name||'').replace(/"/g,'');
    return `\n    <div class="gallery-item reveal">\n      <img src="${src}" alt="${safeName}" loading="lazy">\n      <div class="gallery-caption">${safeName}</div>\n    </div>`;
  }).join("");
}
function renderWhy(){
  document.getElementById("whyGrid").innerHTML=why.map(x=>`
    <article class="why-card reveal"><div class="why-icon"><i class="fa-solid ${x[0]}"></i></div>
    <h3>${x[1]}</h3><p>${x[2]}</p></article>`).join("");
}
function orderWhatsApp(productName){
  const message = `Hi! I'm interested in ordering: ${productName}. Can you provide more details?`;
  window.open(`https://wa.me/918310654971?text=${encodeURIComponent(message)}`,'_blank');
}
function scrollToTop(){window.scrollTo({top:0,behavior:"smooth"})}

search.addEventListener("input",renderProducts);
document.getElementById("clearSearch").addEventListener("click",()=>{search.value="";renderProducts();search.focus()});
window.addEventListener("scroll",()=>{
  document.getElementById("topBtn").classList.toggle("show",window.scrollY>300);
  document.getElementById("navbar").style.boxShadow=window.scrollY>10?"0 4px 20px rgba(0,0,0,.09)":"0 2px 15px rgba(0,0,0,.06)";
});
document.getElementById("menuBtn").addEventListener("click",()=>document.getElementById("mobileMenu").classList.toggle("open"));
document.querySelectorAll(".mobile-menu a").forEach(a=>a.addEventListener("click",()=>document.getElementById("mobileMenu").classList.remove("open")));

const observer=new IntersectionObserver(entries=>{
  entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add("visible")});
},{threshold:.12});
function observeReveals(){document.querySelectorAll(".reveal:not(.visible)").forEach(el=>observer.observe(el))}
renderFilters();renderProducts();renderGallery();renderWhy();observeReveals();populateAdminCategorySelect();populateReviewCategorySelect();

// --- New: dynamic API integration for products, reviews, and admin ---
async function fetchProducts(){
  try{
    const res=await fetch('/api/products');
    if(!res.ok) throw new Error('Failed to load');
    const data=await res.json();
    // map API fields to local product shape
    products.length=0;
    data.forEach(p=>products.push({id:p.id,name:p.title,price:p.price?`₹${p.price}`:'₹0',category:p.category||'Misc',description:p.description,image:p.image||''}));
    renderFilters();renderProducts();renderGallery();populateReviewProductSelect();populateAdminCategorySelect();
  }catch(e){
    console.warn('Could not fetch products:',e);
  }
}

async function fetchReviews(){
  try{
    const res=await fetch('/api/reviews');
    if(!res.ok) return;
    const data=await res.json();
    const list=document.getElementById('reviewList');
    list.innerHTML='';
    if(data.length===0) list.innerHTML='<p style="color:var(--gray)">No reviews yet. Be the first to review!</p>';
    data.forEach(r=>{
      const stars='★'.repeat(r.rating||5);
      const name = r.name || 'Anonymous';
      const el=document.createElement('article');
      el.className='review reveal';
      el.innerHTML=`<div class="stars">${stars}</div><p>"${escapeHtml(r.message)}"</p><strong>- ${escapeHtml(name)}</strong>`;
      list.appendChild(el);
    });
    // compute ratings per product and attach to local products
    const ratings = {};
    data.forEach(r=>{
      if(!r.productId) return;
      const id = String(r.productId);
      ratings[id] = ratings[id] || {sum:0,count:0};
      ratings[id].sum += (r.rating||0);
      ratings[id].count += 1;
    });
    products.forEach(p=>{
      const info = ratings[String(p.id)];
      if(info){ p.ratingAvg = +(info.sum / info.count).toFixed(2); p.ratingCount = info.count; }
      else { p.ratingAvg = 0; p.ratingCount = 0; }
    });
    // refresh product list to show ratings
    renderProducts();
    observeReveals();
  }catch(e){console.warn(e)}
}

function escapeHtml(s){return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');}

function populateReviewProductSelect(){
  const sel=document.getElementById('reviewProduct');
  if(!sel) return;
  sel.innerHTML='<option value="">All products</option>' + products.map(p=>`<option value="${p.id}">${p.name}</option>`).join('');
}

function populateReviewCategorySelect(){
  const sel=document.getElementById('reviewCategory');
  if(!sel) return;
  const current=sel.value;
  sel.innerHTML=categories.map(c=>`<option value="${c === 'All' ? '' : c}">${c}</option>`).join('');
  sel.value=current;
}

function populateAdminCategorySelect(){
  const sel = document.getElementById('pCategory');
  if(!sel) return;
  const cur = sel.value || '';
  sel.innerHTML = '<option value="">Select category</option>' + categories.map(c=>`<option value="${c}">${c}</option>`).join('');
  if(cur) sel.value = cur;
}

document.getElementById('reviewForm')?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const name = document.getElementById('reviewName').value.trim();
  const rating = parseInt(document.querySelector('.star-rating input[name="rating"]:checked')?.value,10) || 5;
  const message = document.getElementById('reviewMessage').value.trim();
  const category = document.getElementById('reviewCategory').value || null;
  const productId = document.getElementById('reviewProduct').value || null;
  if(!name || !message){ alert('Please enter your name and message'); return; }
  try{
    const res = await fetch('/api/reviews', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({productId,category,name,rating,message}) });
    if(!res.ok) throw new Error('Failed to submit');
    document.getElementById('reviewName').value = '';
    document.getElementById('reviewMessage').value = '';
    document.getElementById('reviewCategory').value = '';
    document.getElementById('reviewProduct').value = '';
    // uncheck rating radios
    document.querySelectorAll('.star-rating input[name="rating"]').forEach(r=>r.checked=false);
    fetchReviews();
    alert('Thanks! Your review was submitted.');
  } catch(e){ console.warn(e); alert('Could not submit review'); }
});

// Clear review form
document.getElementById('clearReview')?.addEventListener('click', ()=>{
  document.getElementById('reviewName').value='';
  document.getElementById('reviewMessage').value='';
  document.getElementById('reviewCategory').value='';
  document.getElementById('reviewProduct').value='';
  document.querySelectorAll('.star-rating input[name="rating"]').forEach(r=>r.checked=false);
});

// Admin UI
const adminBtn=document.getElementById('adminBtn');
const adminPanel=document.getElementById('adminPanel');

function isAdminAccessAllowed(){
  const urlAdminFlag = new URLSearchParams(window.location.search).get('admin');
  return urlAdminFlag === '1' || urlAdminFlag === 'true';
}

function refreshAdminVisibility(){
  if(!adminBtn) return;
  const allowed = isAdminAccessAllowed();
  adminBtn.style.display = allowed ? 'block' : 'none';
  if(!allowed && adminPanel){
    adminPanel.style.display = 'none';
    adminPanel.classList.remove('admin-fullscreen');
  }
}

refreshAdminVisibility();

adminBtn?.addEventListener('click',()=>{
  if(!isAdminAccessAllowed()) return;
  if(adminPanel){
    adminPanel.style.display = adminPanel.style.display==='block'?'none':'block';
  }
});

document.getElementById('adminLogin')?.addEventListener('click', async ()=>{
  const key=document.getElementById('adminKey').value.trim();
  if(!key) return alert('Enter admin key');
  try{
    const res=await fetch('/api/admin/verify',{headers:{'x-admin-key':key}});
    if(!res.ok) throw new Error('Unauthorized');
    localStorage.setItem('adminKey',key);
    refreshAdminVisibility();
    document.getElementById('adminLoginArea').style.display='none';
    document.getElementById('adminTools').style.display='block';
    // show full-page admin panel
    const panel = document.getElementById('adminPanel');
    if(panel){ panel.style.display='block'; panel.classList.add('admin-fullscreen'); }
    alert('Admin login successful');
  }catch(e){alert('Invalid admin key')}
});

document.getElementById('addProductBtn')?.addEventListener('click', async ()=>{
  const key = localStorage.getItem('adminKey');
  if(!key) return alert('Not authenticated');
  const id = document.getElementById('editingProductId').value || null;
  const title=document.getElementById('pTitle').value.trim();
  const price=parseFloat(document.getElementById('pPrice').value)||0;
  const category=document.getElementById('pCategory').value.trim();
  const image=document.getElementById('pImage').value.trim();
  const description=document.getElementById('pDesc').value.trim();
  if(!title) return alert('Title required');
  try{
    let res;
    if(id){
      res = await fetch(`/api/products/${id}`,{method:'PUT',headers:{'content-type':'application/json','x-admin-key':key},body:JSON.stringify({title,description,price,image,category})});
    } else {
      res = await fetch('/api/products',{method:'POST',headers:{'content-type':'application/json','x-admin-key':key},body:JSON.stringify({title,description,price,image,category})});
    }
    if(!res.ok) throw new Error('Failed');
    const p=await res.json();
    alert(id? 'Product updated':'Product added');
    document.getElementById('pTitle').value='';document.getElementById('pPrice').value='';document.getElementById('pCategory').value='';document.getElementById('pImage').value='';document.getElementById('pDesc').value='';
    document.getElementById('editingProductId').value='';
    document.getElementById('addProductBtn').textContent='Add Product';
    fetchProducts();
    loadAdminProducts();
  }catch(e){console.warn(e);alert('Could not save product')}
});

async function loadAdminProducts(){
  const key = localStorage.getItem('adminKey');
  const wrap=document.getElementById('adminProducts');
  if(!wrap) return;
  try{
    const res=await fetch('/api/products');
    if(!res.ok) throw new Error('Failed to load');
    const data=await res.json();
    if(data.length===0){wrap.innerHTML='<p style="color:var(--gray)">No products yet.</p>';return}
    const localMap = Object.fromEntries(products.map(x=>[String(x.id), x]));
    wrap.innerHTML = data.map(p=>{
      const local = localMap[String(p.id)];
      const ratingHtml = (local && local.ratingCount) ? (" • " + ('★'.repeat(Math.round(local.ratingAvg||0)) + ' ('+local.ratingCount+')')) : '';
      return `
      <div class="admin-product-item" style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f1f1f1">
        <div style="flex:1">
          <strong>${escapeHtml(p.title)}</strong>
          <div style="font-size:.85rem;color:#666">${p.category||''} • ₹${p.price||0}${ratingHtml}</div>
        </div>
        <div style="margin-left:8px">
          <span class="admin-badge">Product</span>
          <button data-id="${p.id}" class="admin-edit btn" style="margin-right:6px">Edit</button>
          <button data-id="${p.id}" class="admin-delete btn" style="background:#ff6b6b;color:white">Delete</button>
        </div>
      </div>
    `}).join('');
    // attach handlers
    wrap.querySelectorAll('.admin-edit').forEach(b=>b.addEventListener('click', ()=>{
      const id=b.getAttribute('data-id');
      const product = data.find(x=>String(x.id)===String(id));
      if(!product) return;
      document.getElementById('editingProductId').value=product.id;
      document.getElementById('pTitle').value=product.title||'';
      document.getElementById('pPrice').value=product.price||'';
      document.getElementById('pCategory').value=product.category||'';
      document.getElementById('pImage').value=product.image||'';
      document.getElementById('pDesc').value=product.description||'';
      document.getElementById('addProductBtn').textContent='Save Changes';
    }));
    wrap.querySelectorAll('.admin-delete').forEach(b=>b.addEventListener('click', async ()=>{
      if(!confirm('Delete this product?')) return;
      const id=b.getAttribute('data-id');
      const key = localStorage.getItem('adminKey');
      try{
        const res=await fetch(`/api/products/${id}`,{method:'DELETE',headers:{'x-admin-key':key}});
        if(!res.ok) throw new Error('Delete failed');
        alert('Product deleted');
        fetchProducts();
        loadAdminProducts();
      }catch(e){console.warn(e);alert('Could not delete')}
    }));
  }catch(e){console.warn(e);wrap.innerHTML='<p style="color:var(--gray)">Could not load products</p>'}
}

async function loadAdminReviews(){
  const wrap = document.getElementById('adminReviews');
  if(!wrap) return;
  const key = localStorage.getItem('adminKey');
  try{
    const res = await fetch('/api/reviews');
    if(!res.ok) throw new Error('Failed to load');
    const data = await res.json();
    if(!data || data.length===0){ wrap.innerHTML = '<p style="color:var(--gray)">No reviews yet.</p>'; return }
    wrap.innerHTML = data.map(r=>`
      <div class="admin-review-item" style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f1f1f1">
        <div style="flex:1">
          <strong>${escapeHtml(r.name||'Anonymous')}</strong>
          <div style="font-size:.85rem;color:#666">${'★'.repeat(r.rating||5)} • ${r.category||'All'}${r.productId?(' • Product ID: '+r.productId):''}</div>
          <div style="margin-top:6px;color:#444">${escapeHtml(r.message)}</div>
        </div>
        <div style="margin-left:8px">
          <span class="admin-badge review-badge">Review</span>
          <button data-id="${r.id}" class="admin-delete-review btn" style="background:#ff6b6b;color:white">Delete</button>
        </div>
      </div>`).join('');
    wrap.querySelectorAll('.admin-delete-review').forEach(b=>b.addEventListener('click', async ()=>{
      if(!confirm('Delete this review?')) return;
      const id = b.getAttribute('data-id');
      try{
        const res = await fetch(`/api/reviews/${id}`,{method:'DELETE',headers:{'x-admin-key':key}});
        if(!res.ok) throw new Error('Delete failed');
        alert('Review deleted');
        loadAdminReviews();
        fetchReviews();
      }catch(e){console.warn(e);alert('Could not delete review')}
    }));
  }catch(e){console.warn(e);wrap.innerHTML='<p style="color:var(--gray)">Could not load reviews</p>'}
}

// call admin load after login
document.getElementById('adminLogin')?.addEventListener('click', ()=>{
  setTimeout(()=>{if(localStorage.getItem('adminKey')){ loadAdminProducts(); loadAdminReviews(); }},300);
});

// Image upload handling in admin
const pImageFile = document.getElementById('pImageFile');
const pImagePreview = document.getElementById('pImagePreview');
if(pImageFile){
  pImageFile.addEventListener('change', async (e)=>{
    const file = e.target.files && e.target.files[0];
    if(!file) return;
    // preview local
    const url = URL.createObjectURL(file);
    pImagePreview.src = url; pImagePreview.style.display = 'block';
    // upload
    const key = localStorage.getItem('adminKey');
    if(!key) return alert('Please login as admin to upload images');
    const fd = new FormData(); fd.append('image', file);
    try{
      const res = await fetch('/api/upload',{method:'POST',headers:{'x-admin-key':key},body:fd});
      if(!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      if(data.url){
        document.getElementById('pImage').value = data.url;
        // revoke local object URL after short delay
        setTimeout(()=>URL.revokeObjectURL(url),2000);
      }
    }catch(err){console.warn(err);alert('Image upload failed')}
  });
}


// init dynamic content
fetchProducts();
fetchReviews();
