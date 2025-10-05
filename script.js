const ENDPOINT = '/addons.json';
const grid = document.getElementById('grid');
const empty = document.getElementById('empty');
const searchInput = document.getElementById('search');
const refreshBtn = document.getElementById('refresh');

const modal = document.getElementById('modal');
const modalImg = document.getElementById('modalImg');
const modalTitle = document.getElementById('modalTitle');
const modalDesc = document.getElementById('modalDesc');
const modalDownload = document.getElementById('modalDownload');
const closeModalBtn = document.getElementById('closeModal');
const modalCloseBtn = document.getElementById('modalCloseBtn');

let addons = [];

async function loadAddons() {
  try {
    const res = await fetch(ENDPOINT, {cache: 'no-store'});
    if (!res.ok) throw new Error('Không tải được dữ liệu');
    addons = await res.json();
    renderGrid(addons);
  } catch (e) {
    console.error(e);
    addons = [];
    renderGrid([]);
  }
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
      <img src="${a.img || '/assets/fallback.png'}" alt="${escapeHtml(a.title)}" />
      <h3>${escapeHtml(a.title)}</h3>
      <p>${escapeHtml(a.description)}</p>
      <div class="meta">
        <a class="btn" href="${a.url || '#'}" target="_blank" rel="noreferrer">Tải về</a>
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
  modalDownload.href = a.url || '#';
  modal.classList.remove('hidden');
}
function closeModal(){
  modal.classList.add('hidden');
}
closeModalBtn.addEventListener('click', closeModal);
modalCloseBtn.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

function escapeHtml(s=''){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]); }

searchInput.addEventListener('input', (e) => {
  const q = e.target.value.trim().toLowerCase();
  if (!q) return renderGrid(addons);
  const filtered = addons.filter(a => {
    return (a.title||'').toLowerCase().includes(q) || (a.description||'').toLowerCase().includes(q) || (a.tags||'').toString().toLowerCase().includes(q);
  });
  renderGrid(filtered);
});

refreshBtn.addEventListener('click', () => loadAddons());

loadAddons(); 
