
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { SidePanel } from '@/components/simulation/SidePanel';
import { ControlBar } from '@/components/simulation/ControlBar';
import { CityGrid } from '@/components/simulation/CityGrid';
import { useSimulation } from '@/hooks/use-simulation';
import { TooltipProvider } from '@/components/ui/tooltip';
import { config, BUILDING_PROPERTIES, ARSONIST_PROFILES } from '@/lib/config';
import type { Scenario, AgentCounts, ArsonistProfile, BuildingType, ArsonistConfiguration } from '@/types/simulation';
import { EndSummaryDialog } from '@/components/simulation/EndSummaryDialog';
import { BuildingEditorDialog } from '@/components/simulation/BuildingEditorDialog';
import type { BuildingProperties } from '@/lib/config';

// Helper to initialize the arsonist configuration from the defaults in config.ts
const initializeArsonistConfig = (): ArsonistConfiguration => {
  const initialConfig: ArsonistConfiguration = {};
  for (const key in ARSONIST_PROFILES) {
      const profileKey = key as ArsonistProfile;
      initialConfig[profileKey] = {
          count: 0,
          maxFires: ARSONIST_PROFILES[profileKey].maxFires,
      };
  }
  // Set some defaults for a typical scenario
  if (initialConfig.VANDAL) initialConfig.VANDAL.count = 2;
  if (initialConfig.GRIFTER) initialConfig.GRIFTER.count = 1;
  if (initialConfig.PYROMANIAC) initialConfig.PYROMANIAC.count = 1;

  return initialConfig;
};


export default function InfernoSimPage() {
  const [scenario, setScenario] = useState<Scenario>(config.scenario);
  const [agentCounts, setAgentCounts] = useState<AgentCounts>({
    fireStations: 2,
    policeStations: 3,
    firefighter: 12,
    police: 12,
    civilian: 100,
    arsonist: initializeArsonistConfig(),
  });
  const [resetTrigger, setResetTrigger] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [buildingProperties, setBuildingProperties] = useState<Record<BuildingType, BuildingProperties>>(BUILDING_PROPERTIES);
  const [editingBuilding, setEditingBuilding] = useState<BuildingType | null>(null);
  const [simulationCycle, setSimulationCycle] = useState(7); // Default to 7 days


  const handleEnd = () => {
    if (!isPaused) {
      togglePause();
    }
    setShowSummary(true);
  };

  const handleReset = () => {
    setShowSummary(false);
    setResetTrigger(t => t + 1);
  };

  const handleCycleChange = (cycle: number) => {
    setSimulationCycle(cycle);
    handleReset();
  };

  const simulationAgentCounts = useMemo(() => {
    return {
      ...agentCounts,
      arsonist: {
        profiles: Object.entries(agentCounts.arsonist).flatMap(([profile, config]) => 
            Array(config.count).fill(profile as ArsonistProfile)
        )
      }
    };
  }, [agentCounts]);

  const {
    grid,
    agents,
    stats,
    events,
    time,
    isPaused,
    speed,
    congestion,
    togglePause,
    setSpeed,
  } = useSimulation({ 
    scenario, 
    agentCounts: simulationAgentCounts, 
    arsonistConfig: agentCounts.arsonist,
    resetTrigger,
    onEndSimulation: handleEnd,
    buildingProperties,
    simulationCycle,
  });

  const handleScenarioChange = (newScenario: Scenario) => {
    setScenario(newScenario);
  }

  const handleStationCountChange = (type: 'fireStations' | 'policeStations', count: number) => {
    if (isNaN(count) || count < 0) return;

    if (type === 'fireStations') {
      setAgentCounts(prev => ({
        ...prev,
        fireStations: count,
        firefighter: count * 6, // Each station hosts 6 firefighters
      }));
    } else if (type === 'policeStations') {
      setAgentCounts(prev => ({
        ...prev,
        policeStations: count,
        police: count * 4, // Each station hosts 4 officers
      }));
    }
  };

  const handleCivilianCountChange = (count: number) => {
    if (isNaN(count) || count < 0) return;
    setAgentCounts(prev => ({ ...prev, civilian: count }));
  };

  const handleArsonistConfigChange = (profile: ArsonistProfile, key: 'count' | 'maxFires', value: number) => {
    if (isNaN(value) || value < 0) return;
    
    setAgentCounts(prev => {
        const newArsonistConfig = { ...prev.arsonist };
        newArsonistConfig[profile] = {
            ...newArsonistConfig[profile],
            [key]: value
        };
        return {
            ...prev,
            arsonist: newArsonistConfig,
        };
    });
  };

  const handleSaveBuilding = (buildingType: BuildingType, newProperties: BuildingProperties) => {
    setBuildingProperties(prev => ({
      ...prev,
      [buildingType]: newProperties,
    }));
  };

  return (
    <TooltipProvider>
      <main className="flex h-screen w-screen bg-background text-foreground overflow-hidden">
        <div className="flex-1 flex flex-col">
          <ControlBar
            isPaused={isPaused}
            speed={speed}
            time={time}
            congestion={congestion}
            onTogglePause={togglePause}
            onSetSpeed={setSpeed}
            onReset={handleReset}
            onEnd={handleEnd}
            simulationCycle={simulationCycle}
            onCycleChange={handleCycleChange}
          />
          <CityGrid 
            grid={grid} 
            agents={agents}
            buildingProperties={buildingProperties}
          />
        </div>
        <SidePanel 
          stats={stats} 
          events={events} 
          scenario={scenario} 
          onScenarioChange={handleScenarioChange}
          agentCounts={agentCounts}
          onStationCountChange={handleStationCountChange}
          onCivilianCountChange={handleCivilianCountChange}
          onArsonistConfigChange={handleArsonistConfigChange}
          onSelectBuilding={setEditingBuilding}
          buildingProperties={buildingProperties}
          grid={grid}
        />
      </main>
      <EndSummaryDialog
        isOpen={showSummary}
        onClose={() => setShowSummary(false)}
        onReset={handleReset}
        stats={stats}
        time={time}
      />
      <BuildingEditorDialog
        isOpen={!!editingBuilding}
        onClose={() => setEditingBuilding(null)}
        onSave={handleSaveBuilding}
        buildingType={editingBuilding}
        properties={editingBuilding ? buildingProperties[editingBuilding] : null}
      />
    </TooltipProvider>
  );
}
