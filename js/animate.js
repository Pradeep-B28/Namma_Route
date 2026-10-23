// Animation player and step controller for Namma Route
// Controls algorithm step-by-step playback, speed, pause, and Compare mode

import { dijkstra, astar, bfs } from './algorithms.js';

export class AnimationController {
  constructor(graph, renderer, ui) {
    this.graph = graph;
    this.renderer = renderer;
    this.ui = ui;

    this.generator = null;
    this.isRunning = false;
    this.isPaused = false;
    this.timerId = null;
    this.speedMs = 45; // default normal speed

    this.currentAlgorithm = 'dijkstra';
    this.travelMode = 'any';
    this.currentMode = 'single'; // 'single' | 'compare'
    this.onCompleteCallback = null;
  }

  setSpeed(level) {
    if (level === 'slow') this.speedMs = 140;
    else if (level === 'fast') this.speedMs = 12;
    else this.speedMs = 45;
  }

  // Start single algorithm animation
  start(startCityId, targetCityId, algorithm = 'dijkstra', travelMode = 'any', onComplete = null) {
    this.stop();
    this.currentAlgorithm = algorithm;
    this.travelMode = travelMode;
    this.currentMode = 'single';
    this.onCompleteCallback = onComplete;

    this.renderer.clearRoute();
    this.renderer.clearSearchHighlights();
    this.renderer.setSelection(startCityId, targetCityId);

    if (algorithm === 'astar') {
      this.generator = astar(this.graph, startCityId, targetCityId, travelMode);
    } else if (algorithm === 'bfs') {
      this.generator = bfs(this.graph, startCityId, targetCityId, travelMode);
    } else {
      this.generator = dijkstra(this.graph, startCityId, targetCityId, travelMode);
    }

    this.isRunning = true;
    this.isPaused = false;
    this.ui.updatePlayPauseState(true);

    this.tick();
  }

  step() {
    if (!this.generator) return;
    this.pause();
    this.executeNextStep();
  }

  tick() {
    if (!this.isRunning || this.isPaused) return;

    const finished = this.executeNextStep();
    if (!finished) {
      this.timerId = setTimeout(() => this.tick(), this.speedMs);
    }
  }

  executeNextStep() {
    if (!this.generator) return true;

    const res = this.generator.next();
    if (res.done) {
      this.stop();
      return true;
    }

    const event = res.value;
    const color = this.currentAlgorithm === 'astar' ? 'var(--astar)' : (this.currentAlgorithm === 'bfs' ? 'var(--brand)' : 'var(--dijkstra)');

    if (event.type === 'visit') {
      this.renderer.animateCityVisit(event.cityId, color);
      this.ui.updateUnderTheHood(event, this.currentAlgorithm);
    } else if (event.type === 'queue') {
      if (event.toCityId) {
        this.renderer.animateQueueCandidate(event.toCityId);
      }
    } else if (event.type === 'done') {
      this.handleAlgorithmDone(event);
      return true;
    }

    return false;
  }

  handleAlgorithmDone(event) {
    this.isRunning = false;
    this.isPaused = false;
    this.ui.updatePlayPauseState(false);

    if (event.success) {
      this.renderer.animateRouteDraw(event.path, () => {
        this.ui.renderResultCard(event);
        if (this.onCompleteCallback) {
          this.onCompleteCallback(event);
        }
      });
    } else {
      const msg = event.stepsText?.[0] || 'No route found between selected cities.';
      this.ui.showError(msg);
      if (this.onCompleteCallback) {
        this.onCompleteCallback(event);
      }
    }
  }

  play() {
    if (!this.isRunning && this.generator) {
      this.isRunning = true;
      this.isPaused = false;
      this.ui.updatePlayPauseState(true);
      this.tick();
    } else if (this.isPaused) {
      this.isPaused = false;
      this.ui.updatePlayPauseState(true);
      this.tick();
    }
  }

  pause() {
    this.isPaused = true;
    if (this.timerId) clearTimeout(this.timerId);
    this.ui.updatePlayPauseState(false);
  }

  stop() {
    this.isRunning = false;
    this.isPaused = false;
    if (this.timerId) clearTimeout(this.timerId);
    this.ui.updatePlayPauseState(false);
  }

  // Compare mode sequence: runs Dijkstra, then A*, then shows side-by-side comparison
  async runCompare(startCityId, targetCityId, travelMode = 'any', onFinish = null) {
    this.stop();
    this.currentMode = 'compare';

    // 1. Run Dijkstra
    this.currentAlgorithm = 'dijkstra';
    this.renderer.clearRoute();
    this.renderer.clearSearchHighlights();
    this.renderer.setSelection(startCityId, targetCityId);
    this.ui.showCompareStatus('Running Dijkstra across Tamil Nadu...');

    let dijkstraResult = null;
    await new Promise((resolve) => {
      this.start(startCityId, targetCityId, 'dijkstra', travelMode, (res) => {
        dijkstraResult = res;
        resolve();
      });
    });

    // 2. Pause to observe Dijkstra search coverage
    await new Promise((r) => setTimeout(r, 600));

    // 3. Clear and Run A*
    this.currentAlgorithm = 'astar';
    this.renderer.clearRoute();
    this.renderer.clearSearchHighlights();
    this.renderer.setSelection(startCityId, targetCityId);
    this.ui.showCompareStatus('Running A* with directional sense...');

    let astarResult = null;
    await new Promise((resolve) => {
      this.start(startCityId, targetCityId, 'astar', travelMode, (res) => {
        astarResult = res;
        resolve();
      });
    });

    // 4. Render Compare Results Card with count-up animation
    this.ui.renderCompareResult(dijkstraResult, astarResult);
    if (onFinish) onFinish({ dijkstraResult, astarResult });
  }
}
