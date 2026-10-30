// ==========================================
// BURGER MAKER — FULL GAME SCRIPT (BACKUP #5 BASELINE)
// ==========================================

// Глобальное состояние игры
const state = {
  wallet: 100.00,
  selectedSauce: null,
  burgerStack: [], // Хранит массив добавленных ингредиентов
  pinnedRecipe: null,
  gameMode: 'casual', // 'sandbox', 'casual', 'turbo'
  orderSpeed: 'no-orders',
  volume: 1,
  theme: 'dark',
  uiHidden: false,
  orderTimer: null,
  orderTimeLeft: 300,
  activeOrder: null
};

// Элементы UI
const elements = {
  walletBadge: document.getElementById('walletBadge'),
  walletWidget: document.getElementById('walletWidget'),
  topOrderWidget: document.getElementById('topOrderWidget'),
  orderStatusText: document.getElementById('orderStatusText'),
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
  downloadPngBtn: document.getElementById('downloadPngBtn'),
  submitOrderBtn: document.getElementById('submitOrderBtn'),

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
});

// ==========================================
// 1. ПОЛУПРОЗРАЧНОСТЬ ПАНЕЛЕЙ ПО КЛИКУ
// ==========================================
function initOpacityToggle() {
  // Вешаем клик на все панели, включая боковые и нижнюю
  const targetPanels = document.querySelectorAll('.panel, .bottom-panel, .wallet-widget, .top-order-widget');

  targetPanels.forEach(panel => {
    panel.addEventListener('click', (e) => {
      // Игнорируем клики по кнопкам, карточкам, переключателям и инпутам
      if (
        e.target.closest('button') ||
        e.target.closest('.ingredient-card') ||
        e.target.closest('.layer-item') ||
        e.target.closest('.sauce-chip') ||
        e.target.closest('input')
      ) {
        return;
      }
      
      // Переключаем класс dimmed
      panel.classList.toggle('dimmed');
    });
  });
}

// ==========================================
// 2. ОБРАБОТКА ИНТЕРФЕЙСА И СОБЫТИЙ
// ==========================================
function initUIEvents() {
  // Кнопка Глаз (для мобильных)
  if (elements.toggleUiBtn) {
    elements.toggleUiBtn.addEventListener('click', () => {
      state.uiHidden = !state.uiHidden;
      document.body.classList.toggle('ui-hidden', state.uiHidden);
    });
  }

  // Сжатие бургера
  if (elements.squeezeBtn) {
    elements.squeezeBtn.addEventListener('click', () => {
      const imgs = document.querySelectorAll('.burger-layer-img');
      imgs.forEach((img, idx) => {
        img.classList.toggle('squeezed');
        img.style.setProperty('--sq-offset', `${(imgs.length - idx) * 3}px`);
      });
    });
  }

  // Съесть бургер
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

  // Очистить бургер (Мусорка)
  if (elements.resetBtn) {
    elements.resetBtn.addEventListener('click', () => {
      state.burgerStack = [];
      renderLayers();
    });
  }

  // Открытие / закрытие модалок
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
// 3. ОБНОВЛЕНИЕ И ОТРЕСОВКА
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
  elements.burgerStackContainer = elements.burgerStack;
  elements.burgerStackContainer.innerHTML = '';

  state.burgerStack.forEach((ing, index) => {
    // Слои в левой панели
    const layerItem = document.createElement('div');
    layerItem.className = 'layer-item';
    layerItem.innerHTML = `
      <span style="font-size:0.75rem;">${ing.name || 'Ingredient'}</span>
      <div class="layer-controls">
        <button class="btn-control delete" onclick="removeLayer(${index})">✕</button>
      </div>
    `;
    elements.layersList.appendChild(layerItem);

    // Изображения бургера в центре
    const img = document.createElement('img');
    img.className = 'burger-layer-img';
    img.src = ing.image || 'images/default.png';
    img.alt = ing.name || 'layer';
    elements.burgerStackContainer.appendChild(img);
  });
}

function removeLayer(index) {
  state.burgerStack.splice(index, 1);
  renderLayers();
}

// Функция смены темы (Dark / Light)
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
