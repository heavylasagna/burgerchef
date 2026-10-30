document.addEventListener('DOMContentLoaded', () => {
  function safeAudio(path) {
    try {
      const a = new Audio(path);
      a.onerror = () => {};
      return a;
    } catch(e) {
      return null;
    }
  }

  const SOUNDS = {
    eating: safeAudio('audio/eating.mp3'),
    sauce: safeAudio('audio/sauce.mp3'),
    ingridients: safeAudio('audio/ingridients.mp3'),
    buttons: safeAudio('audio/buttons.mp3'),
    squeeze: safeAudio('audio/squeeze.mp3'),
    achievement: safeAudio('audio/achievement.mp3'),
    buy: safeAudio('audio/buy.mp3'),
    order: safeAudio('audio/order.mp3'),
    complete: safeAudio('audio/complete.mp3'),
    bin: safeAudio('audio/bin.mp3'),
    wrongOrder: safeAudio('audio/wrong-order.mp3'),
    cheeseburger: safeAudio('audio/cheeseburger.mp3'),
    tomatonator: safeAudio('audio/tomatonator.mp3'),
    lilypad: safeAudio('audio/lilypad.mp3'),
    saturnBurger: safeAudio('audio/saturn-burger.mp3'),
    bustanator: safeAudio('audio/bustanator.mp3'),
    mcPicklePounder: safeAudio('audio/mc-pickle-pounder.mp3')
  };

  // DOM Элементы
  const leftPanel = document.getElementById('leftPanel');
  const rightPanel = document.getElementById('rightPanel');
  const bottomPanel = document.getElementById('bottomPanel');
  const ingredientsMenu = document.getElementById('ingredientsMenu');
  const desktopSaucesGroup = document.getElementById('desktopSaucesGroup');
  const mobileSaucesGroup = document.getElementById('mobileSaucesGroup');
  const burgerStack = document.getElementById('burgerStack');
  const layersList = document.getElementById('layersList');
  const layersTitle = document.getElementById('layersTitle');
  const centerStage = document.getElementById('centerStage');
  const limitWarning = document.getElementById('limitWarning');

  const MAX_INGREDIENTS = 30;
  let currentBurger = JSON.parse(localStorage.getItem('saved_burger_stack')) || [];
  let isEating = false;
  let isSqueezed = false;
  let isAddingInProgress = false;

  let playerMoney = parseFloat(localStorage.getItem('burger_money'));
  if (isNaN(playerMoney)) playerMoney = 100.00;

  const ITEM_PRICES = {
    'bottom-bun': 2, 'top-bun': 2,
    'beef-patty': 5, 'chicken-patty': 4, 'fish-patty': 4, 'fried-bacon': 3, 'fried-egg': 2,
    'cheese': 3, 'hashbrown': 3, 'champignons': 3,
    'lettuce': 1, 'tomato': 1, 'pickles': 1, 'red-onion': 1, 'white-onion': 1,
    'mayo': 2, 'ketchup': 2, 'mustard': 2, 'spicy': 2, 'bbq': 2
  };

  let ingredientStock = JSON.parse(localStorage.getItem('burger_ingredient_stock')) || {
    'bottom-bun': 20, 'top-bun': 20,
    'beef-patty': 15, 'chicken-patty': 15, 'fish-patty': 15, 'fried-bacon': 10, 'fried-egg': 10,
    'cheese': 15, 'hashbrown': 10, 'champignons': 10,
    'lettuce': 20, 'tomato': 20, 'pickles': 20, 'red-onion': 15, 'white-onion': 15,
    'mayo': 30, 'ketchup': 30, 'mustard': 30, 'spicy': 30, 'bbq': 30
  };

  let currentGameMode = localStorage.getItem('burger_game_mode') || 'casual';

  let modeSpeeds = JSON.parse(localStorage.getItem('burger_mode_speeds')) || {
    'sandbox': 'no-orders',
    'casual': 'no-orders'
  };

  let unlockedAchievements = JSON.parse(localStorage.getItem('unlocked_achievements')) || {};
  let pinnedBurger = JSON.parse(localStorage.getItem('pinned_burger')) || null;
  let currentActiveOrder = JSON.parse(localStorage.getItem('current_active_order')) || null;
  
  let timeUntilNextOrder = parseInt(localStorage.getItem('time_until_next_order'), 10);
  if (isNaN(timeUntilNextOrder)) timeUntilNextOrder = 120;
  let currentTurboTimeLeft = 180;

  // ==========================================
  // ПОЛУПРОЗРАЧНОСТЬ ПАНЕЛЕЙ ПО КЛИКУ НА СВОБОДНОЕ МЕСТО
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
          e.target.closest('input') ||
          e.target.closest('.recipe-card') ||
          e.target.closest('.shop-item-card')
        ) {
          return;
        }
        panel.classList.toggle('dimmed');
      });
    });
  }
  initOpacityToggle();

  function getCurrentSpeed() {
    if (currentGameMode === 'turbo') return 'turbo-fixed';
    return modeSpeeds[currentGameMode] || 'no-orders';
  }

  function saveStock() {
    localStorage.setItem('burger_ingredient_stock', JSON.stringify(ingredientStock));
  }

  function saveBurgerState() {
    localStorage.setItem('saved_burger_stack', JSON.stringify(currentBurger));
  }

  function showMoneyPopup(amount, isPlus) {
    let container = document.getElementById('moneyPopupContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'moneyPopupContainer';
      container.className = 'money-popup-container';
      document.body.appendChild(container);
    }
    const popup = document.createElement('div');
    popup.className = `money-popup ${isPlus ? 'plus' : 'minus'}`;
    popup.innerText = `${isPlus ? '+' : ''}$${amount.toFixed(2)}`;
    container.appendChild(popup);
    setTimeout(() => popup.remove(), 2500);
  }

  function updateMoneyDisplay(changeAmount = null, isPlus = true) {
    const badge = document.getElementById('walletBadge');
    if (!badge) return;

    if (currentGameMode === 'sandbox') {
      badge.innerText = '$∞';
    } else {
      badge.innerText = `$${playerMoney.toFixed(2)}`;
      if (changeAmount !== null && changeAmount !== 0) {
        showMoneyPopup(changeAmount, isPlus);
      }
    }
    localStorage.setItem('burger_money', playerMoney);
  }

  const INGREDIENTS = [
    { id: 'top-bun', name: 'Top Bun', image: 'images/top-bun.png' },
    { id: 'cheese', name: 'Cheese', image: 'images/cheese.png' },
    { id: 'fried-egg', name: 'Fried Egg', image: 'images/fried-egg.png' },
    { id: 'champignons', name: 'Champignons', image: 'images/champignons.png' },
    { id: 'fried-bacon', name: 'Fried Bacon', image: 'images/fried-bacon.png' },
    { id: 'lettuce', name: 'Lettuce', image: 'images/lettuce.png' },
    { id: 'tomato', name: 'Tomato', image: 'images/tomato.png' },
    { id: 'pickles', name: 'Pickles', image: 'images/pickles.png' },
    { id: 'red-onion', name: 'Red Onion', image: 'images/red-onion.png' },
    { id: 'white-onion', name: 'White Onion', image: 'images/white-onion.png' },
    { id: 'hashbrown', name: 'Hashbrown', image: 'images/hashbrown.png' },
    { id: 'beef-patty', name: 'Beef Patty', image: 'images/beef-patty.png' },
    { id: 'chicken-patty', name: 'Chicken Patty', image: 'images/chicken-patty.png' },
    { id: 'fish-patty', name: 'Fish Patty', image: 'images/fish-patty.png' },
    { id: 'bottom-bun', name: 'Bottom Bun', image: 'images/bottom-bun.png' }
  ];

  const SAUCES = [
    { id: 'mayo', name: '⚪️ Mayo', image: 'images/sauce-mayo.png' },
    { id: 'ketchup', name: '🔴 Ketchup', image: 'images/sauce-ketchup.png' },
    { id: 'mustard', name: '🟡 Mustard', image: 'images/sauce-mustard.png' },
    { id: 'spicy', name: '🟠 Spicy', image: 'images/sauce-spicy.png' },
    { id: 'bbq', name: '🟤 BBQ', image: 'images/sauce-bbq.png' }
  ];

  function renderIngredientsMenu() {
    if (!ingredientsMenu) return;
    ingredientsMenu.innerHTML = '';
    INGREDIENTS.forEach(item => {
      const card = document.createElement('div');
      const stock = ingredientStock[item.id] ?? 0;
      const isOut = currentGameMode !== 'sandbox' && stock <= 0;

      card.className = `ingredient-card ${currentBurger.length >= MAX_INGREDIENTS || isEating || isOut ? 'disabled' : ''}`;
      
      let infoHtml = `<img src="${item.image}" alt="${item.name}">`;
      const countText = currentGameMode === 'sandbox' ? '∞' : `x${stock}`;
      infoHtml += `
        <div class="ingredient-info-row">
          <span class="ingredient-name" title="${item.name}">${item.name}</span>
          <span class="ingredient-stock-count">${countText}</span>
        </div>`;

      card.innerHTML = infoHtml;
      
      card.onclick = () => {
        if (isEating || isAddingInProgress) return;
        if (isOut) { alert(`Out of ${item.name}! Buy more in the shop.`); return; }
        addIngredient(item);
      };
      ingredientsMenu.appendChild(card);
    });
  }

  function renderSauces() {
    if (desktopSaucesGroup) desktopSaucesGroup.innerHTML = '';
    if (mobileSaucesGroup) mobileSaucesGroup.innerHTML = '';
    SAUCES.forEach(sauce => {
      [desktopSaucesGroup, mobileSaucesGroup].forEach(container => {
        if (!container) return;
        const chip = document.createElement('div');
        const stock = ingredientStock[sauce.id] ?? 0;
        const isOut = currentGameMode !== 'sandbox' && stock <= 0;

        chip.className = `sauce-chip ${isOut ? 'disabled' : ''}`;
        chip.innerText = sauce.name;
        
        chip.onclick = () => {
          if (isEating || isAddingInProgress) return;
          if (isOut) { alert(`Out of ${sauce.name}! Buy more in the shop.`); return; }
          addSauce(sauce);
        };
        container.appendChild(chip);
      });
    });
  }

  let volumeLevel = parseFloat(localStorage.getItem('burger_volume'));
  if (isNaN(volumeLevel)) volumeLevel = 1.0;

  const volumeRange = document.getElementById('volumeRange');
  const volumeVal = document.getElementById('volumeVal');
  if (volumeRange) {
    volumeRange.value = volumeLevel * 100;
    volumeVal.innerText = `${volumeRange.value}%`;
    volumeRange.oninput = () => {
      volumeLevel = volumeRange.value / 100;
      volumeVal.innerText = `${volumeRange.value}%`;
      localStorage.setItem('burger_volume', volumeLevel);
    };
  }

  window.setTheme = function(theme) {
    const darkBtn = document.getElementById('themeDarkBtn');
    const lightBtn = document.getElementById('themeLightBtn');
    if (theme === 'light') {
      document.body.classList.add('light-theme');
      if(darkBtn) darkBtn.classList.remove('active');
      if(lightBtn) lightBtn.classList.add('active');
      localStorage.setItem('burger_theme', 'light');
    } else {
      document.body.classList.remove('light-theme');
      if(lightBtn) lightBtn.classList.remove('active');
      if(darkBtn) darkBtn.classList.add('active');
      localStorage.setItem('burger_theme', 'dark');
    }
  }
  setTheme(localStorage.getItem('burger_theme') || 'dark');

  const squeezeBtn = document.getElementById('squeezeBtn');
  const eatBtn = document.getElementById('eatBtn');
  const submitOrderBtn = document.getElementById('submitOrderBtn');

  function updateActionButtonsVisibility() {
    if (squeezeBtn) squeezeBtn.style.display = 'flex';

    const currentSpeed = getCurrentSpeed();
    const isNoOrders = currentSpeed === 'no-orders';
    const isSandboxOrCasual = currentGameMode === 'sandbox' || currentGameMode === 'casual';

    if (eatBtn) {
      if (currentGameMode === 'turbo') {
        eatBtn.style.display = 'none';
      } else if (isSandboxOrCasual) {
        eatBtn.style.display = isNoOrders ? 'flex' : 'none';
      } else {
        eatBtn.style.display = 'flex';
      }
    }

    if (submitOrderBtn) {
      const hasActiveOrders = !isNoOrders && currentActiveOrder !== null;
      submitOrderBtn.style.display = hasActiveOrders ? 'flex' : 'none';
    }
  }

  const modeSandboxBtn = document.getElementById('modeSandboxBtn');
  const modeCasualBtn = document.getElementById('modeCasualBtn');
  const modeTurboBtn = document.getElementById('modeTurboBtn');
  const speedButtonsGrid = document.getElementById('speedButtonsGrid');

  function applyGameMode(mode) {
    const previousMode = currentGameMode;
    currentGameMode = mode;
    localStorage.setItem('burger_game_mode', mode);

    if(modeSandboxBtn) modeSandboxBtn.classList.toggle('active', mode === 'sandbox');
    if(modeCasualBtn) modeCasualBtn.classList.toggle('active', mode === 'casual');
    if(modeTurboBtn) modeTurboBtn.classList.toggle('active', mode === 'turbo');

    const topWidget = document.getElementById('topOrderWidget');
    const speed = getCurrentSpeed();

    if (previousMode !== mode) {
      currentActiveOrder = null;
      localStorage.removeItem('current_active_order');
      if (speed !== 'no-orders') {
        if (mode === 'turbo') {
          currentTurboTimeLeft = 180;
          triggerRandomOrder();
        } else {
          timeUntilNextOrder = getRandomTimeForSpeed(speed);
          localStorage.setItem('time_until_next_order', timeUntilNextOrder);
        }
      }
    }

    if (mode === 'sandbox' || mode === 'casual') {
      if(speedButtonsGrid) speedButtonsGrid.classList.remove('disabled');
      updateSpeedButtonsUI(speed);

      if (speed === 'no-orders') {
        if(topWidget) topWidget.classList.add('hidden');
        currentActiveOrder = null;
        localStorage.removeItem('current_active_order');
      } else {
        if(topWidget) topWidget.classList.remove('hidden');
        if (!currentActiveOrder && previousMode !== mode) {
          timeUntilNextOrder = getRandomTimeForSpeed(speed);
          localStorage.setItem('time_until_next_order', timeUntilNextOrder);
        }
      }
    } else if (mode === 'turbo') {
      if(speedButtonsGrid) speedButtonsGrid.classList.add('disabled');
      if(topWidget) topWidget.classList.remove('hidden');
      currentTurboTimeLeft = 180;
      if (!currentActiveOrder) triggerRandomOrder();
    }

    updateActionButtonsVisibility();
    updateMoneyDisplay();
    renderIngredientsMenu();
    renderSauces();
  }

  if(modeSandboxBtn) modeSandboxBtn.onclick = () => applyGameMode('sandbox');
  if(modeCasualBtn) modeCasualBtn.onclick = () => applyGameMode('casual');
  if(modeTurboBtn) modeTurboBtn.onclick = () => applyGameMode('turbo');

  const speedButtons = document.querySelectorAll('.speed-btn');
  function updateSpeedButtonsUI(speed) {
    speedButtons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-speed') === speed);
    });
  }

  applyGameMode(currentGameMode);

  speedButtons.forEach(btn => {
    btn.onclick = () => {
      if (currentGameMode === 'turbo') return;
      const newSpeed = btn.getAttribute('data-speed');
      
      modeSpeeds[currentGameMode] = newSpeed;
      localStorage.setItem('burger_mode_speeds', JSON.stringify(modeSpeeds));
      updateSpeedButtonsUI(newSpeed);

      const topWidget = document.getElementById('topOrderWidget');

      currentActiveOrder = null;
      localStorage.removeItem('current_active_order');

      if (newSpeed === 'no-orders') {
        if (topWidget) topWidget.classList.add('hidden');
      } else {
        if (topWidget) topWidget.classList.remove('hidden');
        timeUntilNextOrder = getRandomTimeForSpeed(newSpeed);
        localStorage.setItem('time_until_next_order', timeUntilNextOrder);
      }
      updateActionButtonsVisibility();
    };
  });

  function getRandomTimeForSpeed(speed) {
    switch(speed) {
      case 'turbo-fixed': return 0;
      case 'super-fast': return Math.floor(Math.random() * 20) + 10;
      case 'fast': return Math.floor(Math.random() * 30) + 30;
      case 'medium': return Math.floor(Math.random() * 180) + 120;
      case 'slow': return Math.floor(Math.random() * 300) + 300;
      case 'super-slow': return Math.floor(Math.random() * 900) + 900;
      default: return 300;
    }
  }

  const ITEM_IMAGES = {
    'bottom-bun': 'images/bottom-bun.png', 'top-bun': 'images/top-bun.png',
    'beef-patty': 'images/beef-patty.png', 'cheese': 'images/cheese.png',
    'hashbrown': 'images/hashbrown.png', 'fried-egg': 'images/fried-egg.png',
    'champignons': 'images/champignons.png', 'fried-bacon': 'images/fried-bacon.png',
    'lettuce': 'images/lettuce.png', 'tomato': 'images/tomato.png',
    'pickles': 'images/pickles.png', 'red-onion': 'images/red-onion.png',
    'white-onion': 'images/white-onion.png', 'chicken-patty': 'images/chicken-patty.png',
    'fish-patty': 'images/fish-patty.png', 'mayo': 'images/sauce-mayo.png',
    'ketchup': 'images/sauce-ketchup.png', 'mustard': 'images/sauce-mustard.png',
    'spicy': 'images/sauce-spicy.png', 'bbq': 'images/sauce-bbq.png'
  };

  const REGULAR_RECIPES = [
    { name: 'Classic Burger', ids: ['bottom-bun', 'beef-patty', 'top-bun'] },
    { name: 'Cheeseburger', ids: ['bottom-bun', 'beef-patty', 'cheese', 'top-bun'] },
    { name: 'Vegan Burger', ids: ['bottom-bun', 'hashbrown', 'lettuce', 'tomato', 'red-onion', 'top-bun'] },
    { name: 'Juicy Burger', ids: ['bottom-bun', 'mayo', 'chicken-patty', 'cheese', 'tomato', 'ketchup', 'top-bun'] },
    { name: 'Breakfast Burger', ids: ['bottom-bun', 'mayo', 'beef-patty', 'fried-egg', 'fried-bacon', 'top-bun'] },
    { name: 'Mushroom Burger', ids: ['bottom-bun', 'bbq', 'beef-patty', 'champignons', 'top-bun'] },
    { name: 'Chicken Burger', ids: ['bottom-bun', 'chicken-patty', 'mayo', 'pickles', 'top-bun'] },
    { name: 'Double Burger', ids: ['bottom-bun', 'beef-patty', 'cheese', 'beef-patty', 'ketchup', 'top-bun'] },
    { name: 'Chicken Delux', ids: ['bottom-bun', 'mayo', 'chicken-patty', 'cheese', 'tomato', 'lettuce', 'pickles', 'top-bun'] },
    { name: 'Stinky Burger', ids: ['bottom-bun', 'mustard', 'chicken-patty', 'white-onion', 'cheese', 'red-onion', 'mustard', 'top-bun'] },
    { name: 'Fish Burger', ids: ['bottom-bun', 'fish-patty', 'mayo', 'pickles', 'lettuce', 'top-bun'] }
  ];

  const SECRET_ACHIEVEMENTS = [
    { id: 'cheeseburgerAch', title: 'Cheezeburger', desc: 'Ideal Roblox burger', sound: 'cheeseburger', ids: ['bottom-bun', 'beef-patty', 'cheese', 'top-bun'] },
    { id: 'tomatonatorAch', title: 'Tomatonator', desc: 'If you don\'t like tomatoes why you even eat burgers?', sound: 'tomatonator', ids: ['bottom-bun', 'beef-patty', 'cheese', 'tomato', 'tomato', 'tomato', 'top-bun'] },
    { id: 'lilypadAch', title: 'Lilypad', desc: 'Straight from the swamp', sound: 'lilypad', ids: ['bottom-bun', 'beef-patty', 'cheese', 'lettuce', 'lettuce', 'top-bun'] },
    { id: 'saturnBurgerAch', title: 'Saturn Burger', desc: 'Saturn has the most moons of any planet in the solar system.', sound: 'saturnBurger', ids: ['bottom-bun', 'beef-patty', 'white-onion', 'top-bun'] },
    { id: 'bustanatorAch', title: 'Bustanator', desc: 'I know you like this one', sound: 'bustanator', ids: ['bottom-bun', 'beef-patty', 'mayo', 'mayo', 'mayo', 'top-bun'] },
    { id: 'mcPicklePounderAch', title: 'McPickle Pounder', desc: 'You\'re probably the kind of people who would eat a pickle tiramisu', sound: 'mcPicklePounder', ids: ['bottom-bun', 'beef-patty', 'cheese', 'pickles', 'pickles', 'pickles', 'top-bun'] }
  ];

  function unlockAchievement(ach) {
    if (!unlockedAchievements[ach.id]) {
      unlockedAchievements[ach.id] = true;
      localStorage.setItem('unlocked_achievements', JSON.stringify(unlockedAchievements));
      showToast(ach);
      playSound(SOUNDS[ach.sound] || SOUNDS.achievement);
    }
  }

  function showToast(ach, customTitle, customDesc) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'achievement-toast';
    toast.innerHTML = `
      <h4 style="font-size:0.9rem; margin:0;">${customTitle || ach.title}</h4>
      <p style="font-size:0.75rem; opacity:0.8; margin:0;">${customDesc || 'Secret recipe unlocked!'}</p>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  }

  let activeRecipeTab = 'regular';
  window.switchRecipeTab = function(tab) {
    activeRecipeTab = tab;
    document.getElementById('tabNormal').className = `recipe-tab ${tab === 'regular' ? 'active' : ''}`;
    document.getElementById('tabSecret').className = `recipe-tab ${tab === 'secret' ? 'active' : ''}`;
    renderRecipesModal();
  }

  function renderRecipesModal() {
    const body = document.getElementById('recipesModalBody');
    if (!body) return;
    body.innerHTML = '';

    if (activeRecipeTab === 'regular') {
      REGULAR_RECIPES.forEach(r => {
        const card = document.createElement('div');
        card.className = 'recipe-card';
        let iconsHtml = '';
        r.ids.forEach(id => { if (ITEM_IMAGES[id]) iconsHtml += `<img src="${ITEM_IMAGES[id]}" title="${id}">`; });
        card.innerHTML = `<div class="recipe-info"><h4>${r.name}</h4><div class="recipe-visual">${iconsHtml}</div></div>`;
        const pinBtn = document.createElement('button');
        pinBtn.className = `btn-pin ${pinnedBurger && pinnedBurger.name === r.name ? 'pinned' : ''}`;
        pinBtn.innerText = '📌';
        pinBtn.onclick = () => {
          pinnedBurger = pinnedBurger && pinnedBurger.name === r.name ? null : { name: r.name, ids: r.ids };
          if (pinnedBurger) localStorage.setItem('pinned_burger', JSON.stringify(pinnedBurger));
          else localStorage.removeItem('pinned_burger');
          renderRecipesModal();
          updatePinnedWidget();
        };
        card.appendChild(pinBtn);
        body.appendChild(card);
      });
    } else {
      SECRET_ACHIEVEMENTS.forEach(ach => {
        const isUnlocked = unlockedAchievements[ach.id];
        const card = document.createElement('div');
        card.className = `recipe-card ${isUnlocked ? '' : 'locked'}`;
        if (isUnlocked) {
          let iconsHtml = '';
          ach.ids.forEach(id => { if (ITEM_IMAGES[id]) iconsHtml += `<img src="${ITEM_IMAGES[id]}" title="${id}">`; });
          card.innerHTML = `<div class="recipe-info" style="flex:1;"><h4>${ach.title}</h4><div class="recipe-visual">${iconsHtml}</div></div>`;
          const pinBtn = document.createElement('button');
          pinBtn.className = `btn-pin ${pinnedBurger && pinnedBurger.name === ach.title ? 'pinned' : ''}`;
          pinBtn.innerText = '📌';
          pinBtn.onclick = () => {
            pinnedBurger = pinnedBurger && pinnedBurger.name === ach.title ? null : { name: ach.title, ids: ach.ids };
            if (pinnedBurger) localStorage.setItem('pinned_burger', JSON.stringify(pinnedBurger));
            else localStorage.removeItem('pinned_burger');
            renderRecipesModal();
            updatePinnedWidget();
          };
          card.appendChild(pinBtn);
        } else {
          card.innerHTML = `<div class="recipe-info" style="flex:1;"><h4>${ach.title}</h4><p style="font-size:0.75rem; opacity:0.6;">Secret recipe locked...</p></div>`;
        }
        body.appendChild(card);
      });
    }
  }

  function updatePinnedWidget() {
    const widget = document.getElementById('pinnedRecipeWidget');
    const container = document.getElementById('pinnedIngredientsContainer');
    if (!widget || !container) return;
    if (pinnedBurger) {
      document.getElementById('pinnedTitle').innerHTML = `<span>📌 ${pinnedBurger.name}</span> <button class="unpin-btn" id="unpinBtn">✕</button>`;
      container.innerHTML = '';
      pinnedBurger.ids.forEach(id => {
        if (ITEM_IMAGES[id]) {
          const img = document.createElement('img');
          img.src = ITEM_IMAGES[id];
          container.appendChild(img);
        }
      });
      widget.classList.add('active');
      document.getElementById('unpinBtn').onclick = () => {
        pinnedBurger = null;
        localStorage.removeItem('pinned_burger');
        updatePinnedWidget();
        renderRecipesModal();
      };
    } else {
      widget.classList.remove('active');
    }
  }

  const SHOP_ITEMS = [
    { id: 'bottom-bun', name: 'Bottom Bun', category: 'bread', image: 'images/bottom-bun.png' },
    { id: 'top-bun', name: 'Top Bun', category: 'bread', image: 'images/top-bun.png' },
    { id: 'beef-patty', name: 'Beef Patty', category: 'patty', image: 'images/beef-patty.png' },
    { id: 'chicken-patty', name: 'Chicken Patty', category: 'patty', image: 'images/chicken-patty.png' },
    { id: 'fish-patty', name: 'Fish Patty', category: 'patty', image: 'images/fish-patty.png' },
    { id: 'hashbrown', name: 'Hashbrown (Драник)', category: 'patty', image: 'images/hashbrown.png' },
    { id: 'fried-bacon', name: 'Fried Bacon', category: 'protein', image: 'images/fried-bacon.png' },
    { id: 'fried-egg', name: 'Fried Egg', category: 'protein', image: 'images/fried-egg.png' },
    { id: 'cheese', name: 'Cheese', category: 'protein', image: 'images/cheese.png' },
    { id: 'champignons', name: 'Champignons', category: 'vegetables', image: 'images/champignons.png' },
    { id: 'lettuce', name: 'Lettuce', category: 'vegetables', image: 'images/lettuce.png' },
    { id: 'tomato', name: 'Tomato', category: 'vegetables', image: 'images/tomato.png' },
    { id: 'pickles', name: 'Pickles', category: 'vegetables', image: 'images/pickles.png' },
    { id: 'red-onion', name: 'Red Onion', category: 'vegetables', image: 'images/red-onion.png' },
    { id: 'white-onion', name: 'White Onion', category: 'vegetables', image: 'images/white-onion.png' },
    { id: 'mayo', name: 'Mayo', category: 'sauce', image: 'images/sauce-mayo.png', isSauce: true },
    { id: 'ketchup', name: 'Ketchup', category: 'sauce', image: 'images/sauce-ketchup.png', isSauce: true },
    { id: 'mustard', name: 'Mustard', category: 'sauce', image: 'images/sauce-mustard.png', isSauce: true },
    { id: 'spicy', name: 'Spicy', category: 'sauce', image: 'images/sauce-spicy.png', isSauce: true },
    { id: 'bbq', name: 'BBQ', category: 'sauce', image: 'images/sauce-bbq.png', isSauce: true }
  ];

  let activeShopTab = 'all';
  window.switchShopTab = function(tab) {
    activeShopTab = tab;
    document.querySelectorAll('#shopTabs .recipe-tab').forEach(t => {
      t.classList.toggle('active', t.innerText.toLowerCase() === tab);
    });
    renderShopModal();
  }

  function renderShopModal() {
    const body = document.getElementById('shopModalBody');
    if (!body) return;
    body.innerHTML = '';
    const filtered = activeShopTab === 'all' ? SHOP_ITEMS : SHOP_ITEMS.filter(i => i.category === activeShopTab);

    filtered.forEach(item => {
      const unitPrice = ITEM_PRICES[item.id] || 1;
      const stockDisplay = currentGameMode === 'sandbox' ? '∞' : (ingredientStock[item.id] ?? 0);
      const card = document.createElement('div');
      card.className = 'shop-item-card';
      card.innerHTML = `
        <div class="shop-item-info">
          <img src="${item.image}" alt="${item.name}">
          <div class="shop-item-details">
            <h4>${item.name} ${item.isSauce ? '<span style="color:#ffb300; font-size:0.7rem;">x10</span>' : ''}</h4>
            <p>$${unitPrice.toFixed(2)} ${item.isSauce ? 'per pack' : 'each'} | Stock: ${stockDisplay}</p>
          </div>
        </div>
        <div class="shop-buy-group">
          <button class="shop-qty-btn" onclick="changeQty('${item.id}', -1)">-</button>
          <input type="number" min="0" max="100" value="0" id="qty-${item.id}">
          <button class="shop-qty-btn" onclick="changeQty('${item.id}', 1)">+</button>
          <button class="btn-buy" onclick="buyItem('${item.id}')">Buy</button>
        </div>
      `;
      body.appendChild(card);
    });
  }

  window.changeQty = function(id, delta) {
    const input = document.getElementById(`qty-${id}`);
    if (!input) return;
    let val = parseInt(input.value) || 0;
    val = Math.max(0, Math.min(100, val + delta));
    input.value = val;
  }

  window.buyItem = function(id) {
    const input = document.getElementById(`qty-${id}`);
    const qty = parseInt(input.value) || 0;
    if (qty <= 0) { alert("Please select quantity greater than 0!"); return; }
    
    const totalCost = (ITEM_PRICES[id] || 1) * qty;

    if (currentGameMode !== 'sandbox') {
      if (playerMoney < totalCost) { alert("Not enough money in your wallet!"); return; }
      playerMoney -= totalCost;
      updateMoneyDisplay(totalCost, false);
    }

    ingredientStock[id] = (ingredientStock[id] ?? 0) + qty;
    saveStock();
    renderIngredientsMenu();
    renderSauces();
    renderShopModal();
    playSound(SOUNDS.buy);
  }

  const shopModal = document.getElementById('shopModal');
  document.getElementById('openShopBtn').onclick = () => { playSound(SOUNDS.buttons); renderShopModal(); shopModal.classList.add('open'); };
  document.getElementById('closeShopModal').onclick = () => { playSound(SOUNDS.buttons); shopModal.classList.remove('open'); };

  const recipesModal = document.getElementById('recipesModal');
  document.getElementById('openRecipesBtn').onclick = () => { playSound(SOUNDS.buttons); renderRecipesModal(); recipesModal.classList.add('open'); };
  document.getElementById('closeRecipesModal').onclick = () => { playSound(SOUNDS.buttons); recipesModal.classList.remove('open'); };

  const achievementsModal = document.getElementById('achievementsModal');
  document.getElementById('openAchievementsBtn').onclick = () => {
    playSound(SOUNDS.buttons);
    const list = document.getElementById('achievementsList');
    if (list) {
      list.innerHTML = '';
      SECRET_ACHIEVEMENTS.forEach(ach => {
        const isUnlocked = unlockedAchievements[ach.id];
        const item = document.createElement('div');
        item.className = 'achievement-item';
        item.style.opacity = isUnlocked ? '1' : '0.5';
        item.innerHTML = `<div class="recipe-info" style="flex:1;"><h4>${ach.title}</h4><p>${isUnlocked ? ach.desc : 'Secret locked'}</p></div>`;
        list.appendChild(item);
      });
    }
    achievementsModal.classList.add('open');
  };
  document.getElementById('closeAchievementsModal').onclick = () => { playSound(SOUNDS.buttons); achievementsModal.classList.remove('open'); };

  const resetAchievementsBtn = document.getElementById('resetAchievementsBtn');
  if (resetAchievementsBtn) {
    resetAchievementsBtn.onclick = () => {
      if (confirm("⚠️ Are you sure you want to reset all unlocked achievements?")) {
        unlockedAchievements = {};
        localStorage.removeItem('unlocked_achievements');
        playSound(SOUNDS.bin);
        achievementsModal.classList.remove('open');
        showToast({title: 'Achievements Reset!'}, 'Reset', 'All secret recipes locked again.');
      }
    };
  }

  const settingsModal = document.getElementById('settingsModal');
  document.getElementById('openSettingsBtn').onclick = () => { playSound(SOUNDS.buttons); settingsModal.classList.add('open'); };
  document.getElementById('closeSettingsModal').onclick = () => { playSound(SOUNDS.buttons); settingsModal.classList.remove('open'); };

  document.getElementById('hardResetBtn').onclick = () => {
    if (confirm("⚠️ WARNING: Wipe all data?")) { localStorage.clear(); location.reload(); }
  };

  const toggleUiBtn = document.getElementById('toggleUiBtn');
  if (toggleUiBtn) {
    toggleUiBtn.onclick = () => {
      document.body.classList.toggle('ui-hidden');
      toggleUiBtn.innerText = document.body.classList.contains('ui-hidden') ? '👁️‍🗨️' : '👁️';
    };
  }

  const downloadPngBtn = document.getElementById('downloadPngBtn');
  if (downloadPngBtn) {
    downloadPngBtn.onclick = () => {
      if (currentBurger.length === 0) {
        alert("Your burger stack is empty! Build a burger first.");
        return;
      }
      playSound(SOUNDS.buttons);
      
      const targetElement = document.getElementById('burgerStack');
      if (!targetElement) return;

      targetElement.classList.add('capturing-png');

      html2canvas(targetElement, {
        backgroundColor: null,
        scale: 2
      }).then(canvas => {
        targetElement.classList.remove('capturing-png');

        const link = document.createElement('a');
        link.download = 'my-burger.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      }).catch(err => {
        targetElement.classList.remove('capturing-png');
        console.error("Failed to save image:", err);
        alert("Could not save image.");
      });
    };
  }

  function updateBurgerDisplay(isNewAdded = false) {
    saveBurgerState();
    if (layersTitle) layersTitle.innerText = `Layers (${currentBurger.length}/${MAX_INGREDIENTS})`;

    if (layersList) {
      layersList.innerHTML = '';
      currentBurger.forEach((item, index) => {
        const listItem = document.createElement('div');
        listItem.className = 'layer-item';
        listItem.innerHTML = `
          <div class="layer-info">${item.image ? `<img src="${item.image}" class="layer-preview">` : ''}</div>
          <div class="layer-controls">
            <button class="btn-control" onclick="moveLayer(${index}, 1)" ${index === currentBurger.length - 1 || isEating ? 'disabled' : ''}>▲</button>
            <button class="btn-control" onclick="moveLayer(${index}, -1)" ${index === 0 || isEating ? 'disabled' : ''}>▼</button>
            <button class="btn-control delete" onclick="removeLayer(${index})" ${isEating ? 'disabled' : ''}>✕</button>
          </div>
        `;
        layersList.appendChild(listItem);
      });
    }

    if (burgerStack) {
      burgerStack.innerHTML = '';
      currentBurger.forEach((item, index) => {
        if (item.image) {
          const img = document.createElement('img');
          img.src = item.image;
          img.className = 'burger-layer-img';
          if (isNewAdded && index === currentBurger.length - 1) {
            img.classList.add('new-layer');
            setTimeout(() => img.classList.remove('new-layer'), 350);
          }
          const itemBelow = index > 0 ? currentBurger[index - 1] : null;
          const isSauce = ['mayo', 'ketchup', 'mustard', 'spicy', 'bbq'].includes(item.id);
          let mb = -38;
          if (index === 0) mb = -10;
          else if (isSauce) mb = -50;
          else if (item.id === 'top-bun') mb = -38;
          else if (item.id === 'cheese') mb = -60;
          else if (item.id === 'hashbrown') mb = -38;
          else if (item.id === 'fried-egg') mb = -52;
          else if (item.id === 'fried-bacon') mb = -48;
          else if (item.id === 'lettuce') mb = -65;
          else if (itemBelow && itemBelow.id === 'lettuce') mb = -50;

          img.style.marginBottom = `${mb}px`;
          img.style.zIndex = index + 1;

          if (isSqueezed && index > 0) {
            img.style.setProperty('--sq-offset', `${index * 6}px`);
            img.classList.add('squeezed');
          }
          burgerStack.appendChild(img);
        }
      });
    }
    renderIngredientsMenu();
    renderSauces();
    if (centerStage) setTimeout(() => { centerStage.scrollTop = centerStage.scrollHeight; }, 50);
  }

  function addIngredient(item) {
    if (isEating || isAddingInProgress) return;
    if (currentBurger.length >= MAX_INGREDIENTS) {
      if (limitWarning) { limitWarning.classList.add('show'); setTimeout(() => limitWarning.classList.remove('show'), 2000); }
      return;
    }
    if (currentGameMode !== 'sandbox') {
      if ((ingredientStock[item.id] ?? 0) <= 0) return;
      ingredientStock[item.id]--;
      saveStock();
    }

    isAddingInProgress = true;
    playSound(SOUNDS.ingridients);
    currentBurger.push({ ...item });
    checkSpecialCombos();
    updateBurgerDisplay(true);

    setTimeout(() => {
      isAddingInProgress = false;
    }, 150);
  }

  function addSauce(sauce) {
    if (isEating || isAddingInProgress) return;
    if (currentBurger.length >= MAX_INGREDIENTS) return;
    if (currentGameMode !== 'sandbox') {
      if ((ingredientStock[sauce.id] ?? 0) <= 0) return;
      ingredientStock[sauce.id]--;
      saveStock();
    }

    isAddingInProgress = true;
    playSound(SOUNDS.sauce);
    currentBurger.push({ ...sauce });
    checkSpecialCombos();
    updateBurgerDisplay(true);

    setTimeout(() => {
      isAddingInProgress = false;
    }, 150);
  }

  window.removeLayer = function(index) {
    if (isEating) return;
    const removed = currentBurger[index];
    if (currentGameMode !== 'sandbox' && removed) {
      ingredientStock[removed.id] = (ingredientStock[removed.id] ?? 0) + 1;
      saveStock();
    }
    playSound(SOUNDS.buttons);
    currentBurger.splice(index, 1);
    checkSpecialCombos();
    updateBurgerDisplay(false);
  };

  window.moveLayer = function(index, direction) {
    if (isEating) return;
    const targetIndex = index + direction;
    if (targetIndex >= 0 && targetIndex < currentBurger.length) {
      playSound(SOUNDS.buttons);
      const temp = currentBurger[index];
      currentBurger[index] = currentBurger[targetIndex];
      currentBurger[targetIndex] = temp;
      checkSpecialCombos();
      updateBurgerDisplay(false);
    }
  };

  if (squeezeBtn) {
    squeezeBtn.onclick = () => {
      if (currentBurger.length <= 1 || isEating) return;
      playSound(SOUNDS.squeeze);
      isSqueezed = !isSqueezed;
      updateBurgerDisplay(false);
    };
  }

  if (submitOrderBtn) {
    submitOrderBtn.onclick = () => {
      if (currentActiveOrder && currentBurger.length > 0) {
        checkOrderSubmission();
      } else {
        alert("No active order or burger stack is empty!");
      }
    };
  }

  const resetBtn = document.getElementById('resetBtn');
  if (resetBtn) {
    resetBtn.onclick = () => {
      if (currentGameMode !== 'sandbox' && currentBurger.length > 0) {
        currentBurger.forEach(item => { ingredientStock[item.id] = (ingredientStock[item.id] ?? 0) + 1; });
        saveStock();
      }
      playSound(SOUNDS.bin);
      isEating = false; isSqueezed = false;
      if (burgerStack) burgerStack.classList.remove('eating');
      currentBurger = [];
      updateBurgerDisplay(false);
    };
  }

  if (eatBtn) {
    eatBtn.onclick = () => {
      if (currentBurger.length === 0 || isEating) return;
      playSound(SOUNDS.eating);
      isEating = true; isSqueezed = false;
      if (burgerStack) burgerStack.classList.add('eating');
      setTimeout(() => {
        currentBurger = [];
        if (burgerStack) burgerStack.classList.remove('eating');
        isEating = false;
        updateBurgerDisplay(false);
      }, 2000);
    };
  }

  function checkOrderSubmission() {
    const ids = currentBurger.map(i => i.id);
    if (!currentActiveOrder) return;

    const targetIds = currentActiveOrder.ids;
    const isCorrect = ids.length === targetIds.length && ids.every((val, idx) => val === targetIds[idx]);

    if (isCorrect) {
      playSound(SOUNDS.complete);
      if (currentGameMode !== 'sandbox') {
        const cost = ids.reduce((sum, id) => sum + (ITEM_PRICES[id] || 1), 0);
        const reward = Math.round(cost * 2 * 100) / 100;
        playerMoney += reward;
        updateMoneyDisplay(reward, true);
      }
      showToast(null, 'Order Complete!', `${currentActiveOrder.name} served successfully!`);
      
      if (currentGameMode === 'turbo') {
        triggerRandomOrder();
      } else {
        currentActiveOrder = null;
        localStorage.removeItem('current_active_order');
      }
      updateActionButtonsVisibility();
      setTimeout(() => { if (eatBtn && eatBtn.style.display !== 'none') eatBtn.click(); else { currentBurger = []; updateBurgerDisplay(false); } }, 600);
    } else {
      playSound(SOUNDS.wrongOrder);
      if (currentGameMode !== 'sandbox') {
        playerMoney = Math.max(0, playerMoney - 3);
        updateMoneyDisplay(3, false);
      }
      showToast(null, 'Wrong Order! -$3', 'Recipe does not match current order!');
    }
  }

  function checkSpecialCombos() {
    if (currentBurger.length === 0) return;
    const ids = currentBurger.map(i => i.id);
    SECRET_ACHIEVEMENTS.forEach(ach => {
      if (ids.length === ach.ids.length && ids.every((val, idx) => val === ach.ids[idx])) {
        unlockAchievement(ach);
      }
    });
    
    const currentSpeed = getCurrentSpeed();
    if (currentActiveOrder && currentSpeed === 'no-orders') {
      const targetIds = currentActiveOrder.ids;
      if (ids.length === targetIds.length && ids.every((val, idx) => val === targetIds[idx])) {
        playSound(SOUNDS.complete);
        if (currentGameMode !== 'sandbox') {
          const cost = ids.reduce((sum, id) => sum + (ITEM_PRICES[id] || 1), 0);
          const reward = Math.round(cost * 2 * 100) / 100;
          playerMoney += reward;
          updateMoneyDisplay(reward, true);
        }
        showToast(null, 'Order Complete!', `${currentActiveOrder.name} served successfully!`);
        currentActiveOrder = null;
        localStorage.removeItem('current_active_order');
        updateActionButtonsVisibility();
        setTimeout(() => { if (eatBtn && eatBtn.style.display !== 'none') eatBtn.click(); else { currentBurger = []; updateBurgerDisplay(false); } }, 600);
      }
    }
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  function updateOrderWidgetsText(orderName, timerText = '') {
    const w1 = document.getElementById('orderStatusText');
    if (!w1) return;
    
    if (timerText) {
      w1.innerHTML = `<div>🔔 Order: <span>${orderName}</span></div><div class="order-timer-badge">⏱️ ${timerText}</div>`;
    } else {
      w1.innerHTML = `🔔 Order: <span>${orderName}</span>`;
    }
  }

  function triggerRandomOrder() {
    const unlockedSecretNames = SECRET_ACHIEVEMENTS.filter(a => unlockedAchievements[a.id]);
    const allAvailable = [...REGULAR_RECIPES, ...unlockedSecretNames];
    const chosen = allAvailable[Math.floor(Math.random() * allAvailable.length)];
    currentActiveOrder = { name: chosen.name || chosen.title, ids: chosen.ids };
    
    if (currentGameMode === 'turbo') {
      currentTurboTimeLeft = 180;
    }
    
    localStorage.setItem('current_active_order', JSON.stringify(currentActiveOrder));
    
    const speed = getCurrentSpeed();
    if (speed !== 'no-orders' && currentGameMode !== 'turbo') {
      timeUntilNextOrder = getRandomTimeForSpeed(speed);
      localStorage.setItem('time_until_next_order', timeUntilNextOrder);
    }
    
    playSound(SOUNDS.order);
    updateActionButtonsVisibility();
  }

  setInterval(() => {
    const currentSpeed = getCurrentSpeed();
    if (currentSpeed === 'no-orders') return;

    if (currentGameMode === 'turbo') {
      if (!currentActiveOrder) {
        triggerRandomOrder();
      } else {
        if (currentTurboTimeLeft > 0) {
          currentTurboTimeLeft--;
          updateOrderWidgetsText(currentActiveOrder.name, formatTime(currentTurboTimeLeft));
        } else {
          currentTurboTimeLeft = 180;
          playSound(SOUNDS.wrongOrder);
          playerMoney = Math.max(0, playerMoney - 5);
          updateMoneyDisplay(5, false);
          showToast({title: 'Time Out! -$5'}, 'Order Failed', 'You ran out of time!');
          triggerRandomOrder();
        }
      }
      return;
    }

    if (!currentActiveOrder) {
      if (timeUntilNextOrder > 0) {
        timeUntilNextOrder--;
        localStorage.setItem('time_until_next_order', timeUntilNextOrder);
        const w1 = document.getElementById('orderStatusText');
        if (w1) w1.innerHTML = `Next order in: <span>${formatTime(timeUntilNextOrder)}</span>`;
      } else {
        triggerRandomOrder();
      }
    } else {
      updateOrderWidgetsText(currentActiveOrder.name);
    }
  }, 1000);

  if (currentActiveOrder && getCurrentSpeed() !== 'no-orders') {
    if (currentGameMode === 'turbo') {
      updateOrderWidgetsText(currentActiveOrder.name, formatTime(currentTurboTimeLeft));
    } else {
      updateOrderWidgetsText(currentActiveOrder.name);
    }
  }

  renderSauces();
  renderIngredientsMenu();
  updateBurgerDisplay(false);
  updatePinnedWidget();
  updateMoneyDisplay();
  updateActionButtonsVisibility();
});
