:root {
  --bg-color: #1a1412;
  --panel-bg: #2a211e;
  --border-color: #ffb300;
  --text-color: #fff;
}

body.light-theme {
  --bg-color: #f5f0eb;
  --panel-bg: #ffffff;
  --border-color: #d18d00;
  --text-color: #332211;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: sans-serif;
}

body {
  background-color: var(--bg-color);
  color: var(--text-color);
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 12px;
  gap: 12px;
}

.top-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 40px;
}

.wallet-widget, .top-order-widget {
  background: var(--panel-bg);
  border: 1px solid var(--border-color);
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: bold;
}

.top-order-widget.hidden {
  display: none;
}

.main-workspace {
  display: flex;
  flex: 1;
  gap: 12px;
  min-height: 0;
}

.panel {
  background: var(--panel-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  padding: 12px;
}

.left-panel, .right-panel {
  width: 260px;
}

.panel-title {
  font-size: 0.9rem;
  margin-bottom: 8px;
  font-weight: bold;
}

.center-stage {
  flex: 1;
  background: var(--panel-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow-y: auto;
}

.burger-stack {
  display: flex;
  flex-direction: column-reverse;
  align-items: center;
  justify-content: center;
  padding: 20px 0;
}

.burger-layer-img {
  width: 120px;
  object-fit: contain;
  transition: transform 0.2s;
}

.bottom-panel {
  height: 70px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.sauces-group, .actions-group, .screen-switchers {
  display: flex;
  gap: 8px;
  align-items: center;
}

.sauce-chip {
  background: #3a2e2a;
  border: 1px solid var(--border-color);
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
  color: #fff;
}

.btn-action, .screen-switch-btn {
  background: #3a2e2a;
  border: 1px solid var(--border-color);
  color: #fff;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}

.screen-switch-btn.active {
  background: var(--border-color);
  color: #000;
}

/* Модальные окна */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.7);
  display: none;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.modal-overlay.open {
  display: flex;
}

.modal-content {
  background: var(--panel-bg);
  border: 1px solid var(--border-color);
  padding: 20px;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  color: var(--text-color);
}

.modal-content.large {
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.modal-close-btn, .btn-primary, .btn-secondary {
  background: #3a2e2a;
  border: 1px solid var(--border-color);
  color: #fff;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
}

.btn-primary {
  background: var(--border-color);
  color: #000;
  font-weight: bold;
}

/* --- Стили туториала (разделенные под ПК и мобильные) --- */
.tutorial-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.75);
  z-index: 9999;
  display: none;
}

.tutorial-overlay.active {
  display: block;
}

#tutorialSpotlight {
  position: absolute;
  border: 3px solid #ffb300;
  border-radius: 8px;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.75);
  pointer-events: none;
  transition: all 0.25s ease-out;
  z-index: 10000;
}

.tutorial-tooltip {
  position: absolute;
  width: 310px;
  background: #221a16;
  border: 1px solid #ffb300;
  border-radius: 12px;
  padding: 16px;
  color: #fff;
  z-index: 10001;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
}

.tutorial-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.tutorial-text {
  font-size: 0.85rem;
  line-height: 1.4;
  margin-bottom: 16px;
  opacity: 0.9;
}

.tutorial-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* Мобильная адаптация туториала: СТРОГО ПО ЦЕНТРУ ЭКРАНА */
@media (max-width: 900px) {
  .tutorial-tooltip {
    position: fixed !important;
    top: 50% !important;
    left: 50% !important;
    transform: translate(-50%, -50%) !important;
    width: 85% !important;
    max-width: 340px;
    max-height: 80vh;
    overflow-y: auto;
  }
}
