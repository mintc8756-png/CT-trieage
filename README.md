# XOR Triage — Clinical Decision Support & Offline Handover System for Rural Health Centres
**System Architecture, Two-Level Clinical Triage Protocol, Offline Receipt Printing, and User Guide**

---

## 1. Executive Summary
**XOR Triage** (`v2.4`) is an offline-first Clinical Decision Support (CDS), patient queue management, and physical clinical handover web application engineered for **Primary Health Centres (PHCs), Sub-Centres, and Community Health Centres (CHCs)** in rural India.

Designed for frontline healthcare workers—including **Auxiliary Nurse Midwives (ANMs), ASHA workers, Staff Nurses, and Medical Officers**—the system standardizes patient intake, captures vital signs and presenting symptoms, evaluates clinical urgency using a deterministic two-level rule engine (`IN-PHC-TRIAGE-v2.4-DEMO`), prints structured A4 paper handover receipts (`window.print()`) for consulting doctors, and maintains a real-time, priority-sorted outpatient queue even during complete internet outages.

---

## 2. Problem Statement & Target Environment
Rural health facilities face recurring operational bottlenecks at registration desks:
1. **High Patient Volume & First-Come-First-Served Risk:** Critical patients (e.g., silent hypoxemia, evolving acute coronary syndrome, severe dehydration, hyperpyrexia) can wait in long outpatient queues behind routine cases if structured triage is not performed at intake.
2. **Incomplete Medical History or Unmeasurable Vitals:** Patients may arrive without prior medical records or when a device (e.g., BP cuff or thermometer) is temporarily unmeasurable. Systems must distinguish between *unrecorded*, *explicitly unavailable*, and *normal* findings.
3. **Unreliable Network Connectivity & Paper-to-Doctor Handover:** Rural clinics frequently experience cellular or broadband outages, and consulting doctors often rely on a physical outpatient slip during examination.

**XOR Triage** solves these challenges by running its deterministic clinical rule engine, multilingual interface (**English, Hindi, and Punjabi**), A4 receipt generator, and transactional database **100% locally in the browser** via IndexedDB, automatically reconciling records when connectivity returns.

---

## 3. Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 19** (`react`, `react-dom`) | Component-based architecture using React Hooks (`useState`, `useEffect`, `useMemo`, `useCallback`) for zero-latency UI updates. |
| **Language** | **TypeScript** (`typescript`) | Strict compile-time type safety for clinical data structures (`Patient`, `Encounter`, `VitalSigns`, `TriageAssessment`, `AuditEvent`). |
| **Styling & Print Layout** | **Tailwind CSS v4** (`@tailwindcss/vite`) | Fluid responsive grids across desktop/tablet/mobile and dedicated `@media print` A4 black-and-white clinical receipt rules. |
| **Typography** | **Plus Jakarta Sans**, **DM Sans**, **JetBrains Mono**, **Noto Sans Devanagari / Gurmukhi** | Scannable headings, multilingual clinical legibility, and tabular numerals (`tabular-nums`) for vital sign alignment. |
| **Iconography** | **Lucide React** (`lucide-react`) | Crisp SVG icons paired with explicit text labels so clinical urgency is never communicated by color alone. |
| **Offline Database** | **Browser IndexedDB API** (`AITriage_RuralPHC_DB`) | Client-side transactional NoSQL database with 4 object stores (`patients`, `encounters`, `assessments`, `auditLogs`) + `localStorage` fallback. |
| **Build Tooling** | **Vite** (`vite`, `@vitejs/plugin-react`) | Fast ES module bundling and local development server. |

---

## 4. Core Clinical Safety Principles & Guardrails

1. **Two-Level Triage Priority + Separate Assessment Status:**
   - **Triage Priorities (`TriagePriority`):** Strictly two priority levels exist across the system: **`EMERGENCY`** and **`ROUTINE`**.
   - **Assessment Status (`AssessmentStatus`):** Every evaluation produces an explicit assessment state: **`ASSESSED`** or **`HUMAN_REVIEW_REQUIRED`**.
   - Borderline/moderate physiological abnormalities or incomplete critical vitals are flagged as **`HUMAN_REVIEW_REQUIRED`** so they are never silently treated as ordinary Routine cases.
