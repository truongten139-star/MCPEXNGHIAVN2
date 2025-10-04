fetch('mods.json')
  .then(res => res.json())
  .then(data => {
    const list = document.getElementById('mod-list');
    list.innerHTML = '';

    if (data.length === 0) {
      list.innerHTML = '<p class="empty">Hiện chưa có bài viết nào.</p>';
      return;
    }

    data.forEach(mod => {
      const card = document.createElement('div');
      card.className = 'mod-card';
      card.innerHTML = `
        <img src="${mod.image}" alt="${mod.title}">
        <div class="info">
          <h3>${mod.title}</h3>
          <p>${mod.description}</p>
          <a href="${mod.link}" target="_blank">Tải về</a>
        </div>
      `;
      list.appendChild(card);
    });
  })
  .catch(err => console.error('Không thể tải mods.json:', err));