import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import {
  ClassStudentRecord,
  INITIAL_COLLECTIVE_ROSTER,
  COMPETENCY_PILLARS,
  CompetencyPillar,
} from './data/presets';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export function isValidGmailAddress(email: string): boolean {
  const cleaned = (email || '').trim().toLowerCase();
  return /^[a-z0-9._%+-]+@gmail\.com$/i.test(cleaned);
}

export async function signInWithGmailAccount(): Promise<{
  email: string;
  displayName: string;
  uid: string;
}> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  const email = (result.user.email || '').trim().toLowerCase();
  return {
    email,
    displayName: result.user.displayName || '',
    uid: result.user.uid,
  };
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export const isInstructorRecord = (s: ClassStudentRecord): boolean =>
  s.id === 'instructor-gregorio' ||
  s.registration === 'INST-CAS-2026' ||
  s.registration === 'INST-CFOA-2026';

export const isLegacySeededRecord = (s: ClassStudentRecord): boolean => {
  if (!s) return true;
  if (
    s.id === 'instructor-gregorio' ||
    s.id.startsWith('cfoa-pmpe-') ||
    s.id.startsWith('cas-pmpe-')
  ) {
    return true;
  }
  const reg = (s.registration || '').trim().toLowerCase();
  if (!reg.endsWith('@gmail.com')) {
    return true;
  }
  return false;
};

