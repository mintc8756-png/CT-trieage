# XOR Triage — Two-Level Clinical Priority System & Offline Patient Receipt Printing

This update transitions **XOR Triage** from a three-tier priority model to a strict **two-level clinical priority system (`EMERGENCY` and `ROUTINE`)** paired with a distinct **`HUMAN_REVIEW_REQUIRED` assessment status**, while introducing a local, offline-capable **Patient Triage & Clinical Handover Receipt** workflow for rural Primary Health Centres (PHCs).

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and clinical workflow decisions were confirmed during interactive clarification and govern this implementation:

- **Confirmed Decision 1 — Borderline / Moderate Clinical Abnormalities**: With `URGENT` removed as a priority tier, borderline or moderate physiological abnormalities (e.g., SpO₂ 90–93%, SBP 160–189 mmHg, pulse 105–134 bpm, respiratory rate 22–29 breaths/min, or high fever ≥ 38.3°C) and incomplete critical vital signs are flagged with assessment status **`HUMAN_REVIEW_REQUIRED`** rather than being silently treated as ordinary `ROUTINE`.
- **Confirmed Decision 2 — Post-Registration Assessment Summary Screen**: Immediately after completing patient registration and triage evaluation (and after acknowledging the Red-Flag modal if `EMERGENCY`), the healthcare worker is presented with a dedicated **Assessment Summary** screen featuring prominent actions to **Print Patient Receipt**, **View Patient Details**, or **Return to Queue**.
- **Confirmed Decision 3 — Unified Branding (`XOR Triage`)**: Both the application interface and the printed clinical handover receipt display **XOR Triage** as the system title alongside the facility name (**Primary Health Centre · Rampur Kalan**).

---

## 1. Overview & Core Concept

- **What It Does**:
  1. **Two-Level Priority System (`EMERGENCY` | `ROUTINE`)**: Eliminates the `URGENT` priority tier across the entire application, clinical engine, queue filters, summary counters, clinician overrides, canonical demo records, and multilingual dictionaries (`English`, `हिन्दी`, `ਪੰਜਾਬੀ`).
  2. **Explicit `AssessmentStatus` (`ASSESSED` | `HUMAN_REVIEW_REQUIRED`)**: Separates clinical priority from assessment completeness/certainty. Any encounter with missing critical vitals, borderline abnormal measurements, or migrated legacy `URGENT` data is explicitly marked `HUMAN_REVIEW_REQUIRED` so it is never silently treated as a normal routine case.
  3. **Offline Patient Receipt & Clinical Handover Printing**: Enables frontline nurses and ANMs to generate, preview, and print a clean, black-and-white A4 clinical handover document (`PATIENT TRIAGE & CLINICAL HANDOVER`) using local browser printing (`window.print()`) with zero dependency on internet connectivity or external APIs.
- **Target Audience / Persona**: Frontline nurses, ANMs, ASHA workers, and Medical Officers operating in rural Primary Health Centres where internet outages are common and patients physically carry paper triage slips from the registration desk to the doctor's consultation room.
- **Key Value**: Ensures uninterrupted clinical safety during internet outages, removes ambiguity between urgent and routine queues, and provides doctors with a structured paper handover sheet containing recorded vitals, rule explanations, missing-data warnings, and dedicated space for handwritten clinical notes.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Online & Offline Registration → Assessment Summary → Receipt Handover**:
   - The nurse registers the patient and records vital signs and symptoms (or marks Medical History Unavailable).
   - The local deterministic triage engine evaluates the presentation immediately and saves the patient, encounter, assessment, and receipt metadata to local IndexedDB (`LOCAL_ONLY` / `PENDING_SYNC` when offline).
   - If `EMERGENCY` criteria are triggered, the mandatory Red-Flag Alert modal appears first for formal acknowledgment.
   - Next, the **Assessment Summary** view displays the outcome (`EMERGENCY`, `ROUTINE`, and whether `HUMAN REVIEW REQUIRED` is active), triggered clinical rules, receipt metadata, and three primary actions: **Print Patient Receipt**, **View Patient Details**, and **Return to Queue**.
2. **Receipt Preview & Native Print Lifecycle**:
   - Clicking **Print Patient Receipt** (from the Assessment Summary, Patient Details header, or Queue row action) opens the **Receipt Preview Modal**.
   - The healthcare worker reviews the formatted black-and-white A4 handover sheet and clicks **Print Receipt** (`window.print()`).
   - Using `beforeprint` and `afterprint` lifecycle tracking plus explicit user confirmation, the interface distinguishes between **Receipt Generated**, **Print Dialog Opened**, and **Print Outcome Confirmed / Unknown**, allowing immediate retry if a printer is offline or cancelled.
