
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { generateCity } from '@/lib/city-generator';
import { config, BuildingType, Scenario, ArsonistProfile, ARSONIST_PROFILES, BuildingProperties, CellType, CONTROL_IMPACTS } from '@/lib/config';
import type { Cell, Agent, Stats, SimEvent, AgentCounts, AgentState, RoutineType, ArsonistProfile as ArsonistProfileType, ArsonistConfiguration, HistoricalStat } from '@/types/simulation';
import { useToast } from "@/hooks/use-toast";

// --- Helpers ---

const formatBuildingType = (type?: BuildingType): string => {
    if (!type) return 'Building';
    return type
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

const isWalkable = (x: number, y: number, grid: Cell[][], agentType: 'firefighter' | 'civilian' | 'police' | 'arsonist' = 'civilian'): boolean => {
    if (x < 0 || x >= config.grid_width || y < 0 || y >= config.grid_height || !grid[y]) return false;
    const cell = grid[y][x];
    if (!cell) return false;
    // Updated safety rule: a cell is not walkable if it has a significant fire
    if (cell.fireLevel > 3) return false;
    if (cell.cellType === 'ROAD' || cell.cellType === 'PARK') return true;
    if (cell.cellType === 'BUILDING' && (cell.buildingType === BuildingType.PARKING_LOT || cell.buildingType === BuildingType.MARKET_STALL || cell.buildingType === BuildingType.POOL)) return true;
    return false;
};

const getMoveCost = (cell: Cell): number => {
    if (!cell) return Infinity;
    switch (cell.cellType) {
        case 'ROAD': // Includes bridges and alleys
            return 1;
        case 'PARK':
            return 2;
        case 'BUILDING':
            if (cell.buildingType === BuildingType.PARKING_LOT || cell.buildingType === BuildingType.MARKET_STALL || cell.buildingType === BuildingType.POOL) {
                return 1.5;
            }
            return Infinity; // Impassable for other buildings
        default:
            return Infinity;
    }
};

const findPathAStar = (start: {x: number, y: number}, end: {x: number, y: number}, grid: Cell[][]): {x: number, y: number}[] | null => {
    const originalStart = { ...start };
    const originalEnd = { ...end };

    let aStarStart = { ...start };
    let aStarTarget = { ...end };

    // Handle unwalkable START node
    if (!isWalkable(aStarStart.x, aStarStart.y, grid)) {
        let nearestWalkableStart: {x: number, y: number} | null = null;
        let minDistance = Infinity;
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;
                const nx = aStarStart.x + dx;
                const ny = aStarStart.y + dy;
                if (isWalkable(nx, ny, grid)) {
                    const dist = Math.hypot(end.x - nx, end.y - ny);
                    if (dist < minDistance) {
                        minDistance = dist;
                        nearestWalkableStart = {x: nx, y: ny};
                    }
                }
            }
        }
        if (nearestWalkableStart) {
            aStarStart = nearestWalkableStart;
        } else {
            return null; // Agent is fully trapped with no walkable neighbors
        }
    }

    // Handle unwalkable END node
    if (!isWalkable(aStarTarget.x, aStarTarget.y, grid)) {
        let nearestWalkable: {x: number, y: number} | null = null;
        let minDistance = Infinity;
        for(let dx = -1; dx <= 1; dx++) {
            for(let dy = -1; dy <= 1; dy++) {
                if(dx === 0 && dy === 0) continue;
                const nx = aStarTarget.x + dx;
                const ny = aStarTarget.y + dy;
                if(isWalkable(nx, ny, grid)) {
                    const dist = Math.hypot(aStarStart.x - nx, aStarStart.y - ny);
                    if(dist < minDistance) {
                        minDistance = dist;
                        nearestWalkable = {x: nx, y: ny};
                    }
                }
            }
        }
        if (nearestWalkable) {
            aStarTarget = nearestWalkable;
        } else {
            return null; // No path possible to destination area
        }
    }

    if (aStarStart.x === aStarTarget.x && aStarStart.y === aStarTarget.y) {
        let path = [];
        if(originalStart.x !== aStarStart.x || originalStart.y !== aStarStart.y) {
            path.push(aStarStart);
        }
        if(originalEnd.x !== aStarTarget.x || originalEnd.y !== aStarTarget.y) {
            path.push(originalEnd);
        }
        return path.length > 0 ? path : null;
    }

    const openSet: {f: number, pos: {x: number, y: number}}[] = [];
    const closedSet = new Set<string>();
    const cameFrom = new Map<string, {x: number, y: number}>();
    const gScore = new Map<string, number>();

    const heuristic = (a: {x: number, y: number}, b: {x: number, y: number}) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

    const startKey = `${aStarStart.x},${aStarStart.y}`;
    gScore.set(startKey, 0);
    const fScoreStart = heuristic(aStarStart, aStarTarget);
    openSet.push({ f: fScoreStart, pos: aStarStart });

    while (openSet.length > 0) {
        openSet.sort((a, b) => a.f - b.f);
        const { pos: current } = openSet.shift()!;
        const currentKey = `${current.x},${current.y}`;

        if (current.x === aStarTarget.x && current.y === aStarTarget.y) {
            const path = [current];
            let tempKey = currentKey;
            while (cameFrom.has(tempKey)) {
                const prevNode = cameFrom.get(tempKey)!;
                path.unshift(prevNode);
                tempKey = `${prevNode.x},${prevNode.y}`;
            }

            let finalPath = path;

            // If agent is already on a walkable tile, the A* path will start with its location.
            // We can remove it because it doesn't need to move to the tile it's already on.
            if (finalPath[0]?.x === originalStart.x && finalPath[0]?.y === originalStart.y) {
                finalPath = finalPath.slice(1);
            }

            // If the path's end isn't the true destination, add the final step into the building.
            const lastNode = finalPath[finalPath.length - 1];
            if (lastNode && (lastNode.x !== originalEnd.x || lastNode.y !== originalEnd.y)) {
                finalPath.push(originalEnd);
            }
            return finalPath;
        }

        closedSet.add(currentKey);

        const neighbors = [
            { x: current.x + 1, y: current.y }, { x: current.x - 1, y: current.y },
            { x: current.x, y: current.y + 1 }, { x: current.x, y: current.y - 1 }
        ];

        for (const neighbor of neighbors) {
            const neighborKey = `${neighbor.x},${neighbor.y}`;
            if (closedSet.has(neighborKey) || !isWalkable(neighbor.x, neighbor.y, grid)) {
                continue;
            }

            const cell = grid[neighbor.y]?.[neighbor.x];
            if (!cell) continue;
            const cost = getMoveCost(cell);
            const tentativeGScore = (gScore.get(currentKey) || 0) + cost;

            if (tentativeGScore < (gScore.get(neighborKey) || Infinity)) {
                cameFrom.set(neighborKey, current);
                gScore.set(neighborKey, tentativeGScore);
                const newFScore = tentativeGScore + heuristic(neighbor, aStarTarget);

                if (!openSet.some(item => item.pos.x === neighbor.x && item.pos.y === neighbor.y)) {
                    openSet.push({ f: newFScore, pos: neighbor });
                }
            }
        }
    }

    return null; // No path found
};

