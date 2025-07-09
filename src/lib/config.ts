
export enum Scenario {
    NORMAL = "NORMAL",
    RIOT = "RIOT",
    LARGE_EVENT = "LARGE_EVENT",
    CRISIS = "CRISIS",
}

export enum CellType {
    LAND = "LAND",
    ROAD = "ROAD",
    PARK = "PARK",
    WATER = "WATER",
    BUILDING = "BUILDING",
    STREET = "STREET"
}

export const BuildingType = {
    // Öffentliche Gebäude
    TOWN_HALL: "TOWN_HALL",
    ADMIN_OFFICE: "ADMIN_OFFICE",
    PUBLIC_OFFICE: "PUBLIC_OFFICE",
    ELEMENTARY_SCHOOL: "ELEMENTARY_SCHOOL",
    MIDDLE_SCHOOL: "MIDDLE_SCHOOL",
    HIGH_SCHOOL: "HIGH_SCHOOL",
    VOCATIONAL_SCHOOL: "VOCATIONAL_SCHOOL",
    UNIVERSITY: "UNIVERSITY",
    KINDERGARTEN: "KINDERGARTEN",
    CHURCH: "CHURCH",
    SYNAGOGUE: "SYNAGOGUE",
    MOSQUE: "MOSQUE",
    BUDDHIST_TEMPLE: "BUDDHIST_TEMPLE",
    STADIUM: "STADIUM",
    LIBRARY: "LIBRARY",
    MUSEUM: "MUSEUM",
    THEATER: "THEATER",
    POOL: "POOL",
    COMMUNITY_CENTER: "COMMUNITY_CENTER",

    // Wohngebäude
    SINGLE_FAMILY_HOME: "SINGLE_FAMILY_HOME",
    MULTI_FAMILY_HOME: "MULTI_FAMILY_HOME",
    APARTMENT_BUILDING: "APARTMENT_BUILDING",

    // Kommerzielle Gebäude
    GAS_STATION: "GAS_STATION",
    KIOSK: "KIOSK",
    SUPERMARKET: "SUPERMARKET",
    SHOPPING_MALL: "SHOPPING_MALL",
    PARKING_GARAGE: "PARKING_GARAGE",
    PARKING_LOT: "PARKING_LOT",
    MARKET_STALL: "MARKET_STALL",

    // Gesundheitseinrichtungen
    HOSPITAL: "HOSPITAL",
    CLINIC: "CLINIC",

    // Sicherheitseinrichtungen
    POLICE_STATION: "POLICE_STATION",
    FIRE_STATION: "FIRE_STATION",

    // Verkehrseinrichtungen
    TRAIN_STATION: "TRAIN_STATION",
    BUS_DEPOT: "BUS_DEPOT",
    BUS_STOP: "BUS_STOP",

    // Industrie
    INDUSTRIAL_HALL: "INDUSTRIAL_HALL",
    WAREHOUSE: "WAREHOUSE",
} as const;

export type BuildingType = typeof BuildingType[keyof typeof BuildingType];

export enum RoadType {
    HIGHWAY = "HIGHWAY",
    MAIN_ROAD = "MAIN_ROAD",
    ALLEY = "ALLEY",
    BRIDGE = "BRIDGE",
    STREET = "STREET"
}

export interface BuildingProperties {
    size: [number, number];
    color: string;
    arsonRisk: number;
    flammability: number;
    motives: string[];
    surveillanceLevel?: number;
    capacity?: number;
    // Positive Controls
    hasCCTV?: boolean;
    hasFireAlarm?: boolean;
    hasSprinklerSystem?: boolean;
    hasSecurityPatrol?: boolean;
    isCommunityWatched?: boolean;
    // Negative Controls
    isAbandoned?: boolean;
    hasPoorMaintenance?: boolean;
    hasGraffiti?: boolean;
    isIsolated?: boolean;
    isControversial?: boolean;
}

export const CONTROL_IMPACTS = {
  hasCCTV: { risk: -0.1, flammability: 0 },
  hasFireAlarm: { risk: -0.05, flammability: 0 },
  hasSprinklerSystem: { risk: 0, flammability: -0.3 },
  hasSecurityPatrol: { risk: -0.3, flammability: 0 },
  isCommunityWatched: { risk: -0.05, flammability: 0 },
  isAbandoned: { risk: 0.2, flammability: 0.4 },
  hasPoorMaintenance: { risk: 0.05, flammability: 0.2 },
  hasGraffiti: { risk: 0.1, flammability: 0 },
  isIsolated: { risk: 0.15, flammability: 0 },
  isControversial: { risk: 0.2, flammability: 0 },
};

