
"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { Stats, ArsonistProfile } from '@/types/simulation';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { ARSONIST_PROFILES } from '@/lib/config';

interface StatsDashboardProps {
  stats: Stats;
}

const StatItem = ({ icon: Icon, value, label, iconClass }: { icon: React.ElementType, value: number, label: string, iconClass?: string }) => (
    <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/50 w-24 flex-shrink-0">
        <Icon className={cn("h-6 w-6", iconClass)} />
        <p className="text-xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground text-center">{label}</p>
    </div>
);


export function StatsDashboard({ stats }: StatsDashboardProps) {
  const hasFiresByProfile = stats.firesByProfile && Object.keys(stats.firesByProfile).length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Statistics</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap justify-center gap-2">
        <StatItem icon={Icons.fire} value={stats.fires} label="Active Fires" iconClass="text-accent" />
        <StatItem icon={Icons.extinguished} value={Math.floor(stats.firesExtinguished / 2) } label="Extinguished" iconClass="text-green-500" />
        <StatItem icon={Icons.arsonist} value={stats.casualties} label="Casualties" iconClass="text-destructive" />
        <StatItem icon={Icons.industrial} value={Math.floor(stats.buildingsDestroyed / 2)} label="Destroyed" iconClass="text-gray-400" />
        <StatItem icon={Icons.apprehended} value={stats.arsonistsApprehended} label="Apprehended" iconClass="text-blue-400" />
        <StatItem icon={Icons.trapped} value={stats.citizensTrapped} label="Trapped" iconClass="text-yellow-500" />
      </CardContent>

      {/* {hasFiresByProfile && (
        <>
          <Separator className="my-2 mx-4" />
          <CardContent className="flex flex-col gap-2 pt-4 px-4">
            <h4 className="text-sm font-medium text-center text-foreground">Fires by Arsonist Profile</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {Object.entries(stats.firesByProfile).map(([profile, count]) => (
                <li key={profile} className="flex justify-between items-center bg-muted/50 p-2 rounded-md">
                  <span>{ARSONIST_PROFILES[profile as ArsonistProfile]?.name || profile}</span>
                  <span className="font-mono font-bold text-foreground">{count}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </>
      )} */}
    </Card>
  );
}
