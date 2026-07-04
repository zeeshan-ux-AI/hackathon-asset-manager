import React from "react";
import { useGetUsage } from "@workspace/api-client-react";
import { Zap, Activity, Hash, Bolt } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function PowerMeter() {
  const { data: usage, isLoading, isError } = useGetUsage();

  if (isLoading) {
    return (
      <div className="bg-card border border-card-border rounded-xl p-6">
        <Skeleton className="h-8 w-1/3 mb-6" />
        <Skeleton className="h-32 w-full mb-6" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !usage) {
    return (
      <div className="bg-card border border-card-border rounded-xl p-6 text-destructive">
        Error loading power data
      </div>
    );
  }

  const maxExpectedWatts = 1500; // Arbitrary max for the meter visualization
  const percentage = Math.min((usage.totalWatts / maxExpectedWatts) * 100, 100);

  return (
    <div className="bg-card border border-card-border rounded-xl p-6 relative overflow-hidden group">
      <div className="absolute -right-12 -top-12 opacity-5 text-primary rotate-12 transition-transform duration-1000 group-hover:rotate-45">
        <Zap size={180} />
      </div>
      
      <h2 className="font-bold text-white mb-6 uppercase tracking-widest text-xs font-mono flex items-center gap-2">
        <Bolt className="w-4 h-4 text-primary" />
        Grid Status
      </h2>

      <div className="flex flex-col items-center justify-center mb-8 relative">
        <div className="text-6xl font-mono font-bold tracking-tighter text-white drop-shadow-[0_0_15px_rgba(20,255,140,0.3)] tabular-nums">
          {usage.totalWatts}
        </div>
        <div className="text-muted-foreground text-sm font-mono mt-1 tracking-widest uppercase">
          Total Watts
        </div>

        {/* Meter Bar */}
        <div className="w-full h-2 bg-secondary rounded-full mt-6 overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(20,255,140,0.5)]"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="w-full flex justify-between mt-2 text-xs font-mono text-muted-foreground">
          <span>0W</span>
          <span>{maxExpectedWatts}W Peak</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-6 border-t border-border/50">
        <div className="flex flex-col gap-1">
          <div className="text-xs text-muted-foreground font-mono uppercase">Daily Est.</div>
          <div className="text-xl font-mono text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-accent" />
            {usage.estimatedDailyKwh.toFixed(1)} <span className="text-sm text-muted-foreground">kWh</span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="text-xs text-muted-foreground font-mono uppercase">Active Nodes</div>
          <div className="text-xl font-mono text-white flex items-center gap-2">
            <Hash className="w-4 h-4 text-accent" />
            {usage.activeDeviceCount} <span className="text-sm text-muted-foreground">/ {usage.totalDeviceCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
