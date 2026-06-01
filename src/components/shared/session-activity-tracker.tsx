"use client";

import { useEffect, useRef } from "react";
import { signOut, useSession } from "next-auth/react";

const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000;
const SESSION_REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const IDLE_CHECK_INTERVAL_MS = 60 * 1000;

export function SessionActivityTracker() {
  const { update, status } = useSession();
  const lastActivityRef = useRef<number>(Date.now());
  const hasPendingActivityRef = useRef<boolean>(false);

  useEffect(() => {
    if (status !== "authenticated") return;

    const markActivity = () => {
      lastActivityRef.current = Date.now();
      hasPendingActivityRef.current = true;
    };

    const activityEvents: Array<keyof WindowEventMap> = [
      "mousemove",
      "keydown",
      "click",
      "scroll",
      "touchstart",
    ];

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        markActivity();
      }
    };

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, markActivity, { passive: true });
    });
    document.addEventListener("visibilitychange", onVisibilityChange);

    markActivity();

    const refreshInterval = window.setInterval(async () => {
      const now = Date.now();
      const idleDuration = now - lastActivityRef.current;

      if (idleDuration >= INACTIVITY_TIMEOUT_MS) {
        await signOut({ callbackUrl: "/login" });
        return;
      }

      if (hasPendingActivityRef.current) {
        hasPendingActivityRef.current = false;
        await update();
      }
    }, SESSION_REFRESH_INTERVAL_MS);

    const idleCheckInterval = window.setInterval(async () => {
      const now = Date.now();
      const idleDuration = now - lastActivityRef.current;

      if (idleDuration >= INACTIVITY_TIMEOUT_MS) {
        await signOut({ callbackUrl: "/login" });
      }
    }, IDLE_CHECK_INTERVAL_MS);

    return () => {
      window.clearInterval(refreshInterval);
      window.clearInterval(idleCheckInterval);
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, markActivity);
      });
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [status, update]);

  return null;
}
