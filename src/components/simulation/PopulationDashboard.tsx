"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { Stats } from '@/types/simulation';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';

interface PopulationDashboardProps {
  stats: Stats;
}

const PopStatItem = ({ icon: Icon, value, label, iconClass }: { icon: React.ElementType, value: number, label: string, iconClass?: string }) => (
    <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/50 w-24 flex-shrink-0">
        <Icon className={cn("h-6 w-6", iconClass)} />
        <p className="text-xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground text-center">{label}</p>
    </div>
);

export function PopulationDashboard({ stats }: PopulationDashboardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Population</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap justify-center gap-2">
        <PopStatItem icon={Icons.civilian} value={stats.liveCivilians} label="Civilians" iconClass="text-green-400" />
        <PopStatItem icon={Icons.fire} value={stats.liveFirefighters} label="Firefighters" iconClass="text-red-400" />
        <PopStatItem icon={Icons.police} value={stats.livePolice} label="Police" iconClass="text-blue-400" />
        <PopStatItem icon={Icons.arsonist} value={stats.liveArsonists} label="Arsonists" iconClass="text-yellow-400" />
      </CardContent>
    </Card>
  );
}
