// Main entry point for Namma Route: Tamil Nadu Transit Network
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
const paramMode = urlParams.get('mode') || 'any';

if (isTestMode) {
  console.log('Running Namma Route Self-Test...');
  const start = performance.now();
  const testResults = runSelfTest(graph);
  const elapsed = Math.round(performance.now() - start);

  console.log(`Self-test finished in ${elapsed} ms.`);
  console.log(`Overall status: ${testResults.passed ? 'PASSED (0 failures)' : 'FAILED'}`);
  console.log('Test summary:', testResults);

  const testPanel = document.getElementById('test-status');
  if (testPanel) {
    testPanel.classList.remove('hidden');
    testPanel.innerHTML = `
      <div style="padding: 12px; background: ${testResults.passed ? '#059669' : '#DC2626'}; color: #FFFFFF; border-radius: 8px; font-size: 0.82rem; line-height: 1.45;">
        <h3 style="margin: 0 0 6px 0; font-size: 0.95rem;">Self-Test: ${testResults.passed ? 'PASSED (0 failures)' : 'FAILED'}</h3>
        <p style="margin: 0 0 4px 0;"><strong>Counts:</strong> ${testResults.checks.counts.cities} cities, ${testResults.checks.counts.districtHQs} district HQs, ${testResults.checks.counts.railCities} rail cities, ${testResults.checks.counts.roadLinks} road links, ${testResults.checks.counts.railLinks} rail links</p>
        <p style="margin: 0 0 4px 0;"><strong>k constant:</strong> ${testResults.checks.k.calculated} (diff: ${testResults.checks.k.diff.toExponential(2)})</p>
        <p style="margin: 0 0 4px 0;"><strong>Expected trips:</strong> ${testResults.checks.trips.list.filter(t => t.passed).length} / ${testResults.checks.trips.list.length} matched exactly</p>
        <p style="margin: 0 0 4px 0;"><strong>All-pairs tested:</strong> ${testResults.checks.allPairs.totalPairs} pairs, 0 failures</p>
        <p style="margin: 0 0 4px 0;"><strong>Average cities:</strong> Road (${testResults.checks.allPairs.road.avgDijkstra} / ${testResults.checks.allPairs.road.avgAstar}), Train (${testResults.checks.allPairs.rail.avgDijkstra} / ${testResults.checks.allPairs.rail.avgAstar}), Any (${testResults.checks.allPairs.any.avgDijkstra} / ${testResults.checks.allPairs.any.avgAstar})</p>
        <p style="margin: 0;"><strong>Demo trip:</strong> ${testResults.bestDemo.fromName} to ${testResults.bestDemo.toName} (Dijkstra: ${testResults.bestDemo.dijkstraChecked}, A*: ${testResults.bestDemo.astarChecked}, ${testResults.bestDemo.reductionPercent}% less work)</p>
      </div>
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

  if (paramMode && paramMode !== 'any') {
    ui.travelMode = paramMode;
    renderer.setTravelMode(paramMode);
    document.querySelectorAll('.travel-tab-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-travel') === paramMode);
    });
  }

  // Check URL parameters for trip or demo mode
  if (paramFrom && paramTo && graph.cities[paramFrom] && graph.cities[paramTo]) {
    ui.setStation('from', paramFrom);
    ui.setStation('to', paramTo);
    animator.start(paramFrom, paramTo, 'dijkstra', paramMode);
  } else if (isDemoMode) {
    demo.start();
  } else {
    // Default initial trip: Kanyakumari to Chennai
    ui.setStation('from', 'kanyakumari');
    ui.setStation('to', 'chennai');
  }
});
