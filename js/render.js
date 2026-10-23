// SVG Map Renderer for Namma Route
// Draws schematic metro map on 1000 x 1400 viewBox canvas
// Handles line strokes, station dots, labels, search ripples, route drawing, and zoom/pan

import { LINES, CONNECTORS } from './data.js';

const TERMINAL_STATIONS = new Set([
  'wimco-nagar-depot', 'chennai-airport', 'chennai-central',
  'st-thomas-mount', 'chennai-beach', 'velachery'
]);

export class MapRenderer {
  constructor(containerId, graph, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) throw new Error(`Container #${containerId} not found`);

    this.graph = graph;
    this.onStationSelect = options.onStationSelect || (() => {});
    this.selectedFromId = null;
    this.selectedToId = null;
    this.activeRoute = null;

    this.defaultViewBox = { x: 0, y: 0, w: 1000, h: 1400 };
    this.viewBox = { ...this.defaultViewBox };

    this.initSvg();
    this.drawLines();
    this.drawConnectors();
    this.drawStations();
    this.attachEvents();
    this.setupZoomPan();
  }

  initSvg() {
    this.container.innerHTML = '';
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.setAttribute('viewBox', '0 0 1000 1400');
    this.svg.setAttribute('class', 'metro-map-svg');
    this.svg.setAttribute('role', 'img');
    this.svg.setAttribute('aria-label', "Chennai Metro and MRTS Network Map");

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
      <filter id="route-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="6" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    `;
    this.svg.appendChild(defs);

    this.connectorsLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.linesLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.searchLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.routeLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.stationsLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.labelsLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    this.svg.append(this.connectorsLayer, this.linesLayer, this.searchLayer, this.routeLayer, this.stationsLayer, this.labelsLayer);
    this.container.appendChild(this.svg);
  }

  drawLines() {
    for (const line of Object.values(LINES)) {
      const points = line.stations.map(sId => `${this.graph.stations[sId].x},${this.graph.stations[sId].y}`);
      const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
      polyline.setAttribute('points', points.join(' '));
      polyline.setAttribute('fill', 'none');
      polyline.setAttribute('stroke', line.color);
      polyline.setAttribute('stroke-width', '8');
      polyline.setAttribute('stroke-linecap', 'round');
      polyline.setAttribute('stroke-linejoin', 'round');
      polyline.setAttribute('class', `metro-line line-${line.id}`);
      this.linesLayer.appendChild(polyline);
    }
  }

  drawConnectors() {
    for (const conn of CONNECTORS) {
      const s1 = this.graph.stations[conn.from];
      const s2 = this.graph.stations[conn.to];
      if (!s1 || !s2) continue;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', s1.x); line.setAttribute('y1', s1.y);
      line.setAttribute('x2', s2.x); line.setAttribute('y2', s2.y);
      line.setAttribute('stroke', '#5B6577');
      line.setAttribute('stroke-width', '3');
      line.setAttribute('stroke-dasharray', '6 6');
      line.setAttribute('stroke-linecap', 'round');
      this.connectorsLayer.appendChild(line);
    }
  }

  drawStations() {
    this.stationElements = {};
    this.labelElements = {};

    for (const station of Object.values(this.graph.stations)) {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', `station-group station-${station.id}`);
      g.setAttribute('data-id', station.id);
      g.setAttribute('transform', `translate(${station.x}, ${station.y})`);

      const hitTarget = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      hitTarget.setAttribute('r', '20');
      hitTarget.setAttribute('fill', 'transparent');
      g.appendChild(hitTarget);

      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      if (station.isInterchange) {
        dot.setAttribute('r', '11');
        dot.setAttribute('fill', '#0B0F17');
        dot.setAttribute('stroke', '#E8ECF3');
        dot.setAttribute('stroke-width', '4');
        dot.setAttribute('class', 'station-dot interchange-ring');
        const innerDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        innerDot.setAttribute('r', '4');
        innerDot.setAttribute('fill', '#E8ECF3');
        g.appendChild(innerDot);
      } else {
        dot.setAttribute('r', '6');
        dot.setAttribute('fill', '#0B0F17');
        dot.setAttribute('stroke', '#E8ECF3');
        dot.setAttribute('stroke-width', '2.5');
        dot.setAttribute('class', 'station-dot normal-dot');
      }
      g.appendChild(dot);
      this.stationsLayer.appendChild(g);
      this.stationElements[station.id] = g;

      const isAlwaysVisible = station.isInterchange || TERMINAL_STATIONS.has(station.id);
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', station.x + (station.x > 700 ? -14 : 14));
      label.setAttribute('y', station.y + 4);
      label.setAttribute('text-anchor', station.x > 700 ? 'end' : 'start');
      label.setAttribute('class', `station-label ${isAlwaysVisible ? 'label-always' : 'label-optional'}`);
      label.textContent = station.name;
      this.labelsLayer.appendChild(label);
      this.labelElements[station.id] = label;
    }
  }

  attachEvents() {
    this.svg.addEventListener('click', (e) => {
      if (this.wasPanning) { this.wasPanning = false; return; }
      const group = e.target.closest('.station-group');
      if (group) {
        this.onStationSelect(group.getAttribute('data-id'));
        return;
      }
      const pt = this.svg.createSVGPoint();
      pt.x = e.clientX; pt.y = e.clientY;
      const svgPoint = pt.matrixTransform(this.svg.getScreenCTM().inverse());
      let nearestId = null;
      let minDist = 35;
      for (const s of Object.values(this.graph.stations)) {
        const d = Math.hypot(s.x - svgPoint.x, s.y - svgPoint.y);
        if (d < minDist) { minDist = d; nearestId = s.id; }
      }
      if (nearestId) this.onStationSelect(nearestId);
    });

    this.svg.addEventListener('mousemove', (e) => {
      const group = e.target.closest('.station-group');
      if (group) this.showLabel(group.getAttribute('data-id'), true);
    });
    this.svg.addEventListener('mouseleave', () => this.updateLabelVisibility());
  }

  // Zoom & Pan support
  setupZoomPan() {
    let isDragging = false;
    let startX = 0; let startY = 0;
    this.wasPanning = false;

    this.svg.addEventListener('mousedown', (e) => {
      if (e.target.closest('.station-hit-area')) return;
      isDragging = true;
      this.wasPanning = false;
      startX = e.clientX;
      startY = e.clientY;
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = (e.clientX - startX) * (this.viewBox.w / this.svg.clientWidth);
      const dy = (e.clientY - startY) * (this.viewBox.h / this.svg.clientHeight);
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) this.wasPanning = true;
      this.viewBox.x -= dx;
      this.viewBox.y -= dy;
      startX = e.clientX;
      startY = e.clientY;
      this.applyViewBox();
    });

    window.addEventListener('mouseup', () => { isDragging = false; });

    this.svg.addEventListener('wheel', (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 0.9 : 1.1;
      const newW = Math.max(300, Math.min(1800, this.viewBox.w * factor));
      const newH = Math.max(420, Math.min(2520, this.viewBox.h * factor));
      this.viewBox.x -= (newW - this.viewBox.w) / 2;
      this.viewBox.y -= (newH - this.viewBox.h) / 2;
      this.viewBox.w = newW;
      this.viewBox.h = newH;
      this.applyViewBox();
    }, { passive: false });
  }

  applyViewBox() {
    this.svg.setAttribute('viewBox', `${this.viewBox.x} ${this.viewBox.y} ${this.viewBox.w} ${this.viewBox.h}`);
  }

  resetView() {
    this.viewBox = { ...this.defaultViewBox };
    this.applyViewBox();
  }

  setSelection(fromId, toId) {
    this.selectedFromId = fromId;
    this.selectedToId = toId;
    for (const [id, g] of Object.entries(this.stationElements)) {
      g.classList.remove('selected-from', 'selected-to');
      if (id === fromId) g.classList.add('selected-from');
      if (id === toId) g.classList.add('selected-to');
    }
    this.updateLabelVisibility();
  }

  showLabel(stationId, hover = false) {
    const label = this.labelElements[stationId];
    if (label && !label.classList.contains('label-always')) {
      label.classList.add('label-hover');
      setTimeout(() => { if (!hover) label.classList.remove('label-hover'); }, 2000);
    }
  }

  updateLabelVisibility() {
    for (const [id, label] of Object.entries(this.labelElements)) {
      const isAlways = this.graph.stations[id].isInterchange || TERMINAL_STATIONS.has(id);
      const isSelected = (id === this.selectedFromId) || (id === this.selectedToId);
      if (isAlways || isSelected) label.classList.add('label-active');
      else label.classList.remove('label-active');
      label.classList.remove('label-hover');
    }
  }

  // Animation: Station visited (pulsing ripple and glow)
  animateStationVisit(stationId, color = '#56CCF2') {
    const station = this.graph.stations[stationId];
    const group = this.stationElements[stationId];
    if (!station || !group) return;

    const ripple = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    ripple.setAttribute('cx', station.x);
    ripple.setAttribute('cy', station.y);
    ripple.setAttribute('r', '8');
    ripple.setAttribute('fill', 'none');
    ripple.setAttribute('stroke', color);
    ripple.setAttribute('stroke-width', '3');
    ripple.setAttribute('class', 'search-ripple');
    this.searchLayer.appendChild(ripple);
    setTimeout(() => ripple.remove(), 700);

    const dot = group.querySelector('.station-dot');
    if (dot) {
      dot.style.stroke = color;
      dot.style.fill = color;
      dot.classList.add('pulse-once');
      setTimeout(() => dot.classList.remove('pulse-once'), 300);
    }
    group.classList.add('station-explored');
  }

  animateQueueCandidate(stationId) {
    const group = this.stationElements[stationId];
    if (group && !group.classList.contains('station-explored')) {
      group.classList.add('station-in-queue');
    }
  }

  animateRouteDraw(path, onComplete = null) {
    this.clearRoute();
    if (!path || path.length < 2) {
      if (onComplete) onComplete();
      return;
    }

    const points = [];
    for (const stop of path) {
      const s = this.graph.stations[stop.stationId];
      if (s) {
        points.push(`${s.x},${s.y}`);
        const el = this.stationElements[stop.stationId];
        if (el) el.classList.add('route-station');
      }
    }

    const glowPath = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    glowPath.setAttribute('points', points.join(' '));
    glowPath.setAttribute('fill', 'none');
    glowPath.setAttribute('stroke', '#FFB020');
    glowPath.setAttribute('stroke-width', '12');
    glowPath.setAttribute('stroke-linecap', 'round');
    glowPath.setAttribute('stroke-linejoin', 'round');
    glowPath.setAttribute('class', 'route-outer-glow');
    glowPath.setAttribute('filter', 'url(#route-glow)');
    this.routeLayer.appendChild(glowPath);

    const corePath = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    corePath.setAttribute('points', points.join(' '));
    corePath.setAttribute('fill', 'none');
    corePath.setAttribute('stroke', '#FFFFFF');
    corePath.setAttribute('stroke-width', '4');
    corePath.setAttribute('stroke-linecap', 'round');
    corePath.setAttribute('stroke-linejoin', 'round');
    corePath.setAttribute('class', 'route-inner-core');
    this.routeLayer.appendChild(corePath);

    const totalLength = corePath.getTotalLength ? corePath.getTotalLength() : 1200;
    glowPath.style.strokeDasharray = `${totalLength} ${totalLength}`;
    glowPath.style.strokeDashoffset = `${totalLength}`;
    corePath.style.strokeDasharray = `${totalLength} ${totalLength}`;
    corePath.style.strokeDashoffset = `${totalLength}`;

    const duration = 650;
    const startTime = performance.now();

    const animateStroke = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const offset = totalLength * (1 - ease);

      glowPath.style.strokeDashoffset = `${offset}`;
      corePath.style.strokeDashoffset = `${offset}`;

      if (progress < 1) {
        requestAnimationFrame(animateStroke);
      } else {
        glowPath.style.strokeDasharray = 'none';
        corePath.style.strokeDasharray = 'none';
        if (onComplete) onComplete();
      }
    };
    requestAnimationFrame(animateStroke);
  }

  clearSearchHighlights() {
    this.searchLayer.innerHTML = '';
    for (const g of Object.values(this.stationElements || {})) {
      g.classList.remove('station-explored', 'station-in-queue');
      const dot = g.querySelector('.station-dot');
      if (dot) {
        dot.style.stroke = '';
        dot.style.fill = '';
      }
    }
  }

  clearRoute() {
    this.routeLayer.innerHTML = '';
    this.activeRoute = null;
    for (const g of Object.values(this.stationElements || {})) {
      g.classList.remove('route-station');
    }
  }
}
