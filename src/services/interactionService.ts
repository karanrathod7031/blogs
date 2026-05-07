import { doc, increment, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const STATS_DOC_REF = doc(db, 'system', 'stats');
const PENDING_INTERACTIONS_KEY = 'pending_interactions_v1';
const FLUSH_INTERVAL_MS = 15000;
const BATCH_SIZE = 10;

let pendingInteractions = 0;
let flushTimer: number | null = null;
let initialized = false;
let flushInFlight: Promise<void> | null = null;

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
  }
}

export function initializeInteractionTracking() {
  if (initialized || typeof window === 'undefined') {
    return () => undefined;
  }

  initialized = true;
  pendingInteractions = readPendingInteractions();
  if (pendingInteractions > 0) {
    void flushPendingInteractions();
  }

  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('beforeunload', () => {
    void flushPendingInteractions();
  });

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    if (flushTimer !== null) {
      window.clearTimeout(flushTimer);
      flushTimer = null;
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
