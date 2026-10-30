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
      "• Achievements & Secret Recipes\n" +
      "• Custom orders & progress\n\n" +
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

  function showToast(ach) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'achievement-toast';
    toast.innerHTML = `
      <h4 style="font-size:0.9rem; margin:0;">${ach.title}</h4>
      <p style="font-size:0.75rem; opacity:0.8; margin:0;">Secret recipe unlocked!</p>
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
      card.className = 'ingredient-card';
      if (currentBurger.length >= MAX_INGREDIENTS || isEating) card.classList.add('disabled');
      card.innerHTML = `<img src="${item.image}" alt="${item.name}">`;
      card.onclick = () => { if (!isEating) addIngredient(item); };
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
        chip.className = 'sauce-chip';
        chip.innerText = sauce.name;
        chip.onclick = () => { if (!isEating) addSauce(sauce); };
        container.appendChild(chip);
      });
    });
  }

  function checkOrderCompletion(ids) {
    if (!currentActiveOrder) return;
    const targetIds = currentActiveOrder.ids;
    if (ids.length === targetIds.length && ids.every((val, idx) => val === targetIds[idx])) {
      playSound(SOUNDS.complete);
      
      const container = document.getElementById('toastContainer');
      if (container) {
        const toast = document.createElement('div');
        toast.className = 'achievement-toast';
        toast.innerHTML = `
          <h4 style="font-size:0.9rem; margin:0;">Order Complete!</h4>
          <p style="font-size:0.75rem; opacity:0.8; margin:0;">${currentActiveOrder.name} served successfully</p>
        `;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
      }

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
    playSound(SOUNDS.ingridients);
    currentBurger.push({ ...item });
    checkSpecialCombos();
    updateBurgerDisplay(true);
  }

  function addSauce(sauce) {
    if (currentBurger.length >= MAX_INGREDIENTS) { showLimitWarning(); return; }
    playSound(SOUNDS.sauce);
    currentBurger.push({ ...sauce });
    checkSpecialCombos();
    updateBurgerDisplay(true);
  }

  window.removeLayer = function(index) {
    if (isEating) return;
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
});
