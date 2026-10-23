// Self-test suite for Namma Route: Tamil Nadu Transit Network
// Verifies Section 11 requirements:
// 1. Counts: cities 55, district headquarters 38, rail cities 49, road links 86, rail links 60
// 2. k constant: matches EXPECTED.k to 4 decimal places
// 3. Every trip in EXPECTED.trips: Dijkstra minutes, A* minutes, and BFS hops match exactly
// 4. All pairs, all modes: Dijkstra and A* match for 8,292 pairs with 0 failures
// 5. Reachability: all cities reachable in Road and Any, rail cities in Train
// 6. Theme tokens: all 23 tokens have valid values in light and dark
// 7. Best demo trip calculation

import { dijkstra, astar, bfs, runAlgorithm } from './algorithms.js';

export const THEME_TOKENS = [
  '--bg',
  '--bg-grad',
  '--surface',
  '--surface-2',
  '--border',
  '--text',
  '--text-2',
  '--muted',
  '--brand',
  '--brand-strong',
  '--brand-soft',
  '--accent',
  '--land',
  '--land-stroke',
  '--road',
  '--rail',
  '--rail-dash',
  '--dijkstra',
  '--astar',
  '--route-from',
  '--route-to',
  '--pin-start',
  '--pin-end'
];

export function runSelfTest(graph) {
  const failures = [];
  const checks = {};

  // 1. Counts check
  const exp = graph.expected;
  const citiesList = Object.values(graph.cities);
  const districtHQs = citiesList.filter((c) => c.hq).length;
  const railCities = citiesList.filter((c) => c.rail).length;
  const roadLinksCount = graph.roadLinks.length;
  const railLinksCount = graph.railLinks.length;
  const citiesCount = citiesList.length;

  const countsMatch =
    citiesCount === exp.cities &&
    districtHQs === exp.districtHQs &&
    railCities === exp.railCities &&
    roadLinksCount === exp.roadLinks &&
    railLinksCount === exp.railLinks;

  checks.counts = {
    passed: countsMatch,
    cities: citiesCount,
    districtHQs,
    railCities,
    roadLinks: roadLinksCount,
    railLinks: railLinksCount
  };
  if (!countsMatch) {
    failures.push({
      check: 'counts',
      expected: exp,
      actual: checks.counts
    });
  }

  // 2. k constant check (equal to 4 decimal places)
  const kDiff = Math.abs(graph.k - exp.k);
  const kPassed = kDiff < 0.0001;
  checks.k = {
    passed: kPassed,
    calculated: graph.k,
    expected: exp.k,
    diff: kDiff
  };
  if (!kPassed) {
    failures.push({
      check: 'k_constant',
      expected: exp.k,
      actual: graph.k
    });
  }

  // 3. EXPECTED.trips check (all 18 trips)
  const tripResults = [];
  let tripsPassed = true;

  for (const t of exp.trips) {
    const dRes = runAlgorithm(dijkstra(graph, t.from, t.to, t.mode));
    const aRes = runAlgorithm(astar(graph, t.from, t.to, t.mode));
    const bRes = runAlgorithm(bfs(graph, t.from, t.to, t.mode));

    const dMin = dRes?.success ? dRes.totalTime : null;
    const aMin = aRes?.success ? aRes.totalTime : null;
    const bHops = bRes?.success ? bRes.hops : null;

    const matchesExpected =
      dMin === t.minutes &&
      aMin === t.minutes &&
      bHops === t.hops;

    tripResults.push({
      from: t.from,
      to: t.to,
      mode: t.mode,
      expected: { minutes: t.minutes, hops: t.hops },
      actual: { dMin, aMin, bHops },
      passed: matchesExpected
    });

    if (!matchesExpected) {
      tripsPassed = false;
      failures.push({
        check: 'expected_trip',
        trip: t,
        dMin,
        aMin,
        bHops
      });
    }
  }
  checks.trips = { passed: tripsPassed, list: tripResults };

  // 4. All pairs, all modes check
  const allCityIds = citiesList.map((c) => c.id);
  const railCityIds = citiesList.filter((c) => c.rail).map((c) => c.id);

  function testModePairs(mode, cityIds) {
    let pairsTested = 0;
    let modeFailures = 0;
    let totalDijkstraCities = 0;
    let totalAstarCities = 0;

    for (let i = 0; i < cityIds.length; i++) {
      for (let j = 0; j < cityIds.length; j++) {
        if (i === j) continue;
        pairsTested++;
        const from = cityIds[i];
        const to = cityIds[j];

        const d = runAlgorithm(dijkstra(graph, from, to, mode));
        const a = runAlgorithm(astar(graph, from, to, mode));

        if (!d?.success || !a?.success || d.totalTime !== a.totalTime) {
          modeFailures++;
          failures.push({
            check: 'pair_mismatch',
            mode,
            from,
            to,
            dTime: d?.totalTime,
            aTime: a?.totalTime
          });
        } else {
          totalDijkstraCities += d.citiesChecked;
          totalAstarCities += a.citiesChecked;
        }
      }
    }

    return {
      mode,
      pairsTested,
      modeFailures,
      avgDijkstra: parseFloat((totalDijkstraCities / pairsTested).toFixed(1)),
      avgAstar: parseFloat((totalAstarCities / pairsTested).toFixed(1))
    };
  }

  const roadMetrics = testModePairs('road', allCityIds);
  const railMetrics = testModePairs('rail', railCityIds);
  const anyMetrics = testModePairs('any', allCityIds);

  checks.allPairs = {
    road: roadMetrics,
    rail: railMetrics,
    any: anyMetrics,
    totalPairs: roadMetrics.pairsTested + railMetrics.pairsTested + anyMetrics.pairsTested,
    totalFailures: roadMetrics.modeFailures + railMetrics.modeFailures + anyMetrics.modeFailures
  };

  // 5. Reachability check
  checks.reachability = {
    road: roadMetrics.modeFailures === 0 && roadMetrics.pairsTested === 2970,
    rail: railMetrics.modeFailures === 0 && railMetrics.pairsTested === 2352,
    any: anyMetrics.modeFailures === 0 && anyMetrics.pairsTested === 2970,
    passed: roadMetrics.modeFailures === 0 && railMetrics.modeFailures === 0 && anyMetrics.modeFailures === 0
  };

  // 6. Theme tokens check
  let themeTokensPassed = true;
  let missingTokens = [];

  if (typeof document !== 'undefined') {
    const checkThemeStyle = (themeName) => {
      const el = document.createElement('div');
      el.setAttribute('data-theme', themeName);
      el.style.display = 'none';
      document.body.appendChild(el);
      const style = getComputedStyle(el);
      const missing = [];
      for (const tok of THEME_TOKENS) {
        const val = style.getPropertyValue(tok).trim();
        if (!val) missing.push(`${themeName}:${tok}`);
      }
      el.remove();
      return missing;
    };

    const lightMissing = checkThemeStyle('light');
    const darkMissing = checkThemeStyle('dark');
    missingTokens = [...lightMissing, ...darkMissing];
    themeTokensPassed = missingTokens.length === 0;
  }

  checks.themeTokens = {
    passed: themeTokensPassed,
    missing: missingTokens,
    tokensCount: THEME_TOKENS.length
  };
  if (!themeTokensPassed) {
    failures.push({ check: 'theme_tokens', missing: missingTokens });
  }

  // 7. Demo mode iconic trips evaluation
  const iconicTrips = [
    { from: 'kanyakumari', to: 'chennai' },
    { from: 'chennai', to: 'kanyakumari' },
    { from: 'hosur', to: 'kanyakumari' },
    { from: 'chennai', to: 'rameswaram' },
    { from: 'chennai', to: 'tirunelveli' }
  ];

  const demoComparisons = [];
  let bestDemo = null;
  let maxGap = -1;

  for (const t of iconicTrips) {
    const d = runAlgorithm(dijkstra(graph, t.from, t.to, 'any'));
    const a = runAlgorithm(astar(graph, t.from, t.to, 'any'));
    const gap = d.citiesChecked - a.citiesChecked;
    const reductionPercent = Math.round((gap / d.citiesChecked) * 100);

    const comp = {
      from: t.from,
      to: t.to,
      fromName: graph.cities[t.from].name,
      toName: graph.cities[t.to].name,
      dijkstraChecked: d.citiesChecked,
      astarChecked: a.citiesChecked,
      gap,
      reductionPercent,
      minutes: d.totalTime
    };
    demoComparisons.push(comp);

    if (gap > maxGap) {
      maxGap = gap;
      bestDemo = comp;
    }
  }

  return {
    passed: failures.length === 0,
    failures,
    checks,
    bestDemo,
    demoComparisons
  };
}
