import { doc, increment, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const STATS_DOC_REF = doc(db, 'system', 'stats');
const PRESENCE_COLLECTION_NAME = 'presence';
const USERS_COLLECTION_NAME = 'users';
const ROOT_ADMIN_EMAIL = 'rk.upk2345678@gmail.com';
const PENDING_INTERACTIONS_KEY = 'pending_interactions_v1';
const SESSION_ID_KEY = 'presence_session_id_v1';
const FLUSH_INTERVAL_MS = 15000;
const BATCH_SIZE = 10;
const PRESENCE_HEARTBEAT_MS = 60000;

let pendingInteractions = 0;
let flushTimer: number | null = null;
let initialized = false;
let flushInFlight: Promise<void> | null = null;
let presenceTimer: number | null = null;
let sessionId = '';
let activeUserId: string | null = null;

function getTodayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function getSessionId(): string {
  if (typeof window === 'undefined') return 'server-session';

  const existingSessionId = window.localStorage.getItem(SESSION_ID_KEY);
  if (existingSessionId) return existingSessionId;

  const newSessionId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `session_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  window.localStorage.setItem(SESSION_ID_KEY, newSessionId);
  return newSessionId;
}

async function updatePresence() {
  if (typeof window === 'undefined' || !sessionId) return;

  const now = Date.now();
  const dayKey = getTodayKey(new Date(now));
  const presenceRef = doc(db, PRESENCE_COLLECTION_NAME, sessionId);

  try {
    await setDoc(
      presenceRef,
      {
        sessionId,
        userId: activeUserId,
        dayKey,
        lastSeenAt: now,
        updatedAt: now,
      },
      { merge: true }
    );
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[InteractionTracker] Failed to update presence', error);
    }
  }

  if (!activeUserId) {
    return;
  }

  const userRef = doc(db, USERS_COLLECTION_NAME, activeUserId);
  const currentUser = auth.currentUser;

  try {
    await setDoc(
      userRef,
      {
        uid: activeUserId,
        displayName: currentUser?.displayName || 'Anonymous User',
        email: currentUser?.email || '',
        photoURL: currentUser?.photoURL || '',
        role: currentUser?.email === ROOT_ADMIN_EMAIL ? 'admin' : 'user',
        bio: '',
        suspended: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastSeenAt: now,
        lastActiveDayKey: dayKey
      },
      { merge: true }
    );
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[InteractionTracker] Failed to update user activity', error);
    }
  }
}

function readPendingInteractions(): number {
  if (typeof window === 'undefined') return 0;

  const rawValue = window.localStorage.getItem(PENDING_INTERACTIONS_KEY);
  const parsedValue = rawValue ? Number.parseInt(rawValue, 10) : 0;
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 0;
}

function persistPendingInteractions() {
  if (typeof window === 'undefined') return;

  if (pendingInteractions > 0) {
    window.localStorage.setItem(PENDING_INTERACTIONS_KEY, String(pendingInteractions));
  } else {
    window.localStorage.removeItem(PENDING_INTERACTIONS_KEY);
  }
}

async function flushPendingInteractions() {
  if (flushInFlight || pendingInteractions <= 0) {
    return flushInFlight ?? Promise.resolve();
  }

  const interactionsToFlush = pendingInteractions;
  pendingInteractions = 0;
  persistPendingInteractions();

  flushInFlight = setDoc(
    STATS_DOC_REF,
    { totalInteractions: increment(interactionsToFlush) },
    { merge: true }
  )
    .catch((error) => {
      pendingInteractions += interactionsToFlush;
      persistPendingInteractions();
      console.error('[InteractionTracker] Failed to flush interactions', error);
    })
    .finally(() => {
      flushInFlight = null;
    });

  return flushInFlight;
}

function scheduleFlush() {
  if (typeof window === 'undefined' || flushTimer !== null) return;

  flushTimer = window.setTimeout(() => {
    flushTimer = null;
    void flushPendingInteractions();
  }, FLUSH_INTERVAL_MS);
}

function handleVisibilityChange() {
  if (document.visibilityState === 'hidden') {
    void flushPendingInteractions();
    void updatePresence();
    return;
  }

  void updatePresence();
}

export function initializeInteractionTracking(userId?: string | null) {
  activeUserId = userId ?? null;

  if (typeof window === 'undefined') {
    return () => undefined;
  }

  if (initialized) {
    void updatePresence();
    return () => undefined;
  }

  initialized = true;
  sessionId = getSessionId();
  pendingInteractions = readPendingInteractions();
  if (pendingInteractions > 0) {
    void flushPendingInteractions();
  }
  void updatePresence();

  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('beforeunload', () => {
    void flushPendingInteractions();
    void updatePresence();
  });
  presenceTimer = window.setInterval(() => {
    void updatePresence();
  }, PRESENCE_HEARTBEAT_MS);

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    if (flushTimer !== null) {
      window.clearTimeout(flushTimer);
      flushTimer = null;
    }
    if (presenceTimer !== null) {
      window.clearInterval(presenceTimer);
      presenceTimer = null;
    }
    initialized = false;
  };
}

export function trackInteraction() {
  pendingInteractions += 1;
  persistPendingInteractions();

  if (pendingInteractions >= BATCH_SIZE) {
    void flushPendingInteractions();
    return;
  }

  scheduleFlush();
}
