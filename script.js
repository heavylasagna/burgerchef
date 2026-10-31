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
    burnt: safeAudio('audio/burnt.mp3'),
    chop: safeAudio('audio/ingridients.mp3'),
    cutting: safeAudio('audio/cutting.mp3')
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
  const centerStage = document.getElementById('centerStage');
  const grillStage = document.getElementById('grillStage');
  const boardStage = document.getElementById('boardStage');
  const limitWarning = document.getElementById('limitWarning');

  function initOpacityToggle() {
    const sideTitles = document.querySelectorAll('.panel:not(.bottom-panel) .panel-title');
    sideTitles.forEach(title => {
      title.style.cursor = 'pointer';
      title.addEventListener('click', () => {
        if (window.innerWidth <= 900) return;
        const panel = title.closest('.panel');
        if (panel) panel.classList.toggle('dimmed');
      });
    });

    if (bottomPanel) {
      bottomPanel.addEventListener('click', (e) => {
        if (window.innerWidth <= 900) return;
        if (
          e.target.closest('button') ||
          e.target.closest('.sauce-chip') ||
          e.target.closest('input')
        ) {
          return;
        }
        bottomPanel.classList.toggle('dimmed');
      });
    }

    const topOrderWidget = document.getElementById('topOrderWidget');
    if (topOrderWidget) {
      topOrderWidget.addEventListener('click', () => {
        topOrderWidget.classList.toggle('dimmed');
      });
    }

    const walletWidget = document.getElementById('walletWidget');
    if (walletWidget) {
      walletWidget.addEventListener('click', () => {
        walletWidget.classList.toggle('dimmed');
      });
    }
  }
  initOpacityToggle();

  const MAX_INGREDIENTS = 30;
  let currentBurger = JSON.parse(localStorage.getItem('saved_burger_stack')) || [];
  let isEating = false;
  let isSqueezed = false;
  let isAddingInProgress = false;

  let playerMoney = parseFloat(localStorage.getItem('burger_money'));
  if (isNaN(playerMoney)) playerMoney = 100.00;

  const ITEM_PRICES = {
    'top-bun': 2, 'bottom-bun': 2,
    'beef-patty': 5, 'chicken-patty': 4, 'fish-patty': 4, 'fried-bacon': 3, 'fried-egg': 2,
    'cheese': 3, 'raw-cheese': 3, 'uncut-cheese': 3,
    'hashbrown': 3,
    'champignons': 3, 'raw-champignons': 3, 'uncut-champignons': 3,
    'lettuce': 1, 'uncut-lettuce': 1,
    'tomato': 1, 'uncut-tomato': 1,
    'pickles': 1, 'uncut-pickles': 1,
    'red-onion': 1, 'uncut-red-onion': 1,
    'white-onion': 1, 'uncut-white-onion': 1,
    'mayo': 2, 'ketchup': 2, 'mustard': 2, 'spicy': 2, 'bbq': 2,
    'raw-beef-patty': 5, 'raw-chicken-patty': 4, 'raw-fish-patty': 4, 'raw-hashbrown': 3,
    'raw-bacon': 3, 'raw-egg': 2
  };

  let ingredientStock = JSON.parse(localStorage.getItem('burger_ingredient_stock')) || {
    'top-bun': 10, 'bottom-bun': 10,
    'beef-patty': 0, 'chicken-patty': 0, 'fish-patty': 0, 'fried-bacon': 0, 'fried-egg': 0,
    'cheese': 0, 'raw-cheese': 0, 'uncut-cheese': 5,
    'hashbrown': 0,
    'champignons': 0, 'raw-champignons': 0, 'uncut-champignons': 5,
    'lettuce': 0, 'uncut-lettuce': 5,
    'tomato': 0, 'uncut-tomato': 5,
    'pickles': 0, 'uncut-pickles': 5,
    'red-onion': 0, 'uncut-red-onion': 5,
    'white-onion': 0, 'uncut-white-onion': 5,
    'mayo': 20, 'ketchup': 20, 'mustard': 20, 'spicy': 20, 'bbq': 20,
    'raw-beef-patty': 5, 'raw-chicken-patty': 5, 'raw-fish-patty': 5, 'raw-hashbrown': 5,
    'raw-bacon': 5, 'raw-egg': 5
  };

  const GRILLABLE_ITEMS = {
    'raw-beef-patty': { 
      name: 'Beef Patty', 
      rawImage: 'images/raw-beef-patty.png', 
      flip1Image: 'images/beef-patty-flip1.png', 
      flip2Image: 'images/beef-patty-flip2.png', 
      cookedId: 'beef-patty', 
      cookedImage: 'images/beef-patty.png', 
      needsFlip: true, cookTime: 12, burnTime: 8 
    },
    'raw-chicken-patty': { 
      name: 'Chicken Patty', 
      rawImage: 'images/raw-chicken-patty.png', 
      flip1Image: 'images/chicken-patty-flip1.png', 
      flip2Image: 'images/chicken-patty-flip2.png', 
      cookedId: 'chicken-patty', 
      cookedImage: 'images/chicken-patty.png', 
      needsFlip: true, cookTime: 12, burnTime: 8 
    },
    'raw-fish-patty': { 
      name: 'Fish Patty', 
      rawImage: 'images/raw-fish-patty.png', 
      flip1Image: 'images/fish-patty-flip1.png', 
      flip2Image: 'images/fish-patty-flip2.png', 
      cookedId: 'fish-patty', 
      cookedImage: 'images/fish-patty.png', 
      needsFlip: true, cookTime: 12, burnTime: 8 
    },
    'raw-hashbrown': { 
      name: 'Hashbrown', 
      rawImage: 'images/raw-hashbrown.png', 
      flip1Image: 'images/hashbrown-flip1.png', 
      flip2Image: 'images/hashbrown-flip2.png', 
      cookedId: 'hashbrown', 
      cookedImage: 'images/hashbrown.png', 
      needsFlip: true, cookTime: 10, burnTime: 7 
    },
    'raw-bacon': { 
      name: 'Bacon', 
      rawImage: 'images/raw-bacon.png', 
      flip1Image: 'images/raw-bacon.png', 
      flip2Image: 'images/fried-bacon.png', 
      cookedId: 'fried-bacon', 
      cookedImage: 'images/fried-bacon.png', 
      needsFlip: false, cookTime: 8, burnTime: 6 
    },
    'raw-egg': { 
      name: 'Egg', 
      rawImage: 'images/raw-egg.png', 
      flip1Image: 'images/raw-egg.png', 
      flip2Image: 'images/fried-egg.png', 
      cookedId: 'fried-egg', 
      cookedImage: 'images/fried-egg.png', 
      needsFlip: false, cookTime: 8, burnTime: 6 
    },
    'raw-champignons': { 
      name: 'Champignons', 
      rawImage: 'images/raw-champignons.png', 
      flip1Image: 'images/raw-champignons.png', 
      flip2Image: 'images/champignons.png', 
      cookedId: 'champignons', 
      cookedImage: 'images/champignons.png', 
      needsFlip: false, cookTime: 8, burnTime: 6 
    },
    'raw-cheese': { 
      name: 'Cheese', 
      rawImage: 'images/raw-cheese.png', 
      flip1Image: 'images/raw-cheese.png', 
      flip2Image: 'images/cheese.png', 
      cookedId: 'cheese', 
      cookedImage: 'images/cheese.png', 
      needsFlip: false, cookTime: 6, burnTime: 5 
    }
  };

  const CUTTABLE_ITEMS = {
    'uncut-cheese': { name: 'Cheese', rawImage: 'images/uncut-cheese.png', slicedId: 'raw-cheese', slicedImage: 'images/raw-cheese.png', cutTime: 6 },
    'uncut-champignons': { name: 'Champignons', rawImage: 'images/uncut-champignons.png', slicedId: 'raw-champignons', slicedImage: 'images/raw-champignons.png', cutTime: 6 },
    'uncut-lettuce': { name: 'Lettuce', rawImage: 'images/uncut-lettuce.png', slicedId: 'lettuce', slicedImage: 'images/lettuce.png', cutTime: 5 },
    'uncut-tomato': { name: 'Tomato', rawImage: 'images/uncut-tomato.png', slicedId: 'tomato', slicedImage: 'images/tomato.png', cutTime: 5 },
    'uncut-pickles': { name: 'Pickles', rawImage: 'images/uncut-pickles.png', slicedId: 'pickles', slicedImage: 'images/pickles.png', cutTime: 5 },
    'uncut-red-onion': { name: 'Red Onion', rawImage: 'images/uncut-red-onion.png', slicedId: 'red-onion', slicedImage: 'images/red-onion.png', cutTime: 5 },
    'uncut-white-onion': { name: 'White Onion', rawImage: 'images/uncut-white-onion.png', slicedId: 'white-onion', slicedImage: 'images/white-onion.png', cutTime: 5 }
  };

  let grillSlots = JSON.parse(localStorage.getItem('burger_grill_slots')) || Array(3).fill(null);
  let boardSlots = JSON.parse(localStorage.getItem('burger_board_slots')) || Array(3).fill(null);
  let currentScreen = localStorage.getItem('burger_current_screen') || 'assembly';
  let isBinSelectMode = false;
  let selectedGrillIndicesForBin = [];
  let selectedBoardIndicesForBin = [];
  let sizzlingAudioInstance = null;
  let cuttingAudioInstance = null;

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
  let lastOrderReducedReward = false;
  let skipOrderClickCount = 0;
  let skipOrderTimeout = null;

  let resetClickCount = 0;
  let resetClickTimeout = null;

  let assemblyActiveCategory = 'all';
  let grillRawActiveCategory = 'all';
  let grillCookedActiveCategory = 'all';
  let boardUncutActiveCategory = 'all';
  let boardSlicedActiveCategory = 'all';

  const switchToAssemblyBtn = document.getElementById('switchToAssemblyBtn');
  const switchToGrillBtn = document.getElementById('switchToGrillBtn');
  const switchToBoardBtn = document.getElementById('switchToBoardBtn');

  function switchScreen(screen) {
    playSound(SOUNDS.buttons);
    currentScreen = screen;
    localStorage.setItem('burger_current_screen', screen);

    if (screen !== 'board') {
      manageCuttingAudio(false);
    }
    if (isBinSelectMode) {
      exitBinSelectMode();
    }

    if (switchToAssemblyBtn) switchToAssemblyBtn.classList.toggle('active', screen === 'assembly');
    if (switchToGrillBtn) switchToGrillBtn.classList.toggle('active', screen === 'grill');
    if (switchToBoardBtn) switchToBoardBtn.classList.toggle('active', screen === 'board');

    if (screen === 'assembly') {
      if (centerStage) centerStage.style.display = 'flex';
      if (grillStage) grillStage.style.display = 'none';
      if (boardStage) boardStage.style.display = 'none';
      if (rightPanel) rightPanel.style.display = 'flex';
      if (leftPanel) leftPanel.style.display = 'flex';
      if (desktopSaucesGroup) desktopSaucesGroup.classList.remove('hidden-on-grill', 'hidden-on-board');
      if (mobileSaucesGroup) mobileSaucesGroup.classList.remove('hidden-on-grill', 'hidden-on-board');
      exitBinSelectMode();
      renderIngredientsMenu();
      updateBurgerDisplay(false);
    } else if (screen === 'grill') {
      if (centerStage) centerStage.style.display = 'none';
      if (grillStage) grillStage.style.display = 'flex';
      if (boardStage) boardStage.style.display = 'none';
      if (rightPanel) rightPanel.style.display = 'flex'; 
      if (leftPanel) leftPanel.style.display = 'flex';  
      if (desktopSaucesGroup) desktopSaucesGroup.classList.add('hidden-on-grill');
      if (mobileSaucesGroup) mobileSaucesGroup.classList.add('hidden-on-grill');
      renderGrillIngredientsMenu();
      renderGrillCookedInventory();
      initGrillStructure();
      renderGrill();
    } else if (screen === 'board') {
      if (centerStage) centerStage.style.display = 'none';
      if (grillStage) grillStage.style.display = 'none';
      if (boardStage) boardStage.style.display = 'flex';
      if (rightPanel) rightPanel.style.display = 'flex';
      if (leftPanel) leftPanel.style.display = 'flex';
      if (desktopSaucesGroup) desktopSaucesGroup.classList.add('hidden-on-board');
      if (mobileSaucesGroup) mobileSaucesGroup.classList.add('hidden-on-board');
      renderBoardUncutMenu();
      renderBoardSlicedInventory();
      initBoardStructure();
      renderBoard();
    }
    updateBottomPanelForScreen();
  }

  if (switchToAssemblyBtn) switchToAssemblyBtn.onclick = () => switchScreen('assembly');
  if (switchToGrillBtn) switchToGrillBtn.onclick = () => switchScreen('grill');
  if (switchToBoardBtn) switchToBoardBtn.onclick = () => switchScreen('board');

  const knifeBtn = document.getElementById('knifeBtn');

  function updateBottomPanelForScreen() {
    const isGrill = currentScreen === 'grill';
    const isBoard = currentScreen === 'board';
    const isSpecialScreen = isGrill || isBoard;

    if (eatBtn) eatBtn.style.display = isSpecialScreen ? 'none' : 'flex';
    if (squeezeBtn) squeezeBtn.style.display = isSpecialScreen ? 'none' : 'flex';
    if (submitOrderBtn) submitOrderBtn.style.display = isSpecialScreen ? 'none' : (getCurrentSpeed() === 'no-orders' ? 'none' : 'flex');
    if (forceOrderBtn) forceOrderBtn.style.display = isSpecialScreen ? 'none' : 'flex';
    if (skipOrderBtn) skipOrderBtn.style.display = isSpecialScreen ? 'none' : 'flex';
    if (knifeBtn) knifeBtn.style.display = isBoard ? 'flex' : 'none';
  }

  function getCurrentSpeed() {
    if (currentGameMode === 'turbo') return 'turbo';
    return modeSpeeds[currentGameMode] || 'no-orders';
  }

  function saveStock() {
    localStorage.setItem('burger_ingredient_stock', JSON.stringify(ingredientStock));
  }

  function saveBurgerState() {
    localStorage.setItem('saved_burger_stack', JSON.stringify(currentBurger));
  }

  function saveGrillState() {
    localStorage.setItem('burger_grill_slots', JSON.stringify(grillSlots));
  }

  function saveBoardState() {
    localStorage.setItem('burger_board_slots', JSON.stringify(boardSlots));
  }

  function updateMoneyPopupPosition() {
    const container = document.getElementById('moneyPopupContainer');
    const pinnedWidget = document.getElementById('pinnedRecipeWidget');
    const walletWidget = document.getElementById('walletWidget');
    const rightPanelEl = document.getElementById('rightPanel');

    if (!container || !walletWidget) return;

    const isMobile = window.innerWidth <= 900;
    const isPinned = pinnedWidget && pinnedWidget.classList.contains('active');

    const updateContainerLeft = (targetEl) => {
      const targetRect = targetEl.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const walletCenterX = targetRect.left + targetRect.width / 2;
      const newLeft = walletCenterX - containerRect.width / 2;
      container.style.left = `${Math.max(8, newLeft)}px`;
    };

    if (isMobile) {
      if (isPinned && rightPanelEl) {
        const rightRect = rightPanelEl.getBoundingClientRect();
        container.style.top = 'unset';
        container.style.bottom = `${window.innerHeight - rightRect.top + 6}px`;
      } else {
        container.style.bottom = 'unset';
        const walletRect = walletWidget.getBoundingClientRect();
        container.style.top = `${walletRect.bottom + 6}px`;
      }
      updateContainerLeft(walletWidget);
    } else {
      container.style.bottom = 'unset';
      if (isPinned) {
        const rect = pinnedWidget.getBoundingClientRect();
        container.style.top = `${rect.bottom + 6}px`;
      } else {
        container.style.top = '52px';
      }
      updateContainerLeft(walletWidget);
    }
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
    popup.innerText = `${isPlus ? '+' : '-'}$${Math.abs(amount).toFixed(2)}`;
    
    let isRemoved = false;
    const removePopup = () => {
      if (isRemoved) return;
      isRemoved = true;
      popup.classList.add('hiding');
      setTimeout(() => popup.remove(), 300);
    };

    popup.onclick = removePopup;

    container.appendChild(popup);
    updateMoneyPopupPosition();
    setTimeout(removePopup, 2500);
  }

  function updateMoneyDisplay(changeAmount = null, isPlus = true) {
    const badge = document.getElementById('walletBadge');
    if (!badge) return;

    if (currentGameMode === 'sandbox') {
      badge.innerText = '$∞';
      badge.className = 'positive';
    } else {
      badge.innerText = `$${playerMoney.toFixed(2)}`;
      
      badge.className = '';
      if (playerMoney > 0) {
        badge.classList.add('positive');
      } else if (playerMoney === 0) {
        badge.classList.add('zero');
      } else {
        badge.classList.add('negative');
      }

      if (changeAmount !== null && changeAmount !== 0) {
        showMoneyPopup(changeAmount, isPlus);
      }
    }
    localStorage.setItem('burger_money', playerMoney);
    updateShopBalanceHeader();
  }

  function showToast(title, desc = '', type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast-message ${type}`;
    toast.innerHTML = `
      <h4 style="font-size:0.85rem; margin:0; font-weight:700;">${title}</h4>
      ${desc ? `<p style="font-size:0.75rem; opacity:0.85; margin:0;">${desc}</p>` : ''}
    `;

    let isRemoved = false;
    const removeToast = () => {
      if (isRemoved) return;
      isRemoved = true;
      toast.classList.add('hiding');
      setTimeout(() => toast.remove(), 300);
    };

    toast.onclick = removeToast;

    container.appendChild(toast);
    setTimeout(removeToast, 3500);
  }

  const INGREDIENTS = [
    { id: 'top-bun', name: 'Top Bun', category: 'bread', image: 'images/top-bun.png' },
    { id: 'bottom-bun', name: 'Bottom Bun', category: 'bread', image: 'images/bottom-bun.png' },
    { id: 'beef-patty', name: 'Beef Patty', category: 'patty', image: 'images/beef-patty.png' },
    { id: 'chicken-patty', name: 'Chicken Patty', category: 'patty', image: 'images/chicken-patty.png' },
    { id: 'fish-patty', name: 'Fish Patty', category: 'patty', image: 'images/fish-patty.png' },
    { id: 'hashbrown', name: 'Hashbrown', category: 'patty', image: 'images/hashbrown.png' },
    { id: 'fried-bacon', name: 'Fried Bacon', category: 'protein', image: 'images/fried-bacon.png' },
    { id: 'fried-egg', name: 'Fried Egg', category: 'protein', image: 'images/fried-egg.png' },
    { id: 'cheese', name: 'Cheese', category: 'protein', image: 'images/cheese.png' },
    { id: 'champignons', name: 'Champignons', category: 'vegetables', image: 'images/champignons.png' },
    { id: 'lettuce', name: 'Lettuce', category: 'vegetables', image: 'images/lettuce.png' },
    { id: 'tomato', name: 'Tomato', category: 'vegetables', image: 'images/tomato.png' },
    { id: 'pickles', name: 'Pickles', category: 'vegetables', image: 'images/pickles.png' },
    { id: 'red-onion', name: 'Red Onion', category: 'vegetables', image: 'images/red-onion.png' },
    { id: 'white-onion', name: 'White Onion', category: 'vegetables', image: 'images/white-onion.png' }
  ];

  const GRILLABLE_MENU_ITEMS = [
    { id: 'raw-beef-patty', cookedId: 'beef-patty', name: 'Beef Patty', category: 'patty', image: 'images/raw-beef-patty.png' },
    { id: 'raw-chicken-patty', cookedId: 'chicken-patty', name: 'Chicken Patty', category: 'patty', image: 'images/raw-chicken-patty.png' },
    { id: 'raw-fish-patty', cookedId: 'fish-patty', name: 'Fish Patty', category: 'patty', image: 'images/raw-fish-patty.png' },
    { id: 'raw-hashbrown', cookedId: 'hashbrown', name: 'Hashbrown', category: 'patty', image: 'images/raw-hashbrown.png' },
    { id: 'raw-bacon', cookedId: 'fried-bacon', name: 'Bacon', category: 'protein', image: 'images/raw-bacon.png' },
    { id: 'raw-egg', cookedId: 'fried-egg', name: 'Egg', category: 'protein', image: 'images/egg.png' },
    { id: 'raw-champignons', cookedId: 'champignons', name: 'Champignons', category: 'vegetables', image: 'images/raw-champignons.png' },
    { id: 'raw-cheese', cookedId: 'cheese', name: 'Cheese', category: 'protein', image: 'images/raw-cheese.png' }
  ];

  const COOKED_INVENTORY_ITEMS = [
    { id: 'beef-patty', name: 'Beef Patty', category: 'patty', image: 'images/beef-patty.png' },
    { id: 'chicken-patty', name: 'Chicken Patty', category: 'chicken-patty', image: 'images/chicken-patty.png' },
    { id: 'fish-patty', name: 'Fish Patty', category: 'patty', image: 'images/fish-patty.png' },
    { id: 'hashbrown', name: 'Hashbrown', category: 'patty', image: 'images/hashbrown.png' },
    { id: 'fried-bacon', name: 'Fried Bacon', category: 'protein', image: 'images/fried-bacon.png' },
    { id: 'fried-egg', name: 'Fried Egg', category: 'protein', image: 'images/fried-egg.png' },
    { id: 'cheese', name: 'Cheese', category: 'protein', image: 'images/cheese.png' },
    { id: 'champignons', name: 'Champignons', category: 'vegetables', image: 'images/champignons.png' }
  ];

  const BOARD_UNCUT_ITEMS = [
    { id: 'uncut-cheese', name: 'Cheese', category: 'protein', image: 'images/uncut-cheese.png' },
    { id: 'uncut-champignons', name: 'Champignons', category: 'vegetables', image: 'images/uncut-champignons.png' },
    { id: 'uncut-lettuce', name: 'Lettuce', category: 'vegetables', image: 'images/uncut-lettuce.png' },
    { id: 'uncut-tomato', name: 'Tomato', category: 'vegetables', image: 'images/uncut-tomato.png' },
    { id: 'uncut-pickles', name: 'Pickles', category: 'vegetables', image: 'images/uncut-pickles.png' },
    { id: 'uncut-red-onion', name: 'Red Onion', category: 'vegetables', image: 'images/uncut-red-onion.png' },
    { id: 'uncut-white-onion', name: 'White Onion', category: 'vegetables', image: 'images/uncut-white-onion.png' }
  ];

  const BOARD_SLICED_ITEMS = [
    { id: 'raw-cheese', name: 'Cheese', category: 'protein', image: 'images/raw-cheese.png' },
    { id: 'raw-champignons', name: 'Champignons', category: 'vegetables', image: 'images/raw-champignons.png' },
    { id: 'lettuce', name: 'Lettuce', category: 'vegetables', image: 'images/lettuce.png' },
    { id: 'tomato', name: 'Tomato', category: 'vegetables', image: 'images/tomato.png' },
    { id: 'pickles', name: 'Pickles', category: 'vegetables', image: 'images/pickles.png' },
    { id: 'red-onion', name: 'Red Onion', category: 'vegetables', image: 'images/red-onion.png' },
    { id: 'white-onion', name: 'White Onion', category: 'vegetables', image: 'images/white-onion.png' }
  ];

  const SAUCES = [
    { id: 'mayo', name: '⚪️ Mayo', image: 'images/sauce-mayo.png' },
    { id: 'ketchup', name: '🔴 Ketchup', image: 'images/sauce-ketchup.png' },
    { id: 'mustard', name: '🟡 Mustard', image: 'images/sauce-mustard.png' },
    { id: 'spicy', name: '🟠 Spicy', image: 'images/sauce-spicy.png' },
    { id: 'bbq', name: '🟤 BBQ', image: 'images/sauce-bbq.png' }
  ];

  function setupWheelScrollForContainer(tabsEl) {
    if (!tabsEl) return;
    tabsEl.addEventListener('wheel', (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        tabsEl.scrollLeft += e.deltaY;
      }
    }, { passive: false });
  }

  function renderCategoryTabs(activeCat, onSelectCb, hideBread = false, hidePatty = false) {
    let cats = [
      { id: 'all', label: 'All' },
      { id: 'bread', label: 'Bread' },
      { id: 'patty', label: 'Patty' },
      { id: 'protein', label: 'Protein' },
      { id: 'vegetables', label: 'Veg' }
    ];

    if (hideBread) {
      cats = cats.filter(c => c.id !== 'bread');
    }
    if (hidePatty) {
      cats = cats.filter(c => c.id !== 'patty');
    }

    const tabsId = `cat-tabs-${onSelectCb}`;
    let tabsHtml = `<div class="panel-category-tabs" id="${tabsId}">`;
    cats.forEach(c => {
      tabsHtml += `<button class="panel-tab-btn ${activeCat === c.id ? 'active' : ''}" onclick="window.handleTabClick('${onSelectCb}', '${c.id}')">${c.label}</button>`;
    });
    tabsHtml += `</div>`;

    setTimeout(() => {
      const tabsEl = document.getElementById(tabsId);
      if (tabsEl) {
        setupWheelScrollForContainer(tabsEl);
      }
    }, 0);

    return tabsHtml;
  }

  window.handleTabClick = function(cbName, catId) {
    const tabsEl = document.querySelector(`#cat-tabs-${cbName}`);
    const scrollPos = tabsEl ? tabsEl.scrollLeft : 0;

    if (cbName === 'setAssemblyCategory') window.setAssemblyCategory(catId, scrollPos);
    else if (cbName === 'setGrillRawCategory') window.setGrillRawCategory(catId, scrollPos);
    else if (cbName === 'setGrillCookedCategory') window.setGrillCookedCategory(catId, scrollPos);
    else if (cbName === 'setBoardUncutCategory') window.setBoardUncutCategory(catId, scrollPos);
    else if (cbName === 'setBoardSlicedCategory') window.setBoardSlicedCategory(catId, scrollPos);
    else if (cbName === 'switchRecipeCategory') window.switchRecipeCategory(catId, scrollPos);
  }

  window.setAssemblyCategory = function(cat, savedScroll = null) {
    assemblyActiveCategory = cat;
    renderIngredientsMenu(savedScroll);
  }

  window.setGrillRawCategory = function(cat, savedScroll = null) {
    grillRawActiveCategory = cat;
    renderGrillIngredientsMenu(savedScroll);
  }

  window.setGrillCookedCategory = function(cat, savedScroll = null) {
    grillCookedActiveCategory = cat;
    renderGrillCookedInventory(savedScroll);
  }

  window.setBoardUncutCategory = function(cat, savedScroll = null) {
    boardUncutActiveCategory = cat;
    renderBoardUncutMenu(savedScroll);
  }

  window.setBoardSlicedCategory = function(cat, savedScroll = null) {
    boardSlicedActiveCategory = cat;
    renderBoardSlicedInventory(savedScroll);
  }

  function renderIngredientsMenu(savedScroll = null) {
    if (currentScreen !== 'assembly') return;
    if (!rightPanel) return;
    const titleEl = rightPanel.querySelector('.panel-title');
    if (titleEl) titleEl.innerText = 'Ingredients';

    if (!ingredientsMenu) return;

    const currentTabsEl = document.getElementById('cat-tabs-setAssemblyCategory');
    const actualScroll = savedScroll !== null ? savedScroll : (currentTabsEl ? currentTabsEl.scrollLeft : 0);
    
    const filtered = assemblyActiveCategory === 'all' ? INGREDIENTS : INGREDIENTS.filter(i => i.category === assemblyActiveCategory);

    const tabsHtml = renderCategoryTabs(assemblyActiveCategory, 'setAssemblyCategory', false, false);
    
    let cardsHtml = `<div style="display:flex; flex-direction:column; gap:8px; overflow-y:auto; flex:1; min-height:0;">`;
    filtered.forEach(item => {
      const stock = ingredientStock[item.id] ?? 0;
      const isOut = currentGameMode !== 'sandbox' && stock <= 0;
      const countText = currentGameMode === 'sandbox' ? '∞' : `x${stock}`;

      cardsHtml += `
        <div class="ingredient-card ${currentBurger.length >= MAX_INGREDIENTS || isEating || isOut ? 'disabled' : ''}" onclick="handleAssemblyClick('${item.id}')">
          <img src="${item.image}" alt="${item.name}">
          <div class="ingredient-info-row">
            <span class="ingredient-name" title="${item.name}">${item.name}</span>
            <span class="ingredient-stock-count">${countText}</span>
          </div>
        </div>
      `;
    });
    cardsHtml += `</div>`;

    ingredientsMenu.innerHTML = tabsHtml + cardsHtml;

    requestAnimationFrame(() => {
      const tabsEl = document.getElementById('cat-tabs-setAssemblyCategory');
      if (tabsEl) {
        tabsEl.style.scrollBehavior = 'auto';
        tabsEl.scrollLeft = actualScroll;
        requestAnimationFrame(() => {
          tabsEl.scrollLeft = actualScroll;
          tabsEl.style.scrollBehavior = '';
        });
      }
    });
  }

  window.handleAssemblyClick = function(id) {
    if (isEating || isAddingInProgress) return;
    const item = INGREDIENTS.find(i => i.id === id);
    if (!item) return;
    const stock = ingredientStock[item.id] ?? 0;
    const isOut = currentGameMode !== 'sandbox' && stock <= 0;
    if (isOut) { showToast('Out of stock!', `Buy more ${item.name} in shop.`, 'warning'); return; }
    addIngredient(item);
  }

  function renderGrillIngredientsMenu(savedScroll = null) {
    if (currentScreen !== 'grill') return;
    if (!rightPanel) return;
    const titleEl = rightPanel.querySelector('.panel-title');
    const menuEl = rightPanel.querySelector('.ingredients-menu');
    if (!titleEl || !menuEl) return;

    titleEl.innerText = 'Raw Ingredients';

    const currentTabsEl = document.getElementById('cat-tabs-setGrillRawCategory');
    const actualScroll = savedScroll !== null ? savedScroll : (currentTabsEl ? currentTabsEl.scrollLeft : 0);
    
    const filtered = grillRawActiveCategory === 'all' ? GRILLABLE_MENU_ITEMS : GRILLABLE_MENU_ITEMS.filter(i => i.category === grillRawActiveCategory);

    const tabsHtml = renderCategoryTabs(grillRawActiveCategory, 'setGrillRawCategory', true, false);

    let cardsHtml = `<div style="display:flex; flex-direction:column; gap:8px; overflow-y:auto; flex:1; min-height:0;">`;
    filtered.forEach(item => {
      const stock = ingredientStock[item.id] ?? 0;
      const isOut = currentGameMode !== 'sandbox' && stock <= 0;
      const countText = currentGameMode === 'sandbox' ? '∞' : `x${stock}`;

      cardsHtml += `
        <div class="ingredient-card ${isOut ? 'disabled' : ''}" onclick="handleGrillAddClick('${item.id}')">
          <div class="ingredient-info-row">
            <img src="${item.image}" alt="${item.name}">
            <span class="ingredient-name" title="${item.name}">${item.name}</span>
          </div>
          <span class="ingredient-stock-count">${countText}</span>
        </div>
      `;
    });
    cardsHtml += `</div>`;

    menuEl.innerHTML = tabsHtml + cardsHtml;

    requestAnimationFrame(() => {
      const tabsEl = document.getElementById('cat-tabs-setGrillRawCategory');
      if (tabsEl) {
        tabsEl.style.scrollBehavior = 'auto';
        tabsEl.scrollLeft = actualScroll;
        requestAnimationFrame(() => {
          tabsEl.scrollLeft = actualScroll;
          tabsEl.style.scrollBehavior = '';
        });
      }
    });
  }

  window.handleGrillAddClick = function(id) {
    const stock = ingredientStock[id] ?? 0;
    const isOut = currentGameMode !== 'sandbox' && stock <= 0;
    if (isOut) { showToast('Out of stock!', `Buy more in shop.`, 'warning'); return; }
    addToGrill(id);
  }

  function renderGrillCookedInventory(savedScroll = null) {
    if (currentScreen !== 'grill') return;
    if (!leftPanel) return;
    const titleEl = leftPanel.querySelector('.panel-title');
    const listEl = leftPanel.querySelector('.layers-list');
    if (!titleEl || !listEl) return;

    titleEl.innerText = 'Cooked Ingredients';
    listEl.classList.remove('assembly-mode');

    const currentTabsEl = document.getElementById('cat-tabs-setGrillCookedCategory');
    const actualScroll = savedScroll !== null ? savedScroll : (currentTabsEl ? currentTabsEl.scrollLeft : 0);

    const filtered = grillCookedActiveCategory === 'all' ? COOKED_INVENTORY_ITEMS : COOKED_INVENTORY_ITEMS.filter(i => i.category === grillCookedActiveCategory);

    const tabsHtml = renderCategoryTabs(grillCookedActiveCategory, 'setGrillCookedCategory', true, false);
    let itemsContainerHtml = `<div style="display:flex; flex-direction:column; gap:6px; overflow-y:auto; flex:1; min-height:0;">`;

    filtered.forEach(item => {
      const stock = ingredientStock[item.id] ?? 0;
      itemsContainerHtml += `
        <div class="layer-item" style="justify-content: space-between; padding: 6px 10px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <img src="${item.image}" class="layer-preview">
            <span style="font-size: 0.75rem; color: var(--text-color);">${item.name}</span>
          </div>
          <span class="ingredient-stock-count">${currentGameMode === 'sandbox' ? '∞' : 'x' + stock}</span>
        </div>
      `;
    });
    itemsContainerHtml += `</div>`;

    listEl.innerHTML = tabsHtml + itemsContainerHtml;

    requestAnimationFrame(() => {
      const tabsEl = document.getElementById('cat-tabs-setGrillCookedCategory');
      if (tabsEl) {
        tabsEl.style.scrollBehavior = 'auto';
        tabsEl.scrollLeft = actualScroll;
        requestAnimationFrame(() => {
          tabsEl.scrollLeft = actualScroll;
          tabsEl.style.scrollBehavior = '';
        });
      }
    });
  }

  function renderBoardUncutMenu(savedScroll = null) {
    if (currentScreen !== 'board') return;
    if (!rightPanel) return;
    const titleEl = rightPanel.querySelector('.panel-title');
    const menuEl = rightPanel.querySelector('.ingredients-menu');
    if (!titleEl || !menuEl) return;

    titleEl.innerText = 'Uncut Ingredients';

    const currentTabsEl = document.getElementById('cat-tabs-setBoardUncutCategory');
    const actualScroll = savedScroll !== null ? savedScroll : (currentTabsEl ? currentTabsEl.scrollLeft : 0);
    
    const filtered = boardUncutActiveCategory === 'all' ? BOARD_UNCUT_ITEMS : BOARD_UNCUT_ITEMS.filter(i => i.category === boardUncutActiveCategory);

    const tabsHtml = renderCategoryTabs(boardUncutActiveCategory, 'setBoardUncutCategory', true, true);

    let cardsHtml = `<div style="display:flex; flex-direction:column; gap:8px; overflow-y:auto; flex:1; min-height:0;">`;
    filtered.forEach(item => {
      const stock = ingredientStock[item.id] ?? 0;
      const isOut = currentGameMode !== 'sandbox' && stock <= 0;
      const countText = currentGameMode === 'sandbox' ? '∞' : `x${stock}`;

      cardsHtml += `
        <div class="ingredient-card ${isOut ? 'disabled' : ''}" onclick="handleBoardAddClick('${item.id}')">
          <div class="ingredient-info-row">
            <img src="${item.image}" alt="${item.name}">
            <span class="ingredient-name" title="${item.name}">${item.name}</span>
          </div>
          <span class="ingredient-stock-count">${countText}</span>
        </div>
      `;
    });
    cardsHtml += `</div>`;

    menuEl.innerHTML = tabsHtml + cardsHtml;

    requestAnimationFrame(() => {
      const tabsEl = document.getElementById('cat-tabs-setBoardUncutCategory');
      if (tabsEl) {
        tabsEl.style.scrollBehavior = 'auto';
        tabsEl.scrollLeft = actualScroll;
        requestAnimationFrame(() => {
          tabsEl.scrollLeft = actualScroll;
          tabsEl.style.scrollBehavior = '';
        });
      }
    });
  }

  window.handleBoardAddClick = function(id) {
    const stock = ingredientStock[id] ?? 0;
    const isOut = currentGameMode !== 'sandbox' && stock <= 0;
    if (isOut) { showToast('Out of stock!', `Buy more in shop.`, 'warning'); return; }
    addToBoard(id);
  }

  function renderBoardSlicedInventory(savedScroll = null) {
    if (currentScreen !== 'board') return;
    if (!leftPanel) return;
    const titleEl = leftPanel.querySelector('.panel-title');
    const listEl = leftPanel.querySelector('.layers-list');
    if (!titleEl || !listEl) return;

    titleEl.innerText = 'Sliced Ingredients';
    listEl.classList.remove('assembly-mode');

    const currentTabsEl = document.getElementById('cat-tabs-setBoardSlicedCategory');
    const actualScroll = savedScroll !== null ? savedScroll : (currentTabsEl ? currentTabsEl.scrollLeft : 0);

    const filtered = boardSlicedActiveCategory === 'all' ? BOARD_SLICED_ITEMS : BOARD_SLICED_ITEMS.filter(i => i.category === boardSlicedActiveCategory);

    const tabsHtml = renderCategoryTabs(boardSlicedActiveCategory, 'setBoardSlicedCategory', true, true);
    let itemsContainerHtml = `<div style="display:flex; flex-direction:column; gap:6px; overflow-y:auto; flex:1; min-height:0;">`;

    filtered.forEach(item => {
      const stock = ingredientStock[item.id] ?? 0;
      itemsContainerHtml += `
        <div class="layer-item" style="justify-content: space-between; padding: 6px 10px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <img src="${item.image}" class="layer-preview">
            <span style="font-size: 0.75rem; color: var(--text-color);">${item.name}</span>
          </div>
          <span class="ingredient-stock-count">${currentGameMode === 'sandbox' ? '∞' : 'x' + stock}</span>
        </div>
      `;
    });
    itemsContainerHtml += `</div>`;

    listEl.innerHTML = tabsHtml + itemsContainerHtml;

    requestAnimationFrame(() => {
      const tabsEl = document.getElementById('cat-tabs-setBoardSlicedCategory');
      if (tabsEl) {
        tabsEl.style.scrollBehavior = 'auto';
        tabsEl.scrollLeft = actualScroll;
        requestAnimationFrame(() => {
          tabsEl.scrollLeft = actualScroll;
          tabsEl.style.scrollBehavior = '';
        });
      }
    });
  }

  function initBoardStructure() {
    const area = document.getElementById('boardCookingArea');
    if (!area) return;
    area.innerHTML = '';

    boardSlots.forEach((_, index) => {
      const slotEl = document.createElement('div');
      slotEl.className = 'grill-slot';
      slotEl.dataset.index = index;
      
      slotEl.onclick = () => {
        if (isBinSelectMode) {
          toggleBoardSlotSelectionForBin(index);
        } else {
          handleBoardSlotClick(index);
        }
      };
      area.appendChild(slotEl);
    });
  }

  function addToBoard(uncutId) {
    const emptyIndex = boardSlots.findIndex(slot => slot === null);
    if (emptyIndex === -1) {
      showToast('Board is full!', '', 'warning');
      return;
    }

    if (currentGameMode !== 'sandbox') {
      ingredientStock[uncutId] = (ingredientStock[uncutId] ?? 0) - 1;
      saveStock();
    }

    boardSlots[emptyIndex] = {
      uncutId: uncutId,
      state: 'uncut',
      startTime: null,
      notified: false
    };

    playSound(SOUNDS.ingridients);
    saveBoardState();
    renderBoardUncutMenu();
    renderBoard();
  }

  function startCuttingSlot(index) {
    const slot = boardSlots[index];
    if (!slot || slot.state !== 'uncut') return;

    slot.state = 'cutting';
    slot.startTime = Date.now();
    
    if (cuttingAudioInstance) {
      try {
        cuttingAudioInstance.pause();
        cuttingAudioInstance.currentTime = 0;
      } catch(e) {}
      cuttingAudioInstance = null;
    }

    if (SOUNDS.cutting) {
      cuttingAudioInstance = SOUNDS.cutting;
      cuttingAudioInstance.loop = false;
      cuttingAudioInstance.onended = () => {
        cuttingAudioInstance = null;
      };
      playSound(cuttingAudioInstance);
    } else {
      playSound(SOUNDS.chop);
    }

    saveBoardState();
    renderBoard();
  }

  function manageCuttingAudio(hasActiveCutting) {
    if (!hasActiveCutting && cuttingAudioInstance) {
      try { 
        cuttingAudioInstance.pause(); 
        cuttingAudioInstance.currentTime = 0; 
      } catch(e){}
      cuttingAudioInstance = null;
    }
  }

  function updateBoardLogic() {
    const now = Date.now();
    let needsSave = false;

    boardSlots.forEach((slot) => {
      if (!slot) return;
      if (slot.state === 'cutting') {
        const config = CUTTABLE_ITEMS[slot.uncutId];
        const elapsed = (now - slot.startTime) / 1000;

        if (elapsed >= config.cutTime) {
          slot.state = 'ready';
          if (!slot.notified) {
            playSound(SOUNDS.complete);
            slot.notified = true;
          }
          needsSave = true;
        }
      }
    });

    if (needsSave) {
      saveBoardState();
    }
  }

  function getBoardSlotProgress(slot) {
    if (!slot || slot.state !== 'cutting') return 0;
    const config = CUTTABLE_ITEMS[slot.uncutId];
    const now = Date.now();
    const elapsed = (now - slot.startTime) / 1000;
    return Math.min(100, (elapsed / config.cutTime) * 100);
  }

  function handleBoardSlotClick(index) {
    const slot = boardSlots[index];
    if (!slot) return;
    const config = CUTTABLE_ITEMS[slot.uncutId];

    if (slot.state === 'uncut') {
      startCuttingSlot(index);
    } else if (slot.state === 'ready') {
      ingredientStock[config.slicedId] = (ingredientStock[config.slicedId] ?? 0) + 3;
      saveStock();
      showToast('Added x3 to inventory!', `${config.name} (x3) added to backpack.`, 'success');
      playSound(SOUNDS.buttons);
      
      boardSlots[index] = null;
      saveBoardState();
      renderBoardSlicedInventory();
      renderBoard();
    }
  }

  function renderBoard() {
    updateBoardLogic();
    if (currentScreen !== 'board') return;

    const area = document.getElementById('boardCookingArea');
    if (!area || area.children.length !== boardSlots.length) {
      initBoardStructure();
    }

    const slotElements = area.querySelectorAll('.grill-slot');

    boardSlots.forEach((slotData, index) => {
      const slotEl = slotElements[index];
      if (!slotEl) return;

      slotEl.className = `grill-slot ${selectedBoardIndicesForBin.includes(index) ? 'selected-for-bin' : ''}`;

      if (slotData) {
        const config = CUTTABLE_ITEMS[slotData.uncutId];
        let imgsrc = config.rawImage;
        let extraHtml = '';

        if (slotData.state === 'uncut') {
          imgsrc = config.rawImage;
          extraHtml = `<div class="flip-badge" style="background:#8d6e63; color:#fff;">Chop!</div>`;
        } else if (slotData.state === 'cutting') {
          imgsrc = config.rawImage;
        } else if (slotData.state === 'ready') {
          slotEl.innerHTML = `
            <div style="position:relative; width:100px; height:105px; display:flex; align-items:center; justify-content:center;">
              <img src="${config.slicedImage}" style="width:60px; height:60px; position:absolute; transform: translate(-18px, -12px) rotate(-15deg); object-fit:contain;">
              <img src="${config.slicedImage}" style="width:60px; height:60px; position:absolute; transform: translate(18px, -12px) rotate(15deg); object-fit:contain;">
              <img src="${config.slicedImage}" style="width:60px; height:60px; position:absolute; transform: translate(0px, 12px); object-fit:contain;">
              <div class="flip-badge" style="background:#689f38; color:#fff; top:-4px; right:-4px;">x3 Collect</div>
            </div>
            <div class="grill-progress-container" style="visibility:hidden;"></div>
          `;
          return;
        }

        const progressPercent = getBoardSlotProgress(slotData);
        const progressHtml = slotData.state === 'uncut' ? '<div class="grill-progress-container" style="visibility:hidden;"></div>' : `
          <div class="grill-progress-container">
            <div class="grill-progress-bar" style="width: ${progressPercent}%"></div>
          </div>
        `;

        slotEl.innerHTML = `
          ${extraHtml}
          <div class="grill-item-wrapper">
            <img src="${imgsrc}" class="grill-item">
          </div>
          ${progressHtml}
        `;
      } else {
        slotEl.innerHTML = '';
      }
    });
  }

  const knifeBtn = document.getElementById('knifeBtn');
  if (knifeBtn) {
    knifeBtn.onclick = () => {
      playSound(SOUNDS.buttons);
      boardSlots.forEach((slot, idx) => {
        if (slot && slot.state === 'uncut') {
          startCuttingSlot(idx);
        }
      });
    };
  }

  setInterval(() => {
    updateBoardLogic();
    if (currentScreen === 'board') {
      renderBoard();
    }
  }, 50);

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

    const now = Date.now();

    grillSlots[emptyIndex] = {
      rawId: rawId,
      state: 'cooking',
      startTime: now,
      flipStartTime: null,
      burnStartTime: null,
      isFlipped: false,
      notified: false
    };

    playSound(SOUNDS.ingridients);
    saveGrillState();
    renderGrillIngredientsMenu();
    renderGrill();
  }

  function updateGrillLogic() {
    const now = Date.now();
    let needsSave = false;

    grillSlots.forEach((slot) => {
      if (!slot) return;
      const config = GRILLABLE_ITEMS[slot.rawId];
      const elapsed = (now - slot.startTime) / 1000;
      const halfTime = config.cookTime / 2;

      if (slot.state === 'cooking' && !slot.isFlipped) {
        if (config.needsFlip) {
          if (elapsed >= halfTime) {
            slot.state = 'needsFlip';
            slot.burnStartTime = now;
            if (!slot.notified) {
              playSound(SOUNDS.complete);
              slot.notified = true;
            }
            needsSave = true;
          }
        } else {
          if (elapsed >= config.cookTime) {
            slot.state = 'ready';
            slot.burnStartTime = now;
            if (!slot.notified) {
              playSound(SOUNDS.complete);
              slot.notified = true;
            }
            needsSave = true;
          }
        }
      } else if (slot.state === 'needsFlip') {
        const burnElapsed = (now - slot.burnStartTime) / 1000;
        if (burnElapsed >= config.burnTime) {
          slot.state = 'charred';
          playSound(SOUNDS.burnt);
          showToast('Burnt!', `${config.name} turned into charcoal!`, 'error');
          needsSave = true;
        }
      } else if (slot.isFlipped && slot.state === 'cooking') {
        const activeElapsed = (now - slot.flipStartTime) / 1000;
        if (activeElapsed >= halfTime) {
          slot.state = 'ready';
          slot.burnStartTime = now;
          if (!slot.notified) {
            playSound(SOUNDS.complete);
            slot.notified = true;
          }
          needsSave = true;
        }
      } else if (slot.state === 'ready') {
        const burnElapsed = slot.burnStartTime ? (now - slot.burnStartTime) / 1000 : 0;
        if (burnElapsed >= config.burnTime) {
          slot.state = 'charred';
          playSound(SOUNDS.burnt);
          showToast('Burnt!', `${config.name} turned into charcoal!`, 'error');
          needsSave = true;
        }
      }
    });

    if (needsSave) {
      saveGrillState();
    }
  }

  function getSlotProgress(slot) {
    if (!slot) return 0;
    const config = GRILLABLE_ITEMS[slot.rawId];
    const now = Date.now();
    const elapsed = (now - slot.startTime) / 1000;
    const halfTime = config.cookTime / 2;

    if (!config.needsFlip) {
      if (slot.state === 'ready') {
        const burnElapsed = slot.burnStartTime ? (now - slot.burnStartTime) / 1000 : 0;
        return Math.max(0, 100 - (burnElapsed / config.burnTime) * 100);
      }
      return Math.min(100, (elapsed / config.cookTime) * 100);
    }

    if (slot.state === 'cooking' && !slot.isFlipped) {
      return Math.min(100, (elapsed / halfTime) * 100);
    } else if (slot.state === 'needsFlip') {
      const burnElapsed = slot.burnStartTime ? (now - slot.burnStartTime) / 1000 : 0;
      return Math.max(0, 100 - (burnElapsed / config.burnTime) * 100);
    } else if (slot.isFlipped) {
      const activeElapsed = (now - slot.flipStartTime) / 1000;
      if (slot.state === 'ready') {
        const burnElapsed = slot.burnStartTime ? (now - slot.burnStartTime) / 1000 : 0;
        return Math.max(0, 100 - (burnElapsed / config.burnTime) * 100);
      }
      return Math.min(100, (activeElapsed / halfTime) * 100);
    } else if (slot.state === 'charred') {
      return 0;
    }
    return 0;
  }

  function initGrillStructure() {
    const area = document.getElementById('grillCookingArea');
    if (!area) return;
    area.innerHTML = '';

    grillSlots.forEach((_, index) => {
      const slotEl = document.createElement('div');
      slotEl.className = 'grill-slot';
      slotEl.dataset.index = index;
      
      slotEl.onclick = () => {
        if (isBinSelectMode) {
          toggleGrillSlotSelectionForBin(index);
        } else {
          handleGrillSlotClick(index);
        }
      };
      area.appendChild(slotEl);
    });
  }

  function renderGrill() {
    updateGrillLogic();
    if (currentScreen !== 'grill') return;

    const area = document.getElementById('grillCookingArea');
    if (!area || area.children.length !== grillSlots.length) {
      initGrillStructure();
    }

    let hasActiveCooking = false;
    const slotElements = area.querySelectorAll('.grill-slot');

    grillSlots.forEach((slotData, index) => {
      const slotEl = slotElements[index];
      if (!slotEl) return;

      slotEl.className = `grill-slot ${selectedGrillIndicesForBin.includes(index) ? 'selected-for-bin' : ''}`;

      if (slotData) {
        if (slotData.state !== 'charred') {
          hasActiveCooking = true;
        }
        const config = GRILLABLE_ITEMS[slotData.rawId];
        let imgsrc = config.rawImage;
        let extraHtml = '';

        if (slotData.state === 'cooking') {
          imgsrc = slotData.isFlipped ? config.flip2Image : config.rawImage;
        } else if (slotData.state === 'needsFlip') {
          imgsrc = config.flip1Image;
          extraHtml = `<div class="flip-badge">Flip!</div>`;
        } else if (slotData.state === 'ready' || slotData.state === 'burning') {
          imgsrc = config.cookedImage;
          extraHtml = `<div class="flip-badge" style="background:#689f38; color:#fff;">Collect!</div>`;
        } else if (slotData.state === 'charred') {
          imgsrc = config.cookedImage;
        }

        const progressPercent = getSlotProgress(slotData);
        const isBurningBar = slotData.state === 'ready' || slotData.state === 'needsFlip';

        const progressHtml = slotData.state === 'charred' ? '' : `
          <div class="grill-progress-container">
            <div class="grill-progress-bar ${isBurningBar ? 'burning' : ''}" style="width: ${progressPercent}%"></div>
          </div>
        `;

        slotEl.innerHTML = `
          ${extraHtml}
          <div class="grill-item-wrapper">
            <img src="${imgsrc}" class="grill-item ${slotData.state === 'charred' ? 'charred' : ''}">
            <div class="oil-splash-container" id="splash-container-${index}"></div>
          </div>
          ${progressHtml}
        `;

        if (Math.random() < 0.35 && slotData.state !== 'charred') {
          const splashContainer = slotEl.querySelector('.oil-splash-container');
          if (splashContainer) {
            const splash = document.createElement('div');
            splash.className = 'oil-splash';
            
            const randomX = Math.random() * 80 + 10;
            splash.style.left = `${randomX}%`;
            
            const dy = -Math.random() * 20 - 5;
            splash.style.setProperty('--dy', `${dy}px`);
            
            splashContainer.appendChild(splash);
            setTimeout(() => splash.remove(), 500);
          }
        }
      } else {
        slotEl.innerHTML = '';
      }
    });

    manageSizzlingAudio(hasActiveCooking);
  }

  function manageSizzlingAudio(hasActive) {
    if (hasActive) {
      if (!sizzlingAudioInstance && SOUNDS.sizzling) {
        sizzlingAudioInstance = SOUNDS.sizzling;
        sizzlingAudioInstance.loop = true;
        playSound(sizzlingAudioInstance);
      }
    } else {
      if (sizzlingAudioInstance) {
        try { sizzlingAudioInstance.pause(); sizzlingAudioInstance.currentTime = 0; } catch(e){}
        sizzlingAudioInstance = null;
      }
    }
  }

  function handleGrillSlotClick(index) {
    const slot = grillSlots[index];
    if (!slot) return;
    const config = GRILLABLE_ITEMS[slot.rawId];
    const now = Date.now();

    if (slot.state === 'needsFlip' && config.needsFlip && !slot.isFlipped) {
      slot.isFlipped = true;
      slot.state = 'cooking';
      slot.flipStartTime = now;
      slot.burnStartTime = null;
      slot.notified = false;
      playSound(SOUNDS.buttons);
      saveGrillState();
      renderGrill();
    } else if (slot.state === 'ready') {
      ingredientStock[config.cookedId] = (ingredientStock[config.cookedId] ?? 0) + 1;
      saveStock();
      showToast('Added to inventory!', `${config.name} added to backpack.`, 'success');
      playSound(SOUNDS.buttons);
      
      grillSlots[index] = null;
      saveGrillState();
      renderGrillCookedInventory();
      renderGrill();
    }
  }

  setInterval(() => {
    updateGrillLogic();
    if (currentScreen === 'grill') {
      renderGrill();
    }
  }, 50);

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
  const forceOrderBtn = document.getElementById('forceOrderBtn');
  const skipOrderBtn = document.getElementById('skipOrderBtn');

  const SHOP_ITEMS = [
    { id: 'top-bun', name: 'Top Bun', category: 'bread', image: 'images/top-bun.png' },
    { id: 'bottom-bun', name: 'Bottom Bun', category: 'bread', image: 'images/bottom-bun.png' },
    
    { id: 'raw-beef-patty', name: 'Beef Patty (Raw)', category: 'patty', image: 'images/raw-beef-patty.png' },
    { id: 'raw-chicken-patty', name: 'Chicken Patty (Raw)', category: 'patty', image: 'images/raw-chicken-patty.png' },
    { id: 'raw-fish-patty', name: 'Fish Patty (Raw)', category: 'patty', image: 'images/raw-fish-patty.png' },
    { id: 'raw-hashbrown', name: 'Hashbrown (Raw)', category: 'patty', image: 'images/raw-hashbrown.png' },
    
    { id: 'raw-bacon', name: 'Bacon (Raw)', category: 'protein', image: 'images/raw-bacon.png' },
    { id: 'raw-egg', name: 'Egg (Raw)', category: 'protein', image: 'images/egg.png' },
    
    { id: 'uncut-cheese', name: 'Cheese (Uncut)', category: 'protein', image: 'images/uncut-cheese.png' },
    { id: 'uncut-champignons', name: 'Champignons (Uncut)', category: 'vegetables', image: 'images/uncut-champignons.png' },
    { id: 'uncut-lettuce', name: 'Lettuce (Uncut)', category: 'vegetables', image: 'images/uncut-lettuce.png' },
    { id: 'uncut-tomato', name: 'Tomato (Uncut)', category: 'vegetables', image: 'images/uncut-tomato.png' },
    { id: 'uncut-pickles', name: 'Pickles (Uncut)', category: 'vegetables', image: 'images/uncut-pickles.png' },
    { id: 'uncut-red-onion', name: 'Red Onion (Uncut)', category: 'vegetables', image: 'images/uncut-red-onion.png' },
    { id: 'uncut-white-onion', name: 'White Onion (Uncut)', category: 'vegetables', image: 'images/uncut-white-onion.png' },

    { id: 'mayo', name: 'Mayo', category: 'sauce', image: 'images/sauce-mayo.png', isSauce: true },
    { id: 'ketchup', name: 'Ketchup', category: 'sauce', image: 'images/sauce-ketchup.png', isSauce: true },
    { id: 'mustard', name: 'Mustard', category: 'sauce', image: 'images/sauce-mustard.png', isSauce: true },
    { id: 'spicy', name: 'Spicy', category: 'sauce', image: 'images/sauce-spicy.png', isSauce: true },
    { id: 'bbq', name: 'BBQ', category: 'sauce', image: 'images/sauce-bbq.png', isSauce: true }
  ];

  const inventoryModal = document.getElementById('inventoryModal');
  const openInventoryBtn = document.getElementById('openInventoryBtn');
  const closeInventoryModal = document.getElementById('closeInventoryModal');

  const shopModal = document.getElementById('shopModal');
  const openShopBtn = document.getElementById('openShopBtn');
  const closeShopModal = document.getElementById('closeShopModal');

  const recipesModal = document.getElementById('recipesModal');
  const openRecipesBtn = document.getElementById('openRecipesBtn');
  const closeRecipesModal = document.getElementById('closeRecipesModal');

  const achievementsModal = document.getElementById('achievementsModal');
  const openAchievementsBtn = document.getElementById('openAchievementsBtn');
  const closeAchievementsModal = document.getElementById('closeAchievementsModal');

  const settingsModal = document.getElementById('settingsModal');
  const openSettingsBtn = document.getElementById('openSettingsBtn');
  const closeSettingsModal = document.getElementById('closeSettingsModal');

  let activeInventoryTab = 'all';
  window.switchInventoryTab = function(tab) {
    activeInventoryTab = tab;
    document.querySelectorAll('#inventoryTabs .recipe-tab').forEach(t => {
      t.classList.toggle('active', t.innerText.toLowerCase() === tab);
    });
    renderInventoryModal();
  }

  function renderInventoryModal() {
    const body = document.getElementById('inventoryModalBody');
    if (!body) return;
    body.innerHTML = '';
    const filtered = activeInventoryTab === 'all' ? SHOP_ITEMS : SHOP_ITEMS.filter(i => i.category === activeInventoryTab);

    filtered.forEach(item => {
      const stockVal = currentGameMode === 'sandbox' ? '∞' : (ingredientStock[item.id] ?? 0);
      const isZero = stockVal === 0 || stockVal === '0';
      const card = document.createElement('div');
      card.className = `inventory-item-card ${isZero ? 'zero-stock' : ''}`;
      card.innerHTML = `
        <div class="inventory-item-info">
          <img src="${item.image}" alt="${item.name}">
          <div class="inventory-item-details">
            <h4>${item.name}</h4>
          </div>
        </div>
        <div class="inventory-right-group">
          <button class="btn-buy-more" onclick="openShopForCategory('${item.category}')">Buy more</button>
          <div class="inventory-count-badge">${stockVal}</div>
        </div>
      `;
      body.appendChild(card);
    });
  }

  window.openShopForCategory = function(category) {
    playSound(SOUNDS.buttons);
    inventoryModal.classList.remove('open');
    updateShopBalanceHeader();
    renderShopModal();
    switchShopTab(category);
    shopModal.classList.add('open');
  }

  if (openInventoryBtn) {
    openInventoryBtn.onclick = () => {
      playSound(SOUNDS.buttons);
      renderInventoryModal();
      if (inventoryModal) inventoryModal.classList.add('open');
    };
  }

  if (closeInventoryModal) {
    closeInventoryModal.onclick = () => {
      playSound(SOUNDS.buttons);
      if (inventoryModal) inventoryModal.classList.remove('open');
    };
  }

  const allModals = [
    { modal: recipesModal, closeBtn: closeRecipesModal },
    { modal: shopModal, closeBtn: closeShopModal },
    { modal: inventoryModal, closeBtn: closeInventoryModal },
    { modal: achievementsModal, closeBtn: closeAchievementsModal },
    { modal: settingsModal, closeBtn: closeSettingsModal }
  ];

  allModals.forEach(item => {
    if (!item.modal) return;
    item.modal.addEventListener('click', (e) => {
      if (e.target === item.modal) {
        playSound(SOUNDS.buttons);
        item.modal.classList.remove('open');
      }
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      allModals.forEach(item => {
        if (item.modal && item.modal.classList.contains('open')) {
          playSound(SOUNDS.buttons);
          item.modal.classList.remove('open');
        }
      });
    }
  });

  function updateActionButtonsVisibility() {
    const isGrill = currentScreen === 'grill';
    const isBoard = currentScreen === 'board';
    const isSpecialScreen = isGrill || isBoard;
    if (squeezeBtn) squeezeBtn.style.display = isSpecialScreen ? 'none' : 'flex';

    const currentSpeed = getCurrentSpeed();
    const isNoOrders = currentSpeed === 'no-orders';
    const isSandboxOrCasual = currentGameMode === 'sandbox' || currentGameMode === 'casual';

    if (eatBtn) {
      if (isSpecialScreen || currentGameMode === 'turbo') {
        eatBtn.style.display = 'none';
      } else if (isSandboxOrCasual) {
        eatBtn.style.display = isNoOrders ? 'flex' : 'none';
      } else {
        eatBtn.style.display = 'flex';
      }
    }

    if (submitOrderBtn) {
      submitOrderBtn.style.display = (isSpecialScreen || isNoOrders) ? 'none' : 'flex';
    }

    if (forceOrderBtn) {
      if (isSpecialScreen || currentGameMode === 'turbo') {
        forceOrderBtn.style.display = 'none';
      } else {
        forceOrderBtn.style.display = 'flex';
      }
    }

    if (skipOrderBtn) {
      skipOrderBtn.style.display = isSpecialScreen ? 'none' : 'flex';
    }
    if (knifeBtn) {
      knifeBtn.style.display = isBoard ? 'flex' : 'none';
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
        if (speed === 'turbo' && mode === 'turbo') {
          currentTurboTimeLeft = 180;
          triggerRandomOrder();
        } else if (speed === 'turbo') {
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
      } else if (speed === 'turbo') {
        if(topWidget) topWidget.classList.remove('hidden');
        if (!currentActiveOrder) triggerRandomOrder();
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
    if (currentScreen === 'grill') {
      renderGrillIngredientsMenu();
      renderGrillCookedInventory();
      renderGrill();
    } else if (currentScreen === 'board') {
      renderBoardUncutMenu();
      renderBoardSlicedInventory();
    }
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
      } else if (newSpeed === 'turbo') {
        if (topWidget) topWidget.classList.remove('hidden');
        triggerRandomOrder();
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
      case 'turbo': return 0;
      case 'super-fast': return Math.floor(Math.random() * 20) + 10;
      case 'fast': return Math.floor(Math.random() * 30) + 30;
      case 'medium': return Math.floor(Math.random() * 180) + 120;
      case 'slow': return Math.floor(Math.random() * 300) + 300;
      case 'super-slow': return Math.floor(Math.random() * 900) + 900;
      default: return 300;
    }
  }

  const ITEM_IMAGES = {
    'top-bun': 'images/top-bun.png', 'bottom-bun': 'images/bottom-bun.png',
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
    { name: 'Classic Burger', category: 'beef', ids: ['bottom-bun', 'beef-patty', 'top-bun'] },
    { name: 'Cheeseburger', category: 'beef', ids: ['bottom-bun', 'beef-patty', 'cheese', 'top-bun'] },
    { name: 'Vegan Burger', category: 'vegan', ids: ['bottom-bun', 'hashbrown', 'lettuce', 'tomato', 'red-onion', 'top-bun'] },
    { name: 'Juicy Burger', category: 'chicken', ids: ['bottom-bun', 'mayo', 'chicken-patty', 'cheese', 'tomato', 'ketchup', 'top-bun'] },
    { name: 'Breakfast Burger', category: 'egg', ids: ['bottom-bun', 'mayo', 'beef-patty', 'fried-egg', 'fried-bacon', 'top-bun'] },
    { name: 'Mushroom Burger', category: 'beef', ids: ['bottom-bun', 'bbq', 'beef-patty', 'champignons', 'top-bun'] },
    { name: 'Chicken Burger', category: 'chicken', ids: ['bottom-bun', 'chicken-patty', 'mayo', 'pickles', 'top-bun'] },
    { name: 'Double Burger', category: 'beef', ids: ['bottom-bun', 'beef-patty', 'cheese', 'beef-patty', 'ketchup', 'top-bun'] },
    { name: 'Chicken Delux', category: 'chicken', ids: ['bottom-bun', 'mayo', 'chicken-patty', 'cheese', 'tomato', 'lettuce', 'pickles', 'top-bun'] },
    { name: 'Stinky Burger', category: 'chicken', ids: ['bottom-bun', 'mustard', 'chicken-patty', 'white-onion', 'cheese', 'red-onion', 'mustard', 'top-bun'] },
    { name: 'Fish Burger', category: 'fish', ids: ['bottom-bun', 'fish-patty', 'mayo', 'pickles', 'lettuce', 'top-bun'] },
    { name: 'Potato Burger', category: 'hashbrown', ids: ['bottom-bun', 'hashbrown', 'cheese', 'pickles', 'top-bun'] },
    { name: 'Egg Burger', category: 'egg', ids: ['bottom-bun', 'fried-egg', 'cheese', 'top-bun'] },
    { name: 'Breakfast Melt', category: 'vegetarian', ids: ['bottom-bun', 'ketchup', 'hashbrown', 'cheese', 'fried-egg', 'top-bun'] }
  ];

  const SECRET_ACHIEVEMENTS = [
    { id: 'cheeseburgerAch', title: 'Cheezeburger', category: 'secret', desc: 'Ideal Roblox burger', sound: 'cheeseburger', ids: ['bottom-bun', 'beef-patty', 'cheese', 'top-bun'] },
    { id: 'tomatonatorAch', title: 'Tomatonator', category: 'secret', desc: 'If you don\'t like tomatoes why you even eat burgers?', sound: 'tomatonator', ids: ['bottom-bun', 'beef-patty', 'cheese', 'tomato', 'tomato', 'tomato', 'top-bun'] },
    { id: 'lilypadAch', title: 'Lilypad', category: 'secret', desc: 'Straight from the swamp', sound: 'lilypad', ids: ['bottom-bun', 'beef-patty', 'cheese', 'lettuce', 'lettuce', 'top-bun'] },
    { id: 'saturnBurgerAch', title: 'Saturn Burger', category: 'secret', desc: 'Saturn has the most moons of any planet in the solar system.', sound: 'saturnBurger', ids: ['bottom-bun', 'beef-patty', 'white-onion', 'top-bun'] },
    { id: 'bustanatorAch', title: 'Bustanator', category: 'secret', desc: 'I know you like this one', sound: 'bustanator', ids: ['bottom-bun', 'beef-patty', 'mayo', 'mayo', 'mayo', 'top-bun'] },
    { id: 'mcPicklePounderAch', title: 'McPickle Pounder', category: 'secret', desc: 'You\'re probably the kind of people who would eat a pickle tiramisu', sound: 'mcPicklePounder', ids: ['bottom-bun', 'beef-patty', 'cheese', 'pickles', 'pickles', 'pickles', 'top-bun'] }
  ];

  function unlockAchievement(ach) {
    if (!unlockedAchievements[ach.id]) {
      unlockedAchievements[ach.id] = true;
      localStorage.setItem('unlocked_achievements', JSON.stringify(unlockedAchievements));
      showToast(ach.title, 'Secret recipe unlocked!', 'success');
      playSound(SOUNDS[ach.sound] || SOUNDS.achievement);
    }
  }

  let activeRecipeCategory = 'all';

  window.switchRecipeCategory = function(cat, savedScroll = null) {
    activeRecipeCategory = cat;
    renderRecipesModal(savedScroll);
  }

  function itemMatchesRecipeCategory(item, cat) {
    if (cat === 'all') return true;
    const ids = item.ids;
    
    const hasBeef = ids.includes('beef-patty');
    const hasChicken = ids.includes('chicken-patty');
    const hasFish = ids.includes('fish-patty');
    const hasHashbrown = ids.includes('hashbrown');
    const hasEgg = ids.includes('fried-egg');
    const hasBacon = ids.includes('fried-bacon');

    if (cat === 'beef') {
      return (item.category === 'beef' || hasBeef) && !hasChicken && !hasFish;
    }
    if (cat === 'chicken') {
      return item.category === 'chicken' || hasChicken;
    }
    if (cat === 'fish') {
      return item.category === 'fish' || hasFish;
    }
    if (cat === 'hashbrown') {
      return hasHashbrown && !hasBeef && !hasChicken && !hasFish && !hasEgg;
    }
    if (cat === 'egg') {
      return hasEgg && !hasBeef && !hasChicken && !hasFish && !hasHashbrown;
    }
    if (cat === 'vegetarian') {
      return !hasBeef && !hasChicken && !hasFish && !hasBacon;
    }
    if (cat === 'vegan') {
      const animalOrProhibited = ['beef-patty', 'chicken-patty', 'fish-patty', 'fried-egg', 'fried-bacon', 'cheese', 'mayo', 'spicy'];
      return !ids.some(id => animalOrProhibited.includes(id));
    }
    if (cat === 'secret') {
      return SECRET_ACHIEVEMENTS.some(ach => (ach.title === item.name || ach.title === item.title) && unlockedAchievements[ach.id]);
    }

    return item.category === cat;
  }

  function renderRecipesModal(savedScroll = null) {
    const body = document.getElementById('recipesModalBody');
    if (!body) return;

    const currentRecipeTabsEl = document.getElementById('recipe-cats-container');
    const actualScroll = savedScroll !== null ? savedScroll : (currentRecipeTabsEl ? currentRecipeTabsEl.scrollLeft : 0);

    const cats = [
      { id: 'all', label: 'All' },
      { id: 'beef', label: 'Beef' },
      { id: 'chicken', label: 'Chicken' },
      { id: 'fish', label: 'Fish' },
      { id: 'hashbrown', label: 'Hashbrown' },
      { id: 'egg', label: 'Egg' },
      { id: 'vegetarian', label: 'Vegetarian' },
      { id: 'vegan', label: 'Vegan' },
      { id: 'secret', label: 'Secret' }
    ];

    let tabsHtml = `<div class="recipe-tabs" id="recipe-cats-container">`;
    cats.forEach(c => {
      tabsHtml += `<button class="recipe-tab ${activeRecipeCategory === c.id ? 'active' : ''}" onclick="window.handleTabClick('switchRecipeCategory', '${c.id}')">${c.label}</button>`;
    });
    tabsHtml += `</div>`;

    setTimeout(() => {
      const recipeTabsEl = document.getElementById('recipe-cats-container');
      if (recipeTabsEl) {
        setupWheelScrollForContainer(recipeTabsEl);
      }
    }, 0);

    let itemsHtml = '';

    const combinedList = [
      ...REGULAR_RECIPES.map(r => ({ ...r, isSecret: false })),
      ...SECRET_ACHIEVEMENTS.map(a => ({ ...a, name: a.title, isSecret: true }))
    ];

    const filteredItems = combinedList.filter(item => {
      if (item.isSecret && !unlockedAchievements[item.id]) return false;
      return itemMatchesRecipeCategory(item, activeRecipeCategory);
    });

    filteredItems.forEach(item => {
      let iconsHtml = '';
      item.ids.forEach(id => { if (ITEM_IMAGES[id]) iconsHtml += `<img src="${ITEM_IMAGES[id]}" title="${id}">`; });
      itemsHtml += `
        <div class="recipe-card">
          <div class="recipe-info"><h4>${item.name}</h4><div class="recipe-visual">${iconsHtml}</div></div>
          <button class="btn-pin ${pinnedBurger && pinnedBurger.name === item.name ? 'pinned' : ''}" onclick="pinRecipe('${item.name}')">📌</button>
        </div>
      `;
    });

    if (activeRecipeCategory === 'all' || activeRecipeCategory === 'secret') {
      SECRET_ACHIEVEMENTS.forEach(ach => {
        if (!unlockedAchievements[ach.id]) {
          itemsHtml += `
            <div class="recipe-card locked">
              <div class="recipe-info" style="flex:1;"><h4>${ach.title}</h4><p style="font-size:0.75rem; opacity:0.6;">Secret recipe locked...</p></div>
            </div>
          `;
        }
      });
    }

    body.innerHTML = tabsHtml + `<div class="recipe-list-container" style="display:flex; flex-direction:column; gap:8px; min-height: 320px;">${itemsHtml}</div>`;

    requestAnimationFrame(() => {
      const recipeTabsEl = document.getElementById('recipe-cats-container');
      if (recipeTabsEl) {
        recipeTabsEl.style.scrollBehavior = 'auto';
        recipeTabsEl.scrollLeft = actualScroll;
        requestAnimationFrame(() => {
          recipeTabsEl.scrollLeft = actualScroll;
          recipeTabsEl.style.scrollBehavior = '';
        });
      }
    });
  }

  window.pinRecipe = function(name) {
    let found = REGULAR_RECIPES.find(r => r.name === name);
    if (!found) found = SECRET_ACHIEVEMENTS.find(a => a.title === name);
    if (!found) return;

    pinnedBurger = pinnedBurger && pinnedBurger.name === name ? null : { name: found.name || found.title, ids: found.ids };
    if (pinnedBurger) localStorage.setItem('pinned_burger', JSON.stringify(pinnedBurger));
    else localStorage.removeItem('pinned_burger');
    renderRecipesModal();
    updatePinnedWidget();
  }

  function updatePinnedWidget() {
    const widget = document.getElementById('pinnedRecipeWidget');
    const container = document.getElementById('pinnedIngredientsContainer');
    if (!widget || !container) return;
    if (pinnedBurger) {
      container.innerHTML = '';
      pinnedBurger.ids.forEach(id => {
        if (ITEM_IMAGES[id]) {
          const img = document.createElement('img');
          img.src = ITEM_IMAGES[id];
          container.appendChild(img);
        }
      });
      widget.classList.add('active');
      const unpinBtn = document.getElementById('unpinBtn');
      if (unpinBtn) {
        unpinBtn.onclick = () => {
          pinnedBurger = null;
          localStorage.removeItem('pinned_burger');
          updatePinnedWidget();
          renderRecipesModal();
        };
      }
    } else {
      widget.classList.remove('active');
    }
    updateMoneyPopupPosition();
  }

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

    let cardsHtml = '';
    filtered.forEach(item => {
      const unitPrice = ITEM_PRICES[item.id] || 1;
      const stockDisplay = currentGameMode === 'sandbox' ? '∞' : (ingredientStock[item.id] ?? 0);

      cardsHtml += `
        <div class="shop-item-card">
          <div class="shop-item-info">
            <img src="${item.image}" alt="${item.name}">
            <div class="shop-item-details">
              <h4>${item.name} ${item.isSauce ? '<span style="color:#ffb300; font-size:0.7rem;">x1 (pack)</span>' : ''}</h4>
              <p>$${unitPrice.toFixed(2)} each | Stock: ${stockDisplay}</p>
            </div>
          </div>
          <div class="shop-buy-group">
            <div class="shop-total-price" id="total-${item.id}">$0.00</div>
            <button class="shop-qty-btn" onclick="changeQty('${item.id}', -1)">-</button>
            <input type="number" min="0" max="100" value="0" id="qty-${item.id}" oninput="updateItemTotal('${item.id}')">
            <button class="shop-qty-btn" onclick="changeQty('${item.id}', 1)">+</button>
            <button class="btn-buy" onclick="buyItem('${item.id}')">Buy</button>
          </div>
        </div>
      `;
    });

    body.innerHTML = `<div style="display:flex; flex-direction:column; gap:8px; min-height: 340px;">${cardsHtml}</div>`;
    filtered.forEach(item => {
      updateItemTotal(item.id);
    });
  }

  window.updateItemTotal = function(id) {
    const input = document.getElementById(`qty-${id}`);
    const totalDiv = document.getElementById(`total-${id}`);
    if (!input || !totalDiv) return;
    let val = parseInt(input.value) || 0;
    val = Math.max(0, Math.min(100, val));
    const cost = (ITEM_PRICES[id] || 1) * val;
    totalDiv.innerText = `$${cost.toFixed(2)}`;
  }

  window.changeQty = function(id, delta) {
    const input = document.getElementById(`qty-${id}`);
    if (!input) return;
    let val = parseInt(input.value) || 0;
    val = Math.max(0, Math.min(100, val + delta));
    input.value = val;
    updateItemTotal(id);
  }

  window.buyItem = function(id) {
    const input = document.getElementById(`qty-${id}`);
    const qty = parseInt(input.value) || 0;
    if (qty <= 0) { showToast('Invalid quantity', 'Please select quantity greater than 0!', 'warning'); return; }
    
    const totalCost = (ITEM_PRICES[id] || 1) * qty;

    if (currentGameMode !== 'sandbox') {
      playerMoney -= totalCost;
      updateMoneyDisplay(totalCost, false);
      updateShopBalanceHeader();
    }

    ingredientStock[id] = (ingredientStock[id] ?? 0) + qty;
    saveStock();
    renderIngredientsMenu();
    renderSauces();
    renderShopModal();
    if (currentScreen === 'grill') {
      renderGrillIngredientsMenu();
      renderGrillCookedInventory();
    } else if (currentScreen === 'board') {
      renderBoardUncutMenu();
      renderBoardSlicedInventory();
    }
    playSound(SOUNDS.buy);
  }

  function updateShopBalanceHeader() {
    const modalHeader = document.querySelector('#shopModal .modal-header h3');
    if (!modalHeader) return;
    let badge = document.getElementById('shopBalanceBadge');
    if (!badge) {
      badge = document.createElement('span');
      badge.id = 'shopBalanceBadge';
      badge.className = 'shop-balance-badge';
      modalHeader.appendChild(badge);
    }
    if (currentGameMode === 'sandbox') {
      badge.innerText = '($∞)';
      badge.className = 'shop-balance-badge positive';
    } else {
      badge.innerText = `($${playerMoney.toFixed(2)})`;
      badge.className = 'shop-balance-badge';
      if (playerMoney > 0) badge.classList.add('positive');
      else if (playerMoney === 0) badge.classList.add('zero');
      else badge.classList.add('negative');
    }
  }

  if (openShopBtn) openShopBtn.onclick = () => { playSound(SOUNDS.buttons); updateShopBalanceHeader(); renderShopModal(); shopModal.classList.add('open'); };
  if (closeShopModal) closeShopModal.onclick = () => { playSound(SOUNDS.buttons); shopModal.classList.remove('open'); };

  if (openRecipesBtn) openRecipesBtn.onclick = () => { playSound(SOUNDS.buttons); renderRecipesModal(); recipesModal.classList.add('open'); };
  if (closeRecipesModal) closeRecipesModal.onclick = () => { playSound(SOUNDS.buttons); recipesModal.classList.remove('open'); };

  if (openAchievementsBtn) openAchievementsBtn.onclick = () => {
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
  if (closeAchievementsModal) closeAchievementsModal.onclick = () => { playSound(SOUNDS.buttons); achievementsModal.classList.remove('open'); };

  if (openSettingsBtn) openSettingsBtn.onclick = () => { playSound(SOUNDS.buttons); settingsModal.classList.add('open'); };
  if (closeSettingsModal) closeSettingsModal.onclick = () => { playSound(SOUNDS.buttons); settingsModal.classList.remove('open'); };

  const hardResetBtn = document.getElementById('hardResetBtn');
  if (hardResetBtn) hardResetBtn.onclick = () => {
    if (confirm("⚠️ WARNING: Wipe all data?")) { 
      localStorage.clear(); 
      localStorage.setItem('has_seen_welcome', 'true'); 
      location.reload(); 
    }
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
        showToast('First you need to create a burger', '', 'warning');
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
        showToast('Error', 'Could not save image.', 'error');
      });
    };
  }

  if (forceOrderBtn) {
    forceOrderBtn.onclick = () => {
      playSound(SOUNDS.buttons);
      const speed = getCurrentSpeed();
      if (currentGameMode === 'turbo' || speed === 'no-orders' || speed === 'turbo') {
        showToast('No active order timer', '', 'warning');
        return;
      }
      if (currentActiveOrder !== null) {
        showToast("Active order isn't completed", '', 'warning');
        return;
      }
      lastOrderReducedReward = true;
      triggerRandomOrder();
      showToast('Order Summoned!', 'Reward has been reduced', 'warning');
    };
  }

  if (skipOrderBtn) {
    skipOrderBtn.onclick = () => {
      playSound(SOUNDS.buttons);
      const speed = getCurrentSpeed();
      if (speed === 'no-orders' && !currentActiveOrder) {
        showToast('No active order', '', 'warning');
        return;
      }

      if (skipOrderClickCount === 0) {
        skipOrderClickCount = 1;
        if (currentGameMode === 'turbo') {
          showToast("You will get fined if you skip. To proceed click the button again", '', 'warning');
        } else {
          showToast("You won't get reward if you skip. To proceed click the button again", '', 'warning');
        }
        clearTimeout(skipOrderTimeout);
        skipOrderTimeout = setTimeout(() => { skipOrderClickCount = 0; }, 5000);
      } else {
        skipOrderClickCount = 0;
        clearTimeout(skipOrderTimeout);

        if (currentGameMode === 'turbo') {
          playSound(SOUNDS.wrongOrder);
          playerMoney -= 5;
          updateMoneyDisplay(5, false);
          showToast('Fined! -$5', 'Order skipped with fine', 'error');
          currentTurboTimeLeft = 180;
          triggerRandomOrder();
        } else {
          showToast('Order Skipped', 'No reward received', 'warning');
          currentActiveOrder = null;
          localStorage.removeItem('current_active_order');
          if (speed === 'turbo') {
            triggerRandomOrder();
          } else {
            timeUntilNextOrder = getRandomTimeForSpeed(speed);
            localStorage.setItem('time_until_next_order', timeUntilNextOrder);
          }
          updateActionButtonsVisibility();
        }
      }
    };
  }

  function updateBurgerDisplay(isNewAdded = false) {
    if (currentScreen !== 'assembly') return;
    saveBurgerState();
    
    if (leftPanel) {
      const titleEl = leftPanel.querySelector('.panel-title');
      if (titleEl) titleEl.innerText = `Layers (${currentBurger.length}/${MAX_INGREDIENTS})`;
    }

    if (layersList) {
      layersList.classList.add('assembly-mode');
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
      if (currentBurger.length === 0) {
        showToast('First you need to create a burger', '', 'warning');
        return;
      }
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
        showToast('No active order or burger is empty!', '', 'warning');
      }
    };
  }

  const resetBtn = document.getElementById('resetBtn');
  if (resetBtn) {
    resetBtn.onclick = () => {
      playSound(SOUNDS.buttons);

      if (currentScreen === 'grill') {
        if (isBinSelectMode) {
          exitBinSelectMode();
          return;
        }
        enterBinSelectMode();
        return;
      }

      if (currentScreen === 'board') {
        if (isBinSelectMode) {
          exitBoardBinSelectMode();
          return;
        }
        enterBoardBinSelectMode();
        return;
      }

      if (currentBurger.length === 0) {
        showToast('First you need to create a burger', '', 'warning');
        return;
      }

      if (resetClickCount === 0) {
        resetClickCount = 1;
        showToast("To bin the burger click the button again", '', 'warning');
        clearTimeout(resetClickTimeout);
        resetClickTimeout = setTimeout(() => { resetClickCount = 0; }, 5000);
      } else {
        resetClickCount = 0;
        clearTimeout(resetClickTimeout);

        if (currentGameMode !== 'sandbox' && currentBurger.length > 0) {
          currentBurger.forEach(item => { ingredientStock[item.id] = (ingredientStock[item.id] ?? 0) + 1; });
          saveStock();
        }
        playSound(SOUNDS.bin);
        isEating = false; isSqueezed = false;
        if (burgerStack) burgerStack.classList.remove('eating');
        currentBurger = [];
        updateBurgerDisplay(false);
        showToast('The burger is binned', '', 'success');
      }
    };
  }

  function enterBinSelectMode() {
    isBinSelectMode = true;
    selectedGrillIndicesForBin = [];
    selectedBoardIndicesForBin = [];
    showToast('Select items to bin', '', 'warning');
    showBinConfirmBar();
    if (currentScreen === 'grill') renderGrill();
    if (currentScreen === 'board') renderBoard();
  }

  function exitBinSelectMode() {
    isBinSelectMode = false;
    selectedGrillIndicesForBin = [];
    selectedBoardIndicesForBin = [];
    const bar = document.getElementById('binConfirmBar');
    if (bar) bar.remove();
    if (currentScreen === 'grill') renderGrill();
    if (currentScreen === 'board') renderBoard();
  }

  function toggleGrillSlotSelectionForBin(index) {
    if (!grillSlots[index]) return;
    const pos = selectedGrillIndicesForBin.indexOf(index);
    if (pos > -1) {
      selectedGrillIndicesForBin.splice(pos, 1);
    } else {
      selectedGrillIndicesForBin.push(index);
    }
    renderGrill();
  }

  function enterBoardBinSelectMode() {
    enterBinSelectMode();
  }

  function exitBoardBinSelectMode() {
    exitBinSelectMode();
  }

  function toggleBoardSlotSelectionForBin(index) {
    if (!boardSlots[index]) return;
    const pos = selectedBoardIndicesForBin.indexOf(index);
    if (pos > -1) {
      selectedBoardIndicesForBin.splice(pos, 1);
    } else {
      selectedBoardIndicesForBin.push(index);
    }
    renderBoard();
  }

  function showBinConfirmBar() {
    let bar = document.getElementById('binConfirmBar');
    if (bar) bar.remove();

    bar = document.createElement('div');
    bar.id = 'binConfirmBar';
    bar.className = 'bin-confirm-bar';
    bar.innerHTML = `
      <button class="btn-action btn-confirm" title="Confirm" onclick="confirmBinActiveItems()">✔</button>
      <button class="btn-action btn-cancel" title="Cancel" onclick="exitBinSelectMode()">✖</button>
    `;
    document.body.appendChild(bar);
  }

  window.confirmBinActiveItems = function() {
    playSound(SOUNDS.bin);
    if (currentScreen === 'grill') {
      selectedGrillIndicesForBin.forEach(idx => {
        grillSlots[idx] = null;
      });
      saveGrillState();
    } else if (currentScreen === 'board') {
      selectedBoardIndicesForBin.forEach(idx => {
        boardSlots[idx] = null;
      });
      saveBoardState();
    }
    exitBinSelectMode();
    showToast('Items discarded', '', 'success');
  }

  window.exitBinSelectMode = exitBinSelectMode;

  if (eatBtn) {
    eatBtn.onclick = () => {
      if (currentBurger.length === 0) {
        showToast('First you need to create a burger', '', 'warning');
        return;
      }
      if (isEating) return;
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
        let reward = Math.round(cost * 2 * 100) / 100;
        if (lastOrderReducedReward) {
          reward = Math.round(reward * (2 / 3) * 100) / 100;
          lastOrderReducedReward = false;
        }
        playerMoney += reward;
        updateMoneyDisplay(reward, true);
      }
      showToast('Order Complete!', `${currentActiveOrder.name} served successfully!`, 'success');
      
      if (currentGameMode === 'turbo') {
        currentTurboTimeLeft = 180;
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
        playerMoney -= 3;
        updateMoneyDisplay(3, false);
      }
      showToast('Wrong order!', '-$3 penalty', 'error');
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
          let reward = Math.round(cost * 2 * 100) / 100;
          if (lastOrderReducedReward) {
            reward = Math.round(reward * (2 / 3) * 100) / 100;
            lastOrderReducedReward = false;
          }
          playerMoney += reward;
          updateMoneyDisplay(reward, true);
        }
        showToast('Order Complete!', `${currentActiveOrder.name} served successfully!`, 'success');
        
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
    if (speed !== 'no-orders' && speed !== 'turbo' && currentGameMode !== 'turbo') {
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
          playerMoney -= 5;
          updateMoneyDisplay(5, false);
          showToast('You ran out of time!', '-$5 penalty', 'error');
          triggerRandomOrder();
        }
      }
      return;
    }

    if (currentSpeed === 'turbo') {
      if (!currentActiveOrder) {
        triggerRandomOrder();
      } else {
        updateOrderWidgetsText(currentActiveOrder.name);
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

  // --- ПОЛНЫЙ ТУТОРИАЛ ---
  const tutorialSteps = [
    // 1. Экран сборки
    {
      title: "Assembly Screen",
      text: "This is your main workplace where you build custom burgers.",
      screen: "assembly",
      getElement: () => document.getElementById('centerStage') || document.querySelector('.center-stage')
    },
    {
      title: "Ingredients Menu",
      text: "Here you can select and add various ingredients (buns, patties, veggies) to your burger stack.",
      screen: "assembly",
      getElement: () => document.getElementById('rightPanel') || document.querySelector('.right-panel')
    },
    {
      title: "Layers Panel",
      text: "Here you can see all current layers of your burger, reorder them, or remove individual items.",
      screen: "assembly",
      getElement: () => document.getElementById('leftPanel') || document.querySelector('.left-panel')
    },
    {
      title: "Wallet",
      text: "Shows your current money balance. Earn cash by fulfilling customer orders correctly!",
      screen: "assembly",
      getElement: () => document.getElementById('walletWidget') || document.querySelector('.wallet-widget')
    },
    {
      title: "Bottom Actions Menu",
      text: "Quick buttons for recipes, shop, inventory backpack, achievements, eating, squishing, or trashing the burger.",
      screen: "assembly",
      getElement: () => document.getElementById('bottomPanel') || document.querySelector('.bottom-panel')
    },

    // 2. Экран гриля (сначала показываем кнопку переключения на экране сборки)
    {
      title: "Switch to Grill",
      text: "Click this button to switch to the Grill screen and cook raw ingredients.",
      screen: "assembly",
      getElement: () => document.getElementById('switchToGrillBtn')
    },
    {
      title: "Grill Screen",
      text: "Here you can grill raw patties, bacon, eggs, and mushrooms.",
      screen: "grill",
      getElement: () => document.getElementById('grillStage')
    },
    {
      title: "Raw Ingredients Menu",
      text: "On the right panel, select raw items from your stock to place them onto the grill slots.",
      screen: "grill",
      getElement: () => document.getElementById('rightPanel') || document.querySelector('.right-panel')
    },
    {
      title: "Cooked Inventory",
      text: "On the left panel, you can view your inventory of successfully cooked ingredients ready to use.",
      screen: "grill",
      getElement: () => document.getElementById('leftPanel') || document.querySelector('.left-panel')
    },

    // 3. Экран доски для нарезки (сначала кнопка переключения на сборке)
    {
      title: "Switch to Cutting Board",
      text: "Click this button to switch to the Cutting Board screen.",
      screen: "assembly",
      getElement: () => document.getElementById('switchToBoardBtn')
    },
    {
      title: "Cutting Board Screen",
      text: "Here you can chop and slice uncut vegetables and cheeses before using them.",
      screen: "board",
      getElement: () => document.getElementById('boardStage')
    },
    {
      title: "Uncut Ingredients",
      text: "Select uncut items on the right panel to place them onto the board and chop them into pieces.",
      screen: "board",
      getElement: () => document.getElementById('rightPanel') || document.querySelector('.right-panel')
    },
    {
      title: "Sliced Inventory",
      text: "The left panel displays your stock of freshly sliced ingredients ready for your culinary creations.",
      screen: "board",
      getElement: () => document.getElementById('leftPanel') || document.querySelector('.left-panel')
    },

    // 4. Финал в настройках
    {
      title: "Settings & Game Modes",
      text: "Let's head back to Assembly. Open Settings to configure volume, themes, game modes (Sandbox, Casual, Turbo), and order frequencies.",
      screen: "assembly",
      action: () => {
        const modal = document.getElementById('settingsModal');
        if (modal) modal.classList.add('open');
      },
      getElement: () => document.getElementById('settingsModal') ? document.getElementById('settingsModal').querySelector('.modal-content') : document.body
    },
    {
      title: "Reset & Tutorial",
      text: "Scroll down to see the Danger Zone where you can reset data, and the button to restart this tutorial anytime!",
      screen: "assembly",
      action: () => {
        const bodyEl = document.getElementById('settingsModalBody');
        if (bodyEl) {
          bodyEl.scrollTop = bodyEl.scrollHeight;
        }
      },
      getElement: () => document.getElementById('openTutorialFromSettingsBtn') || document.getElementById('hardResetBtn')
    }
  ];

  let currentTutorialStep = 0;

  function showWelcomeModalIfNeeded() {
    const hasSeenWelcome = localStorage.getItem('has_seen_welcome');
    const welcomeModal = document.getElementById('welcomeModal');
    if (!hasSeenWelcome && welcomeModal) {
      welcomeModal.classList.add('open');
    }
  }

  const welcomeModal = document.getElementById('welcomeModal');
  const welcomeNoBtn = document.getElementById('welcomeNoBtn');
  const welcomeYesBtn = document.getElementById('welcomeYesBtn');
  const tutorialOverlay = document.getElementById('tutorialOverlay');
  const tutorialSpotlight = document.getElementById('tutorialSpotlight');
  const tutorialTooltip = document.getElementById('tutorialTooltip');
  const tutorialTitle = document.getElementById('tutorialTitle');
  const tutorialText = document.getElementById('tutorialText');
  const tutorialStepIndicator = document.getElementById('tutorialStepIndicator');
  const tutorialPrevBtn = document.getElementById('tutorialPrevBtn');
  const tutorialNextBtn = document.getElementById('tutorialNextBtn');
  const openTutorialFromSettingsBtn = document.getElementById('openTutorialFromSettingsBtn');

  if (welcomeNoBtn) {
    welcomeNoBtn.onclick = () => {
      playSound(SOUNDS.buttons);
      localStorage.setItem('has_seen_welcome', 'true');
      if (welcomeModal) welcomeModal.classList.remove('open');
    };
  }

  if (welcomeYesBtn) {
    welcomeYesBtn.onclick = () => {
      playSound(SOUNDS.buttons);
      localStorage.setItem('has_seen_welcome', 'true');
      if (welcomeModal) welcomeModal.classList.remove('open');
      startTutorial();
    };
  }

  if (openTutorialFromSettingsBtn) {
    openTutorialFromSettingsBtn.onclick = () => {
      playSound(SOUNDS.buttons);
      if (settingsModal) settingsModal.classList.remove('open');
      startTutorial();
    };
  }

  function startTutorial() {
    currentTutorialStep = 0;
    if (tutorialOverlay) tutorialOverlay.classList.add('active');
    showTutorialStep(currentTutorialStep);
  }

  function showTutorialStep(stepIndex) {
    const step = tutorialSteps[stepIndex];
    if (!step) {
      endTutorial();
      return;
    }

    if (step.screen && currentScreen !== step.screen) {
      switchScreen(step.screen);
    }

    if (step.action) {
      step.action();
    } else {
      const settingsModalEl = document.getElementById('settingsModal');
      if (settingsModalEl && stepIndex < tutorialSteps.length - 1) {
        settingsModalEl.classList.remove('open');
      }
    }

    if (tutorialTitle) tutorialTitle.innerText = step.title;
    if (tutorialText) tutorialText.innerText = step.text;
    if (tutorialStepIndicator) tutorialStepIndicator.innerText = `${stepIndex + 1} / ${tutorialSteps.length}`;
    if (tutorialPrevBtn) tutorialPrevBtn.style.display = stepIndex === 0 ? 'none' : 'block';
    if (tutorialNextBtn) tutorialNextBtn.innerText = stepIndex === tutorialSteps.length - 1 ? 'Finish' : 'Next';

    setTimeout(() => {
      const targetEl = step.getElement ? step.getElement() : null;
      if (targetEl && tutorialSpotlight && tutorialTooltip) {
        const rect = targetEl.getBoundingClientRect();
        const padding = 16;

        tutorialSpotlight.style.top = `${rect.top - padding}px`;
        tutorialSpotlight.style.left = `${rect.left - padding}px`;
        tutorialSpotlight.style.width = `${rect.width + padding * 2}px`;
        tutorialSpotlight.style.height = `${rect.height + padding * 2}px`;

        const tooltipWidth = 310;
        let tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
        let tooltipTop = rect.bottom + 16;

        if (tooltipLeft < 10) tooltipLeft = 10;
        if (tooltipLeft + tooltipWidth > window.innerWidth - 10) tooltipLeft = window.innerWidth - tooltipWidth - 10;
        if (tooltipTop + 180 > window.innerHeight) {
          tooltipTop = rect.top - 190;
        }

        tutorialTooltip.style.left = `${Math.max(10, tooltipLeft)}px`;
        tutorialTooltip.style.top = `${Math.max(10, tooltipTop)}px`;
      }
    }, 50);
  }

  if (tutorialNextBtn) {
    tutorialNextBtn.onclick = () => {
      playSound(SOUNDS.buttons);
      if (currentTutorialStep < tutorialSteps.length - 1) {
        currentTutorialStep++;
        showTutorialStep(currentTutorialStep);
      } else {
        endTutorial();
      }
    };
  }

  if (tutorialPrevBtn) {
    tutorialPrevBtn.onclick = () => {
      playSound(SOUNDS.buttons);
      if (currentTutorialStep > 0) {
        currentTutorialStep--;
        showTutorialStep(currentTutorialStep);
      }
    };
  }

  function endTutorial() {
    if (tutorialOverlay) tutorialOverlay.classList.remove('active');
    const settingsModalEl = document.getElementById('settingsModal');
    if (settingsModalEl) settingsModalEl.classList.remove('open');
  }

  showWelcomeModalIfNeeded();

  switchScreen(currentScreen);
  renderSauces();
  renderIngredientsMenu();
  updateBurgerDisplay(false);
  updatePinnedWidget();
  updateMoneyDisplay();
  updateActionButtonsVisibility();
});
