import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { getSessionStatus, getMetadata, acquireSession, releaseSession, heartbeatSession } from '../lib/api';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

export const useAccountCreationSession = (sessionId) => {
  const [socketConnected, setSocketConnected] = useState(false);
  const [lockStatus, setLockStatus] = useState("loading"); // loading, invalid, expired, blocked, active, submitting, success, error
  const [accountCreationSession, setAccountCreationSession] = useState(null);
  const [activeLock, setActiveLock] = useState(null);
  const [metadata, setMetadata] = useState({ accountModes: [], currencies: [], divisions: [] });
  const [expiresAt, setExpiresAt] = useState(null);
  const [sessionExpiresAt, setSessionExpiresAt] = useState(null);
  const [message, setMessage] = useState("Validating session...");
  const [canSubmit, setCanSubmit] = useState(false);

  const socketRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const hasAcquiredRef = useRef(false);
  const intentionallyLeavingRef = useRef(false);

  // Initialize socket and setup listeners
  const setupSocket = useCallback(() => {
    if (socketRef.current) return;

    const socket = io(`${BACKEND_URL}/account-creation`, {
      auth: { sessionId }
    });

    socket.on("connect", () => {
      setSocketConnected(true);
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
      if (hasAcquiredRef.current) {
        setLockStatus("error");
        setCanSubmit(false);
        setMessage("Connection to server lost. Please refresh to continue.");
      }
    });

    socket.on("connect_error", (err) => {
      setSocketConnected(false);
      setLockStatus("expired");
      setMessage("Failed to connect to the session server.");
    });

    // We can also listen to specific events if backend pushes them
    socket.on("account-creation:lock-released", () => {
      if (hasAcquiredRef.current) {
        setLockStatus("expired");
        setCanSubmit(false);
        setMessage("Session lock released by another process or server.");
      }
    });
    
    socket.on("account-creation:lock-updated", (data) => {
       if(data?.session?.expiresAt) {
           setExpiresAt(data.session.expiresAt);
       }
    });

    socketRef.current = socket;
  }, [sessionId]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  const startHeartbeat = useCallback(() => {
    stopHeartbeat();
    heartbeatIntervalRef.current = setInterval(async () => {
      try {
        const res = await heartbeatSession(sessionId);
        if (!res.success) {
          setCanSubmit(false);
          setLockStatus("expired");
          setMessage("Session heartbeat failed. Session may have expired.");
          stopHeartbeat();
        } else if (res.session?.expiresAt) {
          setExpiresAt(res.session.expiresAt);
        }
      } catch (err) {
        setCanSubmit(false);
        setMessage("Failed to reach server for heartbeat.");
      }
    }, 25000); // 25 seconds
  }, [sessionId, stopHeartbeat]);

  const initSession = useCallback(async () => {
    if (!sessionId) {
      setLockStatus("invalid");
      setMessage("Invalid Link: No session ID provided.");
      return;
    }

    try {
      setLockStatus("loading");
      setMessage("Checking session status...");
      const statusRes = await getSessionStatus(sessionId);

      if (!statusRes.accountCreationSession) {
        setLockStatus("expired");
        setMessage("Invalid/Expired Link: Session not found.");
        return;
      }

      const status = statusRes.accountCreationSession.status;
      if (["released", "used", "expired"].includes(status)) {
        setLockStatus("expired");
        setMessage("Link Expired: This session link is no longer valid.");
        return;
      }

      setAccountCreationSession(statusRes.accountCreationSession);
      setSessionExpiresAt(statusRes.accountCreationSession.expiresAt || null);

      setMessage("Loading session metadata...");
      const metaRes = await getMetadata(sessionId);
      if (metaRes.success && metaRes.data) {
        setMetadata({
          accountModes: metaRes.data.accountModes || [],
          currencies: metaRes.data.currencies || [],
          divisions: metaRes.data.divisions || []
        });
      } else {
         // handle failure?
         console.warn("Failed to load metadata properly");
      }

      setupSocket();

      setMessage("Acquiring session lock...");
      const acquireRes = await acquireSession(sessionId);

      if (acquireRes.success && acquireRes.allowed) {
        setLockStatus("active");
        setActiveLock(acquireRes.session);
        setExpiresAt(acquireRes.session?.expiresAt || null);
        setCanSubmit(true);
        hasAcquiredRef.current = true;
        startHeartbeat();
        setMessage("Session acquired.");
      } else {
        setLockStatus("blocked");
        setActiveLock(acquireRes.session);
        setExpiresAt(acquireRes.session?.expiresAt || null);
        setMessage(acquireRes.message || "Account creation is currently in use by another active session.");
      }

    } catch (error) {
      setLockStatus("error");
      setMessage("An error occurred while initializing the session.");
      console.error(error);
    }
  }, [sessionId, setupSocket, startHeartbeat]);

  useEffect(() => {
    initSession();

    const handleBeforeUnload = () => {
      if (hasAcquiredRef.current && intentionallyLeavingRef.current) {
        const payload = JSON.stringify({ sessionId });
        navigator.sendBeacon(`${BACKEND_URL}/api/account-creation/session/release`, payload);
      } else if (hasAcquiredRef.current) {
         // Browser unload (tab closed/refresh) - should release
         const payload = JSON.stringify({ sessionId });
         navigator.sendBeacon(`${BACKEND_URL}/api/account-creation/session/release`, payload);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // NOTE: We do NOT call release on unmount here to avoid React StrictMode issues
      // Only release on intentional leave or beforeunload.
    };
  }, [initSession, sessionId]);

  const markIntentionalLeave = () => {
    intentionallyLeavingRef.current = true;
  };

  const manualRelease = async () => {
    markIntentionalLeave();
    if (hasAcquiredRef.current) {
      try {
        await releaseSession(sessionId);
      } catch (err) {
        console.error("Release failed", err);
      }
    }
  };

  return {
    socketConnected,
    lockStatus,
    setLockStatus,
    accountCreationSession,
    activeLock,
    metadata,
    expiresAt,
    sessionExpiresAt,
    message,
    setMessage,
    canSubmit,
    setCanSubmit,
    manualRelease,
    markIntentionalLeave,
    stopHeartbeat
  };
};
