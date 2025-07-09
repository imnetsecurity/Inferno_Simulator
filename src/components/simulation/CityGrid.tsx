"use client";

import React, { useState, useRef, WheelEvent, MouseEvent, memo } from "react";
import type {
  Cell,
  Agent,
  BuildingType as BuildingTypeType,
  AgentState,
  BuildingProperties,
} from "@/types/simulation";
import { config, BuildingType } from "@/lib/config";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons";

interface CellProps {
  cell: Cell;
  buildingProperties: Record<BuildingTypeType, BuildingProperties>;
}

/* -------------------------------------------
 * 🔥  Visual palette helper
 * ------------------------------------------ */
const getCellColor = (
  cell: Cell,
  buildingProperties: Record<BuildingTypeType, BuildingProperties>
): string => {
  /* 1️⃣  Burnt-out buildings look DARK-RED now */
  if (cell.isBurntOut) return 'rgb(139,0,0)'; // dark-red

  /* on-fire gradient */
  if (cell.fireLevel > 0)
    return config.color_fire[Math.min(3, Math.floor(cell.fireLevel / 2.5))];

  switch (cell.cellType) {
    case "BUILDING":
      return cell.buildingType && buildingProperties[cell.buildingType]
        ? buildingProperties[cell.buildingType].color
        : "rgb(180, 180, 180)";
    case "ROAD":
      switch (cell.roadType) {
        case "BRIDGE":
          return config.color_bridge;
        case "ALLEY":
          return config.color_alley;
        case "STREET":
          return config.color_street;
        default:
          return config.color_road;
      }
    case "PARK":
      return config.color_park;
    case "WATER":
      return config.color_water;
    default:
      return "rgb(100,100,100)";
  }
};

/* -------------------------------------------
 *  Memoised single-cell renderer
 * ------------------------------------------ */
const MemoizedCell = memo(function CellComponent({
  cell,
  buildingProperties,
}: CellProps) {
  const style: React.CSSProperties = {
    left: cell.x * config.cell_size,
    top: cell.y * config.cell_size,
    width: config.cell_size,
    height: config.cell_size,
    backgroundColor: getCellColor(cell, buildingProperties),
    transition: "background-color 0.5s ease",
    opacity: cell.fireLevel > 0 ? 0.5 + cell.fireLevel / 20 : 1,
  };
  const fireIsActive = cell.fireLevel > 0 && !cell.isBurntOut;
  return (
    <div className={cn("absolute border border-black/30")} style={style}>
      {cell.fireLevel > 3 && (
        <div className="absolute inset-0 fire-animation rounded-full" />
      )}

      {/* fire emoji overlay for any active flames */}
      {fireIsActive  && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-red-500 text-lg animate-pulse drop-shadow-md">
            🔥
          </span>
        </div>
      )}

      {cell.isBurntOut ? (
        <Icons.burntOut className="w-full h-full p-1 text-white/50" />
      ) : (
        <>
          {cell.buildingType === BuildingType.FIRE_STATION && (
            <Icons.fireStation className="w-full h-full p-0.5 text-white/80" />
          )}
          {cell.buildingType === BuildingType.POLICE_STATION && (
            <Icons.policeStation className="w-full h-full p-0.5 text-white/80" />
          )}
        </>
      )}
    </div>
  );
});

/* -------------------------------------------
 *  Agents
 * ------------------------------------------ */
interface AgentProps {
  agent: Agent;
}

