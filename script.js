document.addEventListener('DOMContentLoaded', () => {
  let currentBurger = JSON.parse(localStorage.getItem('saved_burger_stack')) || [];
  let isEating = false;
  let isSqueezed = false;

  const INGREDIENTS = [
    { id: 'top-bun', name: 'Top Bun', image: 'images/top-bun.png' },
    { id: 'cheese', name: 'Cheese', image: 'images/cheese.png' },
    { id: 'beef-patty', name: 'Beef Patty', image: 'images/beef-patty.png' },
    { id: 'bottom-bun', name: 'Bottom Bun', image: 'images/bottom-bun.png' }
  ];

  const SAUCES = [
    { id: 'mayo', name: '⚪️ Mayo', image: 'images/sauce-mayo.png' },
    { id: 'ketchup', name: '🔴 Ketchup', image: 'images/sauce-ketchup.png' }
  ];

  function renderIngredientsMenu() {
    const menu = document.getElementById('ingredientsMenu');
    if (!menu) return;
    menu.innerHTML = '';
    INGREDIENTS.forEach(item => {
      const card = document.createElement('div');
      card.className = `ingredient-card ${isEating ? 'disabled' : ''}`;
      card.innerHTML = `
        <img src="${item.image}" alt="${item.name}">
        <div class="ingredient-info-row">
          <span class="ingredient-name">${item.name}</span>
          <span class="ingredient-stock-count">∞</span>
        </div>`;
      card.onclick = () => { if (!isEating) addIngredient(item); };
      menu.appendChild(card);
    });
  }

  function renderSauces() {
    const group = document.getElementById('desktopSaucesGroup');
    if (!group) return;
    group.innerHTML = '';
    SAUCES.forEach(sauce => {
      const chip = document.createElement('div');
      chip.className = 'sauce-chip';
      chip.innerText = sauce.name;
      chip.onclick = () => { if (!isEating) addIngredient(sauce); };
      group.appendChild(chip);
    });
  }

  window.setTheme = function(theme) {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
      document.getElementById('themeDarkBtn').classList.remove('active');
      document.getElementById('themeLightBtn').classList.add('active');
    } else {
      document.body.classList.remove('light-theme');
      document.getElementById('themeLightBtn').classList.remove('active');
      document.getElementById('themeDarkBtn').classList.add('active');
    }
  }

  const settingsModal = document.getElementById('settingsModal');
  document.getElementById('openSettingsBtn').onclick = () => settingsModal.classList.add('open');
  document.getElementById('closeSettingsModal').onclick = () => settingsModal.classList.remove('open');

  function updateBurgerDisplay() {
    localStorage.setItem('saved_burger_stack', JSON.stringify(currentBurger));
    document.getElementById('layersTitle').innerText = `Layers (${currentBurger.length}/30)`;

    const layersList = document.getElementById('layersList');
    layersList.innerHTML = '';
    currentBurger.forEach((item, index) => {
      const listItem = document.createElement('div');
      listItem.className = 'layer-item';
      listItem.innerHTML = `
        <img src="${item.image}" class="layer-preview">
        <div class="layer-controls">
          <button class="btn-control" onclick="moveLayer(${index}, 1)">▲</button>
          <button class="btn-control" onclick="moveLayer(${index}, -1)">▼</button>
          <button class="btn-control delete" onclick="removeLayer(${index})">✕</button>
        </div>
      `;
      layersList.appendChild(listItem);
    });

    const burgerStack = document.getElementById('burgerStack');
    burgerStack.innerHTML = '';
    currentBurger.forEach((item, index) => {
      const img = document.createElement('img');
      img.src = item.image;
      img.className = 'burger-layer-img';
      img.style.marginBottom = index === 0 ? '-10px' : '-38px';
      img.style.zIndex = index + 1;
      if (isSqueezed && index > 0) {
        img.style.setProperty('--sq-offset', `${index * 6}px`);
        img.classList.add('squeezed');
      }
      burgerStack.appendChild(img);
    });
  }

  function addIngredient(item) {
    if (currentBurger.length >= 30) return;
    currentBurger.push({ ...item });
    updateBurgerDisplay();
  }

  window.removeLayer = function(index) {
    if (isEating) return;
    currentBurger.splice(index, 1);
    updateBurgerDisplay();
  };

  window.moveLayer = function(index, direction) {
    if (isEating) return;
    const target = index + direction;
    if (target >= 0 && target < currentBurger.length) {
      const temp = currentBurger[index];
      currentBurger[index] = currentBurger[target];
      currentBurger[target] = temp;
      updateBurgerDisplay();
    }
  };

  document.getElementById('squeezeBtn').onclick = () => {
    if (currentBurger.length <= 1) return;
    isSqueezed = !isSqueezed;
    updateBurgerDisplay();
  };

  document.getElementById('resetBtn').onclick = () => {
    currentBurger = [];
    isSqueezed = false;
    updateBurgerDisplay();
  };

  document.getElementById('eatBtn').onclick = () => {
    if (currentBurger.length === 0 || isEating) return;
    isEating = true;
    document.getElementById('burgerStack').classList.add('eating');
    setTimeout(() => {
      currentBurger = [];
      document.getElementById('burgerStack').classList.remove('eating');
      isEating = false;
      updateBurgerDisplay();
    }, 2000);
  };

  renderIngredientsMenu();
  renderSauces();
  updateBurgerDisplay();
});
