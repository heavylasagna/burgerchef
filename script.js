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
    order: safeAudio('audio/order.mp3'),
    complete: safeAudio('audio/complete.mp3'),
    bin: safeAudio('audio/bin.mp3'),
    cheeseburger: safeAudio('audio/cheeseburger.mp3'),
    tomatonator: safeAudio('audio/tomatonator.mp3'),
    lilypad: safeAudio('audio/lilypad.mp3'),
    saturnBurger: safeAudio('audio/saturn-burger.mp3'),
    bustanator: safeAudio('audio/bustanator.mp3'),
    mcPicklePounder: safeAudio('audio/mc-pickle-pounder.mp3')
  };

  const leftPanel = document.getElementById('leftPanel');
  const rightPanel = document.getElementById('rightPanel');
  const bottomPanel = document.getElementById('bottomPanel');

  document.getElementById('layersTitle').onclick = (e) => {
    if (window.innerWidth > 900) {
      e.stopPropagation();
      leftPanel.classList.toggle('dimmed');
    }
  };

  document.getElementById('ingredientsTitle').onclick = (e) => {
    if (window.innerWidth > 900) {
      e.stopPropagation();
      rightPanel.classList.toggle('dimmed');
    }
  };

  bottomPanel.onclick = (e) => {
    if (window.innerWidth > 900) {
      if (e.target === bottomPanel || e.target.classList.contains('sauces-group')) {
        bottomPanel.classList.toggle('dimmed');
      }
    }
  };

  let volumeLevel = parseFloat(localStorage.getItem('burger_volume')) ?? 1.0;
  const volumeRange = document.getElementById('volumeRange');
  const volumeVal = document.getElementById('volumeVal');
  
  volumeRange.value = volumeLevel * 100;
  volumeVal.innerText = `${volumeRange.value}%`;

  function updateVolume() {
    volumeLevel = volumeRange.value / 100;
    volumeVal.innerText = `${volumeRange.value}%`;
    localStorage.setItem('burger_volume', volumeLevel);
  }
  volumeRange.oninput = updateVolume;

  function playSound(sound) {
    if (sound && volumeLevel > 0) {
      try {
        sound.currentTime = 0;
        sound.volume = volumeLevel;
        sound.play().catch(() => {});
      } catch(e){}
    }
  }

  window.setTheme = function(theme) {
    const darkBtn = document.getElementById('themeDarkBtn');
    const lightBtn = document.getElementById('themeLightBtn');
    if (theme === 'light') {
      document.body.classList.add('light-theme');
      darkBtn.classList.remove('active');
      lightBtn.classList.add('active');
      localStorage.setItem('burger_theme', 'light');
    } else {
      document.body.classList.remove('light-theme');
      lightBtn.classList.remove('active');
      darkBtn.classList.add('active');
      localStorage.setItem('burger_theme', 'dark');
    }
  }
  const savedTheme = localStorage.getItem('burger_theme') || 'dark';
  setTheme(savedTheme);

  // Кошелек и экономика
  let playerMoney = parseFloat(localStorage.getItem('burger_money'));
  if (isNaN(playerMoney)) playerMoney = 100.00;

  function updateMoneyDisplay() {
    const badge1 = document.getElementById('walletBadge');
    const badge2 = document.getElementById('walletBadgeMobile');
    const mode = localStorage.getItem('burger_game_mode') || 'sandbox';

    const text = mode === 'sandbox' ? 'Sandbox' : `$${playerMoney.toFixed(2)}`;
    if (badge1) badge1.innerText = text;
    if (badge2) badge2.innerText = text;
    localStorage.setItem('burger_money', playerMoney);
  }

  // Цены за 1 единицу
  const ITEM_PRICES = {
    'bottom-bun': 2, 'top-bun': 2,
    'beef-patty': 5, 'chicken-patty': 4, 'fish-patty': 4, 'fried-bacon': 3, 'fried-egg': 2,
    'cheese': 3, 'hashbrown': 3, 'champignons': 3,
    'lettuce': 1, 'tomato': 1, 'pickles': 1, 'red-onion': 1, 'white-onion': 1,
    'mayo': 2, 'ketchup': 2, 'mustard': 2, 'spicy': 2, 'bbq': 2 // цена пачки из 10 шт соуса
  };

  // Склады ингредиентов
  let ingredientStock = JSON.parse(localStorage.getItem('burger_ingredient_stock')) || {
    'bottom-bun': 20, 'top-bun': 20,
    'beef-patty': 15, 'chicken-patty': 15, 'fish-patty': 15, 'fried-bacon': 10, 'fried-egg': 10,
    'cheese': 15, 'hashbrown': 10, 'champignons': 10,
    'lettuce': 20, 'tomato': 20, 'pickles': 20, 'red-onion': 15, 'white-onion': 15,
    'mayo': 30, 'ketchup': 30, 'mustard': 30, 'spicy': 30, 'bbq': 30
  };

  function saveStock() {
    localStorage.setItem('burger_ingredient_stock', JSON.stringify(ingredientStock));
  }

  const squeezeBtn = document.getElementById('squeezeBtn');
  const eatBtn = document.getElementById('eatBtn');

  function updateActionButtonsVisibility(mode) {
    if (mode === 'sandbox') {
      if (squeezeBtn) squeezeBtn.style.display = 'flex';
      if (eatBtn) eatBtn.style.display = 'flex';
    } else {
      if (squeezeBtn) squeezeBtn.style.display = 'none';
      if (eatBtn) eatBtn.style.display = 'none';
    }
  }

  let currentGameMode = localStorage.getItem('burger_game_mode') || 'sandbox';
  let currentGameSpeed = localStorage.getItem('burger_game_speed') || 'medium';

  const modeSandboxBtn = document.getElementById('modeSandboxBtn');
  const modeCasualBtn = document.getElementById('modeCasualBtn');
  const modeTurboBtn = document.getElementById('modeTurboBtn');
  const speedButtonsGrid = document.getElementById('speedButtonsGrid');

  function applyGameMode(mode) {
    currentGameMode = mode;
    localStorage.setItem('burger_game_mode', mode);

    modeSandboxBtn.classList.toggle('active', mode === 'sandbox');
    modeCasualBtn.classList.toggle('active', mode === 'casual');
    modeTurboBtn.classList.toggle('active', mode === 'turbo');

    const topWidget = document.getElementById('topOrderWidget');
    const topWidgetMob = document.getElementById('topOrderWidgetMobile');

    if (mode === 'sandbox') {
      speedButtonsGrid.classList.remove('disabled');
      if (currentGameSpeed === 'no-orders') {
        topWidget.classList.add('hidden');
        topWidgetMob.classList.add('hidden');
      } else {
        topWidget.classList.remove('hidden');
        topWidgetMob.classList.remove('hidden');
      }
    } else if (mode === 'casual') {
      speedButtonsGrid.classList.remove('disabled');
      topWidget.classList.remove('hidden');
      topWidgetMob.classList.remove('hidden');
    } else if (mode === 'turbo') {
      speedButtonsGrid.classList.add('disabled');
      topWidget.classList.remove('hidden');
      topWidgetMob.classList.remove('hidden');
      currentTurboTimeLeft = 180;
      if (!currentActiveOrder) triggerRandomOrder();
    }

    updateActionButtonsVisibility(mode);
    updateMoneyDisplay();
    renderIngredientsMenu();
    renderSauces();
  }

  modeSandboxBtn.onclick = () => applyGameMode('sandbox');
  modeCasualBtn.onclick = () => applyGameMode('casual');
  modeTurboBtn.onclick = () => applyGameMode('turbo');

  applyGameMode(currentGameMode);

  const speedButtons = document.querySelectorAll('.speed-btn');

  function updateSpeedButtonsUI(speed) {
    speedButtons.forEach(btn => {
      if (btn.getAttribute('data-speed') === speed) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }
  updateSpeedButtonsUI(currentGameSpeed);

  speedButtons.forEach(btn => {
    btn.onclick = () => {
      if (currentGameMode === 'turbo') return;
      currentGameSpeed = btn.getAttribute('data-speed');
      localStorage.setItem('burger_game_speed', currentGameSpeed);
      updateSpeedButtonsUI(currentGameSpeed);

      const w1 = document.getElementById('topOrderWidget');
      const w2 = document.getElementById('topOrderWidgetMobile');

      if (currentGameSpeed === 'no-orders' && currentGameMode === 'sandbox') {
        currentActiveOrder = null;
        saveOrderState();
        if (w1) w1.classList.add('hidden');
        if (w2) w2.classList.add('hidden');
      } else {
        if (w1) w1.classList.remove('hidden');
        if (w2) w2.classList.remove('hidden');
        timeUntilNextOrder = getRandomTimeForSpeed(currentGameSpeed);
        saveOrderState();
      }
    };
  });

  if (currentGameSpeed === 'no-orders' && currentGameMode === 'sandbox') {
    const w1 = document.getElementById('topOrderWidget');
    const w2 = document.getElementById('topOrderWidgetMobile');
    if (w1) w1.classList.add('hidden');
    if (w2) w2.classList.add('hidden');
  }

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

  document.getElementById('hardResetBtn').onclick = () => {
    const confirmWipe = confirm(
      "⚠️ WARNING: Are you sure you want to reset all game data?\n\n" +
      "This will reset and wipe:\n" +
      "• Money & Ingredients Stock\n" +
      "• Achievements & Secret Recipes\n\n" +
      "This action cannot be undone!"
    );
    if (confirmWipe) {
      localStorage.clear();
      location.reload();
    }
  };

  const topOrderWidget = document.getElementById('topOrderWidget');
  topOrderWidget.onclick = () => { topOrderWidget.classList.toggle('dimmed'); };
  const topOrderWidgetMobile = document.getElementById('topOrderWidgetMobile');
  if (topOrderWidgetMobile) {
    topOrderWidgetMobile.onclick = () => { topOrderWidgetMobile.classList.toggle('dimmed'); };
  }

  const ITEM_IMAGES = {
    'bottom-bun': 'images/bottom-bun.png',
    'top-bun': 'images/top-bun.png',
    'beef-patty': 'images/beef-patty.png',
    'cheese': 'images/cheese.png',
    'hashbrown': 'images/hashbrown.png',
    'fried-egg': 'images/fried-egg.png',
    'champignons': 'images/champignons.png',
    'fried-bacon': 'images/fried-bacon.png',
    'lettuce': 'images/lettuce.png',
    'tomato': 'images/tomato.png',
    'pickles': 'images/pickles.png',
    'red-onion': 'images/red-onion.png',
    'white-onion': 'images/white-onion.png',
    'chicken-patty': 'images/chicken-patty.png',
    'fish-patty': 'images/fish-patty.png',
    'mayo': 'images/sauce-mayo.png',
    'ketchup': 'images/sauce-ketchup.png',
    'mustard': 'images/sauce-mustard.png',
    'spicy': 'images/sauce-spicy.png',
    'bbq': 'images/sauce-bbq.png'
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

  let unlockedAchievements = JSON.parse(localStorage.getItem('unlocked_achievements')) || {};
  let pinnedBurger = JSON.parse(localStorage.getItem('pinned_burger')) || null;

  let currentActiveOrder = JSON.parse(localStorage.getItem('current_active_order')) || null;
  let timeUntilNextOrder = parseInt(localStorage.getItem('time_until_next_order'), 10);
  if (isNaN(timeUntilNextOrder)) {
    timeUntilNextOrder = getRandomTimeForSpeed(currentGameSpeed);
  }
  let currentTurboTimeLeft = 180;

  function saveOrderState() {
    localStorage.setItem('current_active_order', JSON.stringify(currentActiveOrder));
    localStorage.setItem('time_until_next_order', timeUntilNextOrder);
  }

  function unlockAchievement(ach) {
    if (!unlockedAchievements[ach.id]) {
      unlockedAchievements[ach.id] = true;
      localStorage.setItem('unlocked_achievements', JSON.stringify(unlockedAchievements));
      playSound(SOUNDS[ach.sound] || SOUNDS.achievement);
      showToast(ach);
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
        r.ids.forEach(id => {
          if (ITEM_IMAGES[id]) iconsHtml += `<img src="${ITEM_IMAGES[id]}" title="${id}">`;
        });

        card.innerHTML = `
          <div class="recipe-info">
            <h4>${r.name}</h4>
            <div class="recipe-visual">${iconsHtml}</div>
          </div>`;
        
        const pinBtn = document.createElement('button');
        const isPinned = pinnedBurger && pinnedBurger.name === r.name;
        pinBtn.className = `btn-pin ${isPinned ? 'pinned' : ''}`;
        pinBtn.innerText = '📌';
        pinBtn.onclick = () => togglePin(r.name, r.ids);
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
          ach.ids.forEach(id => {
            if (ITEM_IMAGES[id]) iconsHtml += `<img src="${ITEM_IMAGES[id]}" title="${id}">`;
          });
          card.innerHTML = `
            <div class="recipe-info" style="flex:1;">
              <h4>${ach.title}</h4>
              <div class="recipe-visual">${iconsHtml}</div>
            </div>`;
          
          const pinBtn = document.createElement('button');
          const isPinned = pinnedBurger && pinnedBurger.name === ach.title;
          pinBtn.className = `btn-pin ${isPinned ? 'pinned' : ''}`;
          pinBtn.innerText = '📌';
          pinBtn.onclick = () => togglePin(ach.title, ach.ids);
          card.appendChild(pinBtn);
        } else {
          card.innerHTML = `
            <div class="recipe-info" style="flex:1;">
              <h4>${ach.title}</h4>
              <p style="font-size:0.75rem; opacity:0.6;">Secret recipe locked...</p>
            </div>`;
        }
        body.appendChild(card);
      });
    }
  }

  function togglePin(name, ids) {
    if (pinnedBurger && pinnedBurger.name === name) {
      pinnedBurger = null;
      localStorage.removeItem('pinned_burger');
    } else {
      pinnedBurger = { name, ids };
      localStorage.setItem('pinned_burger', JSON.stringify(pinnedBurger));
    }
    renderRecipesModal();
    updatePinnedWidget();
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
  }

  function renderAchievementsModal() {
    const list = document.getElementById('achievementsList');
    if (!list) return;
    list.innerHTML = '';
    SECRET_ACHIEVEMENTS.forEach(ach => {
      const isUnlocked = unlockedAchievements[ach.id];
      const item = document.createElement('div');
      item.className = 'achievement-item';
      item.style.opacity = isUnlocked ? '1' : '0.5';
      item.innerHTML = `
        <div class="recipe-info" style="flex:1;">
          <h4>${ach.title}</h4>
          <p>${isUnlocked ? ach.desc : 'Secret locked'}</p>
        </div>
      `;
      list.appendChild(item);
    });
  }

  // МАГАЗИН 🏬 ЛОГИКА
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
    const tabs = document.querySelectorAll('#shopTabs .recipe-tab');
    tabs.forEach(t => {
      if (t.innerText.toLowerCase() === tab) t.classList.add('active');
      else t.classList.remove('active');
    });
    renderShopModal();
  }

  function renderShopModal() {
    const body = document.getElementById('shopModalBody');
    if (!body) return;
    body.innerHTML = '';

    const filtered = activeShopTab === 'all' 
      ? SHOP_ITEMS 
      : SHOP_ITEMS.filter(i => i.category === activeShopTab);

    filtered.forEach(item => {
      const unitPrice = ITEM_PRICES[item.id] || 1;
      const card = document.createElement('div');
      card.className = 'shop-item-card';

      card.innerHTML = `
        <div class="shop-item-info">
          <img src="${item.image}" alt="${item.name}">
          <div class="shop-item-details">
            <h4>${item.name} ${item.isSauce ? '<span style="color:#ffb300; font-size:0.7rem;">x10</span>' : ''}</h4>
            <p>$${unitPrice.toFixed(2)} ${item.isSauce ? 'per pack' : 'each'} | Stock: ${ingredientStock[item.id] ?? 0}</p>
          </div>
        </div>
        <div class="shop-buy-group">
          <input type="number" min="1" max="100" value="5" id="qty-${item.id}">
          <button class="btn-buy" onclick="buyItem('${item.id}')">Buy</button>
        </div>
      `;
      body.appendChild(card);
    });
  }

  window.buyItem = function(id) {
    const input = document.getElementById(`qty-${id}`);
    const qty = parseInt(input.value) || 1;
    const unitPrice = ITEM_PRICES[id] || 1;
    const totalCost = unitPrice * qty;

    if (currentGameMode === 'sandbox') {
      alert("Sandbox mode has infinite resources and no money needed!");
      return;
    }

    if (playerMoney < totalCost) {
      alert("Not enough money in your wallet!");
      return;
    }

    playerMoney -= totalCost;
    ingredientStock[id] = (ingredientStock[id] ?? 0) + qty;
    saveStock();
    updateMoneyDisplay();
    renderIngredientsMenu();
    renderSauces();
    renderShopModal();
    playSound(SOUNDS.buttons);
  }

  const shopModal = document.getElementById('shopModal');
  document.getElementById('openShopBtn').onclick = () => { playSound(SOUNDS.buttons); renderShopModal(); shopModal.classList.add('open'); };
  document.getElementById('closeShopModal').onclick = () => { playSound(SOUNDS.buttons); shopModal.classList.remove('open'); };
  shopModal.onclick = (e) => { if (e.target === shopModal) shopModal.classList.remove('open'); };

  const recipesModal = document.getElementById('recipesModal');
  document.getElementById('openRecipesBtn').onclick = () => { playSound(SOUNDS.buttons); renderRecipesModal(); recipesModal.classList.add('open'); };
  document.getElementById('closeRecipesModal').onclick = () => { playSound(SOUNDS.buttons); recipesModal.classList.remove('open'); };
  recipesModal.onclick = (e) => { if (e.target === recipesModal) recipesModal.classList.remove('open'); };

  const achievementsModal = document.getElementById('achievementsModal');
  document.getElementById('openAchievementsBtn').onclick = () => { playSound(SOUNDS.buttons); renderAchievementsModal(); achievementsModal.classList.add('open'); };
  document.getElementById('closeAchievementsModal').onclick = () => { playSound(SOUNDS.buttons); achievementsModal.classList.remove('open'); };
  achievementsModal.onclick = (e) => { if (e.target === achievementsModal) achievementsModal.classList.remove('open'); };

  const settingsModal = document.getElementById('settingsModal');
  document.getElementById('openSettingsBtn').onclick = () => { playSound(SOUNDS.buttons); settingsModal.classList.add('open'); };
  document.getElementById('closeSettingsModal').onclick = () => { playSound(SOUNDS.buttons); settingsModal.classList.remove('open'); };
  settingsModal.onclick = (e) => { if (e.target === settingsModal) settingsModal.classList.remove('open'); };
  
  const resetAchBtn = document.getElementById('resetAchievementsBtn');
  if (resetAchBtn) {
    resetAchBtn.onclick = () => {
      if(confirm('Reset achievements?')) {
        unlockedAchievements = {};
        localStorage.removeItem('unlocked_achievements');
        renderAchievementsModal();
        renderRecipesModal();
      }
    };
  }

  const toggleUiBtn = document.getElementById('toggleUiBtn');
  if (toggleUiBtn) {
    toggleUiBtn.onclick = () => {
      document.body.classList.toggle('ui-hidden');
      toggleUiBtn.innerText = document.body.classList.contains('ui-hidden') ? '👁️‍🗨️' : '👁️';
    };
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  function updateOrderWidgetsText(text) {
    const w1 = document.getElementById('orderStatusText');
    const w2 = document.getElementById('orderStatusTextMobile');
    if (w1) w1.innerHTML = text;
    if (w2) w2.innerHTML = text;
  }

  if (currentGameMode === 'sandbox' && currentGameSpeed === 'no-orders') {
    document.getElementById('topOrderWidget').classList.add('hidden');
    const mobileWidget = document.getElementById('topOrderWidgetMobile');
    if (mobileWidget) mobileWidget.classList.add('hidden');
  } else if (currentActiveOrder) {
    if (currentGameMode === 'turbo') {
      updateOrderWidgetsText(`🔔 Order: <span>${currentActiveOrder.name}</span> <span class="order-timer-badge">⏱️ ${formatTime(currentTurboTimeLeft)}</span>`);
    } else {
      updateOrderWidgetsText(`🔔 Order: <span>${currentActiveOrder.name}</span>`);
    }
  }

  setInterval(() => {
    if (currentGameMode === 'sandbox' && currentGameSpeed === 'no-orders') return;

    if (currentGameMode === 'turbo') {
      if (!currentActiveOrder) {
        triggerRandomOrder();
      } else {
        if (currentTurboTimeLeft > 0) {
          currentTurboTimeLeft--;
          updateOrderWidgetsText(`🔔 Order: <span>${currentActiveOrder.name}</span> <span class="order-timer-badge">⏱️ ${formatTime(currentTurboTimeLeft)}</span>`);
        } else {
          currentTurboTimeLeft = 180;
          playerMoney = Math.max(0, playerMoney - 5);
          updateMoneyDisplay();
          showToast({title: 'Time Out! -$5'}, 'Order Failed', 'You ran out of time!');
          triggerRandomOrder();
        }
      }
      return;
    }

    if (!currentActiveOrder) {
      if (timeUntilNextOrder > 0) {
        timeUntilNextOrder--;
        saveOrderState();
        updateOrderWidgetsText(`Next order in: <span>${formatTime(timeUntilNextOrder)}</span>`);
      } else {
        triggerRandomOrder();
      }
    }
  }, 1000);

  function triggerRandomOrder() {
    const unlockedSecretNames = SECRET_ACHIEVEMENTS.filter(a => unlockedAchievements[a.id]);
    const allAvailable = [...REGULAR_RECIPES, ...unlockedSecretNames];
    const chosen = allAvailable[Math.floor(Math.random() * allAvailable.length)];
    
    currentActiveOrder = { name: chosen.name || chosen.title, ids: chosen.ids };
    currentTurboTimeLeft = 180;
    timeUntilNextOrder = getRandomTimeForSpeed(currentGameSpeed);
    saveOrderState();

    if (currentGameMode === 'turbo') {
      updateOrderWidgetsText(`🔔 Order: <span>${currentActiveOrder.name}</span> <span class="order-timer-badge">⏱️ 03:00</span>`);
    } else {
      updateOrderWidgetsText(`🔔 Order: <span>${currentActiveOrder.name}</span>`);
    }
    playSound(SOUNDS.order);
  }

  const MAX_INGREDIENTS = 30;
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

  let currentBurger = JSON.parse(localStorage.getItem('saved_burger_stack')) || [];
  let isEating = false;
  let isSqueezed = false;

  function saveBurgerState() {
    localStorage.setItem('saved_burger_stack', JSON.stringify(currentBurger));
  }

  const burgerStack = document.getElementById('burgerStack');
  const layersList = document.getElementById('layersList');
  const layersTitle = document.getElementById('layersTitle');
  const ingredientsMenu = document.getElementById('ingredientsMenu');
  const desktopSaucesGroup = document.getElementById('desktopSaucesGroup');
  const mobileSaucesGroup = document.getElementById('mobileSaucesGroup');
  const centerStage = document.getElementById('centerStage');
  const limitWarning = document.getElementById('limitWarning');

  function renderIngredientsMenu() {
    if (!ingredientsMenu) return;
    ingredientsMenu.innerHTML = '';
    INGREDIENTS.forEach(item => {
      const card = document.createElement('div');
      const stock = ingredientStock[item.id] ?? 0;
      const isOut = currentGameMode !== 'sandbox' && stock <= 0;

      card.className = `ingredient-card ${currentBurger.length >= MAX_INGREDIENTS || isEating || isOut ? 'disabled' : ''}`;
      
      let countHtml = currentGameMode === 'sandbox' ? '' : `<span class="ingredient-stock-count">${stock}</span>`;
      card.innerHTML = `<img src="${item.image}" alt="${item.name}">${countHtml}`;
      
      card.onclick = () => {
        if (isEating) return;
        if (isOut) { alert(`Out of ${item.name}! Buy more in the shop 🏬.`); return; }
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
        chip.innerText = `${sauce.name}${currentGameMode === 'sandbox' ? '' : ' (' + stock + ')'}`;
        
        chip.onclick = () => {
          if (isEating) return;
          if (isOut) { alert(`Out of ${sauce.name}! Buy more in the shop 🏬.`); return; }
          addSauce(sauce);
        };
        container.appendChild(chip);
      });
    });
  }

  function calculateBurgerCost(ids) {
    return ids.reduce((sum, id) => sum + (ITEM_PRICES[id] || 1), 0);
  }

  function getSpeedMultiplier(speed) {
    switch(speed) {
      case 'turbo': return 1.3;
      case 'super-fast': return 1.5;
      case 'fast': return 1.7;
      case 'medium': return 2.0;
      case 'slow': return 2.5;
      case 'super-slow': return 3.0;
      default: return 2.0;
    }
  }

  function checkOrderCompletion(ids) {
    if (!currentActiveOrder) return;
    const targetIds = currentActiveOrder.ids;
    if (ids.length === targetIds.length && ids.every((val, idx) => val === targetIds[idx])) {
      playSound(SOUNDS.complete);
      
      let earnedText = '';
      if (currentGameMode !== 'sandbox') {
        const cost = calculateBurgerCost(ids);
        const mult = getSpeedMultiplier(currentGameSpeed);
        const reward = Math.round(cost * mult * 100) / 100;
        playerMoney = (isNaN(playerMoney) ? 100 : playerMoney) + reward;
        updateMoneyDisplay();
        earnedText = `+$${reward.toFixed(2)}`;
      }

      showToast(null, 'Order Complete!', `${currentActiveOrder.name} served successfully! ${earnedText}`);

      currentActiveOrder = null;
      currentTurboTimeLeft = 180;
      timeUntilNextOrder = getRandomTimeForSpeed(currentGameSpeed);
      saveOrderState();

      setTimeout(() => {
        triggerEatAnimation();
      }, 600);
    }
  }

  function matchIds(ids, targetIds) {
    return ids.length === targetIds.length && ids.every((val, idx) => val === targetIds[idx]);
  }

  function checkSpecialCombos() {
    if (currentBurger.length === 0) return;
    const ids = currentBurger.map(i => i.id);

    SECRET_ACHIEVEMENTS.forEach(ach => {
      if (matchIds(ids, ach.ids)) {
        unlockAchievement(ach);
      }
    });

    checkOrderCompletion(ids);
  }

  function getMarginBottomForLayer(item, itemBelow, index) {
    const isSauce = ['mayo', 'ketchup', 'mustard', 'spicy', 'bbq'].includes(item.id);
    if (index === 0) return -10;
    if (isSauce) return -50;
    if (item.id === 'top-bun') return -38;
    if (item.id === 'cheese') return -60;
    if (item.id === 'hashbrown') return -38;
    if (item.id === 'fried-egg') return -52;
    if (item.id === 'fried-bacon') return -48;
    if (item.id === 'lettuce') return -65;
    if (itemBelow && itemBelow.id === 'lettuce') return -50;
    return -38;
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
          img.style.marginBottom = `${getMarginBottomForLayer(item, itemBelow, index)}px`;
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
    if (centerStage) {
      setTimeout(() => { centerStage.scrollTop = centerStage.scrollHeight; }, 50);
    }
  }

  function showLimitWarning() {
    if (limitWarning) {
      limitWarning.classList.add('show');
      setTimeout(() => limitWarning.classList.remove('show'), 2000);
    }
  }

  function addIngredient(item) {
    if (currentBurger.length >= MAX_INGREDIENTS) { showLimitWarning(); return; }
    
    if (currentGameMode !== 'sandbox') {
      if ((ingredientStock[item.id] ?? 0) <= 0) return;
      ingredientStock[item.id]--;
      saveStock();
    }

    playSound(SOUNDS.ingridients);
    currentBurger.push({ ...item });
    checkSpecialCombos();
    updateBurgerDisplay(true);
  }

  function addSauce(sauce) {
    if (currentBurger.length >= MAX_INGREDIENTS) { showLimitWarning(); return; }
    
    if (currentGameMode !== 'sandbox') {
      if ((ingredientStock[sauce.id] ?? 0) <= 0) return;
      ingredientStock[sauce.id]--;
      saveStock();
    }

    playSound(SOUNDS.sauce);
    currentBurger.push({ ...sauce });
    checkSpecialCombos();
    updateBurgerDisplay(true);
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

  const resetBtn = document.getElementById('resetBtn');
  if (resetBtn) {
    resetBtn.onclick = () => {
      if (currentGameMode !== 'sandbox' && currentBurger.length > 0) {
        currentBurger.forEach(item => {
          ingredientStock[item.id] = (ingredientStock[item.id] ?? 0) + 1;
        });
        saveStock();
      }

      playSound(SOUNDS.bin);
      isEating = false; isSqueezed = false;
      if (burgerStack) burgerStack.classList.remove('eating');
      currentBurger = [];
      updateBurgerDisplay(false);
    };
  }

  function spawnCrumbs() {
    if (!burgerStack) return;
    const colors = ['#e0a96d', '#8d6e63', '#d7ccc8', '#ffd54f', '#81c784'];
    const rect = burgerStack.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height / 2;
    for (let i = 0; i < 12; i++) {
      const crumb = document.createElement('div');
      crumb.className = 'crumb';
      const size = Math.floor(Math.random() * 6) + 4;
      crumb.style.width = `${size}px`; crumb.style.height = `${size}px`;
      crumb.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      crumb.style.left = `${originX}px`; crumb.style.top = `${originY}px`;
      crumb.style.setProperty('--dx', (Math.random() - 0.5) * 160 + 'px');
      crumb.style.setProperty('--dy', (Math.random() - 0.5) * 160 + 'px');
      crumb.style.setProperty('--rot', (Math.random() - 0.5) * 360 + 'deg');
      document.body.appendChild(crumb);
      setTimeout(() => crumb.remove(), 600);
    }
  }

  function triggerEatAnimation() {
    if (currentBurger.length === 0 || isEating) return;
    playSound(SOUNDS.eating);
    isEating = true; isSqueezed = false;
    if (burgerStack) burgerStack.classList.add('eating');
    spawnCrumbs();
    renderIngredientsMenu();
    setTimeout(() => {
      currentBurger = [];
      if (burgerStack) burgerStack.classList.remove('eating');
      isEating = false;
      updateBurgerDisplay(false);
    }, 2000);
  }

  if (eatBtn) eatBtn.onclick = triggerEatAnimation;

  const downloadPngBtn = document.getElementById('downloadPngBtn');
  if (downloadPngBtn) {
    downloadPngBtn.onclick = async () => {
      if (currentBurger.length === 0) { alert('Build a burger first!'); return; }
      playSound(SOUNDS.buttons);
      if (!burgerStack) return;
      const imagesInStack = burgerStack.querySelectorAll('.burger-layer-img');
      if (imagesInStack.length === 0) return;

      const loadedImages = await Promise.all(currentBurger.map(item => new Promise((resolve) => {
        const img = new Image(); img.src = item.image;
        img.onload = () => resolve(img); img.onerror = () => resolve(null);
      })));

      const layerRects = Array.from(imagesInStack).map(imgEl => imgEl.getBoundingClientRect());
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      layerRects.forEach(rect => {
        if (rect.left < minX) minX = rect.left;
        if (rect.top < minY) minY = rect.top;
        if (rect.right > maxX) maxX = rect.right;
        if (rect.bottom > maxY) maxY = rect.bottom;
      });

      const scale = 2, padding = 40;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = ((maxX - minX) + padding * 2) * scale;
      canvas.height = ((maxY - minY) + padding * 2) * scale;
      ctx.scale(scale, scale);

      loadedImages.forEach((img, index) => {
        if (!img) return;
        const rect = layerRects[index];
        ctx.drawImage(img, (rect.left - minX) + padding, (rect.top - minY) + padding, rect.width, rect.height);
      });

      const link = document.createElement('a');
      link.download = 'my-burger.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
  }

  renderSauces();
  renderIngredientsMenu();
  updateBurgerDisplay(false);
  updatePinnedWidget();
  updateMoneyDisplay();
});
