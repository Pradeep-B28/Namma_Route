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
    this.currentMode = 'single'; // 'single' | 'compare'
    this.onCompleteCallback = null;
  }

  setSpeed(level) {
    if (level === 'slow') this.speedMs = 140;
    else if (level === 'fast') this.speedMs = 12;
    else this.speedMs = 45; // normal
  }

  // Start single algorithm animation
  start(startStationId, targetStationId, algorithm = 'dijkstra', onComplete = null) {
    this.stop();
    this.currentAlgorithm = algorithm;
    this.currentMode = 'single';
    this.onCompleteCallback = onComplete;

    this.renderer.clearRoute();
    this.renderer.clearSearchHighlights();
    this.renderer.setSelection(startStationId, targetStationId);

    if (algorithm === 'astar') {
      this.generator = astar(this.graph, startStationId, targetStationId);
    } else if (algorithm === 'bfs') {
      this.generator = bfs(this.graph, startStationId, targetStationId);
    } else {
      this.generator = dijkstra(this.graph, startStationId, targetStationId);
    }

    this.isRunning = true;
    this.isPaused = false;
    this.ui.updatePlayPauseState(true);

    this.tick();
  }

  // Single step execution
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
    const color = this.currentAlgorithm === 'astar' ? '#FFB020' : (this.currentAlgorithm === 'bfs' ? '#27AE60' : '#56CCF2');

    if (event.type === 'visit') {
      this.renderer.animateStationVisit(event.stationId, color);
      this.ui.updateUnderTheHood(event, this.currentAlgorithm);
    } else if (event.type === 'queue') {
      this.renderer.animateQueueCandidate(event.toStationId);
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
      this.ui.showError('No route found between selected stations.');
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
  async runCompare(startStationId, targetStationId, onFinish = null) {
    this.stop();
    this.currentMode = 'compare';

    // 1. Run Dijkstra
    this.currentAlgorithm = 'dijkstra';
    this.renderer.clearRoute();
    this.renderer.clearSearchHighlights();
    this.renderer.setSelection(startStationId, targetStationId);
    this.ui.showCompareStatus('Running Dijkstra across city...');

    let dijkstraResult = null;
    await new Promise((resolve) => {
      this.start(startStationId, targetStationId, 'dijkstra', (res) => {
        dijkstraResult = res;
        resolve();
      });
    });

    // 2. Pause to observe Dijkstra search ripple
    await new Promise((r) => setTimeout(r, 600));

    // 3. Clear and Run A*
    this.currentAlgorithm = 'astar';
    this.renderer.clearRoute();
    this.renderer.clearSearchHighlights();
    this.renderer.setSelection(startStationId, targetStationId);
    this.ui.showCompareStatus('Running A* with directional sense...');

    let astarResult = null;
    await new Promise((resolve) => {
      this.start(startStationId, targetStationId, 'astar', (res) => {
        astarResult = res;
        resolve();
      });
    });

    // 4. Render Compare Results Card with count-up animation
    this.ui.renderCompareResult(dijkstraResult, astarResult);
    if (onFinish) onFinish({ dijkstraResult, astarResult });
  }
}
