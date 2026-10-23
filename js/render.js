// SVG Map Renderer for Namma Route: Tamil Nadu Transit Network
// Renders state outline, offset road/rail lines, city dots, tier-based labels,
// zoom/pan with viewBox, pointer coordinate transformations, and route animations.

export class MapRenderer {
  constructor(containerId, graph, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) throw new Error(`Container #${containerId} not found`);

    this.graph = graph;
    this.onCitySelect = options.onCitySelect || (() => {});
    this.onInvalidSelect = options.onInvalidSelect || (() => {});

    this.travelMode = 'any';
    this.selectedFromId = null;
    this.selectedToId = null;
    this.routeCityIds = new Set();

    this.defaultViewBox = { x: 0, y: 0, w: 1000, h: 1330 };
    this.viewBox = { ...this.defaultViewBox };
    this.zoomLevel = 1.0;

    this.initSvg();
    this.drawMapElements();
    this.setupEvents();
    this.setupZoomPan();
  }

  createSvgEl(tag, attrs = {}) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    return el;
  }

  initSvg() {
    this.container.innerHTML = '';
    this.svg = this.createSvgEl('svg', {
      viewBox: `${this.viewBox.x} ${this.viewBox.y} ${this.viewBox.w} ${this.viewBox.h}`,
      class: 'tn-map-svg',
      role: 'img',
      'aria-label': 'Tamil Nadu Road and Rail Transit Map'
    });

    const defs = this.createSvgEl('defs');
    defs.innerHTML = `
      <linearGradient id="route-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="var(--route-from)" />
        <stop offset="100%" stop-color="var(--route-to)" />
      </linearGradient>
      <filter id="route-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="5" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    `;
    this.svg.appendChild(defs);

    // Layers ordered bottom to top: outline, road, rail, search, route, cities, labels, pins
    this.layers = {
      outline: this.createSvgEl('g'),
      road: this.createSvgEl('g'),
      rail: this.createSvgEl('g'),
      search: this.createSvgEl('g'),
      route: this.createSvgEl('g'),
      cities: this.createSvgEl('g'),
      labels: this.createSvgEl('g'),
      pins: this.createSvgEl('g')
    };
    Object.values(this.layers).forEach((l) => this.svg.appendChild(l));
    this.container.appendChild(this.svg);
  }

  getOffset(x1, y1, x2, y2, offset) {
    if (!offset) return { x1, y1, x2, y2 };
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
    if (!L) return { x1, y1, x2, y2 };
    const nx = (-dy / L) * offset, ny = (dx / L) * offset;
    return { x1: x1 + nx, y1: y1 + ny, x2: x2 + nx, y2: y2 + ny };
  }

  drawMapElements() {
    // 1. State outline
    this.layers.outline.appendChild(this.createSvgEl('path', { d: this.graph.outline, class: 'state-outline-path' }));

    // 2. Road links
    for (const l of this.graph.roadLinks) {
      const c1 = this.graph.cities[l.a], c2 = this.graph.cities[l.b];
      if (!c1 || !c2) continue;
      const { x1, y1, x2, y2 } = this.getOffset(c1.x, c1.y, c2.x, c2.y, l.offset);
      this.layers.road.appendChild(this.createSvgEl('line', { x1, y1, x2, y2, class: `road-link road-${l.kind}` }));
    }

    // 3. Rail links (dual-line railway track)
    for (const l of this.graph.railLinks) {
      const c1 = this.graph.cities[l.a], c2 = this.graph.cities[l.b];
      if (!c1 || !c2) continue;
      const { x1, y1, x2, y2 } = this.getOffset(c1.x, c1.y, c2.x, c2.y, l.offset);
      this.layers.rail.appendChild(this.createSvgEl('line', { x1, y1, x2, y2, class: `rail-link-base rail-${l.kind}` }));
      const dash = this.createSvgEl('line', { x1, y1, x2, y2, class: `rail-link-dash rail-${l.kind}` });
      if (l.kind === 'hill') dash.innerHTML = '<title>Nilgiri Mountain Railway. Very slow.</title>';
      this.layers.rail.appendChild(dash);
    }

    // 4. Cities and labels
    this.cityElements = {};
    this.labelElements = {};

    for (const city of Object.values(this.graph.cities)) {
      const g = this.createSvgEl('g', {
        class: `city-group city-${city.id} tier-${city.tier} ${city.hq ? 'is-hq' : 'is-town'}`,
        'data-id': city.id,
        transform: `translate(${city.x}, ${city.y})`
      });
      const dot = this.createSvgEl('circle', { r: city.tier === 1 ? 9 : 6.5, class: city.hq ? 'city-dot hq-dot' : 'city-dot town-dot' });
      g.appendChild(dot);
      this.layers.cities.appendChild(g);
      this.cityElements[city.id] = g;

      const lbl = city.label || { dx: 12, dy: 6, anchor: 'start' };
      const label = this.createSvgEl('text', {
        x: city.x + lbl.dx,
        y: city.y + lbl.dy,
        'text-anchor': lbl.anchor || 'start',
        class: `city-label tier-${city.tier}`,
        'data-tier': city.tier
      });
      label.textContent = city.name;
      this.layers.labels.appendChild(label);
      this.labelElements[city.id] = label;
    }

    this.updateLabelVisibility();
  }

  setupEvents() {
    this.svg.addEventListener('click', (e) => {
      if (this.wasPanning) { this.wasPanning = false; return; }
      const group = e.target.closest('.city-group');
      if (group) { this.handleCityClick(group.getAttribute('data-id')); return; }

      const ctm = this.svg.getScreenCTM();
      if (!ctm) return;
      const svgPoint = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
      const maxDist = 22 * (this.viewBox.w / (this.svg.clientWidth || 1000));
      let nearestId = null, minDist = maxDist;

      for (const c of Object.values(this.graph.cities)) {
        const d = Math.hypot(c.x - svgPoint.x, c.y - svgPoint.y);
        if (d < minDist) { minDist = d; nearestId = c.id; }
      }
      if (nearestId) this.handleCityClick(nearestId);
    });

    this.hoverCard = document.getElementById('city-hover-card');
    this.svg.addEventListener('mousemove', (e) => {
      const group = e.target.closest('.city-group');
      if (group && this.hoverCard) {
        const city = this.graph.cities[group.getAttribute('data-id')];
        if (city) {
          const stationInfo = city.rail ? `Railway station: ${city.station || city.name}` : 'No railway station';
          const distInfo = city.district ? `<div class="hover-district">${city.district} District</div>` : '';
          this.hoverCard.innerHTML = `<div class="hover-title">${city.name}</div>${distInfo}<div class="hover-rail ${city.rail ? 'has-station' : 'no-station'}">${stationInfo}</div>`;
          this.hoverCard.style.left = `${e.clientX + 14}px`;
          this.hoverCard.style.top = `${e.clientY + 14}px`;
          this.hoverCard.classList.remove('hidden');
          this.labelElements[city.id]?.classList.add('label-hover');
        }
      } else if (this.hoverCard) {
        this.hoverCard.classList.add('hidden');
        document.querySelectorAll('.label-hover').forEach((l) => l.classList.remove('label-hover'));
      }
    });

    this.svg.addEventListener('mouseleave', () => {
      if (this.hoverCard) this.hoverCard.classList.add('hidden');
      document.querySelectorAll('.label-hover').forEach((l) => l.classList.remove('label-hover'));
    });
  }

  handleCityClick(cityId) {
    const city = this.graph.cities[cityId];
    if (!city) return;
    const isTrain = this.travelMode === 'train' || this.travelMode === 'rail';
    if (isTrain && !city.rail) {
      const g = this.cityElements[cityId];
      if (g) { g.classList.add('shake-anim'); setTimeout(() => g.classList.remove('shake-anim'), 350); }
      this.onInvalidSelect(city);
      return;
    }
    this.onCitySelect(cityId);
  }

  setupZoomPan() {
    let isDragging = false, startX = 0, startY = 0;
    this.wasPanning = false;

    this.svg.addEventListener('mousedown', (e) => {
      isDragging = true; this.wasPanning = false;
      startX = e.clientX; startY = e.clientY;
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = (e.clientX - startX) * (this.viewBox.w / (this.svg.clientWidth || 1000));
      const dy = (e.clientY - startY) * (this.viewBox.h / (this.svg.clientHeight || 1330));
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) this.wasPanning = true;
      this.viewBox.x -= dx; this.viewBox.y -= dy;
      startX = e.clientX; startY = e.clientY;
      this.applyViewBox();
    });

    window.addEventListener('mouseup', () => { isDragging = false; });

    this.svg.addEventListener('wheel', (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 0.9 : 1.1;
      const newW = Math.max(250, Math.min(1000, this.viewBox.w * factor));
      const newH = Math.max(332, Math.min(1330, this.viewBox.h * factor));
      this.viewBox.x -= (newW - this.viewBox.w) / 2;
      this.viewBox.y -= (newH - this.viewBox.h) / 2;
      this.viewBox.w = newW; this.viewBox.h = newH;
      this.applyViewBox();
    }, { passive: false });
  }

  applyViewBox() {
    this.zoomLevel = 1000 / this.viewBox.w;
    this.svg.setAttribute('viewBox', `${this.viewBox.x} ${this.viewBox.y} ${this.viewBox.w} ${this.viewBox.h}`);
    this.updateLabelVisibility();
  }

  resetView() {
    this.viewBox = { ...this.defaultViewBox };
    this.applyViewBox();
  }

  setTravelMode(mode) {
    this.travelMode = mode;
    const isTrain = mode === 'train' || mode === 'rail';
    for (const [id, g] of Object.entries(this.cityElements)) {
      if (isTrain && !this.graph.cities[id].rail) g.classList.add('city-dimmed');
      else g.classList.remove('city-dimmed');
    }
  }

  setSelection(fromId, toId) {
    if (fromId && fromId !== this.selectedFromId) this.pulseCity(fromId);
    if (toId && toId !== this.selectedToId) this.pulseCity(toId);
    this.selectedFromId = fromId;
    this.selectedToId = toId;
    for (const [id, g] of Object.entries(this.cityElements)) {
      g.classList.toggle('selected-from', id === fromId);
      g.classList.toggle('selected-to', id === toId);
    }
    this.drawPins();
    this.updateLabelVisibility();
  }

  pulseCity(cityId) {
    const c = this.graph.cities[cityId];
    if (!c) return;
    const pulse = this.createSvgEl('circle', {
      cx: c.x,
      cy: c.y,
      r: 9,
      class: 'city-picked-pulse-ring'
    });
    this.layers.search.appendChild(pulse);
    setTimeout(() => pulse.remove(), 650);
  }

  drawPins() {
    this.layers.pins.innerHTML = '';
    const addPin = (cityId, cls) => {
      const c = this.graph.cities[cityId];
      if (!c) return;
      const pin = this.createSvgEl('g', { class: `map-pin ${cls}`, transform: `translate(${c.x}, ${c.y - 12})` });
      pin.innerHTML = `
        <ellipse cx="0" cy="12" rx="5" ry="2" class="pin-shadow" />
        <g class="pin-body">
          <circle r="7" class="pin-head" />
          <path d="M-4 0 L0 10 L4 0 Z" class="pin-needle" />
        </g>
      `;
      this.layers.pins.appendChild(pin);
    };
    if (this.selectedFromId) addPin(this.selectedFromId, 'pin-start');
    if (this.selectedToId) addPin(this.selectedToId, 'pin-end');
  }

  updateLabelVisibility() {
    const isMobile = window.innerWidth < 768, z = this.zoomLevel;
    for (const [id, label] of Object.entries(this.labelElements)) {
      const city = this.graph.cities[id];
      const isSelected = id === this.selectedFromId || id === this.selectedToId;
      const isOnRoute = this.routeCityIds.has(id);
      if (isSelected || isOnRoute) { label.classList.add('label-visible'); continue; }

      if (isMobile) {
        label.classList.toggle('label-visible', city.tier === 1 || (city.tier === 2 && z >= 1.6) || (city.tier === 3 && z >= 2.5));
      } else {
        label.classList.toggle('label-visible', city.tier === 1 || city.tier === 2 || (city.tier === 3 && z >= 1.6));
      }
    }
  }

  animateCityVisit(cityId, color = 'var(--accent)') {
    const city = this.graph.cities[cityId], group = this.cityElements[cityId];
    if (!city || !group) return;

    const ripple = this.createSvgEl('circle', { cx: city.x, cy: city.y, r: 8, class: 'search-ripple' });
    ripple.style.stroke = color;
    this.layers.search.appendChild(ripple);
    setTimeout(() => ripple.remove(), 650);

    const dot = group.querySelector('.city-dot');
    if (dot) {
      dot.style.stroke = color;
      dot.classList.add('pulse-once');
      setTimeout(() => dot.classList.remove('pulse-once'), 300);
    }
    group.classList.add('city-explored');
  }

  animateQueueCandidate(cityId) {
    const group = this.cityElements[cityId];
    if (group && !group.classList.contains('city-explored')) group.classList.add('city-in-queue');
  }

  animateRouteDraw(path, onComplete = null) {
    this.clearRoute();
    if (!path || path.length < 2) { if (onComplete) onComplete(); return; }

    const points = [];
    this.routeCityIds.clear();
    for (const stop of path) {
      const c = this.graph.cities[stop.cityId];
      if (c) {
        points.push(`${c.x},${c.y}`);
        this.routeCityIds.add(stop.cityId);
        this.cityElements[stop.cityId]?.classList.add('route-city');
      }
    }
    this.updateLabelVisibility();

    const glow = this.createSvgEl('polyline', { points: points.join(' '), class: 'route-outer-glow', filter: 'url(#route-glow)' });
    const core = this.createSvgEl('polyline', { points: points.join(' '), class: 'route-inner-core' });
    this.layers.route.append(glow, core);

    const totalLength = core.getTotalLength ? core.getTotalLength() : 1200;
    glow.style.strokeDasharray = `${totalLength} ${totalLength}`;
    glow.style.strokeDashoffset = `${totalLength}`;
    core.style.strokeDasharray = `${totalLength} ${totalLength}`;
    core.style.strokeDashoffset = `${totalLength}`;

    const duration = 650, startTime = performance.now();
    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const offset = totalLength * (1 - ease);
      glow.style.strokeDashoffset = `${offset}`;
      core.style.strokeDashoffset = `${offset}`;
      if (progress < 1) requestAnimationFrame(step);
      else {
        glow.style.strokeDasharray = 'none'; core.style.strokeDasharray = 'none';
        if (onComplete) onComplete();
      }
    };
    requestAnimationFrame(step);
  }

  clearSearchHighlights() {
    this.layers.search.innerHTML = '';
    for (const g of Object.values(this.cityElements || {})) {
      g.classList.remove('city-explored', 'city-in-queue');
      const dot = g.querySelector('.city-dot');
      if (dot) dot.style.stroke = '';
    }
  }

  clearRoute() {
    this.layers.route.innerHTML = '';
    this.routeCityIds.clear();
    for (const g of Object.values(this.cityElements || {})) g.classList.remove('route-city');
    this.updateLabelVisibility();
  }
}
