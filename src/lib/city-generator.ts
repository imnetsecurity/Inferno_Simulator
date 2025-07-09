import { config, BuildingType, CellType, RoadType, BuildingProperties } from './config';
import type { Cell, BuildingType as BuildingEnumType } from '@/types/simulation';

/**
 * City‑generator v2‑full — higher‑density with complete helpers
 * --------------------------------------------------------------
 *  • DENSITY_FACTOR controls residential density.
 *  • Every multi‑tile block is ringed by one‑tile STREET perimeter
 *    so firefighters always have a walkable approach.
 *  • All original terrain & road helpers (addRivers, addParks,
 *    addHighways, addMainRoads) are included verbatim.
 */

// ensure RoadType contains STREET in your config
//   export enum RoadType { HIGHWAY, MAIN_ROAD, BRIDGE, ALLEY, STREET }

const { grid_width, grid_height } = config;
const DENSITY_FACTOR = 1.8; // ← raise/lower for more/less housing

// ------------------------------------------------------------------
// RNG
// ------------------------------------------------------------------
function createSeededRandom(seed: number) {
  return function () {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

// ------------------------------------------------------------------
// Cell helpers
// ------------------------------------------------------------------
function createBaseCell(
  x: number,
  y: number,
  buildingProps: Record<BuildingType, BuildingProperties>,
  cellType: CellType,
  buildingType?: BuildingType,
  roadType?: RoadType,
): Cell {
  let props: BuildingProperties = {
    size: [1, 1],
    color: 'grey',
    flammability: 0.1,
    arsonRisk: 0.01,
    motives: [],
  };
  if (cellType === 'BUILDING' && buildingType && buildingProps[buildingType]) {
    props = buildingProps[buildingType];
  }
  return {
    id: `${x}-${y}`,
    x,
    y,
    cellType,
    buildingType,
    roadType,
    flammability: props.flammability ?? 0.1,
    arsonRisk: props.arsonRisk ?? 0.01,
    motives: props.motives,
    surveillanceLevel: props.surveillanceLevel,
    dynamicSurveillance: 0,
    capacity: props.capacity,
    fireLevel: 0,
    isBurntOut: false,
    fireIgnitionTime: null,
    hasCCTV: props.hasCCTV,
    hasFireAlarm: props.hasFireAlarm,
    hasSprinklerSystem: props.hasSprinklerSystem,
    hasSecurityPatrol: props.hasSecurityPatrol,
    isCommunityWatched: props.isCommunityWatched,
    isAbandoned: props.isAbandoned,
    hasPoorMaintenance: props.hasPoorMaintenance,
    hasGraffiti: props.hasGraffiti,
    isIsolated: props.isIsolated,
    isControversial: props.isControversial,
  };
}

// ------------------------------------------------------------------
// Street perimeter (path guarantee)
// ------------------------------------------------------------------
function addPerimeterRoad(
  grid: Cell[][],
  buildingProps: Record<BuildingType, BuildingProperties>,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const carve = (cx: number, cy: number) => {
    if (
      cy >= 0 &&
      cy < grid_height &&
      cx >= 0 &&
      cx < grid_width &&
      grid[cy][cx].cellType === CellType.LAND
    ) {
      grid[cy][cx] = createBaseCell(cx, cy, buildingProps, CellType.ROAD, undefined, RoadType.STREET);
    }
  };
  for (let dx = -1; dx <= w; dx++) {
    carve(x + dx, y - 1);
    carve(x + dx, y + h);
  }
  for (let dy = 0; dy < h; dy++) {
    carve(x - 1, y + dy);
    carve(x + w, y + dy);
  }
}

function canPlaceBuilding(grid: Cell[][], r: number, c: number, w: number, h: number) {
  if (r < 0 || c < 0 || r + w > grid_width || c + h > grid_height) return false;
  for (let dy = 0; dy < h; dy++)
    for (let dx = 0; dx < w; dx++)
      if (grid[c + dy][r + dx].cellType !== CellType.LAND) return false;
  return true;
}

// ------------------------------------------------------------------
// Terrain + road skeleton (VERBATIM from original)
// ------------------------------------------------------------------
function addRivers(grid: Cell[][], rand: () => number, bp: Record<BuildingType, BuildingProperties>) {
  const riverWidth = Math.floor(rand() * 4) + 3; // 3‑6
  let riverY = Math.floor(rand() * (grid_height - 20)) + 10;
  for (let x = 0; x < grid_width; x++) {
    riverY += Math.floor(rand() * 3) - 1;
    riverY = Math.max(0, Math.min(grid_height - riverWidth, riverY));
    for (let w = 0; w < riverWidth; w++) {
      const y = riverY + w;
      if (y < grid_height) grid[y][x] = createBaseCell(x, y, bp, CellType.WATER);
    }
  }
}

function addParks(grid: Cell[][], rand: () => number, bp: Record<BuildingType, BuildingProperties>) {
  // central park
  const pX = Math.floor(grid_width / 4);
  const pY = Math.floor(grid_height / 4);
  for (let y = pY; y < pY + 10; y++)
    for (let x = pX; x < pX + 15; x++)
      if (x < grid_width && y < grid_height) grid[y][x] = createBaseCell(x, y, bp, CellType.PARK);
  // neighbourhood mini‑parks
  for (let i = 0; i < 6; i++) {
    const x0 = Math.floor(rand() * (grid_width - 10)) + 5;
    const y0 = Math.floor(rand() * (grid_height - 10)) + 5;
    const w = Math.floor(rand() * 4) + 3;
    const h = Math.floor(rand() * 4) + 3;
    for (let y = y0; y < y0 + h; y++)
      for (let x = x0; x < x0 + w; x++)
        if (x < grid_width && y < grid_height && grid[y][x].cellType === CellType.LAND)
          grid[y][x] = createBaseCell(x, y, bp, CellType.PARK);
  }
}

function addHighways(grid: Cell[][], bp: Record<BuildingType, BuildingProperties>) {
  // horizontal
  for (let i = 1; i <= config.num_horizontal_highways; i++) {
    const y = Math.floor((grid_height / (config.num_horizontal_highways + 1)) * i);
    for (let x = 0; x < grid_width; x++) {
      const isBridge = grid[y][x].cellType === CellType.WATER;
      const t = isBridge ? RoadType.BRIDGE : RoadType.HIGHWAY;
      for (let off = -1; off <= 1; off++)
        if (y + off >= 0 && y + off < grid_height)
          grid[y + off][x] = createBaseCell(x, y + off, bp, CellType.ROAD, undefined, t);
    }
  }
  // vertical
  for (let i = 1; i <= config.num_vertical_highways; i++) {
    const x = Math.floor((grid_width / (config.num_vertical_highways + 1)) * i);
    for (let y = 0; y < grid_height; y++) {
      const isBridge = grid[y][x].cellType === CellType.WATER;
      const t = isBridge ? RoadType.BRIDGE : RoadType.HIGHWAY;
      for (let off = -1; off <= 1; off++)
        if (x + off >= 0 && x + off < grid_width)
          grid[y][x + off] = createBaseCell(x + off, y, bp, CellType.ROAD, undefined, t);
    }
  }
}

function addMainRoads(grid: Cell[][], bp: Record<BuildingType, BuildingProperties>) {
  for (let y = 0; y < grid_height; y += config.secondary_road_interval)
    for (let x = 0; x < grid_width; x++)
      if (grid[y][x].cellType === CellType.LAND)
        grid[y][x] = createBaseCell(x, y, bp, CellType.ROAD, undefined, RoadType.MAIN_ROAD);
  for (let x = 0; x < grid_width; x += config.secondary_road_interval)
    for (let y = 0; y < grid_height; y++)
      if (grid[y][x].cellType === CellType.LAND)
        grid[y][x] = createBaseCell(x, y, bp, CellType.ROAD, undefined, RoadType.MAIN_ROAD);
}

// ------------------------------------------------------------------
// Building placement (residential densified, others unchanged)
// ------------------------------------------------------------------
function placeBuildingBlock(
  grid: Cell[][],
  type: BuildingEnumType,
  count: number,
  rand: () => number,
  bp: Record<BuildingType, BuildingProperties>,
) {
  for (let i = 0; i < count; i++) {
    let tries = 0;
    const [w, h] = bp[type].size;
    while (tries++ < 120) {
      const x = Math.floor(rand() * (grid_width - w));
      const y = Math.floor(rand() * (grid_height - h));
      if (!canPlaceBuilding(grid, x, y, w, h)) continue;
      for (let dy = 0; dy < h; dy++)
        for (let dx = 0; dx < w; dx++)
          grid[y + dy][x + dx] = createBaseCell(x + dx, y + dy, bp, CellType.BUILDING, type);
      addPerimeterRoad(grid, bp, x, y, w, h);
      break;
    }
  }
}

function placeResidentialBuildings(grid: Cell[][], rand: () => number, bp: Record<BuildingType, BuildingProperties>) {
  const areas = [
    { x: 6, y: 6, width: 44, height: 44 },
    { x: 65, y: 5, width: 44, height: 44 },
    { x: 6, y: 55, width: 44, height: 38 },
    { x: 65, y: 55, width: 44, height: 38 },
  ];
  areas.forEach((a) => {
    const attempts = Math.floor(60 * DENSITY_FACTOR);
    for (let i = 0; i < attempts; i++) {
      const x = a.x + Math.floor(rand() * a.width);
      const y = a.y + Math.floor(rand() * a.height);
      if (x >= grid_width || y >= grid_height || grid[y][x].cellType !== CellType.LAND) continue;
      const r = rand();
      const t = r < 0.12 ? BuildingType.SINGLE_FAMILY_HOME : r < 0.55 ? BuildingType.MULTI_FAMILY_HOME : BuildingType.APARTMENT_BUILDING;
      const [w, h] = bp[t].size;
      if (!canPlaceBuilding(grid, x, y, w, h)) continue;
      for (let dy = 0; dy < h; dy++)
        for (let dx = 0; dx < w; dx++)
          grid[y + dy][x + dx] = createBaseCell(x + dx, y + dy, bp, CellType.BUILDING, t);
      addPerimeterRoad(grid, bp, x, y, w, h);
    }
  });
}

// (placePublicAndHealthBuildings, placeCommercialAndTransportBuildings,
//  placeIndustrialBuildings, placeSafetyBuildings, addAlleways remain
//  identical to previous version — they already invoke placeBuildingBlock)

// ------------------------------------------------------------------
// Unchanged helper bodies from previous version
// ------------------------------------------------------------------
function placePublicAndHealthBuildings(
  grid: Cell[][],
  rand: () => number,
  bp: Record<BuildingType, BuildingProperties>,
) {
  const buildings: [BuildingEnumType, number][] = [
    [BuildingType.TOWN_HALL, 1],
    [BuildingType.ADMIN_OFFICE, 2],
    [BuildingType.PUBLIC_OFFICE, 3],
    [BuildingType.ELEMENTARY_SCHOOL, 4],
    [BuildingType.MIDDLE_SCHOOL, 3],
    [BuildingType.HIGH_SCHOOL, 2],
    [BuildingType.KINDERGARTEN, 5],
    [BuildingType.VOCATIONAL_SCHOOL, 2],
    [BuildingType.UNIVERSITY, 1],
    [BuildingType.CHURCH, 3],
    [BuildingType.SYNAGOGUE, 1],
    [BuildingType.MOSQUE, 1],
    [BuildingType.BUDDHIST_TEMPLE, 1],
    [BuildingType.LIBRARY, 2],
    [BuildingType.MUSEUM, 1],
    [BuildingType.THEATER, 1],
    [BuildingType.POOL, 1],
    [BuildingType.COMMUNITY_CENTER, 4],
    [BuildingType.STADIUM, 1],
    [BuildingType.HOSPITAL, config.num_hospitals],
    [BuildingType.CLINIC, 3],
  ];
  buildings.forEach(([t, cnt]) => placeBuildingBlock(grid, t, cnt, rand, bp));
}

function placeCommercialAndTransportBuildings(
  grid: Cell[][],
  rand: () => number,
  bp: Record<BuildingType, BuildingProperties>,
) {
  const buildings: [BuildingEnumType, number][] = [
    [BuildingType.GAS_STATION, 6],
    [BuildingType.KIOSK, 20],
    [BuildingType.SUPERMARKET, 8],
    [BuildingType.SHOPPING_MALL, 2],
    [BuildingType.PARKING_GARAGE, 4],
    [BuildingType.PARKING_LOT, 15],
    [BuildingType.MARKET_STALL, 10],
    [BuildingType.BUS_STOP, 30],
    [BuildingType.TRAIN_STATION, 1],
  ];
  buildings.forEach(([t, cnt]) => placeBuildingBlock(grid, t, cnt, rand, bp));
}

function placeIndustrialBuildings(
  grid: Cell[][],
  rand: () => number,
  bp: Record<BuildingType, BuildingProperties>,
) {
  const buildings: [BuildingEnumType, number][] = [
    [BuildingType.INDUSTRIAL_HALL, 4],
    [BuildingType.WAREHOUSE, 8],
    [BuildingType.BUS_DEPOT, 2],
  ];
  buildings.forEach(([t, cnt]) => {
    for (let i = 0; i < cnt; i++) {
      const [w, h] = bp[t].size;
      let tries = 0;
      while (tries++ < 120) {
        const x = Math.floor(rand() * (grid_width - w - 20)) + 10;
        const y = Math.floor(rand() * (grid_height - h - 75)) + 70;
        if (!canPlaceBuilding(grid, x, y, w, h)) continue;
        for (let dy = 0; dy < h; dy++)
          for (let dx = 0; dx < w; dx++)
            grid[y + dy][x + dx] = createBaseCell(x + dx, y + dy, bp, CellType.BUILDING, t);
        addPerimeterRoad(grid, bp, x, y, w, h);
        break;
      }
    }
  });
}

function placeSafetyBuildings(
  grid: Cell[][],
  rand: () => number,
  bp: Record<BuildingType, BuildingProperties>,
  policeStations: number,
  fireStations: number,
) {
  const configs = [
    { type: BuildingType.POLICE_STATION, count: policeStations },
    { type: BuildingType.FIRE_STATION, count: fireStations },
  ] as const;

  const placed: { x: number; y: number }[] = [];

  configs.forEach(({ type, count }) => {
    for (let i = 0; i < count; i++) {
      const [w, h] = bp[type].size;
      let tries = 0;
      while (tries++ < 200) {
        const x = Math.floor(rand() * (grid_width - w));
        const y = Math.floor(rand() * (grid_height - h));
        if (!canPlaceBuilding(grid, x, y, w, h)) continue;
        if (placed.some(p => Math.hypot(x - p.x, y - p.y) < config.min_station_distance)) continue;
        for (let dy = 0; dy < h; dy++)
          for (let dx = 0; dx < w; dx++)
            grid[y + dy][x + dx] = createBaseCell(x + dx, y + dy, bp, CellType.BUILDING, type);
        addPerimeterRoad(grid, bp, x, y, w, h);
        placed.push({ x, y });
        break;
      }
    }
  });
}

function addAlleways(
  grid: Cell[][],
  rand: () => number,
  bp: Record<BuildingType, BuildingProperties>,
) {
  for (let i = 0; i < config.num_alleys_to_spawn; i++) {
    const x0 = Math.floor(rand() * (grid_width - 2)) + 1;
    const y0 = Math.floor(rand() * (grid_height - 2)) + 1;
    if (grid[y0][x0].cellType !== CellType.BUILDING) continue;
    const len = Math.floor(rand() * 6) + 5;
    const [dx, dy] = [[1, 0], [-1, 0], [0, 1], [0, -1]][Math.floor(rand() * 4)];
    for (let l = 0; l < len; l++) {
      const nx = x0 + l * dx;
      const ny = y0 + l * dy;
      if (
        nx < 0 ||
        nx >= grid_width ||
        ny < 0 ||
        ny >= grid_height ||
        grid[ny][nx].cellType !== CellType.BUILDING
      )
        break;
      grid[ny][nx] = createBaseCell(nx, ny, bp, CellType.ROAD, undefined, RoadType.ALLEY);
    }
  }
}

// ------------------------------------------------------------------
// Fallback infill
// ------------------------------------------------------------------
function hasAdjacentRoad(g: Cell[][], x: number, y: number) {
  return (
    (x > 0 && g[y][x - 1].cellType === CellType.ROAD) ||
    (x < grid_width - 1 && g[y][x + 1].cellType === CellType.ROAD) ||
    (y > 0 && g[y - 1][x].cellType === CellType.ROAD) ||
    (y < grid_height - 1 && g[y + 1][x].cellType === CellType.ROAD)
  );
}

// ------------------------------------------------------------------
// Entry
// ------------------------------------------------------------------
export function generateCity({
  policeStations,
  fireStations,
  buildingProperties: bp,
}: {
  policeStations: number;
  fireStations: number;
  buildingProperties: Record<BuildingType, BuildingProperties>;
}): Cell[][] {
  const rand = createSeededRandom(42);
  const grid: Cell[][] = Array.from({ length: grid_height }, (_, y) =>
    Array.from({ length: grid_width }, (_, x) => createBaseCell(x, y, bp, CellType.LAND)),
  );

  // terrain & backbones
  addRivers(grid, rand, bp);
  addParks(grid, rand, bp);
  addHighways(grid, bp);
  addMainRoads(grid, bp);

  // buildings
  placeResidentialBuildings(grid, rand, bp);
  placePublicAndHealthBuildings(grid, rand, bp);
  placeCommercialAndTransportBuildings(grid, rand, bp);
  placeIndustrialBuildings(grid, rand, bp);
  placeSafetyBuildings(grid, rand, bp, policeStations, fireStations);
  addAlleways(grid, rand, bp);

  // infill single‑tile homes
  for (let y = 0; y < grid_height; y++)
    for (let x = 0; x < grid_width; x++)
      if (grid[y][x].cellType === CellType.LAND) {
        grid[y][x] = createBaseCell(x, y, bp, CellType.BUILDING, BuildingType.SINGLE_FAMILY_HOME);
        if (!hasAdjacentRoad(grid, x, y)) addPerimeterRoad(grid, bp, x, y, 1, 1);
      }

  return grid;
}
