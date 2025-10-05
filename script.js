const ENDPOINT = '/addons.json';
const PER_PAGE = 8;
const LS_KEY = 'mcpex_addons';
const LS_ADMIN = 'mcpex_admin';
const ADMIN_KEY = 'mcpex-secret-2025';

// Elements
const grid = document.getElementById('grid');
const empty = document.getElementById('empty');
const searchEl = document.getElementById('search');
const tabFilter = document.getElementById('tabFilter');
const clearFilters = document.getElementById('clearFilters');
const reloadBtn = document.getElementById('reload');
const countEl = document.getElementById('count');
const updatedAtEl = document.getElementById('updatedAt');
const pageInfo = document.getElementById('pageInfo');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const modal = document.getElementById('modal');
const modalImg = document.getElementById('modalImg');
const modalTitle = document.getElementById('modalTitle');
const modalDesc = document.getElementById('modalDesc');
const modalTags = document.getElementById('modalTags');
const modalSize = document.getElementById('modalSize');
const modalDownload = document.getElementById('modalDownload');
const closeModalBtn = document.getElementById('closeModal');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const menuAdminKey = document.getElementById('menuAdminKey');
const menuLoginBtn = document.getElementById('menuLoginBtn');

let addons = [];
let filtered = [];
let currentPage = 1;
let lastUpdated = null;
let tagsSet = new Set();

// Init
(function init(){
  bindEvents();
  const saved = localStorage.getItem(LS_KEY);
  if (saved) {
    addons = JSON.parse(saved);
    lastUpdated = localStorage.getItem(LS_KEY + '_updated') || new Date().toISOString();
    postLoad();
  } else {
    fetchAddons();
  }
  const savedKey = localStorage.getItem(LS_ADMIN);
  if (savedKey) {
    menuAdminKey.value = savedKey;
  }
})();

function bindEvents(){
  searchEl.addEventListener('input', debounce(applyFilters,220));
  tabFilter.addEventListener('change', applyFilters);
  clearFilters.addEventListener('click', ()=>{ searchEl.value=''; tabFilter.value=''; applyFilters(); });
  reloadBtn.addEventListener('click', ()=> fetchAddons(true));
  prevPageBtn.addEventListener('click', prevPage);
  nextPageBtn.addEventListener('click', nextPage);
  closeModalBtn.addEventListener('click', closeModal);
  modalCloseBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
  menuLoginBtn.addEventListener('click', handleMenuLogin);
}

async function fetchAddons(force=false){
  try {
    const res = await fetch(ENDPOINT, {cache: force ? 'no-store' : 'no-cache'});
    if (!res.ok) throw new Error('Fetch failed');
    addons = await res.json();
    lastUpdated = new Date().toISOString();
    localStorage.setItem(LS_KEY, JSON.stringify(addons));
    localStorage.setItem(LS_KEY + '_updated', lastUpdated);
    postLoad();
  } catch(e){
    console.error(e);
    const ls = localStorage.getItem(LS_KEY);
    addons = ls ? JSON.parse(ls) : [];
    lastUpdated = localStorage.getItem(LS_KEY + '_updated') || new Date().toISOString();
    postLoad();
  }
}

function postLoad(){
  collectTags(addons);
  applyFilters();
  countEl.textContent = addons.length;
  updatedAtEl.textContent = formatDate(lastUpdated);
}

function collectTags(list){
  tagsSet.clear();
  list.forEach(a => (a.tags||[]).forEach(t => tagsSet.add(t)));
  populateTabFilter();
}

function populateTabFilter(){
  tabFilter.innerHTML = '<option value="">Tất cả</option>';
  Array.from(tagsSet).sort().forEach(t => {
    const opt = document.createElement('option');
    opt.value = t; opt.textContent = t;
    tabFilter.appendChild(opt);
  });
}

function applyFilters(){
  const q = (searchEl.value || '').trim().toLowerCase();
  const tag = tabFilter.value;
  filtered = addons.filter(a => {
    const inQuery = !q || ((a.title||'').toLowerCase().includes(q) || (a.description||'').toLowerCase().includes(q) || (a.tags||[]).join(' ').toLowerCase().includes(q));
    const inTag = !tag || (a.tags||[]).includes(tag);
    return inQuery && inTag;
  });
  currentPage = 1;
  renderPage();
}

function renderPage(){
  const total = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const start = (currentPage - 1) * PER_PAGE;
  const pageItems = filtered.slice(start, start + PER_PAGE);
  pageInfo.textContent = `${currentPage} / ${total}`;
  prevPageBtn.disabled = currentPage <= 1;
  nextPageBtn.disabled = currentPage >= total;
  renderGrid(pageItems);
}

function renderGrid(list){
  grid.innerHTML = '';
  if (!list.length) { empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');
  list.forEach(a => {
    const el = document.createElement('article');
    el.className = 'card';
    el.innerHTML = `
      <div class="thumb"><img loading="lazy" src="${a.img || '/assets/fallback.png'}" alt="${escapeHtml(a.title)}" /></div>
      <h3>${escapeHtml(a.title)}</h3>
      <p class="muted">${escapeHtml(a.description)}</p>
      <div class="meta">
        <div><a class="btn primary" href="${a.url || '#'}" target="_blank" rel="noreferrer" data-id="${a.id}">Tải về</a></div>
        <div class="small">${a.size || ''}</div>
      </div>
    `;
    el.querySelector('a')?.addEventListener('click', (e)=> { e.stopPropagation(); recordDownload(a.id); });
    el.addEventListener('click', (e)=> {
      if (e.target.tagName.toLowerCase() === 'a') return;
      openModal(a);
    });
    grid.appendChild(el);
  });
}

function openModal(a){
  modalImg.src = a.img || '/assets/fallback.png';
  modalTitle.textContent = a.title || 'Không có tiêu đề';
  modalDesc.textContent = a.description || '';
  modalTags.innerHTML = (a.tags||[]).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join(' ');
  modalSize.textContent = a.size || '';
  modalDownload.href = a.url || '#';
  modal.classList.remove('hidden');
}

function closeModal(){ modal.classList.add('hidden'); }

function prevPage(){ if (currentPage>1){ currentPage--; renderPage(); window.scrollTo({top:200,behavior:'smooth'}); } }
function nextPage(){ const total = Math.max(1, Math.ceil(filtered.length / PER_PAGE)); if (currentPage<total){ currentPage++; renderPage(); window.scrollTo({top:200,behavior:'smooth'}); } }

function handleMenuLogin(){
  const v = (menuAdminKey.value || '').trim();
  if (!v) return alert('Nhập key admin');
  if (v === ADMIN_KEY) {
    localStorage.setItem(LS_ADMIN, v);
    alert('Đăng nhập admin thành công. Mở /admin.html để quản lý.');
    menuAdminKey.value = v;
  } else {
    alert('Key sai');
  }
}

function isAdmin(){ return (localStorage.getItem(LS_ADMIN) || '') === ADMIN_KEY; }

function recordDownload(id){
  try {
    navigator.sendBeacon('/api/stats', JSON.stringify({ type: 'download', id }));
  } catch(e){}
}

function escapeHtml(s=''){ return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]); }
function debounce(fn, ms){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); }; }
function formatDate(iso){ try{ const d=new Date(iso); return d.toLocaleString(); }catch(e){ return iso || '—'; } }
