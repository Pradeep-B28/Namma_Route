// Demo Mode Controller for Namma Route
// Auto-plays and loops a showcase trip for recording reels
// Shows visible tap animations, runs Compare mode, holds result for 3s, and loops

export class DemoController {
  constructor(graph, renderer, animator, ui) {
    this.graph = graph;
    this.renderer = renderer;
    this.animator = animator;
    this.ui = ui;

    this.isActive = false;
    this.timeoutId = null;

    // Best demo trip chosen from Phase 1 computation:
    // Nandanam to Tiruvottriyur Theradi (Dijkstra 56 vs A* 24, 57% reduction)
    this.demoStartId = 'nandanam';
    this.demoTargetId = 'tiruvottriyur-theradi';

    this.initCursor();
  }

  initCursor() {
    // Add demo cursor element to map SVG
    const svg = this.renderer.svg;
    if (!svg) return;

    this.cursor = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.cursor.setAttribute('id', 'demo-cursor');
    this.cursor.setAttribute('class', 'demo-cursor hidden');
    this.cursor.innerHTML = `
      <circle r="18" fill="rgba(255, 176, 32, 0.35)" stroke="#FFB020" stroke-width="2.5" class="cursor-wave"></circle>
      <circle r="6" fill="#FFFFFF"></circle>
    `;
    svg.appendChild(this.cursor);
  }

  start() {
    if (this.isActive) return;
    this.isActive = true;

    document.body.classList.add('demo-active');
    const demoBanner = document.getElementById('demo-banner');
    if (demoBanner) demoBanner.classList.remove('hidden');

    this.runLoop();
  }

  stop() {
    this.isActive = false;
    if (this.timeoutId) clearTimeout(this.timeoutId);
    if (this.animator) this.animator.stop();

    if (this.cursor) this.cursor.classList.add('hidden');
    document.body.classList.remove('demo-active');
    const demoBanner = document.getElementById('demo-banner');
    if (demoBanner) demoBanner.classList.add('hidden');

    // Remove ?demo=1 from URL without refreshing
    const url = new URL(window.location);
    url.searchParams.delete('demo');
    window.history.replaceState({}, '', url);
  }

  async runLoop() {
    if (!this.isActive) return;

    // Reset map state
    this.renderer.clearRoute();
    this.renderer.clearSearchHighlights();
    this.renderer.setSelection(null, null);
    this.ui.resetUnderTheHood();

    const startStation = this.graph.stations[this.demoStartId];
    const targetStation = this.graph.stations[this.demoTargetId];

    // Step 1: Animate tap on From station (Nandanam)
    await this.animateTap(startStation.x, startStation.y, 'Nandanam');
    if (!this.isActive) return;
    this.ui.setStation('from', this.demoStartId);

    await this.wait(900);
    if (!this.isActive) return;

    // Step 2: Animate tap on To station (Tiruvottriyur Theradi)
    await this.animateTap(targetStation.x, targetStation.y, 'Tiruvottriyur Theradi');
    if (!this.isActive) return;
    this.ui.setStation('to', this.demoTargetId);

    await this.wait(900);
    if (!this.isActive) return;

    // Hide cursor during algorithm run
    this.cursor.classList.add('hidden');

    // Step 3: Run Compare Mode
    await new Promise((resolve) => {
      this.animator.runCompare(this.demoStartId, this.demoTargetId, () => {
        resolve();
      });
    });

    if (!this.isActive) return;

    // Step 4: Hold result card for 3 seconds
    await this.wait(3000);
    if (!this.isActive) return;

    // Step 5: Loop
    this.runLoop();
  }

  animateTap(x, y, label) {
    return new Promise((resolve) => {
      this.cursor.classList.remove('hidden');
      this.cursor.setAttribute('transform', `translate(${x}, ${y})`);
      this.cursor.classList.add('cursor-tap');

      setTimeout(() => {
        this.cursor.classList.remove('cursor-tap');
        resolve();
      }, 500);
    });
  }

  wait(ms) {
    return new Promise((resolve) => {
      this.timeoutId = setTimeout(resolve, ms);
    });
  }
}
