import { useState, useCallback, useEffect } from "react";
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  isNotificationEnabled,
  setNotificationEnabled,
} from "@/lib/notify";

export function useNotifications() {
  const [supported] = useState(isNotificationSupported);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    getNotificationPermission
  );
  const [enabled, setEnabled] = useState(isNotificationEnabled);

  // Sync state on mount
  useEffect(() => {
    setPermission(getNotificationPermission());
    setEnabled(isNotificationEnabled());
  }, []);

  const toggleNotifications = useCallback(async () => {
    if (!supported) return;

    if (permission !== "granted") {
      const result = await requestNotificationPermission();
      setPermission(result);
      if (result === "granted") {
        setNotificationEnabled(true);
        setEnabled(true);
      }
      return;
    }

    // Already granted — toggle opt-in
    const newState = !enabled;
    setNotificationEnabled(newState);
    setEnabled(newState);
  }, [supported, permission, enabled]);

  return {
    supported,
    permission,
    enabled,
    toggleNotifications,
  };
}
