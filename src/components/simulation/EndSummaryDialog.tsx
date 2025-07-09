
"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Stats } from "@/types/simulation";
import { Icons } from '@/components/icons';
import { cn } from "@/lib/utils";

interface EndSummaryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onReset: () => void;
  stats: Stats;
  time: number;
}

const StatLine = ({ icon: Icon, label, value, iconClass }: { icon: React.ElementType, label: string, value: number, iconClass?: string }) => (
    <div className="flex items-center justify-between text-lg">
        <div className="flex items-center gap-2">
            <Icon className={cn("h-5 w-5", iconClass)} />
            <span>{label}</span>
        </div>
        <span className="font-bold font-mono">{value}</span>
    </div>
);


export function EndSummaryDialog({ isOpen, onClose, onReset, stats, time }: EndSummaryDialogProps) {
  const formatTime = (t: number) => {
    const days = Math.floor(t / 96) + 1;
    const hours = String(Math.floor((t % 96) / 4)).padStart(2, '0');
    const minutes = String((t % 4) * 15).padStart(2, '0');
    return `Day ${days}, ${hours}:${minutes}`;
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl text-center">Simulation Ended</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            The simulation ran for a total of {formatTime(time)}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-4 py-4">
            <StatLine icon={Icons.extinguished} label="Fires Extinguished" value={Math.floor(stats.firesExtinguished / 2)} iconClass="text-green-500" />
            <StatLine icon={Icons.arsonist} label="Total Casualties" value={stats.casualties} iconClass="text-destructive" />
            <StatLine icon={Icons.industrial} label="Buildings Destroyed" value={Math.floor(stats.buildingsDestroyed / 2)} iconClass="text-gray-400" />
            <StatLine icon={Icons.apprehended} label="Arsonists Apprehended" value={stats.arsonistsApprehended} iconClass="text-blue-400" />
            <StatLine icon={Icons.trapped} label="Citizens Trapped (Final)" value={stats.citizensTrapped} iconClass="text-yellow-500" />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Close</AlertDialogCancel>
          <AlertDialogAction onClick={onReset}>
            <Icons.reset className="mr-2 h-4 w-4" /> Reset Simulation
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
