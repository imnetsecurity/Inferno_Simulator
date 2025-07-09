
"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { SimEvent } from '@/types/simulation';

interface EventLogProps {
  events: SimEvent[];
}

const formatTime = (time: number): string => {
  const day = Math.floor(time / 96) + 1;
  const hour = String(Math.floor((time % 96) / 4)).padStart(2, '0');
  const minute = String((time % 4) * 15).padStart(2, '0');
  return `Day ${day} ${hour}:${minute}`;
};

export function EventLog({ events }: EventLogProps) {
  return (
    <Card className="flex-1 flex flex-col">
      <CardHeader>
        <CardTitle>Event Log</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full px-6 pb-4">
          <div className="flex flex-col-reverse gap-2">
            {events.map(event => (
              <div key={event.id} className="text-xs font-code text-muted-foreground">
                <span className="text-foreground/80 font-semibold">[{formatTime(event.timestamp)}]</span> {event.message}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