const findRandomLocation = (grid: Cell[][], filter: (cell: Cell) => boolean): {x: number, y: number} | null => {
    let attempts = 0;
    while (attempts < 1000) {
        const x = Math.floor(Math.random() * config.grid_width);
        const y = Math.floor(Math.random() * config.grid_height);
        if (grid[y] && grid[y][x] && filter(grid[y][x])) {
            return { x, y };
        }
        attempts++;
    }
     const fallbackCell = grid.flat().find(filter);
    return fallbackCell ? { x: fallbackCell.x, y: fallbackCell.y } : null;
};

const getCongestionMultiplier = (time: number, scenario: Scenario): number => {
    const hour = Math.floor((time % 96) / 4); // 0-23
    let multiplier = 1.0; // No congestion

    // Time-based congestion (rush hours)
    if ((hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 18)) {
        multiplier = 0.6; // 40% slower
    }

    // Scenario-based congestion
    if (scenario === Scenario.RIOT || scenario === Scenario.LARGE_EVENT) {
        multiplier = Math.min(multiplier, 0.4); // 60% slower, overrides time-based if worse
    }

    if (scenario === Scenario.CRISIS) {
        multiplier = Math.min(multiplier, 0.5); // 50% slower
    }

    return multiplier;
};

const FIREFIGHTER_SPEED_MULTIPLIER = 4;

const moveAgent = (agent: Agent, grid: Cell[][], congestionMultiplier: number) => {
    if (!agent.path || agent.path.length === 0) return;

    const nextStep = agent.path[0];
    const cellAtNextStep = grid[nextStep.y]?.[nextStep.x];

    // Allow firefighters to walk into burning cells
    if (
      cellAtNextStep &&
      cellAtNextStep.fireLevel > 3 &&
      !(
        agent.type === 'firefighter' &&
        (agent.state === 'responding' || agent.state === 'extinguishing')
      )
    ) {
      agent.path = [];
      agent.state = agent.type !== 'firefighter' ? 'fleeing' : 'idle';
      return;
    }

    const targetPos = agent.path[0];
    const dx = targetPos.x - agent.x;
    const dy = targetPos.y - agent.y;
    const distance = Math.hypot(dx, dy);

    // Movement time: 10 minutes per 5 cells = 2 min/cell. 1 tick = 15 min. Speed = 15/2 = 7.5 cells/tick.
    // 2️⃣  replace the baseSpeed computation inside moveAgent
    const baseSpeed =
      agent.type === 'firefighter'
        ? (
            agent.state === 'responding'
              ? 7.5 * FIREFIGHTER_SPEED_MULTIPLIER
              : config.agent_speed * FIREFIGHTER_SPEED_MULTIPLIER
          )
        : config.agent_speed;

    // the rest of moveAgent stays exactly the same ↓
    const speed = baseSpeed * congestionMultiplier;

    if (distance < speed) {
        agent.x = targetPos.x;
        agent.y = targetPos.y;
        agent.path.shift();
    } else {
        agent.x += (dx / distance) * speed;
        agent.y += (dy / distance) * speed;
    }
};

function spawnInitialAgents(
    grid: Cell[][],
    agentCounts: {
        firefighter: number;
        police: number;
        civilian: number;
        arsonist: { profiles: ArsonistProfile[] }
    },
    buildingProperties: Record<BuildingType, BuildingProperties>
): Agent[] {
    const agents: Agent[] = [];

    const findLocations = (filter: (cell: Cell) => boolean): {x: number, y: number}[] => {
        const locations: {x:number, y:number}[] = [];
        grid.flat().forEach(cell => {
            if (filter(cell)) {
                locations.push({x: cell.x, y: cell.y});
            }
        });
        return locations;
    };

    const fireStations = findLocations(c => c.buildingType === BuildingType.FIRE_STATION);
    const policeStations = findLocations(c => c.buildingType === BuildingType.POLICE_STATION);
    const workBuildings = findLocations(c =>
        c.cellType === CellType.BUILDING &&
        c.capacity &&
        c.buildingType !== BuildingType.SINGLE_FAMILY_HOME &&
        c.buildingType !== BuildingType.MULTI_FAMILY_HOME &&
        c.buildingType !== BuildingType.APARTMENT_BUILDING &&
        c.buildingType !== BuildingType.FIRE_STATION &&
        c.buildingType !== BuildingType.POLICE_STATION
    );


    for (let i = 0; i < agentCounts.firefighter; i++) {
        const station = fireStations.length > 0 ? fireStations[i % fireStations.length] : findRandomLocation(grid, (c) => isWalkable(c.x, c.y, grid))!;
        agents.push({ id: `firefighter-${i}`, type: 'firefighter', x: station.x, y: station.y, state: 'idle', path: [], target: null, station, extinguishedFires: 0 });
    }

    for (let i = 0; i < agentCounts.police; i++) {
        const station = policeStations.length > 0 ? policeStations[i % policeStations.length] : findRandomLocation(grid, (c) => isWalkable(c.x, c.y, grid))!;
        agents.push({ id: `police-${i}`, type: 'police', x: station.x, y: station.y, state: 'patrolling', path: [], target: null, station });
    }

    // Spawn civilians based on building capacity
    const civilianAgents: Agent[] = [];
    const residentialSlots: {x: number, y: number}[] = [];
    grid.flat().forEach(cell => {
        if (cell.capacity && (cell.buildingType === BuildingType.SINGLE_FAMILY_HOME || cell.buildingType === BuildingType.MULTI_FAMILY_HOME || cell.buildingType === BuildingType.APARTMENT_BUILDING)) {
            for (let i = 0; i < cell.capacity; i++) {
                residentialSlots.push({x: cell.x, y: cell.y});
            }
        }
    });

    // Shuffle the slots to randomize home assignment
    for (let i = residentialSlots.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [residentialSlots[i], residentialSlots[j]] = [residentialSlots[j], residentialSlots[i]];
    }

    const totalCapacity = residentialSlots.length;
    const civilianCount = Math.min(agentCounts.civilian, totalCapacity);

    for (let i = 0; i < civilianCount; i++) {
        const home = residentialSlots[i];
        const workplace = workBuildings.length > 0 ? workBuildings[Math.floor(Math.random() * workBuildings.length)] : findRandomLocation(grid, c => isWalkable(c.x, c.y, grid))!;

        const rand = Math.random();
        let routineType: RoutineType;
        if (rand < 0.3) {
            routineType = 'STAY_AT_HOME';
        } else if (rand < 0.95) {
            routineType = 'REGULAR_COMMUTER';
        } else {
            routineType = 'NIGHT_SHIFT';
        }

        const newCivilian: Agent = {
            id: `civilian-${i}`,
            type: 'civilian',
            x: home.x,
            y: home.y,
            state: 'at_home',
            path: [],
            target: null,
            home,
            workplace,
            routineType,
            isTrapped: false,
            state_timer: 100
        };
        civilianAgents.push(newCivilian);
    }
    agents.push(...civilianAgents);

    const arsonistProfilesToSpawn = agentCounts.arsonist.profiles;
    for (let i = 0; i < arsonistProfilesToSpawn.length; i++) {
        const pos = findRandomLocation(grid, (c) => isWalkable(c.x, c.y, grid))!;
        const profile = arsonistProfilesToSpawn[i];
        const newArsonist: Agent = {
            id: `arsonist-${i}`,
            type: 'arsonist',
            x: pos.x, y: pos.y,
            state: 'patrolling',
            path: [], target: null,
            cooldown: Math.floor(Math.random() * 200),
            profile,
            arsonCount: 0,
        };
        agents.push(newArsonist);
    }

    return agents;
}

