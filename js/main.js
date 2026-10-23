// Main entry point for Namma Route
// Initializes MapRenderer, UIController, AnimationController, DemoController,
// service worker registration, and URL parameter handling

import { buildGraph } from './graph.js';
import { runSelfTest } from './test.js';
import { MapRenderer } from './render.js';
import { UIController } from './ui.js';
import { AnimationController } from './animate.js';
import { DemoController } from './demo.js';

// Build the network graph
export const graph = buildGraph();

// Check URL parameters
const urlParams = new URLSearchParams(window.location.search);
const isTestMode = urlParams.get('test') === '1';
const isDemoMode = urlParams.get('demo') === '1';
const paramFrom = urlParams.get('from');
const paramTo = urlParams.get('to');

if (isTestMode) {
  console.log('Running Namma Route Self-Test...');
  const start = performance.now();
  const testResults = runSelfTest(graph);
  const elapsed = Math.round(performance.now() - start);

  console.log(`Self-test finished in ${elapsed} ms.`);
  console.log(`Pairs tested: ${testResults.pairsTested}`);
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failures: ${testResults.failures.length}`);
  console.log(`Average Dijkstra stations checked: ${testResults.avgDijkstraStations}`);
  console.log(`Average A* stations checked: ${testResults.avgAstarStations}`);
  console.log('Best Demo Trip:', testResults.demoTrip);

  const testPanel = document.getElementById('test-status');
  if (testPanel) {
    testPanel.classList.remove('hidden');
    testPanel.innerHTML = `
      <h3>Self-Test Results</h3>
      <p><strong>Status:</strong> ${testResults.passed ? 'PASSED (0 failures)' : 'FAILED'}</p>
      <p><strong>Pairs tested:</strong> ${testResults.pairsTested}</p>
      <p><strong>Dijkstra average stations:</strong> ${testResults.avgDijkstraStations}</p>
      <p><strong>A* average stations:</strong> ${testResults.avgAstarStations}</p>
      <p><strong>Demo trip:</strong> ${testResults.demoTrip.startName} to ${testResults.demoTrip.endName} (Dijkstra: ${testResults.demoTrip.dijkstraStations}, A*: ${testResults.demoTrip.astarStations}, gap: ${testResults.demoTrip.gap})</p>
    `;
  }
}

// Register Service Worker for offline capability
if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

// Initialize components when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const renderer = new MapRenderer('map-container', graph);
  const ui = new UIController(graph, renderer);
  const animator = new AnimationController(graph, renderer, ui);
  const demo = new DemoController(graph, renderer, animator, ui);

  ui.setControllers(animator, demo);

  // Check URL parameters for trip or demo mode
  if (paramFrom && paramTo && graph.stations[paramFrom] && graph.stations[paramTo]) {
    ui.setStation('from', paramFrom);
    ui.setStation('to', paramTo);
    animator.start(paramFrom, paramTo, 'dijkstra');
  } else if (isDemoMode) {
    demo.start();
  } else {
    // Default initial trip: Nandanam to Tiruvottriyur Theradi
    ui.setStation('from', 'nandanam');
    ui.setStation('to', 'tiruvottriyur-theradi');
  }
});
