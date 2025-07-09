
"use client";

import React, { useMemo } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Cell } from '@/types/simulation';

interface BuildingListProps {
  grid: Cell[][];
}

export function BuildingList({ grid }: BuildingListProps) {
  const buildingDirectory = useMemo(() => {
    if (!grid.length) {
      return {};
    }

    const directory: Record<string, { x: number; y: number }[]> = {};

    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[0].length; x++) {
        const cell = grid[y][x];
        if (cell.buildingType) {
          // Heuristic to only add the top-left corner of a building block
          const isTopLeft =
            (y === 0 || grid[y - 1][x].buildingType !== cell.buildingType) &&
            (x === 0 || grid[y][x - 1].buildingType !== cell.buildingType);

          if (isTopLeft) {
            if (!directory[cell.buildingType]) {
              directory[cell.buildingType] = [];
            }
            directory[cell.buildingType].push({ x, y });
          }
        }
      }
    }
    
    // Sort by building type name
    return Object.keys(directory)
      .sort()
      .reduce((acc, key) => {
        acc[key] = directory[key];
        return acc;
      }, {} as Record<string, { x: number; y: number }[]>);

  }, [grid]);
  
  const buildingCount = Object.keys(buildingDirectory).length;

  if (buildingCount === 0) {
    return null;
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="building-list" className="px-4 border-b-0">
            <AccordionTrigger>
              Building Directory ({buildingCount} Types)
            </AccordionTrigger>
            <AccordionContent>
              <ScrollArea className="h-48">
                <div className="flex flex-col gap-2 pr-4">
                  {Object.entries(buildingDirectory).map(([type, coords]) => (
                    <div key={type} className="text-xs">
                      <p className="font-bold capitalize text-foreground">
                        {type.replace(/_/g, ' ').toLowerCase()} ({coords.length})
                      </p>
                      <p className="text-muted-foreground">
                        {coords.map(c => `(${c.x},${c.y})`).join(', ')}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