2. **Missing Vital Signs & Medical History Safeguard ("Never Assume Normal"):**
   - If a vital sign cannot be measured at intake, staff mark **"Unavailable"**. The engine records `UNAVAILABLE`, flags `HUMAN_REVIEW_REQUIRED`, and alerts the consulting clinician rather than substituting `0` or assuming normal physiology.
   - Section C (*Medical History & Additional Information*) is optional and includes an explicit **"Information Unavailable"** toggle that records unavailability distinctly without blocking registration.
3. **Mandatory Emergency Red-Flag Acknowledgement:**
   - When an **`EMERGENCY`** criterion is triggered, a high-contrast modal blocks standard routing until the healthcare worker acknowledges the emergency and logs action notes to the immutable audit trail.
4. **No Automated Priority Downgrading:**
   - If a patient previously triaged as **`EMERGENCY`** undergoes reassessment, the rule engine blocks automatic downgrading to **`ROUTINE`**. Downgrades require an explicit **Clinician Override** by a Medical Officer with a mandatory written clinical justification.
5. **Safe Legacy Record Migration:**
   - Any historical records from older priority schemas are automatically migrated on initialization to `priority: 'ROUTINE'` with `assessmentStatus: 'HUMAN_REVIEW_REQUIRED'` and an explicit legacy review notice so no patient data is lost or silently downgraded.
6. **Mandatory Clinical Disclaimer:**
   > *"This document contains initial registration and triage information. It is not a diagnosis or a substitute for clinical examination."*

---

## 5. Two-Level Clinical Triage Protocol (`IN-PHC-TRIAGE-v2.4-DEMO`)

### Priority & Assessment States
* **EMERGENCY (`priority: 'EMERGENCY'`, `assessmentStatus: 'ASSESSED'`):** Immediate resuscitation, stabilization, and physician intervention required.
* **ROUTINE — HUMAN REVIEW REQUIRED (`priority: 'ROUTINE'`, `assessmentStatus: 'HUMAN_REVIEW_REQUIRED'`):** Borderline/abnormal physiological findings or unmeasurable critical vitals requiring direct nurse/doctor verification.
* **ROUTINE — ASSESSED (`priority: 'ROUTINE'`, `assessmentStatus: 'ASSESSED'`):** Complete physiological parameters within standard adult reference limits and no red-flag symptoms.

### Deterministic Rule Matrix

| Clinical Parameter | EMERGENCY Criteria (`EMERGENCY`) | Human Review Criteria (`HUMAN_REVIEW_REQUIRED`) | Standard Reference (`ASSESSED`) |
| :--- | :--- | :--- | :--- |
| **Oxygen Saturation ($\text{SpO}_2$)** | `< 90%` (`V-SPO2-EMERGENCY`) | `90% – 93%` (`V-SPO2-ABNORMAL`) | `95% – 100%` |
| **Blood Pressure (BP)** | `SBP ≥ 190` or `DBP ≥ 120 mmHg` (`V-BP-EMERGENCY-HIGH`)<br>`SBP < 90 mmHg` (`V-BP-EMERGENCY-LOW`) | `SBP 160–189` or `DBP 100–119 mmHg` (`V-BP-ABNORMAL-HIGH`)<br>`SBP 90–99 mmHg` (`V-BP-BORDERLINE-LOW`) | `100–139 / 60–89 mmHg` |
| **Pulse / Heart Rate** | `≥ 135 bpm` or `≤ 40 bpm` (`V-HR-EMERGENCY`) | `105–134 bpm` or `41–50 bpm` (`V-HR-ABNORMAL`) | `60 – 100 bpm` |
| **Respiratory Rate (RR)** | `≥ 30` or `≤ 8 breaths/min` (`V-RR-EMERGENCY`) | `22–29 breaths/min` (`V-RR-ABNORMAL`) | `12 – 20 breaths/min` |
| **Body Temperature** | `≥ 39.5°C / 103.1°F` (`V-TEMP-EMERGENCY-HIGH`) | `38.3°C – 39.4°C` (`V-TEMP-FEVER`)<br>`≤ 35.0°C / 95.0°F` (`V-TEMP-LOW`) | `36.5°C – 37.5°C` |
| **Red-Flag Symptoms** | Audible stridor, severe dyspnea (`SYMP-AIRWAY-EMERGENCY`)<br>Convulsions, snake bite, head trauma, loss of consciousness (`SYMP-CRITICAL-RED-FLAG`)<br>Radiating chest pain + diaphoresis (`SYMP-CHEST-SEVERE`) | Moderate/isolated acute chest pain (`SYMP-CHEST-REVIEW`) | Mild cough, runny nose, sore throat |
| **High-Risk Combinations** | Chest pain + $\text{SpO}_2 < 94\%$ (`COMB-CHEST-HYPOXIA`) | — | — |
| **Missing Data Safeguard** | — | $\ge 2$ missing vitals or missing BP + Pulse (`SAFETY-INCOMPLETE-DATA`) | All key vitals recorded |