const AgentComponent = ({ agent }: AgentProps) => {
  /* anonymise un-caught arsonists as civilians */
  const agentType =
    agent.type === "arsonist" && agent.state !== "apprehended"
      ? "civilian"
      : agent.type;

  const Icon = Icons[agentType as keyof typeof Icons] || Icons.civilian;
  const color = {
    firefighter: "text-red-400",
    police: "text-blue-400",
    arsonist: "text-yellow-400", // visible only once apprehended
    civilian: "text-green-400",
  }[agentType];

  const stateIndicatorClass = () => {
    if (agent.isTrapped) return "";
    switch (agent.state) {
      case "fleeing":
        return "border-2 border-destructive rounded-full animate-pulse";
      case "at_home":
      case "going_home":
        return "border-2 border-green-500 rounded-full";
      case "working":
      case "going_to_work":
        return "border-2 border-sky-500 rounded-full";
      case "shopping":
        return "border-2 border-purple-500 rounded-full";
      case "extinguishing":
      case "responding":
        return "border-2 border-accent rounded-full animate-pulse";
      case "apprehending":
        return "border-2 border-blue-400 rounded-full animate-pulse";
      default:
        return "";
    }
  };

  return (
    <div
      className={cn(
        "absolute transition-all duration-500 ease-linear",
        stateIndicatorClass()
      )}
      style={{
        left: agent.x * config.cell_size,
        top: agent.y * config.cell_size,
        width: config.cell_size,
        height: config.cell_size,
        zIndex: 10,
      }}
    >
      <Icon className={cn("w-full h-full p-px", color)} />
      {agent.isTrapped && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
          <Icons.trapped className="w-2/3 h-2/3 text-destructive animate-pulse" />
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------
 *  Grid wrapper
 * ------------------------------------------ */
interface CityGridProps {
  grid: Cell[][];
  agents: Agent[];
  buildingProperties: Record<BuildingTypeType, BuildingProperties>;
}

const formatBuildingType = (type?: BuildingTypeType): string =>
  type
    ? type
        .split("_")
        .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
        .join(" ")
    : "Building";

const formatAgentState = (state: AgentState) =>
  state
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");

export function CityGrid({ grid, agents, buildingProperties }: CityGridProps) {
  const [view, setView] = useState({ x: 0, y: 0, zoom: 1 });
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredInfo, setHoveredInfo] = useState<{
    cell: Cell;
    agents: Agent[];
    x: number;
    y: number;
  } | null>(null);

  /* ---------- panning / zoom handlers ---------- */
  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    const newZoom = Math.max(0.2, Math.min(5, view.zoom - e.deltaY * 0.001));
    setView((v) => ({ ...v, zoom: newZoom }));
  };
  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    isDragging.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.style.cursor = "grabbing";
  };
  const handleMouseUp = (e: MouseEvent<HTMLDivElement>) => {
    isDragging.current = false;
    e.currentTarget.style.cursor = "grab";
  };
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (isDragging.current) {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
      setHoveredInfo(null);
      return;
    }
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const tx = (mouseX - view.x) / view.zoom;
      const ty = (mouseY - view.y) / view.zoom;
      const gx = Math.floor(tx / config.cell_size);
      const gy = Math.floor(ty / config.cell_size);
      if (gx >= 0 && gx < config.grid_width && gy >= 0 && gy < config.grid_height) {
        const cell = grid[gy]?.[gx];
        if (cell) {
          const occupants = agents.filter(
            (a) => Math.floor(a.x) === gx && Math.floor(a.y) === gy
          );
          setHoveredInfo({ cell, agents: occupants, x: e.clientX, y: e.clientY });
        } else setHoveredInfo(null);
      } else setHoveredInfo(null);
    }
  };
  const handleMouseLeave = (e: MouseEvent<HTMLDivElement>) => {
    isDragging.current = false;
    e.currentTarget.style.cursor = "grab";
    setHoveredInfo(null);
  };

  if (!grid.length)
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900">
        Loading City…
      </div>
    );

  /* ---------- render ---------- */
  return (
    <div
      ref={containerRef}
      className="flex-1 w-full h-full bg-gray-900 overflow-hidden relative"
      style={{ cursor: isDragging.current ? "grabbing" : "grab" }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="relative transition-transform duration-100 ease-out"
        style={{
          width: config.grid_width * config.cell_size,
          height: config.grid_height * config.cell_size,
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})`,
          transformOrigin: "top left",
        }}
      >
        {grid.flat().map((cell) => (
          <MemoizedCell
            key={cell.id}
            cell={cell}
            buildingProperties={buildingProperties}
          />
        ))}
        {agents.map((agent) => (
          <AgentComponent key={agent.id} agent={agent} />
        ))}
      </div>

      {/* hover tooltip */}
      {hoveredInfo && (
        <div
          className="absolute z-30 pointer-events-none p-2 rounded-md shadow-lg bg-popover text-popover-foreground border text-xs w-56"
          style={{ left: hoveredInfo.x + 10, top: hoveredInfo.y + 10 }}
        >
          <p className="font-bold text-sm">
            ({hoveredInfo.cell.x}, {hoveredInfo.cell.y})
          </p>
          <hr className="my-1 border-border" />
          <p>
            <span className="font-semibold">Type:</span>{" "}
            <span className="capitalize">
              {hoveredInfo.cell.cellType.toLowerCase().replace(/_/g, " ")}
            </span>
          </p>
          {hoveredInfo.cell.buildingType && (
            <p>
              <span className="font-semibold">Building:</span>{" "}
              {formatBuildingType(hoveredInfo.cell.buildingType)}
            </p>
          )}
          {hoveredInfo.cell.roadType && (
            <p>
              <span className="font-semibold">Road:</span>{" "}
              <span className="capitalize">
                {hoveredInfo.cell.roadType.toLowerCase().replace(/_/g, " ")}
              </span>
            </p>
          )}
          {hoveredInfo.cell.fireLevel > 0 && (
            <p className="text-destructive">
              <span className="font-semibold">Fire Level:</span>{" "}
              {hoveredInfo.cell.fireLevel.toFixed(1)} / 10
            </p>
          )}
          {hoveredInfo.cell.isBurntOut && (
            <p className="text-muted-foreground font-semibold">Burnt Out</p>
          )}

          {/* surveillance info */}
          {(hoveredInfo.cell.surveillanceLevel ||
            hoveredInfo.cell.dynamicSurveillance) && (
            <p>
              <span className="font-semibold">Surveillance:</span>{" "}
              {((
                hoveredInfo.cell.surveillanceLevel || 0
              ) * 100).toFixed(0)}
              %
              {hoveredInfo.cell.dynamicSurveillance > 0 && (
                <span className="text-blue-400">
                  {" "}
                  (+{(
                    hoveredInfo.cell.dynamicSurveillance * 100
                  ).toFixed(0)}
                  %)
                </span>
              )}
            </p>
          )}

          {/* occupants */}
          {hoveredInfo.agents.length > 0 && (
            <>
              <hr className="my-1 border-border" />
              <p className="font-bold">
                Occupants ({hoveredInfo.agents.length}):
              </p>
              <ul className="list-disc pl-4 text-muted-foreground">
                {hoveredInfo.agents.slice(0, 5).map((a) => {
                  const at =
                    a.type === "arsonist" && a.state !== "apprehended"
                      ? "civilian"
                      : a.type;
                  return (
                    <li key={a.id}>
                      <span className="capitalize">{at}</span>
                      <span className="text-foreground/80">
                        {" "}
                        ({formatAgentState(a.state)})
                      </span>
                      {a.type === "arsonist" && a.state === "apprehended" && (
                        <span className="text-destructive"> (Apprehended)</span>
                      )}
                      {a.isTrapped && (
                        <span className="text-destructive font-bold">
                          {" "}
                          (TRAPPED)
                        </span>
                      )}
                    </li>
                  );
                })}
                {hoveredInfo.agents.length > 5 && (
                  <li>...and {hoveredInfo.agents.length - 5} more</li>
                )}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}