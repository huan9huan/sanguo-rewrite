"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const USER_ID_KEY = "reader-user-id";
const HEARTBEAT_INTERVAL_MS = 30_000;

function getOrCreateUserId(): string {
  try {
    const existing = localStorage.getItem(USER_ID_KEY);
    if (existing) return existing;
  } catch {
    // localStorage unavailable
  }

  const id = crypto.randomUUID();
  try {
    localStorage.setItem(USER_ID_KEY, id);
  } catch {
    // Ignore storage errors
  }
  return id;
}

function getLocale(): string {
  const path = window.location.pathname;
  if (path.startsWith("/zh")) return "zh";
  if (path.startsWith("/en")) return "en";
  return "en";
}

async function apiPost(url: string, body: Record<string, unknown>) {
  try {
    await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    });
  } catch {
    // Network errors are non-critical for analytics
  }
}

export function useReadingSession(bookId: string) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const userIdRef = useRef<string>("");
  const sessionIdRef = useRef<string | null>(null);

  // Keep refs in sync
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  const sendHeartbeat = useCallback(() => {
    const sid = sessionIdRef.current;
    if (!sid) return;
    apiPost("/api/session/heartbeat", {
      sessionId: sid,
      userId: userIdRef.current,
      bookId,
      visibleMs: HEARTBEAT_INTERVAL_MS,
    });
  }, [bookId]);

  // Initialize user + start session
  useEffect(() => {
    const userId = getOrCreateUserId();
    userIdRef.current = userId;
    const locale = getLocale();

    // Register/update user
    apiPost("/api/user/init", { userId, locale });

    // Start or resume session
    fetch("/api/session/start", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId, bookId, locale }),
    })
      .then((res) => res.json())
      .then((data: { ok: boolean; sessionId?: string }) => {
        if (data.ok && data.sessionId) {
          setSessionId(data.sessionId);
        }
      })
      .catch(() => {});

    return () => {
      // End session on unmount
      const sid = sessionIdRef.current;
      if (sid) {
        apiPost("/api/session/end", { sessionId: sid, userId, bookId });
      }
    };
  }, [bookId]);

  // Heartbeat timer
  useEffect(() => {
    if (!sessionId) return;

    heartbeatRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [sessionId, sendHeartbeat]);

  // Visibility change heartbeat
  useEffect(() => {
    if (!sessionId) return;

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        sendHeartbeat();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [sessionId, sendHeartbeat]);
}
