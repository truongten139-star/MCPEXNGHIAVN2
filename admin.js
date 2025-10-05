const API = '/api';
const keyInput = document.getElementById('keyInput');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const adminControls = document.getElementById('adminControls');
const adminList = document.getElementById('adminList');
const btnNew = document.getElementById('btnNew');
const uploadFile = document.getElementById('uploadFile');
const btnExport = document.getElementById('btnExport');

const LS_ADMIN = 'mcpex_admin';
const ADMIN_KEY = 'mcpex-secret-2025';

let token = null;
let addons = [];
let editing = null;

loginBtn.addEventListener('click', handleLogin);
logoutBtn.addEventListener('click', handleLogout);
btnNew.addEventListener('click', ()=> openForm());
uploadFile.addEventListener('change', handleUpload);
btnExport.addEventListener('click', ()=> { window.location.href = '/api/addons?export=1'; });

async function handleLogin(){
  const key = (keyInput.value || '').trim();
  if (!key) return alert('Nhập key');
  if (key === ADMIN_KEY) {
    localStorage.setItem(LS_ADMIN, key);
    applyAdmin(true);
    loadList();
    alert('Đăng nhập admin thành công');
    keyInput.value = key;
  } else {
    alert('Key sai');
  }
}

function handleLogout(){
  localStorage.removeItem(LS_ADMIN);
  applyAdmin(false);
}

function applyAdmin(ok){
  adminControls.classList.toggle('hidden', !ok);
  logoutBtn.classList.toggle('hidden', !ok);
  loginBtn.classList.toggle('hidden', ok);
  keyInput.disabled = ok;
}

async function loadList(){
  try {
    const res = await fetch('/addons.json', {cache:'no-cache'});
    addons = await res.json();
    renderAdminList();
  } catch(e){ console.error(e); addons = []; renderAdminList(); }
}

function renderAdminList(){
  adminList.innerHTML = '';
  addons.forEach(a=>{
    const el = document.createElement('div'); el.className='card';
    el.innerHTML = `<img src="${a.img||'/assets/fallback.png'}"><h3>${escape(a.title)}</h3><p class="muted">${escape(a.description)}</p><div class="meta"><span class="small">${a.size||''}</span></div><div class="admin-actions"><button class="btn alt edit">Sửa</button> <button class="btn danger del">Xóa</button></div>`;
    el.querySelector('.edit').addEventListener('click', ()=> openForm(a));
    el.querySelector('.del').addEventListener('click', ()=> deleteItem(a.id));
    adminList.appendChild(el);
  });
}

function openForm(a){
  editing = a || null;
  document.getElementById('formModal').classList.remove('hidden');
  document.getElementById('f_title').value = a? a.title : '';
  document.getElementById('f_description').value = a? a.description : '';
  document.getElementById('f_url').value = a? a.url : '';
  document.getElementById('f_img').value = a? a.img : '/assets/fallback.png';
  document.getElementById('f_size').value = a? a.size : '';
  document.getElementById('f_tags').value = a? (a.tags||[]).join(',') : '';
  document.getElementById('deleteBtn').classList.toggle('hidden', !a);
  document.getElementById('saveBtn').onclick = saveForm;
  document.getElementById('deleteBtn').onclick = confirmDelete;
  document.getElementById('closeForm').onclick = ()=> document.getElementById('formModal').classList.add('hidden');
  document.getElementById('cancelBtn').onclick = ()=> document.getElementById('formModal').classList.add('hidden');
}

function saveForm(){
  if (!isAdmin()) return alert('Cần quyền admin');
  const payload = {
    id: editing ? editing.id : generateId(document.getElementById('f_title').value),
    title: document.getElementById('f_title').value.trim(),
    description: document.getElementById('f_description').value.trim(),
    url: document.getElementById('f_url').value.trim(),
    img: document.getElementById('f_img').value.trim() || '/assets/fallback.png',
    size: document.getElementById('f_size').value.trim(),
    tags: document.getElementById('f_tags').value.split(',').map(s=>s.trim()).filter(Boolean)
  };
  // client-side persist to addons.json via fetch to api/addons if available, otherwise local overwrite
  fetch('/api/addons', {
    method: editing ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(r=> {
    if (r.ok) { alert('Saved'); document.getElementById('formModal').classList.add('hidden'); loadList(); }
    else r.json().then(j=> alert(j.message || 'Lỗi lưu'));
  }).catch(()=> {
    // fallback: update local public/addons.json saved in browser by calling client-side file export
    persistLocalClient(payload, editing);
    alert('Saved locally (no API).');
    document.getElementById('formModal').classList.add('hidden');
    loadList();
  });
}

function confirmDelete(){
  if (!isAdmin()) return;
  if (!editing) return;
  if (!confirm('Bạn chắc chắn muốn xóa?')) return;
  fetch('/api/addons?id=' + encodeURIComponent(editing.id), { method: 'DELETE' }).then(r=>{
    if (r.ok) { alert('Đã xóa'); loadList(); document.getElementById('formModal').classList.add('hidden'); }
    else r.json().then(j=> alert(j.message || 'Lỗi xóa'));
  }).catch(()=> {
    // fallback local delete
    removeLocalClient(editing.id);
    alert('Đã xóa (local)');
    loadList();
    document.getElementById('formModal').classList.add('hidden');
  });
}

function handleUpload(e){
  const f = e.target.files[0];
  if (!f) return;
  if (!isAdmin()) return alert('Cần quyền admin');
  const fd = new FormData(); fd.append('file', f);
  fetch('/api/upload', { method: 'POST', body: fd }).then(r=> r.json()).then(j=>{
    if (j.url) alert('Upload OK: ' + j.url);
    else alert('Upload xong. Nếu không, tải file vào /public/addons/');
  }).catch(()=> alert('Upload lỗi'));
}

function deleteItem(id){
  if (!isAdmin()) return alert('Cần quyền admin');
  if (!confirm('Xóa thật không?')) return;
  fetch('/api/addons?id=' + encodeURIComponent(id), { method: 'DELETE' }).then(r=>{
    if (r.ok) loadList(); else alert('Lỗi xóa');
  }).catch(()=> { removeLocalClient(id); loadList(); });
}

function persistLocalClient(item, editingItem){
  const key = 'mcpex_addons';
  let list = JSON.parse(localStorage.getItem(key) || '[]');
  if (editingItem) {
    list = list.map(x => x.id === item.id ? item : x);
  } else {
    list.unshift(item);
  }
  localStorage.setItem(key, JSON.stringify(list));
}

function removeLocalClient(id){
  const key = 'mcpex_addons';
  let list = JSON.parse(localStorage.getItem(key) || '[]');
  list = list.filter(x=>x.id !== id);
  localStorage.setItem(key, JSON.stringify(list));
}

function isAdmin(){ return (localStorage.getItem(LS_ADMIN) || '') === ADMIN_KEY; }
function generateId(title){ return (title||'item').toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9\-]/g,'') + '-' + Date.now(); }
function escape(s=''){ return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]); }
