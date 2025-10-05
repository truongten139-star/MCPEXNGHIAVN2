/* MCPEX NGHIA VN — client script
   - All features run client-side.
   - Admin actions persist in localStorage when running as static site.
   - To serve real files, place .mcaddon/.zip into public/addons/
*/

const ENDPOINT = '/addons.json';
const PER_PAGE = 8;
const ADMIN_KEY = 'mcpex-secret-2025'; // default admin key; change if needed

// DOM
const grid = document.getElementById('grid');
const empty = document.getElementById('empty');
const searchEl = document.getElementById('search');
const tagFilter = document.getElementById('tagFilter');
const clearFilters = document.getElementById('clearFilters');
const reloadBtn = document.getElementById('reload');
const countEl = document.getElementById('count');
const updatedAtEl = document.getElementById('updatedAt');
const pageInfo = document.getElementById('pageInfo');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');

const adminKeyInput = document.getElementById('adminKey');
const loginBtn = document.getElementById('loginBtn');
const adminActions = document.getElementById('adminActions');
const addBtn = document.getElementById('addBtn');
const exportBtn = document.getElementById('exportBtn');

const modal = document.getElementById('modal');
const modalImg = document.getElementById('modalImg');
const modalTitle = document.getElementById('modalTitle');
const modalDesc = document.getElementById('modalDesc');
const modalTags = document.getElementById('modalTags');
const modalSize = document.getElementById('modalSize');
const modalDownload = document.getElementById('modalDownload');
const modalUrl = document.getElementById('modalUrl');
const closeModalBtn = document.getElementById('closeModal');
const modalCloseBtn = document.getElementById('modalCloseBtn');

const formModal = document.getElementById('formModal');
const closeForm = document.getElementById('closeForm');
const formTitle = document.getElementById('formTitle');
const f_title = document.getElementById('f_title');
const f_description = document.getElementById('f_description');
const f_url = document.getElementById('f_url');
const f_img = document.getElementById('f_img');
const f_size = document.getElementById('f_size');
const f_tags = document.getElementById('f_tags');
const saveAddon = document.getElementById('saveAddon');
const cancelSave = document.getElementById('cancelSave');
const deleteAddon = document.getElementById('deleteAddon');

let addons = [];
let filtered = [];
let currentPage = 1;
let tagsSet = new Set();
let editingId = null;
let lastUpdated = null;

// Storage keys
const LS_KEY = 'mcpex_addons';
const LS_ADMIN = 'mcpex_admin';

// Init
(function init(){
  const storedKey = localStorage.getItem(LS_ADMIN);
  if (storedKey) {
    adminKeyInput.value = storedKey;
    applyLoginUI(isAdmin());
  }
  bindEvents();
  loadAddons();
})();

function bindEvents(){
  searchEl.addEventListener('input', debounce(() => applyFilters(), 220));
  tagFilter.addEventListener('change', applyFilters);
  clearFilters.addEventListener('click', () => { searchEl.value=''; tagFilter.value=''; applyFilters(); });
  reloadBtn.addEventListener('click', () => loadAddons(true));
  prevPageBtn.addEventListener('click', prevPage);
  nextPageBtn.addEventListener('click', nextPage);
  loginBtn.addEventListener('click', handleLogin);
  addBtn.addEventListener('click', () => openFormModal());
  exportBtn.addEventListener('click', exportJSON);

  closeModalBtn.addEventListener('click', closeModal);
  modalCloseBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e)=> { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); closeFormModal(); } });

  closeForm.addEventListener('click', closeFormModal);
  cancelSave.addEventListener('click', closeFormModal);
  saveAddon.addEventListener('click', saveForm);
  deleteAddon.addEventListener('click', confirmDelete);
}

