/* CONFIG */
const ADDONS_JSON_PATH = 'https://raw.githubusercontent.com/truongten139-star/MCPEXNGHIAVN2/main/addons.json'; // đổi nếu cần
const ADMIN_KEY_STORAGE = 'mcpex_admin_key';

/* STATE */
let addons = [], filtered = [], isAdmin = false;

/* DOM */
const grid = document.getElementById('grid');
const q = document.getElementById('q');
const countEl = document.getElementById('count');
const sortEl = document.getElementById('sort');
const filterButtons = document.querySelectorAll('[data-filter]');
const filterInput = document.getElementById('filterInput');
const panel = document.getElementById('panel');
const panelClose = document.getElementById('panelClose');
const panelImg = document.getElementById('panelImg');
const pTitle = document.getElementById('pTitle');
const pDesc = document.getElementById('pDesc');
const pDownload = document.getElementById('pDownload');
const pBadge = document.getElementById('pBadge');
const pMeta = document.getElementById('pMeta');
const pCopy = document.getElementById('pCopy');
const adminKey = document.getElementById('adminKey');
const btnAdminLogin = document.getElementById('btnAdminLogin');
const adminPanel = document.getElementById('adminPanel');
const btnAdd = document.getElementById('btnAdd');
const btnNew = document.getElementById('btnNew');
const aName = document.getElementById('aName');
const aImage = document.getElementById('aImage');
const aDesc = document.getElementById('aDesc');
const aDownload = document.getElementById('aDownload');
const aFeatured = document.getElementById('aFeatured');

/* HELPERS */
function el(tag, cls){ const e = document.createElement(tag); if(cls) e.className = cls; return e; }
function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function fmtDate(iso){ try{ return new Date(iso).toLocaleString('vi-VN'); }catch(e){return iso||'';} }

/* LOAD DATA */
async function load(){
  try{
    const res = await fetch(ADDONS_JSON_PATH, {cache:'no-store'});
    if(!res.ok) throw new Error('Fetch failed ' + res.status);
    const data = await res.json();
    addons = (Array.isArray(data) ? data : []).map((a,i)=>({
      id: a.id || ('a'+(Date.now()+i)),
      name: a.name || 'Không có tên',
      description: a.description || '',
      image: a.image || '',
      download: a.download || '#',
      featured: !!a.featured,
      createdAt: a.createdAt || new Date().toISOString()
    }));
    // restore admin presence
    const saved = localStorage.getItem(ADMIN_KEY_STORAGE);
    if(saved){ isAdmin = true; adminPanel.style.display = 'block'; }
    applyFilters();
  }catch(err){
    console.error(err);
    grid.innerHTML = '<div style="padding:18px;color:#f6e6ff">Không thể tải dữ liệu. Kiểm tra đường dẫn JSON hoặc CORS.</div>';
  }
}

/* RENDER */
function render(list){
  grid.innerHTML = '';
  if(!list.length){ grid.innerHTML = '<div style="padding:18px;color:#d6b3ff">Không tìm thấy addon</div>'; countEl.textContent = 0; return; }
  countEl.textContent = list.length;
  list.forEach(item=>{
    const card = el('article','card');
    const thumb = el('div','thumb'); thumb.innerHTML = `<img loading="lazy" src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}">`;
    const h = el('h3'); h.textContent = item.name;
    const p = el('p'); p.textContent = item.description;
    const meta = el('div','meta');
    const link = el('a'); link.href = item.download; link.target = '_blank'; link.rel = 'noopener'; link.textContent = 'Tải'; link.className='btn-ghost';
    const right = el('div'); right.style.display='flex'; right.style.gap='8px';
    const det = el('button'); det.className='btn-ghost'; det.textContent='Chi tiết'; det.addEventListener('click', ()=> openPanel(item));
    right.appendChild(det);

    if(item.featured){
      const b = el('div','badge'); b.textContent='Nổi bật'; meta.appendChild(b);
    }

    meta.appendChild(link); meta.appendChild(right);
    card.appendChild(thumb); card.appendChild(h); card.appendChild(p); card.appendChild(meta);

    if(isAdmin){
      const del = el('button'); del.className='btn-ghost'; del.textContent='Xóa';
      del.addEventListener('click', ()=>{
        if(!confirm('Xác nhận xóa: ' + item.name + ' ?')) return;
        addons = addons.filter(a=>a.id !== item.id);
        applyFilters();
        alert('Đã xóa (chỉ cục bộ).');
      });
      right.appendChild(del);
    }

    grid.appendChild(card);
  });
}

