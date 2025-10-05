const API = '/api';
const PER_PAGE = 8;
let addons = [], filtered = [], page = 1, lastUpdated = null, tags = new Set();

const grid = document.getElementById('grid');
const countEl = document.getElementById('count');
const updatedAtEl = document.getElementById('updatedAt');
const search = document.getElementById('search');
const tagFilter = document.getElementById('tagFilter');
const reloadBtn = document.getElementById('reload');
const prevBtn = document.getElementById('prevPage');
const nextBtn = document.getElementById('nextPage');
const pageInfo = document.getElementById('pageInfo');
const modal = document.getElementById('modal');
const closeModal = document.getElementById('closeModal');
const modalImg = document.getElementById('modalImg');
const modalTitle = document.getElementById('modalTitle');
const modalDesc = document.getElementById('modalDesc');
const modalTags = document.getElementById('modalTags');
const modalDownload = document.getElementById('modalDownload');
const modalSize = document.getElementById('modalSize');

async function fetchAddons(force=false){
  try {
    const res = await fetch('/addons.json', {cache: force ? 'no-store' : 'default'});
    addons = await res.json();
    lastUpdated = new Date().toISOString();
    processAddons();
  } catch(e){
    console.error(e);
    addons = [];
    processAddons();
  }
}

function processAddons(){
  tags = new Set();
  addons.forEach(a => (a.tags||[]).forEach(t=>tags.add(t)));
  populateTags();
  applyFilters();
  countEl.textContent = addons.length;
  updatedAtEl.textContent = formatDate(lastUpdated);
}

function populateTags(){
  tagFilter.innerHTML = '<option value="">Tất cả tag</option>';
  [...tags].sort().forEach(t=>{
    const o = document.createElement('option'); o.value=t; o.textContent=t; tagFilter.appendChild(o);
  });
}

function applyFilters(){
  const q = (search.value||'').toLowerCase().trim();
  const tag = tagFilter.value;
  filtered = addons.filter(a=>{
    const inQ = !q || (a.title||'').toLowerCase().includes(q) || (a.description||'').toLowerCase().includes(q) || (a.tags||[]).join(' ').toLowerCase().includes(q);
    const inTag = !tag || (a.tags||[]).includes(tag);
    return inQ && inTag;
  });
  page = 1;
  renderPage();
}

function renderPage(){
  grid.innerHTML = '';
  const total = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  pageInfo.textContent = `${page} / ${total}`;
  prevBtn.disabled = page<=1;
  nextBtn.disabled = page>=total;
  const start = (page-1)*PER_PAGE;
  const items = filtered.slice(start, start+PER_PAGE);
  if (!items.length){ document.getElementById('empty').classList.remove('hidden'); return; }
  document.getElementById('empty').classList.add('hidden');
  items.forEach(a=>{
    const el = document.createElement('div'); el.className='card';
    el.innerHTML = `<img loading="lazy" src="${a.img||'/assets/fallback.png'}" alt="${escape(a.title)}"><h3>${escape(a.title)}</h3><p class="muted">${escape(a.description)}</p><div class="meta"><a class="btn primary" href="${a.url}" target="_blank" rel="noreferrer" onclick="recordDownload('${a.id}')">Tải về</a><span class="small">${a.size||''}</span></div>`;
    el.addEventListener('click', (e)=>{ if (e.target.tagName==='A') return; openModal(a); });
    grid.appendChild(el);
  });
}

function openModal(a){
  modalImg.src = a.img||'/assets/fallback.png';
  modalTitle.textContent = a.title;
  modalDesc.textContent = a.description;
  modalTags.innerHTML = (a.tags||[]).map(t=>`<span class="tag">${escape(t)}</span>`).join(' ');
  modalDownload.href = a.url;
  modalSize.textContent = a.size||'';
  modal.classList.remove('hidden');
}

function closeModalFn(){ modal.classList.add('hidden'); }
closeModal.addEventListener('click', closeModalFn);
search.addEventListener('input', debounce(applyFilters,220));
tagFilter.addEventListener('change', applyFilters);
reloadBtn.addEventListener('click', ()=>fetchAddons(true));
prevBtn.addEventListener('click', ()=>{ if (page>1) page--; renderPage(); });
nextBtn.addEventListener('click', ()=>{ const total=Math.max(1,Math.ceil(filtered.length/PER_PAGE)); if (page<total) page++; renderPage(); });

function recordDownload(id){
  navigator.sendBeacon('/api/stats', JSON.stringify({type:'download', id}));
}

function escape(s=''){ return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]); }
function debounce(fn,ms){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); }; }
function formatDate(iso){ try{ return new Date(iso).toLocaleString(); }catch(e){ return iso; } }

fetchAddons();
