// Demo Mode Controller for Namma Route
// Auto-plays and loops the iconic showcase trip for recording reels
// Sequence: loader (first loop only), entrance reveal, pick From with tap animation, pick To, run Compare, hold 3s, loop

export class DemoController {
  constructor(graph, renderer, animator, ui) {
    this.graph = graph;
    this.renderer = renderer;
    this.animator = animator;
    this.ui = ui;

    this.isActive = false;
    this.timeoutId = null;

    // Chosen iconic demo trip from Section 10:
    // Kanyakumari to Chennai, Any mode (Dijkstra 49 vs A* 16, 67% less work, 33 city gap)
    this.demoStartId = 'kanyakumari';
    this.demoTargetId = 'chennai';

    this.initCursor();
  }

  initCursor() {
    const parent = this.renderer.svg;
    if (!parent) return;

    this.cursor = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.cursor.setAttribute('id', 'demo-cursor');
    this.cursor.setAttribute('class', 'demo-cursor hidden');
    this.cursor.innerHTML = `
      <circle r="22" fill="rgba(5, 150, 105, 0.25)" stroke="#059669" stroke-width="2.5" class="cursor-wave"></circle>
      <circle r="6" fill="#059669" stroke="#FFFFFF" stroke-width="1.5"></circle>
    `;
    parent.appendChild(this.cursor);
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

    const url = new URL(window.location);
    url.searchParams.delete('demo');
    window.history.replaceState({}, '', url);
  }

  async runLoop() {
    if (!this.isActive) return;

    // Reset map and selection state
    this.renderer.clearRoute();
    this.renderer.clearSearchHighlights();
    this.renderer.setSelection(null, null);
    this.ui.resetUnderTheHood();

    // Ensure Any mode is active for demo
    this.ui.travelMode = 'any';
    this.renderer.setTravelMode('any');
    document.querySelectorAll('.travel-tab-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-travel') === 'any');
    });
    this.ui.motion?.updateTabPill('travel-mode-tabs', 'travel-tab-indicator', '.travel-tab-btn.active');

    const startCity = this.graph.cities[this.demoStartId];
    const targetCity = this.graph.cities[this.demoTargetId];
    if (!startCity || !targetCity) return;

    // Step 1: Animate tap on From city (Kanyakumari)
    await this.animateTap(startCity.x, startCity.y);
    if (!this.isActive) return;
    this.ui.setStation('from', this.demoStartId);
    this.renderer.pulseCity(this.demoStartId);

    await this.wait(900);
    if (!this.isActive) return;

    // Step 2: Animate tap on To city (Chennai)
    await this.animateTap(targetCity.x, targetCity.y);
    if (!this.isActive) return;
    this.ui.setStation('to', this.demoTargetId);
    this.renderer.pulseCity(this.demoTargetId);

    await this.wait(900);
    if (!this.isActive) return;

    // Hide cursor during algorithm comparison
    if (this.cursor) this.cursor.classList.add('hidden');

    // Step 3: Run Compare Mode in Any mode
    await new Promise((resolve) => {
      this.animator.runCompare(this.demoStartId, this.demoTargetId, 'any', () => {
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

  animateTap(x, y) {
    return new Promise((resolve) => {
      if (!this.cursor) { resolve(); return; }
      this.cursor.classList.remove('hidden');
      this.cursor.setAttribute('transform', `translate(${x}, ${y})`);
      this.cursor.classList.add('cursor-tap');

      setTimeout(() => {
        if (this.cursor) this.cursor.classList.remove('cursor-tap');
        resolve();
      }, 550);
    });
  }

  wait(ms) {
    return new Promise((resolve) => {
      this.timeoutId = setTimeout(resolve, ms);
    });
  }
}