const defaultControls = {
    hasCCTV: false,
    hasFireAlarm: false,
    hasSprinklerSystem: false,
    hasSecurityPatrol: false,
    isCommunityWatched: false,
    isAbandoned: false,
    hasPoorMaintenance: false,
    hasGraffiti: false,
    isIsolated: false,
    isControversial: false,
};


export const BUILDING_PROPERTIES: Record<BuildingType, BuildingProperties> = {
    [BuildingType.TOWN_HALL]: { size: [3, 2], color: "#444444", arsonRisk: 0.07, flammability: 0.6, motives: ["Proteste", "Rache an Behörden", "Unruhen"], surveillanceLevel: 0.8, capacity: 50, ...defaultControls, isControversial: true, hasCCTV: true },
    [BuildingType.ADMIN_OFFICE]: { size: [2, 2], color: "#C0C0C0", arsonRisk: 0.06, flammability: 0.5, motives: ["Streit um Entscheidungen", "Frustration"], surveillanceLevel: 0.6, capacity: 40, ...defaultControls, hasCCTV: true },
    [BuildingType.PUBLIC_OFFICE]: { size: [2, 2], color: "#B19470", arsonRisk: 0.05, flammability: 0.5, motives: ["Lange Wartezeit", "Eskalation am Amtsschalter"], surveillanceLevel: 0.5, capacity: 30, ...defaultControls, hasCCTV: true },
    [BuildingType.ELEMENTARY_SCHOOL]: { size: [3, 2], color: "#FFFACD", arsonRisk: 0.02, flammability: 0.4, motives: ["Jugendlicher Übermut", "Mutprobe"], surveillanceLevel: 0.3, capacity: 150, ...defaultControls },
    [BuildingType.MIDDLE_SCHOOL]: { size: [3, 2], color: "#B7E778", arsonRisk: 0.03, flammability: 0.5, motives: ["Cliquenstreit", "Mobbing", "Langeweile"], surveillanceLevel: 0.3, capacity: 200, ...defaultControls },
    [BuildingType.HIGH_SCHOOL]: { size: [3, 2], color: "#F8F6E3", arsonRisk: 0.02, flammability: 0.4, motives: ["Politische Schülergruppen", "Demonstrationen"], surveillanceLevel: 0.4, capacity: 250, ...defaultControls },
    [BuildingType.VOCATIONAL_SCHOOL]: { size: [3, 2], color: "#AD9273", arsonRisk: 0.03, flammability: 0.5, motives: ["Frust in der Ausbildung", "Gruppenzwang"], surveillanceLevel: 0.3, capacity: 100, ...defaultControls },
    [BuildingType.UNIVERSITY]: { size: [10, 8], color: "#81D8D0", arsonRisk: 0.03, flammability: 0.5, motives: ["Politische Gruppen", "Streiks"], surveillanceLevel: 0.5, capacity: 1000, ...defaultControls, hasCCTV: true },
    [BuildingType.KINDERGARTEN]: { size: [2, 2], color: "#FFC0CB", arsonRisk: 0.02, flammability: 0.4, motives: ["Jugendlicher Übermut", "Mutprobe"], surveillanceLevel: 0.2, capacity: 50, ...defaultControls },
    [BuildingType.CHURCH]: { size: [3, 2], color: "#FFD700", arsonRisk: 0.02, flammability: 0.4, motives: ["Religiöse Konflikte", "antireligiöse Motive"], surveillanceLevel: 0.2, capacity: 80, ...defaultControls },
    [BuildingType.SYNAGOGUE]: { size: [2, 2], color: "#D2B48C", arsonRisk: 0.03, flammability: 0.5, motives: ["Antisemitismus", "gesellschaftliche Spannungen"], surveillanceLevel: 0.7, capacity: 60, ...defaultControls, isControversial: true, hasCCTV: true },
    [BuildingType.MOSQUE]: { size: [1, 2], color: "#B87333", arsonRisk: 0.03, flammability: 0.5, motives: ["Islamfeindlichkeit", "Fremdenhass"], surveillanceLevel: 0.6, capacity: 100, ...defaultControls, isControversial: true, hasCCTV: true },
    [BuildingType.BUDDHIST_TEMPLE]: { size: [2, 2], color: "#4A2C18", arsonRisk: 0.01, flammability: 0.3, motives: ["Religiöse Intoleranz", "Jugendlicher Mutwille"], surveillanceLevel: 0.1, capacity: 40, ...defaultControls },
    [BuildingType.STADIUM]: { size: [8, 5], color: "#FF69B4", arsonRisk: 0.08, flammability: 0.7, motives: ["Fan-Rivalität", "Alkoholkonsum", "Großevents"], surveillanceLevel: 0.7, capacity: 5000, ...defaultControls, hasCCTV: true },
    [BuildingType.LIBRARY]: { size: [3, 2], color: "#FFBC6A", arsonRisk: 0.01, flammability: 0.3, motives: ["Wenig Kontrolle am Abend", "Frust mit Verwaltung"], surveillanceLevel: 0.4, capacity: 100, ...defaultControls },
    [BuildingType.MUSEUM]: { size: [5, 4], color: "#D4AF37", arsonRisk: 0.02, flammability: 0.4, motives: ["Politischer Protest", "Frust mit Ausstellungen"], surveillanceLevel: 0.7, capacity: 200, ...defaultControls, hasCCTV: true },
    [BuildingType.THEATER]: { size: [4, 4], color: "#757575", arsonRisk: 0.02, flammability: 0.4, motives: ["Künstlerische Proteste", "Publikumsreaktion"], surveillanceLevel: 0.6, capacity: 300, ...defaultControls, hasCCTV: true },
    [BuildingType.POOL]: { size: [6, 4], color: "#A3D2CA", arsonRisk: 0.01, flammability: 0.3, motives: ["Frustrierte Besucher", "Überfüllung"], surveillanceLevel: 0.2, capacity: 150, ...defaultControls },
    [BuildingType.COMMUNITY_CENTER]: { size: [2, 2], color: "#B5EAD7", arsonRisk: 0.03, flammability: 0.5, motives: ["Soziale Spannungen", "Cliquenbildung"], surveillanceLevel: 0.2, capacity: 50, ...defaultControls },
    [BuildingType.SINGLE_FAMILY_HOME]: { size: [1, 1], color: "#C2B280", arsonRisk: 0.02, flammability: 0.7, motives: ["Nachbarschaftskonflikte", "Scheidung", "Streit"], surveillanceLevel: 0.05, capacity: 4, ...defaultControls },
    [BuildingType.MULTI_FAMILY_HOME]: { size: [2, 2], color: "#6B4226", arsonRisk: 0.04, flammability: 0.8, motives: ["Nachbarschaftsstreit", "soziale Spannungen"], surveillanceLevel: 0.1, capacity: 8, ...defaultControls },
    [BuildingType.APARTMENT_BUILDING]: { size: [3, 3], color: "#E1C16E", arsonRisk: 0.05, flammability: 0.85, motives: ["Anonymität", "soziale Isolation"], surveillanceLevel: 0.2, capacity: 20, ...defaultControls },
    [BuildingType.GAS_STATION]: { size: [2, 2], color: "#111111", arsonRisk: 0.07, flammability: 0.9, motives: ["Sabotage", "Erpressung", "politisch motiviert"], surveillanceLevel: 0.8, capacity: 10, ...defaultControls, hasCCTV: true },
    [BuildingType.KIOSK]: { size: [1, 1], color: "#FFF700", arsonRisk: 0.04, flammability: 0.6, motives: ["Einbruch", "Überfall", "Gelegenheit"], surveillanceLevel: 0.3, capacity: 5, ...defaultControls },
    [BuildingType.SUPERMARKET]: { size: [3, 2], color: "#FFD800", arsonRisk: 0.05, flammability: 0.7, motives: ["Entlassungen", "Streiks", "Frust"], surveillanceLevel: 0.6, capacity: 100, ...defaultControls, hasCCTV: true },
    [BuildingType.SHOPPING_MALL]: { size: [6, 4], color: "#9932CC", arsonRisk: 0.06, flammability: 0.8, motives: ["Wirtschaftliche Probleme", "Demos"], surveillanceLevel: 0.75, capacity: 500, ...defaultControls, hasCCTV: true },
    [BuildingType.PARKING_GARAGE]: { size: [3, 3], color: "#36454F", arsonRisk: 0.03, flammability: 0.6, motives: ["Abgelegene Ecken", "wenig soziale Kontrolle"], surveillanceLevel: 0.4, capacity: 0, ...defaultControls, hasCCTV: true, isIsolated: true },
    [BuildingType.PARKING_LOT]: { size: [1, 2], color: "#BFC1A8", arsonRisk: 0.02, flammability: 0.4, motives: ["Nacht", "kaum Überwachung", "Konflikte"], surveillanceLevel: 0.1, capacity: 0, ...defaultControls, isIsolated: true },
    [BuildingType.MARKET_STALL]: { size: [1, 1], color: "#FFA07A", arsonRisk: 0.04, flammability: 0.5, motives: ["Frust", "finanzielle Probleme", "Nachtbetrieb"], surveillanceLevel: 0.1, capacity: 3, ...defaultControls },
    [BuildingType.HOSPITAL]: { size: [8, 4], color: "#F5F5DC", arsonRisk: 0.02, flammability: 0.4, motives: ["Patientenunzufriedenheit", "Besucherkonflikt"], surveillanceLevel: 0.7, capacity: 600, ...defaultControls, hasCCTV: true },
    [BuildingType.CLINIC]: { size: [2, 2], color: "#CAE1D9", arsonRisk: 0.02, flammability: 0.4, motives: ["Frust nach Diagnose", "Streit"], surveillanceLevel: 0.6, capacity: 50, ...defaultControls, hasCCTV: true },
    [BuildingType.POLICE_STATION]: { size: [3, 2], color: "#A19D94", arsonRisk: 0.05, flammability: 0.3, motives: ["Hass auf Polizei", "Festnahme-Situationen"], surveillanceLevel: 0.95, capacity: 50, ...defaultControls, hasCCTV: true, hasSecurityPatrol: true, isControversial: true },
    [BuildingType.FIRE_STATION]: { size: [3, 2], color: "#D38312", arsonRisk: 0.01, flammability: 0.1, motives: ["Kaum relevant, selten gezielt"], surveillanceLevel: 0.9, capacity: 30, ...defaultControls, hasCCTV: true },
    [BuildingType.TRAIN_STATION]: { size: [12, 6], color: "#7C0A02", arsonRisk: 0.07, flammability: 0.7, motives: ["Demonstrationen", "Protestzüge", "Menschenmengen"], surveillanceLevel: 0.85, capacity: 1500, ...defaultControls, hasCCTV: true },
    [BuildingType.BUS_DEPOT]: { size: [4, 3], color: "#B2DFEE", arsonRisk: 0.03, flammability: 0.5, motives: ["Frustierter Busfahrer", "Sabotage"], surveillanceLevel: 0.5, capacity: 60, ...defaultControls },
    [BuildingType.BUS_STOP]: { size: [1, 1], color: "#C0C0C0", arsonRisk: 0.02, flammability: 0.3, motives: ["Jugendliche", "Vandalismus"], surveillanceLevel: 0.1, capacity: 15, ...defaultControls },
    [BuildingType.INDUSTRIAL_HALL]: { size: [10, 6], color: "#4B0082", arsonRisk: 0.08, flammability: 0.9, motives: ["Sabotage", "Arbeitslosigkeit", "Streik"], surveillanceLevel: 0.4, capacity: 80, ...defaultControls, isIsolated: true },
    [BuildingType.WAREHOUSE]: { size: [2, 3], color: "#B2BEB5", arsonRisk: 0.05, flammability: 0.8, motives: ["Überlastung", "Frust bei Subunternehmern"], surveillanceLevel: 0.3, capacity: 20, ...defaultControls, isIsolated: true },
};

