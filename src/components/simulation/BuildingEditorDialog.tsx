
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { BuildingType, BuildingProperties, CONTROL_IMPACTS } from '@/lib/config';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';

interface BuildingEditorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (buildingType: BuildingType, newProperties: BuildingProperties) => void;
  buildingType: BuildingType | null;
  properties: BuildingProperties | null;
}

const ControlSwitch = ({ id, label, checked, onCheckedChange }: { id: string, label: string, checked: boolean, onCheckedChange: (checked: boolean) => void }) => (
    <div className="flex items-center justify-between p-3 rounded-md border bg-muted/50">
        <Label htmlFor={id} className="cursor-pointer">
            {label}
        </Label>
        <Switch
            id={id}
            checked={checked}
            onCheckedChange={onCheckedChange}
        />
    </div>
);

const RiskInput = ({ id, label, value, onChange, effectiveValue, isPercentage = false }: { id: keyof BuildingProperties, label: string, value: number, onChange: (value: number) => void, effectiveValue: number, isPercentage?: boolean }) => {
    const displayValue = (val: number) => isPercentage ? `${(val * 100).toFixed(0)}%` : val.toFixed(2);
    const valueColor = effectiveValue > value ? 'text-destructive' : effectiveValue < value ? 'text-green-500' : 'text-muted-foreground';

    return (
        <div className="flex flex-col gap-1">
            <div className="flex justify-between items-baseline">
                <Label htmlFor={id as string}>{label}</Label>
                <span className={cn("text-xs font-mono", valueColor)}>
                    Effective: {displayValue(effectiveValue)}
                </span>
            </div>
            <Input
                id={id as string}
                type="number"
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                step={isPercentage ? "0.01" : "0.1"} min="0" max="1"
            />
        </div>
    );
};

export function BuildingEditorDialog({
  isOpen,
  onClose,
  onSave,
  buildingType,
  properties,
}: BuildingEditorDialogProps) {
  const [editableProperties, setEditableProperties] = useState<BuildingProperties | null>(properties);

  useEffect(() => {
    if (properties) {
      setEditableProperties(JSON.parse(JSON.stringify(properties)));
    }
  }, [properties]);

  const calculatedValues = useMemo(() => {
    if (!editableProperties) {
      return { flammability: 0, arsonRisk: 0, surveillanceLevel: 0 };
    }

    let effectiveFlammability = editableProperties.flammability;
    let effectiveArsonRisk = editableProperties.arsonRisk;
    // Surveillance is the inverse of risk factors. Positive risk means lower surveillance.
    let effectiveSurveillance = editableProperties.surveillanceLevel || 0;

    for (const key in CONTROL_IMPACTS) {
      const controlKey = key as keyof typeof CONTROL_IMPACTS;
      if (editableProperties[controlKey]) {
        effectiveFlammability += CONTROL_IMPACTS[controlKey].flammability;
        effectiveArsonRisk += CONTROL_IMPACTS[controlKey].risk;
        effectiveSurveillance -= CONTROL_IMPACTS[controlKey].risk; 
      }
    }

    return {
      flammability: Math.max(0, Math.min(1, effectiveFlammability)),
      arsonRisk: Math.max(0, Math.min(1, effectiveArsonRisk)),
      surveillanceLevel: Math.max(0, Math.min(1, effectiveSurveillance)),
    };
  }, [editableProperties]);


  const handleSave = () => {
    if (buildingType && editableProperties) {
      onSave(buildingType, editableProperties);
      onClose();
    }
  };

  const handleChange = (key: keyof BuildingProperties, value: any) => {
    if (editableProperties) {
      setEditableProperties({
        ...editableProperties,
        [key]: value,
      });
    }
  };

  if (!isOpen || !buildingType || !editableProperties) {
    return null;
  }
  
  const buildingName = buildingType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit: {buildingName}</DialogTitle>
          <DialogDescription>
            Adjust properties for this building type. Changes will apply on the next simulation reset.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
            <div className="grid gap-6 py-4 pr-6">
                <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Base Risk Profile</h4>
                    <div className="grid grid-cols-1 gap-4">
                        <RiskInput
                            id="flammability"
                            label="Base Flammability"
                            value={editableProperties.flammability}
                            onChange={(v) => handleChange('flammability', v)}
                            effectiveValue={calculatedValues.flammability}
                        />
                         <RiskInput
                            id="arsonRisk"
                            label="Base Arson Risk"
                            value={editableProperties.arsonRisk}
                            onChange={(v) => handleChange('arsonRisk', v)}
                            effectiveValue={calculatedValues.arsonRisk}
                            isPercentage
                        />
                        <RiskInput
                            id="surveillanceLevel"
                            label="Base Surveillance"
                            value={editableProperties.surveillanceLevel || 0}
                            onChange={(v) => handleChange('surveillanceLevel', v)}
                            effectiveValue={calculatedValues.surveillanceLevel}
                            isPercentage
                        />
                    </div>
                </div>

                <Separator />

                <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Positive Controls (Deterrents)</h4>
                    <div className="grid gap-3">
                         <ControlSwitch id="hasCCTV" label="Security Cameras" checked={!!editableProperties.hasCCTV} onCheckedChange={(c) => handleChange('hasCCTV', c)} />
                         <ControlSwitch id="hasFireAlarm" label="Monitored Fire Alarm" checked={!!editableProperties.hasFireAlarm} onCheckedChange={(c) => handleChange('hasFireAlarm', c)} />
                         <ControlSwitch id="hasSprinklerSystem" label="Sprinkler System" checked={!!editableProperties.hasSprinklerSystem} onCheckedChange={(c) => handleChange('hasSprinklerSystem', c)} />
                         <ControlSwitch id="hasSecurityPatrol" label="On-site Security Patrol" checked={!!editableProperties.hasSecurityPatrol} onCheckedChange={(c) => handleChange('hasSecurityPatrol', c)} />
                         <ControlSwitch id="isCommunityWatched" label="Neighborhood Watch" checked={!!editableProperties.isCommunityWatched} onCheckedChange={(c) => handleChange('isCommunityWatched', c)} />
                    </div>
                </div>

                <Separator />
                
                <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Negative Controls (Vulnerabilities)</h4>
                    <div className="grid gap-3">
                        <ControlSwitch id="isAbandoned" label="Abandoned Building" checked={!!editableProperties.isAbandoned} onCheckedChange={(c) => handleChange('isAbandoned', c)} />
                        <ControlSwitch id="hasPoorMaintenance" label="Poor Maintenance" checked={!!editableProperties.hasPoorMaintenance} onCheckedChange={(c) => handleChange('hasPoorMaintenance', c)} />
                        <ControlSwitch id="hasGraffiti" label="Visible Graffiti" checked={!!editableProperties.hasGraffiti} onCheckedChange={(c) => handleChange('hasGraffiti', c)} />
                        <ControlSwitch id="isIsolated" label="Isolated Location" checked={!!editableProperties.isIsolated} onCheckedChange={(c) => handleChange('isIsolated', c)} />
                        <ControlSwitch id="isControversial" label="Controversial Site" checked={!!editableProperties.isControversial} onCheckedChange={(c) => handleChange('isControversial', c)} />
                    </div>
                </div>
            </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
