// Route formatting and path reconstruction utilities for Tamil Nadu transit

// Format minutes into plain English string ("about 12 h 18 min" or "about 45 min")
export function formatMinutes(totalMin) {
  if (totalMin === null || totalMin === undefined) return 'No route';
  if (totalMin === 0) return '0 min';
  const hours = Math.floor(totalMin / 60);
  const remaining = Math.round(totalMin % 60);
  if (hours === 0) return `about ${remaining} min`;
  if (remaining === 0) return `about ${hours} h`;
  return `about ${hours} h ${remaining} min`;
}

// Reconstruct path from line-node graph prev map (for Dijkstra and A*)
export function reconstructPath(endNodeId, prev, graph) {
  const path = [];
  let curr = endNodeId;

  while (curr) {
    const node = graph.nodes[curr];
    const prevInfo = prev[curr];
    path.unshift({
      nodeId: node.id,
      cityId: node.cityId,
      type: node.type,
      edgeFromPrev: prevInfo ? prevInfo.edge : null
    });
    curr = prevInfo ? prevInfo.fromNodeId : null;
  }

  let switches = 0;
  let stops = 0;
  let totalKm = 0;
  let totalTime = 0;

  for (let i = 1; i < path.length; i++) {
    const edge = path[i].edgeFromPrev;
    if (edge) {
      totalTime += edge.min;
      totalKm += edge.km || 0;
      if (edge.type === 'transfer') {
        switches++;
      } else {
        stops++;
      }
    }
  }

  return { path, switches, stops, totalKm, totalTime };
}

// Build BFS path from city-level sequence, picking the faster allowed link per hop
export function reconstructBfsPath(cityPath, mode, graph) {
  const normMode = mode === 'train' ? 'rail' : (mode || 'any');
  const detailedPath = [];
  let totalKm = 0;
  let totalTime = 0;
  let switches = 0;
  let stops = 0;

  let prevModeType = null;

  for (let i = 0; i < cityPath.length; i++) {
    const cityId = cityPath[i];
    if (i === 0) {
      detailedPath.push({
        cityId,
        nodeId: `${cityId}:${normMode === 'rail' ? 'rail' : 'road'}`,
        type: normMode === 'rail' ? 'rail' : 'road',
        edgeFromPrev: null
      });
      continue;
    }

    const prevCityId = cityPath[i - 1];
    stops++;

    // Find allowed links between prevCityId and cityId
    const roadLink = (normMode === 'road' || normMode === 'any')
      ? graph.roadLinks.find((l) => (l.a === prevCityId && l.b === cityId) || (l.a === cityId && l.b === prevCityId))
      : null;

    const railLink = (normMode === 'rail' || normMode === 'any')
      ? graph.railLinks.find((l) => (l.a === prevCityId && l.b === cityId) || (l.a === cityId && l.b === prevCityId))
      : null;

    let chosen = null;
    let chosenType = 'road';

    if (roadLink && railLink) {
      if (railLink.min <= roadLink.min) {
        chosen = railLink;
        chosenType = 'rail';
      } else {
        chosen = roadLink;
        chosenType = 'road';
      }
    } else if (railLink) {
      chosen = railLink;
      chosenType = 'rail';
    } else {
      chosen = roadLink;
      chosenType = 'road';
    }

    if (!chosen) {
      continue;
    }

    // Check if mode switched in Any mode
    if (normMode === 'any' && prevModeType && prevModeType !== chosenType) {
      switches++;
      totalTime += graph.transferMinutes;
      detailedPath.push({
        cityId: prevCityId,
        nodeId: `${prevCityId}:${chosenType}`,
        type: chosenType,
        edgeFromPrev: {
          from: `${prevCityId}:${prevModeType}`,
          to: `${prevCityId}:${chosenType}`,
          fromCityId: prevCityId,
          toCityId: prevCityId,
          min: graph.transferMinutes,
          km: 0,
          kind: 'transfer',
          type: 'transfer'
        }
      });
    }

    totalTime += chosen.min;
    totalKm += chosen.km;
    prevModeType = chosenType;

    detailedPath.push({
      cityId,
      nodeId: `${cityId}:${chosenType}`,
      type: chosenType,
      edgeFromPrev: {
        from: `${prevCityId}:${chosenType}`,
        to: `${cityId}:${chosenType}`,
        fromCityId: prevCityId,
        toCityId: cityId,
        min: chosen.min,
        km: chosen.km,
        kind: chosen.kind,
        type: chosenType
      }
    });
  }

  return { path: detailedPath, switches, stops, totalKm, totalTime };
}

// Generate human-friendly step instructions from path
export function generateStepInstructions(path, graph) {
  if (!path || path.length === 0) return ['No route found.'];
  if (path.length === 1) return ['Start and destination are the same city.'];

  const getStationLabel = (cityId, isRail) => {
    const c = graph.cities[cityId];
    if (isRail && c.station && c.station.toLowerCase() !== c.name.toLowerCase()) {
      return `${c.name} (${c.station} station)`;
    }
    return c.name;
  };

  const instructions = [];
  let i = 0;

  while (i < path.length - 1) {
    const current = path[i];
    const next = path[i + 1];
    const edge = next.edgeFromPrev;
    if (!edge) {
      i++;
      continue;
    }

    if (edge.type === 'transfer') {
      const fromType = current.type === 'rail' ? 'train' : 'road';
      const toType = next.type === 'rail' ? 'train' : 'road';
      const cityName = graph.cities[current.cityId].name;
      instructions.push(`Switch from ${fromType} to ${toType} at ${cityName}. About ${edge.min} min.`);
      i++;
      continue;
    }

    const segType = edge.type;
    const startCityId = current.cityId;
    let endCityId = next.cityId;
    let segKm = edge.km;
    let segMin = edge.min;
    const viaCities = [];
    let j = i + 1;

    while (j < path.length - 1) {
      const aheadEdge = path[j + 1].edgeFromPrev;
      if (aheadEdge && aheadEdge.type === segType) {
        viaCities.push(graph.cities[path[j].cityId].name);
        segKm += aheadEdge.km;
        segMin += aheadEdge.min;
        endCityId = path[j + 1].cityId;
        j++;
      } else {
        break;
      }
    }

    const startLabel = getStationLabel(startCityId, segType === 'rail');
    const endLabel = getStationLabel(endCityId, segType === 'rail');
    const timeText = formatMinutes(segMin);
    const viaText = viaCities.length > 0 ? ` via ${viaCities.join(', ')}` : '';

    if (segType === 'rail') {
      instructions.push(`Take a train from ${startLabel} to ${endLabel}${viaText}. ${segKm} km, ${timeText}.`);
    } else {
      instructions.push(`Go by road from ${startLabel} to ${endLabel}${viaText}. ${segKm} km, ${timeText}.`);
    }

    i = j;
  }

  return instructions;
}