async function loadAddons(force=false){
  try {
    // If user previously saved edits in localStorage, prefer that
    if (!force) {
      const ls = localStorage.getItem(LS_KEY);
      if (ls) {
        addons = JSON.parse(ls);
        lastUpdated = localStorage.getItem(LS_KEY + '_updated') || new Date().toISOString();
        postLoad();
        return;
      }
    }

    const res = await fetch(ENDPOINT, {cache: 'no-store'});
    if (!res.ok) throw new Error('Không tải được addons.json');
    const data = await res.json();
    // Merge with local edits if exist
    const ls = localStorage.getItem(LS_KEY);
    if (ls) {
      const local = JSON.parse(ls);
      // prefer local edited items by id
      const mapLocal = new Map(local.map(x=>[x.id,x]));
      const merged = data.map(d => mapLocal.get(d.id) || d);
      // include local-only items
      local.forEach(l => { if (!merged.find(m=>m.id===l.id)) merged.push(l); });
      addons = merged;
    } else {
      addons = data;
    }
    lastUpdated = new Date().toISOString();
    postLoad();
  } catch (e) {
    console.error(e);
    // fallback to localStorage or empty
    const ls = localStorage.getItem(LS_KEY);
    if (ls) {
      addons = JSON.parse(ls);
      lastUpdated = localStorage.getItem(LS_KEY + '_updated') || new Date().toISOString();
    } else {
      addons = [];
    }
    postLoad();
  }
}

function postLoad(){
  collectTags(addons);
  applyFilters();
  countEl.textContent = addons.length;
  updatedAtEl.textContent = formatDate(lastUpdated);
  // persist a snapshot
  localStorage.setItem(LS_KEY, JSON.stringify(addons));
  localStorage.setItem(LS_KEY + '_updated', lastUpdated);
}

function collectTags(list){
  tagsSet.clear();
  list.forEach(a => (a.tags||[]).forEach(t => tagsSet.add(t)));
  populateTagFilter();
}

function populateTagFilter(){
  tagFilter.innerHTML = '<option value="">Tất cả tag</option>';
  Array.from(tagsSet).sort().forEach(t => {
    const opt = document.createElement('option');
    opt.value = t; opt.textContent = t;
    tagFilter.appendChild(opt);
  });
}

