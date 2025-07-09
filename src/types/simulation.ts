

import type { BuildingType as BuildingTypeEnum, Scenario, RoadType as RoadEnumType, CellType as CellTypeEnum, ArsonistProfile as ArsonistProfileEnum, BuildingProperties as BuildingPropertiesType } from '@/lib/config';

export type { Scenario };
export type BuildingType = BuildingTypeEnum;
export type BuildingProperties = BuildingPropertiesType;
export type AgentType = 'firefighter' | 'police' | 'arsonist' | 'civilian';

export type ArsonistConfiguration = {
  [key in ArsonistProfile]: {
    count: number;
    maxFires: number;
  };
};

export type AgentCounts = {
  firefighter: number;
  police: number;
  fireStations: number;
  policeStations: number;
  arsonist: ArsonistConfiguration;
  civilian: number;
};
export type CellType = CellTypeEnum;
export type RoadType = RoadEnumType;
export type ArsonistProfile = ArsonistProfileEnum;

export interface Cell {
  id: string;
  x: number;
  y: number;
  cellType: CellType;
  buildingType?: BuildingType;
  roadType?: RoadType;
  flammability: number;
  arsonRisk: number;
  motives?: string[];
  fireLevel: number; // 0 = no fire, 1-10 = intensity
  isBurntOut: boolean;
  surveillanceLevel?: number;
  dynamicSurveillance: number;
  capacity?: number;
  fireIgnitionTime: number | null;
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

export type AgentState = 
  // Generic
  | 'idle' 
  | 'patrolling' 
  | 'fleeing'
  // Firefighter
  | 'responding' 
  | 'extinguishing' 
  | 'returning'
  // Arsonist
  | 'apprehended'
  | 'wandering_limit_reached'
  // Civilian
  | 'going_to_work'
  | 'working'
  | 'going_home'
  | 'at_home'
  | 'seeking_shelter'
  | 'shopping'
  // Police
  | 'apprehending';

export type RoutineType = 'REGULAR_COMMUTER' | 'STAY_AT_HOME' | 'NIGHT_SHIFT';

export interface Agent {
  id: string;
  type: AgentType;
  x: number; // Can be float for smooth movement
  y: number; // Can be float for smooth movement
  station?: { x: number; y: number }; // Home base for police/firefighters
  home?: { x: number; y: number }; // Civilian's home
  workplace?: { x: number; y: number }; // Civilian's workplace
  target: { id?: string; x: number; y: number } | null;
  state: AgentState;
  path: { x: number; y: number }[];
  state_timer?: number; // Generic timer for states like 'working' or 'at_home'
  routineType?: RoutineType;
  isTrapped?: boolean;

  // Firefighter specific
  extinguishedFires?: number;

  // Arsonist specific
  cooldown?: number;
  profile?: ArsonistProfile;
  arsonCount?: number;
  revengeTargetId?: string;
}

export interface HistoricalStat {
  time: number;
  fires: number;
  casualties: number;
  buildingsDestroyed: number;
  arsonistsApprehended: number;
}

export interface Stats {
  fires: number;
  casualties: number;
  buildingsDestroyed: number;
  arsonistsApprehended: number;
  citizensTrapped: number;
  firesExtinguished: number;
  liveFirefighters: number;
  livePolice: number;
  liveCivilians: number;
  liveArsonists: number;
  firesByProfile: Partial<Record<ArsonistProfile, number>>;
  history: HistoricalStat[];
}

export interface SimEvent {
  id: string;
  timestamp: number;
  message: string;
}