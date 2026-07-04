import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getListDevicesQueryKey,
  getGetRoomQueryKey,
  getGetUsageQueryKey,
  getListAlertsQueryKey,
} from "@workspace/api-client-react";

export function useLiveData() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const sseUrl = `${import.meta.env.BASE_URL}api/events`;
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (event) => {
      // Invalidate all related queries to trigger a refetch
      queryClient.invalidateQueries({ queryKey: getListDevicesQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetUsageQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListAlertsQueryKey() });
      // Invalidating all room queries
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] }); 
    };

    eventSource.onerror = (error) => {
      console.error("SSE Connection Error", error);
      // EventSource will automatically attempt to reconnect
    };

    return () => {
      eventSource.close();
    };
  }, [queryClient]);
}
