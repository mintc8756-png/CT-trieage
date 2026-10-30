# Security Specification — Rural PHC Triage System

## 1. Data Invariants
1. **Authentication & Verification**: All reads and writes require `request.auth != null && request.auth.token.email_verified == true`.
2. **Ownership Isolation (`ownerUid`)**: Every document in `/staffProfiles`, `/patients`, `/encounters`, and `/auditLogs` must have `ownerUid == request.auth.uid` on creation, and `resource.data.ownerUid == request.auth.uid` on read (`get` and `list`), update, and delete.
3. **Relational Integrity**: An encounter in `/encounters/{encounterId}` cannot be created unless the referenced `/patients/$(incoming().patientId)` exists and belongs to `request.auth.uid`.
4. **Immutable Audit Trail**: Documents in `/auditLogs/{auditId}` can only be created (`allow update, delete: if false;`).
5. **Immutable Identity & Timestamps**: `id`, `ownerUid`, and `createdAt` (`request.time`) are immutable across all updates; `updatedAt` must equal `request.time`.
6. **Role Lock on Staff Profiles**: `role` and `roleCategory` on `/staffProfiles/{staffId}` cannot be modified after creation.

## 2. The "Dirty Dozen" Payloads
1. **Unauthenticated Write**: Create `/patients/PHC-2026-0101` with `auth = null`.
2. **Unverified Email Spoof**: Create `/patients/PHC-2026-0101` with `email_verified = false`.
3. **Owner Spoofing**: Create `/patients/PHC-2026-0101` with `ownerUid = "other-user-uid"`.
4. **Shadow Field Injection**: Create `/patients/PHC-2026-0101` with extra field `isAdmin: true`.
5. **ID Poisoning**: Create `/patients/invalid..id$$$` with malformed document ID.
6. **String Boundary Overflow**: Create `/patients/PHC-2026-0101` with `fullName` length > 120 chars.
7. **Orphaned Encounter Creation**: Create `/encounters/ENC-2026-0101` referencing a non-existent `patientId`.
8. **Cross-Tenant List Scraping**: Query `/patients` without `where('ownerUid', '==', request.auth.uid)`.
9. **Role Escalation Update**: Update `/staffProfiles/STAFF-1` changing `roleCategory` from `ASHA_NURSE` to `DOCTOR`.
10. **Timestamp Manipulation**: Create `/patients/PHC-2026-0101` with client-forged past `createdAt`.
11. **Audit Log Tampering**: Attempt `update` or `delete` on `/auditLogs/AUD-101`.
12. **Terminal Encounter Mutation**: Attempt to modify `patientId` or `createdAt` on an existing `/encounters/{encounterId}` document.
