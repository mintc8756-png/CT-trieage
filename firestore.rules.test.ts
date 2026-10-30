/**
 * Firestore Security Rules Specification Tests ("Dirty Dozen" Verification)
 */
export interface DirtyDozenTestCase {
  id: number;
  name: string;
  collection: string;
  docId: string;
  operation: 'create' | 'update' | 'delete' | 'get' | 'list';
  expectedResult: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TESTS: DirtyDozenTestCase[] = [
  { id: 1, name: 'Unauthenticated Write', collection: 'patients', docId: 'PHC-2026-0101', operation: 'create', expectedResult: 'PERMISSION_DENIED' },
  { id: 2, name: 'Unverified Email Spoof', collection: 'patients', docId: 'PHC-2026-0101', operation: 'create', expectedResult: 'PERMISSION_DENIED' },
  { id: 3, name: 'Owner Spoofing', collection: 'patients', docId: 'PHC-2026-0101', operation: 'create', expectedResult: 'PERMISSION_DENIED' },
  { id: 4, name: 'Shadow Field Injection', collection: 'patients', docId: 'PHC-2026-0101', operation: 'create', expectedResult: 'PERMISSION_DENIED' },
  { id: 5, name: 'ID Poisoning', collection: 'patients', docId: 'bad$id', operation: 'create', expectedResult: 'PERMISSION_DENIED' },
  { id: 6, name: 'String Boundary Overflow', collection: 'patients', docId: 'PHC-2026-0101', operation: 'create', expectedResult: 'PERMISSION_DENIED' },
  { id: 7, name: 'Orphaned Encounter Creation', collection: 'encounters', docId: 'ENC-2026-0101', operation: 'create', expectedResult: 'PERMISSION_DENIED' },
  { id: 8, name: 'Cross-Tenant List Scraping', collection: 'patients', docId: '*', operation: 'list', expectedResult: 'PERMISSION_DENIED' },
  { id: 9, name: 'Role Escalation Update', collection: 'staffProfiles', docId: 'STAFF-1', operation: 'update', expectedResult: 'PERMISSION_DENIED' },
  { id: 10, name: 'Timestamp Manipulation', collection: 'patients', docId: 'PHC-2026-0101', operation: 'create', expectedResult: 'PERMISSION_DENIED' },
  { id: 11, name: 'Audit Log Tampering', collection: 'auditLogs', docId: 'AUD-101', operation: 'delete', expectedResult: 'PERMISSION_DENIED' },
  { id: 12, name: 'Immutable Field Mutation', collection: 'encounters', docId: 'ENC-2026-0101', operation: 'update', expectedResult: 'PERMISSION_DENIED' }
];