3. **Live Triage Queue & Doctor Priority Grouping**:
   - **Summary Strip**: Displays 4 cards — **Emergency Patients** (Immediate attention), **Routine Patients** (Standard clinical queue), **Awaiting Assessment** (Care status counter), and **Human Review Required** (Incomplete or borderline cases requiring clinician verification).
   - **Queue Filters**: Segmented filter buttons for **All Patients**, **Emergency**, **Routine**, **Awaiting Assessment**, **Human Review Required**, and **Offline Pending**.
   - **Two-Group Priority Ordering**: Queue sorting orders active `EMERGENCY` patients first, followed by `HUMAN_REVIEW_REQUIRED` cases, and then standard `ROUTINE` patients ordered by arrival timestamp.

### Visual Identity & Theme

- **Aesthetic Direction**: Minimalist clinical dashboard adhering to high-contrast tabular precision on screen, paired with a zero-clutter monochrome A4 print stylesheet for physical paper output.
- **Color Palette & Mood**:
  - **Canvas & Surfaces**: Cool alabaster canvas (`#F8FAFC`), crisp white structural cards (`#FFFFFF`), and subtle `1px` slate hairline borders (`#E2E8F0`).
  - **Semantic Status Accents**:
    - `EMERGENCY`: Crimson alert (`#DC2626` border/badge, `#FEF2F2` surface tint).
    - `ROUTINE`: Emerald nominal (`#16A34A` badge, `#F0FDF4` surface tint).
    - `HUMAN_REVIEW_REQUIRED`: Amber safeguard notice (`#D97706` border/badge, `#FFFBEB` surface tint) — always rendered as an assessment status alongside the priority, never as a third priority level.
- **Typography & Hierarchy**:
  - Display headings in `Plus Jakarta Sans`, body prose in `DM Sans`, full Indic script coverage in `Noto Sans Devanagari` and `Noto Sans Gurmukhi`, and all vital signs, timestamps, and receipt/patient IDs in `JetBrains Mono` with `font-variant-numeric: tabular-nums`.
- **Print Stylesheet (`@media print`)**:
  - Page configured to `size: A4; margin: 12mm;` with pure white background (`#FFFFFF`), crisp black text (`#000000`), thin `1px solid #000` table borders, `page-break-inside: avoid` on clinical sections, and `.no-print { display: none !important; }` hiding all dashboard chrome.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1 — Strict Separation of `TriagePriority` and `AssessmentStatus`**:
  - *Chosen Approach*: `TriagePriority` is strictly `'EMERGENCY' | 'ROUTINE'`. Every assessment also carries `assessmentStatus: 'ASSESSED' | 'HUMAN_REVIEW_REQUIRED'`.
  - *Why*: Prevents incomplete or borderline cases from creating a confusing third priority tier while guaranteeing they are never silently merged into normal routine cases.
- **Decision 2 — Non-Destructive Legacy `URGENT` Data Migration**:
  - *Chosen Approach*: On IndexedDB initialization, any existing encounter or historical assessment stored with a legacy `'URGENT'` priority is safely migrated in-place to `priority: 'ROUTINE'` with `assessmentStatus: 'HUMAN_REVIEW_REQUIRED'`, `requiresHumanReview: true`, and an explicit audit trail / migration notice preserving the original historical priority (`legacyPriority: 'URGENT'`) for clinical transparency.
  - *Why*: Preserves all existing patient records without data loss while ensuring no legacy record is silently treated as a normal routine case.
- **Decision 3 — Deterministic Offline Receipt & Non-Sensitive SVG QR Reference**:
  - *Chosen Approach*: Each encounter generates a deterministic, immutable receipt record (`RCP-2026-XXXX`) stored locally in IndexedDB. The receipt footer includes a lightweight, locally rendered SVG QR matrix encoding only non-sensitive reference identifiers (`{ app: "XOR-TRIAGE", receiptId, patientId, encounterId }`).
  - *Why*: Works 100% offline with zero external libraries or network calls, and protects patient privacy by excluding symptoms, vitals, and phone numbers from the QR payload.

---

## 4. Technical Architecture & Data Strategy