---

## 6. Offline Patient Receipt & Clinical Handover System

Every registered encounter generates a unique receipt number (`RCP-2026-XXXX`) and can be printed immediately—even with zero internet connectivity—using the browser's native print engine (`window.print()`).

### Printable A4 Handover Document Structure (`Sections A–H`)
* **Section A — Health Centre Information:** Displays `XOR Triage`, facility name (`Primary Health Centre · Rampur Kalan`), document title (`PATIENT TRIAGE & CLINICAL HANDOVER`), Receipt Number, Print Date/Time, and Online/Offline mode badge.
* **Section B — Patient Information:** Patient ID (`PHC-2026-XXXX`), Full Name, Age, Sex, Village/Locality, Mobile Number, Accompanying Person, and Preferred Language.
* **Section C — Registration & Assessment Log:** Encounter ID, Original Arrival Time, Registration Time, Registration Staff Member, Nurse Assessment Time, and Assessing Clinician.
* **Section D — Chief Complaint, Symptoms & History:** Primary Complaint, Reported Symptoms, Onset & Duration, Past Medical History, Current Medications, Known Allergies, and Additional Nurse Notes. Explicitly prints `"Not Available / Not Recorded"` when Section C is marked unavailable or left blank.
* **Section E — Physiological Vital Signs Table:** Structured table (`Measurement | Recorded Value | Unit | Normal Reference | Clinical Flag`) for Blood Pressure (`mmHg`), $\text{SpO}_2$ (`%`), Pulse (`bpm`), Respiratory Rate (`breaths/min`), and Temperature (`°C`), plus measurement timestamp.
* **Section F — Triage Decision Support Result:** High-contrast black-and-white badge for **`EMERGENCY`** or **`ROUTINE`**, assessment status (**`ASSESSED`** or **`HUMAN REVIEW REQUIRED`**), triggered rules with observed findings, and missing-data warnings.
* **Section G — Doctor Consultation & Clinical Notes (Handwritten Area):** Structured blank writing boxes on the printed sheet for *Doctor's Observations & Examination Findings*, *Clinical Assessment / Provisional Diagnosis*, *Treatment & Medication Instructions*, *Follow-up / Referral Recommendations*, *Doctor's Name*, *Signature*, and *Consultation Date & Time*.
* **Section H — Receipt Identification, Local QR & Disclaimer:** Footer with Receipt ID, Patient ID, Encounter ID, version (`v2.4`), printed timestamp, a deterministic offline SVG verification QR code (encoding only non-sensitive identifiers `{ app: "XOR-TRIAGE", receiptId, patientId, encounterId }`), and the mandatory clinical disclaimer.

### Print Preview & Failure Handling
* Tracks receipt print states (`RECEIPT_GENERATED`, `PRINT_DIALOG_OPENED`, `PRINT_OUTCOME_UNKNOWN`, `PRINTED_CONFIRMED`) via `beforeprint` and `afterprint` events.
* Because browsers cannot detect whether a user confirmed or cancelled the OS print dialog, the preview modal clearly informs the user after the dialog closes, preserves the local record safely, and offers one-click **Print Receipt** (retry) and **Confirm Printed** actions.

---

## 7. Functional Module Breakdown

