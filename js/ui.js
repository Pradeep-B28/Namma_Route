// UI Controller for Namma Route: Tamil Nadu Transit Network
// Manages travel mode tabs, search comboboxes with aliases, Under the Hood panel,
// Compare mode, "How it works" drawer, toasts, and shareable URLs.

export class UIController {
  constructor(graph, renderer) {
    this.graph = graph;
    this.renderer = renderer;
    this.animator = null;
    this.demo = null;

    this.fromCityId = null;
    this.toCityId = null;
    this.currentAlgorithm = 'dijkstra';
    this.travelMode = 'any';
    this.nextTapTarget = 'from';

    this.initElements();
    this.setupTravelTabs();
    this.setupDropdown('from');
    this.setupDropdown('to');
    this.setupSwapButton();
    this.setupAlgorithmSelector();
    this.setupActionButtons();
    this.setupPlaybackControls();
    this.setupHowItWorksDrawer();
    this.setupShareAndReset();

    this.renderer.onCitySelect = (cId) => this.handleMapTap(cId);
    this.renderer.onInvalidSelect = (c) => this.showToast(`No railway station in ${c.name}. Try Road or Any.`);
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
    this.toastEl = document.getElementById('toast-msg');
  }

  setupTravelTabs() {
    const tabs = document.querySelectorAll('.travel-tab-btn');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        this.travelMode = tab.getAttribute('data-travel');
        this.renderer.setTravelMode(this.travelMode);

        if (this.travelMode === 'train') {
          if (this.fromCityId && !this.graph.cities[this.fromCityId]?.rail) {
            this.showToast(`No railway station in ${this.graph.cities[this.fromCityId].name}. Try Road or Any.`);
            this.fromCityId = null; this.fromInput.value = '';
          }
          if (this.toCityId && !this.graph.cities[this.toCityId]?.rail) {
            this.showToast(`No railway station in ${this.graph.cities[this.toCityId].name}. Try Road or Any.`);
            this.toCityId = null; this.toInput.value = '';
          }
          this.renderer.setSelection(this.fromCityId, this.toCityId);
        }
      });
    });
  }

  setupDropdown(type) {
    const input = type === 'from' ? this.fromInput : this.toInput;
    const dropdown = type === 'from' ? this.fromDropdown : this.toDropdown;
    const cities = Object.values(this.graph.cities).sort((a, b) => a.name.localeCompare(b.name));

    const highlight = (text, q) => {
      if (!q) return text;
      const idx = text.toLowerCase().indexOf(q.toLowerCase());
      if (idx === -1) return text;
      return `${text.slice(0, idx)}<strong>${text.slice(idx, idx + q.length)}</strong>${text.slice(idx + q.length)}`;
    };

    const renderList = (filterText = '') => {
      dropdown.innerHTML = '';
      const filter = filterText.trim().toLowerCase();
      const isTrain = this.travelMode === 'train';

      const matches = cities.filter((c) => {
        if (!filter) return true;
        return c.name.toLowerCase().includes(filter) || c.aliases?.some((a) => a.toLowerCase().includes(filter));
      });

      if (!matches.length) {
        dropdown.innerHTML = '<div class="dropdown-item dropdown-item-empty">No matching cities</div>';
        return;
      }

      for (const c of matches) {
        const item = document.createElement('div');
        const disabled = isTrain && !c.rail;
        item.className = `dropdown-item ${disabled ? 'disabled-item' : ''}`;

        const aliasMatch = filter && !c.name.toLowerCase().includes(filter)
          ? c.aliases?.find((a) => a.toLowerCase().includes(filter)) : null;
        const aliasHtml = aliasMatch ? ` <span class="alias-tag">(${highlight(aliasMatch, filter)})</span>` : '';
        const badgeHtml = disabled ? '<span class="no-station-tag">(no station)</span>'
          : (c.rail ? '<span class="badge badge-rail">Train</span>' : '<span class="badge badge-road">Road</span>');

        item.innerHTML = `<span class="city-name-text">${highlight(c.name, filter)}${aliasHtml}</span><span class="city-badges">${badgeHtml}</span>`;

        item.addEventListener('click', (e) => {
          e.stopPropagation();
          if (disabled) {
            this.showToast(`No railway station in ${c.name}. Try Road or Any.`);
          } else {
            this.setStation(type, c.id);
            this.closeDropdowns();
          }
        });
        dropdown.appendChild(item);
      }
    };

    input.addEventListener('focus', () => { this.closeDropdowns(); renderList(input.value); dropdown.classList.add('open'); });
    input.addEventListener('input', () => { renderList(input.value); dropdown.classList.add('open'); });
    document.addEventListener('click', (e) => {
      if (!input.contains(e.target) && !dropdown.contains(e.target)) dropdown.classList.remove('open');
    });
  }

  closeDropdowns() {
    this.fromDropdown.classList.remove('open');
    this.toDropdown.classList.remove('open');
  }

  setStation(type, cityId) {
    const city = this.graph.cities[cityId];
    if (!city) return;
    if (type === 'from') {
      this.fromCityId = cityId; this.fromInput.value = city.name; this.nextTapTarget = 'to';
    } else {
      this.toCityId = cityId; this.toInput.value = city.name; this.nextTapTarget = 'from';
    }
    this.renderer.setSelection(this.fromCityId, this.toCityId);
  }

  handleMapTap(cityId) {
    if (this.nextTapTarget === 'from') this.setStation('from', cityId);
    else this.setStation('to', cityId);
  }

  setupSwapButton() {
    this.swapBtn.addEventListener('click', () => {
      const prevFrom = this.fromCityId, prevTo = this.toCityId;
      this.fromCityId = prevTo; this.toCityId = prevFrom;
      this.fromInput.value = this.fromCityId ? this.graph.cities[this.fromCityId].name : '';
      this.toInput.value = this.toCityId ? this.graph.cities[this.toCityId].name : '';
      this.renderer.setSelection(this.fromCityId, this.toCityId);
    });
  }

  setupAlgorithmSelector() {
    const buttons = document.querySelectorAll('.mode-btn');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        buttons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentAlgorithm = btn.getAttribute('data-mode');
      });
    });
  }

  setupActionButtons() {
    this.findRouteBtn.addEventListener('click', () => {
      if (!this.fromCityId) { this.fromInput.focus(); return; }
      if (!this.toCityId) { this.toInput.focus(); return; }
      this.animator?.start(this.fromCityId, this.toCityId, this.currentAlgorithm, this.travelMode);
    });

    this.compareBtn.addEventListener('click', () => {
      if (!this.fromCityId) { this.fromInput.focus(); return; }
      if (!this.toCityId) { this.toInput.focus(); return; }
      this.animator?.runCompare(this.fromCityId, this.toCityId, this.travelMode);
    });

    this.demoBtn?.addEventListener('click', () => this.demo?.start());
    this.exitDemoBtn?.addEventListener('click', () => this.demo?.stop());
  }

  setupPlaybackControls() {
    this.playPauseBtn.addEventListener('click', () => {
      if (!this.animator) return;
      if (this.animator.isRunning && !this.animator.isPaused) this.animator.pause();
      else this.animator.play();
    });

    this.stepBtn.addEventListener('click', () => this.animator?.step());
    this.resetBtn.addEventListener('click', () => {
      this.animator?.stop();
      this.renderer.clearRoute();
      this.renderer.clearSearchHighlights();
      this.resetUnderTheHood();
    });

    this.speedBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.speedBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.animator?.setSpeed(btn.getAttribute('data-speed'));
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
    this.resetViewBtn?.addEventListener('click', () => this.renderer.resetView());
  }

  showToast(message) {
    if (!this.toastEl) return;
    this.toastEl.textContent = message;
    this.toastEl.classList.add('show');
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => this.toastEl.classList.remove('show'), 3000);
  }

  shareRoute(btnElement) {
    if (!this.fromCityId || !this.toCityId) return;
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set('from', this.fromCityId);
    url.searchParams.set('to', this.toCityId);
    url.searchParams.set('mode', this.travelMode);

    navigator.clipboard.writeText(url.toString()).then(() => {
      if (btnElement) {
        const orig = btnElement.textContent;
        btnElement.textContent = 'Link copied \u2713';
        setTimeout(() => { btnElement.textContent = orig; }, 1500);
      }
      this.showToast('Route link copied to clipboard!');
    }).catch(() => {});
  }

  updatePlayPauseState(isPlaying) {
    this.playPauseBtn.textContent = isPlaying ? 'Pause' : 'Play';
    this.playPauseBtn.classList.toggle('playing', isPlaying);
  }

  updateUnderTheHood(event, algorithm = 'dijkstra') {
    if (this.counterEl) {
      const checked = event.citiesChecked ?? 0;
      this.counterEl.textContent = `${checked} / ${this.graph.cityCount || 55}`;
    }
    if (this.narrationEl) this.narrationEl.textContent = event.narration || '';
    if (this.queueListEl && event.queueSnapshot) {
      this.queueListEl.innerHTML = '';
      if (!event.queueSnapshot.length) {
        this.queueListEl.innerHTML = '<li class="queue-empty">Queue empty</li>';
        return;
      }
      for (const item of event.queueSnapshot) {
        const li = document.createElement('li');
        li.className = 'queue-item';
        li.innerHTML = `<span class="queue-station">${item.cityName} (${item.type})</span><span class="queue-cost">${item.label ? item.label.split(' ').slice(2).join(' ') : `${item.cost} min`}</span>`;
        this.queueListEl.appendChild(li);
      }
    }
  }

  resetUnderTheHood() {
    if (this.counterEl) this.counterEl.textContent = `0 / ${this.graph.cityCount || 55}`;
    if (this.narrationEl) this.narrationEl.textContent = 'Pick a start and destination, then click Find Route.';
    if (this.queueListEl) this.queueListEl.innerHTML = '<li class="queue-empty">Queue empty</li>';
  }

  showCompareStatus(msg) {
    if (this.narrationEl) this.narrationEl.textContent = msg;
  }

  renderResultCard(result) {
    const stopsWord = result.stops === 1 ? 'stop' : 'stops';
    const switchesWord = result.switches === 1 ? 'switch' : 'switches';
    const stepsHtml = result.stepsText.map((s) => `<li class="step-item">${s}</li>`).join('');

    const hours = Math.floor(result.totalTime / 60);
    const mins = Math.round(result.totalTime % 60);
    const timeText = hours === 0 ? `about ${mins} min` : (mins === 0 ? `about ${hours} h` : `about ${hours} h ${mins} min`);

    this.resultCard.innerHTML = `
      <div class="result-header">
        <div class="result-time-block">
          <span class="time-label">Fastest Route (${this.travelMode.toUpperCase()})</span>
          <span class="time-value">${timeText}</span>
        </div>
        <div class="result-meta-block">
          <span class="meta-pill">${result.totalKm} km</span>
          <span class="meta-pill">${result.stops} ${stopsWord}</span>
          ${result.switches > 0 ? `<span class="meta-pill">${result.switches} ${switchesWord}</span>` : ''}
          <button type="button" id="btn-share-route" class="share-btn">Share</button>
        </div>
      </div>
      <div class="result-steps-wrapper">
        <h4 class="steps-title">Directions</h4>
        <ol class="steps-list">${stepsHtml}</ol>
      </div>
    `;
    this.resultCard.classList.remove('hidden');

    const shareBtn = document.getElementById('btn-share-route');
    shareBtn?.addEventListener('click', () => this.shareRoute(shareBtn));
  }

  renderCompareResult(dijkstraRes, astarRes) {
    const dCities = dijkstraRes.citiesChecked ?? 0;
    const aCities = astarRes.citiesChecked ?? 0;
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
          <p class="headline-text">Dijkstra checked ${dCities} cities. A* checked ${aCities}. Same route, ${pct}% less work.</p>
        </div>
        <button type="button" id="btn-share-compare" class="share-btn align-center">Share This Trip</button>
      </div>
    `;
    this.resultCard.classList.remove('hidden');

    this.animateNumber('count-dijkstra', dCities, 700);
    this.animateNumber('count-astar', aCities, 700);

    const shareBtn = document.getElementById('btn-share-compare');
    shareBtn?.addEventListener('click', () => this.shareRoute(shareBtn));
  }

  animateNumber(id, target, duration = 600) {
    const el = document.getElementById(id);
    if (!el) return;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      el.textContent = Math.round(p * target);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  showError(message) {
    this.resultCard.innerHTML = `<div class="result-error"><p>${message}</p></div>`;
    this.resultCard.classList.remove('hidden');
  }
}
