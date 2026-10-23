// UI Controller for Namma Route
// Handles station pickers, Under the Hood panel, Compare mode,
// "How it works" drawer, share link, and demo mode triggers

export class UIController {
  constructor(graph, renderer) {
    this.graph = graph;
    this.renderer = renderer;
    this.animator = null;
    this.demo = null;

    this.fromStationId = null;
    this.toStationId = null;
    this.currentMode = 'dijkstra';
    this.nextTapTarget = 'from';

    this.initElements();
    this.setupDropdown('from');
    this.setupDropdown('to');
    this.setupSwapButton();
    this.setupModeSelector();
    this.setupActionButtons();
    this.setupPlaybackControls();
    this.setupHowItWorksDrawer();
    this.setupShareAndReset();

    this.renderer.onStationSelect = (sId) => this.handleMapTap(sId);
  }

  setControllers(animator, demo) {
    this.animator = animator;
    this.demo = demo;
  }

  initElements() {
    this.fromInput = document.getElementById('from-input');
    this.fromDropdown = document.getElementById('from-dropdown');
    this.toInput = document.getElementById('to-input');
    this.toDropdown = document.getElementById('to-dropdown');
    this.swapBtn = document.getElementById('btn-swap');
    this.findRouteBtn = document.getElementById('btn-find-route');
    this.compareBtn = document.getElementById('btn-compare');
    this.resultCard = document.getElementById('result-card');

    this.counterEl = document.getElementById('checked-counter');
    this.narrationEl = document.getElementById('step-narration');
    this.queueListEl = document.getElementById('queue-list');
    this.playPauseBtn = document.getElementById('btn-play-pause');
    this.stepBtn = document.getElementById('btn-step');
    this.resetBtn = document.getElementById('btn-reset');
    this.speedBtns = document.querySelectorAll('.speed-btn');

    this.drawerToggleBtn = document.getElementById('btn-toggle-drawer');
    this.drawerContent = document.getElementById('how-it-works-drawer');
    this.resetViewBtn = document.getElementById('btn-reset-view');
    this.demoBtn = document.getElementById('btn-demo');
    this.exitDemoBtn = document.getElementById('btn-exit-demo');
  }