### 1. Live Triage Queue (`src/components/QueueView.tsx`)
* **Summary Cards:** Interactive counters for *Emergency Patients*, *Routine Patients*, *Awaiting Assessment*, and *Human Review Required*.
* **Queue Filters:** Filter by *All Patients*, *Emergency*, *Routine*, *Awaiting Assessment*, *Human Review Required*, or *Offline Pending*; instant search across Name, Patient ID, Receipt ID, Village, Complaint, and Symptoms.
* **Queue Sorting:** Sorts by **Priority First** (`EMERGENCY` ➔ `ROUTINE` with `HUMAN_REVIEW_REQUIRED` ➔ standard `ROUTINE`), then by **Oldest Arrival/Registration Time First**.
* **Quick Actions:** Direct **Receipt** print preview button and **Details** view button on every row/card.

### 2. New Patient Intake & Triage (`src/components/RegistrationView.tsx`)
* **Section A — Patient Information:** Responsive 4-column desktop grid capturing Full Name, Age, Gender, Village/Locality, Mobile Contact, and Accompanying Person, with auto-generated Patient ID (`PHC-2026-XXXX`) and Receipt ID (`RCP-2026-XXXX`).
* **Section B — Vital Signs:** Responsive 3-column desktop grid for Blood Pressure, $\text{SpO}_2$, Pulse Rate, Respiratory Rate, and Body Temperature with strict physiological bounds and individual **"Unavailable"** checkboxes.
* **Section C — Medical History & Additional Information (Optional):** Includes an **"Information Unavailable"** toggle, multi-select symptom tags, chief complaint input, onset/duration/severity selectors, past medical history tags, current medications, allergies, and clinical notes.

### 3. Post-Registration Assessment Summary (`src/components/AssessmentSummaryView.tsx`)
* Appears immediately after patient registration and triage evaluation (after Red-Flag acknowledgement if `EMERGENCY`), displaying the assigned priority, assessment status, receipt number, local/sync storage badge, triggered clinical rules, and three primary actions: **Print Patient Receipt**, **View Patient Details**, and **Return to Live Queue**.

### 4. Patient Detail, CDS Report & Reassessment (`src/components/PatientDetailView.tsx`)
* **Care Status Workflow:** Transition patients across `Awaiting Assessment`, `Under Clinical Review`, `Reassessment Required`, and `Completed`.
* **Reassessment Workflow (`+ Record Reassessment`):** Captures updated vital signs, generates a new versioned assessment (`v2`, `v3`), updates queue priority, and enables **Print Latest Receipt**.
* **Two-Level Clinician Override:** Allows authorized Medical Officers to override between `EMERGENCY` and `ROUTINE` with mandatory written clinical justification.

### 5. Multilingual Interface (`src/i18n/`)
* Full UI localization across **English (`en`)**, **Hindi (`hi`)**, and **Punjabi (`pa` - Gurmukhi)** persisted in `localStorage`.

---

## 8. Pre-Loaded Clinical Demonstration Scenarios

