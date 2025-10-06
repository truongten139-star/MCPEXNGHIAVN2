const ENDPOINT = '/addons.json';
const PER_PAGE = 8;
const LS_KEY = 'mcpex_addons';
const LS_ADMIN = 'mcpex_admin';
const ADMIN_KEY = 'mcpex-secret-2025';

const grid = document.getElementById('grid');
const empty = document.getElementById('empty');
const searchEl = document.getElementById('search');
const tabFilter = document.getElementById('tabFilter');
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
const modalCreated = document.getElementById('modalCreated');
const modalDownload = document.getElementById('modalDownload');
const closeModalBtn = document.getElementById('closeModal');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const menuAdminKey = document.getElementById('menuAdminKey');
const menuLoginBtn = document.getElementById('menuLoginBtn');
const tabs = document.querySelectorAll('.tab');

let addons = [];
let filtered = [];
let currentPage = 1;
let lastUpdated = null;
let tagsSet = new Set();

(function init(){
  bindEvents();
  const saved = localStorage.getItem(LS_KEY);
  if (saved) {
    try { addons = JSON.parse(saved); } catch(e) { addons = []; }
    lastUpdated = localStorage.getItem(LS_KEY + '_updated') || new Date().toISOString();
    postLoad();
  } else {
    fetchAddons();
  }
  const savedKey = localStorage.getItem(LS_ADMIN);
  if (savedKey) menuAdminKey.value = savedKey;
})();

function bindEvents(){
  if (searchEl) searchEl.addEventListener('input', debounce(applyFilters,220));
  if (reloadBtn) reloadBtn.addEventListener('click', ()=> fetchAddons(true));
  if (prevPageBtn) prevPageBtn.addEventListener('click', prevPage);
  if (nextPageBtn) nextPageBtn.addEventListener('click', nextPage);
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
  if (modal) modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
  if (menuLoginBtn) menuLoginBtn.addEventListener('click', handleMenuLogin);
  tabs.forEach(t => t.addEventListener('click', ()=> {
    tabs.forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    const f = t.dataset.filter || '';
    if (tabFilter) tabFilter.value = f;
    applyFilters();
  }));
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
  if (countEl) countEl.textContent = addons.length;
  if (updatedAtEl) updatedAtEl.textContent = formatDate(lastUpdated);
}

function collectTags(list){
  tagsSet.clear();
  list.forEach(a => (a.tags||[]).forEach(t => tagsSet.add(t)));
  populateTabFilter();
}

function populateTabFilter(){
  const sel = document.getElementById('tabFilter');
  if (!sel) return;
  sel.innerHTML = '<option value="">Tất cả</option>';
  Array.from(tagsSet).sort().forEach(t => {
    const opt = document.createElement('option');
    opt.value = t; opt.textContent = t;
    sel.appendChild(opt);
  });
}

function applyFilters(){
  const q = (searchEl && searchEl.value || '').trim().toLowerCase();
  const tag = (tabFilter && tabFilter.value) || '';
  filtered = addons