function applyFilters(){
  const q = (searchEl.value || '').trim().toLowerCase();
  const tag = tagFilter.value;
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
  if (!list.length) {
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  list.forEach(a => {
    const el = document.createElement('article');
    el.className = 'card';
    el.innerHTML = `
      <div class="thumb"><img loading="lazy" src="${a.img || '/assets/fallback.png'}" alt="${escapeHtml(a.title)}" /></div>
      <h3>${escapeHtml(a.title)}</h3>
      <p>${escapeHtml(a.description)}</p>
      <div class="meta">
        <div><a class="btn primary" href="${a.url || '#'}" target="_blank" rel="noreferrer" onclick="event.stopPropagation()">Tải về</a></div>
        <div class="small">${a.size || ''}</div>
      </div>
    `;
    // admin controls in card
    if (isAdmin()) {
      const ctrl = document.createElement('div');
      ctrl.style.marginTop = '8px';
      ctrl.innerHTML = `<button class="btn alt small editBtn">Sửa</button> <button class="btn danger small delBtn">Xóa</button>`;
      ctrl.querySelector('.editBtn').addEventListener('click', (e)=> { e.stopPropagation(); openFormModal(a.id); });
      ctrl.querySelector('.delBtn').addEventListener('click', (e)=> { e.stopPropagation(); openFormModal(a.id, true); });
      el.appendChild(ctrl);
    }

    el.addEventListener('click', (e)=> {
      if (e.target.tagName.toLowerCase() === 'a' || e.target.closest('button')) return;
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
  modalUrl.textContent = a.url ? '' : '';
  modal.classList.remove('hidden');
}

function closeModal(){ modal.classList.add('hidden'); }

function prevPage(){ if (currentPage>1){ currentPage--; renderPage(); window.scrollTo({top:200,behavior:'smooth'}); } }
function nextPage(){ const total = Math.max(1, Math.ceil(filtered.length / PER_PAGE)); if (currentPage<total){ currentPage++; renderPage(); window.scrollTo({top:200,behavior:'smooth'}); } }

function isAdmin(){
  return (localStorage.getItem(LS_ADMIN) || '') === ADMIN_KEY;
}

function handleLogin(){
  const v = (adminKeyInput.value || '').trim();
  if (!v) { alert('Nhập key trước'); return; }
  if (v === ADMIN_KEY) {
    localStorage.setItem(LS_ADMIN, v);
    applyLoginUI(true);
    alert('Đăng nhập admin thành công');
  } else {
    localStorage.removeItem(LS_ADMIN);
    applyLoginUI(false);
    alert('Key sai');
  }
}

function applyLoginUI(admin){
  if (admin) {
    adminActions.classList.remove('hidden');
    adminKeyInput.value = ADMIN_KEY;
  } else {
    adminActions.classList.add('hidden');
  }
  // re-render grid to show admin buttons
  renderPage();
}

function openFormModal(id=null, deleteMode=false){
  editingId = id;
  if (!id) {
    formTitle.textContent = 'Thêm addon';
    f_title.value = ''; f_description.value=''; f_url.value=''; f_img.value='/assets/fallback.png'; f_size.value=''; f_tags.value='';
    deleteAddon.classList.add('hidden');
  } else {
    const item = addons.find(x=>x.id===id);
    if (!item) return;
    formTitle.textContent = deleteMode ? 'Xóa addon' : 'Sửa addon';
    f_title.value = item.title || '';
    f_description.value = item.description || '';
    f_url.value = item.url || '';
    f_img.value = item.img || '/assets/fallback.png';
    f_size.value = item.size || '';
    f_tags.value = (item.tags||[]).join(',');
    deleteAddon.classList.toggle('hidden', !deleteMode);
  }
  formModal.classList.remove('hidden');
}

function closeFormModal(){ formModal.classList.add('hidden'); editingId = null; deleteAddon.classList.add('hidden'); }

function saveForm(){
  if (!isAdmin()) { alert('Cần quyền admin'); closeFormModal(); return; }
  const title = f_title.value.trim();
  if (!title) { alert('Tiêu đề không thể trống'); return; }
  const obj = {
    id: editingId || generateId(title),
    title,
    description: f_description.value.trim(),
    url: f_url.value.trim(),
    img: f_img.value.trim() || '/assets/fallback.png',
    size: f_size.value.trim(),
    tags: f_tags.value.split(',').map(s=>s.trim()).filter(Boolean)
  };
  if (editingId) {
    // update
    const idx = addons.findIndex(x=>x.id===editingId);
    if (idx>=0) addons[idx] = obj;
  } else {
    addons.unshift(obj);
  }
  lastUpdated = new Date().toISOString();
  persistLocal();
  postLoad();
  closeFormModal();
}

function confirmDelete(){
  if (!isAdmin()) return;
  if (!editingId) return;
  if (!confirm('Bạn chắc chắn muốn xóa addon này?')) return;
  addons = addons.filter(x=>x.id !== editingId);
  lastUpdated = new Date().toISOString();
  persistLocal();
  postLoad();
  closeFormModal();
}

function persistLocal(){
  localStorage.setItem(LS_KEY, JSON.stringify(addons));
  localStorage.setItem(LS_KEY + '_updated', lastUpdated);
}

function exportJSON(){
  const blob = new Blob([JSON.stringify(addons, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'addons-export.json';
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

function generateId(title){
  return (title || 'item').toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9\-]/g,'') + '-' + Math.floor(Math.random()*9000+1000);
}

function escapeHtml(s=''){ return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]); }
function debounce(fn, ms){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); }; }
function formatDate(iso){ try{ const d=new Date(iso); return d.toLocaleString(); }catch(e){ return iso || '—'; } }

// initial small helper to load admin UI state
(function postInit(){ if (isAdmin()) applyLoginUI(true); })(); 