| Case | Patient ID & Receipt | Name & Age/Sex | Presentation & Vitals | Priority & Assessment Status | Clinical Feature Demonstrated |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | `PHC-2026-0101`<br>`RCP-2026-0101` | **Ramesh Kumar**<br>58y / M | Retrosternal chest pain radiating to left arm, cold sweats.<br>$\text{SpO}_2\ 88\%$, $\text{BP}\ 154/96\ \text{mmHg}$ | **EMERGENCY** · `ASSESSED` | High-risk combination (`COMB-CHEST-HYPOXIA`) + Mandatory Red-Flag Acknowledgement. |
| **2** | `PHC-2026-0102`<br>`RCP-2026-0102` | **Priya Patel**<br>34y / F | 3-day high fever with rigors.<br>$\text{Temp}\ 39.6^\circ\text{C}$, $\text{Pulse}\ 118\ \text{bpm}$ | **EMERGENCY** · `ASSESSED` | Critical hyperpyrexia (`V-TEMP-EMERGENCY-HIGH`, $\ge 39.5^\circ\text{C}$) + tachycardia. |
| **3** | `PHC-2026-0103`<br>`RCP-2026-0103` | **Anil Sharma**<br>22y / M | Mild dry cough & cold for 5 days.<br>$\text{SpO}_2\ 98\%$, $\text{BP}\ 118/76\ \text{mmHg}$, $\text{HR}\ 72\ \text{bpm}$ | **ROUTINE** · `ASSESSED` | Normal physiological parameters; standard outpatient queue placement. |
| **4** | `PHC-2026-0104`<br>`RCP-2026-0104` | **Meena Bai**<br>45y / F | Severe acute breathlessness, audible stridor.<br>$\text{SpO}_2\ 84\%$, $\text{RR}\ 34\ \text{breaths/min}$ | **EMERGENCY** · `ASSESSED` | Acute airway & respiratory emergency (`SYMP-AIRWAY-EMERGENCY`). |
| **5** | `PHC-2026-0105`<br>`RCP-2026-0105` | **Sunil Verma**<br>36y / M | Repeated vomiting, severe dizziness, dehydration.<br>$\text{BP}$ & $\text{Pulse}$ marked **UNAVAILABLE** | **ROUTINE** · `HUMAN_REVIEW_REQUIRED` | Missing vital signs safeguard (`SAFETY-INCOMPLETE-DATA`); prevents silent normal Routine classification. |
| **6** | `PHC-2026-0106`<br>`RCP-2026-0106` | **Kavita Devi**<br>40y / F | Initial intake: Routine viral fever ($\text{SpO}_2\ 96\%$).<br>Reassessment: $\text{SpO}_2$ dropped to $89\%$, $\text{RR}\ 28$. | **EMERGENCY** · `ASSESSED` (v2) | Longitudinal reassessment workflow (`v1 Routine` ➔ `v2 Emergency`). |

---

## 9. File & Directory Structure

```text
/
├── index.html                              # HTML entry point & Google Fonts configuration
├── metadata.json                           # Application metadata & capabilities
├── package.json                            # Dependencies and scripts (dev, build, lint)
├── README.md                               # Complete system & clinical documentation
└── src/
    ├── main.tsx                            # React DOM root mount
    ├── App.tsx                             # Root state controller, online/offline sync & modal orchestration
    ├── index.css                           # Tailwind v4 configuration, fluid grids & @media print A4 rules
    ├── i18n/
    │   ├── index.tsx                       # Language context provider & translation hook (en, hi, pa)
    │   └── translations/
    │       ├── en.ts                       # English dictionary
    │       ├── hi.ts                       # Hindi (Devanagari) dictionary
    │       └── pa.ts                       # Punjabi (Gurmukhi) dictionary
    ├── types/
    │   └── triage.ts                       # TypeScript interfaces for Two-Level Triage & Offline Receipts
    ├── services/
    │   ├── triageEngine.ts                 # Deterministic two-level rule evaluator (IN-PHC-TRIAGE-v2.4-DEMO)
    │   └── patientRepository.ts            # IndexedDB persistence layer, legacy migration & sync methods
    ├── utils/
    │   └── mockData.ts                     # 6 canonical rural PHC cases, staff profiles & audit logs
    └── components/
        ├── Header.tsx                      # XOR Triage bar, Online/Offline toggle, language & staff switchers
        ├── Navigation.tsx                  # Primary workspace navigation tabs with live Emergency badge
        ├── QueueView.tsx                   # Priority-sorted queue table, Human Review filter & receipt triggers
        ├── RegistrationView.tsx            # Restructured Section A/B/C intake form with responsive grids
        ├── AssessmentSummaryView.tsx       # Post-registration summary with Print Receipt & View Details actions
        ├── PatientReceiptModal.tsx         # A4 black-and-white clinical handover preview & window.print() engine
        ├── PatientDetailView.tsx           # CDS report, vitals analysis, reassessment & two-level override modals
        ├── RedFlagAlertModal.tsx           # Mandatory emergency acknowledgement modal
        └── SyncCenterView.tsx              # IndexedDB diagnostics, offline/online sync & JSON export
```

---

## 10. Setup & Running Instructions

```bash
# 1. Install dependencies
npm install

# 2. Start the development server (runs on port 3000)
npm run dev

# 3. Type-check the codebase
npm run lint

# 4. Build for production
npm run build
```