// --- Agent AI State Machines ---

/** ------------------------------------------------------------------
 *  Fire-fighter finite-state machine
 *  - returns true **only** when a fire is actually put out
 * ------------------------------------------------------------------ */
function updateFirefighterState(
  agent: Agent,
  grid: Cell[][],
  reportedFires: Set<string>,   // ⚠️  live, mutable sets!
  claimedFires: Set<string>,
  addEvent: (msg: string) => void,
): boolean {
  const ix = Math.floor(agent.x);
  const iy = Math.floor(agent.y);

  switch (agent.state) {
    /* ------------------------------ IDLE --------------------------- */
    case 'idle': {
      /* pick the nearest UN-claimed fire */
      let nearest: { x: number; y: number } | null = null;
      let best = Infinity;

      reportedFires.forEach((key) => {
        if (claimedFires.has(key)) return;           // someone else already going
        const [fx, fy] = key.split(',').map(Number);
        const d = Math.hypot(ix - fx, iy - fy);
        if (d < best) {
          best = d;
          nearest = { x: fx, y: fy };
        }
      });

      if (nearest) {
        const fireKey = `${nearest.x},${nearest.y}`;
        const path = findPathAStar({ x: ix, y: iy }, nearest, grid);
        if (path) {
          claimedFires.add(fireKey);                 // <-- reserve it **now**
          agent.target = nearest;
          agent.path   = path;
          agent.state  = 'responding';
          addEvent(`🚒 ${agent.id} dispatched to fire at (${fireKey}).`);
        }
      }
      break;
    }

    /* --------------------------- RESPONDING ------------------------ */
    case 'responding':
      if (!agent.path?.length) {
        agent.state       = 'extinguishing';
        agent.state_timer = 4;                       // four ticks → 1 h
      }
      break;

    /* -------------------------- EXTINGUISHING ---------------------- */
    case 'extinguishing':
      if (--agent.state_timer! > 0) break;
      const tgt = agent.target;
      if (tgt && grid[tgt.y]?.[tgt.x]) {
        const cell = grid[tgt.y][tgt.x];
        const wasBurning = cell.fireLevel > 0;
        cell.fireLevel        = 0;
        cell.fireIgnitionTime = null;

        const k = `${tgt.x},${tgt.y}`;
        reportedFires.delete(k);
        claimedFires.delete(k);

        addEvent(`✅ Fire extinguished at (${k}).`);

        agent.state  = 'idle';
        if (reportedFires.size == 0 && agent.station) {
          const backPath = findPathAStar({ x: ix, y: iy }, agent.station, grid);
          agent.path  = backPath || [];
          agent.state = backPath ? 'returning' : 'idle';
        } else {
          agent.state = 'idle';
        }
        agent.target = null;

        return wasBurning;
      }
      agent.state  = 'idle';
      agent.target = null;
      break;

    /* ---------------------------- RETURNING ------------------------ */
    case 'returning':
      if (!agent.path?.length) agent.state = 'idle';
      break;
  }
  return false;
}

function updatePoliceState(agent: Agent, grid: Cell[][], allAgents: Agent[], reportFire: (x: number, y: number) => void, addEvent: (message: string) => void) {
    const ix = Math.floor(agent.x);
    const iy = Math.floor(agent.y);

    if (agent.state === 'apprehending') {
      // If apprehending, stay put for a short time to "process" the arrest, then go back to patrolling.
      agent.state_timer = (agent.state_timer ?? 0) - 1;
      if (agent.state_timer <= 0) {
        agent.state = 'patrolling';
      }
      return;
    }

    // Proximity-based arrest logic
    const nearbyArsonists = allAgents.filter(a =>
        a.type === 'arsonist' &&
        a.state !== 'apprehended' &&
        Math.hypot(ix - a.x, iy - a.y) < 2.0 // Check within 2 cells
    );

    if (nearbyArsonists.length > 0) {
        const targetArsonist = nearbyArsonists[0];
        targetArsonist.state = 'apprehended';
        agent.state = 'apprehending';
        agent.state_timer = 2; // Pause for 2 ticks to simulate arrest
        agent.path = [];
        addEvent(`Arsonist with ${targetArsonist.profile} profile apprehended at (${Math.floor(targetArsonist.x)}, ${Math.floor(targetArsonist.y)}).`);
        return; // End turn after making an arrest
    }

    // Normal patrolling if no one to arrest
    if (!agent.path || agent.path.length === 0) {
        const destination = findRandomLocation(grid, (cell) => cell.roadType === 'HIGHWAY' || cell.roadType === 'MAIN_ROAD');
        if (destination) {
            agent.path = findPathAStar({x: ix, y: iy}, destination, grid) || [];
        }
        agent.state = 'patrolling';
    }

    // Always report fires
    for (let dx = -7; dx <= 7; dx++) {
        for (let dy = -7; dy <= 7; dy++) {
            const [cx, cy] = [ix + dx, iy + dy];
            if (cx >= 0 && cx < config.grid_width && cy >= 0 && cy < config.grid_height && grid[cy]?.[cx]?.fireLevel > 0) {
                reportFire(cx, cy);
                return; // Report one fire per tick
            }
        }
    }
}