/* FILTER / SORT */
function applyFilters(){
  const qv = (q.value||'').toLowerCase().trim();
  const fv = (filterInput.value||'').toLowerCase().trim();
  const sortVal = sortEl.value || 'featured';
  filtered = addons.filter(a=>{
    if(qv && !(a.name.toLowerCase().includes(qv) || a.description.toLowerCase().includes(qv))) return false;
    if(fv && !(a.name.toLowerCase().includes(fv) || a.description.toLowerCase().includes(fv))) return false;
    return true;
  });
  if(sortVal === 'featured'){
    filtered.sort((x,y)=> (y.featured - x.featured) || (new Date(y.createdAt) - new Date(x.createdAt)));
  } else if(sortVal === 'new'){
    filtered.sort((x,y)=> new Date(y.createdAt) - new Date(x.createdAt));
  } else if(sortVal === 'name'){
    filtered.sort((x,y)=> x.name.localeCompare(y.name,'vi'));
  }
  render(filtered);
}

/* PANEL */
function openPanel(item){
  panelImg.src = item.image || '';
  pTitle.textContent = item.name;
  pDesc.textContent = item.description;
  pDownload.href = item.download || '#';
  pBadge.style.display = item.featured ? 'inline-block' : 'none';
  pMeta.textContent = 'Ngày: ' + fmtDate(item.createdAt);
  panel.hidden = false;
  panel.classList.add('open');
  panelClose.focus();
}
function closePanel(){ panel.classList.remove('open'); setTimeout(()=> panel.hidden = true, 280); }
panelClose.addEventListener('click', closePanel);
document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') closePanel(); });
pCopy.addEventListener('click', ()=>{
  const url = pDownload.href;
  navigator.clipboard?.writeText(url).then(()=> alert('Đã sao chép link tải')).catch(()=> alert('Không thể sao chép'));
});

/* ADMIN (nhập key => lưu localStorage) */
btnAdminLogin.addEventListener('click', ()=>{
  const inputKey = adminKey.value.trim();
  if(!inputKey){ alert('Vui lòng nhập key'); return; }
  localStorage.setItem(ADMIN_KEY_STORAGE, inputKey);
  isAdmin = true;
  adminPanel.style.display = 'block';
  adminKey.value = '';
  applyFilters();
  alert('Đăng nhập admin thành công (key được lưu cục bộ)');
});

/* Thêm addon cục bộ */
btnAdd.addEventListener('click', ()=>{
  const savedKey = localStorage.getItem(ADMIN_KEY_STORAGE);
  if(!savedKey){ alert('Bạn chưa đăng nhập admin'); return; }

  const name = aName.value.trim();
  const desc = aDesc.value.trim();
  const image = aImage.value.trim();
  const download = aDownload.value.trim();
  const featured = !!aFeatured.checked;

  if(!name || !desc){ alert('Vui lòng điền tên và mô tả'); return; }

  const item = {
    id: 'a' + Date.now(),
    name,
    description: desc,
    image,
    download: download || '#',
    featured,
    createdAt: new Date().toISOString()
  };

  // thêm ở đầu
  addons.unshift(item);
  applyFilters();
  // clear form
  aName.value = aDesc.value = aImage.value = aDownload.value = '';
  aFeatured.checked = false;
  alert('Đã thêm addon (chỉ lưu trên trang này)');
});

/* Quick open add form */
btnNew.addEventListener('click', ()=>{
  if(!isAdmin){
    alert('Chỉ admin mới được thêm addon. Vui lòng đăng nhập admin.');
    return;
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
  aName.focus();
});

/* FILTER BUTTONS */
filterButtons.forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('[data-filter]').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const f = btn.dataset.filter;
    if(f === 'featured'){
      filterInput.value = 'featured:1';
    } else if(f === 'recent'){
      sortEl.value = 'new';
    } else {
      // all
      filterInput.value = '';
      sortEl.value = 'featured';
    }
    applyFilters();
  });
});

/* INPUT EVENTS (debounce lightweight) */
let deb;
[q, filterInput, sortEl].forEach(elm=>{
  elm.addEventListener('input', ()=>{ clearTimeout(deb); deb = setTimeout(applyFilters, 200); });
});
sortEl.addEventListener('change', applyFilters);

/* BOOT */
window.addEventListener('DOMContentLoaded', ()=>{ load(); });
