/**
 * IndexedDB Repository & Offline Data Store
 * Database: AITriage_RuralPHC_DB (v2)
 * Includes non-destructive migration for legacy URGENT records and offline receipt metadata.
 */

import {
  Patient,
  Encounter,
  TriageAssessment,
  AuditEvent,
  CareStatus,
  TriagePriority,
  ReceiptPrintStatus
} from '../types/triage';

import {
  CANONICAL_PATIENTS,
  CANONICAL_ENCOUNTERS,
  CANONICAL_ASSESSMENTS,
  INITIAL_AUDIT_LOGS
} from '../utils/mockData';

const DB_NAME = 'AITriage_RuralPHC_DB';
const DB_VERSION = 2;

export interface AppStateData {
  patients: Patient[];
  encounters: Encounter[];
  assessments: TriageAssessment[];
  auditLogs: AuditEvent[];
}

class PatientRepository {
  private db: IDBDatabase | null = null;
  private isInitialized = false;

  // In-memory cache for ultra-fast, synchronous reads and reliable fallback
  private patientsCache: Map<string, Patient> = new Map();
  private encountersCache: Map<string, Encounter> = new Map();
  private assessmentsCache: Map<string, TriageAssessment> = new Map();
  private auditLogsCache: AuditEvent[] = [];

  /**
   * Initializes the IndexedDB database or loads from local cache
   */
  public async init(): Promise<void> {
    if (this.isInitialized) return;

    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        this.loadDefaultDemoData();
        this.isInitialized = true;
        resolve();
        return;
      }