// --- NEW CROWD BEHAVIOR MODULE ---
function updateCivilianBehavior(
    agent: Agent,
    allAgents: Agent[],
    grid: Cell[][],
    scenario: Scenario,
    time: number,
    reportFire: (x: number, y: number) => void,
    cachedLocations: { parks: {x:number, y:number}[]; shops: {x:number, y:number}[] },
    eventLocation: {x: number, y: number} | null,
    riotHotspot: {x: number, y: number} | null
) {
    if (agent.isTrapped) return; // Trapped agents can't act

    const ix = Math.floor(agent.x);
    const iy = Math.floor(agent.y);
    const walkableFilter = (cell: Cell) => isWalkable(cell.x, cell.y, grid);

    const findNearest = (locations: {x:number, y:number}[]) => {
        if (!locations || locations.length === 0) return null;
        let nearest = null;
        let minDistance = Infinity;
        for (const loc of locations) {
            const dist = Math.hypot(ix - loc.x, iy - loc.y);
            if (dist < minDistance) {
                minDistance = dist;
                nearest = loc;
            }
        }
        return nearest;
    }

    // --- Universal behavior: Fleeing from fire ---
    const perceptionRadius = 8;
    const nearbyFires: {x: number, y: number}[] = [];
    for (let dx = -perceptionRadius; dx <= perceptionRadius; dx++) {
        for (let dy = -perceptionRadius; dy <= perceptionRadius; dy++) {
            const [cx, cy] = [ix + dx, iy + dy];
            if (cx >= 0 && cx < config.grid_width && cy >= 0 && cy < config.grid_height && grid[cy]?.[cx]?.fireLevel > 0) {
                nearbyFires.push({x: cx, y: cy});
                reportFire(cx, cy);
            }
        }
    }

    if (nearbyFires.length > 0) {
        if (agent.state !== 'fleeing') {
             agent.state = 'fleeing';
        }
        // Flee away from the center of the fire threat
        const avgFireX = nearbyFires.reduce((sum, f) => sum + f.x, 0) / nearbyFires.length;
        const avgFireY = nearbyFires.reduce((sum, f) => sum + f.y, 0) / nearbyFires.length;

        const fleeVectorX = ix - avgFireX;
        const fleeVectorY = iy - avgFireY;

        const fleeTargetX = ix + fleeVectorX * 5;
        const fleeTargetY = iy + fleeVectorY * 5;

        const destination = findRandomLocation(grid, walkableFilter);
        if (destination) {
            const path = findPathAStar({x:ix, y:iy}, {x: Math.round(fleeTargetX), y: Math.round(fleeTargetY)}, grid);
            agent.path = path || findPathAStar({x:ix, y:iy}, destination, grid) || [];
        }

        return; // Fleeing overrides all other behaviors
    } else if (agent.state === 'fleeing') {
        agent.state = 'patrolling'; // Stop fleeing if fire is no longer near
    }


    // --- TIME-DRIVEN ROUTINE ---
    const hour = Math.floor((time % 96) / 4); // 0-23 hour cycle

    // Handle agent's path completion
    if (agent.path && agent.path.length === 0) {
        if (agent.state === 'going_to_work') { agent.state = 'working'; agent.state_timer = Math.floor(Math.random() * 200) + 100; }
        else if (agent.state === 'going_home') { agent.state = 'at_home'; agent.state_timer = Math.floor(Math.random() * 200) + 100; }
        else if (agent.state === 'shopping') { agent.state = 'patrolling'; agent.state_timer = Math.floor(Math.random() * 50) + 20; }
        else if (agent.state === 'seeking_shelter') { /* stay there */ }
    }

    // Handle state timers
    if (agent.state_timer && agent.state_timer > 0) {
        agent.state_timer--;
    }

    // --- Scenario-specific overrides ---
    if (scenario === Scenario.RIOT && riotHotspot) {
        // 70% of commuters will join the riot instead of their normal routine
        if (agent.routineType === 'REGULAR_COMMUTER' && Math.random() < 0.7) {
            if (agent.state !== 'fleeing' && agent.state !== 'patrolling') {
                 agent.state = 'patrolling'; // Re-purpose 'patrolling' to mean 'going to riot'
                 agent.path = findPathAStar({x: ix, y: iy}, riotHotspot, grid) || [];
            }
             // If at the riot, stay there for a while
            if (Math.hypot(ix - riotHotspot.x, iy - riotHotspot.y) < 20) {
                 agent.path = [];
            }
            return; // This overrides normal daily routine for rioters
        }
    }

    if (scenario === Scenario.LARGE_EVENT && eventLocation) {
        if (agent.routineType !== 'STAY_AT_HOME' && Math.random() < 0.7) {
            if (agent.state !== 'patrolling' || !agent.path || agent.path.length === 0) {
                 const path = findPathAStar({x:ix, y:iy}, eventLocation, grid);
                 if (path) {
                     agent.path = path;
                     agent.state = 'patrolling';
                 }
            }
            return;
        }
    }


    // --- Main routine logic ---
    switch (agent.routineType) {
        case 'STAY_AT_HOME':
            if (agent.state !== 'at_home' && agent.home) {
                agent.path = findPathAStar({x:ix, y:iy}, agent.home, grid) || [];
            }
            break;

        case 'NIGHT_SHIFT':
            if (hour >= 20 || hour < 6) { // Work time
                if (agent.state !== 'working' && agent.state !== 'going_to_work' && agent.workplace) {
                    agent.path = findPathAStar({x:ix, y:iy}, agent.workplace, grid) || [];
                    agent.state = 'going_to_work';
                }
            } else { // Off time
                if (agent.state === 'working' && agent.home) {
                    agent.path = findPathAStar({x:ix, y:iy}, agent.home, grid) || [];
                    agent.state = 'going_home';
                }
            }
            break;

        case 'REGULAR_COMMUTER':
        default:
            if (hour >= 8 && hour < 18) { // Work time
                if (agent.state === 'at_home' && agent.workplace) {
                    agent.path = findPathAStar({x:ix, y:iy}, agent.workplace, grid) || [];
                    agent.state = 'going_to_work';
                } else if (agent.state === 'working' && agent.state_timer === 0) {
                    // Decide to do something else, like get lunch or go to a park
                    if (Math.random() < 0.2) {
                        const destination = findNearest(cachedLocations.shops);
                        if (destination) {
                            agent.path = findPathAStar({x:ix, y:iy}, destination, grid) || [];
                            agent.state = 'shopping';
                        } else {
                            agent.state_timer = 100; // try again later
                        }
                    }
                }
            } else { // Off time
                if ((agent.state === 'working' || agent.state === 'patrolling' || agent.state === 'shopping') && agent.home) {
                    if (Math.random() < 0.1 && agent.state !== 'shopping' && cachedLocations.shops.length > 0) {
                        const destination = findNearest(cachedLocations.shops);
                        if (destination) {
                            agent.path = findPathAStar({x:ix, y:iy}, destination, grid) || [];
                            agent.state = 'shopping';
                        }
                    } else {
                         agent.path = findPathAStar({x:ix, y:iy}, agent.home, grid) || [];
                         agent.state = 'going_home';
                    }
                }
            }
            break;
    }

    // Default patrolling if idle
    if ((!agent.path || agent.path.length === 0) && (agent.state === 'idle' || agent.state === 'patrolling')) {
        const destination = findRandomLocation(grid, walkableFilter);
        if (destination) agent.path = findPathAStar({x: ix, y: iy}, destination, grid) || [];
    }
}


