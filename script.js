/* CONFIG */
const ADDONS_JSON_PATH = './addons.json'; // đổi thành GitHub raw nếu cần

/* STATE */
let addons = [];
let isAdmin = false;

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

const ADMIN_KEY_STORAGE = 'mcpex_admin_key';

/* HELPERS */
function el(tag, cls){ const e = document.createElement(tag); if(cls) e.className = cls; return e; }
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
    const thumb = el('div','thumb'); thumb.innerHTML = `<img loading="lazy" src="${item.image||''}" alt="${item.name}">`;
    const h = el('h3'); h.textContent = item.name;
    const p = el('p'); p.textContent = item.description;
    const meta = el('div','meta');
    const left = el('div'); left.style.display='flex'; left.style.gap='8px';
    const link = el('a'); link.href = item.download; link.target = '_blank'; link.rel = 'noopener'; link.textContent = 'Tải'; link.className='btn-ghost';
    const det = el('button'); det.className='btn-ghost'; det.textContent='Chi tiết'; det.addEventListener('click', ()=> openPanel(item));
    left.appendChild(link);
    left.appendChild(det);

    if(item.featured){
      const b = el('div','badge'); b.textContent='Nổi bật';
      meta.appendChild(b);
    }

    meta.appendChild(left);
    card.appendChild(thumb); card.appendChild(h); card.appendChild(p); card.appendChild(meta);

    if(isAdmin){
      const del = el('button'); del.className='btn-ghost'; del.textContent='Xóa';
      del.addEventListener('click', ()=>{
        if(!confirm('Xác nhận xóa: ' + item.name + ' ?')) return;
        addons = addons.filter(a=>a.id !== item.id);
        applyFilters();
        alert('Đã xóa (chỉ cục bộ).');
      });
      meta.appendChild(del);
    }

    grid.appendChild(card);
  });
}

/* FILTER / SORT */
function applyFilters(){
  const qv = (q.value||'').toLowerCase().trim();
  const fv = (filterInput.value||'').toLowerCase().trim();
  const sortVal = sortEl.value || 'featured';
  let filtered = addons.filter(a=>{
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

/* ADMIN */
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

  addons.unshift(item);
  applyFilters();
  aName.value = aDesc.value = aImage.value = aDownload.value = '';
  aFeatured.checked = false;
  alert('Đã thêm addon (chỉ lưu trên trang này)');
});

btnNew.addEventListener('click', ()=>{
  if(!isAdmin){
    alert('Chỉ admin mới được thêm addon. Vui lòng đăng nhập admin.');
    return;
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
  aName.focus();
});

filterButtons.forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('[data-filter]').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const f = btn.dataset.filter;
    if(f === 'featured'){
      filterInput.value = '';
      sortEl.value = 'featured';
    } else if(f === 'recent'){
      filterInput.value = '';
      sortEl.value = 'new';
    } else {
      filterInput.value = '';
      sortEl.value = 'featured';
    }
    applyFilters();
  });
});

let deb;
[q, filterInput, sortEl].forEach(elm=>{
  elm.addEventListener('input', ()=>{ clearTimeout(deb); deb = setTimeout(applyFilters, 200); });
});
sortEl.addEventListener('change', applyFilters);

window.addEventListener('DOMContentLoaded', ()=>{ load(); }); 
