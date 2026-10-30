// ==========================================
// BURGER MAKER — FULL GAME SCRIPT (BACKUP #5 RESTORED)
// ==========================================

const INGREDIENTS = {
  'top-bun': { id: 'top-bun', name: 'Top Bun', category: 'bread', price: 0, unlocked: true, image: 'images/top-bun.png' },
  'bottom-bun': { id: 'bottom-bun', name: 'Bottom Bun', category: 'bread', price: 0, unlocked: true, image: 'images/bottom-bun.png' },
  'patty': { id: 'patty', name: 'Patty', category: 'patty', price: 0, unlocked: true, image: 'images/patty.png' },
  'cheese': { id: 'cheese', name: 'Cheese', category: 'protein', price: 0, unlocked: true, image: 'images/cheese.png' },
  'tomato': { id: 'tomato', name: 'Tomato', category: 'vegetables', price: 0, unlocked: true, image: 'images/tomato.png' },
  { id: 'lettuce', name: 'Lettuce', category: 'vegetables', price: 0, unlocked: true, image: 'images/lettuce.png' }
};

const SAUCES = [
  { id: 'ketchup', name: 'Ketchup', color: '#d32f2f' },
  { id: 'mayo', name: 'Mayo', color: '#fff9c4' },
  { id: 'mustard', name: 'Mustard', color: '#fbc02d' }
];

let state = {
  wallet: 100.00,
  selectedSauce: null,
  burgerStack: [],
  uiHidden: false,
  theme: 'dark'
};

document.addEventListener('DOMContentLoaded', () => {
  initUIEvents();
  initOpacityToggle();
  renderWallet();
  renderIngredientsMenu();
  renderSauces();
  renderLayers();
});

// 1. Полупрозрачность панелей по клику на пустое место
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

function renderWallet() {
  const badge = document.getElementById('walletBadge');
  if (badge) badge.textContent = `$${state.wallet.toFixed(2)}`;
}

function renderIngredientsMenu() {
  const menu = document.getElementById('ingredientsMenu');
  if (!menu) return;
  menu.innerHTML = '';

  Object.values(INGREDIENTS).forEach(ing => {
    const card = document.createElement('div');
    card.className = `ingredient-card ${ing.unlocked ? '' : 'disabled'}`;
    card.innerHTML = `
      <div class="ingredient-info-row">
        <img src="${ing.image}" alt="${ing.name}" onerror="this.style.opacity=0.3">
        <span class="ingredient-name">${ing.name}</span>
      </div>
      <span class="ingredient-stock-count">∞</span>
    `;
    card.addEventListener('click', () => {
      if (ing.unlocked) addIngredientToBurger(ing);
    });
    menu.appendChild(card);
  });
}

function renderSauces() {
  const containers = [document.getElementById('desktopSaucesGroup'), document.getElementById('mobileSaucesGroup')];
  containers.forEach(container => {
    if (!container) return;
    container.innerHTML = '';
    SAUCES.forEach(sauce => {
      const chip = document.createElement('div');
      chip.className = 'sauce-chip';
      chip.textContent = sauce.name;
      chip.addEventListener('click', () => {
        state.selectedSauce = state.selectedSauce === sauce.id ? null : sauce.id;
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
    const warning = document.getElementById('limitWarning');
    if (warning) {
      warning.classList.add('show');
      setTimeout(() => warning.classList.remove('show'), 1500);
    }
    return;
  }
  state.burgerStack.push(ing);
  renderLayers();
}

function renderLayers() {
  const title = document.getElementById('layersTitle');
  const list = document.getElementById('layersList');
  const stack = document.getElementById('burgerStack');
  if (!title || !list || !stack) return;

  title.textContent = `Layers (${state.burgerStack.length}/30)`;
  list.innerHTML = '';
  stack.innerHTML = '';

  state.burgerStack.forEach((ing, index) => {
    const layerItem = document.createElement('div');
    layerItem.className = 'layer-item';
    layerItem.innerHTML = `
      <span style="font-size:0.75rem;">${ing.name}</span>
      <div class="layer-controls">
        <button class="btn-control delete" onclick="removeLayer(${index})">✕</button>
      </div>
    `;
    list.appendChild(layerItem);

    const img = document.createElement('img');
    img.className = 'burger-layer-img new-layer';
    img.src = ing.image;
    img.alt = ing.name;
    stack.appendChild(img);
  });
}

function removeLayer(index) {
  state.burgerStack.splice(index, 1);
  renderLayers();
}

function initUIEvents() {
  const toggleBtn = document.getElementById('toggleUiBtn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      state.uiHidden = !state.uiHidden;
      document.body.classList.toggle('ui-hidden', state.uiHidden);
    });
  }

  const squeezeBtn = document.getElementById('squeezeBtn');
  if (squeezeBtn) {
    squeezeBtn.addEventListener('click', () => {
      const imgs = document.querySelectorAll('.burger-layer-img');
      imgs.forEach((img, idx) => {
        img.classList.toggle('squeezed');
        img.style.setProperty('--sq-offset', `${(imgs.length - idx) * 3}px`);
      });
    });
  }

  const eatBtn = document.getElementById('eatBtn');
  if (eatBtn) {
    eatBtn.addEventListener('click', () => {
      const stack = document.getElementById('burgerStack');
      if (state.burgerStack.length === 0 || !stack) return;
      stack.classList.add('eating');
      setTimeout(() => {
        state.burgerStack = [];
        stack.classList.remove('eating');
        renderLayers();
      }, 2000);
    });
  }

  const resetBtn = document.getElementById('resetBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      state.burgerStack = [];
      renderLayers();
    });
  }

  setupModal('openRecipesBtn', 'recipesModal', 'closeRecipesModal');
  setupModal('openShopBtn', 'shopModal', 'closeShopModal');
  setupModal('openAchievementsBtn', 'achievementsModal', 'closeAchievementsModal');
  setupModal('openSettingsBtn', 'settingsModal', 'closeSettingsModal');
}

function setupModal(openId, modalId, closeId) {
  const openBtn = document.getElementById(openId);
  const modalEl = document.getElementById(modalId);
  const closeBtn = document.getElementById(closeId);

  if (openBtn && modalEl) openBtn.addEventListener('click', () => modalEl.classList.add('open'));
  if (closeBtn && modalEl) closeBtn.addEventListener('click', () => modalEl.classList.remove('open'));
  if (modalEl) {
    modalEl.addEventListener('click', (e) => {
      if (e.target === modalEl) modalEl.classList.remove('open');
    });
  }
}
