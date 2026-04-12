"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const USER_ID_KEY = "reader-user-id";
const USER_INIT_KEY = "reader-user-inited";
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

export function useReadingSession(bookId: string, chapterId: string, passageId: string) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const userIdRef = useRef<string>("");
  const sessionIdRef = useRef<string | null>(null);
  const prevPassageRef = useRef<string | null>(null);

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
      chapterId,
      passageId,
      visibleMs: HEARTBEAT_INTERVAL_MS,
    });
  }, [bookId, chapterId, passageId]);

  // Initialize user + start session (book-level)
  useEffect(() => {
    const userId = getOrCreateUserId();
    userIdRef.current = userId;
    const locale = getLocale();

    // Register/update user (once per browser session)
    try {
      if (!sessionStorage.getItem(USER_INIT_KEY)) {
        apiPost("/api/user/init", { userId, locale });
        sessionStorage.setItem(USER_INIT_KEY, "1");
      }
    } catch {
      // sessionStorage unavailable, call init anyway
      apiPost("/api/user/init", { userId, locale });
    }

    // Start or resume session
    fetch("/api/session/start", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId, bookId, locale, chapterId, passageId }),
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

  // Track passage navigation within the same session
  useEffect(() => {
    if (!sessionId) return;

    if (prevPassageRef.current !== null && prevPassageRef.current !== passageId) {
      // User navigated to a different passage — record a navigate event
      apiPost("/api/session/heartbeat", {
        sessionId,
        userId: userIdRef.current,
        bookId,
        chapterId,
        passageId,
        eventType: "navigate",
        visibleMs: 0,
      });
    }
    prevPassageRef.current = passageId;
  }, [sessionId, passageId, chapterId, bookId]);

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
