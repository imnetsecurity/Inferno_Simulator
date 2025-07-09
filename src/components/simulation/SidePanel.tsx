
"use client";

import React from 'react';
import { StatsDashboard } from './StatsDashboard';
import { EventLog } from './EventLog';
import { LegendPanel } from './LegendPanel';
import type { Stats, SimEvent, Scenario, AgentCounts, ArsonistProfile, BuildingType, BuildingProperties, ArsonistConfiguration, Cell } from '@/types/simulation';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ARSONIST_PROFILES } from '@/lib/config';
import { PopulationDashboard } from './PopulationDashboard';
import { Icons } from '@/components/icons';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { HistoryChart } from './HistoryChart';
import { BuildingList } from './BuildingList';


interface SidePanelProps {
  stats: Stats;
  events: SimEvent[];
  scenario: Scenario;
  onScenarioChange: (scenario: Scenario) => void;
  agentCounts: AgentCounts;
  onStationCountChange: (type: 'fireStations' | 'policeStations', count: number) => void;
  onCivilianCountChange: (count: number) => void;
  onArsonistConfigChange: (profile: ArsonistProfile, key: 'count' | 'maxFires', value: number) => void;
  onSelectBuilding: (buildingType: BuildingType) => void;
  buildingProperties: Record<BuildingType, BuildingProperties>;
  grid: Cell[][];
}

export function SidePanel({ 
  stats, 
  events, 
  scenario, 
  onScenarioChange, 
  agentCounts, 
  onStationCountChange,
  onCivilianCountChange,
  onArsonistConfigChange, 
  onSelectBuilding, 
  buildingProperties,
  grid,
}: SidePanelProps) {
  const arsonistConfig = agentCounts.arsonist;

  return (
    <aside className="w-[350px] border-l bg-card/50 flex flex-col p-4 gap-4 overflow-y-auto">
        <h1 className="text-2xl font-headline font-bold text-primary text-center">InfernoSim</h1>
        <Separator/>
        
        <div className="flex flex-col gap-4">
            <div>
                <Label>Scenario</Label>
                <Select value={scenario} onValueChange={(value) => onScenarioChange(value as Scenario)}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Scenario" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="NORMAL">Normal</SelectItem>
                        <SelectItem value="RIOT">Riot</SelectItem>
                        <SelectItem value="LARGE_EVENT">Large Event</SelectItem>
                        <SelectItem value="CRISIS">Custom / Crisis</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            
            <Card>
                <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base">Agent Configuration</CardTitle>
                </CardHeader>
                <CardContent className="p-4 flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="agent-count-fireStations" className="flex justify-between items-center">
                          <span>Fire Stations</span>
                          <span className='text-xs text-muted-foreground'>({agentCounts.firefighter} total)</span>
                        </Label>
                        <Input 
                            id="agent-count-fireStations"
                            type="number"
                            value={agentCounts.fireStations}
                            onChange={(e) => onStationCountChange('fireStations', parseInt(e.target.value, 10))}
                            min="1"
                            max="50"
                        />
                      </div>
                      <div>
                        <Label htmlFor="agent-count-policeStations" className="flex justify-between items-center">
                          <span>Police Stations</span>
                           <span className='text-xs text-muted-foreground'>({agentCounts.police} total)</span>
                        </Label>
                        <Input 
                            id="agent-count-policeStations"
                            type="number"
                            value={agentCounts.policeStations}
                            onChange={(e) => onStationCountChange('policeStations', parseInt(e.target.value, 10))}
                            min="1"
                            max="50"
                        />
                      </div>
                    </div>
                     <div className="flex flex-col gap-2">
                        <Label htmlFor="agent-count-civilian">Civilians</Label>
                        <Input 
                            id="agent-count-civilian"
                            type="number"
                            value={agentCounts.civilian}
                            onChange={(e) => onCivilianCountChange(parseInt(e.target.value, 10))}
                            min="0"
                            max="500"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base">Arsonist Configuration</CardTitle>
                </CardHeader>
                <CardContent className="p-4 flex flex-col gap-4">
                  {Object.entries(ARSONIST_PROFILES).map(([key, profile]) => {
                    const profileKey = key as ArsonistProfile;
                    const Icon = Icons[profileKey as keyof typeof Icons];
                    const config = arsonistConfig[profileKey];
                    if (!config) return null;

                    return (
                      <div key={key} className="p-3 rounded-md border bg-muted/50">
                        <div className="flex items-center gap-2 mb-2">
                          {Icon && <Icon className="h-5 w-5 text-destructive" />}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <h4 className="font-semibold text-foreground">{profile.name}</h4>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">{profile.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor={`arsonist-count-${key}`} className="text-xs">Agents</Label>
                            <Input
                              id={`arsonist-count-${key}`}
                              type="number"
                              value={config.count}
                              onChange={(e) => onArsonistConfigChange(profileKey, 'count', parseInt(e.target.value, 10))}
                              min="0"
                              max="50"
                            />
                          </div>
                           <div>
                            <Label htmlFor={`arsonist-maxFires-${key}`} className="text-xs">Max Fires</Label>
                            <Input
                              id={`arsonist-maxFires-${key}`}
                              type="number"
                              value={config.maxFires === Infinity ? '' : config.maxFires}
                              placeholder="∞"
                              onChange={(e) => onArsonistConfigChange(profileKey, 'maxFires', e.target.value === '' ? Infinity : parseInt(e.target.value, 10))}
                              min="0"
                              max="99"
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
            </Card>
        </div>
        
        <Separator/>
        <LegendPanel onSelectBuilding={onSelectBuilding} buildingProperties={buildingProperties} />
        <BuildingList grid={grid} />
        <Separator/>
        <StatsDashboard stats={stats} />
         {/*  <HistoryChart history={stats.history} /> */}
        <PopulationDashboard stats={stats} />
        <EventLog events={events} />
    </aside>
  );
}
