const ENDPOINT = '/addons.json';
const PER_PAGE = 8;

const grid = document.getElementById('grid');
const empty = document.getElementById('empty');
const searchEl = document.getElementById('search');
const tagFilter = document.getElementById('tagFilter');
const clearFilters = document.getElementById('clearFilters');
const countEl = document.getElementById('count');
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

let addons = [];
let filtered = [];
let currentPage = 1;
let tagsSet = new Set();

async function fetchAddons() {
  try {
    const res = await fetch(ENDPOINT, {cache: 'no-store'});
    if (!res.ok) throw new Error('Không tải được dữ liệu');
    addons = await res.json();
    collectTags(addons);
    applyFilters();
  } catch (e) {
    console.error(e);
    addons = [];
    applyFilters();
  }
}

function collectTags(list) {
  tagsSet.clear();
  list.forEach(a => (a.tags||[]).forEach(t => tagsSet.add(t)));
  populateTagFilter();
}

function populateTagFilter() {
  tagFilter.innerHTML = '<option value="">Tất cả tag</option>';
  Array.from(tagsSet).sort().forEach(t => {
    const opt = document.createElement('option');
    opt.value = t; opt.textContent = t;
    tagFilter.appendChild(opt);
  });
}

function applyFilters() {
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

function renderPage() {
  const total = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const start = (currentPage - 1) * PER_PAGE;
  const pageItems = filtered.slice(start, start + PER_PAGE);
  countEl.textContent = filtered.length;
  pageInfo.textContent = `${currentPage} / ${total}`;
  prevPageBtn.disabled = currentPage <= 1;
  nextPageBtn.disabled = currentPage >= total;
  renderGrid(pageItems);
}

function renderGrid(list) {
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
        <a class="btn primary" href="${a.url || '#'}" target="_blank" rel="noreferrer" onclick="event.stopPropagation()">Tải về</a>
        <span class="small">${a.size || ''}</span>
      </div>
    `;
    el.addEventListener('click', (e) => {
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

closeModalBtn.addEventListener('click', closeModal);
modalCloseBtn.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

searchEl.addEventListener('input', debounce(() => applyFilters(), 220));
tagFilter.addEventListener('change', applyFilters);
clearFilters.addEventListener('click', () => { searchEl.value=''; tagFilter.value=''; applyFilters(); });

prevPageBtn.addEventListener('click', () => { if (currentPage>1){ currentPage--; renderPage(); window.scrollTo({top:200,behavior:'smooth'}); }});
nextPageBtn.addEventListener('click', () => { const total = Math.max(1, Math.ceil(filtered.length / PER_PAGE)); if (currentPage<total){ currentPage++; renderPage(); window.scrollTo({top:200,behavior:'smooth'}); }});

function escapeHtml(s=''){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]); }
function debounce(fn, ms){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); }; }

fetchAddons();