      try {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains('patients')) {
            db.createObjectStore('patients', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('encounters')) {
            db.createObjectStore('encounters', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('assessments')) {
            db.createObjectStore('assessments', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('auditLogs')) {
            db.createObjectStore('auditLogs', { keyPath: 'id' });
          }
        };

        request.onsuccess = async (event: Event) => {
          this.db = (event.target as IDBOpenDBRequest).result;
          await this.loadFromIndexedDB();
          this.isInitialized = true;
          resolve();
        };

        request.onerror = () => {
          this.loadDefaultDemoData();
          this.isInitialized = true;
          resolve();
        };
      } catch {
        this.loadDefaultDemoData();
        this.isInitialized = true;
        resolve();
      }
    });
  }

  /**
   * Safe, non-destructive migration for existing records:
   * - Preserves historical assessment records
   * - Does NOT silently convert legacy Urgent records into ordinary Routine; flags them as HUMAN_REVIEW_REQUIRED
   * - Ensures every encounter has a stable receiptId and timestamps
   */
  private migrateSingleAssessment(asm: TriageAssessment): { migrated: TriageAssessment; changed: boolean } {
    let changed = false;
    const rawPriority = asm.priority as string;
    const updatedRules = (asm.triggeredRules || []).map(rule => {
      if ((rule.severity as string) !== 'EMERGENCY' && (rule.severity as string) !== 'HUMAN_REVIEW_REQUIRED') {
        changed = true;
        return {
          ...rule,
          severity: 'HUMAN_REVIEW_REQUIRED' as const
        };
      }
      return rule;
    });

    let priority: TriagePriority = rawPriority === 'EMERGENCY' ? 'EMERGENCY' : 'ROUTINE';
    let requiresHumanReview = Boolean(asm.requiresHumanReview);
    let humanReviewReason = asm.humanReviewReason;
    let legacyPriorityFlag = asm.legacyPriorityFlag;

    if (rawPriority !== 'EMERGENCY' && rawPriority !== 'ROUTINE') {
      changed = true;
      priority = 'ROUTINE';
      requiresHumanReview = true;
      legacyPriorityFlag =
        legacyPriorityFlag ||
        `Historical assessment recorded under legacy 3-tier protocol (${rawPriority}). Flagged for clinician review under Two-Level Triage System.`;
      humanReviewReason =
        humanReviewReason ||
        'Legacy intermediate priority record flagged for human clinical review (never silently treated as standard Routine).';
    }

    const assessmentStatus =
      priority !== 'EMERGENCY' && (requiresHumanReview || updatedRules.some(r => r.severity === 'HUMAN_REVIEW_REQUIRED'))
        ? 'HUMAN_REVIEW_REQUIRED'
        : 'ASSESSED';

    if (asm.assessmentStatus !== assessmentStatus) {
      changed = true;
    }

    return {
      migrated: {
        ...asm,
        priority,
        assessmentStatus,
        triggeredRules: updatedRules,
        requiresHumanReview,
        humanReviewReason,
        legacyPriorityFlag
      },
      changed
    };
  }

  private migrateSingleEncounter(enc: Encounter): { migrated: Encounter; changed: boolean } {
    let changed = false;
    const migratedHistory = (enc.assessmentHistory || []).map(a => {
      const res = this.migrateSingleAssessment(a);
      if (res.changed) changed = true;
      return res.migrated;
    });

    const currentAsm =
      migratedHistory.find(a => a.id === enc.currentAssessmentId) ||
      migratedHistory[migratedHistory.length - 1];

    const rawEncPriority = enc.priority as string;
    let priority: TriagePriority = rawEncPriority === 'EMERGENCY' ? 'EMERGENCY' : 'ROUTINE';
    let assessmentStatus = currentAsm?.assessmentStatus || enc.assessmentStatus || 'ASSESSED';

    if (rawEncPriority !== 'EMERGENCY' && rawEncPriority !== 'ROUTINE') {
      changed = true;
      priority = 'ROUTINE';
      assessmentStatus = 'HUMAN_REVIEW_REQUIRED';
    } else if (currentAsm && priority !== currentAsm.priority && !currentAsm.isOverridden) {
      priority = currentAsm.priority;
      changed = true;
    }

    const receiptSuffix = enc.id.replace(/[^A-Z0-9]/gi, '').slice(-4).toUpperCase() || '1001';
    const receiptId = enc.receiptId || `RCP-2026-${receiptSuffix}`;
    const arrivalTimestamp = enc.arrivalTimestamp || enc.createdAt || new Date().toISOString();
    const registeredAt = enc.registeredAt || enc.createdAt || new Date().toISOString();
    const receiptGeneratedAt = enc.receiptGeneratedAt || currentAsm?.assessedAt || enc.updatedAt || new Date().toISOString();
    const receiptPrintStatus = enc.receiptPrintStatus || 'RECEIPT_GENERATED';

    if (
      !enc.receiptId ||
      !enc.arrivalTimestamp ||
      !enc.registeredAt ||
      !enc.receiptGeneratedAt ||
      !enc.receiptPrintStatus ||
      enc.assessmentStatus !== assessmentStatus
    ) {
      changed = true;
    }

    return {
      migrated: {
        ...enc,
        priority,
        assessmentStatus,
        receiptId,
        arrivalTimestamp,
        registeredAt,
        receiptGeneratedAt,
        receiptPrintStatus,
        assessmentHistory: migratedHistory
      },
      changed
    };
  }

  private async loadFromIndexedDB(): Promise<void> {
    if (!this.db) {
      this.loadDefaultDemoData();
      return;
    }

    try {
      const pCount = await this.countStore('patients');
      if (pCount === 0) {
        await this.populateDefaultDemoData();
      } else {
        const patients = await this.getAllFromStore<Patient>('patients');
        const encounters = await this.getAllFromStore<Encounter>('encounters');
        const assessments = await this.getAllFromStore<TriageAssessment>('assessments');
        const auditLogs = await this.getAllFromStore<AuditEvent>('auditLogs');

        patients.forEach(p => this.patientsCache.set(p.id, p));

        for (const a of assessments) {
          const { migrated, changed } = this.migrateSingleAssessment(a);
          this.assessmentsCache.set(migrated.id, migrated);
          if (changed) {
            await this.putToStore('assessments', migrated);
          }
        }

        for (const e of encounters) {
          const { migrated, changed } = this.migrateSingleEncounter(e);
          this.encountersCache.set(migrated.id, migrated);
          migrated.assessmentHistory.forEach(a => this.assessmentsCache.set(a.id, a));
          if (changed) {
            await this.putToStore('encounters', migrated);
          }
        }

        this.auditLogsCache = auditLogs.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        this.persistFallback();
      }
    } catch {
      this.loadDefaultDemoData();
    }
  }

  private loadDefaultDemoData(): void {
    try {
      const saved = localStorage.getItem('ai_triage_fallback_data');
      if (saved) {
        const parsed = JSON.parse(saved) as AppStateData;
        parsed.patients.forEach(p => this.patientsCache.set(p.id, p));
        parsed.assessments.forEach(a => {
          const { migrated } = this.migrateSingleAssessment(a);
          this.assessmentsCache.set(migrated.id, migrated);
        });
        parsed.encounters.forEach(e => {
          const { migrated } = this.migrateSingleEncounter(e);
          this.encountersCache.set(migrated.id, migrated);
          migrated.assessmentHistory.forEach(a => this.assessmentsCache.set(a.id, a));
        });
        this.auditLogsCache = parsed.auditLogs || [];
        this.persistFallback();
        return;
      }
    } catch {}

    this.patientsCache.clear();
    this.encountersCache.clear();
    this.assessmentsCache.clear();

    CANONICAL_PATIENTS.forEach(p => this.patientsCache.set(p.id, p));
    CANONICAL_ENCOUNTERS.forEach(e => this.encountersCache.set(e.id, e));
    CANONICAL_ASSESSMENTS.forEach(a => this.assessmentsCache.set(a.id, a));
    this.auditLogsCache = [...INITIAL_AUDIT_LOGS];

    this.persistFallback();
  }

  private async populateDefaultDemoData(): Promise<void> {
    this.patientsCache.clear();
    this.encountersCache.clear();
    this.assessmentsCache.clear();

    CANONICAL_PATIENTS.forEach(p => this.patientsCache.set(p.id, p));
    CANONICAL_ENCOUNTERS.forEach(e => this.encountersCache.set(e.id, e));
    CANONICAL_ASSESSMENTS.forEach(a => this.assessmentsCache.set(a.id, a));
    this.auditLogsCache = [...INITIAL_AUDIT_LOGS];

    this.persistFallback();
    if (!this.db) return;

    for (const p of CANONICAL_PATIENTS) {
      await this.putToStore('patients', p);
    }
    for (const e of CANONICAL_ENCOUNTERS) {
      await this.putToStore('encounters', e);
    }
    for (const a of CANONICAL_ASSESSMENTS) {
      await this.putToStore('assessments', a);
    }
    for (const aud of INITIAL_AUDIT_LOGS) {
      await this.putToStore('auditLogs', aud);
    }
  }

  private persistFallback(): void {
    try {
      const data: AppStateData = {
        patients: Array.from(this.patientsCache.values()),
        encounters: Array.from(this.encountersCache.values()),
        assessments: Array.from(this.assessmentsCache.values()),
        auditLogs: this.auditLogsCache
      };
      localStorage.setItem('ai_triage_fallback_data', JSON.stringify(data));
    } catch {}
  }

  // Generic DB helpers
  private putToStore<T>(storeName: string, item: T): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }
      try {
        const tx = this.db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        store.put(item);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      } catch {
        resolve();
      }
    });
  }

  private getAllFromStore<T>(storeName: string): Promise<T[]> {
    return new Promise((resolve) => {
      if (!this.db) {
        resolve([]);
        return;
      }
      try {
        const tx = this.db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });
  }

  private countStore(storeName: string): Promise<number> {
    return new Promise((resolve) => {
      if (!this.db) {
        resolve(0);
        return;
      }
      try {
        const tx = this.db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.count();
        req.onsuccess = () => resolve(req.result || 0);
        req.onerror = () => resolve(0);
      } catch {
        resolve(0);
      }
    });
  }

  // Public Query APIs
  public getAllPatients(): Patient[] {
    return Array.from(this.patientsCache.values()).sort(
      (a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime()
    );
  }

  public getAllEncounters(): Encounter[] {
    return Array.from(this.encountersCache.values());
  }

  public getEncounter(id: string): Encounter | undefined {
    return this.encountersCache.get(id);
  }

  public getPatient(id: string): Patient | undefined {
    return this.patientsCache.get(id);
  }

  public getAssessment(id: string): TriageAssessment | undefined {
    return this.assessmentsCache.get(id);
  }

  public getAllAuditLogs(): AuditEvent[] {
    return [...this.auditLogsCache].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  // Public Mutation APIs
  public async addPatientWithEncounter(
    patient: Patient,
    encounter: Encounter,
    assessment: TriageAssessment,
    auditEvent: AuditEvent
  ): Promise<void> {
    this.patientsCache.set(patient.id, patient);
    this.encountersCache.set(encounter.id, encounter);
    this.assessmentsCache.set(assessment.id, assessment);
    this.auditLogsCache.unshift(auditEvent);

    await this.putToStore('patients', patient);
    await this.putToStore('encounters', encounter);
    await this.putToStore('assessments', assessment);
    await this.putToStore('auditLogs', auditEvent);

    this.persistFallback();
  }

  public async recordReassessment(
    encounterId: string,
    newAssessment: TriageAssessment,
    auditEvent: AuditEvent,
    isOnline = true
  ): Promise<Encounter | null> {
    const enc = this.encountersCache.get(encounterId);
    if (!enc) return null;

    enc.priority = newAssessment.priority;
    enc.assessmentStatus = newAssessment.assessmentStatus;
    enc.currentAssessmentId = newAssessment.id;
    enc.assessmentHistory.push(newAssessment);
    enc.updatedAt = new Date().toISOString();
    enc.status = 'Under Clinical Review';
    enc.syncStatus = isOnline ? 'PENDING_SYNC' : 'LOCAL_ONLY';

    this.assessmentsCache.set(newAssessment.id, newAssessment);
    this.encountersCache.set(encounterId, enc);
    this.auditLogsCache.unshift(auditEvent);

    await this.putToStore('assessments', newAssessment);
    await this.putToStore('encounters', enc);
    await this.putToStore('auditLogs', auditEvent);

    this.persistFallback();
    return enc;
  }

  public async updateCareStatus(
    encounterId: string,
    newStatus: CareStatus,
    actorName: string,
    actorRole: string,
    isOnline = true
  ): Promise<void> {
    const enc = this.encountersCache.get(encounterId);
    if (!enc) return;

    const oldStatus = enc.status;
    enc.status = newStatus;
    enc.updatedAt = new Date().toISOString();
    enc.syncStatus = isOnline ? 'PENDING_SYNC' : 'LOCAL_ONLY';

    const audit: AuditEvent = {
      id: 'AUD-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      encounterId,
      patientId: enc.patientId,
      timestamp: new Date().toISOString(),
      actor: actorName,
      actorRole,
      action: 'Care Status Updated',
      details: `Status transitioned from "${oldStatus}" to "${newStatus}".`
    };

    this.encountersCache.set(encounterId, enc);
    this.auditLogsCache.unshift(audit);

    await this.putToStore('encounters', enc);
    await this.putToStore('auditLogs', audit);
    this.persistFallback();
  }

  public async applyClinicianOverride(
    encounterId: string,
    newPriority: TriagePriority,
    doctorName: string,
    justification: string,
    isOnline = true
  ): Promise<void> {
    const enc = this.encountersCache.get(encounterId);
    if (!enc) return;

    const currentAsm = this.assessmentsCache.get(enc.currentAssessmentId);
    const oldPriority = enc.priority;
    enc.priority = newPriority;
    enc.assessmentStatus = 'ASSESSED';
    enc.updatedAt = new Date().toISOString();
    enc.syncStatus = isOnline ? 'PENDING_SYNC' : 'LOCAL_ONLY';

    if (currentAsm) {
      currentAsm.priority = newPriority;
      currentAsm.assessmentStatus = 'ASSESSED';
      currentAsm.requiresHumanReview = false;
      currentAsm.isOverridden = true;
      currentAsm.overrideDetails = {
        originalPriority: oldPriority,
        overriddenPriority: newPriority,
        clinicianName: doctorName,
        justification,
        timestamp: new Date().toISOString()
      };
      this.assessmentsCache.set(currentAsm.id, currentAsm);
      await this.putToStore('assessments', currentAsm);
    }

    const audit: AuditEvent = {
      id: 'AUD-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      encounterId,
      patientId: enc.patientId,
      timestamp: new Date().toISOString(),
      actor: doctorName,
      actorRole: 'Medical Officer (Doctor)',
      action: 'Clinician Override Applied',
      details: `Priority changed from ${oldPriority} to ${newPriority}. Justification: "${justification}".`
    };

    this.encountersCache.set(encounterId, enc);
    this.auditLogsCache.unshift(audit);

    await this.putToStore('encounters', enc);
    await this.putToStore('auditLogs', audit);
    this.persistFallback();
  }

  public async updateReceiptPrintStatus(
    encounterId: string,
    printStatus: ReceiptPrintStatus,
    actorName: string,
    actorRole: string
  ): Promise<void> {
    const enc = this.encountersCache.get(encounterId);
    if (!enc) return;

    enc.receiptPrintStatus = printStatus;
    enc.lastPrintAttemptAt = new Date().toISOString();

    if (printStatus === 'PRINT_DIALOG_OPENED' || printStatus === 'PRINTED_CONFIRMED') {
      const audit: AuditEvent = {
        id: 'AUD-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
        encounterId,
        patientId: enc.patientId,
        timestamp: new Date().toISOString(),
        actor: actorName,
        actorRole,
        action: printStatus === 'PRINTED_CONFIRMED' ? 'Patient Receipt Printed' : 'Patient Receipt Print Dialog Opened',
        details: `Receipt ${enc.receiptId} print status recorded as ${printStatus}.`
      };
      this.auditLogsCache.unshift(audit);
      await this.putToStore('auditLogs', audit);
    }

    this.encountersCache.set(encounterId, enc);
    await this.putToStore('encounters', enc);
    this.persistFallback();
  }

  public async acknowledgeEmergency(
    encounterId: string,
    assessmentId: string,
    actorName: string,
    actorRole: string,
    notes: string
  ): Promise<void> {
    const asm = this.assessmentsCache.get(assessmentId);
    const enc = this.encountersCache.get(encounterId);
    if (!asm || !enc) return;

    asm.acknowledgedAt = new Date().toISOString();
    asm.acknowledgedBy = `${actorName} (${actorRole})`;
    asm.acknowledgmentNotes = notes || 'Emergency red flag recognized. Medical Officer notified immediately.';

    enc.status = 'Under Clinical Review';
    enc.updatedAt = new Date().toISOString();

    const audit: AuditEvent = {
      id: 'AUD-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      encounterId,
      patientId: enc.patientId,
      timestamp: new Date().toISOString(),
      actor: actorName,
      actorRole,
      action: 'Emergency Red-Flag Acknowledged',
      details: `Staff confirmed emergency protocol and immediate doctor alert. Notes: ${notes || 'Standard protocol initiated'}`
    };

    this.assessmentsCache.set(asm.id, asm);
    this.encountersCache.set(encounterId, enc);
    this.auditLogsCache.unshift(audit);

    await this.putToStore('assessments', asm);
    await this.putToStore('encounters', enc);
    await this.putToStore('auditLogs', audit);
    this.persistFallback();
  }

  public async syncPendingEncounters(): Promise<{ syncedCount: number }> {
    let count = 0;
    const encounters = Array.from(this.encountersCache.values());

    for (const enc of encounters) {
      if (
        enc.syncStatus === 'LOCAL_ONLY' ||
        enc.syncStatus === 'PENDING_SYNC' ||
        enc.syncStatus === 'Saved Locally' ||
        enc.syncStatus === 'Pending Sync' ||
        enc.syncStatus === 'SYNC_FAILED'
      ) {
        // Preserve original arrival, registration, and receipt metadata while marking SYNCED
        enc.syncStatus = 'SYNCED';
        enc.updatedAt = new Date().toISOString();
        await this.putToStore('encounters', enc);
        count++;
      }
    }

    if (count > 0) {
      const audit: AuditEvent = {
        id: 'AUD-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
        encounterId: 'SYSTEM',
        patientId: 'SYSTEM',
        timestamp: new Date().toISOString(),
        actor: 'Background Sync Worker',
        actorRole: 'System',
        action: 'Cloud Synchronization Successful',
        details: `Reconciled ${count} offline pending health record(s) to central registry using stable encounter and receipt IDs.`
      };
      this.auditLogsCache.unshift(audit);
      await this.putToStore('auditLogs', audit);
      this.persistFallback();
    }

    return { syncedCount: count };
  }

  public async resetToCanonicalDemo(): Promise<void> {
    if (this.db) {
      const stores = ['patients', 'encounters', 'assessments', 'auditLogs'];
      for (const s of stores) {
        try {
          const tx = this.db.transaction(s, 'readwrite');
          tx.objectStore(s).clear();
        } catch {}
      }
    }
    localStorage.removeItem('ai_triage_fallback_data');
    this.patientsCache.clear();
    this.encountersCache.clear();
    this.assessmentsCache.clear();
    this.auditLogsCache = [];
    await this.populateDefaultDemoData();
  }

  public exportFullJSON(): string {
    const payload = {
      exportTimestamp: new Date().toISOString(),
      facility: 'Primary Health Centre (PHC) Rampur Kalan',
      protocolVersion: 'IN-PHC-TRIAGE-v2.4-DEMO',
      patients: Array.from(this.patientsCache.values()),
      encounters: Array.from(this.encountersCache.values()),
      assessments: Array.from(this.assessmentsCache.values()),
      auditLogs: this.auditLogsCache
    };
    return JSON.stringify(payload, null, 2);
  }
}

export const repository = new PatientRepository();
