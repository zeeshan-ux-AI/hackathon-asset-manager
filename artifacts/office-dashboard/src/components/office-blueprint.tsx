import React from "react";
import { useListDevices, useUpdateDevice, getListDevicesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface BlueprintDeviceProps {
  x: number;
  y: number;
  isOn: boolean;
  type: "light" | "fan";
  label: string;
  onToggle: () => void;
  disabled: boolean;
}

function BlueprintDevice({ x, y, isOn, type, label, onToggle, disabled }: BlueprintDeviceProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-label={`Toggle ${label}`}
      className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 group cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 bg-transparent border-0 p-0"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <div 
        className={`w-4 h-4 rounded-full border-2 transition-all duration-300 relative ${
          isOn 
            ? 'border-primary bg-primary/20 shadow-[0_0_15px_rgba(20,255,140,0.8)]' 
            : 'border-muted-foreground bg-muted'
        }`}
      >
        {isOn && (
          <div className="absolute inset-0 rounded-full animate-ping opacity-30 bg-primary" />
        )}
        {type === "fan" && isOn && (
          <div className="absolute inset-0 border-t-2 border-primary rounded-full animate-spin" />
        )}
      </div>
      <div className="text-[9px] font-mono text-muted-foreground bg-background/80 px-1 rounded border border-border whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity absolute top-6">
        {label}
      </div>
    </button>
  );
}

export function OfficeBlueprint() {
  const { data, isLoading } = useListDevices();
  const queryClient = useQueryClient();
  const { mutate: updateDevice, isPending } = useUpdateDevice({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDevicesQueryKey() });
      },
    },
  });

  if (isLoading) {
    return <Skeleton className="w-full h-full min-h-[300px] rounded bg-muted/50" />;
  }

  const devices = data?.devices || [];

  // Map devices to coordinates based on room.
  // Drawing Room (Left), Work Room 1 (Top Right), Work Room 2 (Bottom Right)
  const getDeviceCoords = (room: string, name: string): { x: number, y: number } => {
    // Rough coordinates mapping
    const layouts: Record<string, Record<string, {x: number, y: number}>> = {
      'drawing_room': {
        'Light 1': { x: 20, y: 30 },
        'Light 2': { x: 20, y: 50 },
        'Light 3': { x: 20, y: 70 },
        'Fan 1': { x: 30, y: 40 },
        'Fan 2': { x: 30, y: 60 },
      },
      'work_room_1': {
        'Light 1': { x: 60, y: 20 },
        'Light 2': { x: 75, y: 20 },
        'Light 3': { x: 90, y: 20 },
        'Fan 1': { x: 65, y: 35 },
        'Fan 2': { x: 85, y: 35 },
      },
      'work_room_2': {
        'Light 1': { x: 60, y: 65 },
        'Light 2': { x: 75, y: 65 },
        'Light 3': { x: 90, y: 65 },
        'Fan 1': { x: 65, y: 80 },
        'Fan 2': { x: 85, y: 80 },
      }
    };
    return layouts[room]?.[name] || { x: 50, y: 50 };
  };

  return (
    <div className="w-full h-full min-h-[400px] bg-[#0a1015] border border-primary/20 rounded relative overflow-hidden font-mono" style={{
      backgroundImage: `linear-gradient(rgba(20,255,140,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(20,255,140,0.05) 1px, transparent 1px)`,
      backgroundSize: '20px 20px'
    }}>
      
      {/* Blueprint Walls */}
      {/* Outer Wall */}
      <div className="absolute top-[10%] left-[10%] right-[10%] bottom-[10%] border-2 border-primary/40 rounded-sm" />
      
      {/* Inner Dividing Walls */}
      {/* Vertical split */}
      <div className="absolute top-[10%] bottom-[10%] left-[45%] w-0 border-l-2 border-primary/40" />
      {/* Horizontal split right side */}
      <div className="absolute top-[50%] left-[45%] right-[10%] h-0 border-t-2 border-primary/40" />
      
      {/* Room Labels */}
      <div className="absolute top-[12%] left-[12%] text-primary/60 text-xs font-bold uppercase tracking-widest">
        Drawing Room
      </div>
      <div className="absolute top-[12%] left-[47%] text-primary/60 text-xs font-bold uppercase tracking-widest">
        Work Room 1
      </div>
      <div className="absolute top-[52%] left-[47%] text-primary/60 text-xs font-bold uppercase tracking-widest">
        Work Room 2
      </div>

      {/* Devices */}
      {devices.map(device => {
        const coords = getDeviceCoords(device.room, device.name);
        return (
          <BlueprintDevice 
            key={device.id}
            x={coords.x}
            y={coords.y}
            isOn={device.isOn}
            type={device.type}
            label={device.name}
            disabled={isPending}
            onToggle={() =>
              updateDevice({ deviceId: device.id, data: { isOn: !device.isOn } })
            }
          />
        );
      })}

      <div className="absolute bottom-2 right-2 text-[10px] text-primary/40 uppercase tracking-widest">
        Grid Layout 1.0
      </div>
    </div>
  );
}
