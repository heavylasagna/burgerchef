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
  if (isNaN(musicVolumeLevel)) musicVolumeLevel = 0.3;

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
  }
  initOpacityToggle();

  const MAX_INGREDIENTS = 30;
  const TURBO_BASE_PATIENCE = 150; // 2.5 минуты
  let currentGameMode = localStorage.getItem('burger_game_mode') || 'casual';

  function getModeKey(baseKey) {
    return `${baseKey}_${currentGameMode}`;
  }

  // --- UPGRADES DEFINITIONS & STATE ---
  const UPGRADES_CONFIG = {
    extraSlots: {
      id: 'extraSlots',
      name: 'Extra slots',
      emoji: '🧩',
      maxLevel: 3,
      prices: [35, 95, 220],
      descriptions: [
        '+1 slot on Grill, Board & Sink (3 → 4)',
        '+2 slots on Grill, Board & Sink (3 → 5)',
        '+3 slots on Grill, Board & Sink (3 → 6)'
      ],
      summary: 'Adds extra cooking, cutting & washing slots'
    },
    speedUp: {
      id: 'speedUp',
      name: 'Speed up',
      emoji: '⚡',
      maxLevel: 3,
      prices: [40, 110, 260],
      descriptions: [
        '-30% cooking, chopping & washing time',
        '-60% cooking, chopping & washing time',
        'Instant finish (still needs click to collect)'
      ],
      summary: 'Speeds up grilling, cutting & washing'
    },
    slowBurn: {
      id: 'slowBurn',
      name: 'Slow burn',
      emoji: '🛡️',
      maxLevel: 3,
      prices: [30, 80, 190],
      descriptions: [
        '+50% time before food burns on grill',
        '+150% time before food burns on grill',
        'No burning on grill & no timer when ready'
      ],
      summary: 'Extends grill burn time & prevents charring'
    },
    charm: {
      id: 'charm',
      name: 'Charm',
      emoji: '✨',
      maxLevel: 3,
      prices: [50, 130, 310],
      descriptions: [
        '+15s Turbo timer & 30% charm chance',
        '+30s Turbo timer, softer mismatch & 55% chance',
        '+45s Turbo timer, softer poisoning & 80% chance'
      ],
      summary: 'Boosts Turbo patience & softens order mistakes'
    }
  };

  let upgradesState = {
    extraSlots: 0,
    speedUp: 0,
    slowBurn: 0,
    charm: 0
  };

  function getDefaultUpgradesState() {
    return { extraSlots: 0, speedUp: 0, slowBurn: 0, charm: 0 };
  }

  function loadUpgradesState() {
    const saved = JSON.parse(localStorage.getItem(getModeKey('burger_upgrades'))) || {};
    upgradesState = {
      extraSlots: Math.max(0, Math.min(3, parseInt(saved.extraSlots, 10) || 0)),
      speedUp: Math.max(0, Math.min(3, parseInt(saved.speedUp, 10) || 0)),
      slowBurn: Math.max(0, Math.min(3, parseInt(saved.slowBurn, 10) || 0)),
      charm: Math.max(0, Math.min(3, parseInt(saved.charm, 10) || 0))
    };
  }

  function saveUpgradesState() {
    localStorage.setItem(getModeKey('burger_upgrades'), JSON.stringify(upgradesState));
  }

  function getUpgradeLevel(key) {
    return upgradesState[key] || 0;
  }

  function getSlotCountForCurrentMode() {
    return 3 + getUpgradeLevel('extraSlots');
  }

  function syncSlotsArrayLength(arr) {
    const targetLen = getSlotCountForCurrentMode();
    if (!Array.isArray(arr)) return Array(targetLen).fill(null);
    if (arr.length < targetLen) {
      return [...arr, ...Array(targetLen - arr.length).fill(null)];
    }
    if (arr.length > targetLen) {
      return arr.slice(0, targetLen);
    }
    return arr;
  }

  function syncAllStationSlotsLength() {
    grillSlots = syncSlotsArrayLength(grillSlots);
    boardSlots = syncSlotsArrayLength(boardSlots);
    sinkSlots = syncSlotsArrayLength(sinkSlots);
    saveGrillState();
    saveBoardState();
    saveSinkState();
  }

  function getProcessDuration(baseSeconds) {
    const lvl = getUpgradeLevel('speedUp');
    if (lvl === 1) return baseSeconds * 0.7;
    if (lvl === 2) return baseSeconds * 0.4;
    if (lvl >= 3) return 0;
    return baseSeconds;
  }

  function getBurnDuration(baseBurnSeconds) {
    const lvl = getUpgradeLevel('slowBurn');
    if (lvl === 1) return baseBurnSeconds * 1.5;
    if (lvl === 2) return baseBurnSeconds * 2.5;
    if (lvl >= 3) return Infinity;
    return baseBurnSeconds;
  }

  function getTurboPatienceDuration() {
    const charmLvl = getUpgradeLevel('charm');
    let bonus = 0;
    if (charmLvl === 1) bonus = 15;
    else if (charmLvl === 2) bonus = 30;
    else if (charmLvl >= 3) bonus = 45;
    return TURBO_BASE_PATIENCE + bonus;
  }

  function getCharmSuccessChance() {
    const charmLvl = getUpgradeLevel('charm');
    if (charmLvl === 1) return 0.30;
    if (charmLvl === 2) return 0.55;
    if (charmLvl >= 3) return 0.80;
    return 0;
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
  let currentTurboTimeLeft = TURBO_BASE_PATIENCE;
  let dailyQuestsData = null;

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
    loadUpgradesState();

    const expectedLen = getSlotCountForCurrentMode();
    grillSlots = syncSlotsArrayLength(JSON.parse(localStorage.getItem(getModeKey('burger_grill_slots'))) || Array(expectedLen).fill(null));
    boardSlots = syncSlotsArrayLength(JSON.parse(localStorage.getItem(getModeKey('burger_board_slots'))) || Array(expectedLen).fill(null));
    sinkSlots = syncSlotsArrayLength(JSON.parse(localStorage.getItem(getModeKey('burger_sink_slots'))) || Array(expectedLen).fill(null));
    currentActiveOrder = JSON.parse(localStorage.getItem(getModeKey('current_active_order'))) || null;

    timeUntilNextOrder = parseInt(localStorage.getItem(getModeKey('time_until_next_order')), 10);
    if (isNaN(timeUntilNextOrder)) timeUntilNextOrder = 120;

    currentTurboTimeLeft = getTurboPatienceDuration();
    dailyQuestsData = JSON.parse(localStorage.getItem(getModeKey('burger_daily_quests'))) || null;
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
    let baseMult = 1.5;
    if (currentGameMode === 'turbo') {
      baseMult = 2.0;
    } else {
      const speedMultiplier = getOrderMultiplier();
      baseMult = Math.round(1.5 * (0.75 + 0.25 * speedMultiplier) * 100) / 100;
    }
    if (getUpgradeLevel('charm') >= 3) {
      baseMult = Math.round(baseMult * 0.5 * 100) / 100;
    }
    return baseMult;
  }

  function getQuestRewardMultiplier() {
    if (currentGameMode === 'sandbox') return 1.0;
    if (currentGameMode === 'turbo') return 1.25;
    return getOrderMultiplier();
  }

  function getPartialMatchRewardFactor() {
    let factor = 0.78;
    if (currentGameMode === 'sandbox') {
      factor = 0.85;
    } else {
      const speedMult = getOrderMultiplier();
      factor = currentGameMode === 'turbo'
        ? 0.78
        : Math.min(0.92, Math.max(0.70, 0.72 + (speedMult - 1.0) * 0.15));
    }
    if (getUpgradeLevel('charm') >= 2) {
      factor = Math.min(0.98, Math.round((factor + (1 - factor) * 0.6) * 100) / 100);
    }
    return factor;
  }

  function getAssemblyAvailableStock(itemId) {
    const cookedCount = ingredientStock[itemId] ?? 0;
    const rawId = ASSEMBLY_RAW_FALLBACK[itemId];
    const rawCount = rawId ? (ingredientStock[rawId] ?? 0) : 0;
    return cookedCount + rawCount;
  }

  // Базовое время увеличено на +5 секунд для всех действий (жарка, нарезка, мытьё)
  const GRILLABLE_ITEMS = {
    'raw-beef-patty': {
      name: 'Beef Patty',
      menuImage: 'images/raw-beef-patty.png',
      rawImage: 'images/raw-beef-patty.png',
      flip1Image: 'images/beef-patty-flip1.png',
      flip2Image: 'images/beef-patty-flip2.png',
      cookedId: 'beef-patty',
      cookedImage: 'images/beef-patty.png',
      needsFlip: true, cookTime: 17, burnTime: 8, category: 'patty'
    },
    'raw-chicken-patty': {
      name: 'Chicken Patty',
      menuImage: 'images/raw-chicken-patty.png',
      rawImage: 'images/raw-chicken-patty.png',
      flip1Image: 'images/chicken-patty-flip1.png',
      flip2Image: 'images/chicken-patty-flip2.png',
      cookedId: 'chicken-patty',
      cookedImage: 'images/chicken-patty.png',
      needsFlip: true, cookTime: 17, burnTime: 8, category: 'patty'
    },
    'raw-fish-patty': {
      name: 'Fish Patty',
      menuImage: 'images/raw-fish-patty.png',
      rawImage: 'images/raw-fish-patty.png',
      flip1Image: 'images/fish-patty-flip1.png',
      flip2Image: 'images/fish-patty-flip2.png',
      cookedId: 'fish-patty',
      cookedImage: 'images/fish-patty.png',
      needsFlip: true, cookTime: 17, burnTime: 8, category: 'patty'
    },
    'raw-hashbrown': {
      name: 'Hashbrown',
      menuImage: 'images/raw-hashbrown.png',
      rawImage: 'images/raw-hashbrown.png',
      flip1Image: 'images/hashbrown-flip1.png',
      flip2Image: 'images/hashbrown-flip2.png',
      cookedId: 'hashbrown',
      cookedImage: 'images/hashbrown.png',
      needsFlip: true, cookTime: 15, burnTime: 7, category: 'patty'
    },
    'raw-bacon': {
      name: 'Bacon',
      menuImage: 'images/raw-bacon.png',
      rawImage: 'images/raw-bacon.png',
      flip1Image: 'images/raw-bacon.png',
      flip2Image: 'images/fried-bacon.png',
      cookedId: 'fried-bacon',
      cookedImage: 'images/fried-bacon.png',
      needsFlip: false, cookTime: 13, burnTime: 6, category: 'protein'
    },
    'raw-egg': {
      name: 'Egg',
      menuImage: 'images/egg.png',
      rawImage: 'images/raw-egg.png',
      flip1Image: 'images/raw-egg.png',
      flip2Image: 'images/fried-egg.png',
      cookedId: 'fried-egg',
      cookedImage: 'images/fried-egg.png',
      needsFlip: false, cookTime: 13, burnTime: 6, category: 'protein'
    },
    'raw-champignons': {
      name: 'Champignons',
      menuImage: 'images/raw-champignons.png',
      rawImage: 'images/raw-champignons.png',
      flip1Image: 'images/raw-champignons.png',
      flip2Image: 'images/champignons.png',
      cookedId: 'champignons',
      cookedImage: 'images/champignons.png',
      needsFlip: false, cookTime: 13, burnTime: 6, category: 'vegetables'
    },
    'raw-cheese': {
      name: 'Cheese',
      menuImage: 'images/raw-cheese.png',
      rawImage: 'images/raw-cheese.png',
      flip1Image: 'images/raw-cheese.png',
      flip2Image: 'images/cheese.png',
      cookedId: 'cheese',
      cookedImage: 'images/cheese.png',
      needsFlip: false, cookTime: 11, burnTime: 5, category: 'protein'
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
      cutTime: 11,
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
      cutTime: 10,
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
      cutTime: 10,
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
      cutTime: 10,
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
      cutTime: 10,
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
      cutTime: 10,
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
      cutTime: 11,
      category: 'protein',
      canBeDirty: false
    }
  };

  const SINK_WASHABLE_ITEMS = {
    'unwashed-uncut-lettuce': { name: 'Lettuce', rawImage: 'images/uncut-lettuce.png', washedId: 'uncut-lettuce', washedImage: 'images/uncut-lettuce.png', washTime: 10, category: 'vegetables' },
    'unwashed-uncut-tomato': { name: 'Tomato', rawImage: 'images/uncut-tomato.png', washedId: 'uncut-tomato', washedImage: 'images/uncut-tomato.png', washTime: 10, category: 'fruit' },
    'unwashed-uncut-pickles': { name: 'Pickles', rawImage: 'images/uncut-pickles.png', washedId: 'uncut-pickles', washedImage: 'images/uncut-pickles.png', washTime: 10, category: 'vegetables' },
    'unwashed-uncut-red-onion': { name: 'Red Onion', rawImage: 'images/uncut-red-onion.png', washedId: 'uncut-red-onion', washedImage: 'images/uncut-red-onion.png', washTime: 10, category: 'vegetables' },
    'unwashed-uncut-white-onion': { name: 'White Onion', rawImage: 'images/uncut-white-onion.png', washedId: 'uncut-white-onion', washedImage: 'images/uncut-white-onion.png', washTime: 10, category: 'vegetables' },
    'unwashed-uncut-champignons': { name: 'Champignons', rawImage: 'images/uncut-champignons.png', washedId: 'uncut-champignons', washedImage: 'images/uncut-champignons.png', washTime: 10, category: 'vegetables' }
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

  function initSinkStructure() {
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
    const emptyIndex = sinkSlots.findIndex(slot => slot === null);
    if (emptyIndex === -1) { showToast('Sink is full!', '', 'warning'); return; }

    if (currentGameMode !== 'sandbox') {
      ingredientStock[unwashedId] = (ingredientStock[unwashedId] ?? 0) - 1;
      saveStock();
    }

    const isInstant = getUpgradeLevel('speedUp') >= 3;
    sinkSlots[emptyIndex] = {
      unwashedId,
      state: isInstant ? 'ready' : 'idle',
      startTime: null,
      notified: isInstant
    };
    if (isInstant) playSound(SOUNDS.notification);
    else playSound(SOUNDS.ingridients);

    saveSinkState();
    renderSinkUnwashedMenu();
    renderSink();
  }

  function startWashingSlot(index) {
    const slot = sinkSlots[index];
    if (!slot || slot.state !== 'idle') return;

    const config = SINK_WASHABLE_ITEMS[slot.unwashedId];
    const duration = getProcessDuration(config.washTime);

    if (duration <= 0) {
      slot.state = 'ready';
      slot.startTime = null;
      slot.notified = true;
      playSound(SOUNDS.notification);
      saveSinkState();
      renderSink();
      return;
    }

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
      if (slot.state === 'washing') {
        activeWashingCount++;
        const config = SINK_WASHABLE_ITEMS[slot.unwashedId];
        const duration = getProcessDuration(config.washTime);
        const elapsed = (now - slot.startTime) / 1000;
        if (duration <= 0 || elapsed >= duration) {
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
    const duration = getProcessDuration(config.washTime);
    if (duration <= 0) return 100;
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
    updateStationNotificationDots();
  }

  setInterval(() => {
    updateSinkLogic();
    if (currentScreen === 'sink') renderSink();
    else updateStationNotificationDots();
  }, 50);

  function initBoardStructure() {
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
    const emptyIndex = boardSlots.findIndex(slot => slot === null);
    if (emptyIndex === -1) { showToast('Board is full!', '', 'warning'); return; }

    const itemConfig = BOARD_PRODUCE_ITEMS[produceKey];
    if (!itemConfig) return;

    const consumed = consumeBoardProducePreferClean(itemConfig);
    if (!consumed) {
      showToast('Out of stock!', 'Buy more in shop.', 'warning');
      return;
    }

    const isInstant = getUpgradeLevel('speedUp') >= 3;
    boardSlots[emptyIndex] = {
      produceKey,
      state: isInstant ? 'ready' : 'uncut',
      startTime: null,
      notified: isInstant,
      isDirty: consumed.isDirty
    };
    if (isInstant) playSound(SOUNDS.notification);
    else playSound(SOUNDS.ingridients);

    saveBoardState();
    renderBoardUncutMenu();
    renderBoard();
  }

  function startCuttingSlot(index) {
    const slot = boardSlots[index];
    if (!slot || slot.state !== 'uncut') return;

    const config = getBoardItemConfig(slot);
    if (!config) return;
    const duration = getProcessDuration(config.cutTime);

    if (duration <= 0) {
      slot.state = 'ready';
      slot.startTime = null;
      slot.notified = true;
      playSound(SOUNDS.notification);
      saveBoardState();
      renderBoard();
      return;
    }

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
      if (slot.state === 'cutting') {
        const config = getBoardItemConfig(slot);
        if (!config) return;
        const duration = getProcessDuration(config.cutTime);
        const elapsed = (now - slot.startTime) / 1000;
        if (duration <= 0 || elapsed >= duration) {
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
    const duration = getProcessDuration(config.cutTime);
    if (duration <= 0) return 100;
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
  function initGrillStructure() {
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

  function addToGrill(rawId) {
    const emptyIndex = grillSlots.findIndex(slot => slot === null);
    if (emptyIndex === -1) { showToast('Grill is full!', '', 'warning'); return; }

    if (currentGameMode !== 'sandbox') {
      ingredientStock[rawId] = (ingredientStock[rawId] ?? 0) - 1;
      saveStock();
    }

    const config = GRILLABLE_ITEMS[rawId];
    const isInstant = getUpgradeLevel('speedUp') >= 3;

    grillSlots[emptyIndex] = {
      rawId,
      state: isInstant ? (config.needsFlip ? 'needsFlip' : 'ready') : 'raw1',
      startTime: isInstant ? null : Date.now(),
      notified: isInstant
    };
    if (isInstant) playSound(SOUNDS.notification);
    else playSound(SOUNDS.ingridients);

    saveGrillState();
    renderGrillIngredientsMenu();
    renderGrill();
  }

  function manageSizzlingAudio(isPlaying) {
    if (isPlaying) {
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

  function updateGrillLogic() {
    const now = Date.now();
    let needsSave = false;
    let activeCookingCount = 0;

    grillSlots.forEach((slot) => {
      if (!slot) return;
      const config = GRILLABLE_ITEMS[slot.rawId];
      if (!config) return;

      const phaseDuration = getProcessDuration(config.cookTime);
      const burnDuration = getBurnDuration(config.burnTime);

      if (slot.state === 'raw1') {
        activeCookingCount++;
        const elapsed = (now - slot.startTime) / 1000;
        if (phaseDuration <= 0 || elapsed >= phaseDuration) {
          if (config.needsFlip) {
            slot.state = 'needsFlip';
            slot.flipWaitStartTime = now;
            if (!slot.notified) {
              playSound(SOUNDS.notification);
              slot.notified = true;
            }
          } else {
            slot.state = 'ready';
            slot.readyStartTime = now;
            if (!slot.notified) {
              playSound(SOUNDS.notification);
              slot.notified = true;
            }
          }
          needsSave = true;
        }
      } else if (slot.state === 'needsFlip') {
        if (slot.flipWaitStartTime && isFinite(burnDuration)) {
          const waited = (now - slot.flipWaitStartTime) / 1000;
          if (waited >= burnDuration) {
            slot.state = 'burnt';
            playSound(SOUNDS.burnt);
            needsSave = true;
          }
        }
      } else if (slot.state === 'raw2') {
        activeCookingCount++;
        const elapsed = (now - slot.startTime) / 1000;
        if (phaseDuration <= 0 || elapsed >= phaseDuration) {
          slot.state = 'ready';
          slot.readyStartTime = now;
          if (!slot.notified) {
            playSound(SOUNDS.notification);
            slot.notified = true;
          }
          needsSave = true;
        }
      } else if (slot.state === 'ready') {
        if (slot.readyStartTime && isFinite(burnDuration)) {
          const waited = (now - slot.readyStartTime) / 1000;
          if (waited >= burnDuration) {
            slot.state = 'burnt';
            playSound(SOUNDS.burnt);
            needsSave = true;
          }
        }
      }
    });

    if (activeCookingCount === 0) manageSizzlingAudio(false);
    if (needsSave) saveGrillState();
  }

  function getGrillSlotProgress(slot) {
    if (!slot) return { percent: 0, isBurning: false };
    const config = GRILLABLE_ITEMS[slot.rawId];
    if (!config) return { percent: 0, isBurning: false };

    const phaseDuration = getProcessDuration(config.cookTime);
    const burnDuration = getBurnDuration(config.burnTime);
    const now = Date.now();

    if (slot.state === 'raw1') {
      if (phaseDuration <= 0) return { percent: 100, isBurning: false };
      const elapsed = (now - slot.startTime) / 1000;
      return { percent: Math.min(100, (elapsed / phaseDuration) * 100), isBurning: false };
    }
    if (slot.state === 'needsFlip') {
      if (!isFinite(burnDuration)) return { percent: 0, isBurning: false };
      const waited = (now - (slot.flipWaitStartTime || now)) / 1000;
      return { percent: Math.min(100, (waited / burnDuration) * 100), isBurning: true };
    }
    if (slot.state === 'raw2') {
      if (phaseDuration <= 0) return { percent: 100, isBurning: false };
      const elapsed = (now - slot.startTime) / 1000;
      return { percent: Math.min(100, (elapsed / phaseDuration) * 100), isBurning: false };
    }
    if (slot.state === 'ready') {
      if (!isFinite(burnDuration)) return { percent: 0, isBurning: false };
      const waited = (now - (slot.readyStartTime || now)) / 1000;
      return { percent: Math.min(100, (waited / burnDuration) * 100), isBurning: true };
    }
    return { percent: 0, isBurning: false };
  }

  function handleGrillSlotClick(index) {
    const slot = grillSlots[index];
    if (!slot) return;
    const config = GRILLABLE_ITEMS[slot.rawId];
    if (!config) return;

    if (slot.state === 'needsFlip') {
      const duration = getProcessDuration(config.cookTime);
      if (duration <= 0) {
        slot.state = 'ready';
        slot.startTime = null;
        slot.readyStartTime = Date.now();
        slot.notified = true;
        playSound(SOUNDS.notification);
      } else {
        slot.state = 'raw2';
        slot.startTime = Date.now();
        slot.notified = false;
        playSound(SOUNDS.chop);
      }
      saveGrillState();
      renderGrill();
    } else if (slot.state === 'ready') {
      ingredientStock[config.cookedId] = (ingredientStock[config.cookedId] ?? 0) + 1;
      saveStock();
      playSound(SOUNDS.buttons);
      trackQuestProgress('cook_patties', 1);

      grillSlots[index] = null;
      saveGrillState();
      renderGrillCookedInventory();
      renderGrill();
    } else if (slot.state === 'burnt') {
      playSound(SOUNDS.bin);
      grillSlots[index] = null;
      saveGrillState();
      renderGrill();
    }
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

    const slotElements = area.querySelectorAll('.grill-slot');
    let hasActiveCooking = false;

    grillSlots.forEach((slotData, index) => {
      const slotEl = slotElements[index];
      if (!slotEl) return;

      slotEl.className = `grill-slot ${selectedGrillIndicesForBin.includes(index) ? 'selected-for-bin' : ''}`;

      if (slotData) {
        const config = GRILLABLE_ITEMS[slotData.rawId];
        if (!config) return;
        let imgSrc = config.rawImage;
        let imgClass = 'grill-item';
        let extraHtml = '';
        let splashesHtml = '';

        if (slotData.state === 'raw1') {
          hasActiveCooking = true;
          imgSrc = config.rawImage;
        } else if (slotData.state === 'needsFlip') {
          imgSrc = config.flip1Image || config.cookedImage;
          extraHtml = `<div class="flip-badge">Flip!</div>`;
        } else if (slotData.state === 'raw2') {
          hasActiveCooking = true;
          imgSrc = config.flip2Image || config.cookedImage;
        } else if (slotData.state === 'ready') {
          imgSrc = config.cookedImage;
          extraHtml = `<div class="flip-badge" style="background:#689f38; color:#fff; top:auto; bottom:4px; right:4px; left:auto;">Collect!</div>`;
        } else if (slotData.state === 'burnt') {
          imgSrc = config.cookedImage;
          imgClass = 'grill-item charred';
          extraHtml = `<div class="flip-badge" style="background:#d32f2f; color:#fff;">Burn!</div>`;
        }

        if (slotData.state === 'raw1' || slotData.state === 'raw2') {
          for (let i = 0; i < 6; i++) {
            const leftPos = 10 + Math.random() * 70;
            const animDelay = Math.random() * 0.4;
            const dy = -(12 + Math.random() * 12);
            splashesHtml += `<div class="oil-splash" style="left: ${leftPos}px; animation-delay: ${animDelay}s; --dy: ${dy}px;"></div>`;
          }
        }

        const progressInfo = getGrillSlotProgress(slotData);
        const barColorClass = progressInfo.isBurning ? 'burning' : '';
        const progressHtml = (slotData.state === 'burnt') ? '' : `
          <div class="grill-progress-container">
            <div class="grill-progress-bar ${barColorClass}" style="width: ${progressInfo.percent}%"></div>
          </div>
        `;

        slotEl.innerHTML = `
          ${extraHtml}
          <div class="grill-item-wrapper">
            <img src="${imgSrc}" class="${imgClass}">
            <div class="oil-splash-container">${splashesHtml}</div>
          </div>
          ${progressHtml}
        `;
      } else {
        slotEl.innerHTML = '';
      }
    });

    manageSizzlingAudio(hasActiveCooking);
    updateStationNotificationDots();
  }

  setInterval(() => {
    updateGrillLogic();
    if (currentScreen === 'grill') renderGrill();
    else updateStationNotificationDots();
  }, 50);

  function addIngredient(item) {
    if (currentBurger.length >= MAX_INGREDIENTS || isEating || isAddingInProgress) return;
    const consumed = consumeAssemblyIngredient(item.id);
    if (!consumed) {
      showToast('Out of stock!', `Buy more ${item.name} in shop.`, 'warning');
      return;
    }

    isAddingInProgress = true;
    playSound(SOUNDS.ingridients);
    const isTopBun = item.id === 'top-bun';
    const isBottomBun = item.id === 'bottom-bun';
    const isRawCheese = item.id === 'raw-cheese' || (consumed.isRaw && consumed.rawId === 'raw-cheese');
    const resolvedImage = consumed.displayImage || resolveLayerDisplayImage(item.id, item.image, consumed.isRaw, consumed.rawId);

    const newLayer = {
      uid: Date.now() + Math.random(),
      id: item.id,
      name: item.name,
      image: resolvedImage,
      type: 'ingredient',
      isTopBun,
      isBottomBun,
      isRawCheese,
      isDirty: consumed.isDirty,
      isRaw: consumed.isRaw,
      rawId: consumed.rawId,
      stockKey: consumed.stockKey,
      isNew: true
    };

    if (isTopBun) currentBurger.push(newLayer);
    else if (isBottomBun) currentBurger.unshift(newLayer);
    else {
      const topBunIndex = currentBurger.findIndex(layer => layer.isTopBun);
      if (topBunIndex !== -1) currentBurger.splice(topBunIndex, 0, newLayer);
      else currentBurger.push(newLayer);
    }

    saveBurgerState();
    updateBurgerDisplay(true);
    renderIngredientsMenu();
    setTimeout(() => { isAddingInProgress = false; }, 100);
  }

  function addSauce(sauce) {
    if (currentBurger.length >= MAX_INGREDIENTS || isEating || isAddingInProgress) return;
    if (currentGameMode !== 'sandbox') {
      const count = ingredientStock[sauce.id] ?? 0;
      if (count <= 0) { showToast('Out of stock!', `Buy more ${sauce.name} in shop.`, 'warning'); return; }
      ingredientStock[sauce.id] = count - 1;
      saveStock();
    }

    isAddingInProgress = true;
    playSound(SOUNDS.sauce);
    const newSauce = {
      uid: Date.now() + Math.random(),
      id: sauce.id,
      name: sauce.name,
      image: sauce.image,
      type: 'sauce',
      stockKey: sauce.id,
      isNew: true
    };

    const topBunIndex = currentBurger.findIndex(layer => layer.isTopBun);
    if (topBunIndex !== -1) currentBurger.splice(topBunIndex, 0, newSauce);
    else currentBurger.push(newSauce);

    saveBurgerState();
    updateBurgerDisplay(true);
    renderSauces();
    setTimeout(() => { isAddingInProgress = false; }, 100);
  }

  function moveLayer(index, direction) {
    if (isEating) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= currentBurger.length) return;
    playSound(SOUNDS.buttons);
    const temp = currentBurger[index];
    currentBurger[index] = currentBurger[targetIndex];
    currentBurger[targetIndex] = temp;
    currentBurger[index].isNew = false;
    currentBurger[targetIndex].isNew = false;
    saveBurgerState();
    updateBurgerDisplay(false);
  }

  function removeLayer(index) {
    if (isEating) return;
    playSound(SOUNDS.buttons);
    const removed = currentBurger.splice(index, 1)[0];
    returnBurgerLayerToStock(removed);
    saveBurgerState();
    updateBurgerDisplay(false);
    renderIngredientsMenu();
    renderSauces();
  }

  function updateBurgerDisplay(animateNew = false) {
    if (currentScreen !== 'assembly') return;
    const burgerWrapper = document.querySelector('.burger-wrapper');
    if (!burgerWrapper) return;
    let stackEl = document.getElementById('burgerStack');
    if (!stackEl) {
      stackEl = document.createElement('div');
      stackEl.id = 'burgerStack';
      stackEl.className = 'burger-stack';
      burgerWrapper.appendChild(stackEl);
    }

    stackEl.innerHTML = '';
    if (layersList) {
      layersList.innerHTML = '';
      layersList.classList.add('assembly-mode');
    }

    const total = currentBurger.length;
    const layersTitle = document.getElementById('layersTitle');
    if (layersTitle) layersTitle.innerText = `Layers (${total}/${MAX_INGREDIENTS})`;
    if (limitWarning) limitWarning.classList.toggle('show', total >= MAX_INGREDIENTS);

    const existingImages = Array.from(stackEl.querySelectorAll('.burger-layer-img'));
    const currentUids = currentBurger.map(l => l.uid);
    existingImages.forEach(img => {
      if (!currentUids.includes(img.dataset.uid)) img.remove();
    });

    currentBurger.forEach((layer, index) => {
      const layerDisplayImg = resolveLayerDisplayImage(layer.id, layer.image, layer.isRaw, layer.rawId);
      const imgEl = document.createElement('img');
      imgEl.src = layerDisplayImg;
      imgEl.dataset.uid = layer.uid;
      imgEl.className = 'burger-layer-img';

      if (layer.isRawCheese) {
        imgEl.classList.add('raw-cheese-layer');
      }

      if (layer.isDirty) {
        imgEl.classList.add('unwashed-filter');
      }

      if (layer.isNew && animateNew) {
        imgEl.classList.add('new-layer');
        layer.isNew = false;
      }

      let overlap = 26;
      if (layer.type === 'sauce') overlap = 15;
      else if (layer.id === 'cheese' || layer.id === 'lettuce') overlap = 18;
      else if (layer.id === 'top-bun' || layer.id === 'bottom-bun') overlap = 22;

      if (layer.isRawCheese) {
        imgEl.style.marginTop = '0px';
        imgEl.style.marginBottom = '-46px';
        imgEl.style.setProperty('--sq-offset', '6px');
      } else if (index > 0) {
        imgEl.style.marginTop = `-${overlap}px`;
        const sqVal = Math.max(4, Math.floor(overlap * 0.45));
        imgEl.style.setProperty('--sq-offset', `${sqVal}px`);
      }

      imgEl.style.zIndex = index + 1;
      if (isSqueezed) imgEl.classList.add('squeezed');

      stackEl.appendChild(imgEl);

      if (layersList) {
        const itemEl = document.createElement('div');
        itemEl.className = 'layer-item';
        const isFirst = index === 0;
        const isLast = index === total - 1;
        const previewDirtyClass = layer.isDirty ? 'unwashed-filter' : '';

        itemEl.innerHTML = `
          <img src="${layerDisplayImg}" class="layer-preview ${previewDirtyClass}">
          <div class="layer-controls">
            <button class="btn-control" onclick="moveLayer(${index}, 1)" ${isLast ? 'disabled' : ''}>▲</button>
            <button class="btn-control" onclick="moveLayer(${index}, -1)" ${isFirst ? 'disabled' : ''}>▼</button>
            <button class="btn-control delete" onclick="removeLayer(${index})">✕</button>
          </div>
        `;
        layersList.appendChild(itemEl);
      }
    });

    if (layersList) layersList.scrollTop = layersList.scrollHeight;
  }

  function renderSauces() {
    [desktopSaucesGroup, mobileSaucesGroup].forEach(group => {
      if (!group) return;
      group.innerHTML = '';
      SAUCES.forEach(s => {
        const chip = document.createElement('button');
        chip.className = 'sauce-chip';
        const count = ingredientStock[s.id] ?? 0;
        const isOut = currentGameMode !== 'sandbox' && count <= 0;
        if (currentBurger.length >= MAX_INGREDIENTS || isEating || isOut) chip.classList.add('disabled');
        chip.innerText = currentGameMode === 'sandbox' ? s.name : `${s.name} (x${count})`;
        chip.onclick = () => {
          if (isOut) { showToast('Out of stock!', `Buy more ${s.name} in shop.`, 'warning'); return; }
          addSauce(s);
        };
        group.appendChild(chip);
      });
    });
  }

  function evaluateBurgerPoisonRisk(burgerLayers) {
    let highestChance = 0;
    let triggeredItem = null;

    burgerLayers.forEach(layer => {
      if (!layer) return;
      let chance = 0;
      let label = layer.name || layer.id;

      if (layer.isDirty) {
        chance = Math.max(chance, 0.30);
      }
      if (layer.isRaw && layer.rawId && RAW_ITEM_POISON_CHANCE[layer.rawId]) {
        chance = Math.max(chance, RAW_ITEM_POISON_CHANCE[layer.rawId]);
      } else if (RAW_ITEM_POISON_CHANCE[layer.id]) {
        chance = Math.max(chance, RAW_ITEM_POISON_CHANCE[layer.id]);
      }

      if (chance > highestChance) {
        highestChance = chance;
        triggeredItem = label;
      }
    });

    const isPoisoned = highestChance > 0 && Math.random() < highestChance;
    return { isPoisoned, triggeredItem, chance: highestChance };
  }

  const squeezeBtn = document.getElementById('squeezeBtn');
  if (squeezeBtn) {
    squeezeBtn.onclick = () => {
      if (isEating || currentBurger.length === 0) return;
      playSound(SOUNDS.squeeze);
      isSqueezed = !isSqueezed;
      squeezeBtn.style.background = isSqueezed ? 'var(--accent-color)' : '';
      squeezeBtn.style.color = isSqueezed ? '#fff' : '';
      const imgs = document.querySelectorAll('.burger-layer-img');
      imgs.forEach(img => {
        if (isSqueezed) img.classList.add('squeezed');
        else img.classList.remove('squeezed');
      });
    };
  }

  const eatBtn = document.getElementById('eatBtn');
  if (eatBtn) {
    eatBtn.onclick = () => {
      if (isEating || currentBurger.length === 0) return;
      isEating = true;
      playSound(SOUNDS.eating);

      const poisonResult = evaluateBurgerPoisonRisk(currentBurger);
      if (poisonResult.isPoisoned) {
        const penalty = Math.max(5, Math.round(5 * getPoisonPenaltyMultiplier() * 100) / 100);
        if (currentGameMode !== 'sandbox') {
          playerMoney = Math.round((playerMoney - penalty) * 100) / 100;
          updateMoneyDisplay(penalty, false);
        }
        showToast('Food poisoning!', `${poisonResult.triggeredItem} made you sick (-$${penalty.toFixed(2)}).`, 'error');
      }

      const stackEl = document.getElementById('burgerStack');
      if (stackEl) stackEl.classList.add('eating');
      setTimeout(() => {
        currentBurger = [];
        saveBurgerState();
        isSqueezed = false;
        if (squeezeBtn) { squeezeBtn.style.background = ''; squeezeBtn.style.color = ''; }
        if (stackEl) stackEl.classList.remove('eating');
        updateBurgerDisplay(false);
        renderSauces();
        isEating = false;
      }, 2000);
    };
  }

  const resetBtn = document.getElementById('resetBtn');
  if (resetBtn) {
    resetBtn.onclick = () => {
      if (isEating) return;
      if (currentBurger.length === 0) return;

      resetClickCount++;
      playSound(SOUNDS.buttons);

      if (resetClickCount === 1) {
        showToast('Confirm Reset', 'Click trash icon again to clear burger.', 'warning');
        if (resetClickTimeout) clearTimeout(resetClickTimeout);
        resetClickTimeout = setTimeout(() => {
          resetClickCount = 0;
        }, 3000);
      } else {
        if (resetClickTimeout) clearTimeout(resetClickTimeout);
        resetClickCount = 0;

        currentBurger.forEach(layer => returnBurgerLayerToStock(layer));
        currentBurger = [];
        saveBurgerState();
        isSqueezed = false;
        if (squeezeBtn) { squeezeBtn.style.background = ''; squeezeBtn.style.color = ''; }
        updateBurgerDisplay(false);
        renderIngredientsMenu();
        renderSauces();
        playSound(SOUNDS.bin);
        showToast('Burger cleared!', 'Ingredients returned to inventory.', 'success');
      }
    };
  }

  const downloadPngBtn = document.getElementById('downloadPngBtn');
  if (downloadPngBtn) {
    downloadPngBtn.onclick = async () => {
      if (isEating) return;
      if (currentBurger.length === 0) { showToast('Burger is empty!', '', 'warning'); return; }
      playSound(SOUNDS.buttons);
      const stackEl = document.getElementById('burgerStack');
      if (!stackEl || typeof html2canvas === 'undefined') return;
      stackEl.classList.add('capturing-png');
      try {
        const canvas = await html2canvas(stackEl, { backgroundColor: null, scale: 2, useCORS: true });
        const link = document.createElement('a');
        link.download = `burger-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        showToast('PNG Saved!', 'Burger image downloaded.', 'success');
      } catch(e) {
        showToast('Error exporting PNG', '', 'error');
      } finally {
        stackEl.classList.remove('capturing-png');
      }
    };
  }

  // --- DAILY QUESTS ---
  function initDailyQuests() {
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Almaty' });
    if (!dailyQuestsData || dailyQuestsData.date !== todayStr) {
      const shuffled = [...SIMPLE_QUESTS_POOL].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 3);
      dailyQuestsData = {
        date: todayStr,
        quests: selected.map(q => ({
          id: q.id,
          title: q.title,
          target: q.target,
          reward: q.reward,
          type: q.type,
          current: 0,
          completed: false,
          claimed: false
        }))
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
    const hasClaimable = dailyQuestsData.quests.some(q => q.completed && !q.claimed);
    badge.style.display = hasClaimable ? 'block' : 'none';
  }

  function trackQuestProgress(type, amount = 1) {
    if (!dailyQuestsData || !dailyQuestsData.quests) return;
    let changed = false;
    dailyQuestsData.quests.forEach(q => {
      if (q.type === type && !q.completed && !q.claimed) {
        q.current = Math.min(q.target, q.current + amount);
        if (q.current >= q.target) {
          q.completed = true;
          showToast('Quest Completed!', `${q.title} - Claim your reward!`, 'success');
        }
        changed = true;
      }
    });
    if (changed) saveDailyQuests();
  }

  window.claimQuestReward = function(questId) {
    if (!dailyQuestsData || !dailyQuestsData.quests) return;
    const quest = dailyQuestsData.quests.find(q => q.id === questId);
    if (!quest || !quest.completed || quest.claimed) return;

    quest.claimed = true;
    const rawReward = quest.reward * getQuestRewardMultiplier();
    const rewardAmount = Math.round(rawReward * 100) / 100;

    if (currentGameMode !== 'sandbox') {
      playerMoney = Math.round((playerMoney + rewardAmount) * 100) / 100;
      updateMoneyDisplay(rewardAmount, true);
    }

    playSound(SOUNDS.buy);
    showToast('Reward Claimed!', `+$${rewardAmount.toFixed(2)}`, 'success');
    saveDailyQuests();
    renderQuestsModal();
  }

  function renderQuestsModal() {
    const listBody = document.getElementById('questsListBody');
    if (!listBody || !dailyQuestsData) return;
    listBody.innerHTML = '';

    dailyQuestsData.quests.forEach(q => {
      const card = document.createElement('div');
      card.className = `quest-card ${q.completed ? 'completed' : ''}`;
      const progressPct = Math.min(100, (q.current / q.target) * 100);
      const displayReward = Math.round(q.reward * getQuestRewardMultiplier() * 100) / 100;

      card.innerHTML = `
        <div class="quest-header">
          <span class="quest-title">${q.title}</span>
          <span class="quest-reward">+$${displayReward.toFixed(2)}</span>
        </div>
        <div class="quest-progress-info">
          <span>Progress: ${q.current} / ${q.target}</span>
          <span>${q.claimed ? 'Claimed' : (q.completed ? 'Ready!' : 'In progress')}</span>
        </div>
        <div class="quest-progress-track">
          <div class="quest-progress-fill" style="width: ${progressPct}%"></div>
        </div>
        <button class="btn-claim-reward" onclick="claimQuestReward('${q.id}')" ${!q.completed || q.claimed ? 'disabled' : ''}>
          ${q.claimed ? 'Claimed ✓' : 'Claim Reward'}
        </button>
      `;
      listBody.appendChild(card);
    });
  }

  function updateQuestsResetTimer() {
    const timerEl = document.getElementById('questsResetTimer');
    if (!timerEl) return;

    const now = new Date();
    const almatyFormatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Almaty',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    const parts = almatyFormatter.format(now).split(':');
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    const s = parseInt(parts[2], 10) || 0;

    const elapsedToday = h * 3600 + m * 60 + s;
    const remainingSec = Math.max(0, 86400 - elapsedToday);

    const remH = String(Math.floor(remainingSec / 3600)).padStart(2, '0');
    const remM = String(Math.floor((remainingSec % 3600) / 60)).padStart(2, '0');
    const remS = String(remainingSec % 60).padStart(2, '0');

    timerEl.innerText = `${remH}:${remM}:${remS}`;
  }

  setInterval(() => {
    updateQuestsResetTimer();
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Almaty' });
    if (dailyQuestsData && dailyQuestsData.date !== todayStr) {
      initDailyQuests();
      if (document.getElementById('questsModal')?.classList.contains('open')) {
        renderQuestsModal();
      }
    }
  }, 1000);

  // --- RECIPES ---
  const RECIPES = [
    { name: 'Classic Burger', category: 'classic', ingredients: ['bottom-bun', 'beef-patty', 'lettuce', 'tomato', 'pickles', 'top-bun'] },
    { name: 'Cheeseburger', category: 'classic', ingredients: ['bottom-bun', 'beef-patty', 'cheese', 'pickles', 'ketchup', 'mustard', 'top-bun'] },
    { name: 'Double Cheeseburger', category: 'classic', ingredients: ['bottom-bun', 'beef-patty', 'cheese', 'beef-patty', 'cheese', 'pickles', 'ketchup', 'mustard', 'top-bun'] },
    { name: 'Big Burger', category: 'classic', ingredients: ['bottom-bun', 'mayo', 'lettuce', 'beef-patty', 'cheese', 'beef-patty', 'pickles', 'white-onion', 'top-bun'] },
    { name: 'Bacon Cheeseburger', category: 'classic', ingredients: ['bottom-bun', 'beef-patty', 'cheese', 'fried-bacon', 'bbq', 'top-bun'] },
    { name: 'Mushroom Swiss', category: 'classic', ingredients: ['bottom-bun', 'beef-patty', 'champignons', 'cheese', 'mayo', 'top-bun'] },
    { name: 'Crispy Chicken Burger', category: 'chicken', ingredients: ['bottom-bun', 'chicken-patty', 'lettuce', 'mayo', 'top-bun'] },
    { name: 'Spicy Chicken Burger', category: 'chicken', ingredients: ['bottom-bun', 'chicken-patty', 'pickles', 'spicy', 'top-bun'] },
    { name: 'Chicken Bacon Ranch', category: 'chicken', ingredients: ['bottom-bun', 'chicken-patty', 'fried-bacon', 'lettuce', 'tomato', 'mayo', 'top-bun'] },
    { name: 'Fish Burger', category: 'fish', ingredients: ['bottom-bun', 'fish-patty', 'cheese', 'mayo', 'top-bun'] },
    { name: 'Breakfast Burger', category: 'breakfast', ingredients: ['bottom-bun', 'fried-egg', 'fried-bacon', 'hashbrown', 'cheese', 'top-bun'] },
    { name: 'Sunny Side Burger', category: 'breakfast', ingredients: ['bottom-bun', 'beef-patty', 'fried-egg', 'cheese', 'ketchup', 'top-bun'] },
    { name: 'Veggie Burger', category: 'veggie', ingredients: ['bottom-bun', 'lettuce', 'tomato', 'pickles', 'red-onion', 'champignons', 'mayo', 'top-bun'] },
    { name: 'Garden Delight', category: 'veggie', ingredients: ['bottom-bun', 'lettuce', 'tomato', 'white-onion', 'champignons', 'mustard', 'top-bun'] },
    { name: 'Tomatonator', category: 'special', ingredients: ['bottom-bun', 'tomato', 'tomato', 'tomato', 'tomato', 'tomato', 'top-bun'] },
    { name: 'Lilypad', category: 'special', ingredients: ['bottom-bun', 'lettuce', 'lettuce', 'lettuce', 'lettuce', 'lettuce', 'top-bun'] },
    { name: 'Saturn Burger', category: 'special', ingredients: ['bottom-bun', 'beef-patty', 'cheese', 'red-onion', 'red-onion', 'top-bun'] },
    { name: 'Bustanator', category: 'special', ingredients: ['bottom-bun', 'beef-patty', 'chicken-patty', 'fish-patty', 'fried-bacon', 'fried-egg', 'cheese', 'hashbrown', 'champignons', 'lettuce', 'tomato', 'pickles', 'red-onion', 'white-onion', 'mayo', 'ketchup', 'mustard', 'spicy', 'bbq', 'top-bun'] },
    { name: 'McPickle Pounder', category: 'special', ingredients: ['bottom-bun', 'pickles', 'pickles', 'pickles', 'pickles', 'pickles', 'pickles', 'pickles', 'pickles', 'top-bun'] }
  ];

  let activeRecipeCategory = 'all';

  function getIngredientImage(id) {
    const ing = INGREDIENTS.find(i => i.id === id);
    if (ing) return ing.image;
    const sauce = SAUCES.find(s => s.id === id);
    if (sauce) return sauce.image;
    return 'images/bottom-bun.png';
  }

  function getIngredientName(id) {
    const ing = INGREDIENTS.find(i => i.id === id);
    if (ing) return ing.name;
    const sauce = SAUCES.find(s => s.id === id);
    if (sauce) return sauce.name.replace(/^[^ ]+ /, '');
    return id;
  }

  window.switchRecipeCategory = function(cat, savedScroll = null) {
    activeRecipeCategory = cat;
    const currentTabsEl = document.getElementById('cat-tabs-switchRecipeCategory');
    const actualScroll = savedScroll !== null ? savedScroll : (currentTabsEl ? currentTabsEl.scrollLeft : 0);
    renderRecipesModal(actualScroll);
  }

  function renderRecipesModal(savedScroll = null) {
    const modalBody = document.getElementById('recipesModalBody');
    if (!modalBody) return;

    const cats = [
      { id: 'all', label: 'All' },
      { id: 'classic', label: 'Classic' },
      { id: 'chicken', label: 'Chicken' },
      { id: 'fish', label: 'Fish' },
      { id: 'breakfast', label: 'Breakfast' },
      { id: 'veggie', label: 'Veggie' },
      { id: 'special', label: 'Special' }
    ];

    let tabsHtml = `<div class="panel-category-tabs" id="cat-tabs-switchRecipeCategory" style="margin-bottom: 10px;">`;
    cats.forEach(c => {
      tabsHtml += `<button class="panel-tab-btn ${activeRecipeCategory === c.id ? 'active' : ''}" onclick="window.handleTabClick('switchRecipeCategory', '${c.id}')">${c.label}</button>`;
    });
    tabsHtml += `</div>`;

    const filteredRecipes = activeRecipeCategory === 'all'
      ? RECIPES
      : RECIPES.filter(r => r.category === activeRecipeCategory);

    let listHtml = `<div style="display: flex; flex-direction: column; gap: 8px; overflow-y: auto; flex: 1; min-height: 0;">`;

    filteredRecipes.forEach(recipe => {
      const isPinned = pinnedBurger && pinnedBurger.name === recipe.name;
      const card = document.createElement('div');
      card.className = 'recipe-card';

      const visualHtml = recipe.ingredients.map(id => `<img src="${getIngredientImage(id)}" alt="${getIngredientName(id)}" title="${getIngredientName(id)}">`).join('');

      card.innerHTML = `
        <div class="recipe-info">
          <h4>${recipe.name}</h4>
          <div class="recipe-visual">${visualHtml}</div>
        </div>
        <button class="btn-pin ${isPinned ? 'pinned' : ''}" onclick="togglePinRecipe('${recipe.name.replace(/'/g, "\\'")}')">
          ${isPinned ? '📌' : '📍'}
        </button>
      `;
      listHtml += card.outerHTML;
    });

    listHtml += `</div>`;

    modalBody.innerHTML = tabsHtml + listHtml;

    requestAnimationFrame(() => {
      const tabsEl = document.getElementById('cat-tabs-switchRecipeCategory');
      if (tabsEl) {
        setupWheelScrollForContainer(tabsEl);
        if (savedScroll !== null) {
          tabsEl.style.scrollBehavior = 'auto';
          tabsEl.scrollLeft = savedScroll;
          requestAnimationFrame(() => { tabsEl.scrollLeft = savedScroll; tabsEl.style.scrollBehavior = ''; });
        }
      }
    });
  }

  window.togglePinRecipe = function(recipeName) {
    playSound(SOUNDS.buttons);
    if (pinnedBurger && pinnedBurger.name === recipeName) {
      pinnedBurger = null;
      localStorage.removeItem('pinned_burger');
      showToast('Unpinned recipe!', '', 'warning');
    } else {
      const found = RECIPES.find(r => r.name === recipeName);
      if (found) {
        pinnedBurger = found;
        localStorage.setItem('pinned_burger', JSON.stringify(found));
        showToast('Pinned recipe!', `${found.name} is now visible on screen.`, 'success');
      }
    }
    updatePinnedRecipeDisplay();
    renderRecipesModal();
  }

  function updatePinnedRecipeDisplay() {
    const widget = document.getElementById('pinnedRecipeWidget');
    const titleEl = document.getElementById('pinnedRecipeTitleText');
    const container = document.getElementById('pinnedIngredientsContainer');
    if (!widget || !container) return;

    if (pinnedBurger) {
      widget.classList.add('active');
      if (titleEl) {
        titleEl.innerText = pinnedBurger.name;
      }
      container.innerHTML = '';
      pinnedBurger.ingredients.forEach(id => {
        const img = document.createElement('img');
        img.src = getIngredientImage(id);
        img.alt = getIngredientName(id);
        container.appendChild(img);
      });

      widget.onclick = (e) => {
        if (e.target.closest('.unpin-btn')) return;
        if (titleEl) {
          titleEl.classList.toggle('show-title');
        }
      };

    } else {
      widget.classList.remove('active');
      container.innerHTML = '';
      if (titleEl) {
        titleEl.classList.remove('show-title');
        titleEl.innerText = '';
      }
    }
    updateMoneyPopupPosition();
  }

  const unpinBtn = document.getElementById('unpinBtn');
  if (unpinBtn) {
    unpinBtn.onclick = (e) => {
      e.stopPropagation();
      playSound(SOUNDS.buttons);
      pinnedBurger = null;
      localStorage.removeItem('pinned_burger');
      updatePinnedRecipeDisplay();
      const titleEl = document.getElementById('pinnedRecipeTitleText');
      if (titleEl) titleEl.classList.remove('show-title');
      renderRecipesModal();
    };
  }

  // --- ACHIEVEMENTS ---
  const ACHIEVEMENTS = [
    { id: 'first_bite', title: 'First Bite', desc: 'Eat your first burger.' },
    { id: 'classic_chef', title: 'Classic Chef', desc: 'Assemble a Classic Burger.' },
    { id: 'cheese_lover', title: 'Cheese Lover', desc: 'Assemble a Cheeseburger.' },
    { id: 'tall_burger', title: 'Tower of Burger', desc: 'Add 15 or more layers to a burger.' },
    { id: 'full_burger', title: 'Maxed Out', desc: 'Reach the 30 ingredient limit.' },
    { id: 'sauce_boss', title: 'Sauce Boss', desc: 'Add all 5 sauces to a single burger.' },
    { id: 'squeeze_master', title: 'Squeeze Master', desc: 'Squeeze a burger stack.' },
    { id: 'png_artist', title: 'Burger Artist', desc: 'Export a burger as PNG.' },
    { id: 'first_order', title: 'First Customer', desc: 'Complete your first order.' },
    { id: 'rich_chef', title: 'Rich Chef', desc: 'Have $500 or more in your wallet.' },
    { id: 'grill_master', title: 'Grill Master', desc: 'Cook an item on the grill.' },
    { id: 'chop_master', title: 'Chop Master', desc: 'Slice an ingredient on the board.' },
    { id: 'clean_freak', title: 'Clean Freak', desc: 'Wash produce in the sink.' },
    { id: 'all_upgrades', title: 'Fully Equipped', desc: 'Max out any workshop upgrade.' },
    { id: 'secret_god_burger', title: 'Secret: Ultimate Burger', desc: 'Assemble the Bustanator.' },
    { id: 'secret_pickle_lord', title: 'Secret: Pickle Lord', desc: 'Assemble the McPickle Pounder.' }
  ];

  function unlockAchievement(id) {
    if (unlockedAchievements[id]) return;
    const ach = ACHIEVEMENTS.find(a => a.id === id);
    if (!ach) return;
    unlockedAchievements[id] = true;
    localStorage.setItem('unlocked_achievements', JSON.stringify(unlockedAchievements));
    playSound(SOUNDS.achievement);
    showToast('Achievement Unlocked!', `${ach.title}: ${ach.desc}`, 'success');
    updateAchievementsBadge();
    if (document.getElementById('achievementsModal')?.classList.contains('open')) {
      renderAchievementsModal();
    }
  }

  function updateAchievementsBadge() {
    const badge = document.getElementById('achievementsBadge');
    if (!badge) return;
    const count = Object.keys(unlockedAchievements).length;
    if (count > 0 && count < ACHIEVEMENTS.length) {
      badge.style.display = 'block';
    } else {
      badge.style.display = 'none';
    }
  }

  function renderAchievementsModal() {
    const list = document.getElementById('achievementsList');
    if (!list) return;
    list.innerHTML = '';

    ACHIEVEMENTS.forEach(ach => {
      const isUnlocked = Boolean(unlockedAchievements[ach.id]);
      const div = document.createElement('div');
      div.className = 'achievement-item';
      div.style.opacity = isUnlocked ? '1' : '0.45';
      div.innerHTML = `
        <div>
          <h4 style="font-size:0.85rem; color:${isUnlocked ? 'var(--accent-color)' : 'var(--text-color)'};">${ach.title} ${isUnlocked ? '✓' : '🔒'}</h4>
          <p style="font-size:0.75rem; opacity:0.8; margin-top:2px;">${ach.desc}</p>
        </div>
      `;
      list.appendChild(div);
    });
  }

  // --- ORDERS SYSTEM ---
  function generateNewOrder() {
    const randomRecipe = RECIPES[Math.floor(Math.random() * RECIPES.length)];
    let basePrice = 8;
    if (randomRecipe.ingredients.length > 8) basePrice = 16;
    else if (randomRecipe.ingredients.length > 5) basePrice = 12;

    const rawPrice = basePrice * getOrderMultiplier();
    const finalPrice = Math.round(rawPrice * 100) / 100;

    currentActiveOrder = {
      recipe: randomRecipe,
      reward: finalPrice,
      createdAt: Date.now()
    };

    if (currentGameMode === 'turbo') {
      currentTurboTimeLeft = getTurboPatienceDuration();
    }

    lastOrderReducedReward = false;
    localStorage.setItem(getModeKey('current_active_order'), JSON.stringify(currentActiveOrder));
    playSound(SOUNDS.order);
    updateOrderWidget();
  }

  function updateOrderWidget() {
    const statusEl = document.getElementById('orderStatusText');
    if (!statusEl) return;

    const currentSpeed = getCurrentSpeed();
    if (currentSpeed === 'no-orders') {
      statusEl.innerHTML = '<span>No orders</span>';
      updateActionButtonsVisibility();
      return;
    }

    if (currentActiveOrder) {
      const baseReward = currentActiveOrder.reward;
      const shownReward = lastOrderReducedReward
        ? Math.round(baseReward * getPartialMatchRewardFactor() * 100) / 100
        : baseReward;

      let timerHtml = '';
      if (currentGameMode === 'turbo') {
        const mins = String(Math.floor(currentTurboTimeLeft / 60)).padStart(2, '0');
        const secs = String(currentTurboTimeLeft % 60).padStart(2, '0');
        timerHtml = `<span class="order-timer-badge">⏱ ${mins}:${secs}</span>`;
      }

      statusEl.innerHTML = `Order: <span>${currentActiveOrder.recipe.name}</span> ($${shownReward.toFixed(2)})${timerHtml}`;
    } else {
      const mins = String(Math.floor(timeUntilNextOrder / 60)).padStart(2, '0');
      const secs = String(timeUntilNextOrder % 60).padStart(2, '0');
      statusEl.innerHTML = `Next order in: <span>${mins}:${secs}</span>`;
    }
    updateActionButtonsVisibility();
  }

  function updateActionButtonsVisibility() {
    const forceOrderBtn = document.getElementById('forceOrderBtn');
    const skipOrderBtn = document.getElementById('skipOrderBtn');
    const submitOrderBtn = document.getElementById('submitOrderBtn');
    const serveFloatingBtn = document.getElementById('serveFloatingBtn');
    const currentSpeed = getCurrentSpeed();

    if (currentSpeed === 'no-orders') {
      if (forceOrderBtn) forceOrderBtn.style.display = 'none';
      if (skipOrderBtn) skipOrderBtn.style.display = 'none';
      if (submitOrderBtn) submitOrderBtn.style.display = 'none';
      if (serveFloatingBtn) serveFloatingBtn.classList.add('hidden-serve-btn');
      return;
    }

    if (currentActiveOrder) {
      if (forceOrderBtn) forceOrderBtn.style.display = 'none';
      if (skipOrderBtn) skipOrderBtn.style.display = 'inline-flex';
      if (submitOrderBtn) {
        submitOrderBtn.style.display = window.innerWidth > 900 ? 'inline-flex' : 'none';
      }
      if (serveFloatingBtn) {
        serveFloatingBtn.classList.remove('hidden-serve-btn');
      }
    } else {
      if (forceOrderBtn) forceOrderBtn.style.display = 'inline-flex';
      if (skipOrderBtn) skipOrderBtn.style.display = 'none';
      if (submitOrderBtn) submitOrderBtn.style.display = 'none';
      if (serveFloatingBtn) serveFloatingBtn.classList.add('hidden-serve-btn');
    }

    positionServeButtonOnMobile();
    positionMusicToast();
  }

  function positionServeButtonOnMobile() {
    const serveFloatingBtn = document.getElementById('serveFloatingBtn');
    if (!serveFloatingBtn) return;

    if (window.innerWidth > 900) {
      serveFloatingBtn.classList.remove('serve-btn-above-ingredients');
      serveFloatingBtn.style.top = '';
      serveFloatingBtn.style.bottom = '';
      serveFloatingBtn.style.right = '';
      serveFloatingBtn.style.left = '';
      return;
    }

    serveFloatingBtn.classList.add('serve-btn-above-ingredients');
    const rp = document.getElementById('rightPanel');
    if (rp && rp.offsetHeight > 0) {
      const rect = rp.getBoundingClientRect();
      serveFloatingBtn.style.top = `${Math.max(8, rect.top - serveFloatingBtn.offsetHeight - 6)}px`;
      serveFloatingBtn.style.right = '8px';
      serveFloatingBtn.style.bottom = 'auto';
      serveFloatingBtn.style.left = 'auto';
    }
  }

  function checkOrderSubmission() {
    if (!currentActiveOrder || currentBurger.length === 0) return;

    const poisonResult = evaluateBurgerPoisonRisk(currentBurger);
    if (poisonResult.isPoisoned) {
      const penalty = Math.max(5, Math.round(5 * getPoisonPenaltyMultiplier() * 100) / 100);
      if (currentGameMode !== 'sandbox') {
        playerMoney = Math.round((playerMoney - penalty) * 100) / 100;
        updateMoneyDisplay(penalty, false);
      }
      playSound(SOUNDS.wrongOrder);
      showToast('Poisoned customer!', `${poisonResult.triggeredItem} poisoned the customer (-$${penalty.toFixed(2)}).`, 'error');
      currentBurger = [];
      saveBurgerState();
      updateBurgerDisplay(false);
      renderSauces();
      return;
    }

    const expected = currentActiveOrder.recipe.ingredients;
    const actual = currentBurger.map(l => normalizeIngredientIdForOrder(l.id));

    const isExactMatch = expected.length === actual.length && expected.every((val, idx) => val === actual[idx]);

    if (isExactMatch) {
      completeCurrentOrder(currentActiveOrder.reward, 'Order completed!');
      return;
    }

    const expectedSorted = [...expected].sort();
    const actualSorted = [...actual].sort();
    const hasSameIngredientsWrongOrder = expectedSorted.length === actualSorted.length &&
      expectedSorted.every((val, idx) => val === actualSorted[idx]);

    const charmChance = getCharmSuccessChance();
    if (charmChance > 0 && Math.random() < charmChance) {
      completeCurrentOrder(currentActiveOrder.reward, 'Charmed customer!');
      return;
    }

    if (hasSameIngredientsWrongOrder) {
      if (!lastOrderReducedReward) {
        lastOrderReducedReward = true;
        playSound(SOUNDS.wrongOrder);
        const partialReward = Math.round(currentActiveOrder.reward * getPartialMatchRewardFactor() * 100) / 100;
        showToast('Wrong layer order!', `Fix order or serve again for $${partialReward.toFixed(2)}.`, 'warning');
        updateOrderWidget();
      } else {
        const partialReward = Math.round(currentActiveOrder.reward * getPartialMatchRewardFactor() * 100) / 100;
        completeCurrentOrder(partialReward, 'Partial order served!');
      }
    } else {
      playSound(SOUNDS.wrongOrder);
      showToast('Wrong ingredients!', `Expected ${currentActiveOrder.recipe.name}.`, 'error');
    }
  }

  function completeCurrentOrder(earnedAmount, titleText = 'Order completed!') {
    playSound(SOUNDS.complete);
    if (currentGameMode !== 'sandbox') {
      playerMoney = Math.round((playerMoney + earnedAmount) * 100) / 100;
      updateMoneyDisplay(earnedAmount, true);
    }

    showToast(titleText, `Earned $${earnedAmount.toFixed(2)}!`, 'success');
    trackQuestProgress('make_burgers', 1);
    trackQuestProgress('earn_money', earnedAmount);
    unlockAchievement('first_order');

    if (playerMoney >= 500) unlockAchievement('rich_chef');

    currentBurger = [];
    saveBurgerState();
    currentActiveOrder = null;
    lastOrderReducedReward = false;
    localStorage.removeItem(getModeKey('current_active_order'));

    timeUntilNextOrder = getNextOrderInterval();
    localStorage.setItem(getModeKey('time_until_next_order'), timeUntilNextOrder);

    updateBurgerDisplay(false);
    renderSauces();
    updateOrderWidget();
  }

  function getNextOrderInterval() {
    if (currentGameMode === 'turbo') return 15;
    const speed = getCurrentSpeed();
    switch (speed) {
      case 'turbo': return 15;
      case 'super-fast': return 25;
      case 'fast': return 40;
      case 'medium': return 60;
      case 'slow': return 90;
      case 'super-slow': return 120;
      default: return 120;
    }
  }

  setInterval(() => {
    const currentSpeed = getCurrentSpeed();
    if (currentSpeed === 'no-orders') return;

    if (currentActiveOrder) {
      if (currentGameMode === 'turbo') {
        currentTurboTimeLeft--;
        if (currentTurboTimeLeft <= 0) {
          playSound(SOUNDS.wrongOrder);
          showToast('Order expired!', 'Customer left in Turbo mode.', 'error');
          currentActiveOrder = null;
          lastOrderReducedReward = false;
          localStorage.removeItem(getModeKey('current_active_order'));
          timeUntilNextOrder = getNextOrderInterval();
          localStorage.setItem(getModeKey('time_until_next_order'), timeUntilNextOrder);
        }
        updateOrderWidget();
      }
    } else {
      timeUntilNextOrder--;
      if (timeUntilNextOrder <= 0) {
        generateNewOrder();
      } else {
        localStorage.setItem(getModeKey('time_until_next_order'), timeUntilNextOrder);
        updateOrderWidget();
      }
    }
  }, 1000);

  const forceOrderBtn = document.getElementById('forceOrderBtn');
  if (forceOrderBtn) {
    forceOrderBtn.onclick = () => {
      playSound(SOUNDS.buttons);
      generateNewOrder();
    };
  }

  const skipOrderBtn = document.getElementById('skipOrderBtn');
  if (skipOrderBtn) {
    skipOrderBtn.onclick = () => {
      skipOrderClickCount++;
      playSound(SOUNDS.buttons);

      if (skipOrderClickCount === 1) {
        showToast('Skip Order?', 'Click again to skip current order.', 'warning');
        if (skipOrderTimeout) clearTimeout(skipOrderTimeout);
        skipOrderTimeout = setTimeout(() => {
          skipOrderClickCount = 0;
        }, 3000);
      } else {
        if (skipOrderTimeout) clearTimeout(skipOrderTimeout);
        skipOrderClickCount = 0;
        currentActiveOrder = null;
        lastOrderReducedReward = false;
        localStorage.removeItem(getModeKey('current_active_order'));
        timeUntilNextOrder = getNextOrderInterval();
        localStorage.setItem(getModeKey('time_until_next_order'), timeUntilNextOrder);
        updateOrderWidget();
        showToast('Order skipped!', '', 'warning');
      }
    };
  }

  const serveFloatingBtn = document.getElementById('serveFloatingBtn');
  if (serveFloatingBtn) {
    serveFloatingBtn.onclick = () => {
      if (currentActiveOrder && currentBurger.length > 0) {
        checkOrderSubmission();
      } else {
        showToast('No active order or burger is empty!', '', 'warning');
      }
    };
  }
  // --- SHOP & INVENTORY ---
  let currentShopTab = 'all';
  let currentInventoryTab = 'all';
  let shopQuantities = {};

  const SHOP_ITEMS = [
    { id: 'top-bun', name: 'Top Bun', category: 'bread', image: 'images/top-bun.png' },
    { id: 'bottom-bun', name: 'Bottom Bun', category: 'bread', image: 'images/bottom-bun.png' },
    { id: 'raw-beef-patty', name: 'Raw Beef Patty', category: 'patty', image: 'images/raw-beef-patty.png' },
    { id: 'raw-chicken-patty', name: 'Raw Chicken Patty', category: 'patty', image: 'images/raw-chicken-patty.png' },
    { id: 'raw-fish-patty', name: 'Raw Fish Patty', category: 'patty', image: 'images/raw-fish-patty.png' },
    { id: 'raw-hashbrown', name: 'Raw Hashbrown', category: 'patty', image: 'images/raw-hashbrown.png' },
    { id: 'unwashed-uncut-lettuce', name: 'Dirty Lettuce', category: 'vegetables', image: 'images/uncut-lettuce.png', isUnwashed: true },
    { id: 'unwashed-uncut-tomato', name: 'Dirty Tomato', category: 'vegetables', image: 'images/uncut-tomato.png', isUnwashed: true },
    { id: 'unwashed-uncut-pickles', name: 'Dirty Pickles', category: 'vegetables', image: 'images/uncut-pickles.png', isUnwashed: true },
    { id: 'unwashed-uncut-red-onion', name: 'Dirty Red Onion', category: 'vegetables', image: 'images/uncut-red-onion.png', isUnwashed: true },
    { id: 'unwashed-uncut-white-onion', name: 'Dirty White Onion', category: 'vegetables', image: 'images/uncut-white-onion.png', isUnwashed: true },
    { id: 'unwashed-uncut-champignons', name: 'Dirty Champignons', category: 'vegetables', image: 'images/uncut-champignons.png', isUnwashed: true },
    { id: 'raw-bacon', name: 'Raw Bacon', category: 'protein', image: 'images/raw-bacon.png' },
    { id: 'raw-egg', name: 'Raw Egg', category: 'protein', image: 'images/egg.png' },
    { id: 'uncut-cheese', name: 'Uncut Cheese', category: 'protein', image: 'images/uncut-cheese.png' },
    { id: 'mayo', name: 'Mayo', category: 'sauce', image: 'images/sauce-mayo.png' },
    { id: 'ketchup', name: 'Ketchup', category: 'sauce', image: 'images/sauce-ketchup.png' },
    { id: 'mustard', name: 'Mustard', category: 'sauce', image: 'images/sauce-mustard.png' },
    { id: 'spicy', name: 'Spicy Sauce', category: 'sauce', image: 'images/sauce-spicy.png' },
    { id: 'bbq', name: 'BBQ Sauce', category: 'sauce', image: 'images/sauce-bbq.png' }
  ];

  function renderUpgradeDots(currentLevel, maxLevel = 3) {
    let dots = '<span class="upgrade-dots">';
    for (let i = 1; i <= maxLevel; i++) {
      dots += `<span class="upgrade-dot ${i <= currentLevel ? 'filled' : ''}"></span>`;
    }
    dots += '</span>';
    return dots;
  }

  function applyUpgradeLevelChange(upgradeId, newLevel) {
    const cfg = UPGRADES_CONFIG[upgradeId];
    if (!cfg) return;
    const clamped = Math.max(0, Math.min(cfg.maxLevel, newLevel));
    upgradesState[upgradeId] = clamped;
    saveUpgradesState();

    syncAllStationSlotsLength();

    if (currentScreen === 'grill') {
      initGrillStructure();
      renderGrill();
    } else if (currentScreen === 'board') {
      initBoardStructure();
      renderBoard();
    } else if (currentScreen === 'sink') {
      initSinkStructure();
      renderSink();
    }

    if (currentGameMode === 'turbo' && currentActiveOrder) {
      currentTurboTimeLeft = Math.min(getTurboPatienceDuration(), Math.max(currentTurboTimeLeft, 15));
      updateOrderWidget();
    }

    const anyMaxed = Object.keys(UPGRADES_CONFIG).some(k => getUpgradeLevel(k) >= UPGRADES_CONFIG[k].maxLevel);
    if (anyMaxed) unlockAchievement('all_upgrades');
  }

  window.buyUpgradeLevel = function(upgradeId) {
    const cfg = UPGRADES_CONFIG[upgradeId];
    if (!cfg) return;
    const currentLvl = getUpgradeLevel(upgradeId);
    if (currentLvl >= cfg.maxLevel) return;

    const price = cfg.prices[currentLvl] ?? 0;
    if (currentGameMode !== 'sandbox' && playerMoney < price) {
      showToast('Not enough money!', `Need $${price.toFixed(2)} for ${cfg.name}.`, 'error');
      return;
    }

    if (currentGameMode !== 'sandbox') {
      playerMoney = Math.round((playerMoney - price) * 100) / 100;
      updateMoneyDisplay(price, false);
    }

    applyUpgradeLevelChange(upgradeId, currentLvl + 1);
    playSound(SOUNDS.buy);
    showToast('Upgrade installed!', `${cfg.name} Lv.${currentLvl + 1}/${cfg.maxLevel}`, 'success');
    renderShopModal();
  };

  window.downgradeUpgradeLevelSandbox = function(upgradeId) {
    if (currentGameMode !== 'sandbox') return;
    const cfg = UPGRADES_CONFIG[upgradeId];
    if (!cfg) return;
    const currentLvl = getUpgradeLevel(upgradeId);
    if (currentLvl <= 0) return;

    applyUpgradeLevelChange(upgradeId, currentLvl - 1);
    playSound(SOUNDS.buttons);
    showToast('Upgrade lowered', `${cfg.name} Lv.${currentLvl - 1}/${cfg.maxLevel}`, 'warning');
    renderShopModal();
    if (document.getElementById('inventoryModal')?.classList.contains('open')) {
      renderInventoryModal();
    }
  };

  function renderShopUpgradesTab(bodyEl) {
    Object.values(UPGRADES_CONFIG).forEach(cfg => {
      const lvl = getUpgradeLevel(cfg.id);
      const isMax = lvl >= cfg.maxLevel;
      const nextPrice = isMax ? 0 : (cfg.prices[lvl] ?? 0);
      const descText = lvl > 0 ? cfg.descriptions[lvl - 1] : cfg.descriptions[0];
      const canAfford = currentGameMode === 'sandbox' || playerMoney >= nextPrice;

      const card = document.createElement('div');
      card.className = 'shop-item-card';

      const minusBtnHtml = (currentGameMode === 'sandbox' && lvl > 0)
        ? `<button type="button" class="btn-downgrade-sandbox" title="Lower level (Sandbox)" onclick="downgradeUpgradeLevelSandbox('${cfg.id}')">−</button>`
        : '';

      const actionBtnHtml = isMax
        ? `<button type="button" class="upgrade-action-btn maxed" disabled>MAX ${renderUpgradeDots(lvl, cfg.maxLevel)}</button>`
        : `<button type="button" class="upgrade-action-btn" ${!canAfford ? 'style="opacity:0.55;"' : ''} onclick="buyUpgradeLevel('${cfg.id}')">
             <span>${currentGameMode === 'sandbox' ? 'Free' : '$' + nextPrice.toFixed(2)}</span>
             ${renderUpgradeDots(lvl, cfg.maxLevel)}
           </button>`;

      card.innerHTML = `
        <div class="shop-item-info">
          <div class="upgrade-emoji-icon">${cfg.emoji}</div>
          <div class="shop-item-details">
            <h4>${cfg.name} <span style="font-size:0.72rem; color:var(--accent-color);">Lv.${lvl}/${cfg.maxLevel}</span></h4>
            <p class="upgrade-desc-text">${descText}</p>
          </div>
        </div>
        <div class="shop-buy-group">
          ${minusBtnHtml}
          ${actionBtnHtml}
        </div>
      `;
      bodyEl.appendChild(card);
    });
  }

  function renderInventoryUpgradesTab(bodyEl) {
    Object.values(UPGRADES_CONFIG).forEach(cfg => {
      const lvl = getUpgradeLevel(cfg.id);
      const isActive = lvl > 0;
      const activeDesc = isActive ? cfg.descriptions[lvl - 1] : cfg.summary;

      const card = document.createElement('div');
      card.className = 'inventory-item-card';
      if (!isActive) card.style.opacity = '0.6';

      const minusBtnHtml = (currentGameMode === 'sandbox' && lvl > 0)
        ? `<button type="button" class="btn-downgrade-sandbox" title="Lower level (Sandbox)" onclick="downgradeUpgradeLevelSandbox('${cfg.id}')">−</button>`
        : '';

      card.innerHTML = `
        <div class="inventory-item-info">
          <div class="upgrade-emoji-icon">${cfg.emoji}</div>
          <div class="inventory-item-details">
            <h4>${cfg.name}</h4>
            <p class="upgrade-desc-text">${activeDesc}</p>
          </div>
        </div>
        <div class="inventory-right-group">
          ${minusBtnHtml}
          <span class="inventory-count-badge" style="display:inline-flex; align-items:center; gap:6px;">
            <span>Lv.${lvl}/${cfg.maxLevel}</span>
            ${renderUpgradeDots(lvl, cfg.maxLevel)}
          </span>
        </div>
      `;
      bodyEl.appendChild(card);
    });
  }

  window.switchShopTab = function(tab) {
    playSound(SOUNDS.buttons);
    currentShopTab = tab;
    const tabsEl = document.getElementById('shopTabs');
    if (tabsEl) {
      tabsEl.querySelectorAll('.recipe-tab').forEach(t => {
        t.classList.toggle('active', t.innerText.toLowerCase() === tab);
      });
    }
    renderShopModal();
  }

  function updateShopBalanceHeader() {
    const headerH3 = document.querySelector('#shopModal .modal-header h3');
    if (!headerH3) return;
    let badge = headerH3.querySelector('.shop-balance-badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'shop-balance-badge';
      headerH3.appendChild(badge);
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

  function updateShopBuyAllBtn() {
    const buyAllBtn = document.getElementById('shopBuyAllBtn');
    if (!buyAllBtn) return;

    if (currentShopTab === 'upgrades') {
      buyAllBtn.disabled = true;
      buyAllBtn.innerText = 'Buy All ($0.00)';
      return;
    }

    let totalCost = 0;
    let totalItemsCount = 0;

    SHOP_ITEMS.forEach(item => {
      const qty = shopQuantities[item.id] ?? 1;
      const unitPrice = ITEM_PRICES[item.id] ?? 1;
      if (qty > 0) {
        totalCost += qty * unitPrice;
        totalItemsCount += qty;
      }
    });

    if (totalItemsCount === 0 || (currentGameMode !== 'sandbox' && totalCost > playerMoney)) {
      buyAllBtn.disabled = true;
    } else {
      buyAllBtn.disabled = false;
    }

    if (currentGameMode === 'sandbox') {
      buyAllBtn.innerText = totalItemsCount > 0 ? `Buy All (${totalItemsCount})` : 'Buy All';
    } else {
      buyAllBtn.innerText = `Buy All ($${totalCost.toFixed(2)})`;
    }
  }

  window.buyAllSelectedShopItems = function() {
    let totalCost = 0;
    const toBuy = [];

    SHOP_ITEMS.forEach(item => {
      const qty = shopQuantities[item.id] ?? 1;
      const unitPrice = ITEM_PRICES[item.id] ?? 1;
      if (qty > 0) {
        totalCost += qty * unitPrice;
        toBuy.push({ item, qty, cost: qty * unitPrice });
      }
    });

    if (toBuy.length === 0) {
      showToast('Nothing selected!', 'Set quantity > 0 to buy items.', 'warning');
      return;
    }

    if (currentGameMode !== 'sandbox' && playerMoney < totalCost) {
      showToast('Not enough money!', `Total cost is $${totalCost.toFixed(2)}.`, 'error');
      return;
    }

    if (currentGameMode !== 'sandbox') {
      playerMoney = Math.round((playerMoney - totalCost) * 100) / 100;
      updateMoneyDisplay(totalCost, false);
    }

    let totalPurchasedCount = 0;
    toBuy.forEach(entry => {
      ingredientStock[entry.item.id] = (ingredientStock[entry.item.id] ?? 0) + entry.qty;
      totalPurchasedCount += entry.qty;
      shopQuantities[entry.item.id] = 1;
    });

    saveStock();
    playSound(SOUNDS.buy);
    trackQuestProgress('buy_items', totalPurchasedCount);

    showToast('Bulk Purchase Complete!', `Bought ${totalPurchasedCount} items.`, 'success');
    renderShopModal();
    refreshActiveStationViews();
  }

  function refreshActiveStationViews() {
    if (currentScreen === 'assembly') {
      renderIngredientsMenu();
      renderSauces();
    } else if (currentScreen === 'grill') {
      renderGrillIngredientsMenu();
      renderGrillCookedInventory();
    } else if (currentScreen === 'board') {
      renderBoardUncutMenu();
      renderBoardSlicedInventory();
    } else if (currentScreen === 'sink') {
      renderSinkUnwashedMenu();
      renderSinkWashedInventory();
    }
  }

  function renderShopModal() {
    const body = document.getElementById('shopModalBody');
    if (!body) return;
    body.innerHTML = '';

    updateShopBalanceHeader();

    if (currentShopTab === 'upgrades') {
      renderShopUpgradesTab(body);
      updateShopBuyAllBtn();
      return;
    }

    const filtered = currentShopTab === 'all' ? SHOP_ITEMS : SHOP_ITEMS.filter(i => i.category === currentShopTab);

    filtered.forEach(item => {
      const price = ITEM_PRICES[item.id] ?? 1;
      const currentQty = shopQuantities[item.id] ?? 1;
      const totalItemPrice = currentQty * price;
      const unwashedClass = item.isUnwashed ? 'unwashed-filter' : '';

      const card = document.createElement('div');
      card.className = 'shop-item-card';
      card.innerHTML = `
        <div class="shop-item-info">
          <img src="${item.image}" alt="${item.name}" class="${unwashedClass}">
          <div class="shop-item-details">
            <h4>${item.name}</h4>
            <p>$${price.toFixed(2)} each</p>
          </div>
        </div>
        <div class="shop-buy-group">
          <button type="button" class="shop-qty-btn" onclick="changeShopQty('${item.id}', -1)">-</button>
          <input type="number" class="shop-qty-input" id="shopQty-${item.id}" value="${currentQty}" min="0" max="999" onchange="onShopQtyInputChange('${item.id}', this.value)">
          <button type="button" class="shop-qty-btn" onclick="changeShopQty('${item.id}', 1)">+</button>
          <span class="shop-total-price" id="shopTotal-${item.id}">${currentGameMode === 'sandbox' ? 'Free' : '$' + totalItemPrice.toFixed(2)}</span>
          <button type="button" class="btn-buy" onclick="buyShopItem('${item.id}')">Buy</button>
        </div>
      `;
      body.appendChild(card);
    });

    updateShopBuyAllBtn();
  }

  window.changeShopQty = function(id, delta) {
    const currentQty = shopQuantities[id] ?? 1;
    const newQty = Math.max(0, Math.min(999, currentQty + delta));
    shopQuantities[id] = newQty;

    const inputEl = document.getElementById(`shopQty-${id}`);
    if (inputEl) inputEl.value = newQty;

    const totalEl = document.getElementById(`shopTotal-${id}`);
    if (totalEl) {
      const unitPrice = ITEM_PRICES[id] ?? 1;
      totalEl.innerText = currentGameMode === 'sandbox' ? 'Free' : `$${(newQty * unitPrice).toFixed(2)}`;
    }
    updateShopBuyAllBtn();
  }

  window.onShopQtyInputChange = function(id, valStr) {
    let val = parseInt(valStr, 10);
    if (isNaN(val) || val < 0) val = 0;
    if (val > 999) val = 999;
    shopQuantities[id] = val;

    const inputEl = document.getElementById(`shopQty-${id}`);
    if (inputEl) inputEl.value = val;

    const totalEl = document.getElementById(`shopTotal-${id}`);
    if (totalEl) {
      const unitPrice = ITEM_PRICES[id] ?? 1;
      totalEl.innerText = currentGameMode === 'sandbox' ? 'Free' : `$${(val * unitPrice).toFixed(2)}`;
    }
    updateShopBuyAllBtn();
  }

  window.buyShopItem = function(id) {
    const item = SHOP_ITEMS.find(i => i.id === id);
    if (!item) return;

    const qty = shopQuantities[id] ?? 1;
    if (qty <= 0) { showToast('Enter a quantity > 0!', '', 'warning'); return; }

    const unitPrice = ITEM_PRICES[id] ?? 1;
    const totalCost = qty * unitPrice;

    if (currentGameMode !== 'sandbox' && playerMoney < totalCost) {
      showToast('Not enough money!', `Need $${totalCost.toFixed(2)} to buy ${qty}x ${item.name}.`, 'error');
      return;
    }

    if (currentGameMode !== 'sandbox') {
      playerMoney = Math.round((playerMoney - totalCost) * 100) / 100;
      updateMoneyDisplay(totalCost, false);
    }

    ingredientStock[id] = (ingredientStock[id] ?? 0) + qty;
    saveStock();
    playSound(SOUNDS.buy);
    trackQuestProgress('buy_items', qty);

    showToast('Purchased!', `Bought ${qty}x ${item.name}.`, 'success');
    renderShopModal();
    refreshActiveStationViews();
  }

  window.switchInventoryTab = function(tab) {
    playSound(SOUNDS.buttons);
    currentInventoryTab = tab;
    const tabsEl = document.getElementById('inventoryTabs');
    if (tabsEl) {
      tabsEl.querySelectorAll('.recipe-tab').forEach(t => {
        t.classList.toggle('active', t.innerText.toLowerCase() === tab);
      });
    }
    renderInventoryModal();
  }

  function renderInventoryModal() {
    const body = document.getElementById('inventoryModalBody');
    if (!body) return;
    body.innerHTML = '';

    if (currentInventoryTab === 'upgrades') {
      renderInventoryUpgradesTab(body);
      return;
    }

    const ALL_INVENTORY_ITEMS = [
      { id: 'top-bun', name: 'Top Bun', category: 'bread', image: 'images/top-bun.png' },
      { id: 'bottom-bun', name: 'Bottom Bun', category: 'bread', image: 'images/bottom-bun.png' },
      { id: 'raw-beef-patty', name: 'Raw Beef Patty', category: 'patty', image: 'images/raw-beef-patty.png' },
      { id: 'beef-patty', name: 'Cooked Beef Patty', category: 'patty', image: 'images/beef-patty.png' },
      { id: 'raw-chicken-patty', name: 'Raw Chicken Patty', category: 'patty', image: 'images/raw-chicken-patty.png' },
      { id: 'chicken-patty', name: 'Cooked Chicken Patty', category: 'patty', image: 'images/chicken-patty.png' },
      { id: 'raw-fish-patty', name: 'Raw Fish Patty', category: 'patty', image: 'images/raw-fish-patty.png' },
      { id: 'fish-patty', name: 'Cooked Fish Patty', category: 'patty', image: 'images/fish-patty.png' },
      { id: 'raw-hashbrown', name: 'Raw Hashbrown', category: 'patty', image: 'images/raw-hashbrown.png' },
      { id: 'hashbrown', name: 'Cooked Hashbrown', category: 'patty', image: 'images/hashbrown.png' },
      { id: 'raw-bacon', name: 'Raw Bacon', category: 'protein', image: 'images/raw-bacon.png' },
      { id: 'fried-bacon', name: 'Cooked Bacon', category: 'protein', image: 'images/fried-bacon.png' },
      { id: 'raw-egg', name: 'Raw Egg', category: 'protein', image: 'images/egg.png' },
      { id: 'fried-egg', name: 'Cooked Egg', category: 'protein', image: 'images/fried-egg.png' },
      { id: 'uncut-cheese', name: 'Uncut Cheese', category: 'protein', image: 'images/uncut-cheese.png' },
      { id: 'raw-cheese', name: 'Sliced Cheese', category: 'protein', image: 'images/raw-cheese.png' },
      { id: 'cheese', name: 'Melted Cheese', category: 'protein', image: 'images/cheese.png' },
      { id: 'unwashed-uncut-champignons', name: 'Dirty Uncut Champignons', category: 'vegetables', image: 'images/uncut-champignons.png', isUnwashed: true },
      { id: 'uncut-champignons', name: 'Clean Uncut Champignons', category: 'vegetables', image: 'images/uncut-champignons.png' },
      { id: 'raw-champignons', name: 'Sliced Raw Champignons', category: 'vegetables', image: 'images/raw-champignons.png' },
      { id: 'champignons', name: 'Fried Champignons', category: 'vegetables', image: 'images/champignons.png' },
      { id: 'unwashed-uncut-lettuce', name: 'Dirty Uncut Lettuce', category: 'vegetables', image: 'images/uncut-lettuce.png', isUnwashed: true },
      { id: 'uncut-lettuce', name: 'Clean Uncut Lettuce', category: 'vegetables', image: 'images/uncut-lettuce.png' },
      { id: 'lettuce', name: 'Sliced Lettuce', category: 'vegetables', image: 'images/lettuce.png' },
      { id: 'unwashed-uncut-tomato', name: 'Dirty Uncut Tomato', category: 'vegetables', image: 'images/uncut-tomato.png', isUnwashed: true },
      { id: 'uncut-tomato', name: 'Clean Uncut Tomato', category: 'vegetables', image: 'images/uncut-tomato.png' },
      { id: 'tomato', name: 'Sliced Tomato', category: 'vegetables', image: 'images/tomato.png' },
      { id: 'unwashed-uncut-pickles', name: 'Dirty Uncut Pickles', category: 'vegetables', image: 'images/uncut-pickles.png', isUnwashed: true },
      { id: 'uncut-pickles', name: 'Clean Uncut Pickles', category: 'vegetables', image: 'images/uncut-pickles.png' },
      { id: 'pickles', name: 'Sliced Pickles', category: 'vegetables', image: 'images/pickles.png' },
      { id: 'unwashed-uncut-red-onion', name: 'Dirty Uncut Red Onion', category: 'vegetables', image: 'images/uncut-red-onion.png', isUnwashed: true },
      { id: 'uncut-red-onion', name: 'Clean Uncut Red Onion', category: 'vegetables', image: 'images/uncut-red-onion.png' },
      { id: 'red-onion', name: 'Sliced Red Onion', category: 'vegetables', image: 'images/red-onion.png' },
      { id: 'unwashed-uncut-white-onion', name: 'Dirty Uncut White Onion', category: 'vegetables', image: 'images/uncut-white-onion.png', isUnwashed: true },
      { id: 'uncut-white-onion', name: 'Clean Uncut White Onion', category: 'vegetables', image: 'images/uncut-white-onion.png' },
      { id: 'white-onion', name: 'Sliced White Onion', category: 'vegetables', image: 'images/white-onion.png' },
      { id: 'mayo', name: 'Mayo', category: 'sauce', image: 'images/sauce-mayo.png' },
      { id: 'ketchup', name: 'Ketchup', category: 'sauce', image: 'images/sauce-ketchup.png' },
      { id: 'mustard', name: 'Mustard', category: 'sauce', image: 'images/sauce-mustard.png' },
      { id: 'spicy', name: 'Spicy Sauce', category: 'sauce', image: 'images/sauce-spicy.png' },
      { id: 'bbq', name: 'BBQ Sauce', category: 'sauce', image: 'images/sauce-bbq.png' }
    ];

    const filtered = currentInventoryTab === 'all' ? ALL_INVENTORY_ITEMS : ALL_INVENTORY_ITEMS.filter(i => i.category === currentInventoryTab);

    filtered.forEach(item => {
      const count = ingredientStock[item.id] ?? 0;
      const countDisplay = currentGameMode === 'sandbox' ? '∞' : `x${count}`;
      const isBuyable = SHOP_ITEMS.some(s => s.id === item.id);
      const unwashedClass = item.isUnwashed ? 'unwashed-filter' : '';

      const card = document.createElement('div');
      card.className = 'inventory-item-card';
      card.innerHTML = `
        <div class="inventory-item-info">
          <img src="${item.image}" alt="${item.name}" class="${unwashedClass}">
          <div class="inventory-item-details">
            <h4>${item.name}</h4>
          </div>
        </div>
        <div class="inventory-right-group">
          ${isBuyable ? `<button type="button" class="btn-buy-more" onclick="buyMoreFromInventory('${item.id}')">+ Buy</button>` : ''}
          <span class="inventory-count-badge">${countDisplay}</span>
        </div>
      `;
      body.appendChild(card);
    });
  }

  window.buyMoreFromInventory = function(itemId) {
    const item = SHOP_ITEMS.find(s => s.id === itemId);
    if (!item) return;

    const unitPrice = ITEM_PRICES[itemId] ?? 1;
    if (currentGameMode !== 'sandbox' && playerMoney < unitPrice) {
      showToast('Not enough money!', `Need $${unitPrice.toFixed(2)} to buy 1x ${item.name}.`, 'error');
      return;
    }

    if (currentGameMode !== 'sandbox') {
      playerMoney = Math.round((playerMoney - unitPrice) * 100) / 100;
      updateMoneyDisplay(unitPrice, false);
    }

    ingredientStock[itemId] = (ingredientStock[itemId] ?? 0) + 1;
    saveStock();
    playSound(SOUNDS.buy);
    trackQuestProgress('buy_items', 1);

    showToast('Purchased!', `Bought 1x ${item.name}.`, 'success');
    renderInventoryModal();
    refreshActiveStationViews();
  }

  function exitBinSelectMode() {
    isBinSelectMode = false;
    selectedGrillIndicesForBin = [];
    selectedBoardIndicesForBin = [];
    selectedSinkIndicesForBin = [];
    const bar = document.getElementById('binConfirmBar');
    if (bar) bar.remove();
    if (currentScreen === 'grill') renderGrill();
    else if (currentScreen === 'board') renderBoard();
    else if (currentScreen === 'sink') renderSink();
  }

  // --- MODALS & SETTINGS ---
  function setupModal(openBtnId, modalId, closeBtnId, onOpenCb) {
    const openBtn = document.getElementById(openBtnId);
    const modal = document.getElementById(modalId);
    const closeBtn = document.getElementById(closeBtnId);
    if (openBtn && modal) {
      openBtn.onclick = () => {
        playSound(SOUNDS.buttons);
        modal.classList.add('open');
        if (onOpenCb) onOpenCb();
        positionMusicToast();
      };
    }
    if (closeBtn && modal) {
      closeBtn.onclick = () => {
        playSound(SOUNDS.buttons);
        modal.classList.remove('open');
        positionMusicToast();
      };
    }
    if (modal) {
      modal.onclick = (e) => {
        if (e.target === modal) {
          modal.classList.remove('open');
          positionMusicToast();
        }
      };
    }
  }

  setupModal('openRecipesBtn', 'recipesModal', 'closeRecipesModal', () => { activeRecipeCategory = 'all'; renderRecipesModal(); });
  setupModal('openShopBtn', 'shopModal', 'closeShopModal', () => { currentShopTab = 'all'; renderShopModal(); });
  setupModal('openInventoryBtn', 'inventoryModal', 'closeInventoryModal', () => { currentInventoryTab = 'all'; renderInventoryModal(); });
  setupModal('openAchievementsBtn', 'achievementsModal', 'closeAchievementsModal', renderAchievementsModal);
  setupModal('openQuestsBtn', 'questsModal', 'closeQuestsModal', () => { renderQuestsModal(); updateQuestsResetTimer(); });
  setupModal('openSettingsBtn', 'settingsModal', 'closeSettingsModal', () => {
    syncSettingsButtons();
    updateMusicPlayerUI();
  });

  const walletWidget = document.getElementById('walletWidget');
  if (walletWidget) {
    walletWidget.onclick = () => {
      playSound(SOUNDS.buttons);
      const modal = document.getElementById('shopModal');
      if (modal) { modal.classList.add('open'); currentShopTab = 'all'; renderShopModal(); positionMusicToast(); }
    };
  }

  const topOrderWidget = document.getElementById('topOrderWidget');
  if (topOrderWidget) {
    topOrderWidget.onclick = (e) => {
      if (e.target.closest('button')) return;
      playSound(SOUNDS.buttons);
      const modal = document.getElementById('recipesModal');
      if (modal) { modal.classList.add('open'); activeRecipeCategory = 'all'; renderRecipesModal(); positionMusicToast(); }
    };
  }

  function syncSettingsButtons() {
    document.querySelectorAll('#gameModeButtonsRow button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === currentGameMode);
    });

    const speedGrid = document.getElementById('speedButtonsGrid');
    if (speedGrid) {
      if (currentGameMode === 'turbo') {
        speedGrid.classList.add('disabled');
        document.querySelectorAll('.speed-btn').forEach(b => b.classList.toggle('active', b.dataset.speed === 'turbo'));
      } else {
        speedGrid.classList.remove('disabled');
        const activeSpd = modeSpeeds[currentGameMode] || 'no-orders';
        document.querySelectorAll('.speed-btn').forEach(b => b.classList.toggle('active', b.dataset.speed === activeSpd));
      }
    }

    const themeDarkBtn = document.getElementById('themeDarkBtn');
    const themeLightBtn = document.getElementById('themeLightBtn');
    const isLight = document.body.classList.contains('light-theme');
    if (themeDarkBtn && themeLightBtn) {
      themeDarkBtn.classList.toggle('active', !isLight);
      themeLightBtn.classList.toggle('active', isLight);
    }

    updateMusicPlayerUI();
  }

  function setGameMode(mode, silent = false) {
    if (!silent) playSound(SOUNDS.buttons);
    stopAllStationAudio();
    currentGameMode = mode;
    localStorage.setItem('burger_game_mode', mode);
    loadModeData();

    updateMoneyDisplay();
    if (currentScreen === 'assembly') {
      renderIngredientsMenu();
      updateBurgerDisplay(false);
    } else if (currentScreen === 'grill') {
      renderGrillIngredientsMenu();
      renderGrillCookedInventory();
      initGrillStructure();
      renderGrill();
    } else if (currentScreen === 'board') {
      renderBoardUncutMenu();
      renderBoardSlicedInventory();
      initBoardStructure();
      renderBoard();
    } else if (currentScreen === 'sink') {
      renderSinkUnwashedMenu();
      renderSinkWashedInventory();
      initSinkStructure();
      renderSink();
    }
    renderSauces();
    initDailyQuests();
    updateOrderWidget();
    updateActionButtonsVisibility();
    updateStationNotificationDots();
    syncSettingsButtons();
  }

  document.querySelectorAll('#gameModeButtonsRow button').forEach(btn => {
    btn.onclick = () => {
      const m = btn.dataset.mode;
      if (m) {
        setGameMode(m);
        if (m === 'turbo') showToast('Turbo Mode!', 'Orders come fast with patience timer!', 'success');
        else if (m === 'sandbox') showToast('Sandbox Mode!', 'Unlimited money and items!', 'success');
        else showToast('Casual Mode!', 'Relaxed pace.', 'success');
      }
    };
  });

  document.querySelectorAll('.speed-btn').forEach(btn => {
    btn.onclick = () => {
      if (currentGameMode === 'turbo') return;
      playSound(SOUNDS.buttons);
      const spd = btn.dataset.speed;
      modeSpeeds[currentGameMode] = spd;
      localStorage.setItem('burger_mode_speeds', JSON.stringify(modeSpeeds));

      if (spd !== 'no-orders' && !currentActiveOrder) {
        timeUntilNextOrder = getNextOrderInterval();
        localStorage.setItem(getModeKey('time_until_next_order'), timeUntilNextOrder);
      } else if (spd === 'no-orders') {
        currentActiveOrder = null;
        lastOrderReducedReward = false;
        localStorage.removeItem(getModeKey('current_active_order'));
      }

      syncSettingsButtons();
      updateOrderWidget();
      updateActionButtonsVisibility();
    };
  });

  const sfxRange = document.getElementById('volumeRange');
  const sfxVal = document.getElementById('volumeVal');
  if (sfxRange) {
    sfxRange.value = Math.round(sfxVolumeLevel * 100);
    if (sfxVal) sfxVal.innerText = `${sfxRange.value}%`;
    sfxRange.oninput = () => {
      sfxVolumeLevel = parseInt(sfxRange.value, 10) / 100;
      localStorage.setItem('burger_sfx_volume', sfxVolumeLevel);
      localStorage.setItem('burger_volume', sfxVolumeLevel);
      if (sfxVal) sfxVal.innerText = `${sfxRange.value}%`;
    };
  }

  const musicRange = document.getElementById('musicVolumeRange');
  const musicVal = document.getElementById('musicVolumeVal');
  if (musicRange) {
    musicRange.value = Math.round(musicVolumeLevel * 100);
    if (musicVal) musicVal.innerText = `${musicRange.value}%`;
    musicRange.oninput = () => {
      musicVolumeLevel = parseInt(musicRange.value, 10) / 100;
      localStorage.setItem('burger_music_volume', musicVolumeLevel);
      if (musicVal) musicVal.innerText = `${musicRange.value}%`;
      if (musicAudio) musicAudio.volume = musicVolumeLevel;
    };
  }

  const musicPrevBtn = document.getElementById('musicPrevBtn');
  const musicPlayPauseBtn = document.getElementById('musicPlayPauseBtn') || document.getElementById('musicToggleBtn');
  const musicNextBtn = document.getElementById('musicNextBtn');

  if (musicPrevBtn) musicPrevBtn.onclick = prevMusicTrack;
  if (musicPlayPauseBtn) {
    musicPlayPauseBtn.onclick = () => {
      playSound(SOUNDS.buttons);
      toggleMusicPlayback(false);
    };
  }
  if (musicNextBtn) musicNextBtn.onclick = nextMusicTrack;

  window.setTheme = function(theme) {
    playSound(SOUNDS.buttons);
    if (theme === 'light') {
      document.body.classList.add('light-theme');
      localStorage.setItem('burger_theme', 'light');
    } else {
      document.body.classList.remove('light-theme');
      localStorage.setItem('burger_theme', 'dark');
    }
    syncSettingsButtons();
  };

  if (localStorage.getItem('burger_theme') === 'light') {
    document.body.classList.add('light-theme');
  }

  const resetAchievementsBtn = document.getElementById('resetAchievementsBtn');
  if (resetAchievementsBtn) {
    resetAchievementsBtn.onclick = () => {
      playSound(SOUNDS.buttons);
      unlockedAchievements = {};
      localStorage.removeItem('unlocked_achievements');
      updateAchievementsBadge();
      renderAchievementsModal();
      showToast('Achievements Reset!', '', 'warning');
    };
  }

  const hardResetBtn = document.getElementById('hardResetBtn');
  if (hardResetBtn) {
    hardResetBtn.onclick = () => {
      playSound(SOUNDS.buttons);
      stopAllStationAudio();
      stopMusicPlayback();
      const keys = Object.keys(localStorage);
      keys.forEach(k => {
        if (
          k.startsWith('burger_') ||
          k.startsWith('saved_burger') ||
          k.startsWith('current_active') ||
          k.startsWith('time_until') ||
          k === 'pinned_burger' ||
          k === 'unlocked_achievements'
        ) {
          localStorage.removeItem(k);
        }
      });

      currentGameMode = 'casual';
      modeSpeeds = { 'sandbox': 'no-orders', 'casual': 'no-orders' };
      unlockedAchievements = {};
      pinnedBurger = null;
      upgradesState = getDefaultUpgradesState();

      loadModeData();
      initDailyQuests();
      updateMoneyDisplay();
      updatePinnedRecipeDisplay();
      updateAchievementsBadge();
      updateQuestsBadge();
      updateOrderWidget();
      syncSettingsButtons();
      switchScreen('assembly', true);
      showToast('All Data Reset!', '', 'warning');
    };
  }

  const toggleUiBtn = document.getElementById('toggleUiBtn');
  if (toggleUiBtn) {
    toggleUiBtn.onclick = () => {
      playSound(SOUNDS.buttons);
      document.body.classList.toggle('ui-hidden');
      updateMoneyPopupPosition();
      positionMusicToast();
    };
  }

  window.addEventListener('resize', () => {
    positionServeButtonOnMobile();
    positionMusicToast();
    updateMoneyPopupPosition();
  });

  // --- TUTORIAL ---
  const TUTORIAL_STEPS = [
    { title: 'Welcome to Burger Maker!', text: 'Let\'s take a quick tour of your burger kitchen and workstations.', targetId: null },
    { title: '1. Assembly Station', text: 'This is the Assembly screen where you stack buns, patties, veggies and sauces into burgers.', targetId: 'centerStage' },
    { title: '2. Workstation Switcher', text: 'Switch between Assembly (🍔), Grill (🔥), Cutting Board (🔪) and Sink (🚿).', targetId: 'screenSwitcher' },
    { title: '3. Sink (Washing)', text: 'Dirty produce from the shop must be washed in the Sink before slicing and serving.', targetId: 'switchToSinkBtn' },
    { title: '4. Cutting Board (Slicing)', text: 'Whole vegetables and cheese blocks can be sliced on the Cutting Board for x3 portions.', targetId: 'switchToBoardBtn' },
    { title: '5. Grill (Cooking)', text: 'Cook raw patties, bacon, eggs and mushrooms on the Grill. Flip when needed and don\'t let them burn!', targetId: 'switchToGrillBtn' },
    { title: '6. Ingredients Menu', text: 'Tap ingredients here to add them to your burger stack.', targetId: 'rightPanel' },
    { title: '7. Layers List', text: 'Reorder layers up or down, or remove layers you don\'t want.', targetId: 'leftPanel' },
    { title: '8. Sauces', text: 'Add Mayo, Ketchup, Mustard, Spicy or BBQ sauce to your creation.', targetId: 'bottomPanel' },
    { title: '9. Wallet & Shop', text: 'Your cash balance is shown here. Click to open the Shop and buy ingredients or workshop upgrades.', targetId: 'walletWidget' },
    { title: '10. Orders & Recipes', text: 'Track active customer orders here or open the Recipe Book to pin any burger recipe.', targetId: 'topOrderWidget' },
    { title: '11. Daily Quests', text: 'Complete simple daily tasks to earn bonus cash.', targetId: 'openQuestsBtn' },
    { title: '12. Achievements', text: 'Unlock milestones and secret burgers as you play.', targetId: 'openAchievementsBtn' },
    { title: '13. Eat, Squeeze & Export', text: 'Squeeze your burger stack, eat it yourself (watch out for raw/dirty food!), reset it, or save as PNG.', targetId: 'squeezeBtn' },
    { title: '14. Settings & Music', text: 'Adjust SFX/music volume, control the music player, change themes, or switch between Sandbox, Casual and Turbo modes.', targetId: 'openSettingsBtn' }
  ];

  let currentTutorialStep = 0;

  function showTutorialStep(stepIndex) {
    const overlay = document.getElementById('tutorialOverlay');
    const spotlight = document.getElementById('tutorialSpotlight');
    const tooltip = document.getElementById('tutorialTooltip');
    const titleEl = document.getElementById('tutorialTitle');
    const textEl = document.getElementById('tutorialText');
    const stepInd = document.getElementById('tutorialStepIndicator');
    const prevBtn = document.getElementById('tutorialPrevBtn');
    const nextBtn = document.getElementById('tutorialNextBtn');

    if (!overlay || !tooltip || !titleEl || !textEl) return;

    currentTutorialStep = Math.max(0, Math.min(TUTORIAL_STEPS.length - 1, stepIndex));
    const step = TUTORIAL_STEPS[currentTutorialStep];

    titleEl.innerText = step.title;
    textEl.innerText = step.text;
    if (stepInd) stepInd.innerText = `${currentTutorialStep + 1} / ${TUTORIAL_STEPS.length}`;
    if (prevBtn) prevBtn.disabled = currentTutorialStep === 0;
    if (nextBtn) nextBtn.innerText = currentTutorialStep === TUTORIAL_STEPS.length - 1 ? 'Finish' : 'Next';

    overlay.classList.add('active');
    document.body.classList.add('tutorial-active');

    if (window.innerWidth > 900 && spotlight) {
      const targetEl = step.targetId ? document.getElementById(step.targetId) : null;
      if (targetEl) {
        const rect = targetEl.getBoundingClientRect();
        spotlight.style.display = 'block';
        spotlight.style.left = `${rect.left - 6}px`;
        spotlight.style.top = `${rect.top - 6}px`;
        spotlight.style.width = `${rect.width + 12}px`;
        spotlight.style.height = `${rect.height + 12}px`;

        let topPos = rect.bottom + 14;
        let leftPos = Math.min(window.innerWidth - 330, Math.max(16, rect.left));
        if (topPos + 180 > window.innerHeight) {
          topPos = Math.max(16, rect.top - 190);
        }
        tooltip.style.top = `${topPos}px`;
        tooltip.style.left = `${leftPos}px`;
      } else {
        spotlight.style.display = 'none';
        tooltip.style.top = '50%';
        tooltip.style.left = '50%';
        tooltip.style.transform = 'translate(-50%, -50%)';
      }
    } else if (spotlight) {
      spotlight.style.display = 'none';
      tooltip.style.top = '';
      tooltip.style.left = '';
      tooltip.style.transform = '';
    }
  }

  function closeTutorial() {
    const overlay = document.getElementById('tutorialOverlay');
    const tooltip = document.getElementById('tutorialTooltip');
    if (overlay) overlay.classList.remove('active');
    if (tooltip) tooltip.style.transform = '';
    document.body.classList.remove('tutorial-active');
    localStorage.setItem('burger_tutorial_completed', 'true');
  }

  const tutNextBtn = document.getElementById('tutorialNextBtn');
  const tutPrevBtn = document.getElementById('tutorialPrevBtn');
  const tutSkipBtn = document.getElementById('tutorialSkipBtn');
  const openTutSettingsBtn = document.getElementById('openTutorialFromSettingsBtn');
  const welcomeModal = document.getElementById('welcomeModal');
  const welcomeYesBtn = document.getElementById('welcomeYesBtn');
  const welcomeNoBtn = document.getElementById('welcomeNoBtn');

  if (tutNextBtn) {
    tutNextBtn.onclick = () => {
      playSound(SOUNDS.buttons);
      if (currentTutorialStep >= TUTORIAL_STEPS.length - 1) {
        closeTutorial();
      } else {
        showTutorialStep(currentTutorialStep + 1);
      }
    };
  }

  if (tutPrevBtn) {
    tutPrevBtn.onclick = () => {
      playSound(SOUNDS.buttons);
      showTutorialStep(currentTutorialStep - 1);
    };
  }

  if (tutSkipBtn) {
    tutSkipBtn.onclick = () => {
      playSound(SOUNDS.buttons);
      closeTutorial();
    };
  }

  if (openTutSettingsBtn) {
    openTutSettingsBtn.onclick = () => {
      playSound(SOUNDS.buttons);
      const settingsModal = document.getElementById('settingsModal');
      if (settingsModal) settingsModal.classList.remove('open');
      showTutorialStep(0);
    };
  }

  if (welcomeYesBtn) {
    welcomeYesBtn.onclick = () => {
      playSound(SOUNDS.buttons);
      if (welcomeModal) welcomeModal.classList.remove('open');
      localStorage.setItem('burger_tutorial_completed', 'true');
      showTutorialStep(0);
    };
  }

  if (welcomeNoBtn) {
    welcomeNoBtn.onclick = () => {
      playSound(SOUNDS.buttons);
      if (welcomeModal) welcomeModal.classList.remove('open');
      localStorage.setItem('burger_tutorial_completed', 'true');
    };
  }

  // --- INITIALIZATION ---
  initDailyQuests();
  updateMoneyDisplay();
  updatePinnedRecipeDisplay();
  updateAchievementsBadge();
  updateQuestsBadge();
  updateOrderWidget();
  updateActionButtonsVisibility();
  updateStationNotificationDots();
  syncSettingsButtons();
  renderSauces();
  switchScreen(currentScreen, true);

  loadMusicTrack(currentTrackIndex, isMusicPlaying, false, savedMusicPosition);
  if (isMusicPlaying) {
    bindUnlockMusicOnFirstInteraction();
  }

  if (!localStorage.getItem('burger_tutorial_completed') && welcomeModal) {
    welcomeModal.classList.add('open');
  }
});