  setupDropdown(type) {
    const input = type === 'from' ? this.fromInput : this.toInput;
    const dropdown = type === 'from' ? this.fromDropdown : this.toDropdown;
    const stations = Object.values(this.graph.stations).sort((a, b) => a.name.localeCompare(b.name));

    const renderList = (filterText = '') => {
      dropdown.innerHTML = '';
      const filter = filterText.trim().toLowerCase();
      const matches = stations.filter(s => s.name.toLowerCase().includes(filter));

      if (matches.length === 0) {
        const noItem = document.createElement('div');
        noItem.className = 'dropdown-item dropdown-item-empty';
        noItem.textContent = 'No matching stations';
        dropdown.appendChild(noItem);
        return;
      }

      for (const s of matches) {
        const item = document.createElement('div');
        item.className = 'dropdown-item';
        item.innerHTML = `
          <span class="station-name">${s.name}</span>
          <span class="line-badges">
            ${s.lines.map(l => `<span class="badge badge-${l}">${l === 'mrts' ? 'MRTS' : l.toUpperCase()}</span>`).join('')}
          </span>
        `;
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          this.setStation(type, s.id);
          this.closeDropdowns();
        });
        dropdown.appendChild(item);
      }
    };

    input.addEventListener('focus', () => {
      this.closeDropdowns();
      renderList(input.value);
      dropdown.classList.add('open');
    });

    input.addEventListener('input', () => {
      renderList(input.value);
      dropdown.classList.add('open');
    });

    document.addEventListener('click', (e) => {
      if (!input.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.remove('open');
      }
    });
  }

  closeDropdowns() {
    this.fromDropdown.classList.remove('open');
    this.toDropdown.classList.remove('open');
  }

  setStation(type, stationId) {
    const station = this.graph.stations[stationId];
    if (!station) return;

    if (type === 'from') {
      this.fromStationId = stationId;
      this.fromInput.value = station.name;
      this.nextTapTarget = 'to';
    } else {
      this.toStationId = stationId;
      this.toInput.value = station.name;
      this.nextTapTarget = 'from';
    }

    this.renderer.setSelection(this.fromStationId, this.toStationId);
  }

  handleMapTap(stationId) {
    if (this.nextTapTarget === 'from') {
      this.setStation('from', stationId);
    } else {
      this.setStation('to', stationId);
    }
  }

  setupSwapButton() {
    this.swapBtn.addEventListener('click', () => {
      const prevFrom = this.fromStationId;
      const prevTo = this.toStationId;
      this.fromStationId = prevTo;
      this.toStationId = prevFrom;
      this.fromInput.value = this.fromStationId ? this.graph.stations[this.fromStationId].name : '';
      this.toInput.value = this.toStationId ? this.graph.stations[this.toStationId].name : '';
      this.renderer.setSelection(this.fromStationId, this.toStationId);
    });
  }

  setupModeSelector() {
    const buttons = document.querySelectorAll('.mode-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentMode = btn.getAttribute('data-mode');
      });
    });
  }

  setupActionButtons() {
    this.findRouteBtn.addEventListener('click', () => {
      if (!this.fromStationId) { this.fromInput.focus(); return; }
      if (!this.toStationId) { this.toInput.focus(); return; }
      if (this.animator) {
        this.animator.start(this.fromStationId, this.toStationId, this.currentMode);
      }
    });

    this.compareBtn.addEventListener('click', () => {
      if (!this.fromStationId) { this.fromInput.focus(); return; }
      if (!this.toStationId) { this.toInput.focus(); return; }
      if (this.animator) {
        this.animator.runCompare(this.fromStationId, this.toStationId);
      }
    });

    if (this.demoBtn) {
      this.demoBtn.addEventListener('click', () => {
        if (this.demo) this.demo.start();
      });
    }

    if (this.exitDemoBtn) {
      this.exitDemoBtn.addEventListener('click', () => {
        if (this.demo) this.demo.stop();
      });
    }
  }

  setupPlaybackControls() {
    this.playPauseBtn.addEventListener('click', () => {
      if (!this.animator) return;
      if (this.animator.isRunning && !this.animator.isPaused) {
        this.animator.pause();
      } else {
        this.animator.play();
      }
    });

    this.stepBtn.addEventListener('click', () => {
      if (this.animator) this.animator.step();
    });

    this.resetBtn.addEventListener('click', () => {
      if (this.animator) this.animator.stop();
      this.renderer.clearRoute();
      this.renderer.clearSearchHighlights();
      this.resetUnderTheHood();
    });

    this.speedBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.speedBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (this.animator) {
          this.animator.setSpeed(btn.getAttribute('data-speed'));
        }
      });
    });
  }

  setupHowItWorksDrawer() {
    this.drawerToggleBtn.addEventListener('click', () => {
      const isOpen = this.drawerContent.classList.toggle('open');
      this.drawerToggleBtn.setAttribute('aria-expanded', isOpen);
      this.drawerToggleBtn.textContent = isOpen ? 'Hide Explanations' : 'How it works';
    });
  }

  setupShareAndReset() {
    if (this.resetViewBtn) {
      this.resetViewBtn.addEventListener('click', () => {
        this.renderer.resetView();
      });
    }
  }

  shareRoute() {
    if (!this.fromStationId || !this.toStationId) return;
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set('from', this.fromStationId);
    url.searchParams.set('to', this.toStationId);
    navigator.clipboard.writeText(url.toString()).then(() => {
      const toast = document.getElementById('toast-msg');
      if (toast) {
        toast.textContent = 'Route link copied to clipboard!';
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2500);
      }
    }).catch(() => {});
  }

  updatePlayPauseState(isPlaying) {
    this.playPauseBtn.textContent = isPlaying ? 'Pause' : 'Play';
    this.playPauseBtn.classList.toggle('playing', isPlaying);
  }

  updateUnderTheHood(event, algorithm = 'dijkstra') {
    if (this.counterEl) {
      const checked = event.citiesChecked ?? event.stationsChecked ?? 0;
      const total = this.graph.cityCount || 55;
      this.counterEl.textContent = `${checked} / ${total}`;
    }
    if (this.narrationEl) {
      this.narrationEl.textContent = event.narration || '';
    }
    if (this.queueListEl && event.queueSnapshot) {
      this.queueListEl.innerHTML = '';
      if (event.queueSnapshot.length === 0) {
        this.queueListEl.innerHTML = '<li class="queue-empty">Queue empty</li>';
        return;
      }
      for (const item of event.queueSnapshot) {
        const li = document.createElement('li');
        li.className = 'queue-item';
        const displayName = item.cityName || item.stationName || '';
        const displayLabel = item.label || `${displayName} ${item.cost} min`;
        li.innerHTML = `
          <span class="queue-station">${displayName}</span>
          <span class="queue-cost">${item.label ? item.label.split(' ').slice(1).join(' ') : `${item.cost} min`}</span>
        `;
        this.queueListEl.appendChild(li);
      }
    }
  }

  resetUnderTheHood() {
    const total = this.graph.cityCount || 55;
    if (this.counterEl) this.counterEl.textContent = `0 / ${total}`;
    if (this.narrationEl) this.narrationEl.textContent = 'Pick a start and destination, then click Find Route.';
    if (this.queueListEl) this.queueListEl.innerHTML = '<li class="queue-empty">Queue empty</li>';
  }

  showCompareStatus(message) {
    if (this.narrationEl) this.narrationEl.textContent = message;
  }

  renderResultCard(result) {
    const stopsWord = result.stops === 1 ? 'stop' : 'stops';
    const changesWord = result.lineChanges === 1 ? 'line change' : 'line changes';
    const stepsHtml = result.stepsText.map(step => `<li class="step-item">${step}</li>`).join('');

    this.resultCard.innerHTML = `
      <div class="result-header">
        <div class="result-time-block">
          <span class="time-label">Fastest Route</span>
          <span class="time-value">about ${result.totalTime} min</span>
        </div>
        <div class="result-meta-block">
          <span class="meta-pill">${result.stops} ${stopsWord}</span>
          <span class="meta-pill">${result.lineChanges} ${changesWord}</span>
          <button type="button" id="btn-share-route" class="share-btn" title="Copy shareable link">Share</button>
        </div>
      </div>
      <div class="result-steps-wrapper">
        <h4 class="steps-title">Directions</h4>
        <ol class="steps-list">${stepsHtml}</ol>
      </div>
    `;
    this.resultCard.classList.remove('hidden');

    const shareBtn = document.getElementById('btn-share-route');
    if (shareBtn) shareBtn.addEventListener('click', () => this.shareRoute());
  }

  renderCompareResult(dijkstraRes, astarRes) {
    const dCities = dijkstraRes.citiesChecked ?? dijkstraRes.stationsChecked ?? 0;
    const aCities = astarRes.citiesChecked ?? astarRes.stationsChecked ?? 0;
    const gap = dCities - aCities;
    const pct = Math.max(0, Math.round((gap / dCities) * 100));

    this.resultCard.innerHTML = `
      <div class="compare-card">
        <h3 class="compare-title">Comparison Results</h3>
        <div class="compare-metrics-row">
          <div class="metric-box dijkstra-box">
            <span class="metric-name">Dijkstra</span>
            <span class="metric-number" id="count-dijkstra">0</span>
            <span class="metric-sub">cities checked</span>
          </div>
          <div class="metric-vs">vs</div>
          <div class="metric-box astar-box">
            <span class="metric-name">A* Search</span>
            <span class="metric-number" id="count-astar">0</span>
            <span class="metric-sub">cities checked</span>
          </div>
        </div>
        <div class="compare-headline">
          <p class="headline-text">Same ${dijkstraRes.totalTime} min route. <strong>${pct}% less work.</strong></p>
        </div>
        <button type="button" id="btn-share-compare" class="share-btn align-center">Share This Trip</button>
      </div>
    `;
    this.resultCard.classList.remove('hidden');

    this.animateNumber('count-dijkstra', dCities, 700);
    this.animateNumber('count-astar', aCities, 700);

    const shareBtn = document.getElementById('btn-share-compare');
    if (shareBtn) shareBtn.addEventListener('click', () => this.shareRoute());
  }

  animateNumber(elementId, targetValue, duration = 600) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const startTime = performance.now();
    const tick = (currentTime) => {
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const currentVal = Math.round(progress * targetValue);
      el.textContent = currentVal;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  showError(message) {
    this.resultCard.innerHTML = `<div class="result-error"><p>${message}</p></div>`;
    this.resultCard.classList.remove('hidden');
  }
}
