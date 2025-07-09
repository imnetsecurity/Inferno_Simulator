
"use client";

import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { config } from '@/lib/config';
import type { BuildingType as BuildingTypeEnum, BuildingProperties } from '@/types/simulation';
import { cn } from '@/lib/utils';
import { Icons } from '@/components/icons';

interface LegendItemProps {
  color: string;
  label: string;
  icon?: React.ElementType;
  iconClass?: string;
  onClick?: () => void;
}

const LegendItem: React.FC<LegendItemProps> = ({ color, label, icon: Icon, iconClass, onClick }) => {
  const content = (
      <>
        <div className="relative flex-shrink-0 w-4 h-4 rounded-sm border border-border" style={{ backgroundColor: color }}>
          {Icon && <Icon className={cn("absolute inset-0 w-full h-full p-px", iconClass)} />}
        </div>
        <span className="capitalize">{label.replace(/_/g, ' ').toLowerCase()}</span>
      </>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className="flex items-center gap-2 text-sm w-full text-left hover:bg-accent p-1 rounded-md transition-colors">
        {content}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm p-1">
      {content}
    </div>
  );
};


interface AgentStateLegendItemProps {
  className: string;
  label: string;
}

const AgentStateLegendItem: React.FC<AgentStateLegendItemProps> = ({ className, label }) => (
  <div className="flex items-center gap-2 text-sm py-1">
    <div className={cn("w-5 h-5 rounded-full border-2 bg-transparent", className)} />
    <span>{label}</span>
  </div>
);

const terrainColors = [
  { label: 'Road', color: config.color_road },
  { label: 'Park', color: config.color_park },
  { label: 'Water', color: config.color_water },
  { label: 'Bridge', color: config.color_bridge },
  { label: 'Alley', color: config.color_alley },
  { label: 'Burnt Out', color: 'rgb(50, 50, 50)', icon: Icons.burntOut, iconClass: 'text-white/50' },
];

const agentStates = [
  { label: 'Working or commuting', className: 'border-sky-500' },
  { label: 'At home or returning', className: 'border-green-500' },
  { label: 'Shopping or errands', className: 'border-purple-500' },
  { label: 'Responding (Police/Fire)', className: 'border-accent animate-pulse' },
  { label: 'Fleeing danger', className: 'border-destructive animate-pulse' },
];

interface LegendPanelProps {
  onSelectBuilding: (buildingType: BuildingTypeEnum) => void;
  buildingProperties: Record<BuildingTypeEnum, BuildingProperties>;
}


export function LegendPanel({ onSelectBuilding, buildingProperties }: LegendPanelProps) {
  const buildingEntries = Object.entries(buildingProperties) as [BuildingTypeEnum, BuildingProperties][];

  return (
    <Card>
      <CardContent className="p-0">
        <Accordion type="multiple" className="w-full" defaultValue={['terrain', 'buildings']}>
          <AccordionItem value="terrain" className="px-4">
            <AccordionTrigger>Terrain & Colors</AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-2 gap-2">
                {terrainColors.map(item => <LegendItem key={item.label} {...item} />)}
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="buildings" className="px-4">
            <AccordionTrigger>Building Types (Click to edit)</AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto pr-2">
                {buildingEntries.map(([type, props]) => (
                  <LegendItem 
                    key={type} 
                    color={props.color} 
                    label={type} 
                    onClick={() => onSelectBuilding(type)}
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="agent-states" className="border-b-0 px-4">
            <AccordionTrigger>Agent State Indicators</AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-1">
                {agentStates.map(item => <AgentStateLegendItem key={item.label} {...item} />)}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
