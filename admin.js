const API = '/api';
const keyInput = document.getElementById('keyInput');
const loginBtn = document.getElementById('loginBtn');
const adminControls = document.getElementById('adminControls');
const adminList = document.getElementById('adminList');
const btnNew = document.getElementById('btnNew');
const uploadFile = document.getElementById('uploadFile');
const btnExport = document.getElementById('btnExport');

let token = null;
let addons = [];

loginBtn.addEventListener('click', async ()=>{
  const key = (keyInput.value||'').trim();
  if (!key) return alert('Nhập key');
  const res = await fetch('/api/auth', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({key})});
  const data = await res.json();
  if (res.ok){ token = data.token; applyAdmin(true); loadList(); alert('Login OK'); } else { alert(data.message||'Key sai'); applyAdmin(false); }
});

function applyAdmin(ok){
  adminControls.classList.toggle('hidden', !ok);
}

async function loadList(){
  const res = await fetch('/api/addons', {headers: token?{Authorization:'Bearer '+token}:{}}); addons = await res.json();
  renderAdminList();
}

function renderAdminList(){
  adminList.innerHTML = '';
  addons.forEach(a=>{
    const el = document.createElement('div'); el.className='card';
    el.innerHTML = `<img src="${a.img}"><h3>${escape(a.title)}</h3><p class="muted">${escape(a.description)}</p><div class="meta"><span class="small">${a.size||''}</span></div><div class="admin-controls"><button class="edit">Sửa</button><button class="del">Xóa</button></div>`;
    el.querySelector('.edit').addEventListener('click', ()=>openForm(a));
    el.querySelector('.del').addEventListener('click', ()=>deleteItem(a.id));
    adminList.appendChild(el);
  });
}

btnNew.addEventListener('click', ()=>openForm());
uploadFile.addEventListener('change', async (e)=>{
  const f = e.target.files[0]; if (!f) return;
  const fd = new FormData(); fd.append('file', f);
  const res = await fetch('/api/upload', {method:'POST', body:fd, headers: token?{Authorization:'Bearer '+token}:{}}); const data = await res.json();
  if (res.ok) alert('Upload xong: '+data.url); else alert('Upload lỗi');
});

btnExport.addEventListener('click', ()=>{ window.location.href='/api/addons?export=1'; });

async function openForm(a){
  // opens form modal and handles save
  const fm = document.getElementById('formModal'); fm.classList.remove('hidden');
  document.getElementById('f_title').value = a? a.title:''; document.getElementById('f_description').value = a? a.description:''; document.getElementById('f_url').value = a? a.url:''; document.getElementById('f_img').value = a? a.img:''; document.getElementById('f_size').value = a? a.size:''; document.getElementById('f_tags').value = a? (a.tags||[]).join(','):'';
  document.getElementById('deleteBtn').classList.toggle('hidden', !a);
  document.getElementById('saveBtn').onclick = async ()=>{
    const payload = {
      id: a? a.id: undefined,
      title: document.getElementById('f_title').value,
      description: document.getElementById('f_description').value,
      url: document.getElementById('f_url').value,
      img: document.getElementById('f_img').value,
      size: document.getElementById('f_size').value,
      tags: document.getElementById('f_tags').value.split(',').map(s=>s.trim()).filter(Boolean)
    };
    const method = a? 'PUT':'POST';
    const res = await fetch('/api/addons', {method, headers:{'Content-Type':'application/json', Authorization: token? 'Bearer '+token: ''}, body:JSON.stringify(payload)});
    if (res.ok){ alert('Saved'); loadList(); document.getElementById('formModal').classList.add('hidden'); } else { alert('Lỗi lưu'); }
  };
  document.getElementById('deleteBtn').onclick = async ()=>{
    if (!confirm('Xóa thật không?')) return;
    const res = await fetch('/api/addons?id='+a.id, {method:'DELETE', headers:{Authorization: token? 'Bearer '+token: ''}});
    if (res.ok){ alert('Đã xóa'); loadList(); document.getElementById('formModal').classList.add('hidden'); } else alert('Lỗi xóa');
  };
  document.getElementById('closeForm').onclick = ()=> document.getElementById('formModal').classList.add('hidden');
  document.getElementById('cancelBtn').onclick = ()=> document.getElementById('formModal').classList.add('hidden');
}

async function deleteItem(id){
  if (!confirm('Xóa thật không?')) return;
  const res = await fetch('/api/addons?id='+id, {method:'DELETE', headers:{Authorization: token? 'Bearer '+token: ''}});
  if (res.ok) loadList(); else alert('Lỗi');
}

function escape(s=''){ return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]); }