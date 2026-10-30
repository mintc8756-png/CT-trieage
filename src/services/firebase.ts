import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  serverTimestamp,
  enableNetwork,
  disableNetwork
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  Patient,
  Encounter,
  AuditEvent,
  StaffProfile,
  StaffRoleCategory
} from '../types/triage';

const resolvedFirebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfig.appId,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
  firestoreDatabaseId:
    import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || firebaseConfig.firestoreDatabaseId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
};

const app = initializeApp(resolvedFirebaseConfig);
export const db = getFirestore(app, resolvedFirebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

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
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map(provider => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

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

// Defensive sanitization helpers matching firebase-blueprint.json
function sanitizeId(raw: string, fallbackPrefix = 'ID'): string {
  const cleaned = (raw || '')
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .slice(0, 64);
  return cleaned.length > 0 ? cleaned : `${fallbackPrefix}-${Date.now()}`;
}

function toCloudId(uid: string, localId: string, fallbackPrefix: string): string {
  const cleanLocal = sanitizeId(localId, fallbackPrefix);
  const userPrefix = sanitizeId(uid.slice(0, 8), 'USR');
  if (cleanLocal.startsWith(`${userPrefix}-`)) {
    return cleanLocal;
  }
  return sanitizeId(`${userPrefix}-${cleanLocal}`, fallbackPrefix);
}

function sanitizeText(raw: string | undefined, maxLen: number, fallback = 'N/A'): string {
  const trimmed = (raw || '').trim();
  const safe = trimmed.length > 0 ? trimmed : fallback;
  return safe.slice(0, maxLen);
}

export function isCloudAuthReady(): boolean {
  return Boolean(auth.currentUser && auth.currentUser.emailVerified);
}

export async function setFirestoreNetworkState(online: boolean): Promise<void> {
  try {
    if (online) {
      await enableNetwork(db);
    } else {
      await disableNetwork(db);
    }
  } catch {
    // Ignore transient network state transition errors
  }
}

/**
 * Verifies actual internet connectivity using navigator.onLine and an active network probe.
 */
export async function checkActualInternetConnection(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return false;
  }

  if (typeof window === 'undefined' || typeof fetch === 'undefined') {
    return true;
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 3500);

  try {
    await fetch(`https://www.gstatic.com/generate_204?_=${Date.now()}`, {
      method: 'GET',
      mode: 'no-cors',
      cache: 'no-store',
      signal: controller.signal
    });
    window.clearTimeout(timeoutId);
    return true;
  } catch {
    window.clearTimeout(timeoutId);
    // If localhost is not used, try origin HEAD check as fallback in restricted networks
    if (
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1'
    ) {
      const fallbackController = new AbortController();
      const fallbackTimeout = window.setTimeout(() => fallbackController.abort(), 2500);
      try {
        await fetch(`${window.location.origin}/?_netcheck=${Date.now()}`, {
          method: 'HEAD',
          cache: 'no-store',
          signal: fallbackController.signal
        });
        window.clearTimeout(fallbackTimeout);
        return typeof navigator !== 'undefined' ? navigator.onLine : true;
      } catch {
        window.clearTimeout(fallbackTimeout);
        return false;
      }
    }
    return false;
  }
}

export function subscribeToFirebaseAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function signOutFromFirebase(): Promise<void> {
  try {
    if (auth.currentUser) {
      await firebaseSignOut(auth);
    }
  } catch {
    // Ignore sign-out errors when offline
  }
}

/**
 * Signs in with Google Popup and creates/retrieves the StaffProfile in Firestore
 */
export async function signInStaffWithGoogle(
  roleCategory: StaffRoleCategory,
  subRole: 'ANM (Auxiliary Nurse Midwife)' | 'Staff Nurse' | 'ASHA Worker' = 'Staff Nurse'
): Promise<StaffProfile> {
  const credential = await signInWithPopup(auth, googleProvider);
  const user = credential.user;
  const roleTag = roleCategory === 'DOCTOR' ? 'DOC' : 'NUR';
  const staffId = sanitizeId(`STAFF-${roleTag}-${user.uid.slice(0, 10)}`, 'STAFF');

  const defaultPrefix =
    roleCategory === 'DOCTOR'
      ? 'MCI'
      : subRole === 'ASHA Worker'
      ? 'ASHA'
      : subRole === 'ANM (Auxiliary Nurse Midwife)'
      ? 'ANM'
      : 'RN';
  const suffix = Math.floor(1000 + Math.random() * 9000);
  const regNum = sanitizeId(`${defaultPrefix}-2026-${suffix}`, defaultPrefix);
  const assignedRole =
    roleCategory === 'DOCTOR' ? 'Medical Officer (Doctor)' : subRole;
  const displayName = sanitizeText(
    user.displayName || user.email?.split('@')[0] || 'Clinical Staff',
    120,
    'Clinical Staff'
  );

  const fallbackProfile: StaffProfile = {
    id: staffId,
    name: displayName,
    role: assignedRole,
    roleCategory,
    registrationNumber: regNum,
    email: user.email || undefined
  };

  try {
    const existingSnap = await getDoc(doc(db, 'staffProfiles', staffId));
    if (existingSnap.exists()) {
      const data = existingSnap.data();
      return {
        id: data.id || staffId,
        name: data.name || displayName,
        role: data.role || assignedRole,
        roleCategory: data.roleCategory || roleCategory,
        registrationNumber: data.registrationNumber || regNum,
        email: user.email || undefined
      };
    }

    const profilePayload = {
      id: staffId,
      ownerUid: user.uid,
      name: displayName,
      role: assignedRole,
      roleCategory,
      registrationNumber: regNum,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(doc(db, 'staffProfiles', staffId), profilePayload);
  } catch (error) {
    // Log structured error for diagnostics without blocking the authenticated user from signing in
    try {
      handleFirestoreError(error, OperationType.WRITE, `staffProfiles/${staffId}`);
    } catch {
      // Allow login to proceed with the authenticated Google user profile
    }
  }

  return fallbackProfile;
}

export async function syncPatientToFirestore(patient: Patient): Promise<boolean> {
  if (!isCloudAuthReady() || !auth.currentUser) return false;
  const uid = auth.currentUser.uid;
  const docId = toCloudId(uid, patient.id, 'PHC');
  const path = `patients/${docId}`;

  const ageNum = Math.min(120, Math.max(0, Number(patient.age) || 0));
  const genderVal =
    patient.gender === 'Male' || patient.gender === 'Female' || patient.gender === 'Other'
      ? patient.gender
      : 'Other';
  const langVal =
    patient.preferredLanguage === 'hi' || patient.preferredLanguage === 'pa'
      ? patient.preferredLanguage
      : 'en';

  try {
    const existingSnap = await getDoc(doc(db, 'patients', docId));
    if (!existingSnap.exists()) {
      await setDoc(doc(db, 'patients', docId), {
        id: docId,
        ownerUid: uid,
        fullName: sanitizeText(patient.fullName, 120, 'Unknown Patient'),
        age: ageNum,
        gender: genderVal,
        village: sanitizeText(patient.village, 120, 'Unspecified'),
        preferredLanguage: langVal,
        registeredAt: sanitizeText(patient.registeredAt, 64, new Date().toISOString()),
        registeredBy: sanitizeText(patient.registeredBy, 120, 'Clinical Staff'),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } else {
      await updateDoc(doc(db, 'patients', docId), {
        fullName: sanitizeText(patient.fullName, 120, 'Unknown Patient'),
        age: ageNum,
        gender: genderVal,
        village: sanitizeText(patient.village, 120, 'Unspecified'),
        preferredLanguage: langVal,
        updatedAt: serverTimestamp()
      });
    }
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncEncounterToFirestore(encounter: Encounter): Promise<boolean> {
  if (!isCloudAuthReady() || !auth.currentUser) return false;
  const uid = auth.currentUser.uid;
  const docId = toCloudId(uid, encounter.id, 'ENC');
  const cloudPatientId = toCloudId(uid, encounter.patientId, 'PHC');
  const path = `encounters/${docId}`;

  const severityVal =
    encounter.severity === 'Mild' || encounter.severity === 'Moderate' || encounter.severity === 'Severe'
      ? encounter.severity
      : 'Moderate';
  const statusVal =
    encounter.status === 'Awaiting Assessment' ||
    encounter.status === 'Under Clinical Review' ||
    encounter.status === 'Reassessment Required' ||
    encounter.status === 'Completed'
      ? encounter.status
      : 'Awaiting Assessment';
  const priorityVal = encounter.priority === 'EMERGENCY' ? 'EMERGENCY' : 'ROUTINE';
  const assessmentStatusVal =
    encounter.assessmentStatus === 'HUMAN_REVIEW_REQUIRED'
      ? 'HUMAN_REVIEW_REQUIRED'
      : 'ASSESSED';

  try {
    const existingSnap = await getDoc(doc(db, 'encounters', docId));
    if (!existingSnap.exists()) {
      await setDoc(doc(db, 'encounters', docId), {
        id: docId,
        ownerUid: uid,
        patientId: cloudPatientId,
        receiptId: sanitizeId(encounter.receiptId, 'RCP'),
        chiefComplaint: sanitizeText(encounter.chiefComplaint, 500, 'General evaluation'),
        duration: sanitizeText(encounter.duration, 100, 'Not specified'),
        onset: sanitizeText(encounter.onset, 100, 'Gradual'),
        severity: severityVal,
        status: statusVal,
        priority: priorityVal,
        assessmentStatus: assessmentStatusVal,
        syncStatus: 'SYNCED',
        currentAssessmentId: sanitizeId(encounter.currentAssessmentId, 'ASM'),
        arrivalTimestamp: sanitizeText(encounter.arrivalTimestamp, 64, new Date().toISOString()),
        registeredAt: sanitizeText(encounter.registeredAt, 64, new Date().toISOString()),
        receiptGeneratedAt: sanitizeText(encounter.receiptGeneratedAt, 64, new Date().toISOString()),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } else {
      const existingData = existingSnap.data();
      if (existingData.status === 'Completed') {
        await updateDoc(doc(db, 'encounters', docId), {
          status: 'Completed',
          syncStatus: 'SYNCED',
          updatedAt: serverTimestamp()
        });
      } else {
        await updateDoc(doc(db, 'encounters', docId), {
          status: statusVal,
          priority: priorityVal,
          assessmentStatus: assessmentStatusVal,
          syncStatus: 'SYNCED',
          currentAssessmentId: sanitizeId(encounter.currentAssessmentId, 'ASM'),
          updatedAt: serverTimestamp()
        });
      }
    }
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncAuditLogToFirestore(audit: AuditEvent): Promise<boolean> {
  if (!isCloudAuthReady() || !auth.currentUser) return false;
  const uid = auth.currentUser.uid;
  const docId = toCloudId(uid, audit.id, 'AUD');
  const path = `auditLogs/${docId}`;

  try {
    const existingSnap = await getDoc(doc(db, 'auditLogs', docId));
    if (existingSnap.exists()) return true;

    await setDoc(doc(db, 'auditLogs', docId), {
      id: docId,
      ownerUid: uid,
      encounterId: toCloudId(uid, audit.encounterId, 'SYSTEM'),
      patientId: toCloudId(uid, audit.patientId, 'SYSTEM'),
      eventTimestamp: sanitizeText(audit.timestamp, 64, new Date().toISOString()),
      actor: sanitizeText(audit.actor, 120, 'Clinical Staff'),
      actorRole: sanitizeText(audit.actorRole, 64, 'Staff'),
      action: sanitizeText(audit.action, 120, 'Clinical Event'),
      details: sanitizeText(audit.details, 1000, 'Logged event'),
      createdAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deletePatientFromFirestore(
  patientId: string,
  encounterIds: string[]
): Promise<void> {
  if (!isCloudAuthReady() || !auth.currentUser) return;
  const uid = auth.currentUser.uid;

  for (const encId of encounterIds) {
    const safeEncId = toCloudId(uid, encId, 'ENC');
    const encPath = `encounters/${safeEncId}`;
    try {
      const snap = await getDoc(doc(db, 'encounters', safeEncId));
      if (snap.exists()) {
        await deleteDoc(doc(db, 'encounters', safeEncId));
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, encPath);
    }
  }

  const safePatientId = toCloudId(uid, patientId, 'PHC');
  const patPath = `patients/${safePatientId}`;
  try {
    const snap = await getDoc(doc(db, 'patients', safePatientId));
    if (snap.exists()) {
      await deleteDoc(doc(db, 'patients', safePatientId));
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, patPath);
  }
}

export async function fetchOwnedCloudPatientCount(): Promise<number> {
  if (!isCloudAuthReady() || !auth.currentUser) return 0;
  const uid = auth.currentUser.uid;
  try {
    const q = query(collection(db, 'patients'), where('ownerUid', '==', uid));
    const snap = await getDocs(q);
    return snap.size;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'patients');
  }
}