export enum ArsonistProfile {
    PROTESTER = 'PROTESTER',
    VANDAL = 'VANDAL',
    GRIFTER = 'GRIFTER',
    PYROMANIAC = 'PYROMANIAC',
}

export const ARSONIST_PROFILES: Record<ArsonistProfile, { name: string; description: string; targets?: BuildingType[], maxFires: number }> = {
    [ArsonistProfile.PYROMANIAC]: {
        name: 'Psychiatric',
        description: 'Has a pathological obsession with fire, setting fires randomly without a clear pattern. Can set unlimited fires.',
        maxFires: Infinity,
    },
    [ArsonistProfile.GRIFTER]: {
        name: 'Financial',
        description: 'Motivated by economic gain, such as insurance fraud. Typically commits arson only once.',
        targets: [BuildingType.SUPERMARKET, BuildingType.SHOPPING_MALL, BuildingType.WAREHOUSE, BuildingType.INDUSTRIAL_HALL, BuildingType.GAS_STATION],
        maxFires: 1,
    },
    [ArsonistProfile.PROTESTER]: {
        name: 'Protester',
        description: 'Targets political institutions or public infrastructure as part of a protest or civil unrest.',
        targets: [BuildingType.TOWN_HALL, BuildingType.ADMIN_OFFICE, BuildingType.PUBLIC_OFFICE, BuildingType.POLICE_STATION],
        maxFires: 1,
    },
    [ArsonistProfile.VANDAL]: {
        name: 'Vandal',
        description: 'Causes destruction for thrill or as an act of defiance, targeting public and commercial property.',
        targets: [
            BuildingType.ELEMENTARY_SCHOOL, BuildingType.MIDDLE_SCHOOL, BuildingType.HIGH_SCHOOL, 
            BuildingType.BUS_STOP, BuildingType.COMMUNITY_CENTER, BuildingType.KIOSK, 
            BuildingType.PARKING_LOT, BuildingType.PARKING_GARAGE, BuildingType.LIBRARY,
            BuildingType.THEATER, BuildingType.MUSEUM
        ],
        maxFires: 2,
    },
};

