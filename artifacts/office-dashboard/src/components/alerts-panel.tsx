import React from "react";
import { useListAlerts } from "@workspace/api-client-react";
import { AlertTriangle, Clock, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

export function AlertsPanel() {
  const { data, isLoading, isError } = useListAlerts();

  if (isLoading) {
    return (
      <div className="bg-card border border-card-border rounded-xl p-6">
        <Skeleton className="h-6 w-1/3 mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="bg-card border border-card-border rounded-xl p-6 text-destructive">
        Error loading alerts
      </div>
    );
  }

  const { alerts } = data;

  return (
    <div className="bg-card border border-card-border rounded-xl p-6 flex flex-col h-full min-h-[300px]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-bold text-white uppercase tracking-widest text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-destructive" />
          Active Anomalies
        </h2>
        <div className="bg-destructive/10 text-destructive text-xs font-mono px-2 py-1 rounded border border-destructive/20">
          {alerts.length} Warnings
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-3">
        {alerts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground font-mono text-sm border border-dashed border-border rounded-lg p-6">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mb-3">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
            </div>
            All Systems Nominal
          </div>
        ) : (
          alerts.map((alert) => (
            <div 
              key={alert.id}
              className="p-4 rounded-lg bg-destructive/5 border border-destructive/20 hover:border-destructive/40 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-destructive">
                  {alert.type === 'after_hours' ? (
                    <Clock className="w-4 h-4" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-bold text-white font-mono uppercase">
                      {alert.room.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/80">{alert.message}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
