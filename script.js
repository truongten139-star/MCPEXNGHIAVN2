async function fetchAddons() {
  const res = await fetch('/addons.json');
  const data = await res.json();
  return data;
}

function createCard(addon) {
  const div = document.createElement('div');
  div.className = 'card';
  div.innerHTML = `
    <img src="${addon.img}" alt="${addon.title}" />
    <h3>${addon.title}</h3>
    <p>${addon.description}</p>
    <a href="${addon.url}" class="btn">Tải về</a>
  `;
  return div;
}

document.addEventListener('DOMContentLoaded', async () => {
  const list = document.getElementById('list');
  const addons = await fetchAddons();
  addons.forEach(addon => list.appendChild(createCard(addon)));
});
