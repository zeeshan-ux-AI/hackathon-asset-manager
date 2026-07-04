import React from "react";
import { useLiveData } from "@/hooks/use-live-data";
import { PowerMeter } from "@/components/power-meter";
import { OfficeBlueprint } from "@/components/office-blueprint";
import { AlertsPanel } from "@/components/alerts-panel";
import { RoomStatus } from "@/components/room-status";

export default function Dashboard() {
  useLiveData();

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground p-4 md:p-8 font-sans selection:bg-primary selection:text-primary-foreground">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-border/50 pb-6 gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Office HQ</h1>
            <p className="text-muted-foreground font-mono text-sm uppercase tracking-widest">Command Center &middot; Live Monitoring</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
            </span>
            <span className="font-mono text-xs text-primary uppercase tracking-wider">System Live</span>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Main Blueprint Area */}
          <div className="xl:col-span-8 flex flex-col gap-6">
            <div className="bg-card border border-card-border rounded-xl p-6 relative overflow-hidden group min-h-[400px]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,var(--color-primary)_0,transparent_60%)] opacity-5 pointer-events-none"></div>
              <h2 className="text-lg font-bold text-white mb-4 uppercase tracking-widest text-xs font-mono flex items-center gap-2">
                <span className="w-2 h-2 bg-primary"></span>
                Floor Plan
              </h2>
              <OfficeBlueprint />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <RoomStatus roomId="drawing_room" title="Drawing Room" />
              <RoomStatus roomId="work_room_1" title="Work Room 1" />
              <RoomStatus roomId="work_room_2" title="Work Room 2" />
            </div>
          </div>

          {/* Right Sidebar Area */}
          <div className="xl:col-span-4 flex flex-col gap-6">
            <PowerMeter />
            <AlertsPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