// --- ARSONIST LOGIC ---
function updateArsonistState(
    agent: Agent,
    grid: Cell[][],
    addEvent: (message: string) => void,
    burningCells: any,
    currentTime: number,
    firesByProfileThisTick: Partial<Record<ArsonistProfileType, number>>,
    arsonistConfig: ArsonistConfiguration
) {
    if (agent.state === 'apprehended' || !agent.profile) return;
    const ix = Math.floor(agent.x);
    const iy = Math.floor(agent.y);

    // 1. Handle cooldown from a previous successful fire.
    agent.cooldown = Math.max(0, (agent.cooldown || 0) - 1);
    if (agent.cooldown > 0) {
        // If on cooldown, just keep moving to a new area.
        if (!agent.path || agent.path.length === 0) {
             const destination = findRandomLocation(grid, (cell) => isWalkable(cell.x, cell.y, grid));
             if (destination) agent.path = findPathAStar({x: ix, y: iy}, destination, grid) || [];
        }
        return; // Don't look for targets while on cooldown.
    }

    // 2. Handle fire-starting limit.
    const profileConfig = arsonistConfig[agent.profile];
    if (!profileConfig || ((agent.arsonCount || 0) >= profileConfig.maxFires)) {
        // Wander aimlessly if limit is reached.
        if (agent.state !== 'wandering_limit_reached') {
            agent.state = 'wandering_limit_reached';
        }
        if (!agent.path || agent.path.length === 0) {
            const destination = findRandomLocation(grid, (cell) => isWalkable(cell.x, cell.y, grid));
            if (destination) {
                agent.path = findPathAStar({x: ix, y: iy}, destination, grid) || [];
            }
        }
        return; // Do nothing else this tick.
    }

    // 3. Scan for opportunistic targets nearby.
    const scanRadius = 3;
    const nearbyTargets: Cell[] = [];
    const profileTargets = ARSONIST_PROFILES[agent.profile]?.targets;

    for (let dx = -scanRadius; dx <= scanRadius; dx++) {
        for (let dy = -scanRadius; dy <= scanRadius; dy++) {
            const nx = ix + dx;
            const ny = iy + dy;
            const cell = grid[ny]?.[nx];
            if (cell && cell.cellType === 'BUILDING' && cell.fireLevel === 0 && !cell.isBurntOut) {
                // If profile has specific targets, check against them. Otherwise, any building is a target.
                if (!profileTargets || (cell.buildingType && profileTargets.includes(cell.buildingType))) {
                    nearbyTargets.push(cell);
                }
            }
        }
    }

    // 4. If a suitable target is found, attempt to start a fire.
    if (nearbyTargets.length > 0) {
        const targetCell = nearbyTargets[Math.floor(Math.random() * nearbyTargets.length)];

        // Calculate effective risk based on controls
        let effectiveRisk = targetCell.arsonRisk || 0.01;
        for (const key in CONTROL_IMPACTS) {
            const controlKey = key as keyof typeof CONTROL_IMPACTS;
            if (targetCell[controlKey]) {
                effectiveRisk += CONTROL_IMPACTS[controlKey].risk;
            }
        }
        effectiveRisk = Math.max(0, effectiveRisk); // Risk cannot be negative

        // Base probability scaled by effective risk.
        let chance = effectiveRisk * config.arson_base_probability_multiplier;

        // Surveillance reduces the chance of a successful attempt.
        // COMBINE base surveillance with dynamic bonus from police presence.
        const totalSurveillance = Math.min(1.0, (targetCell.surveillanceLevel || 0) + (targetCell.dynamicSurveillance || 0));
        chance *= (1 - totalSurveillance * 0.5);

        if (Math.random() < chance) {
            // --- Success ---
            targetCell.fireLevel = 3.33;
            targetCell.fireIgnitionTime = currentTime;

            const locationType = targetCell.cellType === 'PARK' ? 'a Park' : `a ${formatBuildingType(targetCell.buildingType)}`;
            addEvent(`Fire started by ${ARSONIST_PROFILES[agent.profile!].name} at ${locationType} (${targetCell.x}, ${targetCell.y}).`);
            burningCells.add(`${targetCell.x},${targetCell.y}`);
            agent.arsonCount = (agent.arsonCount || 0) + 1;
            agent.cooldown = 40 + Math.floor(Math.random() * 40); // Cooldown (10-20h) after success

            if (agent.profile) {
                firesByProfileThisTick[agent.profile] = (firesByProfileThisTick[agent.profile] || 0) + 1;
            }
        }
        // On failure, the arsonist doesn't go on cooldown. They can try again next tick.
    } else {
        // 5. If no target is nearby, continue patrolling to a new random location.
        if (!agent.path || agent.path.length === 0) {
            const destination = findRandomLocation(grid, (cell) => isWalkable(cell.x, cell.y, grid));
            if (destination) agent.path = findPathAStar({x: ix, y: iy}, destination, grid) || [];
        }
    }
}


