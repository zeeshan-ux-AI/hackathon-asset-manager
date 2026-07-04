import React from "react";
import { useGetRoom, useUpdateDevice, getGetRoomQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Lightbulb, Fan, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";

export function RoomStatus({ roomId, title }: { roomId: "drawing_room" | "work_room_1" | "work_room_2", title: string }) {
  const { data: room, isLoading, isError } = useGetRoom(roomId);
  const queryClient = useQueryClient();
  const { mutate: updateDevice, isPending } = useUpdateDevice({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetRoomQueryKey(roomId) });
      },
    },
  });

  if (isLoading) {
    return (
      <div className="bg-card/50 border border-card-border rounded-xl p-5">
        <Skeleton className="h-5 w-1/2 mb-4" />
        <Skeleton className="h-10 w-full mb-2" />
        <Skeleton className="h-10 w-full mb-2" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (isError || !room) {
    return (
      <div className="bg-card/50 border border-card-border rounded-xl p-5 text-destructive">
        Error loading room
      </div>
    );
  }

  return (
    <div className="bg-card/50 border border-card-border rounded-xl p-5 hover:bg-card transition-colors relative overflow-hidden group">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/50">
        <h3 className="font-bold text-white uppercase tracking-widest text-xs font-mono">{title}</h3>
        <div className="flex items-center gap-1.5 text-accent font-mono text-xs font-bold">
          <Zap className="w-3 h-3" />
          {room.totalWatts}W
        </div>
      </div>

      <div className="space-y-2">
        {room.devices.map((device) => (
          <div 
            key={device.id} 
            className="flex items-center justify-between p-2 rounded bg-background/50 border border-border/50"
          >
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded flex items-center justify-center ${device.isOn ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                {device.type === 'light' ? (
                  <Lightbulb className={`w-4 h-4 ${device.isOn ? 'drop-shadow-[0_0_8px_rgba(20,255,140,0.8)]' : ''}`} />
                ) : (
                  <Fan className={`w-4 h-4 ${device.isOn ? 'animate-spin' : ''}`} />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">{device.name}</span>
                <span className="text-[10px] text-muted-foreground font-mono">{device.powerDrawWatts}W / {device.ratedWatts}W</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-mono uppercase font-bold ${device.isOn ? 'text-primary' : 'text-muted-foreground'}`}>
                {device.isOn ? 'ON' : 'OFF'}
              </span>
              <Switch
                checked={device.isOn}
                disabled={isPending}
                onCheckedChange={(checked) =>
                  updateDevice({ deviceId: device.id, data: { isOn: checked } })
                }
                aria-label={`Toggle ${device.name}`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