export function toSafeSlug(input: string, maxLen = 60): string {
  const cleaned = (input || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return (cleaned || 'militar').slice(0, maxLen);
}

export function sanitizeDocId(rawId: string): string {
  const cleaned = (rawId || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return (cleaned || `student-${Date.now()}`).slice(0, 120);
}

/**
 * Finds an existing matching student in the roster or generates a deterministic,
 * collision-safe document ID so that no student is ever overwritten or lost.
 */
export function findMatchingStudentInRoster(
  roster: ClassStudentRecord[],
  name: string,
  cohort: string,
  registration: string,
  id?: string
): ClassStudentRecord | undefined {
  const cleanName = name.trim().toLowerCase();
  const cleanCohort = cohort.trim().toLowerCase();
  const cleanReg = registration.trim().toLowerCase();
  const hasRealReg = Boolean(cleanReg && cleanReg !== 'cas-2026' && cleanReg !== 's/m');

  return roster.find((item) => {
    if (id && item.id === id) return true;

    const itemReg = (item.registration || '').trim().toLowerCase();
    const itemHasRealReg = Boolean(itemReg && itemReg !== 'cas-2026' && itemReg !== 's/m');

    // If both have real explicit registrations (e.g. @gmail.com), match if registrations match
    if (hasRealReg && itemHasRealReg) {
      return itemReg === cleanReg;
    }

    const sameName = item.name.trim().toLowerCase() === cleanName;
    const sameCohort =
      !cleanCohort ||
      !item.cohort ||
      item.cohort.trim().toLowerCase() === cleanCohort;

    if (sameName && sameCohort) {
      if (hasRealReg && itemHasRealReg && itemReg !== cleanReg) {
        return false;
      }
      return true;
    }

    return false;
  });
}

export function buildCanonicalStudentId(
  name: string,
  cohort: string,
  registration: string,
  existingId?: string
): string {
  if (existingId && /^[a-zA-Z0-9_-]{1,128}$/.test(existingId)) {
    return existingId;
  }
  const nameSlug = toSafeSlug(name, 48);
  const cohortSlug = toSafeSlug(cohort || 'pmpe', 24);
  const cleanReg = (registration || '').trim().toLowerCase();
  const hasRealReg = Boolean(cleanReg && cleanReg !== 'cas-2026' && cleanReg !== 's/m');
  const regSlug = hasRealReg ? `--${toSafeSlug(cleanReg, 32)}` : '';
  return sanitizeDocId(`mil-${nameSlug}--${cohortSlug}${regSlug}`);
}

export function sanitizeStudentRecordForFirestore(
  student: ClassStudentRecord
): ClassStudentRecord {
  const safeId = buildCanonicalStudentId(
    student.name,
    student.cohort,
    student.registration,
    student.id
  );

  const safeScore = Math.min(100, Math.max(0, Math.round(Number(student.score) || 0)));
  const safeTier: 'Iniciante' | 'Intermediário' | 'Avançado' =
    safeScore >= 80 ? 'Avançado' : safeScore >= 50 ? 'Intermediário' : 'Iniciante';

  const nowTime = new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const safePillarScores: Record<CompetencyPillar, number> = {} as Record<
    CompetencyPillar,
    number
  >;
  COMPETENCY_PILLARS.forEach((p) => {
    const val = student.pillarScores?.[p];
    safePillarScores[p] =
      typeof val === 'number' && !isNaN(val)
        ? Math.min(100, Math.max(0, Math.round(val)))
        : safeScore;
  });

  const rawHistory = Array.isArray(student.history) ? student.history.slice(-45) : [];
  const safeHistory = rawHistory.map((h, i) => ({
    attemptNumber: Number(h.attemptNumber) || i + 1,
    score: Math.min(100, Math.max(0, Math.round(Number(h.score) || 0))),
    tier: (h.tier === 'Avançado' || h.tier === 'Intermediário' || h.tier === 'Iniciante'
      ? h.tier
      : 'Iniciante') as 'Iniciante' | 'Intermediário' | 'Avançado',
    patentTitle: String(h.patentTitle || 'Candidato CFOA').slice(0, 80),
    intimacyLevel: String(h.intimacyLevel || 'Intermediário').slice(0, 80),
    completedAt: String(h.completedAt || nowTime).slice(0, 35),
    date: String(h.date || new Date().toLocaleDateString('pt-BR')).slice(0, 35),
    avgTimeSec: Math.min(3600, Math.max(0, Math.round(Number(h.avgTimeSec) || 8))),
    maxStreak: Math.min(50, Math.max(0, Math.round(Number(h.maxStreak) || 1))),
    correctCount: Math.min(50, Math.max(0, Math.round(Number(h.correctCount) || 0))),
    totalQuestions: Math.min(50, Math.max(1, Math.round(Number(h.totalQuestions) || 10))),
    pillarScores: h.pillarScores || safePillarScores,
    unlockedBadges: Array.isArray(h.unlockedBadges)
      ? h.unlockedBadges.slice(0, 10).map((b) => String(b).slice(0, 80))
      : [],
  }));

  const safeEnrolledAt = String(
    student.enrolledAt || safeHistory[0]?.completedAt || student.completedAt || nowTime
  ).slice(0, 38);
  const safeCompletedAt = String(student.completedAt || safeEnrolledAt || nowTime).slice(
    0,
    38
  );

  const sanitized: ClassStudentRecord = {
    id: safeId,
    name: String(student.name || '2º SGT PM MILITAR').trim().slice(0, 155),
    registration: String(student.registration || '').trim().toLowerCase().slice(0, 75),
    cohort: String(student.cohort || '1º BPM').trim().slice(0, 115),
    score: safeScore,
    tier: safeTier,
    enrolledAt: safeEnrolledAt,
    completedAt: safeCompletedAt,
    status: student.status === 'Em Missão' ? 'Em Missão' : 'Concluído',
    progressQuestions: Math.min(
      50,
      Math.max(0, Math.round(Number(student.progressQuestions ?? 10)))
    ),
    totalQuestionsCount: Math.min(
      50,
      Math.max(1, Math.round(Number(student.totalQuestionsCount ?? 10)))
    ),
    updatedAtMs: Number(student.updatedAtMs) > 0 ? Number(student.updatedAtMs) : Date.now(),
    avgTimeSec: Math.min(3600, Math.max(0, Math.round(Number(student.avgTimeSec ?? 10)))),
    maxStreak: Math.min(50, Math.max(0, Math.round(Number(student.maxStreak ?? 1)))),
    pillarScores: safePillarScores,
    attemptsCount: Math.min(
      500,
      Math.max(1, Math.round(Number(student.attemptsCount || safeHistory.length || 1)))
    ),
    history: safeHistory,
    mode: student.mode === 'Treinamento' ? 'Treinamento' : 'Oficial',
  };

  return sanitized;
}

export async function upsertStudentToFirestore(
  student: ClassStudentRecord
): Promise<ClassStudentRecord> {
  const sanitized = sanitizeStudentRecordForFirestore(student);
  const path = `roster/${sanitized.id}`;
  try {
    await setDoc(doc(db, 'roster', sanitized.id), sanitized);
    return sanitized;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return sanitized;
  }
}

export async function ensureZeroedFirestoreRoster(): Promise<void> {
  const path = 'roster';
  try {
    const snap = await getDocs(collection(db, 'roster'));
    for (const d of snap.docs) {
      const data = d.data() as ClassStudentRecord;
      if (isLegacySeededRecord(data) || localStorage.getItem('cfoa_zero_placar_2026_v1') !== 'done') {
        await deleteDoc(doc(db, 'roster', d.id));
      }
    }
    try {
      localStorage.setItem('cfoa_zero_placar_2026_v1', 'done');
    } catch {}
  } catch (error) {
    // Non-fatal on boot
  }
}

export async function syncLocalRosterToFirestore(
  localRoster: ClassStudentRecord[]
): Promise<void> {
  const validLocal = (localRoster || []).filter((item) => !isLegacySeededRecord(item));
  if (validLocal.length === 0) return;
  const path = 'roster';
  try {
    const snap = await getDocs(collection(db, 'roster'));
    const existingMap = new Map<string, ClassStudentRecord>();
    snap.forEach((d) => {
      const data = d.data() as ClassStudentRecord;
      if (data && data.id && !isLegacySeededRecord(data)) {
        existingMap.set(data.id, data);
      }
    });

    for (const item of validLocal) {
      if (!item || !item.name || isLegacySeededRecord(item)) continue;
      const sanitized = sanitizeStudentRecordForFirestore(item);
      const existing = existingMap.get(sanitized.id);
      if (!existing) {
        await setDoc(doc(db, 'roster', sanitized.id), sanitized);
        existingMap.set(sanitized.id, sanitized);
      } else {
        const existingHistLen = existing.history?.length || 0;
        const incomingHistLen = sanitized.history?.length || 0;
        const incomingNewer =
          (sanitized.updatedAtMs || 0) > (existing.updatedAtMs || 0) ||
          incomingHistLen > existingHistLen;
        if (incomingNewer) {
          await setDoc(doc(db, 'roster', sanitized.id), sanitized);
          existingMap.set(sanitized.id, sanitized);
        }
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function resetFirestoreRoster(_restoreAfternoonLogs = false): Promise<void> {
  const path = 'roster';
  try {
    const snap = await getDocs(collection(db, 'roster'));
    for (const d of snap.docs) {
      await deleteDoc(doc(db, 'roster', d.id));
    }
    for (const item of INITIAL_COLLECTIVE_ROSTER) {
      const sanitized = sanitizeStudentRecordForFirestore(item);
      await setDoc(doc(db, 'roster', sanitized.id), sanitized);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function sortAndDeduplicateRoster(list: ClassStudentRecord[]): ClassStudentRecord[] {
  const byId = new Map<string, ClassStudentRecord>();
  for (const item of list) {
    if (!item || !item.name || isLegacySeededRecord(item)) continue;
    const sanitized = sanitizeStudentRecordForFirestore(item);
    const existing = byId.get(sanitized.id);
    if (!existing) {
      byId.set(sanitized.id, sanitized);
    } else {
      const useIncoming =
        (sanitized.updatedAtMs || 0) >= (existing.updatedAtMs || 0) ||
        (sanitized.history?.length || 0) >= (existing.history?.length || 0);
      byId.set(sanitized.id, useIncoming ? sanitized : existing);
    }
  }

  return Array.from(byId.values()).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (b.updatedAtMs || 0) - (a.updatedAtMs || 0);
  });
}

export function subscribeToCollectiveRoster(
  onUpdate: (roster: ClassStudentRecord[], latestChanged?: ClassStudentRecord) => void
): () => void {
  const path = 'roster';
  return onSnapshot(
    collection(db, 'roster'),
    (snapshot) => {
      const docs: ClassStudentRecord[] = [];
      let newestRecord: ClassStudentRecord | undefined;

      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as ClassStudentRecord;
        if (data && data.name && !isLegacySeededRecord(data)) {
          docs.push(data);
          if (
            !newestRecord ||
            (data.updatedAtMs || 0) > (newestRecord.updatedAtMs || 0)
          ) {
            newestRecord = data;
          }
        }
      });

      const normalized = sortAndDeduplicateRoster(docs);
      onUpdate(normalized, newestRecord);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}
