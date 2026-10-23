// Graph construction for Namma Route: Tamil Nadu Transit Network
// Builds road nodes, rail nodes, transfer links, and computes heuristic constant k

import {
  CITIES,
  ROAD_LINKS,
  RAIL_LINKS,
  TRANSFER_MINUTES,
  VIEWBOX,
  STATE_OUTLINE,
  SPEEDS_KMPH,
  EXPECTED
} from './tn-data.js';

// Haversine formula for straight-line distance on Earth sphere (radius = 6371 km)
export function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function buildGraph() {
  const cities = {};
  for (const c of CITIES) {
    cities[c.id] = { ...c };
  }

  // 1. Calculate k across all road and rail links
  let minRatio = Infinity;
  const allRawLinks = [
    ...ROAD_LINKS.map((l) => ({ ...l, modeType: 'road' })),
    ...RAIL_LINKS.map((l) => ({ ...l, modeType: 'rail' }))
  ];

  for (const link of allRawLinks) {
    const c1 = cities[link.a];
    const c2 = cities[link.b];
    const d = haversineKm(c1.lat, c1.lng, c2.lat, c2.lng);
    const ratio = link.min / d;
    if (ratio < minRatio) {
      minRatio = ratio;
    }
  }
  const k = minRatio;

  // 2. Initialize nodes
  const nodes = {};
  const cityNodes = {};

  for (const c of CITIES) {
    cityNodes[c.id] = [];

    // Road node for every city
    const roadNodeId = `${c.id}:road`;
    nodes[roadNodeId] = {
      id: roadNodeId,
      cityId: c.id,
      cityName: c.name,
      type: 'road',
      x: c.x,
      y: c.y,
      neighbors: []
    };
    cityNodes[c.id].push(roadNodeId);

    // Rail node only for cities with railway station
    if (c.rail) {
      const railNodeId = `${c.id}:rail`;
      nodes[railNodeId] = {
        id: railNodeId,
        cityId: c.id,
        cityName: c.name,
        stationName: c.station || c.name,
        type: 'rail',
        x: c.x,
        y: c.y,
        neighbors: []
      };
      cityNodes[c.id].push(railNodeId);
    }
  }

  const edges = [];

  // 3. Road links (bidirectional between road nodes)
  for (const link of ROAD_LINKS) {
    const nA = `${link.a}:road`;
    const nB = `${link.b}:road`;

    const edgeAB = {
      from: nA,
      to: nB,
      fromCityId: link.a,
      toCityId: link.b,
      min: link.min,
      km: link.km,
      kind: link.kind,
      type: 'road',
      offset: link.offset
    };
    nodes[nA].neighbors.push(edgeAB);
    edges.push(edgeAB);

    const edgeBA = {
      from: nB,
      to: nA,
      fromCityId: link.b,
      toCityId: link.a,
      min: link.min,
      km: link.km,
      kind: link.kind,
      type: 'road',
      offset: link.offset
    };
    nodes[nB].neighbors.push(edgeBA);
    edges.push(edgeBA);
  }

  // 4. Rail links (bidirectional between rail nodes)
  for (const link of RAIL_LINKS) {
    const nA = `${link.a}:rail`;
    const nB = `${link.b}:rail`;

    const edgeAB = {
      from: nA,
      to: nB,
      fromCityId: link.a,
      toCityId: link.b,
      min: link.min,
      km: link.km,
      kind: link.kind,
      type: 'rail',
      offset: link.offset
    };
    nodes[nA].neighbors.push(edgeAB);
    edges.push(edgeAB);

    const edgeBA = {
      from: nB,
      to: nA,
      fromCityId: link.b,
      toCityId: link.a,
      min: link.min,
      km: link.km,
      kind: link.kind,
      type: 'rail',
      offset: link.offset
    };
    nodes[nB].neighbors.push(edgeBA);
    edges.push(edgeBA);
  }

  // 5. Transfer edges in Any mode (between road and rail nodes of same city)
  for (const c of CITIES) {
    if (c.rail) {
      const roadNodeId = `${c.id}:road`;
      const railNodeId = `${c.id}:rail`;

      const toRailEdge = {
        from: roadNodeId,
        to: railNodeId,
        fromCityId: c.id,
        toCityId: c.id,
        min: TRANSFER_MINUTES,
        km: 0,
        kind: 'transfer',
        type: 'transfer',
        offset: 0
      };
      nodes[roadNodeId].neighbors.push(toRailEdge);
      edges.push(toRailEdge);

      const toRoadEdge = {
        from: railNodeId,
        to: roadNodeId,
        fromCityId: c.id,
        toCityId: c.id,
        min: TRANSFER_MINUTES,
        km: 0,
        kind: 'transfer',
        type: 'transfer',
        offset: 0
      };
      nodes[railNodeId].neighbors.push(toRoadEdge);
      edges.push(toRoadEdge);
    }
  }

  // Sort each neighbor list by destination node name alphabetically
  for (const node of Object.values(nodes)) {
    node.neighbors.sort((a, b) => a.to.localeCompare(b.to));
  }

  // 6. City adjacency maps for BFS
  const cityGraph = {
    road: {},
    rail: {},
    any: {}
  };

  for (const c of CITIES) {
    cityGraph.road[c.id] = new Set();
    cityGraph.rail[c.id] = new Set();
    cityGraph.any[c.id] = new Set();
  }

  for (const l of ROAD_LINKS) {
    cityGraph.road[l.a].add(l.b);
    cityGraph.road[l.b].add(l.a);
    cityGraph.any[l.a].add(l.b);
    cityGraph.any[l.b].add(l.a);
  }

  for (const l of RAIL_LINKS) {
    cityGraph.rail[l.a].add(l.b);
    cityGraph.rail[l.b].add(l.a);
    cityGraph.any[l.a].add(l.b);
    cityGraph.any[l.b].add(l.a);
  }

  for (const mode of ['road', 'rail', 'any']) {
    for (const c of CITIES) {
      cityGraph[mode][c.id] = Array.from(cityGraph[mode][c.id]).sort();
    }
  }

  // A* straight-line heuristic function
  const heuristic = (cityAId, cityBId) => {
    const a = cities[cityAId];
    const b = cities[cityBId];
    if (!a || !b) return 0;
    const dist = haversineKm(a.lat, a.lng, b.lat, b.lng);
    return k * dist;
  };

  return {
    cities,
    nodes,
    cityNodes,
    edges,
    roadLinks: ROAD_LINKS,
    railLinks: RAIL_LINKS,
    cityGraph,
    k,
    heuristic,
    transferMinutes: TRANSFER_MINUTES,
    viewbox: VIEWBOX,
    outline: STATE_OUTLINE,
    speeds: SPEEDS_KMPH,
    expected: EXPECTED,
    cityCount: CITIES.length,
    roadNodeCount: CITIES.length,
    railNodeCount: CITIES.filter((c) => c.rail).length,
    totalNodeCount: Object.keys(nodes).length
  };
}
