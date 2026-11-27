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
    saturnBurger: safeAudio('audio/saturn-burger.png'.replace('.png', '.mp3')),
    bustanator: safeAudio('audio/bustanator.mp3'),
    mcPicklePounder: safeAudio('audio/mc-pickle-pounder.mp3'),
    sizzling: safeAudio('audio/sizzling.mp3'),
    burnt: safeAudio('audio/burnt.mp3'),
    chop: safeAudio('audio/ingridients.mp3'),
    cutting: safeAudio('audio/cutting.mp3'),
    washing: safeAudio('audio/washing.mp3'),
    notification: safeAudio('audio/notification.mp3')
  };

  let sfxVolumeLevel = parseFloat(localStorage.getItem('burger_sfx_volume'));
  if (isNaN(sfxVolumeLevel)) {
    const legacyVol = parseFloat(localStorage.getItem('burger_volume'));
    sfxVolumeLevel = isNaN(legacyVol) ? 0.5 : legacyVol;
  }

  let musicVolumeLevel = parseFloat(localStorage.getItem('burger_music_volume'));
  if (isNaN(musicVolumeLevel)) musicVolumeLevel = 0.05;

  function playSound(audio) {
    if (!audio) return;
    try {
      audio.currentTime = 0;
      audio.volume = sfxVolumeLevel;
      audio.play().catch(() => {});
    } catch(e) {}
  }

  // --- MUSIC PLAYLIST & PLAYER ---
  const MUSIC_TRACKS = [
    { title: 'Aqua Frutiger Aero Chillwave', src: 'music/9jackjack8-aqua-frutiger-aero-chillwave-532669.mp3' },
    { title: 'Dreamy Glass Aerowave', src: 'music/9jackjack8-dreamy-glass-aerowave-556871.mp3' },
    { title: 'Drift Away Ambient Texture', src: 'music/9jackjack8-drift-away-ambient-texture-619612.mp3' },
    { title: 'Future Office Frutiger Aero Chill', src: 'music/9jackjack8-future-office-frutiger-aero-chill-nostalgic-624710.mp3' },
    { title: 'Ocean Bubbles Frutiger Aqua Game', src: 'music/9jackjack8-ocean-bubbles-frutiger-aqua-game-550245.mp3' },
    { title: 'Petal Frutiger Aero Ambient', src: 'music/9jackjack8-petal-frutiger-aero-ambient-587794.mp3' },
    { title: 'White Space Aerowave Ambient', src: 'music/9jackjack8-white-space-aerowave-ambient-nostalgic-600046.mp3' },
    { title: 'Angelic Frutiger Aero', src: 'music/mewwwwwww-angelic-frutiger-aero-554728.mp3' },
    { title: 'Frutiger Aero', src: 'music/mewwwwwww-frutiger-aero-472282.mp3' },
    { title: 'Technozen', src: 'music/mewwwwwww-technozen-554729.mp3' }
  ];

  let currentTrackIndex = parseInt(localStorage.getItem('burger_music_track_index'), 10);
  if (isNaN(currentTrackIndex) || currentTrackIndex < 0 || currentTrackIndex >= MUSIC_TRACKS.length) {
    currentTrackIndex = 0;
  }

  let savedMusicPosition = parseFloat(localStorage.getItem('burger_music_position'));
  if (isNaN(savedMusicPosition) || savedMusicPosition < 0) {
    savedMusicPosition = 0;
  }

  const savedPlayingRaw = localStorage.getItem('burger_music_playing');
  let isMusicPlaying = savedPlayingRaw === null ? true : (savedPlayingRaw === 'true');
  let musicAudio = null;
  let musicToastTimer = null;
  let musicToastEl = null;
  let unlockListenerAttached = false;
  let unlockHandlerRef = null;
  let pendingPlayOnReady = false;
  let pendingToastOnPlay = false;
  let pendingToastPrefix = '🎵 Now playing';
  let readyPlayTimeout = null;
  let pendingSeekTime = null;

  function saveMusicPosition(forceTime = null) {
    let pos = 0;
    if (typeof forceTime === 'number' && !isNaN(forceTime) && forceTime >= 0) {
      pos = forceTime;
    } else if (musicAudio && !isNaN(musicAudio.currentTime) && musicAudio.currentTime > 0) {
      pos = musicAudio.currentTime;
    } else if (pendingSeekTime !== null && pendingSeekTime >= 0) {
      pos = pendingSeekTime;
    } else {
      pos = savedMusicPosition;
    }
    savedMusicPosition = Math.max(0, pos);
    localStorage.setItem('burger_music_position', String(savedMusicPosition));
  }

  function applyPendingSeekIfReady() {
    if (!musicAudio || pendingSeekTime === null || pendingSeekTime <= 0) return;
    if (musicAudio.readyState >= 1) {
      const target = (musicAudio.duration && isFinite(musicAudio.duration))
        ? Math.min(pendingSeekTime, Math.max(0, musicAudio.duration - 0.5))
        : pendingSeekTime;
      try {
        musicAudio.currentTime = Math.max(0, target);
        pendingSeekTime = null;
      } catch (e) {}
    }
  }

  function isSettingsOpen() {
    const sm = document.getElementById('settingsModal');
    return Boolean(sm && sm.classList.contains('open'));
  }

  function getMobileIngredientsTopAnchor() {
    const rp = document.getElementById('rightPanel');
    if (rp) {
      const rpStyle = window.getComputedStyle(rp);
      const rpRect = rp.getBoundingClientRect();
      if (rpStyle.display !== 'none' && rpRect.width > 0 && rpRect.height > 0) {
        return rpRect;
      }
    }
    const im = document.getElementById('ingredientsMenu');
    if (im) {
      const imStyle = window.getComputedStyle(im);
      const imRect = im.getBoundingClientRect();
      if (imStyle.display !== 'none' && imRect.width > 0 && imRect.height > 0) {
        return imRect;
      }
    }
    return null;
  }

  function positionMusicToast() {
    if (!musicToastEl) return;

    musicToastEl.style.top = 'auto';
    musicToastEl.style.bottom = 'auto';
    musicToastEl.style.left = 'auto';
    musicToastEl.style.right = 'auto';
    musicToastEl.style.transform = 'none';
    musicToastEl.style.width = 'max-content';
    musicToastEl.style.maxWidth = 'calc(100vw - 24px)';
    musicToastEl.style.boxSizing = 'border-box';
    musicToastEl.style.whiteSpace = 'nowrap';
    musicToastEl.style.overflow = 'hidden';
    musicToastEl.style.textOverflow = 'ellipsis';

    if (document.body.classList.contains('ui-hidden')) {
      musicToastEl.style.display = 'none';
      return;
    } else {
      musicToastEl.style.display = '';
    }

    const isMobile = window.innerWidth <= 900;
    const lp = document.getElementById('leftPanel');
    const bp = document.getElementById('bottomPanel');

    if (isMobile) {
      const menuRect = getMobileIngredientsTopAnchor();
      const serveBtn = document.getElementById('serveFloatingBtn');
      let leftPos = 10;
      let bottomPos = 12;

      if (menuRect) {
        leftPos = Math.max(8, Math.min(menuRect.left, window.innerWidth - 180));
        let topObstacle = menuRect.top;

        if (serveBtn && currentScreen === 'assembly') {
          const sbStyle = window.getComputedStyle(serveBtn);
          const sbRect = serveBtn.getBoundingClientRect();
          if (
            sbStyle.display !== 'none' &&
            !serveBtn.classList.contains('hidden-serve-btn') &&
            sbRect.width > 0 &&
            sbRect.height > 0 &&
            sbRect.top < topObstacle
          ) {
            topObstacle = sbRect.top;
          }
        }

        bottomPos = Math.max(8, window.innerHeight - topObstacle + 8);
      } else if (bp) {
        const bpStyle = window.getComputedStyle(bp);
        const bpRect = bp.getBoundingClientRect();
        if (bpStyle.display !== 'none' && bpRect.width > 0 && bpRect.height > 0) {
          leftPos = Math.max(8, bpRect.left);
          bottomPos = Math.max(8, window.innerHeight - bpRect.top + 8);
        }
      }

      musicToastEl.style.maxWidth = `calc(100vw - ${leftPos + 12}px)`;
      musicToastEl.style.left = `${leftPos}px`;
      musicToastEl.style.bottom = `${bottomPos}px`;
    } else {
      let leftPos = 16;
      let bottomPos = 16;

      if (lp) {
        const lpRect = lp.getBoundingClientRect();
        if (lpRect.width > 0 && lpRect.height > 0) {
          leftPos = Math.max(12, lpRect.right + 8);
          if (bp) {
            const bpRect = bp.getBoundingClientRect();
            if (bpRect.width > 0 && bpRect.height > 0) {
              bottomPos = Math.max(12, window.innerHeight - bpRect.top + 8);
            }
          } else {
            bottomPos = Math.max(12, window.innerHeight - lpRect.bottom);
          }
        }
      } else if (bp) {
        const bpRect = bp.getBoundingClientRect();
        if (bpRect.width > 0 && bpRect.height > 0) {
          leftPos = Math.max(12, bpRect.left);
          bottomPos = Math.max(12, window.innerHeight - bpRect.top + 8);
        }
      }

      musicToastEl.style.maxWidth = `calc(100vw - ${leftPos + 16}px)`;
      musicToastEl.style.left = `${leftPos}px`;
      musicToastEl.style.bottom = `${bottomPos}px`;
    }
  }

  function ensureMusicToastEl() {
    if (!musicToastEl) {
      musicToastEl = document.getElementById('musicToast');
      if (!musicToastEl) {
        musicToastEl = document.createElement('div');
        musicToastEl.id = 'musicToast';
        musicToastEl.className = 'music-toast';
        document.body.appendChild(musicToastEl);
      }
      musicToastEl.style.position = 'fixed';
      musicToastEl.style.zIndex = '9500';
      musicToastEl.style.pointerEvents = 'none';
    }
    positionMusicToast();
    return musicToastEl;
  }

  function showMusicToast(trackTitle, statusPrefix = '🎵 Now playing') {
    if (isSettingsOpen()) return;
    const toast = ensureMusicToastEl();
    if (!toast) return;
    toast.innerText = `${statusPrefix}: ${trackTitle}`;
    positionMusicToast();
    toast.classList.add('visible');
    if (musicToastTimer) clearTimeout(musicToastTimer);
    musicToastTimer = setTimeout(() => {
      toast.classList.remove('visible');
    }, 3000);
  }

  function unbindUnlockMusicListeners() {
    unlockListenerAttached = false;
    if (unlockHandlerRef) {
      window.removeEventListener('pointerdown', unlockHandlerRef, true);
      window.removeEventListener('touchstart', unlockHandlerRef, true);
      window.removeEventListener('keydown', unlockHandlerRef, true);
      unlockHandlerRef = null;
    }
  }

  function bindUnlockMusicOnFirstInteraction() {
    if (unlockListenerAttached) return;
    if (localStorage.getItem('burger_music_playing') === 'false') return;
    unlockListenerAttached = true;

    unlockHandlerRef = () => {
      unbindUnlockMusicListeners();
      if (localStorage.getItem('burger_music_playing') === 'false') return;
      const track = MUSIC_TRACKS[currentTrackIndex];
      if (!track) return;
      if (!musicAudio || !musicAudio.src) {
        loadMusicTrack(currentTrackIndex, true, !isSettingsOpen(), savedMusicPosition);
      } else {
        applyPendingSeekIfReady();
        executePlayNow(track, !isSettingsOpen(), '🎵 Now playing');
      }
    };

    window.addEventListener('pointerdown', unlockHandlerRef, { capture: true, once: true });
    window.addEventListener('touchstart', unlockHandlerRef, { capture: true, once: true });
    window.addEventListener('keydown', unlockHandlerRef, { capture: true, once: true });
  }

  function getTrackTitleEl() {
    return document.getElementById('musicTrackDisplay') || document.getElementById('musicTrackTitle');
  }

  function getPlayPauseBtnEl() {
    return document.getElementById('musicPlayPauseBtn') || document.getElementById('musicToggleBtn');
  }

  function updateMusicPlayerUI() {
    const titleEl = getTrackTitleEl();
    const toggleBtn = getPlayPauseBtnEl();
    const track = MUSIC_TRACKS[currentTrackIndex];
    if (titleEl && track) {
      titleEl.innerText = track.title;
      titleEl.title = track.title;
    }
    if (toggleBtn) {
      toggleBtn.innerText = isMusicPlaying ? '⏸' : '▶';
      toggleBtn.title = isMusicPlaying ? 'Pause' : 'Play';
    }
  }

  function executePlayNow(track, showToastNotify, toastPrefix = '🎵 Now playing') {
    if (!musicAudio || !track) return;
    if (readyPlayTimeout) {
      clearTimeout(readyPlayTimeout);
      readyPlayTimeout = null;
    }
    pendingPlayOnReady = false;
    applyPendingSeekIfReady();
    musicAudio.volume = musicVolumeLevel;

    let playPromise;
    try {
      playPromise = musicAudio.play();
    } catch (e) {
      isMusicPlaying = false;
      localStorage.setItem('burger_music_playing', 'false');
      updateMusicPlayerUI();
      return;
    }

    if (playPromise && typeof playPromise.then === 'function') {
      playPromise.then(() => {
        unbindUnlockMusicListeners();
        applyPendingSeekIfReady();
        isMusicPlaying = true;
        localStorage.setItem('burger_music_playing', 'true');
        updateMusicPlayerUI();
        if (showToastNotify && !isSettingsOpen()) {
          showMusicToast(track.title, toastPrefix);
        }
      }).catch((err) => {
        if (!err || err.name === 'NotAllowedError' || err.name === 'AbortError') {
          isMusicPlaying = true;
          localStorage.setItem('burger_music_playing', 'true');
          updateMusicPlayerUI();
          bindUnlockMusicOnFirstInteraction();
        } else {
          isMusicPlaying = false;
          localStorage.setItem('burger_music_playing', 'false');
          updateMusicPlayerUI();
          if (showToastNotify && !isSettingsOpen()) {
            showToast('Playback unavailable', 'Check audio file or browser permissions', 'warning');
          }
        }
      });
    } else {
      unbindUnlockMusicListeners();
      isMusicPlaying = true;
      localStorage.setItem('burger_music_playing', 'true');
      updateMusicPlayerUI();
      if (showToastNotify && !isSettingsOpen()) {
        showMusicToast(track.title, toastPrefix);
      }
    }
  }

  function startMusicPlay(track, showToastNotify, toastPrefix = '🎵 Now playing') {
    if (!musicAudio || !track) return;
    musicAudio.volume = musicVolumeLevel;

    if (pendingSeekTime !== null && pendingSeekTime > 0 && musicAudio.readyState >= 1) {
      applyPendingSeekIfReady();
    }

    if (musicAudio.readyState >= 2 && pendingSeekTime === null) {
      executePlayNow(track, showToastNotify, toastPrefix);
      return;
    }

    pendingPlayOnReady = true;
    pendingToastOnPlay = Boolean(showToastNotify);
    pendingToastPrefix = toastPrefix;

    if (readyPlayTimeout) clearTimeout(readyPlayTimeout);
    readyPlayTimeout = setTimeout(() => {
      if (pendingPlayOnReady) {
        const shouldNotify = pendingToastOnPlay;
        const prefix = pendingToastPrefix;
        pendingPlayOnReady = false;
        executePlayNow(track, shouldNotify, prefix);
      }
    }, 450);

    try {
      musicAudio.load();
    } catch (e) {}
  }

  function ensureMusicAudioInstance() {
    if (!musicAudio) {
      musicAudio = new Audio();
      musicAudio.preload = 'auto';
      musicAudio.loop = false;

      const onMetaOrReady = () => {
        applyPendingSeekIfReady();
        if (pendingPlayOnReady && musicAudio.readyState >= 2) {
          const track = MUSIC_TRACKS[currentTrackIndex];
          const shouldNotify = pendingToastOnPlay;
          const prefix = pendingToastPrefix;
          pendingPlayOnReady = false;
          if (track) {
            executePlayNow(track, shouldNotify, prefix);
          }
        }
      };

      musicAudio.addEventListener('loadedmetadata', onMetaOrReady);
      musicAudio.addEventListener('canplay', onMetaOrReady);
      musicAudio.addEventListener('loadeddata', onMetaOrReady);

      musicAudio.addEventListener('timeupdate', () => {
        if (musicAudio && !musicAudio.paused && !isNaN(musicAudio.currentTime)) {
          savedMusicPosition = musicAudio.currentTime;
          localStorage.setItem('burger_music_position', String(savedMusicPosition));
        }
      });

      musicAudio.addEventListener('ended', () => {
        savedMusicPosition = 0;
        pendingSeekTime = 0;
        localStorage.setItem('burger_music_position', '0');
        loadMusicTrack(currentTrackIndex + 1, true, !isSettingsOpen(), 0);
      });

      musicAudio.addEventListener('error', () => {
        if (readyPlayTimeout) {
          clearTimeout(readyPlayTimeout);
          readyPlayTimeout = null;
        }
        pendingPlayOnReady = false;
        isMusicPlaying = false;
        localStorage.setItem('burger_music_playing', 'false');
        updateMusicPlayerUI();
        const track = MUSIC_TRACKS[currentTrackIndex];
        if (track) showToast('Audio load error', track.src, 'error');
      });
    }
    return musicAudio;
  }

  function loadMusicTrack(index, autoPlay = false, showToastNotify = false, startPosition = 0) {
    if (MUSIC_TRACKS.length === 0) return;
    currentTrackIndex = ((index % MUSIC_TRACKS.length) + MUSIC_TRACKS.length) % MUSIC_TRACKS.length;
    localStorage.setItem('burger_music_track_index', String(currentTrackIndex));

    const safeStart = Math.max(0, Number(startPosition) || 0);
    savedMusicPosition = safeStart;
    pendingSeekTime = safeStart > 0 ? safeStart : null;
    localStorage.setItem('burger_music_position', String(safeStart));

    const track = MUSIC_TRACKS[currentTrackIndex];
    const audio = ensureMusicAudioInstance();

    if (readyPlayTimeout) {
      clearTimeout(readyPlayTimeout);
      readyPlayTimeout = null;
    }
    pendingPlayOnReady = false;

    try {
      audio.pause();
    } catch (e) {}

    audio.src = track.src;
    audio.volume = musicVolumeLevel;
    audio.load();

    if (autoPlay) {
      isMusicPlaying = true;
      localStorage.setItem('burger_music_playing', 'true');
      updateMusicPlayerUI();
      startMusicPlay(track, showToastNotify && !isSettingsOpen(), '🎵 Now playing');
    } else {
      isMusicPlaying = false;
      localStorage.setItem('burger_music_playing', 'false');
      updateMusicPlayerUI();
    }
  }

  function toggleMusicPlayback(showToastNotify = true) {
    const track = MUSIC_TRACKS[currentTrackIndex];
    if (!musicAudio || !musicAudio.src) {
      loadMusicTrack(currentTrackIndex, true, showToastNotify && !isSettingsOpen(), savedMusicPosition);
      return;
    }

    if (!musicAudio.paused) {
      if (readyPlayTimeout) {
        clearTimeout(readyPlayTimeout);
        readyPlayTimeout = null;
      }
      pendingPlayOnReady = false;
      saveMusicPosition();
      try { musicAudio.pause(); } catch(e) {}
      isMusicPlaying = false;
      localStorage.setItem('burger_music_playing', 'false');
      updateMusicPlayerUI();
      if (showToastNotify && track && !isSettingsOpen()) {
        showMusicToast(track.title, '⏸ Paused');
      }
    } else {
      startMusicPlay(track, showToastNotify && !isSettingsOpen(), '🎵 Now playing');
    }
  }

  function prevMusicTrack() {
    playSound(SOUNDS.buttons);
    loadMusicTrack(currentTrackIndex - 1, true, !isSettingsOpen(), 0);
  }

  function nextMusicTrack() {
    playSound(SOUNDS.buttons);
    loadMusicTrack(currentTrackIndex + 1, true, !isSettingsOpen(), 0);
  }

  function stopMusicPlayback() {
    unbindUnlockMusicListeners();
    if (readyPlayTimeout) {
      clearTimeout(readyPlayTimeout);
      readyPlayTimeout = null;
    }
    pendingPlayOnReady = false;
    savedMusicPosition = 0;
    pendingSeekTime = null;
    localStorage.setItem('burger_music_position', '0');
    if (musicAudio) {
      try {
        musicAudio.pause();
        musicAudio.currentTime = 0;
        musicAudio.removeAttribute('src');
        musicAudio.load();
      } catch(e) {}
    }
    isMusicPlaying = false;
    localStorage.setItem('burger_music_playing', 'false');
    updateMusicPlayerUI();
  }

  window.addEventListener('beforeunload', () => {
    saveMusicPosition();
    localStorage.setItem('burger_music_track_index', String(currentTrackIndex));
    localStorage.setItem('burger_music_playing', String(isMusicPlaying));
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      saveMusicPosition();
    } else if (musicAudio && musicAudio.src && musicAudio.paused && !unlockListenerAttached) {
      const shouldResume = localStorage.getItem('burger_music_playing') === 'true' || pendingPlayOnReady;
      if (shouldResume) {
        const track = MUSIC_TRACKS[currentTrackIndex];
        if (track) startMusicPlay(track, false);
      }
    }
  });

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
  const sinkStage = document.getElementById('sinkStage');
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

    const criticBadge = document.getElementById('criticModifierBadge');
    if (criticBadge) {
      criticBadge.addEventListener('click', (e) => {
        e.stopPropagation();
        criticBadge.classList.toggle('dimmed');
      });
    }
  }
  initOpacityToggle();

  const MAX_INGREDIENTS = 30;
  let currentGameMode = localStorage.getItem('burger_game_mode') || 'casual';

  function getModeKey(baseKey) {
    return `${baseKey}_${currentGameMode}`;
  }

  let currentBurger = [];
  let ingredientStock = {};
  let dirtyStock = {};
  let grillSlots = [];
  let boardSlots = [];
  let sinkSlots = [];
  let playerMoney = 100.00;
  let currentActiveOrder = null;
  let timeUntilNextOrder = 120;
  let currentTurboTimeLeft = 180;
  let dailyQuestsData = null;

  const UPGRADES_CONFIG = {
    extra_slots: {
      id: 'extra_slots',
      name: 'Extra Slots',
      icon: '🍽️',
      maxLevel: 3,
      prices: { 1: 150, 2: 350, 3: 750 },
      descriptions: {
        0: '+1 slot on Grill, Board and Sink (3 → 4)',
        1: '+1 slot on Grill, Board and Sink (4 → 5)',
        2: '+1 slot on Grill, Board and Sink (5 → 6)',
        3: 'Max level reached (6 slots per station)'
      }
    },
    speed_up: {
      id: 'speed_up',
      name: 'Speed Up',
      icon: '⚡',
      maxLevel: 3,
      prices: { 1: 120, 2: 280, 3: 600 },
      descriptions: {
        0: '-20% cooking, chopping and washing time',
        1: '-40% cooking, chopping and washing time',
        2: 'Instant completion (click slot to collect)',
        3: 'Max level reached (Instant completion)'
      }
    },
    slow_burn: {
      id: 'slow_burn',
      name: 'Slow Burn',
      icon: '🔥',
      maxLevel: 3,
      prices: { 1: 100, 2: 240, 3: 520 },
      descriptions: {
        0: '+50% time before grill items burn',
        1: '+100% time before grill items burn',
        2: 'Prevents grill items from burning completely',
        3: 'Max level reached (No burning)'
      }
    },
    charm: {
      id: 'charm',
      name: 'Charm',
      icon: '✨',
      maxLevel: 3,
      prices: { 1: 140, 2: 320, 3: 700 },
      descriptions: {
        0: '+15s Turbo timer & helps with mixed layer order',
        1: '+30s Turbo timer & softer wrong/poison penalties',
        2: '+45s Turbo timer & minimal penalties',
        3: 'Max level reached (+45s & strong protection)'
      }
    }
  };

  let upgradesLevels = {
    extra_slots: 0,
    speed_up: 0,
    slow_burn: 0,
    charm: 0
  };

  function getDefaultUpgradesLevels() {
    return { extra_slots: 0, speed_up: 0, slow_burn: 0, charm: 0 };
  }

  function sanitizeUpgradesLevels(raw) {
    const base = getDefaultUpgradesLevels();
    if (!raw || typeof raw !== 'object') return base;
    Object.keys(base).forEach(key => {
      const val = parseInt(raw[key], 10);
      const maxLv = UPGRADES_CONFIG[key] ? UPGRADES_CONFIG[key].maxLevel : 3;
      base[key] = isNaN(val) ? 0 : Math.max(0, Math.min(maxLv, val));
    });
    return base;
  }

  function saveUpgradesState() {
    localStorage.setItem(getModeKey('burger_upgrades'), JSON.stringify(upgradesLevels));
  }

  function getUpgradeLevel(key) {
    return upgradesLevels[key] ?? 0;
  }

  function getTargetSlotCount() {
    return 3 + getUpgradeLevel('extra_slots');
  }

  function syncStationSlotArraysToTargetCount() {
    const targetCount = getTargetSlotCount();
    const syncArr = (arr) => {
      if (!Array.isArray(arr)) return Array(targetCount).fill(null);
      if (arr.length < targetCount) {
        return arr.concat(Array(targetCount - arr.length).fill(null));
      }
      if (arr.length > targetCount) {
        return arr.slice(0, targetCount);
      }
      return arr;
    };
    grillSlots = syncArr(grillSlots);
    boardSlots = syncArr(boardSlots);
    sinkSlots = syncArr(sinkSlots);
  }

  function getSpeedUpLevel() {
    return getUpgradeLevel('speed_up');
  }

  function getActionDurationSeconds(baseSeconds) {
    const lv = getSpeedUpLevel();
    if (lv >= 3) return 0;
    if (lv === 2) return Math.max(0.2, baseSeconds * 0.6);
    if (lv === 1) return Math.max(0.2, baseSeconds * 0.8);
    return baseSeconds;
  }

  function isInstantFinishActive() {
    return getSpeedUpLevel() >= 3;
  }

  function getBurnDurationSeconds(baseBurnSeconds) {
    const lv = getUpgradeLevel('slow_burn');
    if (lv >= 3) return Infinity;
    if (lv === 2) return baseBurnSeconds * 2.0;
    if (lv === 1) return baseBurnSeconds * 1.5;
    return baseBurnSeconds;
  }

  function isNoBurnActive() {
    return getUpgradeLevel('slow_burn') >= 3;
  }

  function getCharmLevel() {
    return getUpgradeLevel('charm');
  }

  function getTurboBaseDurationSeconds() {
    const charmBonus = [0, 15, 30, 45][getCharmLevel()] || 0;
    return 150 + charmBonus;
  }

  function loadModeData() {
    currentBurger = JSON.parse(localStorage.getItem(getModeKey('saved_burger_stack'))) || [];

    let defaultMoney = (currentGameMode === 'sandbox') ? 999999 : 100.00;
    playerMoney = parseFloat(localStorage.getItem(getModeKey('burger_money')));
    if (isNaN(playerMoney)) playerMoney = defaultMoney;

    ingredientStock = JSON.parse(localStorage.getItem(getModeKey('burger_ingredient_stock'))) || {
      'top-bun': 10, 'bottom-bun': 10,
      'beef-patty': 0, 'chicken-patty': 0, 'fish-patty': 0, 'fried-bacon': 0, 'fried-egg': 0,
      'cheese': 0, 'raw-cheese': 0, 'uncut-cheese': 5,
      'hashbrown': 0,
      'champignons': 0, 'raw-champignons': 0, 'uncut-champignons': 0, 'unwashed-uncut-champignons': 5,
      'lettuce': 0, 'uncut-lettuce': 0, 'unwashed-uncut-lettuce': 5,
      'tomato': 0, 'uncut-tomato': 0, 'unwashed-uncut-tomato': 5,
      'pickles': 0, 'uncut-pickles': 0, 'unwashed-uncut-pickles': 5,
      'red-onion': 0, 'uncut-red-onion': 0, 'unwashed-uncut-red-onion': 5,
      'white-onion': 0, 'uncut-white-onion': 0, 'unwashed-uncut-white-onion': 5,
      'mayo': 20, 'ketchup': 20, 'mustard': 20, 'spicy': 20, 'bbq': 20,
      'raw-beef-patty': 5, 'raw-chicken-patty': 5, 'raw-fish-patty': 5, 'raw-hashbrown': 5,
      'raw-bacon': 5, 'raw-egg': 5
    };

    dirtyStock = JSON.parse(localStorage.getItem(getModeKey('burger_dirty_stock'))) || {};

    grillSlots = JSON.parse(localStorage.getItem(getModeKey('burger_grill_slots'))) || Array(3).fill(null);
    boardSlots = JSON.parse(localStorage.getItem(getModeKey('burger_board_slots'))) || Array(3).fill(null);
    sinkSlots = JSON.parse(localStorage.getItem(getModeKey('burger_sink_slots'))) || Array(3).fill(null);
    currentActiveOrder = JSON.parse(localStorage.getItem(getModeKey('current_active_order'))) || null;

    timeUntilNextOrder = parseInt(localStorage.getItem(getModeKey('time_until_next_order')), 10);
    if (isNaN(timeUntilNextOrder)) timeUntilNextOrder = 120;

    dailyQuestsData = JSON.parse(localStorage.getItem(getModeKey('burger_daily_quests'))) || null;
    upgradesLevels = sanitizeUpgradesLevels(JSON.parse(localStorage.getItem(getModeKey('burger_upgrades'))));
    syncStationSlotArraysToTargetCount();
  }

  loadModeData();

  let isEating = false;
  let isSqueezed = false;
  let isAddingInProgress = false;

  const ITEM_PRICES = {
    'top-bun': 2, 'bottom-bun': 2,
    'beef-patty': 5, 'chicken-patty': 5, 'fish-patty': 5, 'hashbrown': 4,
    'fried-bacon': 3, 'fried-egg': 4, 'cheese': 5, 'raw-cheese': 5, 'champignons': 3,
    'lettuce': 3, 'tomato': 3, 'pickles': 3, 'red-onion': 3, 'white-onion': 3,
    'raw-beef-patty': 5, 'raw-chicken-patty': 5, 'raw-fish-patty': 5, 'raw-hashbrown': 4,
    'raw-bacon': 3, 'raw-egg': 4,
    'uncut-cheese': 5,
    'unwashed-uncut-champignons': 3, 'uncut-champignons': 3,
    'unwashed-uncut-lettuce': 3, 'uncut-lettuce': 3,
    'unwashed-uncut-tomato': 3, 'uncut-tomato': 3,
    'unwashed-uncut-pickles': 3, 'uncut-pickles': 3,
    'unwashed-uncut-red-onion': 3, 'uncut-red-onion': 3,
    'unwashed-uncut-white-onion': 3, 'uncut-white-onion': 3,
    'mayo': 5, 'ketchup': 5, 'mustard': 5, 'spicy': 5, 'bbq': 5
  };

  const ASSEMBLY_RAW_FALLBACK = {
    'beef-patty': 'raw-beef-patty',
    'chicken-patty': 'raw-chicken-patty',
    'fish-patty': 'raw-fish-patty',
    'hashbrown': 'raw-hashbrown',
    'fried-bacon': 'raw-bacon',
    'fried-egg': 'raw-egg',
    'champignons': 'raw-champignons',
    'cheese': 'raw-cheese'
  };

  const RAW_TO_COOKED_RECIPE_ITEM = {
    'raw-beef-patty': 'beef-patty',
    'raw-chicken-patty': 'chicken-patty',
    'raw-fish-patty': 'fish-patty',
    'raw-hashbrown': 'hashbrown',
    'raw-bacon': 'fried-bacon',
    'raw-egg': 'fried-egg',
    'raw-champignons': 'champignons',
    'raw-cheese': 'cheese'
  };

  const RAW_ITEM_IMAGES = {
    'raw-beef-patty': 'images/raw-beef-patty.png',
    'raw-chicken-patty': 'images/raw-chicken-patty.png',
    'raw-fish-patty': 'images/raw-fish-patty.png',
    'raw-hashbrown': 'images/raw-hashbrown.png',
    'raw-bacon': 'images/raw-bacon.png',
    'raw-egg': 'images/raw-egg.png',
    'raw-champignons': 'images/raw-champignons.png',
    'raw-cheese': 'images/raw-cheese.png'
  };

  const RAW_ITEM_POISON_CHANCE = {
    'raw-egg': 0.50,
    'raw-bacon': 0.35,
    'raw-chicken-patty': 0.40,
    'raw-fish-patty': 0.35,
    'raw-beef-patty': 0.25
  };

  function resolveLayerDisplayImage(layerId, fallbackImage, isRaw = false, rawId = null) {
    if (RAW_ITEM_IMAGES[layerId]) return RAW_ITEM_IMAGES[layerId];
    if (isRaw && rawId && RAW_ITEM_IMAGES[rawId]) return RAW_ITEM_IMAGES[rawId];
    const mappedRaw = ASSEMBLY_RAW_FALLBACK[layerId];
    if (isRaw && mappedRaw && RAW_ITEM_IMAGES[mappedRaw]) return RAW_ITEM_IMAGES[mappedRaw];
    return fallbackImage;
  }

  function normalizeIngredientIdForOrder(id) {
    return RAW_TO_COOKED_RECIPE_ITEM[id] || id;
  }

  function getPoisonPenaltyMultiplier() {
    if (currentGameMode === 'turbo') return 2.0;
    const speedMultiplier = getOrderMultiplier();
    return Math.round(1.5 * (0.75 + 0.25 * speedMultiplier) * 100) / 100;
  }

  function getQuestRewardMultiplier() {
    if (currentGameMode === 'sandbox') return 1.0;
    if (currentGameMode === 'turbo') return 1.25;
    return getOrderMultiplier();
  }

  function getPartialMatchRewardFactor() {
    if (currentGameMode === 'sandbox') return 0.85;
    const speedMult = getOrderMultiplier();
    if (currentGameMode === 'turbo') return 0.78;
    return Math.min(0.92, Math.max(0.70, 0.72 + (speedMult - 1.0) * 0.15));
  }

  function getAssemblyAvailableStock(itemId) {
    const cookedCount = ingredientStock[itemId] ?? 0;
    const rawId = ASSEMBLY_RAW_FALLBACK[itemId];
    const rawCount = rawId ? (ingredientStock[rawId] ?? 0) : 0;
    return cookedCount + rawCount;
  }

  const GRILLABLE_ITEMS = {
    'raw-beef-patty': {
      name: 'Beef Patty',
      menuImage: 'images/raw-beef-patty.png',
      rawImage: 'images/raw-beef-patty.png',
      flip1Image: 'images/beef-patty-flip1.png',
      flip2Image: 'images/beef-patty-flip2.png',
      cookedId: 'beef-patty',
      cookedImage: 'images/beef-patty.png',
      needsFlip: true, cookTime: 22, burnTime: 11, category: 'patty'
    },
    'raw-chicken-patty': {
      name: 'Chicken Patty',
      menuImage: 'images/raw-chicken-patty.png',
      rawImage: 'images/raw-chicken-patty.png',
      flip1Image: 'images/chicken-patty-flip1.png',
      flip2Image: 'images/chicken-patty-flip2.png',
      cookedId: 'chicken-patty',
      cookedImage: 'images/chicken-patty.png',
      needsFlip: true, cookTime: 22, burnTime: 11, category: 'patty'
    },
    'raw-fish-patty': {
      name: 'Fish Patty',
      menuImage: 'images/raw-fish-patty.png',
      rawImage: 'images/raw-fish-patty.png',
      flip1Image: 'images/fish-patty-flip1.png',
      flip2Image: 'images/fish-patty-flip2.png',
      cookedId: 'fish-patty',
      cookedImage: 'images/fish-patty.png',
      needsFlip: true, cookTime: 22, burnTime: 11, category: 'patty'
    },
    'raw-hashbrown': {
      name: 'Hashbrown',
      menuImage: 'images/raw-hashbrown.png',
      rawImage: 'images/raw-hashbrown.png',
      flip1Image: 'images/hashbrown-flip1.png',
      flip2Image: 'images/hashbrown-flip2.png',
      cookedId: 'hashbrown',
      cookedImage: 'images/hashbrown.png',
      needsFlip: true, cookTime: 18, burnTime: 10, category: 'patty'
    },
    'raw-bacon': {
      name: 'Bacon',
      menuImage: 'images/raw-bacon.png',
      rawImage: 'images/raw-bacon.png',
      flip1Image: 'images/raw-bacon.png',
      flip2Image: 'images/fried-bacon.png',
      cookedId: 'fried-bacon',
      cookedImage: 'images/fried-bacon.png',
      needsFlip: false, cookTime: 15, burnTime: 9, category: 'protein'
    },
    'raw-egg': {
      name: 'Egg',
      menuImage: 'images/egg.png',
      rawImage: 'images/raw-egg.png',
      flip1Image: 'images/raw-egg.png',
      flip2Image: 'images/fried-egg.png',
      cookedId: 'fried-egg',
      cookedImage: 'images/fried-egg.png',
      needsFlip: false, cookTime: 15, burnTime: 9, category: 'protein'
    },
    'raw-champignons': {
      name: 'Champignons',
      menuImage: 'images/raw-champignons.png',
      rawImage: 'images/raw-champignons.png',
      flip1Image: 'images/raw-champignons.png',
      flip2Image: 'images/champignons.png',
      cookedId: 'champignons',
      cookedImage: 'images/champignons.png',
      needsFlip: false, cookTime: 15, burnTime: 9, category: 'vegetables'
    },
    'raw-cheese': {
      name: 'Cheese',
      menuImage: 'images/raw-cheese.png',
      rawImage: 'images/raw-cheese.png',
      flip1Image: 'images/raw-cheese.png',
      flip2Image: 'images/cheese.png',
      cookedId: 'cheese',
      cookedImage: 'images/cheese.png',
      needsFlip: false, cookTime: 12, burnTime: 8, category: 'protein'
    }
  };

  const BOARD_PRODUCE_ITEMS = {
    'champignons': {
      key: 'champignons',
      name: 'Champignons',
      cleanUncutId: 'uncut-champignons',
      dirtyUncutId: 'unwashed-uncut-champignons',
      rawImage: 'images/uncut-champignons.png',
      slicedId: 'raw-champignons',
      slicedImage: 'images/raw-champignons.png',
      cutTime: 12,
      category: 'vegetables',
      canBeDirty: true
    },
    'lettuce': {
      key: 'lettuce',
      name: 'Lettuce',
      cleanUncutId: 'uncut-lettuce',
      dirtyUncutId: 'unwashed-uncut-lettuce',
      rawImage: 'images/uncut-lettuce.png',
      slicedId: 'lettuce',
      slicedImage: 'images/lettuce.png',
      cutTime: 11,
      category: 'vegetables',
      canBeDirty: true
    },
    'tomato': {
      key: 'tomato',
      name: 'Tomato',
      cleanUncutId: 'uncut-tomato',
      dirtyUncutId: 'unwashed-uncut-tomato',
      rawImage: 'images/uncut-tomato.png',
      slicedId: 'tomato',
      slicedImage: 'images/tomato.png',
      cutTime: 11,
      category: 'fruit',
      canBeDirty: true
    },
    'pickles': {
      key: 'pickles',
      name: 'Pickles',
      cleanUncutId: 'uncut-pickles',
      dirtyUncutId: 'unwashed-uncut-pickles',
      rawImage: 'images/uncut-pickles.png',
      slicedId: 'pickles',
      slicedImage: 'images/pickles.png',
      cutTime: 11,
      category: 'vegetables',
      canBeDirty: true
    },
    'red-onion': {
      key: 'red-onion',
      name: 'Red Onion',
      cleanUncutId: 'uncut-red-onion',
      dirtyUncutId: 'unwashed-uncut-red-onion',
      rawImage: 'images/uncut-red-onion.png',
      slicedId: 'red-onion',
      slicedImage: 'images/red-onion.png',
      cutTime: 11,
      category: 'vegetables',
      canBeDirty: true
    },
    'white-onion': {
      key: 'white-onion',
      name: 'White Onion',
      cleanUncutId: 'uncut-white-onion',
      dirtyUncutId: 'unwashed-uncut-white-onion',
      rawImage: 'images/uncut-white-onion.png',
      slicedId: 'white-onion',
      slicedImage: 'images/white-onion.png',
      cutTime: 11,
      category: 'vegetables',
      canBeDirty: true
    },
    'cheese': {
      key: 'cheese',
      name: 'Cheese',
      cleanUncutId: 'uncut-cheese',
      dirtyUncutId: null,
      rawImage: 'images/uncut-cheese.png',
      slicedId: 'raw-cheese',
      slicedImage: 'images/raw-cheese.png',
      cutTime: 12,
      category: 'protein',
      canBeDirty: false
    }
  };

  const SINK_WASHABLE_ITEMS = {
    'unwashed-uncut-lettuce': { name: 'Lettuce', rawImage: 'images/uncut-lettuce.png', washedId: 'uncut-lettuce', washedImage: 'images/uncut-lettuce.png', washTime: 11, category: 'vegetables' },
    'unwashed-uncut-tomato': { name: 'Tomato', rawImage: 'images/uncut-tomato.png', washedId: 'uncut-tomato', washedImage: 'images/uncut-tomato.png', washTime: 11, category: 'fruit' },
    'unwashed-uncut-pickles': { name: 'Pickles', rawImage: 'images/uncut-pickles.png', washedId: 'uncut-pickles', washedImage: 'images/uncut-pickles.png', washTime: 11, category: 'vegetables' },
    'unwashed-uncut-red-onion': { name: 'Red Onion', rawImage: 'images/uncut-red-onion.png', washedId: 'uncut-red-onion', washedImage: 'images/uncut-red-onion.png', washTime: 11, category: 'vegetables' },
    'unwashed-uncut-white-onion': { name: 'White Onion', rawImage: 'images/uncut-white-onion.png', washedId: 'uncut-white-onion', washedImage: 'images/uncut-white-onion.png', washTime: 11, category: 'vegetables' },
    'unwashed-uncut-champignons': { name: 'Champignons', rawImage: 'images/uncut-champignons.png', washedId: 'uncut-champignons', washedImage: 'images/uncut-champignons.png', washTime: 11, category: 'vegetables' }
  };

  let currentScreen = localStorage.getItem('burger_current_screen') || 'assembly';
  let isBinSelectMode = false;
  let selectedGrillIndicesForBin = [];
  let selectedBoardIndicesForBin = [];
  let selectedSinkIndicesForBin = [];
  let sizzlingAudioInstance = null;
  let cuttingAudioInstance = null;
  let washingAudioInstance = null;

  let modeSpeeds = JSON.parse(localStorage.getItem('burger_mode_speeds')) || {
    'sandbox': 'no-orders',
    'casual': 'no-orders'
  };

  let unlockedAchievements = JSON.parse(localStorage.getItem('unlocked_achievements')) || {};
  let pinnedBurger = JSON.parse(localStorage.getItem('pinned_burger')) || null;

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
  let sinkUnwashedActiveCategory = 'all';
  let sinkWashedActiveCategory = 'all';

  const switchToAssemblyBtn = document.getElementById('switchToAssemblyBtn');
  const switchToGrillBtn = document.getElementById('switchToGrillBtn');
  const switchToBoardBtn = document.getElementById('switchToBoardBtn');
  const switchToSinkBtn = document.getElementById('switchToSinkBtn');

  function stopAllStationAudio() {
    manageSizzlingAudio(false);
    manageCuttingAudio(false);
    manageWashingAudio(false);
  }

  function switchScreen(screen, silent = false) {
    if (!silent) playSound(SOUNDS.buttons);
    currentScreen = screen;
    localStorage.setItem('burger_current_screen', screen);

    if (screen !== 'board') manageCuttingAudio(false);
    if (screen !== 'sink') manageWashingAudio(false);
    if (screen !== 'grill') manageSizzlingAudio(false);
    if (isBinSelectMode) exitBinSelectMode();

    if (switchToAssemblyBtn) switchToAssemblyBtn.classList.toggle('active', screen === 'assembly');
    if (switchToGrillBtn) switchToGrillBtn.classList.toggle('active', screen === 'grill');
    if (switchToBoardBtn) switchToBoardBtn.classList.toggle('active', screen === 'board');
    if (switchToSinkBtn) switchToSinkBtn.classList.toggle('active', screen === 'sink');

    if (centerStage) centerStage.style.display = screen === 'assembly' ? 'flex' : 'none';
    if (grillStage) grillStage.style.display = screen === 'grill' ? 'flex' : 'none';
    if (boardStage) boardStage.style.display = screen === 'board' ? 'flex' : 'none';
    if (sinkStage) sinkStage.style.display = screen === 'sink' ? 'flex' : 'none';

    if (rightPanel) rightPanel.style.display = 'flex';
    if (leftPanel) leftPanel.style.display = 'flex';

    if (desktopSaucesGroup) desktopSaucesGroup.classList.toggle('hidden-on-grill', screen !== 'assembly');
    if (mobileSaucesGroup) mobileSaucesGroup.classList.toggle('hidden-on-grill', screen !== 'assembly');

    exitBinSelectMode();

    if (screen === 'assembly') {
      renderIngredientsMenu();
      updateBurgerDisplay(false);
    } else if (screen === 'grill') {
      renderGrillIngredientsMenu();
      renderGrillCookedInventory();
      initGrillStructure();
      renderGrill();
    } else if (screen === 'board') {
      renderBoardUncutMenu();
      renderBoardSlicedInventory();
      initBoardStructure();
      renderBoard();
    } else if (screen === 'sink') {
      renderSinkUnwashedMenu();
      renderSinkWashedInventory();
      initSinkStructure();
      renderSink();
    }
    updateBottomPanelForScreen();
    updateStationNotificationDots();
    requestAnimationFrame(() => positionMusicToast());
  }

  if (switchToAssemblyBtn) switchToAssemblyBtn.onclick = () => switchScreen('assembly');
  if (switchToGrillBtn) switchToGrillBtn.onclick = () => switchScreen('grill');
  if (switchToBoardBtn) switchToBoardBtn.onclick = () => switchScreen('board');
  if (switchToSinkBtn) switchToSinkBtn.onclick = () => switchScreen('sink');

  const knifeBtn = document.getElementById('knifeBtn');
  const submitOrderBtn = document.getElementById('submitOrderBtn');

  if (submitOrderBtn) {
    submitOrderBtn.onclick = () => {
      if (currentActiveOrder && currentBurger.length > 0) {
        checkOrderSubmission();
      } else {
        showToast('No active order or burger is empty!', '', 'warning');
      }
    };
  }

  function updateBottomPanelForScreen() {
    updateActionButtonsVisibility();
  }

  function updateStationNotificationDots() {
    const grillNeedsAttention = grillSlots.some(slot => slot && (slot.state === 'ready' || slot.state === 'needsFlip'));
    updateDotOnButton(switchToGrillBtn, grillNeedsAttention);

    const boardNeedsAttention = boardSlots.some(slot => slot && slot.state === 'ready');
    updateDotOnButton(switchToBoardBtn, boardNeedsAttention);

    const sinkNeedsAttention = sinkSlots.some(slot => slot && slot.state === 'ready');
    updateDotOnButton(switchToSinkBtn, sinkNeedsAttention);
  }

  function updateDotOnButton(btnElement, show) {
    if (!btnElement) return;
    let wrapper = btnElement.closest('.screen-btn-wrapper');
    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.className = 'screen-btn-wrapper';
      btnElement.parentNode.insertBefore(wrapper, btnElement);
      wrapper.appendChild(btnElement);
    }
    let dot = wrapper.querySelector('.screen-notification-dot');
    if (show) {
      if (!dot) {
        dot = document.createElement('div');
        dot.className = 'screen-notification-dot';
        wrapper.appendChild(dot);
      }
    } else {
      if (dot) dot.remove();
    }
  }

  function getCurrentSpeed() {
    if (currentGameMode === 'turbo') return 'turbo';
    return modeSpeeds[currentGameMode] || 'no-orders';
  }

  function getOrderMultiplier() {
    if (currentGameMode === 'turbo') return 1.1;
    const speed = getCurrentSpeed();
    switch(speed) {
      case 'turbo': return 1.1;
      case 'super-fast': return 1.15;
      case 'fast': return 1.25;
      case 'medium': return 1.50;
      case 'slow': return 1.75;
      case 'super-slow': return 2.0;
      case 'no-orders': default: return 1.0;
    }
  }

  function saveStock() {
    localStorage.setItem(getModeKey('burger_ingredient_stock'), JSON.stringify(ingredientStock));
  }

  function saveDirtyStock() {
    localStorage.setItem(getModeKey('burger_dirty_stock'), JSON.stringify(dirtyStock));
  }

  function saveBurgerState() {
    localStorage.setItem(getModeKey('saved_burger_stack'), JSON.stringify(currentBurger));
  }

  function saveGrillState() {
    localStorage.setItem(getModeKey('burger_grill_slots'), JSON.stringify(grillSlots));
    updateStationNotificationDots();
  }

  function saveBoardState() {
    localStorage.setItem(getModeKey('burger_board_slots'), JSON.stringify(boardSlots));
    updateStationNotificationDots();
  }

  function saveSinkState() {
    localStorage.setItem(getModeKey('burger_sink_slots'), JSON.stringify(sinkSlots));
    updateStationNotificationDots();
  }

  function consumeBoardProducePreferClean(itemConfig) {
    if (currentGameMode === 'sandbox') {
      return { isDirty: false };
    }
    const cleanId = itemConfig.cleanUncutId;
    const dirtyId = itemConfig.dirtyUncutId;

    const cleanCount = ingredientStock[cleanId] ?? 0;
    if (cleanCount > 0) {
      ingredientStock[cleanId] = cleanCount - 1;
      saveStock();
      return { isDirty: false };
    }

    if (dirtyId) {
      const dirtyCount = ingredientStock[dirtyId] ?? 0;
      if (dirtyCount > 0) {
        ingredientStock[dirtyId] = dirtyCount - 1;
        saveStock();
        return { isDirty: true };
      }
    }

    return null;
  }

  function consumePreparedItemPreferClean(itemId) {
    if (currentGameMode === 'sandbox') {
      return { isDirty: false };
    }
    const total = ingredientStock[itemId] ?? 0;
    if (total <= 0) return null;

    const dirtyCount = dirtyStock[itemId] ?? 0;
    const cleanCount = Math.max(0, total - dirtyCount);

    ingredientStock[itemId] = total - 1;
    saveStock();

    if (cleanCount > 0) {
      return { isDirty: false };
    } else {
      dirtyStock[itemId] = Math.max(0, dirtyCount - 1);
      saveDirtyStock();
      return { isDirty: true };
    }
  }

  function consumeAssemblyIngredient(itemId) {
    if (currentGameMode === 'sandbox') {
      return { isDirty: false, isRaw: false, rawId: null, stockKey: itemId, displayImage: null };
    }

    const cookedTotal = ingredientStock[itemId] ?? 0;
    if (cookedTotal > 0) {
      const consumed = consumePreparedItemPreferClean(itemId);
      if (!consumed) return null;
      return {
        isDirty: consumed.isDirty,
        isRaw: false,
        rawId: null,
        stockKey: itemId,
        displayImage: null
      };
    }

    const rawId = ASSEMBLY_RAW_FALLBACK[itemId];
    if (!rawId) return null;

    const rawTotal = ingredientStock[rawId] ?? 0;
    if (rawTotal <= 0) return null;

    const rawDirtyCount = dirtyStock[rawId] ?? 0;
    const rawCleanCount = Math.max(0, rawTotal - rawDirtyCount);

    ingredientStock[rawId] = rawTotal - 1;
    saveStock();

    if (rawCleanCount > 0) {
      return {
        isDirty: false,
        isRaw: true,
        rawId,
        stockKey: rawId,
        displayImage: RAW_ITEM_IMAGES[rawId] || null
      };
    }

    dirtyStock[rawId] = Math.max(0, rawDirtyCount - 1);
    saveDirtyStock();
    return {
      isDirty: true,
      isRaw: true,
      rawId,
      stockKey: rawId,
      displayImage: RAW_ITEM_IMAGES[rawId] || null
    };
  }

  function returnBurgerLayerToStock(removed) {
    if (!removed || currentGameMode === 'sandbox') return;
    const stockKey = removed.stockKey || (removed.isRaw && removed.rawId ? removed.rawId : removed.id);
    ingredientStock[stockKey] = (ingredientStock[stockKey] ?? 0) + 1;
    saveStock();
    if (removed.isDirty) {
      dirtyStock[stockKey] = (dirtyStock[stockKey] ?? 0) + 1;
      saveDirtyStock();
    }
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
      if (isNaN(playerMoney)) playerMoney = 100.00;
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
    localStorage.setItem(getModeKey('burger_money'), playerMoney);
    updateShopBalanceHeader();
  }

  // --- TOAST LIMIT MANAGER (PC: max 3, Mobile: max 1, force-close oldest) ---
  const DESKTOP_MAX_TOASTS = 3;
  const MOBILE_MAX_TOASTS = 1;
  const MOBILE_TOAST_BREAKPOINT = 900;
  const activeToasts = [];

  function getMaxActiveToasts() {
    return window.innerWidth <= MOBILE_TOAST_BREAKPOINT ? MOBILE_MAX_TOASTS : DESKTOP_MAX_TOASTS;
  }

  function enforceActiveToastLimit() {
    const maxAllowed = getMaxActiveToasts();
    while (activeToasts.length >= maxAllowed) {
      const oldest = activeToasts.shift();
      if (oldest && typeof oldest.forceClose === 'function') {
        oldest.forceClose();
      }
    }
  }

  window.addEventListener('resize', () => {
    const maxAllowed = getMaxActiveToasts();
    while (activeToasts.length > maxAllowed) {
      const oldest = activeToasts.shift();
      if (oldest && typeof oldest.forceClose === 'function') {
        oldest.forceClose();
      }
    }
  });

  function showToast(title, desc = '', type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    enforceActiveToastLimit();

    const toast = document.createElement('div');
    toast.className = `toast-message ${type}`;
    toast.innerHTML = `
      <h4 style="font-size:0.85rem; margin:0; font-weight:700;">${title}</h4>
      ${desc ? `<p style="font-size:0.75rem; opacity:0.85; margin:0;">${desc}</p>` : ''}
    `;

    let isRemoved = false;
    let hideTimeoutId = null;
    let fadeTimeoutId = null;

    const controller = {
      el: toast,
      forceClose: () => {
        if (isRemoved) return;
        isRemoved = true;
        if (hideTimeoutId) {
          clearTimeout(hideTimeoutId);
          hideTimeoutId = null;
        }
        if (fadeTimeoutId) {
          clearTimeout(fadeTimeoutId);
          fadeTimeoutId = null;
        }
        const idx = activeToasts.indexOf(controller);
        if (idx !== -1) activeToasts.splice(idx, 1);
        if (toast.parentNode) {
          toast.remove();
        }
      },
      dismissAnimated: () => {
        if (isRemoved) return;
        isRemoved = true;
        if (hideTimeoutId) {
          clearTimeout(hideTimeoutId);
          hideTimeoutId = null;
        }
        const idx = activeToasts.indexOf(controller);
        if (idx !== -1) activeToasts.splice(idx, 1);
        toast.classList.add('hiding');
        fadeTimeoutId = setTimeout(() => {
          if (toast.parentNode) toast.remove();
        }, 300);
      }
    };

    toast.onclick = () => controller.dismissAnimated();

    activeToasts.push(controller);
    container.appendChild(toast);
    hideTimeoutId = setTimeout(() => controller.dismissAnimated(), 3500);
  }

  const INGREDIENTS = [
    { id: 'top-bun', name: 'Top Bun', category: 'bread', image: 'images/top-bun.png' },
    { id: 'bottom-bun', name: 'Bottom Bun', category: 'bread', image: 'images/bottom-bun.png' },
    { id: 'beef-patty', name: 'Beef Patty', category: 'patty', image: 'images/beef-patty.png' },
    { id: 'chicken-patty', name: 'Chicken Patty', category: 'patty', image: 'images/chicken-patty.png' },
    { id: 'fish-patty', name: 'Fish Patty', category: 'patty', image: 'images/fish-patty.png' },
    { id: 'hashbrown', name: 'Hashbrown', category: 'patty', image: 'images/hashbrown.png' },
    { id: 'fried-bacon', name: 'Bacon', category: 'protein', image: 'images/fried-bacon.png' },
    { id: 'fried-egg', name: 'Egg', category: 'protein', image: 'images/fried-egg.png' },
    { id: 'cheese', name: 'Cheese', category: 'protein', image: 'images/cheese.png' },
    { id: 'champignons', name: 'Champignons', category: 'vegetables', image: 'images/champignons.png' },
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

  const SIMPLE_QUESTS_POOL = [
    { id: 'make_burgers_3', title: 'Make 3 burgers', target: 3, reward: 2.50, type: 'make_burgers' },
    { id: 'make_burgers_5', title: 'Make 5 burgers', target: 5, reward: 5.00, type: 'make_burgers' },
    { id: 'cook_patties_4', title: 'Cook 4 items on grill', target: 4, reward: 3.00, type: 'cook_patties' },
    { id: 'slice_items_6', title: 'Slice 6 ingredients', target: 6, reward: 3.00, type: 'slice_items' },
    { id: 'buy_items_5', title: 'Buy 5 items in shop', target: 5, reward: 2.00, type: 'buy_items' },
    { id: 'earn_money_30', title: 'Earn $30 from orders', target: 30, reward: 4.00, type: 'earn_money' }
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

  function renderSinkCategoryTabs(activeCat, onSelectCb) {
    const cats = [
      { id: 'all', label: 'All' },
      { id: 'vegetables', label: 'Veg' },
      { id: 'fruit', label: 'Fruit' }
    ];

    const tabsId = `cat-tabs-${onSelectCb}`;
    let tabsHtml = `<div class="panel-category-tabs" id="${tabsId}">`;
    cats.forEach(c => {
      tabsHtml += `<button class="panel-tab-btn ${activeCat === c.id ? 'active' : ''}" onclick="window.handleTabClick('${onSelectCb}', '${c.id}')">${c.label}</button>`;
    });
    tabsHtml += `</div>`;

    setTimeout(() => {
      const tabsEl = document.getElementById(tabsId);
      if (tabsEl) setupWheelScrollForContainer(tabsEl);
    }, 0);

    return tabsHtml;
  }

  function renderBoardCategoryTabs(activeCat, onSelectCb) {
    const cats = [
      { id: 'all', label: 'All' },
      { id: 'protein', label: 'Protein' },
      { id: 'vegetables', label: 'Veg' },
      { id: 'fruit', label: 'Fruit' }
    ];

    const tabsId = `cat-tabs-${onSelectCb}`;
    let tabsHtml = `<div class="panel-category-tabs" id="${tabsId}">`;
    cats.forEach(c => {
      tabsHtml += `<button class="panel-tab-btn ${activeCat === c.id ? 'active' : ''}" onclick="window.handleTabClick('${onSelectCb}', '${c.id}')">${c.label}</button>`;
    });
    tabsHtml += `</div>`;

    setTimeout(() => {
      const tabsEl = document.getElementById(tabsId);
      if (tabsEl) setupWheelScrollForContainer(tabsEl);
    }, 0);

    return tabsHtml;
  }

  function renderCategoryTabs(activeCat, onSelectCb, hideBread = false, hidePatty = false) {
    let cats = [
      { id: 'all', label: 'All' },
      { id: 'bread', label: 'Bread' },
      { id: 'patty', label: 'Patty' },
      { id: 'protein', label: 'Protein' },
      { id: 'vegetables', label: 'Veg' }
    ];

    if (hideBread) cats = cats.filter(c => c.id !== 'bread');
    if (hidePatty) cats = cats.filter(c => c.id !== 'patty');

    const tabsId = `cat-tabs-${onSelectCb}`;
    let tabsHtml = `<div class="panel-category-tabs" id="${tabsId}">`;
    cats.forEach(c => {
      tabsHtml += `<button class="panel-tab-btn ${activeCat === c.id ? 'active' : ''}" onclick="window.handleTabClick('${onSelectCb}', '${c.id}')">${c.label}</button>`;
    });
    tabsHtml += `</div>`;

    setTimeout(() => {
      const tabsEl = document.getElementById(tabsId);
      if (tabsEl) setupWheelScrollForContainer(tabsEl);
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
    else if (cbName === 'setSinkUnwashedCategory') window.setSinkUnwashedCategory(catId, scrollPos);
    else if (cbName === 'setSinkWashedCategory') window.setSinkWashedCategory(catId, scrollPos);
    else if (cbName === 'switchRecipeCategory') window.switchRecipeCategory(catId, scrollPos);
  }

  window.setAssemblyCategory = function(cat, savedScroll = null) { assemblyActiveCategory = cat; renderIngredientsMenu(savedScroll); }
  window.setGrillRawCategory = function(cat, savedScroll = null) { grillRawActiveCategory = cat; renderGrillIngredientsMenu(savedScroll); }
  window.setGrillCookedCategory = function(cat, savedScroll = null) { grillCookedActiveCategory = cat; renderGrillCookedInventory(savedScroll); }
  window.setBoardUncutCategory = function(cat, savedScroll = null) { boardUncutActiveCategory = cat; renderBoardUncutMenu(savedScroll); }
  window.setBoardSlicedCategory = function(cat, savedScroll = null) { boardSlicedActiveCategory = cat; renderBoardSlicedInventory(savedScroll); }
  window.setSinkUnwashedCategory = function(cat, savedScroll = null) { sinkUnwashedActiveCategory = cat; renderSinkUnwashedMenu(savedScroll); }
  window.setSinkWashedCategory = function(cat, savedScroll = null) { sinkWashedActiveCategory = cat; renderSinkWashedInventory(savedScroll); }

  function renderIngredientsMenu(savedScroll = null) {
    if (currentScreen !== 'assembly') return;
    if (!rightPanel) return;
    const titleEl = rightPanel.querySelector('.panel-title');
    if (titleEl) titleEl.innerText = 'Ingredients';
    if (!ingredientsMenu) return;

    const innerContainer = ingredientsMenu.querySelector('.scrollable-items-list');
    const currentListScrollTop = innerContainer ? innerContainer.scrollTop : ingredientsMenu.scrollTop;
    const currentTabsEl = document.getElementById('cat-tabs-setAssemblyCategory');
    const actualScroll = savedScroll !== null ? savedScroll : (currentTabsEl ? currentTabsEl.scrollLeft : 0);

    const filtered = assemblyActiveCategory === 'all' ? INGREDIENTS : INGREDIENTS.filter(i => i.category === assemblyActiveCategory);
    const tabsHtml = renderCategoryTabs(assemblyActiveCategory, 'setAssemblyCategory', false, false);

    let cardsHtml = `<div class="scrollable-items-list" style="display:flex; flex-direction:column; gap:8px; overflow-y:auto; flex:1; min-height:0;">`;
    filtered.forEach(item => {
      const availableStock = getAssemblyAvailableStock(item.id);
      const isOut = currentGameMode !== 'sandbox' && availableStock <= 0;
      const countText = currentGameMode === 'sandbox' ? '∞' : `x${availableStock}`;

      cardsHtml += `
        <div class="ingredient-card ${currentBurger.length >= MAX_INGREDIENTS || isEating || isOut ? 'disabled' : ''}" onclick="handleAssemblyClick('${item.id}')">
          <img src="${item.image}" alt="${item.name}">
          <div class="ingredient-info-row">
            <span class="ingredient-name">${item.name}</span>
            <span class="ingredient-stock-count">${countText}</span>
          </div>
        </div>
      `;
    });
    cardsHtml += `</div>`;

    ingredientsMenu.innerHTML = tabsHtml + cardsHtml;
    const newInner = ingredientsMenu.querySelector('.scrollable-items-list');
    if (newInner) newInner.scrollTop = currentListScrollTop;

    requestAnimationFrame(() => {
      if (newInner) newInner.scrollTop = currentListScrollTop;
      const tabsEl = document.getElementById('cat-tabs-setAssemblyCategory');
      if (tabsEl) {
        tabsEl.style.scrollBehavior = 'auto';
        tabsEl.scrollLeft = actualScroll;
        requestAnimationFrame(() => { tabsEl.scrollLeft = actualScroll; tabsEl.style.scrollBehavior = ''; });
      }
      positionServeButtonOnMobile();
      positionMusicToast();
    });
  }

  window.handleAssemblyClick = function(id) {
    if (isEating || isAddingInProgress) return;
    const item = INGREDIENTS.find(i => i.id === id);
    if (!item) return;
    const availableStock = getAssemblyAvailableStock(item.id);
    if (currentGameMode !== 'sandbox' && availableStock <= 0) {
      showToast('Out of stock!', `Buy more ${item.name} in shop.`, 'warning');
      return;
    }
    addIngredient(item);
  }

  function renderGrillIngredientsMenu(savedScroll = null) {
    if (currentScreen !== 'grill') return;
    if (!rightPanel) return;
    const titleEl = rightPanel.querySelector('.panel-title');
    const menuEl = rightPanel.querySelector('.ingredients-menu');
    if (!titleEl || !menuEl) return;
    titleEl.innerText = 'Raw Grill Items';

    const innerContainer = menuEl.querySelector('.scrollable-items-list');
    const currentListScrollTop = innerContainer ? innerContainer.scrollTop : menuEl.scrollTop;
    const currentTabsEl = document.getElementById('cat-tabs-setGrillRawCategory');
    const actualScroll = savedScroll !== null ? savedScroll : (currentTabsEl ? currentTabsEl.scrollLeft : 0);

    const filtered = grillRawActiveCategory === 'all' ? Object.values(GRILLABLE_ITEMS) : Object.values(GRILLABLE_ITEMS).filter(i => i.category === grillRawActiveCategory);
    const tabsHtml = renderCategoryTabs(grillRawActiveCategory, 'setGrillRawCategory', true, false);

    let cardsHtml = `<div class="scrollable-items-list" style="display:flex; flex-direction:column; gap:8px; overflow-y:auto; flex:1; min-height:0;">`;
    filtered.forEach(item => {
      const rawId = Object.keys(GRILLABLE_ITEMS).find(k => GRILLABLE_ITEMS[k] === item);
      const stock = ingredientStock[rawId] ?? 0;
      const isOut = currentGameMode !== 'sandbox' && stock <= 0;
      const displayImg = item.menuImage || item.rawImage;

      cardsHtml += `
        <div class="ingredient-card ${isOut ? 'disabled' : ''}" onclick="handleGrillAddClick('${rawId}')">
          <div class="ingredient-info-row">
            <img src="${displayImg}" alt="${item.name}">
            <span class="ingredient-name">${item.name}</span>
          </div>
          <span class="ingredient-stock-count">${currentGameMode === 'sandbox' ? '∞' : 'x' + stock}</span>
        </div>
      `;
    });
    cardsHtml += `</div>`;

    menuEl.innerHTML = tabsHtml + cardsHtml;
    const newInner = menuEl.querySelector('.scrollable-items-list');
    if (newInner) newInner.scrollTop = currentListScrollTop;

    requestAnimationFrame(() => {
      if (newInner) newInner.scrollTop = currentListScrollTop;
      const tabsEl = document.getElementById('cat-tabs-setGrillRawCategory');
      if (tabsEl) {
        tabsEl.style.scrollBehavior = 'auto';
        tabsEl.scrollLeft = actualScroll;
        requestAnimationFrame(() => { tabsEl.scrollLeft = actualScroll; tabsEl.style.scrollBehavior = ''; });
      }
      positionServeButtonOnMobile();
      positionMusicToast();
    });
  }

  window.handleGrillAddClick = function(rawId) {
    const stock = ingredientStock[rawId] ?? 0;
    if (currentGameMode !== 'sandbox' && stock <= 0) { showToast('Out of stock!', 'Buy more in shop.', 'warning'); return; }
    addToGrill(rawId);
  }

  function renderGrillCookedInventory(savedScroll = null) {
    if (currentScreen !== 'grill') return;
    if (!leftPanel) return;
    const titleEl = leftPanel.querySelector('.panel-title');
    const listEl = leftPanel.querySelector('.layers-list');
    if (!titleEl || !listEl) return;

    titleEl.innerText = 'Cooked Inventory';
    listEl.classList.remove('assembly-mode');

    const innerContainer = listEl.querySelector('.scrollable-items-list');
    const currentListScrollTop = innerContainer ? innerContainer.scrollTop : listEl.scrollTop;
    const currentTabsEl = document.getElementById('cat-tabs-setGrillCookedCategory');
    const actualScroll = savedScroll !== null ? savedScroll : (currentTabsEl ? currentTabsEl.scrollLeft : 0);

    const cookedItemsArray = Object.values(GRILLABLE_ITEMS).map(item => ({
      id: item.cookedId,
      name: item.name,
      category: item.category,
      image: item.cookedImage
    }));
    const uniqueCooked = Array.from(new Set(cookedItemsArray.map(a => a.id)))
      .map(id => cookedItemsArray.find(a => a.id === id));

    const filtered = grillCookedActiveCategory === 'all' ? uniqueCooked : uniqueCooked.filter(i => i.category === grillCookedActiveCategory);
    const tabsHtml = renderCategoryTabs(grillCookedActiveCategory, 'setGrillCookedCategory', true, false);
    let itemsContainerHtml = `<div class="scrollable-items-list" style="display:flex; flex-direction:column; gap:6px; overflow-y:auto; flex:1; min-height:0;">`;

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
    const newInner = listEl.querySelector('.scrollable-items-list');
    if (newInner) newInner.scrollTop = currentListScrollTop;

    requestAnimationFrame(() => {
      if (newInner) newInner.scrollTop = currentListScrollTop;
      const tabsEl = document.getElementById('cat-tabs-setGrillCookedCategory');
      if (tabsEl) {
        tabsEl.style.scrollBehavior = 'auto';
        tabsEl.scrollLeft = actualScroll;
        requestAnimationFrame(() => { tabsEl.scrollLeft = actualScroll; tabsEl.style.scrollBehavior = ''; });
      }
    });
  }

  function renderBoardUncutMenu(savedScroll = null) {
    if (currentScreen !== 'board') return;
    if (!rightPanel) return;
    const titleEl = rightPanel.querySelector('.panel-title');
    const menuEl = rightPanel.querySelector('.ingredients-menu');
    if (!titleEl || !menuEl) return;
    titleEl.innerText = 'Uncut Produce';

    const innerContainer = menuEl.querySelector('.scrollable-items-list');
    const currentListScrollTop = innerContainer ? innerContainer.scrollTop : menuEl.scrollTop;
    const currentTabsEl = document.getElementById('cat-tabs-setBoardUncutCategory');
    const actualScroll = savedScroll !== null ? savedScroll : (currentTabsEl ? currentTabsEl.scrollLeft : 0);

    const filtered = boardUncutActiveCategory === 'all'
      ? Object.values(BOARD_PRODUCE_ITEMS)
      : Object.values(BOARD_PRODUCE_ITEMS).filter(i => i.category === boardUncutActiveCategory);
    const tabsHtml = renderBoardCategoryTabs(boardUncutActiveCategory, 'setBoardUncutCategory');

    let cardsHtml = `<div class="scrollable-items-list" style="display:flex; flex-direction:column; gap:8px; overflow-y:auto; flex:1; min-height:0;">`;
    filtered.forEach(item => {
      const cleanCount = ingredientStock[item.cleanUncutId] ?? 0;
      const dirtyCount = item.dirtyUncutId ? (ingredientStock[item.dirtyUncutId] ?? 0) : 0;
      const totalStock = cleanCount + dirtyCount;
      const isOut = currentGameMode !== 'sandbox' && totalStock <= 0;

      cardsHtml += `
        <div class="ingredient-card ${isOut ? 'disabled' : ''}" onclick="handleBoardAddClick('${item.key}')">
          <div class="ingredient-info-row">
            <img src="${item.rawImage}" alt="${item.name}">
            <span class="ingredient-name">${item.name}</span>
          </div>
          <span class="ingredient-stock-count">${currentGameMode === 'sandbox' ? '∞' : 'x' + totalStock}</span>
        </div>
      `;
    });
    cardsHtml += `</div>`;

    menuEl.innerHTML = tabsHtml + cardsHtml;
    const newInner = menuEl.querySelector('.scrollable-items-list');
    if (newInner) newInner.scrollTop = currentListScrollTop;

    requestAnimationFrame(() => {
      if (newInner) newInner.scrollTop = currentListScrollTop;
      const tabsEl = document.getElementById('cat-tabs-setBoardUncutCategory');
      if (tabsEl) {
        tabsEl.style.scrollBehavior = 'auto';
        tabsEl.scrollLeft = actualScroll;
        requestAnimationFrame(() => { tabsEl.scrollLeft = actualScroll; tabsEl.style.scrollBehavior = ''; });
      }
      positionServeButtonOnMobile();
      positionMusicToast();
    });
  }

  window.handleBoardAddClick = function(produceKey) {
    const itemConfig = BOARD_PRODUCE_ITEMS[produceKey];
    if (!itemConfig) return;
    const cleanCount = ingredientStock[itemConfig.cleanUncutId] ?? 0;
    const dirtyCount = itemConfig.dirtyUncutId ? (ingredientStock[itemConfig.dirtyUncutId] ?? 0) : 0;
    if (currentGameMode !== 'sandbox' && (cleanCount + dirtyCount) <= 0) {
      showToast('Out of stock!', 'Buy more in shop.', 'warning');
      return;
    }
    addToBoard(produceKey);
  }

  function renderBoardSlicedInventory(savedScroll = null) {
    if (currentScreen !== 'board') return;
    if (!leftPanel) return;
    const titleEl = leftPanel.querySelector('.panel-title');
    const listEl = leftPanel.querySelector('.layers-list');
    if (!titleEl || !listEl) return;

    titleEl.innerText = 'Sliced Inventory';
    listEl.classList.remove('assembly-mode');

    const innerContainer = listEl.querySelector('.scrollable-items-list');
    const currentListScrollTop = innerContainer ? innerContainer.scrollTop : listEl.scrollTop;
    const currentTabsEl = document.getElementById('cat-tabs-setBoardSlicedCategory');
    const actualScroll = savedScroll !== null ? savedScroll : (currentTabsEl ? currentTabsEl.scrollLeft : 0);

    const slicedItemsArray = Object.values(BOARD_PRODUCE_ITEMS).map(item => ({
      id: item.slicedId,
      name: item.name,
      category: item.category,
      image: item.slicedImage
    }));
    const uniqueSliced = Array.from(new Set(slicedItemsArray.map(a => a.id)))
      .map(id => slicedItemsArray.find(a => a.id === id));

    const filtered = boardSlicedActiveCategory === 'all' ? uniqueSliced : uniqueSliced.filter(i => i.category === boardSlicedActiveCategory);
    const tabsHtml = renderBoardCategoryTabs(boardSlicedActiveCategory, 'setBoardSlicedCategory');
    let itemsContainerHtml = `<div class="scrollable-items-list" style="display:flex; flex-direction:column; gap:6px; overflow-y:auto; flex:1; min-height:0;">`;

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
    const newInner = listEl.querySelector('.scrollable-items-list');
    if (newInner) newInner.scrollTop = currentListScrollTop;

    requestAnimationFrame(() => {
      if (newInner) newInner.scrollTop = currentListScrollTop;
      const tabsEl = document.getElementById('cat-tabs-setBoardSlicedCategory');
      if (tabsEl) {
        tabsEl.style.scrollBehavior = 'auto';
        tabsEl.scrollLeft = actualScroll;
        requestAnimationFrame(() => { tabsEl.scrollLeft = actualScroll; tabsEl.style.scrollBehavior = ''; });
      }
    });
  }

  function renderSinkUnwashedMenu(savedScroll = null) {
    if (currentScreen !== 'sink') return;
    if (!rightPanel) return;
    const titleEl = rightPanel.querySelector('.panel-title');
    const menuEl = rightPanel.querySelector('.ingredients-menu');
    if (!titleEl || !menuEl) return;
    titleEl.innerText = 'Dirty Produce';

    const innerContainer = menuEl.querySelector('.scrollable-items-list');
    const currentListScrollTop = innerContainer ? innerContainer.scrollTop : menuEl.scrollTop;
    const currentTabsEl = document.getElementById('cat-tabs-setSinkUnwashedCategory');
    const actualScroll = savedScroll !== null ? savedScroll : (currentTabsEl ? currentTabsEl.scrollLeft : 0);

    const filtered = sinkUnwashedActiveCategory === 'all' ? Object.values(SINK_WASHABLE_ITEMS) : Object.values(SINK_WASHABLE_ITEMS).filter(i => i.category === sinkUnwashedActiveCategory);
    const tabsHtml = renderSinkCategoryTabs(sinkUnwashedActiveCategory, 'setSinkUnwashedCategory');

    let cardsHtml = `<div class="scrollable-items-list" style="display:flex; flex-direction:column; gap:8px; overflow-y:auto; flex:1; min-height:0;">`;
    filtered.forEach(item => {
      const unwashedId = Object.keys(SINK_WASHABLE_ITEMS).find(k => SINK_WASHABLE_ITEMS[k] === item);
      const stock = ingredientStock[unwashedId] ?? 0;
      const isOut = currentGameMode !== 'sandbox' && stock <= 0;
      cardsHtml += `
        <div class="ingredient-card ${isOut ? 'disabled' : ''}" onclick="handleSinkAddClick('${unwashedId}')">
          <div class="ingredient-info-row">
            <img src="${item.rawImage}" alt="${item.name}" class="unwashed-filter">
            <span class="ingredient-name">${item.name}</span>
          </div>
          <span class="ingredient-stock-count">${currentGameMode === 'sandbox' ? '∞' : 'x' + stock}</span>
        </div>
      `;
    });
    cardsHtml += `</div>`;

    menuEl.innerHTML = tabsHtml + cardsHtml;
    const newInner = menuEl.querySelector('.scrollable-items-list');
    if (newInner) newInner.scrollTop = currentListScrollTop;

    requestAnimationFrame(() => {
      if (newInner) newInner.scrollTop = currentListScrollTop;
      const tabsEl = document.getElementById('cat-tabs-setSinkUnwashedCategory');
      if (tabsEl) {
        tabsEl.style.scrollBehavior = 'auto';
        tabsEl.scrollLeft = actualScroll;
        requestAnimationFrame(() => { tabsEl.scrollLeft = actualScroll; tabsEl.style.scrollBehavior = ''; });
      }
      positionServeButtonOnMobile();
      positionMusicToast();
    });
  }

  window.handleSinkAddClick = function(id) {
    const stock = ingredientStock[id] ?? 0;
    if (currentGameMode !== 'sandbox' && stock <= 0) { showToast('Out of stock!', 'Buy more in shop.', 'warning'); return; }
    addToSink(id);
  }

  function renderSinkWashedInventory(savedScroll = null) {
    if (currentScreen !== 'sink') return;
    if (!leftPanel) return;
    const titleEl = leftPanel.querySelector('.panel-title');
    const listEl = leftPanel.querySelector('.layers-list');
    if (!titleEl || !listEl) return;

    titleEl.innerText = 'Washed Produce';
    listEl.classList.remove('assembly-mode');

    const innerContainer = listEl.querySelector('.scrollable-items-list');
    const currentListScrollTop = innerContainer ? innerContainer.scrollTop : listEl.scrollTop;
    const currentTabsEl = document.getElementById('cat-tabs-setSinkWashedCategory');
    const actualScroll = savedScroll !== null ? savedScroll : (currentTabsEl ? currentTabsEl.scrollLeft : 0);

    const washedItemsArray = Object.values(SINK_WASHABLE_ITEMS).map(item => ({
      id: item.washedId,
      name: item.name,
      category: item.category,
      image: item.washedImage
    }));
    const uniqueWashed = Array.from(new Set(washedItemsArray.map(a => a.id)))
      .map(id => washedItemsArray.find(a => a.id === id));

    const filtered = sinkWashedActiveCategory === 'all' ? uniqueWashed : uniqueWashed.filter(i => i.category === sinkWashedActiveCategory);
    const tabsHtml = renderSinkCategoryTabs(sinkWashedActiveCategory, 'setSinkWashedCategory');
    let itemsContainerHtml = `<div class="scrollable-items-list" style="display:flex; flex-direction:column; gap:6px; overflow-y:auto; flex:1; min-height:0;">`;

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
    const newInner = listEl.querySelector('.scrollable-items-list');
    if (newInner) newInner.scrollTop = currentListScrollTop;

    requestAnimationFrame(() => {
      if (newInner) newInner.scrollTop = currentListScrollTop;
      const tabsEl = document.getElementById('cat-tabs-setSinkWashedCategory');
      if (tabsEl) {
        tabsEl.style.scrollBehavior = 'auto';
        tabsEl.scrollLeft = actualScroll;
        requestAnimationFrame(() => { tabsEl.scrollLeft = actualScroll; tabsEl.style.scrollBehavior = ''; });
      }
    });
  }

  function applyStationMobileResponsiveLayout() {
    const isMobile = window.innerWidth <= 900;
    const stationAreas = [
      document.getElementById('grillCookingArea'),
      document.getElementById('boardCookingArea'),
      document.getElementById('sinkCookingArea')
    ];

    stationAreas.forEach(area => {
      if (!area) return;
      if (isMobile) {
        area.style.width = '100%';
        area.style.maxWidth = '100%';
        area.style.minWidth = '240px';
        area.style.boxSizing = 'border-box';
        area.style.display = 'grid';
        area.style.gridAutoFlow = 'column';
        area.style.gridTemplateRows = 'repeat(3, minmax(0, 1fr))';
        area.style.gridTemplateColumns = '';
        area.style.gridAutoColumns = 'minmax(0, 1fr)';
        area.style.gap = '8px 14px';
        area.style.padding = '64px 52px 14px 52px';
        area.querySelectorAll('.grill-slot').forEach(slot => {
          slot.style.minWidth = '0';
          slot.style.width = '100%';
          slot.style.boxSizing = 'border-box';
        });
      } else {
        area.style.width = '';
        area.style.maxWidth = '';
        area.style.minWidth = '';
        area.style.boxSizing = '';
        area.style.display = '';
        area.style.gridAutoFlow = '';
        area.style.gridTemplateRows = '';
        area.style.gridTemplateColumns = '';
        area.style.gridAutoColumns = '';
        area.style.gap = '';
        area.style.padding = '';
        area.querySelectorAll('.grill-slot').forEach(slot => {
          slot.style.minWidth = '';
          slot.style.width = '';
          slot.style.boxSizing = '';
        });
      }
    });
  }

  window.addEventListener('resize', applyStationMobileResponsiveLayout);

  function initSinkStructure() {
    syncStationSlotArraysToTargetCount();
    const area = document.getElementById('sinkCookingArea');
    if (!area) return;
    area.innerHTML = '';

    sinkSlots.forEach((_, index) => {
      const slotEl = document.createElement('div');
      slotEl.className = 'grill-slot';
      slotEl.dataset.index = index;
      slotEl.onclick = () => {
        if (isBinSelectMode) toggleSinkSlotSelectionForBin(index);
        else handleSinkSlotClick(index);
      };
      area.appendChild(slotEl);
    });
  }

  function addToSink(unwashedId) {
    syncStationSlotArraysToTargetCount();
    const emptyIndex = sinkSlots.findIndex(slot => slot === null);
    if (emptyIndex === -1) { showToast('Sink is full!', '', 'warning'); return; }

    if (currentGameMode !== 'sandbox') {
      ingredientStock[unwashedId] = (ingredientStock[unwashedId] ?? 0) - 1;
      saveStock();
    }

    const instant = isInstantFinishActive();
    sinkSlots[emptyIndex] = {
      unwashedId,
      state: instant ? 'ready' : 'idle',
      startTime: null,
      notified: instant
    };
    playSound(SOUNDS.ingridients);
    saveSinkState();
    renderSinkUnwashedMenu();
    renderSink();
  }

  function startWashingSlot(index) {
    const slot = sinkSlots[index];
    if (!slot || slot.state !== 'idle') return;

    slot.state = 'washing';
    slot.startTime = Date.now();

    manageWashingAudio(true);
    saveSinkState();
    renderSink();
  }

  function manageWashingAudio(isPlaying) {
    if (isPlaying) {
      if (!washingAudioInstance && SOUNDS.washing) {
        washingAudioInstance = SOUNDS.washing;
        washingAudioInstance.loop = true;
        playSound(washingAudioInstance);
      }
    } else {
      if (washingAudioInstance) {
        try { washingAudioInstance.pause(); washingAudioInstance.currentTime = 0; } catch(e){}
        washingAudioInstance = null;
      }
    }
  }

  function updateSinkLogic() {
    const now = Date.now();
    let needsSave = false;
    let activeWashingCount = 0;

    sinkSlots.forEach((slot) => {
      if (!slot) return;
      if (slot.state === 'idle' && isInstantFinishActive()) {
        slot.state = 'ready';
        slot.notified = true;
        needsSave = true;
        return;
      }
      if (slot.state === 'washing') {
        activeWashingCount++;
        const config = SINK_WASHABLE_ITEMS[slot.unwashedId];
        const duration = getActionDurationSeconds(config.washTime);
        const elapsed = (now - slot.startTime) / 1000;
        if (elapsed >= duration) {
          slot.state = 'ready';
          if (!slot.notified) {
            playSound(SOUNDS.notification);
            slot.notified = true;
          }
          needsSave = true;
        }
      }
    });

    if (activeWashingCount === 0) manageWashingAudio(false);
    if (needsSave) saveSinkState();
  }

  function getSinkSlotProgress(slot) {
    if (!slot || slot.state !== 'washing') return 0;
    const config = SINK_WASHABLE_ITEMS[slot.unwashedId];
    const duration = Math.max(0.05, getActionDurationSeconds(config.washTime));
    const now = Date.now();
    const elapsed = (now - slot.startTime) / 1000;
    return Math.min(100, (elapsed / duration) * 100);
  }

  function handleSinkSlotClick(index) {
    const slot = sinkSlots[index];
    if (!slot) return;
    const config = SINK_WASHABLE_ITEMS[slot.unwashedId];

    if (slot.state === 'idle') {
      startWashingSlot(index);
    } else if (slot.state === 'ready') {
      ingredientStock[config.washedId] = (ingredientStock[config.washedId] ?? 0) + 1;
      saveStock();
      playSound(SOUNDS.buttons);

      sinkSlots[index] = null;
      saveSinkState();
      renderSinkWashedInventory();
      renderSink();
    }
  }

  function toggleSinkSlotSelectionForBin(index) {
    if (!sinkSlots[index]) return;
    const pos = selectedSinkIndicesForBin.indexOf(index);
    if (pos > -1) selectedSinkIndicesForBin.splice(pos, 1);
    else selectedSinkIndicesForBin.push(index);
    renderSink();
  }

  function renderSink() {
    updateSinkLogic();
    if (currentScreen !== 'sink') {
      updateStationNotificationDots();
      return;
    }

    const area = document.getElementById('sinkCookingArea');
    if (!area || area.children.length !== sinkSlots.length) initSinkStructure();

    const slotElements = area.querySelectorAll('.grill-slot');
    let hasWashing = false;

    sinkSlots.forEach((slotData, index) => {
      const slotEl = slotElements[index];
      if (!slotEl) return;

      slotEl.className = `grill-slot ${selectedSinkIndicesForBin.includes(index) ? 'selected-for-bin' : ''}`;

      if (slotData) {
        const config = SINK_WASHABLE_ITEMS[slotData.unwashedId];
        let extraHtml = '';

        if (slotData.state === 'idle') {
          extraHtml = `<div class="flip-badge" style="background:#42a5f5; color:#fff;">Wash!</div>`;
          slotEl.innerHTML = `
            ${extraHtml}
            <div class="grill-item-wrapper">
              <img src="${config.rawImage}" class="grill-item unwashed-filter">
            </div>
            <div class="grill-progress-container" style="visibility:hidden;"></div>
          `;
        } else if (slotData.state === 'washing') {
          hasWashing = true;
          const progress = getSinkSlotProgress(slotData);

          let bubblesHtml = '';
          for (let i = 0; i < 6; i++) {
            const leftPos = 10 + Math.random() * 80;
            const animDelay = Math.random() * 0.5;
            const bubbleSize = 5 + Math.random() * 6;
            const dy = -(15 + Math.random() * 15);
            bubblesHtml += `<div class="sink-bubble" style="left: ${leftPos}px; width: ${bubbleSize}px; height: ${bubbleSize}px; animation-delay: ${animDelay}s; --dy: ${dy}px;"></div>`;
          }

          slotEl.innerHTML = `
            <div class="grill-item-wrapper">
              <div class="sink-water-container">
                <img src="${config.rawImage}" class="grill-item unwashed-filter">
                <div class="sink-bubble-splash-container">${bubblesHtml}</div>
              </div>
            </div>
            <div class="grill-progress-container">
              <div class="grill-progress-bar" style="width: ${progress}%"></div>
            </div>
          `;
        } else if (slotData.state === 'ready') {
          slotEl.innerHTML = `
            <div class="grill-item-wrapper">
              <img src="${config.washedImage}" class="grill-item">
              <div class="flip-badge" style="background:#689f38; color:#fff; top:auto; bottom:4px; right:4px; left:auto;">Collect!</div>
            </div>
            <div class="grill-progress-container" style="visibility:hidden;"></div>
          `;
        }
      } else {
        slotEl.innerHTML = '';
      }
    });

    manageWashingAudio(hasWashing);
    applyStationMobileResponsiveLayout();
    updateStationNotificationDots();
  }

  setInterval(() => {
    updateSinkLogic();
    if (currentScreen === 'sink') renderSink();
    else updateStationNotificationDots();
  }, 50);

  function initBoardStructure() {
    syncStationSlotArraysToTargetCount();
    const area = document.getElementById('boardCookingArea');
    if (!area) return;
    area.innerHTML = '';

    boardSlots.forEach((_, index) => {
      const slotEl = document.createElement('div');
      slotEl.className = 'grill-slot';
      slotEl.dataset.index = index;
      slotEl.onclick = () => {
        if (isBinSelectMode) toggleBoardSlotSelectionForBin(index);
        else handleBoardSlotClick(index);
      };
      area.appendChild(slotEl);
    });
  }

  function addToBoard(produceKey) {
    syncStationSlotArraysToTargetCount();
    const emptyIndex = boardSlots.findIndex(slot => slot === null);
    if (emptyIndex === -1) { showToast('Board is full!', '', 'warning'); return; }

    const itemConfig = BOARD_PRODUCE_ITEMS[produceKey];
    if (!itemConfig) return;

    const consumed = consumeBoardProducePreferClean(itemConfig);
    if (!consumed) {
      showToast('Out of stock!', 'Buy more in shop.', 'warning');
      return;
    }

    const instant = isInstantFinishActive();
    boardSlots[emptyIndex] = {
      produceKey,
      state: instant ? 'ready' : 'uncut',
      startTime: null,
      notified: instant,
      isDirty: consumed.isDirty
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
      try { cuttingAudioInstance.pause(); cuttingAudioInstance.currentTime = 0; } catch(e) {}
      cuttingAudioInstance = null;
    }

    if (SOUNDS.cutting) {
      cuttingAudioInstance = SOUNDS.cutting;
      cuttingAudioInstance.loop = false;
      cuttingAudioInstance.onended = () => { cuttingAudioInstance = null; };
      playSound(cuttingAudioInstance);
    } else {
      playSound(SOUNDS.chop);
    }

    saveBoardState();
    renderBoard();
  }

  function manageCuttingAudio(hasActiveCutting) {
    if (!hasActiveCutting && cuttingAudioInstance) {
      try { cuttingAudioInstance.pause(); cuttingAudioInstance.currentTime = 0; } catch(e){}
      cuttingAudioInstance = null;
    }
  }

  function getBoardItemConfig(slot) {
    if (!slot) return null;
    if (slot.produceKey && BOARD_PRODUCE_ITEMS[slot.produceKey]) {
      return BOARD_PRODUCE_ITEMS[slot.produceKey];
    }
    if (slot.uncutId) {
      const cleanName = slot.uncutId.replace('unwashed-uncut-', '').replace('uncut-', '');
      return BOARD_PRODUCE_ITEMS[cleanName] || null;
    }
    return null;
  }

  function updateBoardLogic() {
    const now = Date.now();
    let needsSave = false;

    boardSlots.forEach((slot) => {
      if (!slot) return;
      if (slot.state === 'uncut' && isInstantFinishActive()) {
        slot.state = 'ready';
        slot.notified = true;
        needsSave = true;
        return;
      }
      if (slot.state === 'cutting') {
        const config = getBoardItemConfig(slot);
        if (!config) return;
        const duration = getActionDurationSeconds(config.cutTime);
        const elapsed = (now - slot.startTime) / 1000;
        if (elapsed >= duration) {
          slot.state = 'ready';
          if (!slot.notified) {
            playSound(SOUNDS.notification);
            slot.notified = true;
          }
          needsSave = true;
        }
      }
    });

    if (needsSave) saveBoardState();
  }

  function getBoardSlotProgress(slot) {
    if (!slot || slot.state !== 'cutting') return 0;
    const config = getBoardItemConfig(slot);
    if (!config) return 0;
    const duration = Math.max(0.05, getActionDurationSeconds(config.cutTime));
    const now = Date.now();
    const elapsed = (now - slot.startTime) / 1000;
    return Math.min(100, (elapsed / duration) * 100);
  }

  function handleBoardSlotClick(index) {
    const slot = boardSlots[index];
    if (!slot) return;
    const config = getBoardItemConfig(slot);
    if (!config) return;

    if (slot.state === 'uncut') {
      startCuttingSlot(index);
    } else if (slot.state === 'ready') {
      ingredientStock[config.slicedId] = (ingredientStock[config.slicedId] ?? 0) + 3;
      if (slot.isDirty) {
        dirtyStock[config.slicedId] = (dirtyStock[config.slicedId] ?? 0) + 3;
        saveDirtyStock();
      }
      saveStock();
      playSound(SOUNDS.buttons);
      trackQuestProgress('slice_items', 1);

      boardSlots[index] = null;
      saveBoardState();
      renderBoardSlicedInventory();
      renderBoard();
    }
  }

  function toggleBoardSlotSelectionForBin(index) {
    if (!boardSlots[index]) return;
    const pos = selectedBoardIndicesForBin.indexOf(index);
    if (pos > -1) selectedBoardIndicesForBin.splice(pos, 1);
    else selectedBoardIndicesForBin.push(index);
    renderBoard();
  }

  function renderBoard() {
    updateBoardLogic();
    if (currentScreen !== 'board') {
      updateStationNotificationDots();
      return;
    }

    const area = document.getElementById('boardCookingArea');
    if (!area || area.children.length !== boardSlots.length) initBoardStructure();

    const slotElements = area.querySelectorAll('.grill-slot');

    boardSlots.forEach((slotData, index) => {
      const slotEl = slotElements[index];
      if (!slotEl) return;

      slotEl.className = `grill-slot ${selectedBoardIndicesForBin.includes(index) ? 'selected-for-bin' : ''}`;

      if (slotData) {
        const config = getBoardItemConfig(slotData);
        if (!config) return;
        const dirtyClass = slotData.isDirty ? 'unwashed-filter' : '';
        let imgsrc = config.rawImage;
        let extraHtml = '';

        if (slotData.state === 'uncut') {
          extraHtml = `<div class="flip-badge" style="background:#8d6e63; color:#fff;">Chop!</div>`;
        } else if (slotData.state === 'ready') {
          slotEl.innerHTML = `
            <div style="position:relative; width:100px; height:105px; display:flex; align-items:center; justify-content:center;">
              <img src="${config.slicedImage}" class="${dirtyClass}" style="width:60px; height:60px; position:absolute; transform: translate(-18px, -12px) rotate(-15deg); object-fit:contain;">
              <img src="${config.slicedImage}" class="${dirtyClass}" style="width:60px; height:60px; position:absolute; transform: translate(18px, -12px) rotate(15deg); object-fit:contain;">
              <img src="${config.slicedImage}" class="${dirtyClass}" style="width:60px; height:60px; position:absolute; transform: translate(0px, 12px); object-fit:contain;">
              <div class="flip-badge" style="background:#689f38; color:#fff; top:auto; bottom:4px; right:4px; left:auto;">x3 Collect</div>
            </div>
            <div class="grill-progress-container" style="visibility:hidden;"></div>
          `;
          updateStationNotificationDots();
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
          <div class="grill-item-wrapper"><img src="${imgsrc}" class="grill-item ${dirtyClass}"></div>
          ${progressHtml}
        `;
      } else {
        slotEl.innerHTML = '';
      }
    });
    applyStationMobileResponsiveLayout();
    updateStationNotificationDots();
  }

  if (knifeBtn) {
    knifeBtn.onclick = () => {
      playSound(SOUNDS.buttons);
      boardSlots.forEach((slot, idx) => {
        if (slot && slot.state === 'uncut') startCuttingSlot(idx);
      });
    };
  }

  setInterval(() => {
    updateBoardLogic();
    if (currentScreen === 'board') renderBoard();
    else updateStationNotificationDots();
  }, 50);

  function addToGrill(rawId) {
    syncStationSlotArraysToTargetCount();
    const emptyIndex = grillSlots.findIndex(slot => slot === null);
    if (emptyIndex === -1) { showToast('Grill is full!', '', 'warning'); return; }

    let isDirty = false;
    if (currentGameMode !== 'sandbox') {
      const consumed = consumePreparedItemPreferClean(rawId);
      if (!consumed) { showToast('Out of stock!', 'Buy more in shop.', 'warning'); return; }
      isDirty = consumed.isDirty;
    }

    const instant = isInstantFinishActive();
    grillSlots[emptyIndex] = {
      rawId,
      isDirty,
      state: instant ? 'ready' : 'cooking',
      startTime: Date.now(),
      flipStartTime: null,
      burnStartTime: instant ? Date.now() : null,
      isFlipped: instant,
      notified: instant
    };

    playSound(SOUNDS.ingridients);
    saveGrillState();
    renderGrillIngredientsMenu();
    renderGrill();
  }

  function updateGrillLogic() {
    const now = Date.now();
    let needsSave = false;
    const instant = isInstantFinishActive();
    const noBurn = isNoBurnActive();

    grillSlots.forEach((slot) => {
      if (!slot) return;
      const config = GRILLABLE_ITEMS[slot.rawId];
      const cookTotal = getActionDurationSeconds(config.cookTime);
      const halfTime = Math.max(0.05, cookTotal / 2);
      const burnLimit = getBurnDurationSeconds(config.burnTime);
      const elapsed = (now - slot.startTime) / 1000;

      if (instant && slot.state !== 'ready' && slot.state !== 'charred') {
        slot.state = 'ready';
        slot.isFlipped = true;
        slot.burnStartTime = now;
        slot.notified = true;
        needsSave = true;
      } else if (slot.state === 'cooking' && !slot.isFlipped) {
        if (config.needsFlip) {
          if (elapsed >= halfTime) {
            slot.state = 'needsFlip';
            slot.burnStartTime = now;
            if (!slot.notified) { playSound(SOUNDS.notification); slot.notified = true; }
            needsSave = true;
          }
        } else {
          if (elapsed >= cookTotal) {
            slot.state = 'ready';
            slot.burnStartTime = now;
            if (!slot.notified) { playSound(SOUNDS.notification); slot.notified = true; }
            needsSave = true;
          }
        }
      } else if (slot.state === 'needsFlip') {
        if (!noBurn && slot.burnStartTime && (now - slot.burnStartTime) / 1000 >= burnLimit) {
          slot.state = 'charred';
          playSound(SOUNDS.burnt);
          showToast('Burnt!', `${config.name} turned into charcoal!`, 'error');
          needsSave = true;
        }
      } else if (slot.isFlipped && slot.state === 'cooking') {
        if ((now - slot.flipStartTime) / 1000 >= halfTime) {
          slot.state = 'ready';
          slot.burnStartTime = now;
          if (!slot.notified) { playSound(SOUNDS.notification); slot.notified = true; }
          needsSave = true;
        }
      } else if (slot.state === 'ready') {
        if (!noBurn && slot.burnStartTime && (now - slot.burnStartTime) / 1000 >= burnLimit) {
          slot.state = 'charred';
          playSound(SOUNDS.burnt);
          showToast('Burnt!', `${config.name} turned into charcoal!`, 'error');
          needsSave = true;
        }
      }
    });

    if (needsSave) saveGrillState();
  }

  function getSlotProgress(slot) {
    if (!slot) return 0;
    const config = GRILLABLE_ITEMS[slot.rawId];
    const cookTotal = getActionDurationSeconds(config.cookTime);
    const halfTime = Math.max(0.05, cookTotal / 2);
    const burnLimit = getBurnDurationSeconds(config.burnTime);
    const now = Date.now();
    const elapsed = (now - slot.startTime) / 1000;

    if (!config.needsFlip) {
      if (slot.state === 'ready') {
        if (isNoBurnActive() || !isFinite(burnLimit)) return 100;
        const burnElapsed = slot.burnStartTime ? (now - slot.burnStartTime) / 1000 : 0;
        return Math.max(0, 100 - (burnElapsed / burnLimit) * 100);
      }
      return Math.min(100, (elapsed / Math.max(0.05, cookTotal)) * 100);
    }

    if (slot.state === 'cooking' && !slot.isFlipped) return Math.min(100, (elapsed / halfTime) * 100);
    else if (slot.state === 'needsFlip') {
      if (isNoBurnActive() || !isFinite(burnLimit)) return 100;
      const burnElapsed = slot.burnStartTime ? (now - slot.burnStartTime) / 1000 : 0;
      return Math.max(0, 100 - (burnElapsed / burnLimit) * 100);
    } else if (slot.isFlipped) {
      const activeElapsed = slot.flipStartTime ? (now - slot.flipStartTime) / 1000 : cookTotal;
      if (slot.state === 'ready') {
        if (isNoBurnActive() || !isFinite(burnLimit)) return 100;
        const burnElapsed = slot.burnStartTime ? (now - slot.burnStartTime) / 1000 : 0;
        return Math.max(0, 100 - (burnElapsed / burnLimit) * 100);
      }
      return Math.min(100, (activeElapsed / halfTime) * 100);
    }
    return 0;
  }

  function initGrillStructure() {
    syncStationSlotArraysToTargetCount();
    const area = document.getElementById('grillCookingArea');
    if (!area) return;
    area.innerHTML = '';

    grillSlots.forEach((_, index) => {
      const slotEl = document.createElement('div');
      slotEl.className = 'grill-slot';
      slotEl.dataset.index = index;
      slotEl.onclick = () => {
        if (isBinSelectMode) toggleGrillSlotSelectionForBin(index);
        else handleGrillSlotClick(index);
      };
      area.appendChild(slotEl);
    });
  }

  function toggleGrillSlotSelectionForBin(index) {
    if (!grillSlots[index]) return;
    const pos = selectedGrillIndicesForBin.indexOf(index);
    if (pos > -1) selectedGrillIndicesForBin.splice(pos, 1);
    else selectedGrillIndicesForBin.push(index);
    renderGrill();
  }

  function renderGrill() {
    updateGrillLogic();
    if (currentScreen !== 'grill') {
      updateStationNotificationDots();
      return;
    }

    const area = document.getElementById('grillCookingArea');
    if (!area || area.children.length !== grillSlots.length) initGrillStructure();

    let hasActiveCooking = false;
    const slotElements = area.querySelectorAll('.grill-slot');

    grillSlots.forEach((slotData, index) => {
      const slotEl = slotElements[index];
      if (!slotEl) return;

      slotEl.className = `grill-slot ${selectedGrillIndicesForBin.includes(index) ? 'selected-for-bin' : ''}`;

      if (slotData) {
        if (slotData.state !== 'charred') hasActiveCooking = true;
        const config = GRILLABLE_ITEMS[slotData.rawId];
        let imgsrc = config.rawImage;
        let extraHtml = '';

        if (slotData.state === 'cooking') imgsrc = slotData.isFlipped ? config.flip2Image : config.rawImage;
        else if (slotData.state === 'needsFlip') { imgsrc = config.flip1Image; extraHtml = `<div class="flip-badge">Flip!</div>`; }
        else if (slotData.state === 'ready') { imgsrc = config.cookedImage; extraHtml = `<div class="flip-badge" style="background:#689f38; color:#fff;">Collect!</div>`; }
        else if (slotData.state === 'charred') imgsrc = config.cookedImage;

        const progressPercent = getSlotProgress(slotData);
        const isBurnPhase = slotData.state === 'ready' || slotData.state === 'needsFlip';
        const hideBurnBarOnMaxSlowBurn = isBurnPhase && isNoBurnActive();
        const showProgressBar = slotData.state !== 'charred' && !hideBurnBarOnMaxSlowBurn;
        const isBurningBar = isBurnPhase && !hideBurnBarOnMaxSlowBurn;
        const stateFilterClass = slotData.state === 'charred'
          ? 'charred'
          : (slotData.isDirty ? 'unwashed-filter' : '');

        const progressBarHtml = showProgressBar
          ? `<div class="grill-progress-container">
               <div class="grill-progress-bar ${isBurningBar ? 'burning' : ''}" style="width: ${progressPercent}%"></div>
             </div>`
          : `<div class="grill-progress-container" style="visibility:hidden;"></div>`;

        slotEl.innerHTML = `
          ${extraHtml}
          <div class="grill-item-wrapper">
            <img src="${imgsrc}" class="grill-item ${stateFilterClass}">
            <div class="oil-splash-container" id="splash-container-${index}"></div>
          </div>
          ${progressBarHtml}
        `;
      } else {
        slotEl.innerHTML = '';
      }
    });

    manageSizzlingAudio(hasActiveCooking);
    applyStationMobileResponsiveLayout();
    updateStationNotificationDots();
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
      if (slot.isDirty) {
        dirtyStock[config.cookedId] = (dirtyStock[config.cookedId] ?? 0) + 1;
        saveDirtyStock();
      }
      saveStock();
      playSound(SOUNDS.buttons);
      trackQuestProgress('cook_patties', 1);

      grillSlots[index] = null;
      saveGrillState();
      renderGrillCookedInventory();
      renderGrill();
    }
  }

  setInterval(() => {
    updateGrillLogic();
    if (currentScreen === 'grill') renderGrill();
    else updateStationNotificationDots();
  }, 50);

  function renderSauces() {
    [desktopSaucesGroup, mobileSaucesGroup].forEach(container => {
      if (!container) return;
      container.innerHTML = '';
      SAUCES.forEach(sauce => {
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

  // --- SFX & MUSIC VOLUME + MUSIC PLAYER CONTROLS ---
  const sfxVolumeRange = document.getElementById('sfxVolumeRange') || document.getElementById('volumeRange');
  const sfxVolumeVal = document.getElementById('sfxVolumeVal') || document.getElementById('volumeVal');
  if (sfxVolumeRange) {
    const pct = Math.round(sfxVolumeLevel * 100);
    sfxVolumeRange.value = pct;
    if (sfxVolumeVal) sfxVolumeVal.innerText = `${pct}%`;
    sfxVolumeRange.oninput = () => {
      const val = Math.max(0, Math.min(100, parseInt(sfxVolumeRange.value, 10) || 0));
      sfxVolumeLevel = val / 100;
      if (sfxVolumeVal) sfxVolumeVal.innerText = `${val}%`;
      localStorage.setItem('burger_sfx_volume', String(sfxVolumeLevel));
      localStorage.setItem('burger_volume', String(sfxVolumeLevel));
    };
  }

  const musicVolumeRange = document.getElementById('musicVolumeRange');
  const musicVolumeVal = document.getElementById('musicVolumeVal');
  if (musicVolumeRange) {
    const pct = Math.round(musicVolumeLevel * 100);
    musicVolumeRange.value = pct;
    if (musicVolumeVal) musicVolumeVal.innerText = `${pct}%`;
    musicVolumeRange.oninput = () => {
      const val = Math.max(0, Math.min(100, parseInt(musicVolumeRange.value, 10) || 0));
      musicVolumeLevel = val / 100;
      if (musicVolumeVal) musicVolumeVal.innerText = `${val}%`;
      localStorage.setItem('burger_music_volume', String(musicVolumeLevel));
      if (musicAudio) {
        musicAudio.volume = musicVolumeLevel;
      }
    };
  }

  const musicPrevBtn = document.getElementById('musicPrevBtn');
  const musicToggleBtn = getPlayPauseBtnEl();
  const musicNextBtn = document.getElementById('musicNextBtn');
  if (musicPrevBtn) musicPrevBtn.onclick = prevMusicTrack;
  if (musicToggleBtn) musicToggleBtn.onclick = () => {
    playSound(SOUNDS.buttons);
    toggleMusicPlayback(true);
  };
  if (musicNextBtn) musicNextBtn.onclick = nextMusicTrack;

  loadMusicTrack(currentTrackIndex, isMusicPlaying, isMusicPlaying && !isSettingsOpen(), savedMusicPosition);

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
  const forceOrderBtn = document.getElementById('forceOrderBtn');
  const skipOrderBtn = document.getElementById('skipOrderBtn');
  let serveFloatingBtn = document.getElementById('serveFloatingBtn');

  if (serveFloatingBtn) {
    serveFloatingBtn.classList.add('serve-btn-above-ingredients');
    serveFloatingBtn.onclick = () => {
      if (currentActiveOrder && currentBurger.length > 0) checkOrderSubmission();
      else showToast('No active order or burger is empty!', '', 'warning');
    };
  }

  function positionServeButtonOnMobile() {
    if (!serveFloatingBtn) return;
    if (window.innerWidth > 900) {
      serveFloatingBtn.style.top = '';
      serveFloatingBtn.classList.remove('hidden-serve-btn');
      return;
    }

    const hasOrderOrMode = currentActiveOrder !== null || getCurrentSpeed() !== 'no-orders';
    const shouldShow = currentScreen === 'assembly' && hasOrderOrMode && !document.body.classList.contains('ui-hidden');

    if (!shouldShow || !rightPanel) {
      serveFloatingBtn.classList.add('hidden-serve-btn');
      return;
    }

    serveFloatingBtn.classList.remove('hidden-serve-btn');
    const panelRect = rightPanel.getBoundingClientRect();
    const btnHeight = serveFloatingBtn.offsetHeight || 32;
    const topPos = Math.max(8, panelRect.top - btnHeight - 6);
    serveFloatingBtn.style.top = `${topPos}px`;
  }

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
    { id: 'unwashed-uncut-champignons', name: 'Champignons (Dirty)', category: 'vegetables', image: 'images/uncut-champignons.png' },
    { id: 'unwashed-uncut-lettuce', name: 'Lettuce (Dirty)', category: 'vegetables', image: 'images/uncut-lettuce.png' },
    { id: 'unwashed-uncut-tomato', name: 'Tomato (Dirty)', category: 'vegetables', image: 'images/uncut-tomato.png' },
    { id: 'unwashed-uncut-pickles', name: 'Pickles (Dirty)', category: 'vegetables', image: 'images/uncut-pickles.png' },
    { id: 'unwashed-uncut-red-onion', name: 'Red Onion (Dirty)', category: 'vegetables', image: 'images/uncut-red-onion.png' },
    { id: 'unwashed-uncut-white-onion', name: 'White Onion (Dirty)', category: 'vegetables', image: 'images/uncut-white-onion.png' },
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

  function normalizeSingleUpgradesTabInContainer(containerSelector, switchFnName, activeTabRef) {
    const tabsContainer = document.querySelector(containerSelector);
    if (!tabsContainer) return;

    const allTabs = Array.from(tabsContainer.querySelectorAll('.recipe-tab'));
    const upgradeTabs = allTabs.filter(t => {
      const key = (t.dataset.tab || t.textContent || '').trim().toLowerCase();
      return key === 'upgrades' || key === 'upgrade';
    });

    if (upgradeTabs.length === 0) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'recipe-tab';
      btn.dataset.tab = 'upgrades';
      btn.textContent = 'Upgrades';
      btn.onclick = () => window[switchFnName]('upgrades');
      tabsContainer.appendChild(btn);
    } else {
      upgradeTabs.forEach((btn, idx) => {
        if (idx > 0) {
          btn.remove();
          return;
        }
        btn.setAttribute('type', 'button');
        btn.dataset.tab = 'upgrades';
        btn.textContent = 'Upgrades';
        btn.onclick = () => window[switchFnName]('upgrades');
      });
    }

    const currentActive = typeof activeTabRef === 'function' ? activeTabRef() : activeTabRef;
    tabsContainer.querySelectorAll('.recipe-tab').forEach(t => {
      if (!t.dataset.tab) {
        t.dataset.tab = (t.textContent || '').trim().toLowerCase();
      }
      t.classList.toggle('active', t.dataset.tab === currentActive);
    });
  }

  let activeInventoryTab = 'all';
  window.switchInventoryTab = function(tab) {
    activeInventoryTab = tab;
    normalizeSingleUpgradesTabInContainer('#inventoryTabs', 'switchInventoryTab', () => activeInventoryTab);
    renderInventoryModal();
  }

  function ensureInventoryUpgradesTabButton() {
    normalizeSingleUpgradesTabInContainer('#inventoryTabs', 'switchInventoryTab', () => activeInventoryTab);
  }

  function renderUpgradeDots(level, maxLevel = 3) {
    let dots = '<span class="upgrade-dots">';
    for (let i = 1; i <= maxLevel; i++) {
      dots += `<span class="upgrade-dot ${i <= level ? 'filled' : ''}"></span>`;
    }
    dots += '</span>';
    return dots;
  }

  function formatUpgradeSubline(upg, lv) {
    const isMax = lv >= upg.maxLevel;
    const desc = upg.descriptions[lv] || upg.descriptions[upg.maxLevel] || '';
    const priceText = isMax ? 'MAX' : `$${(upg.prices[lv + 1] ?? 0).toFixed(2)}`;
    return `<p class="upgrade-desc-text"><span style="color:#ffd54f; font-weight:600;">${priceText}</span> <span style="color:#8e8e8e;">|</span> <span style="color:#a6a6a6;">${desc}</span></p>`;
  }

  window.downgradeUpgradeFromBackpack = function(upgradeId) {
    if (currentGameMode !== 'sandbox') return;
    const cfg = UPGRADES_CONFIG[upgradeId];
    if (!cfg) return;
    const currentLv = getUpgradeLevel(upgradeId);
    if (currentLv <= 0) return;

    const prevLv = currentLv - 1;
    upgradesLevels[upgradeId] = prevLv;
    saveUpgradesState();

    if (upgradeId === 'extra_slots') {
      syncStationSlotArraysToTargetCount();
      saveGrillState();
      saveBoardState();
      saveSinkState();
      if (currentScreen === 'grill') { initGrillStructure(); renderGrill(); }
      else if (currentScreen === 'board') { initBoardStructure(); renderBoard(); }
      else if (currentScreen === 'sink') { initSinkStructure(); renderSink(); }
    }

    playSound(SOUNDS.buttons);
    showToast('Upgrade Lowered', `${cfg.name} (${prevLv}/${cfg.maxLevel})`, 'warning');
    renderInventoryModal();
  };

  function renderInventoryModal() {
    const body = document.getElementById('inventoryModalBody');
    if (!body) return;

    ensureInventoryUpgradesTabButton();

    let searchInput = document.getElementById('inventorySearchInput');
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';

    if (!searchInput) {
      const tabsContainer = document.getElementById('inventoryTabs');
      if (tabsContainer) {
        searchInput = document.createElement('input');
        searchInput.id = 'inventorySearchInput';
        searchInput.className = 'modal-search-input';
        searchInput.placeholder = 'Search inventory...';
        searchInput.oninput = () => renderInventoryModal();
        tabsContainer.parentNode.insertBefore(searchInput, tabsContainer.nextSibling);
      }
    }

    let cardsHtml = '';
    if (activeInventoryTab === 'upgrades') {
      const list = Object.values(UPGRADES_CONFIG).filter(u => u.name.toLowerCase().includes(searchTerm));
      list.forEach(upg => {
        const lv = getUpgradeLevel(upg.id);
        const sublineHtml = formatUpgradeSubline(upg, lv);
        const sandboxMinusHtml = (currentGameMode === 'sandbox' && lv > 0)
          ? `<button class="btn-downgrade-sandbox" title="Lower level (Sandbox)" onclick="downgradeUpgradeFromBackpack('${upg.id}')">−</button>`
          : '';
        cardsHtml += `
          <div class="inventory-item-card">
            <div class="inventory-item-info">
              <div class="upgrade-emoji-icon">${upg.icon}</div>
              <div class="inventory-item-details">
                <h4>${upg.name}</h4>
                ${sublineHtml}
              </div>
            </div>
            <div class="inventory-right-group">
              ${sandboxMinusHtml}
              <button class="btn-buy-more" onclick="openShopForCategory('upgrades')">Shop</button>
              <div class="upgrade-level-badge">${lv}/${upg.maxLevel}</div>
            </div>
          </div>
        `;
      });
    } else {
      const filtered = SHOP_ITEMS.filter(item => {
        const matchesTab = activeInventoryTab === 'all' || item.category === activeInventoryTab;
        const matchesSearch = item.name.toLowerCase().includes(searchTerm);
        return matchesTab && matchesSearch;
      });

      filtered.forEach(item => {
        const stockVal = currentGameMode === 'sandbox' ? '∞' : (ingredientStock[item.id] ?? 0);
        cardsHtml += `
          <div class="inventory-item-card">
            <div class="inventory-item-info">
              <img src="${item.image}" alt="${item.name}">
              <div class="inventory-item-details"><h4>${item.name}</h4></div>
            </div>
            <div class="inventory-right-group">
              <button class="btn-buy-more" onclick="openShopForCategory('${item.category}')">Buy more</button>
              <div class="inventory-count-badge">${stockVal}</div>
            </div>
          </div>
        `;
      });
    }

    let listContainer = body.querySelector('.inventory-list-container');
    if (!listContainer) {
      listContainer = document.createElement('div');
      listContainer.className = 'inventory-list-container';
      listContainer.style.cssText = 'display:flex; flex-direction:column; gap:8px; min-height: 280px;';
      body.appendChild(listContainer);
    }
    listContainer.innerHTML = cardsHtml;
  }

  window.openShopForCategory = function(category) {
    playSound(SOUNDS.buttons);
    inventoryModal.classList.remove('open');
    document.body.classList.remove('modal-open');
    updateShopBalanceHeader();
    switchShopTab(category);
    shopModal.classList.add('open');
    document.body.classList.add('modal-open');
  }

  if (openInventoryBtn) {
    openInventoryBtn.onclick = () => {
      playSound(SOUNDS.buttons);
      ensureInventoryUpgradesTabButton();
      renderInventoryModal();
      inventoryModal.classList.add('open');
      document.body.classList.add('modal-open');
    };
  }
  if (closeInventoryModal) closeInventoryModal.onclick = () => { playSound(SOUNDS.buttons); inventoryModal.classList.remove('open'); document.body.classList.remove('modal-open'); };

  const questsModal = document.getElementById('questsModal');
  const openQuestsBtn = document.getElementById('openQuestsBtn');
  const closeQuestsModal = document.getElementById('closeQuestsModal');

  const allModals = [
    { modal: recipesModal, closeBtn: closeRecipesModal },
    { modal: shopModal, closeBtn: closeShopModal },
    { modal: inventoryModal, closeBtn: closeInventoryModal },
    { modal: achievementsModal, closeBtn: closeAchievementsModal },
    { modal: settingsModal, closeBtn: closeSettingsModal },
    { modal: questsModal, closeBtn: closeQuestsModal }
  ];

  allModals.forEach(item => {
    if (!item.modal) return;
    item.modal.addEventListener('click', (e) => {
      if (e.target === item.modal) {
        playSound(SOUNDS.buttons);
        item.modal.classList.remove('open');
        document.body.classList.remove('modal-open');
        positionMusicToast();
      }
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      allModals.forEach(item => {
        if (item.modal && item.modal.classList.contains('open')) {
          playSound(SOUNDS.buttons);
          item.modal.classList.remove('open');
          document.body.classList.remove('modal-open');
          positionMusicToast();
        }
      });
    }
  });

  function updateActionButtonsVisibility() {
    const isMobile = window.innerWidth <= 900;
    const isSpecialScreen = currentScreen === 'grill' || currentScreen === 'board' || currentScreen === 'sink';

    if (squeezeBtn) squeezeBtn.style.display = isSpecialScreen ? 'none' : 'flex';

    const currentSpeed = getCurrentSpeed();
    const isNoOrders = currentSpeed === 'no-orders';
    const isSandboxOrCasual = currentGameMode === 'sandbox' || currentGameMode === 'casual';

    if (eatBtn) {
      if (isSpecialScreen || currentGameMode === 'turbo') eatBtn.style.display = 'none';
      else if (isSandboxOrCasual) eatBtn.style.display = isNoOrders ? 'flex' : 'none';
      else eatBtn.style.display = 'flex';
    }

    const hasOrderOrMode = currentActiveOrder !== null || currentSpeed !== 'no-orders';

    if (serveFloatingBtn) {
      if (isMobile) {
        serveFloatingBtn.style.display = '';
        positionServeButtonOnMobile();
      } else {
        serveFloatingBtn.classList.remove('hidden-serve-btn');
        serveFloatingBtn.style.display = (isSpecialScreen || currentScreen !== 'assembly' || !hasOrderOrMode) ? 'none' : 'flex';
      }
    }

    if (submitOrderBtn) submitOrderBtn.style.display = (!isMobile || isSpecialScreen || currentScreen !== 'assembly' || !hasOrderOrMode) ? 'none' : 'flex';
    if (forceOrderBtn) forceOrderBtn.style.display = (isSpecialScreen || currentGameMode === 'turbo') ? 'none' : 'flex';
    if (skipOrderBtn) skipOrderBtn.style.display = isSpecialScreen ? 'none' : 'flex';
    if (knifeBtn) knifeBtn.style.display = currentScreen === 'board' ? 'flex' : 'none';
    positionMusicToast();
  }

  const modeSandboxBtn = document.getElementById('modeSandboxBtn');
  const modeCasualBtn = document.getElementById('modeCasualBtn');
  const modeTurboBtn = document.getElementById('modeTurboBtn');
  const speedButtonsGrid = document.getElementById('speedButtonsGrid');

  function applyGameMode(mode) {
    const previousMode = currentGameMode;
    currentGameMode = mode;
    localStorage.setItem('burger_game_mode', mode);
    loadModeData();

    if(modeSandboxBtn) modeSandboxBtn.classList.toggle('active', mode === 'sandbox');
    if(modeCasualBtn) modeCasualBtn.classList.toggle('active', mode === 'casual');
    if(modeTurboBtn) modeTurboBtn.classList.toggle('active', mode === 'turbo');

    const topWidget = document.getElementById('topOrderWidget');
    const speed = getCurrentSpeed();

    if (previousMode !== mode && speed !== 'no-orders' && !currentActiveOrder) {
      if (speed === 'turbo') triggerRandomOrder();
      else {
        timeUntilNextOrder = getRandomTimeForSpeed(speed);
        localStorage.setItem(getModeKey('time_until_next_order'), timeUntilNextOrder);
      }
    }

    if (mode === 'sandbox' || mode === 'casual') {
      if(speedButtonsGrid) speedButtonsGrid.classList.remove('disabled');
      updateSpeedButtonsUI(speed);
      if (topWidget) topWidget.classList.toggle('hidden', speed === 'no-orders');
    } else if (mode === 'turbo') {
      if(speedButtonsGrid) speedButtonsGrid.classList.add('disabled');
      if(topWidget) topWidget.classList.remove('hidden');
      currentTurboTimeLeft = getTurboBaseDurationSeconds();
      if (!currentActiveOrder) triggerRandomOrder();
    }

    updateActionButtonsVisibility();
    updateMoneyDisplay();
    renderIngredientsMenu();
    updateBurgerDisplay(false);
    renderSauces();
    updateQuestsBadge();

    if (currentScreen === 'grill') { renderGrillIngredientsMenu(); renderGrillCookedInventory(); initGrillStructure(); renderGrill(); }
    else if (currentScreen === 'board') { renderBoardUncutMenu(); renderBoardSlicedInventory(); initBoardStructure(); renderBoard(); }
    else if (currentScreen === 'sink') { renderSinkUnwashedMenu(); renderSinkWashedInventory(); initSinkStructure(); renderSink(); }
  }

  if(modeSandboxBtn) modeSandboxBtn.onclick = () => applyGameMode('sandbox');
  if(modeCasualBtn) modeCasualBtn.onclick = () => applyGameMode('casual');
  if(modeTurboBtn) modeTurboBtn.onclick = () => applyGameMode('turbo');

  function updateSpeedButtonsUI(speed) {
    document.querySelectorAll('.speed-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.speed === speed);
    });
  }

  document.querySelectorAll('.speed-btn').forEach(btn => {
    btn.onclick = () => {
      if (currentGameMode === 'turbo') return;
      const newSpeed = btn.dataset.speed;
      modeSpeeds[currentGameMode] = newSpeed;
      localStorage.setItem('burger_mode_speeds', JSON.stringify(modeSpeeds));
      updateSpeedButtonsUI(newSpeed);

      const topWidget = document.getElementById('topOrderWidget');
      if (newSpeed === 'no-orders') {
        if (topWidget) topWidget.classList.add('hidden');
        currentActiveOrder = null;
        localStorage.removeItem(getModeKey('current_active_order'));
      } else {
        if (topWidget) topWidget.classList.remove('hidden');
        if (!currentActiveOrder) {
          if (newSpeed === 'turbo') triggerRandomOrder();
          else {
            timeUntilNextOrder = getRandomTimeForSpeed(newSpeed);
            localStorage.setItem(getModeKey('time_until_next_order'), timeUntilNextOrder);
          }
        }
      }
      updateActionButtonsVisibility();
    };
  });

  if (openSettingsBtn) openSettingsBtn.onclick = () => {
    playSound(SOUNDS.buttons);
    updateMusicPlayerUI();
    settingsModal.classList.add('open');
    document.body.classList.add('modal-open');
  };
  if (closeSettingsModal) closeSettingsModal.onclick = () => {
    playSound(SOUNDS.buttons);
    settingsModal.classList.remove('open');
    document.body.classList.remove('modal-open');
    positionMusicToast();
  };

  function getRandomTimeForSpeed(speed) {
    switch (speed) {
      case 'turbo': return 0;
      case 'super-fast': return Math.floor(Math.random() * (60 - 15 + 1)) + 15;
      case 'fast': return Math.floor(Math.random() * (300 - 60 + 1)) + 60;
      case 'medium': return Math.floor(Math.random() * (600 - 300 + 1)) + 300;
      case 'slow': return Math.floor(Math.random() * (900 - 600 + 1)) + 600;
      case 'super-slow': return Math.floor(Math.random() * (1800 - 900 + 1)) + 900;
      case 'no-orders': default: return -1;
    }
  }

  function formatTime(secs) {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function updateOrderWidgetsText(orderName, timerText = '') {
    const w1 = document.getElementById('orderStatusText');
    if (w1) {
      w1.innerHTML = `🔔 Order: <span>${orderName}</span>${timerText ? `<span class="order-timer-badge">⏱️ ${timerText}</span>` : ''}`;
    }
  }

  function updateOrderWidgetsTimerOnly(secs) {
    const w1 = document.getElementById('orderStatusText');
    if (w1) w1.innerHTML = `Next order in: ${formatTime(secs)}`;
  }

  setInterval(() => {
    const speed = getCurrentSpeed();

    if (currentGameMode === 'turbo') {
      if (currentActiveOrder) {
        updateOrderWidgetsText(currentActiveOrder.name, formatTime(currentTurboTimeLeft));
        if (currentTurboTimeLeft > 0) {
          currentTurboTimeLeft--;
        } else {
          const wasCritic = Boolean(currentActiveOrder && Array.isArray(currentActiveOrder.traits) && currentActiveOrder.traits.includes('critic'));
          currentTurboTimeLeft = getTurboBaseDurationSeconds();
          playSound(SOUNDS.wrongOrder);
          const activeOrderCost = currentActiveOrder && currentActiveOrder.ids ? currentActiveOrder.ids.reduce((sum, id) => sum + (ITEM_PRICES[id] || 1), 0) : 10;
          const penaltyFactor = Math.max(0.25, 1 - getCharmPenaltyDiscount());
          if (wasCritic) {
            const penalty = Math.round((getCriticBonusOrFineAmount(activeOrderCost) + activeOrderCost * 0.5) * penaltyFactor * 100) / 100;
            const affectedCount = getCriticAffectedOrdersCount();
            playerMoney -= penalty;
            updateMoneyDisplay(penalty, false);
            if (affectedCount > 0) {
              criticModifierState = { remainingOrders: affectedCount, effect: 'penalty' };
              saveCriticModifierState();
            }
            if (typeof resetCriticCooldownAfterResolution === 'function') {
              resetCriticCooldownAfterResolution();
            }
            updateCriticModifierBadge();
            showToast('Critic Ran Out of Time! 🧐', `Fine -$${penalty.toFixed(2)} & 50% off next ${affectedCount} orders.`, 'error');
          } else {
            const penalty = Math.round(activeOrderCost * penaltyFactor * 100) / 100;
            playerMoney -= penalty;
            updateMoneyDisplay(penalty, false);
            if (typeof onNormalOrderCompletedOrSkipped === 'function') {
              onNormalOrderCompletedOrSkipped();
            }
            showToast('You ran out of time!', `-$${penalty.toFixed(2)} penalty`, 'error');
          }
          currentActiveOrder = null;
          localStorage.removeItem(getModeKey('current_active_order'));
          triggerRandomOrder();
        }
      }
      return;
    }

    if (speed === 'no-orders') return;

    if (currentActiveOrder) {
      updateOrderWidgetsText(currentActiveOrder.name);
      return;
    }

    if (speed === 'turbo') {
      triggerRandomOrder();
      return;
    }

    if (timeUntilNextOrder > 0) {
      timeUntilNextOrder--;
      localStorage.setItem(getModeKey('time_until_next_order'), timeUntilNextOrder);
      updateOrderWidgetsTimerOnly(timeUntilNextOrder);
    } else {
      triggerRandomOrder();
    }
  }, 1000);

  if (forceOrderBtn) {
    forceOrderBtn.onclick = () => {
      playSound(SOUNDS.buttons);
      if (currentActiveOrder) {
        showToast('Finish or skip current order first!', '', 'warning');
        return;
      }

      if (getCurrentSpeed() === 'no-orders') {
        const topWidget = document.getElementById('topOrderWidget');
        if (topWidget) topWidget.classList.remove('hidden');
      }

      triggerRandomOrder();
    };
  }

  if (skipOrderBtn) {
    skipOrderBtn.onclick = () => {
      playSound(SOUNDS.buttons);
      if (getCurrentSpeed() === 'no-orders' && !currentActiveOrder) { showToast('No active order', '', 'warning'); return; }
      const activeOrderCost = currentActiveOrder && currentActiveOrder.ids ? currentActiveOrder.ids.reduce((sum, id) => sum + (ITEM_PRICES[id] || 1), 0) : 10;
      const isCriticOrder = Boolean(currentActiveOrder && Array.isArray(currentActiveOrder.traits) && currentActiveOrder.traits.includes('critic'));

      if (skipOrderClickCount === 0) {
        skipOrderClickCount = 1;
        showToast(isCriticOrder ? "Critic will fine you & apply 50% OFF! Click again to skip" : "You won't get reward. Click again to proceed", '', 'warning');
        clearTimeout(skipOrderTimeout);
        skipOrderTimeout = setTimeout(() => { skipOrderClickCount = 0; }, 5000);
      } else {
        skipOrderClickCount = 0;
        clearTimeout(skipOrderTimeout);
        if (typeof indecisiveDiceInterval !== 'undefined' && indecisiveDiceInterval) {
          clearInterval(indecisiveDiceInterval);
          indecisiveDiceInterval = null;
        }

        if (isCriticOrder) {
          playSound(SOUNDS.wrongOrder);
          const penaltyFactor = Math.max(0.25, 1 - getCharmPenaltyDiscount());
          const penalty = currentGameMode === 'sandbox'
            ? 0
            : Math.round((getCriticBonusOrFineAmount(activeOrderCost) + activeOrderCost * 0.5) * penaltyFactor * 100) / 100;
          const affectedCount = getCriticAffectedOrdersCount();
          if (currentGameMode !== 'sandbox') {
            playerMoney -= penalty;
            updateMoneyDisplay(penalty, false);
            if (affectedCount > 0) {
              criticModifierState = { remainingOrders: affectedCount, effect: 'penalty' };
              saveCriticModifierState();
            }
          }
          if (typeof resetCriticCooldownAfterResolution === 'function') {
            resetCriticCooldownAfterResolution();
          }
          updateCriticModifierBadge();
          showToast('Critic Disappointed! 🧐', currentGameMode === 'sandbox' ? 'Critic order skipped!' : `Fine -$${penalty.toFixed(2)} & 50% off next ${affectedCount} orders.`, 'error');

          if (currentGameMode === 'turbo') {
            triggerRandomOrder();
          } else {
            currentActiveOrder = null;
            localStorage.removeItem(getModeKey('current_active_order'));
            const speed = getCurrentSpeed();
            if (speed === 'turbo') triggerRandomOrder();
            else {
              timeUntilNextOrder = getRandomTimeForSpeed(speed);
              localStorage.setItem(getModeKey('time_until_next_order'), timeUntilNextOrder);
            }
            updateActionButtonsVisibility();
          }
        } else if (currentGameMode === 'turbo') {
          playSound(SOUNDS.wrongOrder);
          const penalty = Math.round(activeOrderCost * Math.max(0.25, 1 - getCharmPenaltyDiscount()) * 100) / 100;
          playerMoney -= penalty;
          updateMoneyDisplay(penalty, false);
          showToast(`Fined! -$${penalty.toFixed(2)}`, '', 'error');
          if (typeof onNormalOrderCompletedOrSkipped === 'function') {
            onNormalOrderCompletedOrSkipped();
          }
          currentTurboTimeLeft = getTurboBaseDurationSeconds();
          triggerRandomOrder();
        } else {
          showToast('Order Skipped', '', 'warning');
          if (typeof onNormalOrderCompletedOrSkipped === 'function') {
            onNormalOrderCompletedOrSkipped();
          }
          currentActiveOrder = null;
          localStorage.removeItem(getModeKey('current_active_order'));
          const speed = getCurrentSpeed();
          if (speed === 'turbo') triggerRandomOrder();
          else {
            timeUntilNextOrder = getRandomTimeForSpeed(speed);
            localStorage.setItem(getModeKey('time_until_next_order'), timeUntilNextOrder);
          }
          updateActionButtonsVisibility();
        }
      }
    };
  }

  function triggerRandomOrder() {
    const unlockedSecret = SECRET_ACHIEVEMENTS.filter(a => unlockedAchievements[a.id] && a.ids && a.ids.length > 0);
    const pool = [...REGULAR_RECIPES, ...unlockedSecret];
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    currentActiveOrder = { name: chosen.name || chosen.title, ids: chosen.ids };
    localStorage.setItem(getModeKey('current_active_order'), JSON.stringify(currentActiveOrder));

    const speed = getCurrentSpeed();
    if (speed !== 'no-orders' && speed !== 'turbo' && currentGameMode !== 'turbo') {
      timeUntilNextOrder = getRandomTimeForSpeed(speed);
      localStorage.setItem(getModeKey('time_until_next_order'), timeUntilNextOrder);
    }

    playSound(SOUNDS.order);
    updateActionButtonsVisibility();
  }

  function getBurgerCost(burgerArr) {
    return burgerArr.reduce((sum, item) => sum + (ITEM_PRICES[item.id] || 1), 0);
  }

  function calculatePoisonChance(burgerArr) {
    let chance = 0;
    burgerArr.forEach(layer => {
      if (layer.isDirty) chance += 0.25;
      if (layer.isRaw) {
        const rawKey = layer.rawId || ASSEMBLY_RAW_FALLBACK[layer.id];
        if (rawKey && RAW_ITEM_POISON_CHANCE[rawKey]) {
          chance += RAW_ITEM_POISON_CHANCE[rawKey];
        }
      }
    });
    return Math.min(0.85, chance);
  }

  function hasRawCookedMismatch(burgerArr) {
    return burgerArr.some(layer => {
      if (RAW_TO_COOKED_RECIPE_ITEM[layer.id]) return true;
      return Boolean(layer.isRaw && (layer.rawId || ASSEMBLY_RAW_FALLBACK[layer.id]));
    });
  }

  function areIngredientsSetEqual(arrA, arrB) {
    if (arrA.length !== arrB.length) return false;
    const sortedA = [...arrA].sort();
    const sortedB = [...arrB].sort();
    return sortedA.every((val, idx) => val === sortedB[idx]);
  }

  function getCharmPenaltyDiscount() {
    return [0, 0.2, 0.4, 0.6][getCharmLevel()] || 0;
  }

  function checkOrderSubmission() {
    if (!currentActiveOrder) return;

    const currentIds = currentBurger.map(i => i.id);
    const normalizedIds = currentBurger.map(i => normalizeIngredientIdForOrder(i.id));
    const targetIds = currentActiveOrder.ids;
    const isExactMatch = currentIds.length === targetIds.length && currentIds.every((val, idx) => val === targetIds[idx]);
    const isNormalizedSequenceMatch = !isExactMatch && normalizedIds.length === targetIds.length && normalizedIds.every((val, idx) => val === targetIds[idx]);
    const isCharmMixedOrderMatch = !isExactMatch && !isNormalizedSequenceMatch && getCharmLevel() >= 1 && areIngredientsSetEqual(normalizedIds, targetIds);
    const isSuccessMatch = isExactMatch || isNormalizedSequenceMatch || isCharmMixedOrderMatch;

    const poisonChance = calculatePoisonChance(currentBurger);
    const charmLv = getCharmLevel();
    const charmPoisonReduction = charmLv >= 3 ? 0.5 : (charmLv >= 2 ? 0.25 : 0);
    const effectivePoisonChance = Math.max(0, poisonChance * (1 - charmPoisonReduction));
    const isPoisoned = currentGameMode !== 'sandbox' && effectivePoisonChance > 0 && Math.random() < effectivePoisonChance;
    const cost = getBurgerCost(currentBurger);
    const penaltyFactor = Math.max(0.25, 1 - getCharmPenaltyDiscount());

    if (isSuccessMatch && !isPoisoned) {
      playSound(SOUNDS.complete);
      trackQuestProgress('make_burgers', 1);

      if (currentGameMode !== 'sandbox') {
        const multiplier = getOrderMultiplier();
        let reward = Math.round(cost * multiplier * 100) / 100;
        if (lastOrderReducedReward) {
          reward = Math.round(reward * (2 / 3) * 100) / 100;
          lastOrderReducedReward = false;
        }
        if (isNormalizedSequenceMatch) {
          reward = Math.round(reward * getPartialMatchRewardFactor() * 100) / 100;
        } else if (isCharmMixedOrderMatch) {
          const charmOrderFactor = charmLv >= 3 ? 1.0 : (charmLv === 2 ? 0.92 : 0.85);
          reward = Math.round(reward * charmOrderFactor * 100) / 100;
        }
        playerMoney += reward;
        updateMoneyDisplay(reward, true);
        trackQuestProgress('earn_money', reward);
      }

      if (isNormalizedSequenceMatch) {
        showToast('Order Accepted (Unprepared Items)', `${currentActiveOrder.name} served with reduced payout.`, 'warning');
      } else if (isCharmMixedOrderMatch) {
        showToast('Charm Saved You! ✨', `${currentActiveOrder.name} accepted despite mixed layer order!`, 'success');
      } else {
        showToast('Order Complete!', `${currentActiveOrder.name} served successfully!`, 'success');
      }

      if (currentGameMode === 'turbo') {
        triggerRandomOrder();
      } else {
        currentActiveOrder = null;
        localStorage.removeItem(getModeKey('current_active_order'));
      }

      updateActionButtonsVisibility();
      isEating = true;
      isSqueezed = false;
      if (burgerStack) burgerStack.classList.add('eating');
      setTimeout(() => {
        currentBurger = [];
        if (burgerStack) burgerStack.classList.remove('eating');
        isEating = false;
        updateBurgerDisplay(false);
      }, 2000);
    } else {
      playSound(SOUNDS.wrongOrder);
      if (currentGameMode !== 'sandbox') {
        if (isPoisoned) {
          const poisonPenalty = Math.round(cost * getPoisonPenaltyMultiplier() * penaltyFactor * 100) / 100;
          playerMoney -= poisonPenalty;
          updateMoneyDisplay(poisonPenalty, false);
          showToast('Food Poisoning! 🤢', `Client got sick from dirty or raw food! Penalty: -$${poisonPenalty.toFixed(2)}`, 'error');
        } else {
          const penalty = Math.round((cost / 2) * penaltyFactor * 100) / 100;
          playerMoney -= penalty;
          updateMoneyDisplay(penalty, false);
          showToast('Wrong Order!', `Client refused! -$${penalty.toFixed(2)} penalty`, 'error');
        }
      } else {
        showToast('Wrong Order!', 'Client refused the burger!', 'error');
      }
    }
  }

  let activeShopTab = 'all';
  let shopQuantities = {};

  function updateShopBuyAllButton() {
    const buyAllBtn = document.getElementById('shopBuyAllBtn');
    if (!buyAllBtn) return;

    if (activeShopTab === 'upgrades') {
      buyAllBtn.disabled = true;
      buyAllBtn.style.opacity = '0.3';
      buyAllBtn.style.cursor = 'not-allowed';
      buyAllBtn.innerText = 'Buy All ($0.00)';
      return;
    }

    let totalCost = 0;
    let totalItems = 0;

    SHOP_ITEMS.forEach(item => {
      const qty = parseInt(shopQuantities[item.id]) || 0;
      if (qty > 0) {
        totalCost += (ITEM_PRICES[item.id] || 1) * qty;
        totalItems += qty;
      }
    });

    if (currentGameMode === 'sandbox') {
      buyAllBtn.innerText = totalItems > 0 ? `Buy All (${totalItems})` : 'Buy All ($0.00)';
    } else {
      buyAllBtn.innerText = `Buy All ($${totalCost.toFixed(2)})`;
    }

    if (totalItems > 0) {
      buyAllBtn.disabled = false;
      buyAllBtn.style.opacity = '1';
      buyAllBtn.style.cursor = 'pointer';
    } else {
      buyAllBtn.disabled = true;
      buyAllBtn.style.opacity = '0.3';
      buyAllBtn.style.cursor = 'not-allowed';
    }
  }

  window.buyAllSelectedShopItems = function() {
    if (activeShopTab === 'upgrades') return;
    let totalCost = 0;
    let totalItems = 0;
    const itemsToBuy = [];

    SHOP_ITEMS.forEach(item => {
      const qty = parseInt(shopQuantities[item.id]) || 0;
      if (qty > 0) {
        totalCost += (ITEM_PRICES[item.id] || 1) * qty;
        totalItems += qty;
        itemsToBuy.push({ item, qty });
      }
    });

    if (totalItems === 0) return;

    if (currentGameMode !== 'sandbox' && playerMoney < totalCost) {
      playSound(SOUNDS.wrongOrder);
      showToast('Not enough money!', `Need $${totalCost.toFixed(2)}`, 'error');
      return;
    }

    if (currentGameMode !== 'sandbox') {
      playerMoney -= totalCost;
      updateMoneyDisplay(totalCost, false);
    }

    itemsToBuy.forEach(entry => {
      ingredientStock[entry.item.id] = (ingredientStock[entry.item.id] ?? 0) + entry.qty;
      shopQuantities[entry.item.id] = 0;
    });

    saveStock();
    playSound(SOUNDS.buy);
    trackQuestProgress('buy_items', totalItems);

    if (currentGameMode === 'sandbox') {
      showToast('Obtained!', `Added ${totalItems} items to inventory`);
    } else {
      showToast('Purchased!', `Bought ${totalItems} items for $${totalCost.toFixed(2)}`);
    }

    updateShopBuyAllButton();
    renderShopModal();

    if (currentScreen === 'assembly') renderIngredientsMenu();
    else if (currentScreen === 'grill') { renderGrillIngredientsMenu(); renderGrillCookedInventory(); }
    else if (currentScreen === 'board') { renderBoardUncutMenu(); renderBoardSlicedInventory(); }
    else if (currentScreen === 'sink') { renderSinkUnwashedMenu(); renderSinkWashedInventory(); }
    renderSauces();
  };

  window.switchShopTab = function(tab) {
    activeShopTab = tab;
    normalizeSingleUpgradesTabInContainer('#shopTabs', 'switchShopTab', () => activeShopTab);
    updateShopBuyAllButton();
    renderShopModal();
  }

  function ensureShopUpgradesTabButton() {
    normalizeSingleUpgradesTabInContainer('#shopTabs', 'switchShopTab', () => activeShopTab);
  }

  function updateShopBalanceHeader() {
    const headerTitle = shopModal ? shopModal.querySelector('.modal-header h3') : null;
    if (!headerTitle) return;
    let balanceSpan = headerTitle.querySelector('.shop-balance-badge');
    if (!balanceSpan) {
      balanceSpan = document.createElement('span');
      balanceSpan.className = 'shop-balance-badge';
      headerTitle.appendChild(balanceSpan);
    }

    balanceSpan.className = 'shop-balance-badge';
    if (currentGameMode === 'sandbox') {
      balanceSpan.innerText = '$∞';
      balanceSpan.classList.add('positive');
    } else {
      balanceSpan.innerText = `$${playerMoney.toFixed(2)}`;
      if (playerMoney > 0) balanceSpan.classList.add('positive');
      else if (playerMoney === 0) balanceSpan.classList.add('zero');
      else balanceSpan.classList.add('negative');
    }
  }

  window.buyUpgrade = function(upgradeId) {
    const cfg = UPGRADES_CONFIG[upgradeId];
    if (!cfg) return;
    const currentLv = getUpgradeLevel(upgradeId);
    if (currentLv >= cfg.maxLevel) return;

    const nextLv = currentLv + 1;
    const price = cfg.prices[nextLv] ?? 0;

    if (currentGameMode !== 'sandbox' && playerMoney < price) {
      playSound(SOUNDS.wrongOrder);
      showToast('Not enough money!', `Need $${price.toFixed(2)}`, 'error');
      return;
    }

    if (currentGameMode !== 'sandbox') {
      playerMoney -= price;
      updateMoneyDisplay(price, false);
    }

    upgradesLevels[upgradeId] = nextLv;
    saveUpgradesState();

    if (upgradeId === 'extra_slots') {
      syncStationSlotArraysToTargetCount();
      saveGrillState();
      saveBoardState();
      saveSinkState();
      if (currentScreen === 'grill') { initGrillStructure(); renderGrill(); }
      else if (currentScreen === 'board') { initBoardStructure(); renderBoard(); }
      else if (currentScreen === 'sink') { initSinkStructure(); renderSink(); }
    } else if (upgradeId === 'speed_up' && nextLv >= 3) {
      updateGrillLogic();
      updateBoardLogic();
      updateSinkLogic();
      if (currentScreen === 'grill') renderGrill();
      else if (currentScreen === 'board') renderBoard();
      else if (currentScreen === 'sink') renderSink();
    } else if (upgradeId === 'slow_burn' && nextLv >= 3) {
      if (currentScreen === 'grill') renderGrill();
    }

    playSound(SOUNDS.buy);
    showToast('Upgrade Purchased!', `${cfg.name} → Lv.${nextLv}`, 'success');
    renderShopModal();
  };

  function renderShopModal() {
    const body = document.getElementById('shopModalBody');
    if (!body) return;
    updateShopBalanceHeader();
    ensureShopUpgradesTabButton();

    let searchInput = document.getElementById('shopSearchInput');
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';

    if (!searchInput) {
      const tabsContainer = document.getElementById('shopTabs');
      if (tabsContainer) {
        searchInput = document.createElement('input');
        searchInput.id = 'shopSearchInput';
        searchInput.className = 'modal-search-input';
        searchInput.placeholder = 'Search shop...';
        searchInput.oninput = () => renderShopModal();
        tabsContainer.parentNode.insertBefore(searchInput, tabsContainer.nextSibling);
      }
    }

    let cardsHtml = '';
    if (activeShopTab === 'upgrades') {
      const list = Object.values(UPGRADES_CONFIG).filter(u => u.name.toLowerCase().includes(searchTerm));
      list.forEach(upg => {
        const lv = getUpgradeLevel(upg.id);
        const isMax = lv >= upg.maxLevel;
        const sublineHtml = formatUpgradeSubline(upg, lv);
        const actionBtnHtml = isMax
          ? `<div class="upgrade-max-box">MAX</div>`
          : `<button class="upgrade-action-btn" onclick="buyUpgrade('${upg.id}')">Buy</button>`;

        cardsHtml += `
          <div class="shop-item-card">
            <div class="shop-item-info">
              <div class="upgrade-emoji-icon">${upg.icon}</div>
              <div class="shop-item-details">
                <h4>${upg.name} ${renderUpgradeDots(lv, upg.maxLevel)}</h4>
                ${sublineHtml}
              </div>
            </div>
            <div class="shop-buy-group">
              ${actionBtnHtml}
            </div>
          </div>
        `;
      });
    } else {
      const filtered = SHOP_ITEMS.filter(item => {
        const matchesTab = activeShopTab === 'all' || item.category === activeShopTab;
        const matchesSearch = item.name.toLowerCase().includes(searchTerm);
        return matchesTab && matchesSearch;
      });

      filtered.forEach(item => {
        const unitPrice = ITEM_PRICES[item.id] || 1;
        const currentQty = shopQuantities[item.id] || 0;
        const totalPrice = (unitPrice * currentQty).toFixed(2);
        const priceText = currentGameMode === 'sandbox' ? 'Free' : `$${unitPrice.toFixed(2)} / unit`;
        const totalText = currentGameMode === 'sandbox' ? 'Free' : `$${totalPrice}`;

        cardsHtml += `
          <div class="shop-item-card">
            <div class="shop-item-info">
              <img src="${item.image}" alt="${item.name}">
              <div class="shop-item-details">
                <h4>${item.name}</h4>
                <p>${priceText}</p>
              </div>
            </div>
            <div class="shop-buy-group">
              <div class="shop-total-price" id="total-price-${item.id}">${totalText}</div>
              <button class="shop-qty-btn" onclick="changeShopQty('${item.id}', -1)">-</button>
              <input type="number" id="qty-${item.id}" class="shop-qty-input" value="${currentQty}" min="0" max="99" onchange="onShopQtyInput('${item.id}')" oninput="onShopQtyInput('${item.id}')">
              <button class="shop-qty-btn" onclick="changeShopQty('${item.id}', 1)">+</button>
              <button class="btn-buy" onclick="buyShopItem('${item.id}')">Buy</button>
            </div>
          </div>
        `;
      });
    }

    let listContainer = body.querySelector('.shop-list-container');
    if (!listContainer) {
      listContainer = document.createElement('div');
      listContainer.className = 'shop-list-container';
      listContainer.style.cssText = 'display:flex; flex-direction:column; gap:8px; min-height: 280px;';
      body.appendChild(listContainer);
    }
    listContainer.innerHTML = cardsHtml;
    updateShopBuyAllButton();
  }

  window.onShopQtyInput = function(id) {
    const qtyInput = document.getElementById(`qty-${id}`);
    const totalEl = document.getElementById(`total-price-${id}`);
    if (!qtyInput) return;
    let val = parseInt(qtyInput.value);
    if (isNaN(val) || val < 0) val = 0;
    if (val > 99) val = 99;
    shopQuantities[id] = val;

    if (totalEl) {
      if (currentGameMode === 'sandbox') totalEl.innerText = 'Free';
      else {
        const unitPrice = ITEM_PRICES[id] || 1;
        totalEl.innerText = `$${(unitPrice * val).toFixed(2)}`;
      }
    }
    updateShopBuyAllButton();
  }

  window.changeShopQty = function(id, delta) {
    const qtyInput = document.getElementById(`qty-${id}`);
    if (!qtyInput) return;
    let current = parseInt(qtyInput.value) || 0;
    let next = current + delta;
    if (next < 0) next = 0;
    if (next > 99) next = 99;
    qtyInput.value = next;
    onShopQtyInput(id);
  }

  window.buyShopItem = function(id) {
    const qtyInput = document.getElementById(`qty-${id}`);
    let qty = parseInt(qtyInput ? qtyInput.value : 1);
    if (isNaN(qty) || qty <= 0) qty = 1;

    const item = SHOP_ITEMS.find(i => i.id === id);
    if (!item) return;

    const cost = (ITEM_PRICES[id] || 1) * qty;
    if (currentGameMode !== 'sandbox' && playerMoney < cost) {
      playSound(SOUNDS.wrongOrder);
      showToast('Not enough money!', `Need $${cost.toFixed(2)}`, 'error');
      return;
    }

    if (currentGameMode !== 'sandbox') { playerMoney -= cost; updateMoneyDisplay(cost, false); }
    ingredientStock[id] = (ingredientStock[id] ?? 0) + qty;
    saveStock();
    shopQuantities[id] = 0;

    playSound(SOUNDS.buy);
    trackQuestProgress('buy_items', qty);

    showToast('Purchased!', `Bought ${qty}x ${item.name} ${currentGameMode === 'sandbox' ? '' : `for $${cost.toFixed(2)}`}`);

    updateShopBuyAllButton();
    renderShopModal();

    if (currentScreen === 'assembly') renderIngredientsMenu();
    else if (currentScreen === 'grill') { renderGrillIngredientsMenu(); renderGrillCookedInventory(); }
    else if (currentScreen === 'board') { renderBoardUncutMenu(); renderBoardSlicedInventory(); }
    else if (currentScreen === 'sink') { renderSinkUnwashedMenu(); renderSinkWashedInventory(); }
    renderSauces();
  };

  if (openShopBtn) {
    openShopBtn.onclick = () => {
      playSound(SOUNDS.buttons);
      ensureShopUpgradesTabButton();
      updateShopBalanceHeader();
      renderShopModal();
      shopModal.classList.add('open');
      document.body.classList.add('modal-open');
    };
  }
  if (closeShopModal) closeShopModal.onclick = () => { playSound(SOUNDS.buttons); shopModal.classList.remove('open'); document.body.classList.remove('modal-open'); };

  const REGULAR_RECIPES = [
    { name: 'Classic Cheeseburger', ids: ['bottom-bun', 'beef-patty', 'cheese', 'pickles', 'white-onion', 'ketchup', 'mustard', 'top-bun'] },
    { name: 'Double Cheeseburger', ids: ['bottom-bun', 'beef-patty', 'cheese', 'beef-patty', 'cheese', 'pickles', 'white-onion', 'ketchup', 'mustard', 'top-bun'] },
    { name: 'Classic Chickenburger', ids: ['bottom-bun', 'chicken-patty', 'lettuce', 'mayo', 'top-bun'] },
    { name: 'Classic Fishburger', ids: ['bottom-bun', 'fish-patty', 'cheese', 'mayo', 'top-bun'] },
    { name: 'Big Burger', ids: ['bottom-bun', 'spicy', 'lettuce', 'white-onion', 'beef-patty', 'cheese', 'bottom-bun', 'spicy', 'lettuce', 'pickles', 'beef-patty', 'top-bun'] },
    { name: 'Chef Burger', ids: ['bottom-bun', 'beef-patty', 'cheese', 'champignons', 'fried-bacon', 'bbq', 'top-bun'] },
    { name: 'Breakfast Burger', ids: ['bottom-bun', 'mayo', 'fried-egg', 'cheese', 'hashbrown', 'fried-bacon', 'ketchup', 'top-bun'] },
    { name: 'Cheese Bacon Burger', ids: ['bottom-bun', 'beef-patty', 'cheese', 'fried-bacon', 'mustard', 'ketchup', 'pickles', 'top-bun'] },
    { name: 'BBQ Chicken Burger', ids: ['bottom-bun', 'bbq', 'lettuce', 'chicken-patty', 'cheese', 'fried-bacon', 'red-onion', 'bbq', 'top-bun'] },
    { name: 'Spicy Crunch Burger', ids: ['bottom-bun', 'spicy', 'lettuce', 'tomato', 'chicken-patty', 'hashbrown', 'cheese', 'spicy', 'top-bun'] },
    { name: 'Mushroom Swiss Burger', ids: ['bottom-bun', 'mayo', 'beef-patty', 'champignons', 'cheese', 'white-onion', 'top-bun'] },
    { name: 'Ocean Deluxe Burger', ids: ['bottom-bun', 'mayo', 'lettuce', 'tomato', 'fish-patty', 'cheese', 'pickles', 'top-bun'] },
    { name: 'Triple Meat Monster', ids: ['bottom-bun', 'bbq', 'beef-patty', 'cheese', 'chicken-patty', 'fried-bacon', 'beef-patty', 'cheese', 'mustard', 'top-bun'] },
    { name: 'Veggie Hash Burger', ids: ['bottom-bun', 'mayo', 'lettuce', 'tomato', 'hashbrown', 'cheese', 'red-onion', 'pickles', 'ketchup', 'top-bun'] },
    { name: 'Sunrise Deluxe Burger', ids: ['bottom-bun', 'mayo', 'hashbrown', 'beef-patty', 'cheese', 'fried-egg', 'fried-bacon', 'ketchup', 'top-bun'] },
    { name: 'Double Fish Burger', ids: ['bottom-bun', 'mayo', 'fish-patty', 'cheese', 'fish-patty', 'pickles', 'lettuce', 'top-bun'] },
    { name: 'Smoky Onion Burger', ids: ['bottom-bun', 'bbq', 'beef-patty', 'fried-bacon', 'white-onion', 'red-onion', 'cheese', 'top-bun'] }
  ];

  const SECRET_ACHIEVEMENTS = [
    { id: 'cheeseburger', title: 'Cheeseburger?!', desc: 'Just a slice of cheese.', ids: ['cheese'], audio: SOUNDS.cheeseburger },
    { id: 'tomatonator', title: 'The Tomatonator', desc: 'A tower of 10 juicy tomato slices.', ids: Array(10).fill('tomato'), audio: SOUNDS.tomatonator },
    { id: 'lilypad', title: 'Lilypad', desc: 'A single crisp leaf of lettuce.', ids: ['lettuce'], audio: SOUNDS.lilypad },
    { id: 'saturnBurger', title: 'The Saturn Burger', desc: 'A ring of red onion between top and bottom buns.', ids: ['bottom-bun', 'red-onion', 'top-bun'], audio: SOUNDS.saturnBurger },
    { id: 'bustanator', title: 'The Bustanator', desc: 'Bottom bun, mayo, mayo, mayo, top bun.', ids: ['bottom-bun', 'mayo', 'mayo', 'mayo', 'top-bun'], audio: SOUNDS.bustanator },
    { id: 'mcPicklePounder', title: 'The McPickle Pounder', desc: 'Buns, ketchup, and six pickles.', ids: ['bottom-bun', 'ketchup', 'pickles', 'pickles', 'pickles', 'pickles', 'pickles', 'pickles', 'top-bun'], audio: SOUNDS.mcPicklePounder }
  ];

  let activeRecipeTab = 'regular';
  const ALL_ITEMS_MAP = {};
  INGREDIENTS.forEach(i => ALL_ITEMS_MAP[i.id] = i);
  SAUCES.forEach(s => ALL_ITEMS_MAP[s.id] = s);

  function renderRecipesModal() {
    const body = document.getElementById('recipesModalBody');
    if (!body) return;
    body.innerHTML = '';

    const searchInput = document.createElement('input');
    searchInput.id = 'recipesSearchInput';
    searchInput.className = 'modal-search-input';
    searchInput.placeholder = 'Search recipes...';
    searchInput.oninput = () => filterRecipesList();
    body.appendChild(searchInput);

    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'recipe-tabs';
    tabsContainer.id = 'recipesModalTabs';
    tabsContainer.innerHTML = `
      <div class="recipe-tab ${activeRecipeTab === 'regular' ? 'active' : ''}" onclick="switchRecipeTab('regular')">Regular Recipes</div>
      <div class="recipe-tab ${activeRecipeTab === 'secret' ? 'active' : ''}" onclick="switchRecipeTab('secret')">Secret Recipes</div>
    `;
    body.appendChild(tabsContainer);
    setupWheelScrollForContainer(tabsContainer);

    const listContainer = document.createElement('div');
    listContainer.id = 'recipesListContainer';
    listContainer.style.cssText = 'display:flex; flex-direction:column; gap:8px; overflow-y:auto; flex:1; min-height: 280px;';
    body.appendChild(listContainer);

    filterRecipesList();
  }

  function filterRecipesList() {
    const listContainer = document.getElementById('recipesListContainer');
    const searchInput = document.getElementById('recipesSearchInput');
    if (!listContainer) return;
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';

    listContainer.innerHTML = '';
    const list = activeRecipeTab === 'regular' ? REGULAR_RECIPES : SECRET_ACHIEVEMENTS;

    list.forEach(item => {
      const isSecret = activeRecipeTab === 'secret';
      const isUnlocked = !isSecret || unlockedAchievements[item.id];
      const title = item.name || item.title;
      if (isUnlocked && !title.toLowerCase().includes(searchTerm)) return;
      if (!isUnlocked && searchTerm !== '' && !'???'.includes(searchTerm)) return;

      const isPinned = pinnedBurger && pinnedBurger.name === title;
      const card = document.createElement('div');
      card.className = `recipe-card ${!isUnlocked ? 'locked' : ''}`;

      let visualHtml = '';
      if (isUnlocked) {
        item.ids.forEach(id => {
          const itemObj = ALL_ITEMS_MAP[id];
          if (itemObj) visualHtml += `<img src="${itemObj.image}" title="${itemObj.name}">`;
        });
      } else {
        visualHtml = `<span style="font-size: 0.75rem; opacity: 0.7;">Unlock achievement to reveal</span>`;
      }

      card.innerHTML = `
        <div class="recipe-info">
          <h4>${isUnlocked ? title : '???'}</h4>
          <div class="recipe-visual">${visualHtml}</div>
        </div>
        ${isUnlocked ? `<button class="btn-pin ${isPinned ? 'pinned' : ''}" onclick="togglePinRecipe('${title.replace(/'/g, "\'")}')">📌</button>` : ''}
      `;
      listContainer.appendChild(card);
    });
  }

  window.switchRecipeTab = function(tab) {
    activeRecipeTab = tab;
    renderRecipesModal();
  }

  window.togglePinRecipe = function(name) {
    if (pinnedBurger && pinnedBurger.name === name) pinnedBurger = null;
    else {
      const found = [...REGULAR_RECIPES, ...SECRET_ACHIEVEMENTS].find(r => (r.name || r.title) === name);
      if (found) pinnedBurger = { name: found.name || found.title, ids: found.ids };
    }
    localStorage.setItem('pinned_burger', JSON.stringify(pinnedBurger));
    renderPinnedWidget();
    filterRecipesList();
  }

  function renderPinnedWidget() {
    const widget = document.getElementById('pinnedRecipeWidget');
    const container = document.getElementById('pinnedIngredientsContainer');
    const titleEl = document.getElementById('pinnedRecipeTitleText');
    if (!widget || !container) return;

    if (!pinnedBurger) {
      widget.classList.remove('active');
      if (titleEl) {
        titleEl.innerText = '';
        titleEl.classList.remove('show-title');
      }
      updateMoneyPopupPosition();
      return;
    }

    if (titleEl) {
      titleEl.innerText = pinnedBurger.name;
      titleEl.classList.remove('show-title');
    }

    container.innerHTML = '';
    pinnedBurger.ids.forEach(id => {
      const itemObj = ALL_ITEMS_MAP[id];
      if (itemObj) {
        const img = document.createElement('img');
        img.src = itemObj.image;
        container.appendChild(img);
      }
    });
    widget.classList.add('active');
    updateMoneyPopupPosition();
  }

  const pinnedWidgetEl = document.getElementById('pinnedRecipeWidget');
  const pinnedTitleEl = document.getElementById('pinnedRecipeTitleText');
  if (pinnedWidgetEl && pinnedTitleEl) {
    let titleTimeout;
    pinnedWidgetEl.addEventListener('click', (e) => {
      if (e.target.closest('.unpin-btn')) return;
      pinnedTitleEl.classList.toggle('show-title');
      clearTimeout(titleTimeout);
      if (pinnedTitleEl.classList.contains('show-title')) {
        titleTimeout = setTimeout(() => {
          pinnedTitleEl.classList.remove('show-title');
        }, 3000);
      }
    });
  }

  const unpinBtn = document.getElementById('unpinBtn');
  if (unpinBtn) unpinBtn.onclick = () => {
    pinnedBurger = null;
    localStorage.removeItem('pinned_burger');
    renderPinnedWidget();
  };

  if (openRecipesBtn) openRecipesBtn.onclick = () => { playSound(SOUNDS.buttons); renderRecipesModal(); recipesModal.classList.add('open'); document.body.classList.add('modal-open'); };
  if (closeRecipesModal) closeRecipesModal.onclick = () => { playSound(SOUNDS.buttons); recipesModal.classList.remove('open'); document.body.classList.remove('modal-open'); };

  function updateAchievementsBadge() {
    const badge = document.getElementById('achievementsBadge');
    if (!badge) return;
    const hasNew = localStorage.getItem('has_new_achievement') === 'true';
    badge.style.display = hasNew ? 'block' : 'none';
  }

  function renderAchievementsModal() {
    const list = document.getElementById('achievementsList');
    if (!list) return;
    list.innerHTML = '';
    SECRET_ACHIEVEMENTS.forEach(ach => {
      const isUnlocked = unlockedAchievements[ach.id];
      const div = document.createElement('div');
      div.className = `achievement-item ${isUnlocked ? 'unlocked' : ''}`;
      div.innerHTML = `
        <div style="font-size: 1.4rem;">${isUnlocked ? '🏆' : '🔒'}</div>
        <div style="flex: 1; margin-left: 10px;">
          <h4 style="font-size: 0.85rem; margin-bottom: 2px;">${isUnlocked ? ach.title : 'Secret Burger'}</h4>
          <p style="font-size: 0.75rem; opacity: 0.7;">${isUnlocked ? ach.desc : 'Discover this recipe by eating it!'}</p>
        </div>
      `;
      list.appendChild(div);
    });
  }

  if (openAchievementsBtn) openAchievementsBtn.onclick = () => {
    playSound(SOUNDS.buttons);
    localStorage.setItem('has_new_achievement', 'false');
    updateAchievementsBadge();
    renderAchievementsModal();
    achievementsModal.classList.add('open');
    document.body.classList.add('modal-open');
  };
  if (closeAchievementsModal) closeAchievementsModal.onclick = () => { playSound(SOUNDS.buttons); achievementsModal.classList.remove('open'); document.body.classList.remove('modal-open'); };

  function checkSecretRecipes() {
    if (currentBurger.length === 0) return;
    const currentIds = currentBurger.map(item => item.id);
    SECRET_ACHIEVEMENTS.forEach(ach => {
      if (currentIds.length === ach.ids.length && currentIds.every((val, idx) => val === ach.ids[idx])) {
        if (!unlockedAchievements[ach.id]) {
          unlockedAchievements[ach.id] = true;
          localStorage.setItem('unlocked_achievements', JSON.stringify(unlockedAchievements));
          localStorage.setItem('has_new_achievement', 'true');
          updateAchievementsBadge();
          playSound(SOUNDS.achievement);
          showToast(`🏆 Achievement Unlocked!`, ach.title);
        }
        if (ach.audio) setTimeout(() => playSound(ach.audio), 300);
      }
    });
  }

  function showLimitWarning() {
    if (!limitWarning) return;
    limitWarning.classList.add('show');
    setTimeout(() => limitWarning.classList.remove('show'), 2000);
  }

  function addIngredient(item) {
    if (currentBurger.length >= MAX_INGREDIENTS || isEating || isAddingInProgress) {
      if (currentBurger.length >= MAX_INGREDIENTS) showLimitWarning();
      return;
    }

    const consumed = consumeAssemblyIngredient(item.id);
    if (!consumed) return;

    isAddingInProgress = true;
    setTimeout(() => { isAddingInProgress = false; }, 120);

    playSound(SOUNDS.ingridients);
    const layerImage = resolveLayerDisplayImage(item.id, item.image, consumed.isRaw, consumed.rawId);
    currentBurger.push({
      ...item,
      image: layerImage,
      uid: Date.now() + Math.random(),
      isDirty: consumed.isDirty,
      isRaw: consumed.isRaw,
      rawId: consumed.rawId,
      stockKey: consumed.stockKey
    });
    updateBurgerDisplay(true);
    renderIngredientsMenu();
  }

  function addSauce(sauce) {
    if (currentBurger.length >= MAX_INGREDIENTS || isEating || isAddingInProgress) {
      if (currentBurger.length >= MAX_INGREDIENTS) showLimitWarning();
      return;
    }

    if (currentGameMode !== 'sandbox') {
      const stock = ingredientStock[sauce.id] ?? 0;
      if (stock <= 0) return;
      ingredientStock[sauce.id] = stock - 1;
      saveStock();
    }

    isAddingInProgress = true;
    setTimeout(() => { isAddingInProgress = false; }, 120);

    playSound(SOUNDS.sauce);
    currentBurger.push({ id: sauce.id, name: sauce.name, image: sauce.image, isSauce: true, uid: Date.now() + Math.random(), isDirty: false });
    updateBurgerDisplay(true);
    renderSauces();
  }

  function updateBurgerDisplay(animateLast = false) {
    saveBurgerState();
    const layersTitle = document.getElementById('layersTitle');
    if (layersTitle) layersTitle.innerText = `Layers (${currentBurger.length}/${MAX_INGREDIENTS})`;
    if (!burgerStack || !layersList) return;

    burgerStack.innerHTML = '';
    layersList.innerHTML = '';
    layersList.classList.add('assembly-mode');

    currentBurger.forEach((layer, index) => {
      const img = document.createElement('img');
      const displayImage = resolveLayerDisplayImage(layer.id, layer.image, layer.isRaw, layer.rawId);
      const isRawCheeseLayer = layer.id === 'raw-cheese' || (layer.isRaw && (layer.rawId === 'raw-cheese' || layer.id === 'cheese'));
      img.src = displayImage;
      img.className = 'burger-layer-img';
      if (layer.isDirty) img.classList.add('unwashed-filter');
      if (isRawCheeseLayer) img.classList.add('raw-cheese-layer');
      if (animateLast && index === currentBurger.length - 1) img.classList.add('new-layer');
      if (isSqueezed) {
        img.classList.add('squeezed');
        img.style.setProperty('--sq-offset', `${index * 6}px`);
      }
      img.style.zIndex = index + 1;
      burgerStack.appendChild(img);

      const itemEl = document.createElement('div');
      itemEl.className = 'layer-item';
      itemEl.innerHTML = `
        <img src="${displayImage}" class="layer-preview ${layer.isDirty ? 'unwashed-filter' : ''}">
        <div class="layer-controls">
          <button class="btn-control" onclick="moveLayer(${index}, 1)" ${index === currentBurger.length - 1 ? 'disabled' : ''}>▲</button>
          <button class="btn-control" onclick="moveLayer(${index}, -1)" ${index === 0 ? 'disabled' : ''}>▼</button>
          <button class="btn-control delete" onclick="removeLayer(${index})">✕</button>
        </div>
      `;
      layersList.appendChild(itemEl);
    });
  }

  window.moveLayer = function(index, direction) {
    if (isEating) return;
    playSound(SOUNDS.buttons);
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= currentBurger.length) return;
    const temp = currentBurger[index];
    currentBurger[index] = currentBurger[newIndex];
    currentBurger[newIndex] = temp;
    updateBurgerDisplay(false);
  };

  window.removeLayer = function(index) {
    if (isEating) return;
    playSound(SOUNDS.buttons);
    const removed = currentBurger[index];
    returnBurgerLayerToStock(removed);
    currentBurger.splice(index, 1);
    updateBurgerDisplay(false);
    renderIngredientsMenu();
    renderSauces();
  };

  if (squeezeBtn) squeezeBtn.onclick = () => {
    if (currentBurger.length === 0 || isEating) return;
    isSqueezed = !isSqueezed;
    if (isSqueezed) playSound(SOUNDS.squeeze);
    else playSound(SOUNDS.buttons);
    updateBurgerDisplay(false);
  };

  if (eatBtn) eatBtn.onclick = () => {
    if (currentBurger.length === 0 || isEating) return;
    if (currentActiveOrder) {
      checkOrderSubmission();
      return;
    }
    isEating = true;
    isSqueezed = false;
    playSound(SOUNDS.eating);
    checkSecretRecipes();
    trackQuestProgress('make_burgers', 1);
    if (burgerStack) burgerStack.classList.add('eating');
    setTimeout(() => {
      currentBurger = [];
      if (burgerStack) burgerStack.classList.remove('eating');
      isEating = false;
      updateBurgerDisplay(false);
    }, 2000);
  };

  const resetBtn = document.getElementById('resetBtn');

  function enterBinSelectMode() {
    isBinSelectMode = true;
    selectedGrillIndicesForBin = [];
    selectedBoardIndicesForBin = [];
    selectedSinkIndicesForBin = [];
    renderGrill();
    renderBoard();
    renderSink();

    let bar = document.getElementById('binConfirmBar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'binConfirmBar';
      bar.className = 'bin-confirm-bar';
      bar.innerHTML = `
        <button class="btn-action btn-confirm" id="confirmBinBtn" title="Confirm">✓</button>
        <button class="btn-action btn-cancel" id="cancelBinBtn" title="Cancel">✕</button>
      `;
      document.body.appendChild(bar);

      document.getElementById('confirmBinBtn').onclick = () => {
        if (currentScreen === 'grill') {
          if (selectedGrillIndicesForBin.length > 0) {
            selectedGrillIndicesForBin.forEach(idx => { grillSlots[idx] = null; });
            saveGrillState();
            playSound(SOUNDS.bin);
          }
        } else if (currentScreen === 'board') {
          if (selectedBoardIndicesForBin.length > 0) {
            selectedBoardIndicesForBin.forEach(idx => { boardSlots[idx] = null; });
            saveBoardState();
            playSound(SOUNDS.bin);
          }
        } else if (currentScreen === 'sink') {
          if (selectedSinkIndicesForBin.length > 0) {
            selectedSinkIndicesForBin.forEach(idx => { sinkSlots[idx] = null; });
            saveSinkState();
            playSound(SOUNDS.bin);
          }
        }
        exitBinSelectMode();
      };

      document.getElementById('cancelBinBtn').onclick = () => {
        playSound(SOUNDS.buttons);
        exitBinSelectMode();
      };
    }
    bar.style.display = 'flex';
  }

  function exitBinSelectMode() {
    isBinSelectMode = false;
    selectedGrillIndicesForBin = [];
    selectedBoardIndicesForBin = [];
    selectedSinkIndicesForBin = [];
    const bar = document.getElementById('binConfirmBar');
    if (bar) bar.style.display = 'none';
    if (currentScreen === 'grill') renderGrill();
    if (currentScreen === 'board') renderBoard();
    if (currentScreen === 'sink') renderSink();
  }

  if (resetBtn) {
    resetBtn.onclick = () => {
      if (currentScreen === 'grill') {
        playSound(SOUNDS.buttons);
        if (isBinSelectMode) exitBinSelectMode();
        else {
          if (grillSlots.every(s => s === null)) { showToast('Grill is already empty!', '', 'warning'); return; }
          enterBinSelectMode();
        }
        return;
      }

      if (currentScreen === 'board') {
        playSound(SOUNDS.buttons);
        if (isBinSelectMode) exitBinSelectMode();
        else {
          if (boardSlots.every(s => s === null)) { showToast('Board is already empty!', '', 'warning'); return; }
          enterBinSelectMode();
        }
        return;
      }

      if (currentScreen === 'sink') {
        playSound(SOUNDS.buttons);
        if (isBinSelectMode) exitBinSelectMode();
        else {
          if (sinkSlots.every(s => s === null)) { showToast('Sink is already empty!', '', 'warning'); return; }
          enterBinSelectMode();
        }
        return;
      }

      if (currentBurger.length === 0 || isEating) return;

      if (resetClickCount === 0) {
        resetClickCount = 1;
        playSound(SOUNDS.buttons);
        showToast("Click again to throw the burger into the bin", "", "warning");
        clearTimeout(resetClickTimeout);
        resetClickTimeout = setTimeout(() => { resetClickCount = 0; }, 5000);
      } else {
        resetClickCount = 0;
        clearTimeout(resetClickTimeout);
        playSound(SOUNDS.bin);
        currentBurger = [];
        isSqueezed = false;
        updateBurgerDisplay(false);
        showToast("Burger thrown into the bin", "", "error");
      }
    };
  }

  const downloadPngBtn = document.getElementById('downloadPngBtn');
  if (downloadPngBtn) {
    downloadPngBtn.onclick = async () => {
      if (currentBurger.length === 0 || isEating) {
        showToast('Burger is empty!', 'Add some ingredients first', 'warning');
        return;
      }
      playSound(SOUNDS.buttons);

      if (typeof html2canvas === 'undefined') {
        showToast('Export Error', 'Library not loaded', 'error');
        return;
      }

      showToast('Generating PNG...', 'Please wait...', 'warning');

      try {
        const cloneStack = burgerStack.cloneNode(true);
        cloneStack.style.position = 'fixed';
        cloneStack.style.left = '-9999px';
        cloneStack.style.top = '0';
        cloneStack.style.background = 'transparent';
        cloneStack.style.padding = '15px';
        cloneStack.style.display = 'inline-flex';
        cloneStack.style.flexDirection = 'column-reverse';
        cloneStack.style.alignItems = 'center';
        cloneStack.style.width = 'max-content';
        cloneStack.style.height = 'auto';
        cloneStack.style.transform = 'none';

        document.body.appendChild(cloneStack);

        const images = cloneStack.querySelectorAll('img');
        await Promise.all(Array.from(images).map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
        }));

        const canvas = await html2canvas(cloneStack, {
          backgroundColor: null,
          scale: 2,
          useCORS: true,
          logging: false
        });

        document.body.removeChild(cloneStack);

        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `burger-${Date.now()}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast('Saved!', 'Burger PNG downloaded successfully!', 'success');
      } catch (err) {
        console.error(err);
        showToast('Export Failed', 'Could not capture PNG image', 'error');
      }
    };
  }

  const toggleUiBtn = document.getElementById('toggleUiBtn');
  if (toggleUiBtn) {
    toggleUiBtn.onclick = () => {
      document.body.classList.toggle('ui-hidden');
      toggleUiBtn.innerText = document.body.classList.contains('ui-hidden') ? '🙈' : '👁️';
      positionServeButtonOnMobile();
      positionMusicToast();
    };
  }

  function getGmt5DateKey() {
    const now = new Date();
    const gmt5Time = new Date(now.getTime() + (5 * 60 * 60 * 1000));
    return gmt5Time.toISOString().split('T')[0];
  }

  function getSecondsUntilGmt5Midnight() {
    const now = new Date();
    const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
    const gmt5Now = new Date(utcMs + (5 * 3600000));

    const gmt5Midnight = new Date(gmt5Now);
    gmt5Midnight.setHours(24, 0, 0, 0);

    return Math.max(0, Math.floor((gmt5Midnight - gmt5Now) / 1000));
  }

  function formatDurationHMS(totalSecs) {
    const h = Math.floor(totalSecs / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSecs % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSecs % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  function getHardQuestForDay(dateStr) {
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
      hash = dateStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    const chosenRecipe = REGULAR_RECIPES[Math.abs(hash) % REGULAR_RECIPES.length];
    return {
      id: `daily_special_${chosenRecipe.name}`,
      title: `Serve "${chosenRecipe.name}"`,
      target: 1,
      reward: 10.00,
      type: 'specific_recipe',
      recipeName: chosenRecipe.name
    };
  }

  function initDailyQuests() {
    const todayKey = getGmt5DateKey();
    if (!dailyQuestsData || dailyQuestsData.dateKey !== todayKey) {
      const shuffled = [...SIMPLE_QUESTS_POOL].sort(() => 0.5 - Math.random());
      const pickedSimple = shuffled.slice(0, 2).map(q => ({ ...q, progress: 0, claimed: false }));
      const hardQuest = { ...getHardQuestForDay(todayKey), progress: 0, claimed: false };

      dailyQuestsData = {
        dateKey: todayKey,
        quests: [...pickedSimple, hardQuest]
      };
      saveDailyQuests();
    }
    updateQuestsBadge();
  }

  function saveDailyQuests() {
    localStorage.setItem(getModeKey('burger_daily_quests'), JSON.stringify(dailyQuestsData));
    updateQuestsBadge();
  }

  function updateQuestsBadge() {
    const badge = document.getElementById('questsBadge');
    if (!badge || !dailyQuestsData) return;

    const hasUnclaimed = dailyQuestsData.quests.some(q => q.progress >= q.target && !q.claimed);
    badge.style.display = hasUnclaimed ? 'block' : 'none';
  }

  function trackQuestProgress(type, amount = 1, extraData = null) {
    if (!dailyQuestsData) initDailyQuests();
    let updated = false;

    dailyQuestsData.quests.forEach(q => {
      if (q.claimed || q.progress >= q.target) return;

      if (q.type === type) {
        if (type === 'specific_recipe') {
          if (extraData && extraData.recipeName === q.recipeName) {
            q.progress = Math.min(q.target, q.progress + amount);
            updated = true;
          }
        } else {
          q.progress = Math.min(q.target, q.progress + amount);
          updated = true;
        }
      }
    });

    if (updated) {
      saveDailyQuests();
      if (questsModal && questsModal.classList.contains('open')) {
        renderQuestsModal();
      }
    }
  }

  window.claimQuestReward = function(questId) {
    if (!dailyQuestsData) return;
    const quest = dailyQuestsData.quests.find(q => q.id === questId);
    if (!quest || quest.claimed || quest.progress < quest.target) return;

    quest.claimed = true;
    saveDailyQuests();

    playSound(SOUNDS.buy);
    if (currentGameMode !== 'sandbox') {
      const scaledReward = Math.round(quest.reward * getQuestRewardMultiplier() * 100) / 100;
      playerMoney += scaledReward;
      updateMoneyDisplay(scaledReward, true);
      showToast('Quest Reward Claimed!', `+$${scaledReward.toFixed(2)}`, 'success');
    } else {
      showToast('Quest Completed!', 'Sandbox mode active', 'success');
    }
    renderQuestsModal();
  }

  function renderQuestsModal() {
    const body = document.getElementById('questsListBody');
    if (!body) return;
    initDailyQuests();
    body.innerHTML = '';

    dailyQuestsData.quests.forEach(q => {
      const isCompleted = q.progress >= q.target;
      const pct = Math.min(100, (q.progress / q.target) * 100);
      const scaledReward = Math.round(q.reward * getQuestRewardMultiplier() * 100) / 100;
      const rewardText = currentGameMode === 'sandbox' ? 'Sandbox' : `+$${scaledReward.toFixed(2)}`;

      const card = document.createElement('div');
      card.className = `quest-card ${isCompleted ? 'completed' : ''}`;

      let buttonHtml = '';
      if (q.claimed) {
        buttonHtml = `<button class="btn-claim-reward" disabled>Claimed ✓</button>`;
      } else if (isCompleted) {
        buttonHtml = `<button class="btn-claim-reward" onclick="claimQuestReward('${q.id}')">Claim</button>`;
      } else {
        buttonHtml = `<button class="btn-claim-reward" disabled>In progress</button>`;
      }

      const displayProgress = q.type === 'earn_money' ? `$${q.progress.toFixed(2)} / $${q.target}` : `${q.progress} / ${q.target}`;

      card.innerHTML = `
        <div class="quest-header">
          <span class="quest-title">${q.title}</span>
          <span class="quest-reward">${rewardText}</span>
        </div>
        <div class="quest-progress-info">
          <span>Progress</span>
          <span>${displayProgress}</span>
        </div>
        <div class="quest-progress-track">
          <div class="quest-progress-fill" style="width: ${pct}%"></div>
        </div>
        ${buttonHtml}
      `;
      body.appendChild(card);
    });
  }

  if (openQuestsBtn) {
    openQuestsBtn.onclick = () => {
      playSound(SOUNDS.buttons);
      renderQuestsModal();
      questsModal.classList.add('open');
      document.body.classList.add('modal-open');
    };
  }
  if (closeQuestsModal) {
    closeQuestsModal.onclick = () => {
      playSound(SOUNDS.buttons);
      questsModal.classList.remove('open');
      document.body.classList.remove('modal-open');
    };
  }

  setInterval(() => {
    const timerSpan = document.getElementById('questsResetTimer');
    if (timerSpan) {
      timerSpan.innerText = formatDurationHMS(getSecondsUntilGmt5Midnight());
    }
    const currentKey = getGmt5DateKey();
    if (dailyQuestsData && dailyQuestsData.dateKey !== currentKey) {
      initDailyQuests();
      if (questsModal && questsModal.classList.contains('open')) {
        renderQuestsModal();
      }
    }
  }, 1000);

  const TUTORIAL_STEPS = [
    {
      title: 'Welcome to Burger Maker! 🍔',
      text: 'This quick guide will show you the interface and basic mechanics so you can start cooking right away.',
      targetId: null
    },
    {
      title: 'Your Wallet & Balance 💰',
      text: 'Here you can track your current money balance. Earn money by serving customer orders and completing daily quests.',
      targetId: 'walletWidget',
      action: () => { switchScreen('assembly', true); }
    },
    {
      title: 'Customer Orders 🔔',
      text: 'This top banner shows incoming orders and timers. Serve the requested burger accurately to earn rewards!',
      targetId: 'topOrderWidget',
      action: () => { switchScreen('assembly', true); }
    },
    {
      title: 'Station Switcher 🔀',
      text: 'Use these buttons to switch between workstations:
🍔 Assembly
🔥 Grill
🔪 Cutting Board
🚿 Sink',
      targetId: 'screenSwitcher',
      action: () => { switchScreen('assembly', true); }
    },
    {
      title: 'Ingredients Menu 🥬',
      text: 'Click on ingredients here to add them onto your burger stack.',
      targetId: 'rightPanel',
      action: () => { switchScreen('assembly', true); }
    },
    {
      title: 'Sauces Bar 🥫',
      text: 'Click any sauce chip to squirt flavorful sauces between your burger layers.',
      targetId: () => window.innerWidth <= 900 ? 'mobileSaucesGroup' : 'desktopSaucesGroup',
      action: () => { switchScreen('assembly', true); }
    },
    {
      title: 'Burger Layers & Stack 📚',
      text: 'Here you can see every layer of your burger, reorder them using arrows, or remove specific layers.',
      targetId: 'leftPanel',
      action: () => { switchScreen('assembly', true); }
    },
    {
      title: 'Cooking on the Grill 🔥',
      text: 'Place raw meat, bacon, or eggs on the grill! Watch the progress bar, flip items when prompted, and collect before they burn.',
      targetId: 'grillCookingArea',
      action: () => { switchScreen('grill', true); }
    },
    {
      title: 'Slicing on the Board 🔪',
      text: 'Chop uncut vegetables, cheese, and mushrooms here! Clicking an item slices it into 3 ready-to-use portions.',
      targetId: 'boardCookingArea',
      action: () => { switchScreen('board', true); }
    },
    {
      title: 'Washing in the Sink 🚿',
      text: 'Dirty produce purchased from the shop must be washed in the sink before slicing, otherwise customers might get food poisoning!',
      targetId: 'sinkCookingArea',
      action: () => { switchScreen('sink', true); }
    },
    {
      title: 'Menus & Tools 📋',
      text: 'Access Recipes (📋), Shop (🏬), Backpack (🎒), Achievements (🏆), and Daily Quests (🎯) from this toolbar.',
      targetId: () => document.querySelectorAll('.action-box')[0],
      action: () => { switchScreen('assembly', true); }
    },
    {
      title: 'Burger & Order Actions 🍽️',
      text: 'Request an order (🔔), skip an order (⏩), squeeze your burger (✊), eat it (🍔), or toss it in the bin (🗑️).',
      targetId: () => document.querySelectorAll('.action-box')[1],
      action: () => { switchScreen('assembly', true); }
    },
    {
      title: 'Export & Settings ⚙️',
      text: 'Save a transparent PNG screenshot of your burger creation (💾) or customize sound, themes, and game modes in Settings (⚙️).',
      targetId: () => document.querySelectorAll('.action-box')[2],
      action: () => { switchScreen('assembly', true); }
    }
  ];

  let currentTutorialStep = 0;
  let isTutorialActive = false;

  const welcomeModal = document.getElementById('welcomeModal');
  const welcomeYesBtn = document.getElementById('welcomeYesBtn');
  const welcomeNoBtn = document.getElementById('welcomeNoBtn');
  const tutorialOverlay = document.getElementById('tutorialOverlay');
  const tutorialSpotlight = document.getElementById('tutorialSpotlight');
  const tutorialTooltip = document.getElementById('tutorialTooltip');
  const tutorialTitle = document.getElementById('tutorialTitle');
  const tutorialText = document.getElementById('tutorialText');
  const tutorialStepIndicator = document.getElementById('tutorialStepIndicator');
  const tutorialPrevBtn = document.getElementById('tutorialPrevBtn');
  const tutorialNextBtn = document.getElementById('tutorialNextBtn');
  const tutorialSkipBtn = document.getElementById('tutorialSkipBtn');
  const openTutorialFromSettingsBtn = document.getElementById('openTutorialFromSettingsBtn');

  function startTutorial() {
    if (welcomeModal) welcomeModal.classList.remove('open');
    if (settingsModal) settingsModal.classList.remove('open');
    document.body.classList.remove('modal-open');
    currentTutorialStep = 0;
    isTutorialActive = true;
    document.body.classList.add('tutorial-active');
    if (tutorialOverlay) tutorialOverlay.classList.add('active');
    renderTutorialStep();
  }

  function endTutorial(completed = true) {
    isTutorialActive = false;
    document.body.classList.remove('tutorial-active');
    if (tutorialOverlay) tutorialOverlay.classList.remove('active');
    localStorage.setItem('burger_tutorial_seen', 'true');
    switchScreen('assembly', true);
    if (completed) {
      showToast('Tutorial Complete!', 'Have fun making delicious burgers! 🍔', 'success');
    }
  }

  function renderTutorialStep() {
    const step = TUTORIAL_STEPS[currentTutorialStep];
    if (!step) return;

    if (step.action) step.action();

    if (tutorialTitle) tutorialTitle.innerText = step.title;
    if (tutorialText) tutorialText.innerText = step.text;
    if (tutorialStepIndicator) tutorialStepIndicator.innerText = `${currentTutorialStep + 1} / ${TUTORIAL_STEPS.length}`;

    if (tutorialPrevBtn) {
      tutorialPrevBtn.style.visibility = currentTutorialStep === 0 ? 'hidden' : 'visible';
    }
    if (tutorialNextBtn) {
      tutorialNextBtn.innerText = currentTutorialStep === TUTORIAL_STEPS.length - 1 ? 'Finish' : 'Next';
    }

    requestAnimationFrame(() => {
      let targetEl = null;
      if (typeof step.targetId === 'function') {
        targetEl = step.targetId();
      } else if (step.targetId) {
        targetEl = document.getElementById(step.targetId);
      }

      const isMobile = window.innerWidth <= 900;

      if (isMobile) {
        if (tutorialSpotlight) tutorialSpotlight.style.display = 'none';
        if (tutorialTooltip) {
          tutorialTooltip.style.top = '';
          tutorialTooltip.style.left = '';
        }
        return;
      }

      if (targetEl && tutorialSpotlight && tutorialTooltip) {
        const rect = targetEl.getBoundingClientRect();
        const isVisible = rect.width > 0 && rect.height > 0 && window.getComputedStyle(targetEl).display !== 'none';

        if (isVisible) {
          const pad = 6;
          tutorialSpotlight.style.display = 'block';
          tutorialSpotlight.style.top = `${Math.max(0, rect.top - pad)}px`;
          tutorialSpotlight.style.left = `${Math.max(0, rect.left - pad)}px`;
          tutorialSpotlight.style.width = `${rect.width + pad * 2}px`;
          tutorialSpotlight.style.height = `${rect.height + pad * 2}px`;

          const tooltipRect = tutorialTooltip.getBoundingClientRect();
          const tooltipW = tooltipRect.width || 310;
          const tooltipH = tooltipRect.height || 180;

          let topPos = rect.bottom + 14;
          let leftPos = rect.left + (rect.width / 2) - (tooltipW / 2);

          if (topPos + tooltipH > window.innerHeight - 12) {
            topPos = rect.top - tooltipH - 14;
          }
          if (topPos < 12) {
            topPos = Math.max(12, (window.innerHeight - tooltipH) / 2);
          }

          if (leftPos < 12) leftPos = 12;
          if (leftPos + tooltipW > window.innerWidth - 12) {
            leftPos = window.innerWidth - tooltipW - 12;
          }

          tutorialTooltip.style.top = `${topPos}px`;
          tutorialTooltip.style.left = `${leftPos}px`;
          return;
        }
      }

      if (tutorialSpotlight) tutorialSpotlight.style.display = 'none';
      if (tutorialTooltip) {
        const tooltipRect = tutorialTooltip.getBoundingClientRect();
        const tooltipW = tooltipRect.width || 310;
        const tooltipH = tooltipRect.height || 180;
        tutorialTooltip.style.top = `${Math.max(12, (window.innerHeight - tooltipH) / 2)}px`;
        tutorialTooltip.style.left = `${Math.max(12, (window.innerWidth - tooltipW) / 2)}px`;
      }
    });
  }

  if (welcomeYesBtn) {
    welcomeYesBtn.onclick = () => {
      playSound(SOUNDS.buttons);
      startTutorial();
    };
  }
  if (welcomeNoBtn) {
    welcomeNoBtn.onclick = () => {
      playSound(SOUNDS.buttons);
      if (welcomeModal) welcomeModal.classList.remove('open');
      document.body.classList.remove('modal-open');
      localStorage.setItem('burger_tutorial_seen', 'true');
    };
  }
  if (tutorialNextBtn) {
    tutorialNextBtn.onclick = () => {
      playSound(SOUNDS.buttons);
      if (currentTutorialStep < TUTORIAL_STEPS.length - 1) {
        currentTutorialStep++;
        renderTutorialStep();
      } else {
        endTutorial(true);
      }
    };
  }
  if (tutorialPrevBtn) {
    tutorialPrevBtn.onclick = () => {
      playSound(SOUNDS.buttons);
      if (currentTutorialStep > 0) {
        currentTutorialStep--;
        renderTutorialStep();
      }
    };
  }
  if (tutorialSkipBtn) {
    tutorialSkipBtn.onclick = () => {
      playSound(SOUNDS.buttons);
      endTutorial(false);
    };
  }
  if (openTutorialFromSettingsBtn) {
    openTutorialFromSettingsBtn.onclick = () => {
      playSound(SOUNDS.buttons);
      startTutorial();
    };
  }

  window.addEventListener('resize', () => {
    if (isTutorialActive) renderTutorialStep();
    positionServeButtonOnMobile();
    updateMoneyPopupPosition();
    positionMusicToast();
  });

  // --- DANGER ZONE: RESET ACHIEVEMENTS & HARD RESET ---
  const resetAchievementsBtn = document.getElementById('resetAchievementsBtn');
  const hardResetBtn = document.getElementById('hardResetBtn');

  let resetAchClickCount = 0;
  let resetAchTimeout = null;
  let hardResetClickCount = 0;
  let hardResetTimeout = null;

  if (resetAchievementsBtn) {
    resetAchievementsBtn.onclick = () => {
      playSound(SOUNDS.buttons);
      if (resetAchClickCount === 0) {
        resetAchClickCount = 1;
        resetAchievementsBtn.innerText = 'Confirm Reset Achievements?';
        showToast('Click again to reset achievements', 'Secret recipes will be locked again', 'warning');
        clearTimeout(resetAchTimeout);
        resetAchTimeout = setTimeout(() => {
          resetAchClickCount = 0;
          resetAchievementsBtn.innerText = 'Reset Achievements';
        }, 4000);
      } else {
        resetAchClickCount = 0;
        clearTimeout(resetAchTimeout);
        resetAchievementsBtn.innerText = 'Reset Achievements';

        unlockedAchievements = {};
        localStorage.removeItem('unlocked_achievements');
        localStorage.setItem('has_new_achievement', 'false');
        updateAchievementsBadge();

        if (pinnedBurger && SECRET_ACHIEVEMENTS.some(a => a.title === pinnedBurger.name)) {
          pinnedBurger = null;
          localStorage.removeItem('pinned_burger');
          renderPinnedWidget();
        }

        if (achievementsModal && achievementsModal.classList.contains('open')) {
          renderAchievementsModal();
        }
        if (recipesModal && recipesModal.classList.contains('open')) {
          renderRecipesModal();
        }

        showToast('Achievements Reset', 'All secret achievements have been cleared.', 'error');
      }
    };
  }

  if (hardResetBtn) {
    hardResetBtn.onclick = () => {
      playSound(SOUNDS.buttons);
      if (hardResetClickCount === 0) {
        hardResetClickCount = 1;
        hardResetBtn.innerText = 'Confirm Full Data Reset?';
        showToast('WARNING: All progress will be wiped!', 'Click again to reset everything', 'error');
        clearTimeout(hardResetTimeout);
        hardResetTimeout = setTimeout(() => {
          hardResetClickCount = 0;
          hardResetBtn.innerText = 'Reset Data';
        }, 4000);
      } else {
        hardResetClickCount = 0;
        clearTimeout(hardResetTimeout);
        hardResetBtn.innerText = 'Reset Data';

        stopAllStationAudio();
        stopMusicPlayback();
        localStorage.clear();

        unlockedAchievements = {};
        pinnedBurger = null;
        modeSpeeds = { sandbox: 'no-orders', casual: 'no-orders' };
        currentGameMode = 'casual';
        sfxVolumeLevel = 0.5;
        musicVolumeLevel = 0.05;
        currentTrackIndex = 0;
        savedMusicPosition = 0;
        pendingSeekTime = null;
        isMusicPlaying = false;
        isSqueezed = false;
        isEating = false;
        shopQuantities = {};

        if (sfxVolumeRange) sfxVolumeRange.value = 50;
        if (sfxVolumeVal) sfxVolumeVal.innerText = '50%';
        if (musicVolumeRange) musicVolumeRange.value = 5;
        if (musicVolumeVal) musicVolumeVal.innerText = '5%';
        updateMusicPlayerUI();
        setTheme('dark');
        updateAchievementsBadge();
        renderPinnedWidget();
        applyGameMode('casual');
        initDailyQuests();
        switchScreen('assembly', true);

        if (settingsModal) settingsModal.classList.remove('open');
        document.body.classList.remove('modal-open');

        if (welcomeModal) {
          welcomeModal.classList.add('open');
          document.body.classList.add('modal-open');
        }
      }
    };
  }

  // --- INITIALIZATION ---
  applyGameMode(currentGameMode);
  initDailyQuests();
  updateAchievementsBadge();
  renderPinnedWidget();
  switchScreen(currentScreen, true);
  updateMusicPlayerUI();
  requestAnimationFrame(() => positionMusicToast());

  if (!localStorage.getItem('burger_tutorial_seen')) {
    if (welcomeModal) {
      welcomeModal.classList.add('open');
      document.body.classList.add('modal-open');
    }
  }

  // =========================================================================
  // CUSTOMER TYPES FEATURE (Patient, Impatient, Indecisive, VIP, Modest, Capricious, Critic)
  // =========================================================================
  const CUSTOMER_TRAITS = {
    patient: {
      id: 'patient',
      name: 'Patient',
      icon: '🐢',
      desc: 'Longer patience timer in Turbo based on burger size (up to 5:00 max).'
    },
    impatient: {
      id: 'impatient',
      name: 'Impatient',
      icon: '⚡',
      desc: 'Shorter patience timer in Turbo; smaller burgers give even less time (min 0:30).'
    },
    indecisive: {
      id: 'indecisive',
      name: 'Indecisive',
      icon: '❓',
      desc: 'This customer has a chance to change their order.'
    },
    vip: {
      id: 'vip',
      name: 'VIP',
      icon: '👑',
      desc: 'Gives tips on completed orders: base + speed bonus in Turbo, or speed-scaled tip in Casual.'
    },
    modest: {
      id: 'modest',
      name: 'Modest',
      icon: '😇',
      desc: 'Higher chance to forgive unwashed/raw/mismatched items or food poisoning.'
    },
    capricious: {
      id: 'capricious',
      name: 'Capricious',
      icon: '😤',
      desc: 'Higher chance to complain about unwashed/raw/mismatched items or poisoning, even with Charm.'
    },
    critic: {
      id: 'critic',
      name: 'Critic',
      icon: '🧐',
      desc: 'Very picky about orders: requires full compliance with the recipe and carefully inspects every single ingredient.'
    }
  };

  let criticModifierState = {
    remainingOrders: 0,
    effect: null
  };

  let criticCooldownOrdersRemaining = 0;

  let indecisiveDiceInterval = null;

  function getCriticCooldownRangeForCurrentSettings() {
    if (currentGameMode === 'turbo') {
      return { min: 18, max: 30 };
    }
    const speed = getCurrentSpeed();
    switch (speed) {
      case 'turbo':
        return { min: 16, max: 28 };
      case 'super-fast':
        return { min: 12, max: 22 };
      case 'fast':
        return { min: 8, max: 16 };
      case 'medium':
        return { min: 5, max: 10 };
      case 'slow':
        return { min: 4, max: 7 };
      case 'super-slow':
        return { min: 3, max: 5 };
      default:
        return { min: 5, max: 10 };
    }
  }

  function rollNewCriticCooldown() {
    const { min, max } = getCriticCooldownRangeForCurrentSettings();
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function saveCriticModifierState() {
    localStorage.setItem(getModeKey('burger_critic_modifier'), JSON.stringify(criticModifierState));
    localStorage.setItem(getModeKey('burger_critic_cooldown'), String(criticCooldownOrdersRemaining));
  }

  function loadCriticModifierState() {
    const raw = localStorage.getItem(getModeKey('burger_critic_modifier'));
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        criticModifierState = {
          remainingOrders: Math.max(0, parseInt(parsed.remainingOrders, 10) || 0),
          effect: (parsed.effect === 'penalty' || parsed.effect === 'bonus') ? parsed.effect : null
        };
      } catch (e) {
        criticModifierState = { remainingOrders: 0, effect: null };
      }
    } else {
      criticModifierState = { remainingOrders: 0, effect: null };
    }
    if (criticModifierState.remainingOrders <= 0) {
      criticModifierState.remainingOrders = 0;
      criticModifierState.effect = null;
    }

    const rawCd = parseInt(localStorage.getItem(getModeKey('burger_critic_cooldown')), 10);
    if (!isNaN(rawCd) && rawCd >= 0) {
      criticCooldownOrdersRemaining = rawCd;
    } else {
      criticCooldownOrdersRemaining = 0;
    }
  }

  function resetCriticCooldownAfterResolution() {
    criticCooldownOrdersRemaining = rollNewCriticCooldown();
    saveCriticModifierState();
  }

  function onNormalOrderCompletedOrSkipped() {
    if (currentGameMode === 'sandbox') return;
    if (currentGameMode !== 'turbo' && getCurrentSpeed() === 'no-orders') return;
    if (criticModifierState.remainingOrders > 0) {
      return;
    }
    if (criticCooldownOrdersRemaining > 0) {
      criticCooldownOrdersRemaining = Math.max(0, criticCooldownOrdersRemaining - 1);
      saveCriticModifierState();
    }
  }

  function canCriticAppearNow() {
    if (currentGameMode === 'sandbox') return false;
    if (criticModifierState.remainingOrders > 0 || criticModifierState.effect !== null) {
      return false;
    }
    if (criticCooldownOrdersRemaining > 0) {
      return false;
    }
    return true;
  }

  function getCriticAffectedOrdersCount() {
    if (currentGameMode === 'turbo') return 4;
    const speed = getCurrentSpeed();
    if (speed === 'no-orders') return 0;
    const map = {
      'super-slow': 2,
      'slow': 2,
      'medium': 3,
      'fast': 4,
      'super-fast': 5,
      'turbo': 4
    };
    return map[speed] ?? 3;
  }

  function getCriticBonusOrFineAmount(burgerCost) {
    const base = Math.max(8, burgerCost * 0.75);
    if (currentGameMode === 'turbo') {
      return Math.round(base * 1.35 * 100) / 100;
    }
    const mult = getOrderMultiplier();
    return Math.round(base * mult * 100) / 100;
  }

  function getCriticRewardMultiplier() {
    if (currentGameMode === 'sandbox') return 1.0;
    if (currentGameMode !== 'turbo' && getCurrentSpeed() === 'no-orders') return 1.0;
    if (criticModifierState.remainingOrders > 0) {
      if (criticModifierState.effect === 'penalty') return 0.5;
      if (criticModifierState.effect === 'bonus') return 1.5;
    }
    return 1.0;
  }

  function consumeCriticModifierAfterOrder() {
    if (currentGameMode === 'sandbox') return;
    if (currentGameMode !== 'turbo' && getCurrentSpeed() === 'no-orders') return;
    if (criticModifierState.remainingOrders > 0) {
      criticModifierState.remainingOrders -= 1;
      if (criticModifierState.remainingOrders <= 0) {
        criticModifierState.remainingOrders = 0;
        criticModifierState.effect = null;
        criticCooldownOrdersRemaining = rollNewCriticCooldown();
      }
      saveCriticModifierState();
      updateCriticModifierBadge();
    } else {
      onNormalOrderCompletedOrSkipped();
    }
  }

  function updateCriticModifierBadge() {
    const badge = document.getElementById('criticModifierBadge');
    const topWidget = document.getElementById('topOrderWidget');
    if (!badge) return;

    const noOrdersActive = currentGameMode !== 'turbo' && getCurrentSpeed() === 'no-orders';
    if (
      currentGameMode === 'sandbox' ||
      noOrdersActive ||
      criticModifierState.remainingOrders <= 0 ||
      !criticModifierState.effect
    ) {
      badge.className = 'critic-modifier-badge hidden';
      badge.innerText = '';
      return;
    }

    const isPenalty = criticModifierState.effect === 'penalty';
    const wasDimmed = badge.classList.contains('dimmed');
    badge.className = `critic-modifier-badge ${isPenalty ? 'penalty' : 'bonus'}${wasDimmed ? ' dimmed' : ''}`;
    badge.innerText = isPenalty ? '50% OFF' : '+50% BOOST';

    requestAnimationFrame(() => {
      if (window.innerWidth <= 900) {
        badge.style.top = '52px';
        badge.style.left = '10px';
        badge.style.right = 'auto';
        badge.style.transform = 'none';
      } else if (topWidget) {
        const wRect = topWidget.getBoundingClientRect();
        const bRect = badge.getBoundingClientRect();
        badge.style.top = `${Math.max(10, wRect.top + (wRect.height - bRect.height) / 2)}px`;
        badge.style.left = `${Math.max(8, wRect.left - bRect.width - 10)}px`;
        badge.style.right = 'auto';
        badge.style.transform = 'none';
      }
    });
  }

  function pickRandomRecipeForCustomer(requireComplex = false) {
    const unlockedSecret = SECRET_ACHIEVEMENTS.filter(a => unlockedAchievements[a.id] && a.ids && a.ids.length > 0);
    const pool = [...REGULAR_RECIPES, ...unlockedSecret];
    if (requireComplex && pool.length > 0) {
      const sorted = [...pool].sort((a, b) => b.ids.length - a.ids.length);
      const topCount = Math.max(1, Math.min(3, Math.ceil(sorted.length * 0.35)));
      const topPool = sorted.slice(0, topCount);
      return topPool[Math.floor(Math.random() * topPool.length)];
    }
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function generateCustomerTraitsForOrder() {
    if (currentGameMode === 'sandbox') return [];

    const criticAllowed = canCriticAppearNow();

    if (currentGameMode === 'casual') {
      if (Math.random() > 0.55) return [];
      const casualPool = criticAllowed
        ? ['indecisive', 'vip', 'modest', 'capricious', 'critic']
        : ['indecisive', 'vip', 'modest', 'capricious'];
      const picked = casualPool[Math.floor(Math.random() * casualPool.length)];
      return [picked];
    }

    const r = Math.random();
    let count = 0;
    if (r < 0.25) count = 0;
    else if (r < 0.65) count = 1;
    else if (r < 0.90) count = 2;
    else count = 3;

    if (count === 0) return [];

    if (criticAllowed && Math.random() < 0.14) {
      return ['critic'];
    }

    const turboPool = ['patient', 'impatient', 'indecisive', 'vip', 'modest', 'capricious'];
    const conflicts = {
      patient: 'impatient',
      impatient: 'patient',
      modest: 'capricious',
      capricious: 'modest'
    };

    const chosen = [];
    const shuffled = [...turboPool].sort(() => Math.random() - 0.5);

    for (const trait of shuffled) {
      if (chosen.length >= count) break;
      const hasConflict = chosen.some(existing => conflicts[existing] === trait || conflicts[trait] === existing);
      if (!hasConflict) {
        chosen.push(trait);
      }
    }

    return chosen;
  }

  function computeCustomerTurboTimer(traits, ingredientCount) {
    let seconds = getTurboBaseDurationSeconds();
    const hasPatient = traits.includes('patient');
    const hasImpatient = traits.includes('impatient');
    const hasCritic = traits.includes('critic');

    if (hasPatient) {
      const bonus = Math.min(120, Math.max(25, ingredientCount * 16));
      seconds = Math.min(300, seconds + bonus);
    }

    if (hasImpatient) {
      const reduction = Math.max(25, 85 - ingredientCount * 7);
      seconds = Math.max(30, seconds - reduction);
    }

    if (hasCritic) {
      seconds = Math.max(30, seconds - 60);
    }

    return Math.round(seconds);
  }

  function startIndecisiveDiceLoop() {
    if (indecisiveDiceInterval) {
      clearInterval(indecisiveDiceInterval);
      indecisiveDiceInterval = null;
    }
    if (!currentActiveOrder) return;
    const traits = currentActiveOrder.traits || [];
    if (!traits.includes('indecisive') || currentActiveOrder.hasChangedOrder) return;

    indecisiveDiceInterval = setInterval(() => {
      if (!currentActiveOrder || !(currentActiveOrder.traits || []).includes('indecisive') || currentActiveOrder.hasChangedOrder) {
        clearInterval(indecisiveDiceInterval);
        indecisiveDiceInterval = null;
        return;
      }

      const roll = Math.floor(Math.random() * 21);
      if (roll >= 15) {
        currentActiveOrder.hasChangedOrder = true;
        clearInterval(indecisiveDiceInterval);
        indecisiveDiceInterval = null;

        const candidates = [...REGULAR_RECIPES, ...SECRET_ACHIEVEMENTS.filter(a => unlockedAchievements[a.id] && a.ids && a.ids.length > 0)]
          .filter(item => (item.name || item.title) !== currentActiveOrder.name);
        const nextRecipe = candidates.length > 0
          ? candidates[Math.floor(Math.random() * candidates.length)]
          : pickRandomRecipeForCustomer(false);

        currentActiveOrder.name = nextRecipe.name || nextRecipe.title;
        currentActiveOrder.ids = nextRecipe.ids;

        let extraTimeMsg = '';
        if (currentGameMode === 'turbo' && Math.random() < 0.50) {
          currentTurboTimeLeft = Math.min(300, currentTurboTimeLeft + 30);
          extraTimeMsg = ' (+30s patience!)';
        }

        localStorage.setItem(getModeKey('current_active_order'), JSON.stringify(currentActiveOrder));
        playSound(SOUNDS.notification);
        showToast('Order Changed! 🎲', `Customer now wants ${currentActiveOrder.name}${extraTimeMsg}`, 'warning');

        if (currentGameMode === 'turbo') {
          updateOrderWidgetsText(currentActiveOrder.name, formatTime(currentTurboTimeLeft));
        } else {
          updateOrderWidgetsText(currentActiveOrder.name);
        }
      }
    }, 5000);
  }

  const customerTraitsModal = document.getElementById('customerTraitsModal');
  const closeCustomerTraitsModal = document.getElementById('closeCustomerTraitsModal');

  window.openCustomerTraitsModal = function(e) {
    if (e) e.stopPropagation();
    if (!currentActiveOrder || !currentActiveOrder.traits || currentActiveOrder.traits.length === 0) return;
    playSound(SOUNDS.buttons);

    const body = document.getElementById('customerTraitsModalBody');
    if (!body) return;

    body.innerHTML = currentActiveOrder.traits.map(traitId => {
      const t = CUSTOMER_TRAITS[traitId];
      if (!t) return '';
      return `
        <div class="customer-trait-card">
          <div class="customer-trait-icon">${t.icon}</div>
          <div class="customer-trait-info">
            <h4>${t.name}</h4>
            <p>${t.desc}</p>
          </div>
        </div>
      `;
    }).join('');

    if (customerTraitsModal) {
      customerTraitsModal.classList.add('open');
      document.body.classList.add('modal-open');
    }
  };

  if (closeCustomerTraitsModal) {
    closeCustomerTraitsModal.onclick = () => {
      playSound(SOUNDS.buttons);
      if (customerTraitsModal) {
        customerTraitsModal.classList.remove('open');
        document.body.classList.remove('modal-open');
      }
      positionMusicToast();
    };
  }

  if (customerTraitsModal) {
    customerTraitsModal.addEventListener('click', (e) => {
      if (e.target === customerTraitsModal) {
        playSound(SOUNDS.buttons);
        customerTraitsModal.classList.remove('open');
        document.body.classList.remove('modal-open');
        positionMusicToast();
      }
    });
  }

  updateOrderWidgetsText = function(orderName, timerText = '') {
    const w1 = document.getElementById('orderStatusText');
    if (!w1) return;
    const hasTraits = Boolean(currentActiveOrder && Array.isArray(currentActiveOrder.traits) && currentActiveOrder.traits.length > 0);
    const emojiBtnHtml = hasTraits
      ? `<button type="button" class="customer-traits-btn" id="customerTraitsBtn" title="Customer traits" onclick="openCustomerTraitsModal(event)">🤔</button>`
      : '';
    const changedTag = (currentActiveOrder && currentActiveOrder.hasChangedOrder)
      ? ` <span style="font-size:0.78rem;">🎲</span>`
      : '';

    const titleLine = `<div class="order-status-row">🔔 Order: <span>${orderName}</span>${changedTag}${emojiBtnHtml}</div>`;
    const timerLine = timerText ? `<div class="order-timer-badge">⏱️ ${timerText}</div>` : '';
    w1.innerHTML = `${titleLine}${timerLine}`;
    updateCriticModifierBadge();
  };

  triggerRandomOrder = function() {
    const traits = generateCustomerTraitsForOrder();
    const isCritic = traits.includes('critic');
    const chosen = pickRandomRecipeForCustomer(isCritic);

    currentActiveOrder = {
      name: chosen.name || chosen.title,
      ids: chosen.ids,
      traits,
      hasChangedOrder: false,
      startedAt: Date.now()
    };

    if (currentGameMode === 'turbo') {
      currentTurboTimeLeft = computeCustomerTurboTimer(traits, chosen.ids.length);
    }

    localStorage.setItem(getModeKey('current_active_order'), JSON.stringify(currentActiveOrder));

    const speed = getCurrentSpeed();
    if (speed !== 'no-orders' && speed !== 'turbo' && currentGameMode !== 'turbo') {
      timeUntilNextOrder = getRandomTimeForSpeed(speed);
      localStorage.setItem(getModeKey('time_until_next_order'), timeUntilNextOrder);
    }

    startIndecisiveDiceLoop();
    playSound(SOUNDS.order);
    updateActionButtonsVisibility();
    updateCriticModifierBadge();
  };

  function evaluateBurgerRecipeDiscrepancies(burgerLayers, targetIds, allowMixedOrder = false) {
    const normalizedIds = burgerLayers.map(i => normalizeIngredientIdForOrder(i.id));
    const maxLen = Math.max(normalizedIds.length, targetIds.length);
    let mismatches = 0;

    if (allowMixedOrder && areIngredientsSetEqual(normalizedIds, targetIds)) {
      const isExactSeq = normalizedIds.length === targetIds.length && normalizedIds.every((val, idx) => val === targetIds[idx]);
      if (!isExactSeq) {
        mismatches += 1;
      }
    } else {
      for (let i = 0; i < maxLen; i++) {
        const actualId = normalizedIds[i];
        const expectedId = targetIds[i];
        if (actualId !== expectedId) {
          mismatches += 1;
        }
      }
    }

    burgerLayers.forEach((layer, idx) => {
      const hasRawKey = Boolean(RAW_TO_COOKED_RECIPE_ITEM[layer.id]);
      const isMarkedRaw = Boolean(layer.isRaw && (layer.rawId || ASSEMBLY_RAW_FALLBACK[layer.id]));
      const isDirty = Boolean(layer.isDirty);

      const alreadyCountedAsWrongItem = idx < maxLen && (normalizedIds[idx] !== targetIds[idx]) && !(allowMixedOrder && areIngredientsSetEqual(normalizedIds, targetIds));
      if (!alreadyCountedAsWrongItem) {
        if (isDirty) mismatches += 1;
        if (hasRawKey || isMarkedRaw) mismatches += 1;
      }
    });

    return mismatches;
  }

  checkOrderSubmission = function() {
    if (!currentActiveOrder) return;

    if (indecisiveDiceInterval) {
      clearInterval(indecisiveDiceInterval);
      indecisiveDiceInterval = null;
    }

    const traits = Array.isArray(currentActiveOrder.traits) ? currentActiveOrder.traits : [];
    const isCritic = traits.includes('critic');
    const isModest = traits.includes('modest');
    const isCapricious = traits.includes('capricious');
    const isVip = traits.includes('vip');

    const targetIds = currentActiveOrder.ids;
    const normalizedIds = currentBurger.map(i => normalizeIngredientIdForOrder(i.id));
    const hasAnyDirty = currentBurger.some(layer => Boolean(layer.isDirty));
    const hasAnyRawMismatch = hasRawCookedMismatch(currentBurger);
    const isExactSequenceMatch = normalizedIds.length === targetIds.length && normalizedIds.every((val, idx) => val === targetIds[idx]);
    const isMixedOrderMatch = !isExactSequenceMatch && getCharmLevel() >= 1 && areIngredientsSetEqual(normalizedIds, targetIds);

    const charmLv = getCharmLevel();
    const rawPoisonChance = calculatePoisonChance(currentBurger);
    const charmPoisonReduction = charmLv >= 3 ? 0.5 : (charmLv >= 2 ? 0.25 : 0);
    let effectivePoisonChance = Math.max(0, rawPoisonChance * (1 - charmPoisonReduction));

    if (isModest) effectivePoisonChance *= 0.45;
    if (isCapricious) effectivePoisonChance = Math.min(0.85, effectivePoisonChance * 1.65 + (hasAnyDirty || hasAnyRawMismatch ? 0.15 : 0));

    const isPoisoned = currentGameMode !== 'sandbox' && effectivePoisonChance > 0 && Math.random() < effectivePoisonChance;

    const discrepancies = evaluateBurgerRecipeDiscrepancies(currentBurger, targetIds, charmLv >= 1);

    const isAccepted = isCritic
      ? (isExactSequenceMatch && !hasAnyDirty && !hasAnyRawMismatch && discrepancies === 0)
      : (discrepancies <= 3);

    const modestForgivesFlaw = isModest && isAccepted && !isPoisoned && discrepancies > 0 && Math.random() < 0.65;
    const capriciousComplains = isCapricious && isAccepted && !isPoisoned && discrepancies > 0 && Math.random() < 0.60;

    const cost = getBurgerCost(currentBurger);
    const penaltyFactor = Math.max(0.25, 1 - getCharmPenaltyDiscount());

    const advanceToNextOrderAfterResolution = () => {
      if (currentGameMode === 'turbo') {
        triggerRandomOrder();
      } else {
        currentActiveOrder = null;
        localStorage.removeItem(getModeKey('current_active_order'));
        const speed = getCurrentSpeed();
        if (speed !== 'no-orders' && speed !== 'turbo') {
          timeUntilNextOrder = getRandomTimeForSpeed(speed);
          localStorage.setItem(getModeKey('time_until_next_order'), timeUntilNextOrder);
        }
      }
    };

    const finishBurgerAnimation = () => {
      updateActionButtonsVisibility();
      updateCriticModifierBadge();
      isEating = true;
      isSqueezed = false;
      if (burgerStack) burgerStack.classList.add('eating');
      setTimeout(() => {
        currentBurger = [];
        if (burgerStack) burgerStack.classList.remove('eating');
        isEating = false;
        updateBurgerDisplay(false);
      }, 2000);
    };

    if (isAccepted && !capriciousComplains && !isPoisoned) {
      playSound(SOUNDS.complete);
      trackQuestProgress('make_burgers', 1);

      let totalPayout = 0;

      if (currentGameMode !== 'sandbox') {
        const multiplier = getOrderMultiplier();
        let reward = Math.round(cost * multiplier * 100) / 100;
        if (lastOrderReducedReward) {
          reward = Math.round(reward * (2 / 3) * 100) / 100;
          lastOrderReducedReward = false;
        }

        if (discrepancies > 0 && !modestForgivesFlaw) {
          const discrepancyFactors = {
            1: 0.80,
            2: 0.60,
            3: 0.40
          };
          let factor = discrepancyFactors[discrepancies] ?? 0.40;
          if (isMixedOrderMatch && discrepancies === 1) {
            factor = charmLv >= 3 ? 0.95 : (charmLv === 2 ? 0.85 : 0.75);
          }
          reward = Math.round(reward * factor * 100) / 100;
        }

        const criticMult = getCriticRewardMultiplier();
        reward = Math.round(reward * criticMult * 100) / 100;
        consumeCriticModifierAfterOrder();

        if (isCritic) {
          reward += getCriticBonusOrFineAmount(cost);
        }

        if (isVip) {
          if (currentGameMode === 'turbo') {
            const totalAllowed = Math.max(1, computeCustomerTurboTimer(traits, targetIds.length));
            const speedRatio = Math.max(0, Math.min(1, currentTurboTimeLeft / totalAllowed));
            const baseTip = 3.0;
            const speedBonus = Math.round(speedRatio * 7.0 * 100) / 100;
            reward += baseTip + speedBonus;
          } else {
            const casualTip = Math.round((2.5 * getOrderMultiplier()) * 100) / 100;
            reward += casualTip;
          }
        }

        totalPayout = Math.round(reward * 100) / 100;
        playerMoney += totalPayout;
        updateMoneyDisplay(totalPayout, true);
        trackQuestProgress('earn_money', totalPayout);
      } else {
        consumeCriticModifierAfterOrder();
      }

      if (isCritic) {
        if (currentGameMode !== 'sandbox') {
          const affectedCount = getCriticAffectedOrdersCount();
          if (affectedCount > 0) {
            criticModifierState = { remainingOrders: affectedCount, effect: 'bonus' };
            saveCriticModifierState();
          }
          showToast('Critic Impressed! 🧐✨', `Perfection! Bonus awarded & +50% boost on next ${affectedCount} orders.`, 'success');
        } else {
          resetCriticCooldownAfterResolution();
          showToast('Critic Impressed! 🧐✨', 'Perfection! Every single ingredient passed inspection.', 'success');
        }
      } else if (isVip) {
        showToast('VIP Served! 👑', `${currentActiveOrder.name} complete with tip!`, 'success');
      } else if (modestForgivesFlaw) {
        showToast('Modest Customer 😇', `${currentActiveOrder.name} accepted without penalty!`, 'success');
      } else if (isMixedOrderMatch && discrepancies === 1) {
        showToast('Charm Saved You! ✨', 'Mixed layer order accepted with Charm!', 'success');
      } else if (discrepancies > 0) {
        showToast('Order Accepted with Flaws', `${discrepancies}/3 recipe discrepancies — reward reduced.`, 'warning');
      } else {
        showToast('Order Complete!', `${currentActiveOrder.name} served successfully!`, 'success');
      }

      if (currentGameMode === 'turbo') {
        triggerRandomOrder();
      } else {
        currentActiveOrder = null;
        localStorage.removeItem(getModeKey('current_active_order'));
      }

      finishBurgerAnimation();
    } else {
      playSound(SOUNDS.wrongOrder);
      let penalty = 0;

      if (currentGameMode !== 'sandbox') {
        const poisonPenalty = Math.round(cost * getPoisonPenaltyMultiplier() * penaltyFactor * 100) / 100;
        const criticFailPenalty = Math.round((getCriticBonusOrFineAmount(cost) + cost * 0.5) * penaltyFactor * 100) / 100;

        if (isCritic && isPoisoned) {
          penalty = Math.round((criticFailPenalty + poisonPenalty) * 100) / 100;
          const affectedCount = getCriticAffectedOrdersCount();
          if (affectedCount > 0) {
            criticModifierState = { remainingOrders: affectedCount, effect: 'penalty' };
            saveCriticModifierState();
          }
        } else if (isCritic) {
          penalty = criticFailPenalty;
          const affectedCount = getCriticAffectedOrdersCount();
          if (affectedCount > 0) {
            criticModifierState = { remainingOrders: affectedCount, effect: 'penalty' };
            saveCriticModifierState();
          }
        } else if (isPoisoned) {
          penalty = poisonPenalty;
        } else {
          penalty = Math.round((cost / 2) * penaltyFactor * 100) / 100;
        }

        playerMoney -= penalty;
        updateMoneyDisplay(penalty, false);
      }

      if (isCritic && isPoisoned) {
        const affectedCount = getCriticAffectedOrdersCount();
        resetCriticCooldownAfterResolution();
        showToast('Critic Poisoned! 🧐🤢', currentGameMode === 'sandbox' ? 'The Critic got food poisoning!' : `Critic fine + poisoning penalty (-$${penalty.toFixed(2)}) & 50% off next ${affectedCount} orders!`, 'error');
      } else if (isCritic) {
        const affectedCount = getCriticAffectedOrdersCount();
        resetCriticCooldownAfterResolution();
        showToast('Critic Disappointed! 🧐', currentGameMode === 'sandbox' ? 'The Critic rejected the burger!' : `Fine -$${penalty.toFixed(2)} & 50% off next ${affectedCount} orders.`, 'error');
      } else if (isPoisoned) {
        showToast('Food Poisoning! 🤢', `Client got sick! Penalty: -$${penalty.toFixed(2)}`, 'error');
      } else if (capriciousComplains) {
        showToast('Capricious Complaint! 😤', `Customer complained! -$${penalty.toFixed(2)} penalty`, 'error');
      } else {
        showToast('Order Rejected!', currentGameMode === 'sandbox' ? `Too many recipe mismatches (${discrepancies} > 3)!` : `Too many mismatches (${discrepancies} > 3)! -$${penalty.toFixed(2)} penalty`, 'error');
      }

      if (!isCritic) {
        consumeCriticModifierAfterOrder();
      }
      advanceToNextOrderAfterResolution();
      finishBurgerAnimation();
    }
  };

  const _origApplyGameMode = applyGameMode;
  applyGameMode = function(mode) {
    _origApplyGameMode(mode);
    loadCriticModifierState();
    updateCriticModifierBadge();
    if (currentActiveOrder) {
      if (currentGameMode === 'turbo') {
        updateOrderWidgetsText(currentActiveOrder.name, formatTime(currentTurboTimeLeft));
      } else {
        updateOrderWidgetsText(currentActiveOrder.name);
      }
      startIndecisiveDiceLoop();
    } else if (indecisiveDiceInterval) {
      clearInterval(indecisiveDiceInterval);
      indecisiveDiceInterval = null;
    }
  };

  loadCriticModifierState();
  if (currentActiveOrder && getCurrentSpeed() !== 'no-orders') {
    if (currentGameMode === 'turbo') {
      updateOrderWidgetsText(currentActiveOrder.name, formatTime(currentTurboTimeLeft));
    } else {
      updateOrderWidgetsText(currentActiveOrder.name);
    }
    startIndecisiveDiceLoop();
  }
  updateCriticModifierBadge();

});
