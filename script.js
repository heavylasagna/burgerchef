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
    mcPicklePounder: safeAudio('audio/mc-pickle-pounder.mp3'),
    sizzling: safeAudio('audio/sizzling.mp3'),
    burnt: safeAudio('audio/burnt.mp3')
  };

  let volumeLevel = parseFloat(localStorage.getItem('burger_volume'));
  if (isNaN(volumeLevel)) volumeLevel = 1.0;

  function playSound(audio) {
    if (!audio) return;
    try {
      audio.currentTime = 0;
      audio.volume = volumeLevel;
      audio.play().catch(() => {});
    } catch(e) {}
  }

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
  const grillStage = document.getElementById('grillStage');
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
    'mayo': 30, 'ketchup': 30, 'mustard': 30, 'spicy': 30, 'bbq': 30,
    'raw-beef-patty': 10, 'raw-chicken-patty': 10, 'raw-fish-patty': 10, 'raw-hashbrown': 10,
    'raw-bacon': 10, 'raw-egg': 10, 'raw-champignons': 10
  };

  const GRILLABLE_ITEMS = {
    'raw-beef-patty': { name: 'Beef Patty', rawImage: 'images/raw-beef-patty.png', cookedId: 'beef-patty', cookedImage: 'images/beef-patty.png', flippedImage: 'images/beef-patty-flip.png', needsFlip: true, cookTime: 6, burnTime: 8 },
    'raw-chicken-patty': { name: 'Chicken Patty', rawImage: 'images/raw-chicken-patty.png', cookedId: 'chicken-patty', cookedImage: 'images/chicken-patty.png', flippedImage: 'images/chicken-patty-flip.png', needsFlip: true, cookTime: 6, burnTime: 8 },
    'raw-fish-patty': { name: 'Fish Patty', rawImage: 'images/raw-fish-patty.png', cookedId: 'fish-patty', cookedImage: 'images/fish-patty.png', flippedImage: 'images/fish-patty-flip.png', needsFlip: true, cookTime: 6, burnTime: 8 },
    'raw-hashbrown': { name: 'Hashbrown', rawImage: 'images/raw-hashbrown.png', cookedId: 'hashbrown', cookedImage: 'images/hashbrown.png', flippedImage: 'images/hasbrown-flip.png', needsFlip: true, cookTime: 5, burnTime: 7 },
    'raw-bacon': { name: 'Fried Bacon', rawImage: 'images/raw-bacon.png', cookedId: 'fried-bacon', cookedImage: 'images/fried-bacon.png', needsFlip: false, cookTime: 4, burnTime: 4 },
    'raw-egg': { name: 'Fried Egg', rawImage: 'images/egg.png', cookedId: 'fried-egg', cookedImage: 'images/fried-egg.png', needsFlip: false, cookTime: 4, burnTime: 4 },
    'raw-champignons': { name: 'Champignons', rawImage: 'images/raw-champignons.png', cookedId: 'champignons', cookedImage: 'images/champignons.png', needsFlip: false, cookTime: 4, burnTime: 4 }
  };

  const maxGrillSlots = 3;
  let grillSlots = JSON.parse(localStorage.getItem('burger_grill_slots')) || Array(maxGrillSlots).fill(null);
  let currentScreen = 'assembly';

  let currentGameMode = localStorage.getItem('burger_game_mode') || 'casual';
  let modeSpeeds = JSON.parse(localStorage.getItem('burger_mode_speeds')) || { 'sandbox': 'no-orders', 'casual': 'no-orders' };

  let unlockedAchievements = JSON.parse(localStorage.getItem('unlocked_achievements')) || {};
  let pinnedBurger = JSON.parse(localStorage.getItem('pinned_burger')) || null;
  let currentActiveOrder = JSON.parse(localStorage.getItem('current_active_order')) || null;
  
  let timeUntilNextOrder = parseInt(localStorage.getItem('time_until_next_order'), 10);
  if (isNaN(timeUntilNextOrder)) timeUntilNextOrder = 300;

  const switchToAssemblyBtn = document.getElementById('switchToAssemblyBtn');
  const switchToGrillBtn = document.getElementById('switchToGrillBtn');

  function switchScreen(screen) {
    playSound(SOUNDS.buttons);
    currentScreen = screen;

    if (switchToAssemblyBtn) switchToAssemblyBtn.classList.toggle('active', screen === 'assembly');
    if (switchToGrillBtn) switchToGrillBtn.classList.toggle('active', screen === 'grill');

    if (screen === 'assembly') {
      if (centerStage) centerStage.style.display = 'flex';
      if (grillStage) grillStage.style.display = 'none';
      if (rightPanel) rightPanel.style.display = 'flex';
      if (leftPanel) leftPanel.style.display = 'flex';
    } else if (screen === 'grill') {
      if (centerStage) centerStage.style.display = 'none';
      if (grillStage) grillStage.style.display = 'flex';
      if (rightPanel) rightPanel.style.display = 'none';
      if (leftPanel) leftPanel.style.display = 'none';
      renderGrill();
    }
  }

  if (switchToAssemblyBtn) switchToAssemblyBtn.onclick = () => switchScreen('assembly');
  if (switchToGrillBtn) switchToGrillBtn.onclick = () => switchScreen('grill');

  function saveStock() { localStorage.setItem('burger_ingredient_stock', JSON.stringify(ingredientStock)); }
  function saveBurgerState() { localStorage.setItem('saved_burger_stack', JSON.stringify(currentBurger)); }

  function showToast(title, desc = '', type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast-message ${type}`;
    toast.innerHTML = `<h4 style="font-size:0.85rem; margin:0; font-weight:700;">${title}</h4>${desc ? `<p style="font-size:0.75rem; opacity:0.85; margin:0;">${desc}</p>` : ''}`;
    toast.onclick = () => toast.remove();
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
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
          if (isOut) { showToast('Out of stock!', `Buy more ${sauce.name} in shop.`, 'warning'); return; }
          addSauce(sauce);
        };
        container.appendChild(chip);
      });
    });
  }

  function renderIngredientsMenu() {
    if (!ingredientsMenu) return;
    ingredientsMenu.innerHTML = '';
    INGREDIENTS.forEach(item => {
      const card = document.createElement('div');
      const stock = ingredientStock[item.id] ?? 0;
      const isOut = currentGameMode !== 'sandbox' && stock <= 0;

      card.className = `ingredient-card ${currentBurger.length >= MAX_INGREDIENTS || isEating || isOut ? 'disabled' : ''}`;
      card.innerHTML = `
        <img src="${item.image}" alt="${item.name}">
        <div class="ingredient-info-row">
          <span class="ingredient-name" title="${item.name}">${item.name}</span>
          <span class="ingredient-stock-count">${currentGameMode === 'sandbox' ? '∞' : 'x' + stock}</span>
        </div>
      `;
      card.onclick = () => {
        if (isEating || isAddingInProgress) return;
        if (isOut) { showToast('Out of stock!', `Buy more ${item.name} in shop.`, 'warning'); return; }
        addIngredient(item);
      };
      ingredientsMenu.appendChild(card);
    });
  }

  function renderGrillIngredientsMenu() {
    const menu = document.getElementById('grillIngredientsMenu');
    if (!menu) return;
    menu.innerHTML = '';

    Object.keys(GRILLABLE_ITEMS).forEach(rawId => {
      const itemConfig = GRILLABLE_ITEMS[rawId];
      const stock = ingredientStock[rawId] ?? 0;
      const isOut = currentGameMode !== 'sandbox' && stock <= 0;

      const card = document.createElement('div');
      card.className = `ingredient-card ${isOut ? 'disabled' : ''}`;
      card.innerHTML = `
        <img src="${itemConfig.rawImage}" alt="${itemConfig.name}">
        <div class="ingredient-info-row">
          <span class="ingredient-name" title="${itemConfig.name}">${itemConfig.name}</span>
          <span class="ingredient-stock-count">${currentGameMode === 'sandbox' ? '∞' : 'x' + stock}</span>
        </div>
      `;
      card.onclick = () => {
        if (isOut) { showToast('Out of stock!', `Buy more ${itemConfig.name} in shop.`, 'warning'); return; }
        addToGrill(rawId);
      };
      menu.appendChild(card);
    });
  }

  function addToGrill(rawId) {
    const emptyIndex = grillSlots.findIndex(slot => slot === null);
    if (emptyIndex === -1) {
      showToast('Grill is full!', '', 'warning');
      return;
    }

    if (currentGameMode !== 'sandbox') {
      ingredientStock[rawId] = (ingredientStock[rawId] ?? 0) - 1;
      saveStock();
    }

    grillSlots[emptyIndex] = {
      rawId: rawId,
      state: 'cooking',
      progress: 0,
      isFlipped: false
    };

    playSound(SOUNDS.ingridients);
    renderGrill();
  }

  function renderGrill() {
    if (currentScreen !== 'grill') return;
    renderGrillIngredientsMenu();

    const area = document.getElementById('grillCookingArea');
    if (!area) return;
    area.innerHTML = '';

    grillSlots.forEach((slotData, index) => {
      const slotEl = document.createElement('div');
      slotEl.className = 'grill-slot';

      if (slotData) {
        const config = GRILLABLE_ITEMS[slotData.rawId];
        let imgsrc = config.rawImage;

        slotEl.innerHTML = `
          <img src="${imgsrc}" class="grill-item">
        `;
      }

      area.appendChild(slotEl);
    });
  }

  function updateMoneyDisplay() {
    const badge = document.getElementById('walletBadge');
    if (!badge) return;

    if (currentGameMode === 'sandbox') {
      badge.innerText = '$∞';
      badge.className = 'positive';
    } else {
      badge.innerText = `$${playerMoney.toFixed(2)}`;
      badge.className = '';
      if (playerMoney > 0) badge.classList.add('positive');
      else if (playerMoney === 0) badge.classList.add('zero');
      else badge.classList.add('negative');
    }
  }

  function addIngredient(item) {
    if (isEating || isAddingInProgress) return;
    if (currentBurger.length >= MAX_INGREDIENTS) return;
    if (currentGameMode !== 'sandbox') {
      if ((ingredientStock[item.id] ?? 0) <= 0) return;
      ingredientStock[item.id]--;
      saveStock();
    }
    playSound(SOUNDS.ingridients);
    currentBurger.push({ ...item });
    updateBurgerDisplay(true);
  }

  function addSauce(sauce) {
    if (isEating || isAddingInProgress) return;
    if (currentBurger.length >= MAX_INGREDIENTS) return;
    if (currentGameMode !== 'sandbox') {
      if ((ingredientStock[sauce.id] ?? 0) <= 0) return;
      ingredientStock[sauce.id]--;
      saveStock();
    }
    playSound(SOUNDS.sauce);
    currentBurger.push({ ...sauce });
    updateBurgerDisplay(true);
  }

  function updateBurgerDisplay(isNewAdded = false) {
    saveBurgerState();
    if (layersTitle) layersTitle.innerText = `Layers (${currentBurger.length}/${MAX_INGREDIENTS})`;

    if (burgerStack) {
      burgerStack.innerHTML = '';
      currentBurger.forEach((item, index) => {
        const img = document.createElement('img');
        img.src = item.image;
        img.className = 'burger-layer-img';
        img.style.zIndex = index + 1;
        burgerStack.appendChild(img);
      });
    }
    renderIngredientsMenu();
  }

  renderSauces();
  renderIngredientsMenu();
  updateBurgerDisplay();
  updateMoneyDisplay();
});
