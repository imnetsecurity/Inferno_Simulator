
"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { config } from '@/lib/config';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';

interface ControlBarProps {
  isPaused: boolean;
  speed: keyof typeof config.SIMULATION_SPEEDS;
  time: number;
  congestion: number;
  onTogglePause: () => void;
  onSetSpeed: (speed: keyof typeof config.SIMULATION_SPEEDS) => void;
  onReset: () => void;
  onEnd: () => void;
  simulationCycle: number;
  onCycleChange: (cycle: number) => void;
}

const speedConfig: Record<string, { label: string; tooltip: string }> = {
  '1x': { label: '1x', tooltip: 'Normal Speed (15 sim minutes / sec)' },
  '2x': { label: '2x', tooltip: '2x Speed (30 sim minutes / sec)' },
  '4x': { label: '4x', tooltip: '4x Speed (1 sim hours / sec)' },
};

export function ControlBar({ isPaused, speed, time, congestion, onTogglePause, onSetSpeed, onReset, onEnd, simulationCycle, onCycleChange }: ControlBarProps) {
  const speeds = Object.keys(config.SIMULATION_SPEEDS) as (keyof typeof config.SIMULATION_SPEEDS)[];

  const congestionPercentage = Math.round((1 - congestion) * 100);

  return (
    <div className="flex justify-center p-2 border-b bg-background z-10">
      <Card>
        <CardContent className="p-2 flex items-center gap-4">
          {/* Time Display */}
          <div className="text-sm font-mono bg-muted/50 px-3 py-1.5 rounded-md min-w-[120px] text-center">
            Day {Math.floor(time / 96) + 1} - {String(Math.floor((time % 96) / 4)).padStart(2, '0')}:{String((time % 4) * 15).padStart(2, '0')}
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Core Controls */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onReset}>
                  <Icons.reset />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reset Simulation</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onTogglePause}>
                  {isPaused ? <Icons.play /> : <Icons.pause />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isPaused ? 'Start' : 'Pause'}</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onEnd} disabled={isPaused}>
                  <Icons.end />
                </Button>
              </TooltipTrigger>
              <TooltipContent>End Simulation</TooltipContent>
            </Tooltip>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Duration Control */}
           <div className="flex flex-col items-start gap-1">
            <Label htmlFor="sim-cycle" className="text-xs text-muted-foreground px-1">Duration</Label>
            <Select value={String(simulationCycle)} onValueChange={(value) => onCycleChange(Number(value))}>
              <SelectTrigger id="sim-cycle" className="w-28 h-8 text-xs">
                <SelectValue placeholder="Select Cycle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Day</SelectItem>
                <SelectItem value="7">7 Days</SelectItem>
                <SelectItem value="30">30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Speed Controls */}
          <div className="flex flex-col items-start gap-1">
            <Label className="text-xs text-muted-foreground px-1">Speed</Label>
            <div className="flex items-center gap-1 bg-muted/50 rounded-md p-1">
              {speeds.map(s => (
                <Tooltip key={s}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={speed === s ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => onSetSpeed(s)}
                      className="h-7 w-auto px-3 text-xs"
                    >
                      {speedConfig[s]?.label || s}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{speedConfig[s]?.tooltip || `Set speed to ${s}`}</TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>

          <Separator orientation="vertical" className="h-6" />

        </CardContent>
      </Card>
    </div>
  );
}