### Architecture & Component Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        XOR TRIAGE APPLICATION SHELL                          │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ Header (Network Event Listener, Online/Offline Toggle, i18n, Staff)    │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ Navigation (Live Triage Queue [Emergency Badge] | New Registration)    │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                      │                                       │
│        ┌─────────────────────────────┼─────────────────────────────┐         │
│        ▼                             ▼                             ▼         │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌────────────────────┐  │
│  │ Live Triage Queue    │  │ New Registration     │  │ Patient Details &  │  │
│  │ • 4 Summary Cards    │  │ • Sec A: Patient     │  │ CDS Report         │  │
│  │ • Two-Level Priority │  │ • Sec B: Vitals      │  │ • Vitals Analysis  │  │
│  │ • Human Review Flag  │  │ • Sec C: History     │  │ • Reassessment     │  │
│  │ • Quick Print Action │  │   (Optional/Unavail) │  │ • 2-Tier Override  │  │
│  └──────────┬───────────┘  └──────────┬───────────┘  └─────────┬──────────┘  │
│             │                         │                        │             │
│             │                         ▼                        │             │
│             │              ┌──────────────────────┐            │             │
│             │              │ Post-Intake Summary  │            │             │
│             │              │ • Priority & Status  │            │             │
│             │              │ • Triggered Rules    │            │             │
│             │              │ • Print / View / Back│            │             │
│             │              └──────────┬───────────┘            │             │
│             └─────────────────────────┼────────────────────────┘             │
│                                       ▼                                      │
│                    ┌─────────────────────────────────────┐                   │
│                    │ Printable Patient Receipt Modal     │                   │
│                    │ • Screen Preview & Print Lifecycle  │                   │
│                    │ • Dedicated @media print A4 Layout  │                   │
│                    │ • Doctor Handwritten Notes Section  │                   │
│                    └──────────────────┬──────────────────┘                   │
│                                       ▼                                      │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ Local Persistence & Sync Engine (IndexedDB · AITriage_RuralPHC_DB)     │  │
│  │ • Stores: patients, encounters, assessments, auditLogs                 │  │
│  │ • Legacy URGENT Migration Guard + Conflict-Safe Online Reconciliation  │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Data Model & State Updates

- **Priority & Assessment Status Types**:
  - `TriagePriority = 'EMERGENCY' | 'ROUTINE'` (aliased with `ClinicalPriority` for compatibility).
  - `AssessmentStatus = 'ASSESSED' | 'HUMAN_REVIEW_REQUIRED'`.
  - `ReceiptPrintStatus = 'NOT_PRINTED' | 'RECEIPT_GENERATED' | 'PRINT_DIALOG_OPENED' | 'PRINT_OUTCOME_UNKNOWN' | 'PRINTED_CONFIRMED'`.
- **Receipt Metadata on Encounter**:
  - Every `Encounter` stores `receiptId` (e.g., `RCP-2026-4812`), `arrivalTimestamp`, `registeredAt`, `receiptGeneratedAt`, `receiptPrintStatus`, `lastPrintAttemptAt`, and `assessmentStatus`.
- **Synchronization States**:
  - Supports `'LOCAL_ONLY' | 'PENDING_SYNC' | 'SYNCED' | 'SYNC_FAILED'` (with backward-compatible display mapping for existing `'Saved Locally'`, `'Pending Sync'`, and `'Synced'` values).
  - Real browser `window.addEventListener('online', ...)` and `window.addEventListener('offline', ...)` listeners automatically detect connectivity changes, mark offline registrations as `LOCAL_ONLY` / `PENDING_SYNC`, and reconcile pending records when connectivity returns without duplicating IDs or overwriting newer clinical assessments.

### Interactive Component & State Mapping

- **Triage Engine (`evaluateTriage` & `evaluateVitalStatuses`)**:
  - Evaluates all emergency red-flag vitals and symptom combinations (`EMERGENCY`).
  - Evaluates missing critical vitals (`missingInformation.length >= 1` for critical parameters or `>= 2` overall) and borderline abnormal vitals/symptoms (e.g., SpO₂ 90–93%, SBP 160–189 mmHg, HR 105–134 bpm, RR 22–29 breaths/min, Temp ≥ 38.3°C or ≤ 35.0°C, moderate chest pain) by setting `assessmentStatus = 'HUMAN_REVIEW_REQUIRED'` and `requiresHumanReview = true` while keeping `priority = 'ROUTINE'` (unless an `EMERGENCY` rule is also triggered, in which case `priority = 'EMERGENCY'`).
- **Post-Registration Assessment Summary**:
  - Rendered immediately after saving a new registration (and after acknowledging the Red-Flag modal if `EMERGENCY`).
  - Displays the assigned priority (`EMERGENCY` or `ROUTINE`), `HUMAN_REVIEW_REQUIRED` status banner if applicable, triggered rules, and buttons for **Print Patient Receipt**, **View Patient Details**, and **Return to Queue**.
- **Printable Patient Receipt (`PatientReceiptModal` + `.print-receipt`)**:
  - Displays Sections A–H: Health Centre Header, Patient Information, Registration & Assessment Timestamps/Staff, Chief Complaint & Symptoms (with explicit `"Not Available / Not Recorded"` for unavailable/unrecorded fields), Structured Vital Signs Table, Triage Result & Rule Explanations, Doctor's Handwritten Consultation Box (Observations, Clinical Assessment, Instructions, Follow-up, Doctor Name, Signature, Date/Time), and Receipt Identification Footer with non-sensitive SVG QR code and mandatory clinical disclaimer.