export const config = {
    scenario: Scenario.NORMAL,
    grid_width: 120,
    grid_height: 100,
    cell_size: 10,
    ui_height: 50,
    
    ticks_per_day: 96,

    num_vertical_highways: 3,
    num_horizontal_highways: 2,
    secondary_road_interval: 10,
    num_alleys_to_spawn: 30,
    num_hospitals: 2,
    min_station_distance: 30,
    
    police_surveillance_radius: 5,
    police_surveillance_bonus: 0.5,

    arson_base_probability_multiplier: 1.0,
    gewerbe_prob_in_downtown: 0.7,
    wohn_alt_prob_residential: 0.5,
    riot_transform_prob_multiplier: 25,
    civilian_to_arsonist_prob_base: 0.00002,

    // Police Patrol Configuration
    police_patrol_risk_radius: 10, // Radius for calculating area risk for patrolling
    police_patrol_scan_radius: 30, // Radius around police to scan for potential patrol destinations
    police_patrol_sample_locations: 20, // Number of locations to sample within scan radius
    police_patrol_risk_weight: 100, // Multiplier for area risk in patrol destination scoring
    police_patrol_random_weight: 5, // Multiplier for randomness in patrol destination scoring
    small_fire_extinguish_timer: 2, // Duration in ticks for extinguishing small fires
    agent_walk_speed: 65.0,
    agent_vehicle_speed: 375.0,

    color_road: "rgb(60, 60, 60)",
    color_street: "rgb(255, 255, 255)",
    color_alley: "rgb(40, 40, 40)",
    color_bridge: "rgb(139, 115, 85)",
    color_park: "rgb(34, 139, 34)",
    color_forest: "rgb(0, 100, 0)",
    color_water: "rgb(70, 130, 180)",
    color_fire: [
        "rgb(255, 204, 0)",
        "rgb(255, 128, 0)",
        "rgb(255, 0, 0)",
        "rgb(128, 0, 0)"
    ],
    color_smoke: "rgb(50, 50, 50)",
    
    ui_panel_color: "rgb(30, 30, 30)",
    arsonist_color: "rgb(255, 0, 255)",
    police_color: "rgb(0, 128, 255)",
    firefighter_color: "rgb(255, 105, 180)",
    civilian_color: "rgb(255, 255, 0)",
    ghost_opacity_valid: 120,
    ghost_opacity_invalid: 120,
    ghost_color_valid: "rgb(0, 255, 255)",
    ghost_color_invalid: "rgb(255, 0, 0)",
    
    SIMULATION_SPEEDS: {
      '1x': 1000,  // 1 tick / sec
      '2x':  500,  // 2 ticks / sec
      '4x':  250,  // 4 ticks / sec
    },
    FIRE_SPREAD_PROBABILITY: 0.15,
    FIRE_STATION_EXTINGUISH_RATE: 0.5,
    FIREFIGHTER_EXTINGUISH_RATE: 2.5
};

    

    











