// ==========================================
// BURGER MAKER — FULL GAME SCRIPT (BACKUP #5 BASELINE)
// ==========================================

// Пример данных ингредиентов (если у тебя в проекте свой массив, замени или оставь этот)
const INGREDIENTS_DATA = [
  { id: 'top_bun', name: 'Top Bun', type: 'bread', image: 'images/top_bun.png', price: 1.5 },
  { id: 'bottom_bun', name: 'Bottom Bun', type: 'bread', image: 'images/bottom_bun.png', price: 1.0 },
  { id: 'beef_patty', name: 'Beef Patty', type: 'patty', image: 'images/patty.png', price: 2.5 },
  { id: 'cheese', name: 'Cheese', type: 'protein', image: 'images/cheese.png', price: 0.8 },
  { id: 'tomato', name: 'Tomato', type: 'vegetables', image: 'images/tomato.png', price: 0.5 },
  { id: 'lettuce', name: 'Lettuce', type: 'vegetables', image: 'images/lettuce.png', price: 0.3 }
];

const SAUCES_DATA = [
  { id: 'ketchup', name: 'Ketchup' },
  { id: 'mayo', name: 'Mayo' },
  { id: 'mustard', name: 'Mustard' }
];

// Глобальное состояние игры
const state = {
  wallet: 100.00,
  selectedSauce: null,
  burgerStack: [], // Хранит массив добавленных ингредиентов
  pinnedRecipe: null,
  gameMode: 'casual',
  orderSpeed: 'no-orders',
  volume: 1,
  theme: 'dark',
  uiHidden: false
};

// Элементы UI
const elements = {
  walletBadge: document.getElementById('walletBadge'),
  burgerStack: document.getElementById('burgerStack'),
  layersTitle: document.getElementById('layersTitle'),
  layersList: document.getElementById('layersList'),
  ingredientsMenu: document.getElementById('ingredientsMenu'),
  limitWarning: document.getElementById('limitWarning'),
  desktopSaucesGroup: document.getElementById('desktopSaucesGroup'),
  mobileSaucesGroup: document.getElementById('mobileSaucesGroup'),
  toggleUiBtn: document.getElementById('toggleUiBtn'),
  
  // Кнопки действий
  squeezeBtn: document.getElementById('squeezeBtn'),
  eatBtn: document.getElementById('eatBtn'),
  resetBtn: document.getElementById('resetBtn'),

  // Модалки
  recipesModal: document.getElementById('recipesModal'),
  shopModal: document.getElementById('shopModal'),
  achievementsModal: document.getElementById('achievementsModal'),
  settingsModal: document.getElementById('settingsModal'),
  
  openRecipesBtn: document.getElementById('openRecipesBtn'),
  openShopBtn: document.getElementById('openShopBtn'),
  openAchievementsBtn: document.getElementById('openAchievementsBtn'),
  openSettingsBtn: document.getElementById('openSettingsBtn'),
  
  closeRecipesModal: document.getElementById('closeRecipesModal'),
  closeShopModal: document.getElementById('closeShopModal'),
  closeAchievementsModal: document.getElementById('closeAchievementsModal'),
  closeSettingsModal: document.getElementById('closeSettingsModal')
};

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  initUIEvents();
  initOpacityToggle();
  renderWallet();
  renderLayers();
  renderIngredientsMenu();
  renderSauces();
});

// ==========================================
// 1. ПОЛУПРОЗРАЧНОСТЬ ПАНЕЛЕЙ ПО КЛИКУ
// ==========================================
function initOpacityToggle() {
  const targetPanels = document.querySelectorAll('.panel, .bottom-panel, .wallet-widget, .top-order-widget');

  targetPanels.forEach(panel => {
    panel.addEventListener('click', (e) => {
      if (
        e.target.closest('button') ||
        e.target.closest('.ingredient-card') ||
        e.target.closest('.layer-item') ||
        e.target.closest('.sauce-chip') ||
        e.target.closest('input')
      ) {
        return;
      }
      panel.classList.toggle('dimmed');
    });
  });
}

// ==========================================
// 2. РЕНДЕР ИНГРЕДИЕНТОВ И СОУСОВ
// ==========================================
function renderIngredientsMenu() {
  if (!elements.ingredientsMenu) return;
  elements.ingredientsMenu.innerHTML = '';

  INGREDIENTS_DATA.forEach(ing => {
    const card = document.createElement('div');
    card.className = 'ingredient-card';
    card.innerHTML = `
      <div class="ingredient-info-row">
        <img src="${ing.image}" alt="${ing.name}">
        <span class="ingredient-name">${ing.name}</span>
      </div>
      <span class="ingredient-stock-count">∞</span>
    `;
    card.addEventListener('click', () => {
      addIngredientToBurger(ing);
    });
    elements.ingredientsMenu.appendChild(card);
  });
}