function handleScenarioDrivenBehavior(
    agent: Agent,
    scenario: Scenario,
    riotHotspot: { x: number, y: number } | null,
    addEvent: (message: string) => void
): Agent {
    if (agent.type !== 'civilian' || scenario !== Scenario.RIOT) {
        return agent;
    }

    let isNearHotspot = false;
    if (riotHotspot) {
        if (Math.hypot(agent.x - riotHotspot.x, agent.y - riotHotspot.y) < 25) {
            isNearHotspot = true;
        }
    }

    const turnChance = config.civilian_to_arsonist_prob_base * (isNearHotspot ? config.riot_transform_prob_multiplier : 1);

    if (Math.random() < turnChance) {
        addEvent(`A civilian has joined the riot at (${Math.floor(agent.x)}, ${Math.floor(agent.y)})!`);
        return {
            ...agent,
            type: 'arsonist',
            state: 'patrolling',
            cooldown: 0,
            profile: 'PROTESTER',
            arsonCount: 0,
        };
    }

    return agent;
}


// --- Main Simulation Hook ---
export function useSimulation({ scenario, agentCounts, arsonistConfig, resetTrigger, onEndSimulation, buildingProperties, simulationCycle }: { scenario: Scenario; agentCounts: { firefighter: number; police: number; civilian: number; arsonist: { profiles: ArsonistProfile[]; }; }; arsonistConfig: ArsonistConfiguration; resetTrigger: number; onEndSimulation: () => void; buildingProperties: Record<BuildingType, BuildingProperties>; simulationCycle: number; }) {
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [stats, setStats] = useState<Stats>({ fires: 0, casualties: 0, buildingsDestroyed: 0, arsonistsApprehended: 0, citizensTrapped: 0, firesExtinguished: 0, liveFirefighters: 0, livePolice: 0, liveCivilians: 0, liveArsonists: 0, firesByProfile: {}, history: [] });
  const [events, setEvents] = useState<SimEvent[]>([]);
  const [time, setTime] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const [speed, setSpeed] = useState<keyof typeof config.SIMULATION_SPEEDS>('4x');
  const [congestion, setCongestion] = useState(1.0);

  const [burningCells, setBurningCells] = useState<Set<string>>(new Set());
  const [reportedFires, setReportedFires] = useState<Set<string>>(new Set());
  const [claimedFires, setClaimedFires] = useState<Set<string>>(new Set());

  const locationCache = useRef<{
      parks: {x:number, y:number}[];
      shops: {x:number, y:number}[]
  }>({ parks: [], shops: [] });
  const eventLocationRef = useRef<{x: number, y: number} | null>(null);
  const riotHotspotRef = useRef<{x: number, y: number} | null>(null);


  const { toast } = useToast();
  const simulationCallbackRef = useRef<() => void>();
  const isInitialMount = useRef(true);
  const lastUpdateTimeRef = useRef(0);
  const timeAccumulatorRef = useRef(0);


  // --- Initialization and Reset ---
  useEffect(() => {
    const startTime = 0;
    setTime(startTime);
    setIsPaused(true);
    setStats({
      fires: 0,
      casualties: 0,
      buildingsDestroyed: 0,
      arsonistsApprehended: 0,
      citizensTrapped: 0,
      firesExtinguished: 0,
      liveFirefighters: agentCounts.firefighter,
      livePolice: agentCounts.police,
      liveCivilians: agentCounts.civilian,
      liveArsonists: agentCounts.arsonist.profiles.length,
      firesByProfile: {},
      history: [],
    });
    setBurningCells(new Set());
    setReportedFires(new Set());
    setClaimedFires(new Set());

    const policeStations = Math.ceil(agentCounts.police / 4);
    const fireStations = Math.ceil(agentCounts.firefighter / 6);

    const initialGrid = generateCity({ policeStations, fireStations, buildingProperties });
    setGrid(initialGrid);

    const parks: {x:number, y:number}[] = [];
    const shops: {x:number, y:number}[] = [];
    initialGrid.flat().forEach(cell => {
        if (cell.cellType === 'PARK' || cell.buildingType === BuildingType.POOL) parks.push({x: cell.x, y: cell.y});
        if (cell.buildingType === BuildingType.SUPERMARKET || cell.buildingType === BuildingType.SHOPPING_MALL || cell.buildingType === BuildingType.KIOSK) shops.push({x: cell.x, y: cell.y});
    });
    locationCache.current = { parks, shops };

    const eventLocation = initialGrid.flat().find(c => c.buildingType === BuildingType.STADIUM);
    eventLocationRef.current = eventLocation ? { x: eventLocation.x, y: eventLocation.y } : null;

    const riotHotspot = initialGrid.flat().find(c => c.buildingType === BuildingType.TOWN_HALL);
    riotHotspotRef.current = riotHotspot ? { x: riotHotspot.x, y: riotHotspot.y } : null;

    const initialAgents = spawnInitialAgents(initialGrid, agentCounts, buildingProperties);
    setAgents(initialAgents);

    const message = isInitialMount.current
      ? `Simulation initialized with ${scenario} scenario.`
      : `Simulation reset with ${scenario} scenario.`;
    setEvents([{ id: crypto.randomUUID(), timestamp: startTime, message }]);
    isInitialMount.current = false;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentCounts, resetTrigger, buildingProperties]);


  // --- Simulation Core Loop ---
  useEffect(() => {
    const simulationCallback = () => {
      const maxTime = simulationCycle * config.ticks_per_day;
      if (time >= maxTime) {
          if (!isPaused) {
              onEndSimulation();
          }
          return; // Stop the simulation
      }

      setTime(t => t + 1);

      setGrid(prevGrid => {
        const newGrid = structuredClone(prevGrid);
        let agentsToProcess = structuredClone(agents);
        const newBurningCells = new Set(burningCells);
        const currentTime = time + 1;
        const congestionMultiplier = getCongestionMultiplier(currentTime, scenario);
        setCongestion(congestionMultiplier);

        let buildingsDestroyedThisStep = 0;
        let casualtiesThisTick = 0;
        let firesExtinguishedThisTick = 0;
        const firesByProfileThisTick: Partial<Record<ArsonistProfileType, number>> = {};
        const newEvents: SimEvent[] = [];
        const newReportedFires = new Set(reportedFires);
        const newClaimedFires = new Set(claimedFires);
        console.log(`👨‍🚒 reported fires:`, Array.from(reportedFires));


        const addEvent = (message: string) => {
            newEvents.push({ id: crypto.randomUUID(), timestamp: currentTime, message });
        }

        const reportFire = (x: number, y: number) => {
            const key = `${x},${y}`;
            if (!newReportedFires.has(key) && !newClaimedFires.has(key)) {
                if(newGrid[y]?.[x]?.hasFireAlarm) {
                    addEvent(`AUTOMATED ALARM: Fire detected at (${x}, ${y}).`);
                } else {
                    addEvent(`Fire reported at (${x}, ${y}).`);
                }
                newReportedFires.add(key);
            }
        };

        // --- DYNAMIC SURVEILLANCE UPDATE ---
        newGrid.flat().forEach(cell => cell.dynamicSurveillance = 0);
        const policeAgents = agentsToProcess.filter(a => a.type === 'police');
        policeAgents.forEach(police => {
            const ix = Math.floor(police.x);
            const iy = Math.floor(police.y);
            for (let dx = -config.police_surveillance_radius; dx <= config.police_surveillance_radius; dx++) {
                for (let dy = -config.police_surveillance_radius; dy <= config.police_surveillance_radius; dy++) {
                    if (dx*dx + dy*dy <= config.police_surveillance_radius * config.police_surveillance_radius) {
                        const nx = ix + dx;
                        const ny = iy + dy;
                        const cell = newGrid[ny]?.[nx];
                        if (cell) {
                            cell.dynamicSurveillance = Math.max(cell.dynamicSurveillance || 0, config.police_surveillance_bonus);
                        }
                    }
                }
            }
        });


        // --- Grid Update (Fire Spread & Burnout) ---
        const newlyBurntOutCellKeys = new Set<string>();

        /*  🔥  GRID UPDATE – fire spread & burn-out  */
        const BURN_OUT_TICKS = 10;

        burningCells.forEach(key => {
            const [x, y] = key.split(',').map(Number);
            const cell = newGrid[y]?.[x];
            if (!cell) return;
            console.log(`time for fire ${cell.fireIgnitionTime}`)
             if (
              cell.fireIgnitionTime !== null &&
              currentTime - cell.fireIgnitionTime >= BURN_OUT_TICKS &&
                 cell.fireLevel > 5
            ) {
              console.log(`time for fire ${cell.fireIgnitionTime}`)
              cell.isBurntOut        = true;
              cell.fireLevel         = 0;
              cell.fireIgnitionTime  = null;
              newlyBurntOutCellKeys.add(key);

              if (cell.cellType === CellType.BUILDING) {
                buildingsDestroyedThisStep++;
                addEvent(`${formatBuildingType(cell.buildingType)} at (${x}, ${y}) completely burned down.`);
              }
              return;
            }

            // Fire intensity increases over time
            if (cell.fireLevel < 10) {
                 let effectiveFlammability = cell.flammability;
                 for (const cKey in CONTROL_IMPACTS) {
                    const controlKey = cKey as keyof typeof CONTROL_IMPACTS;
                    if(cell[controlKey]) {
                        effectiveFlammability += CONTROL_IMPACTS[controlKey].flammability;
                    }
                 }
                 effectiveFlammability = Math.max(0, effectiveFlammability);

                 if(Math.random() < 0.1 * effectiveFlammability) {
                    cell.fireLevel = Math.min(10, cell.fireLevel + 1);
                 }
            }

            if (cell.fireLevel === 1 && cell.hasFireAlarm) {
                reportFire(x, y);
            }

            // Fire spread logic with 15-minute (1-tick) delay
            if (cell.fireIgnitionTime !== null && currentTime - cell.fireIgnitionTime >= 1) {
              for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
                  const nx = x + dx;
                  const ny = y + dy;
                  if (nx >= 0 && nx < config.grid_width && ny >= 0 && ny < config.grid_height) {
                      const neighbor = newGrid[ny][nx];
                      if (neighbor.cellType === CellType.ROAD || neighbor.cellType === CellType.WATER) {
                          continue;
                      }

                      if (!neighbor.isBurntOut && neighbor.fireLevel === 0) {
                          let effectiveFlammability = neighbor.flammability;
                          for (const cKey in CONTROL_IMPACTS) {
                             const controlKey = cKey as keyof typeof CONTROL_IMPACTS;
                             if(neighbor[controlKey]) {
                                 effectiveFlammability += CONTROL_IMPACTS[controlKey].flammability;
                             }
                          }
                          effectiveFlammability = Math.max(0, effectiveFlammability);

                          /* let spreadChance = 0.01 * effectiveFlammability * (cell.fireLevel * 1.5);

                          if (Math.random() < spreadChance) {
                              if (!newBurningCells.has(`${nx},${ny}`)) {
                                newGrid[ny][nx].fireLevel = 1;
                                newGrid[ny][nx].fireIgnitionTime = currentTime;
                                newBurningCells.add(`${nx},${ny}`);
                              }
                          } */
                          if (cell?.fireLevel > 5 ) {
                              if (!newBurningCells.has(`${nx},${ny}`)) {
                                newGrid[ny][nx].fireLevel = 1;
                                newGrid[ny][nx].fireIgnitionTime = currentTime;
                                newBurningCells.add(`${nx},${ny}`);
                              }
                          }
                      }
                  }
              }
            }
        });

        // Remove burnt out cells from active burning set
        newlyBurntOutCellKeys.forEach(key => newBurningCells.delete(key));

        // --- Agent Casualty Logic from Building Collapse ---
        let agentsAfterCollapse = [...agentsToProcess];
        if (newlyBurntOutCellKeys.size > 0) {
            const burntOutCoords = Array.from(newlyBurntOutCellKeys).map(key => {
                const [x,y] = key.split(',').map(Number);
                return {x,y};
            });

            agentsAfterCollapse = agentsToProcess.filter(agent => {
                const ix = Math.floor(agent.x);
                const iy = Math.floor(agent.y);
                const isInBurntBuilding = burntOutCoords.some(coord => coord.x === ix && coord.y === iy);

                if (isInBurntBuilding && (agent.type === 'civilian' || (agent.type === 'arsonist' && agent.state !== 'apprehended'))) {
                    casualtiesThisTick++;
                    addEvent(`${agent.type.charAt(0).toUpperCase() + agent.type.slice(1)} perished in collapsed building at (${ix}, ${iy}).`);
                    return false; // Remove from agent list
                }
                return true;
            });
        }

        // Apply scenario-driven transformations first
        let agentsToUpdate = agentsAfterCollapse.map(agent => handleScenarioDrivenBehavior(agent, scenario, riotHotspotRef.current, addEvent));

        const survivingAgents: Agent[] = [];
        agentsToUpdate.forEach(agent => {
            const ix = Math.floor(agent.x);
            const iy = Math.floor(agent.y);
            const currentCell = newGrid[iy]?.[ix];

            // --- Universal Trapped Logic ---
            if (currentCell && currentCell.fireLevel > 7 && (agent.type === 'civilian' || agent.type === 'arsonist')) {
                  let canEscape = false;
                  for (let dx = -1; dx <= 1; dx++) {
                      for (let dy = -1; dy <= 1; dy++) {
                          if (dx === 0 && dy === 0) continue;
                          const nx = ix + dx;
                          const ny = iy + dy;
                          if ( isWalkable(nx, ny, newGrid) && newGrid[ny]?.[nx]?.fireLevel < 4) {
                              canEscape = true;
                              break;
                          }
                      }
                      if (canEscape) break;
                  }

                  if (!canEscape) {
                      if (!agent.isTrapped) {
                          agent.isTrapped = true;
                          addEvent(`${agent.type.charAt(0).toUpperCase() + agent.type.slice(1)} trapped by fire at (${ix}, ${iy}).`);
                      }
                  }
            } else {
                agent.isTrapped = false;
            }

            if (agent.state === 'apprehended') {
                survivingAgents.push(agent);
                return;
            }

            switch(agent.type) {
                case 'firefighter':
                  if (
                    updateFirefighterState(
                      agent,
                      newGrid,
                      newReportedFires,   // ← SAME Set instances for every firefighter this tick
                      newClaimedFires,
                      addEvent,
                    )
                  ) {
                    firesExtinguishedThisTick++;   // increments exactly once per fire
                  }
                  break;
                case 'police':
                    updatePoliceState(agent, newGrid, agentsToUpdate, reportFire, addEvent);
                    break;
                case 'civilian':
                    updateCivilianBehavior(agent, agentsToUpdate, newGrid, scenario, currentTime, reportFire, locationCache.current, eventLocationRef.current, riotHotspotRef.current);
                    break;
                case 'arsonist':
                    updateArsonistState(agent, newGrid, addEvent, newBurningCells, currentTime, firesByProfileThisTick, arsonistConfig);
                    break;
            }
            moveAgent(agent, newGrid, congestionMultiplier);
            survivingAgents.push(agent);
        });

        const trappedCount = survivingAgents.filter(a => a.isTrapped).length;
        const apprehendedCount = survivingAgents.filter(a => a.type === 'arsonist' && a.state === 'apprehended').length;

        const liveCounts = survivingAgents.reduce((acc, agent) => {
            switch(agent.type) {
                case 'firefighter': acc.liveFirefighters++; break;
                case 'police': acc.livePolice++; break;
                case 'civilian': acc.liveCivilians++; break;
                case 'arsonist': if (agent.state !== 'apprehended') acc.liveArsonists++; break;
            }
            return acc;
        }, { liveFirefighters: 0, livePolice: 0, liveCivilians: 0, liveArsonists: 0 });

        // --- Final state updates for this tick ---
        setAgents(survivingAgents);
        setBurningCells(newBurningCells);
        setReportedFires(newReportedFires);
        setClaimedFires(newClaimedFires);

        setStats(s => {
          const newFiresByProfile = { ...s.firesByProfile };
          Object.entries(firesByProfileThisTick).forEach(([profile, count]) => {
              newFiresByProfile[profile as ArsonistProfileType] = (newFiresByProfile[profile as ArsonistProfileType] || 0) + count;
          });

          const currentStats = {
            casualties: s.casualties + casualtiesThisTick,
            buildingsDestroyed: s.buildingsDestroyed + buildingsDestroyedThisStep,
            firesExtinguished: s.firesExtinguished + firesExtinguishedThisTick,
            arsonistsApprehended: apprehendedCount,
            citizensTrapped: trappedCount,
            fires: reportedFires.size,
            ...liveCounts,
            firesByProfile: newFiresByProfile,
          };

          const newHistory = (currentTime % 4 === 0) ? [ // Add to history every hour
              ...s.history,
              {
                  time: currentTime,
                  fires: currentStats.fires,
                  casualties: currentStats.casualties,
                  buildingsDestroyed: currentStats.buildingsDestroyed,
                  arsonistsApprehended: currentStats.arsonistsApprehended,
              }
          ].slice(-100) : s.history; // Keep last 100 entries

          return {
              ...currentStats,
              history: newHistory,
          };
        });

        if (newEvents.length > 0) {
          setEvents(prev => [...newEvents.reverse(), ...prev].slice(0, 100));
        }

        return newGrid;
      });
    };
    simulationCallbackRef.current = simulationCallback;
  }, [agents, time, burningCells, reportedFires, claimedFires, scenario, stats, isPaused, onEndSimulation, buildingProperties, arsonistConfig, simulationCycle]);

  // --- Simulation Controls ---
  useEffect(() => {
    lastUpdateTimeRef.current = performance.now();
    timeAccumulatorRef.current = 0;

    let animationFrameId: number;

    const gameLoop = (timestamp: number) => {
      animationFrameId = requestAnimationFrame(gameLoop);
      if (isPaused) {
        return;
      }
      const deltaTime = timestamp - lastUpdateTimeRef.current;
      lastUpdateTimeRef.current = timestamp;


      const interval = config.SIMULATION_SPEEDS[speed];
      timeAccumulatorRef.current += deltaTime;

      // Run the simulation logic as many times as needed to catch up
      while (timeAccumulatorRef.current >= interval) {
        if (simulationCallbackRef.current) {
          simulationCallbackRef.current();
        }
        timeAccumulatorRef.current -= interval;
      }
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isPaused, speed]);

  const togglePause = () => {
    setIsPaused(p => {
        if (p) { // If it was paused, we are resuming
            lastUpdateTimeRef.current = performance.now(); // Reset timer to avoid a huge jump
            setEvents(prev => [{ id: crypto.randomUUID(), timestamp: time, message: "Simulation resumed." }, ...prev.slice(0, 99)]);
        } else {
            setEvents(prev => [{ id: crypto.randomUUID(), timestamp: time, message: "Simulation paused." }, ...prev.slice(0, 99)]);
        }
        return !p;
    });
  }

  const handleSetSpeed = (newSpeed: keyof typeof config.SIMULATION_SPEEDS) => {
    setSpeed(newSpeed);
    setEvents(prev => [{ id: crypto.randomUUID(), timestamp: time, message: `Simulation speed set to ${newSpeed}.` }, ...prev.slice(0, 99)]);
  }

  return {
    grid,
    agents,
    stats,
    events,
    time,
    isPaused,
    speed,
    congestion,
    togglePause,
    setSpeed: handleSetSpeed,
  };
}