function renderSauces() {
  const containers = [elements.desktopSaucesGroup, elements.mobileSaucesGroup];
  containers.forEach(container => {
    if (!container) return;
    container.innerHTML = '';
    SAUCES_DATA.forEach(sauce => {
      const chip = document.createElement('div');
      chip.className = 'sauce-chip';
      chip.textContent = sauce.name;
      chip.addEventListener('click', () => {
        state.selectedSauce = state.selectedSauce === sauce.id ? null : sauce.id;
        // Подсветка выбранного соуса
        containers.forEach(c => {
          c.querySelectorAll('.sauce-chip').forEach(el => {
            el.style.borderColor = el.textContent === sauce.name && state.selectedSauce ? 'var(--accent-color)' : '';
          });
        });
      });
      container.appendChild(chip);
    });
  });
}

function addIngredientToBurger(ing) {
  if (state.burgerStack.length >= 30) {
    if (elements.limitWarning) {
      elements.limitWarning.classList.add('show');
      setTimeout(() => elements.limitWarning.classList.remove('show'), 1500);
    }
    return;
  }
  state.burgerStack.push(ing);
  renderLayers();
}

// ==========================================
// 3. ОБРАБОТКА ИНТЕРФЕЙСА И СОБЫТИЙ
// ==========================================
function initUIEvents() {
  if (elements.toggleUiBtn) {
    elements.toggleUiBtn.addEventListener('click', () => {
      state.uiHidden = !state.uiHidden;
      document.body.classList.toggle('ui-hidden', state.uiHidden);
    });
  }

  if (elements.squeezeBtn) {
    elements.squeezeBtn.addEventListener('click', () => {
      const imgs = document.querySelectorAll('.burger-layer-img');
      imgs.forEach((img, idx) => {
        img.classList.toggle('squeezed');
        img.style.setProperty('--sq-offset', `${(imgs.length - idx) * 3}px`);
      });
    });
  }

  if (elements.eatBtn) {
    elements.eatBtn.addEventListener('click', () => {
      if (state.burgerStack.length === 0) return;
      elements.burgerStack.classList.add('eating');
      setTimeout(() => {
        state.burgerStack = [];
        elements.burgerStack.classList.remove('eating');
        renderLayers();
      }, 2000);
    });
  }

  if (elements.resetBtn) {
    elements.resetBtn.addEventListener('click', () => {
      state.burgerStack = [];
      renderLayers();
    });
  }

  setupModal(elements.openRecipesBtn, elements.recipesModal, elements.closeRecipesModal);
  setupModal(elements.openShopBtn, elements.shopModal, elements.closeShopModal);
  setupModal(elements.openAchievementsBtn, elements.achievementsModal, elements.closeAchievementsModal);
  setupModal(elements.openSettingsBtn, elements.settingsModal, elements.closeSettingsModal);
}

function setupModal(openBtn, modalEl, closeBtn) {
  if (openBtn && modalEl) {
    openBtn.addEventListener('click', () => modalEl.classList.add('open'));
  }
  if (closeBtn && modalEl) {
    closeBtn.addEventListener('click', () => modalEl.classList.remove('open'));
  }
  if (modalEl) {
    modalEl.addEventListener('click', (e) => {
      if (e.target === modalEl) modalEl.classList.remove('open');
    });
  }
}

// ==========================================
// 4. ОБНОВЛЕНИЕ И ОТРЕСОВКА БУРГЕРА
// ==========================================
function renderWallet() {
  if (elements.walletBadge) {
    elements.walletBadge.textContent = `$${state.wallet.toFixed(2)}`;
  }
}

function renderLayers() {
  if (!elements.layersTitle || !elements.layersList || !elements.burgerStack) return;

  elements.layersTitle.textContent = `Layers (${state.burgerStack.length}/30)`;
  elements.layersList.innerHTML = '';
  elements.burgerStack.innerHTML = '';

  state.burgerStack.forEach((ing, index) => {
    const layerItem = document.createElement('div');
    layerItem.className = 'layer-item';
    layerItem.innerHTML = `
      <span style="font-size:0.75rem;">${ing.name}</span>
      <div class="layer-controls">
        <button class="btn-control delete" onclick="removeLayer(${index})">✕</button>
      </div>
    `;
    elements.layersList.appendChild(layerItem);

    const img = document.createElement('img');
    img.className = 'burger-layer-img new-layer';
    img.src = ing.image;
    img.alt = ing.name;
    elements.burgerStack.appendChild(img);
  });
}

function removeLayer(index) {
  state.burgerStack.splice(index, 1);
  renderLayers();
}

function setTheme(themeName) {
  state.theme = themeName;
  if (themeName === 'light') {
    document.body.classList.add('light-theme');
    document.getElementById('themeLightBtn')?.classList.add('active');
    document.getElementById('themeDarkBtn')?.classList.remove('active');
  } else {
    document.body.classList.remove('light-theme');
    document.getElementById('themeDarkBtn')?.classList.add('active');
    document.getElementById('themeLightBtn')?.classList.remove('active');
  }
}
