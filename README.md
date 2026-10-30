# AI Triage — Clinical Decision Support System for Rural Health Centres
**System Architecture, Clinical Protocol, and User Guide**

---

## 1. Executive Summary
**AI Triage** is an offline-first Clinical Decision Support (CDS) and patient queue management web application engineered specifically for **Primary Health Centres (PHCs), Sub-Centres, and Community Health Centres (CHCs)** in rural India.

Designed for frontline healthcare workers—including **Auxiliary Nurse Midwives (ANMs), ASHA workers, Staff Nurses, and Medical Officers**—the system standardizes patient intake, captures vital signs and presenting symptoms with multilingual prompts, evaluates clinical urgency using a deterministic rule engine (`IN-PHC-TRIAGE-v2.4-DEMO`), and maintains a real-time, priority-sorted outpatient queue even during complete internet outages.

---

## 2. Problem Statement & Target Environment
Rural health facilities face three recurring operational bottlenecks at registration desks:
1. **High Patient Volume & First-Come-First-Served Risk:** Critical patients (e.g., silent hypoxemia, evolving acute coronary syndrome, severe dehydration) can wait in long outpatient queues behind routine cases if structured triage is not performed at intake.
2. **Variable Clinical Training at Intake:** Frontline intake is frequently handled by ANMs or ASHA workers who benefit from standardized physiological checklists and multilingual interview prompts.
3. **Unreliable Network Connectivity:** Rural clinics often experience intermittent cellular or broadband outages. Cloud-only applications fail when connectivity drops.

**AI Triage** solves these challenges by running its deterministic clinical rule engine and transactional database **100% locally in the browser** via IndexedDB, synchronizing records when connectivity is restored.

---

## 3. Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 19** (`react`, `react-dom`) | Component-based architecture using React Hooks (`useState`, `useEffect`, `useMemo`, `useCallback`, `useRef`) for zero-latency UI updates. |
| **Language** | **TypeScript 7** (`typescript`) | Strict compile-time type safety for clinical data structures (`Patient`, `Encounter`, `VitalSigns`, `TriageAssessment`, `AuditEvent`). |
| **Styling & UI** | **Tailwind CSS v4** (`@tailwindcss/vite`) | High-contrast clinical UI, responsive desktop tables / mobile cards, and print stylesheet (`@media print`) support. |
| **Typography** | **Plus Jakarta Sans**, **DM Sans**, **JetBrains Mono** | Scannable headings, legible clinical prose, and tabular numerals (`tabular-nums`) for vital sign alignment. |
| **Iconography** | **Lucide React** (`lucide-react`) | Crisp SVG icons paired with text labels so clinical urgency is never communicated by color alone. |
| **Offline Database** | **Browser IndexedDB API** (`AITriage_RuralPHC_DB`) | Client-side transactional NoSQL database with 4 object stores (`patients`, `encounters`, `assessments`, `auditLogs`) + `localStorage` fallback. |
| **Voice & Hardware APIs** | **Web Speech API** (`SpeechRecognition`) | Hands-free voice dictation in English (`en-IN`) and Hindi (`hi-IN`) with mandatory staff review. |
| **Build Tooling** | **Vite 8** (`vite`, `@vitejs/plugin-react`) | Fast ES module bundling and local development server. |

---

## 4. Core Clinical Safety Principles & Guardrails

1. **Mandatory Clinical Decision-Support Disclaimer:**
   > *"This is a decision-support recommendation, not a diagnosis. A qualified clinician must assess the patient."*
   The application never diagnoses diseases or prescribes medications; it strictly prioritizes clinical urgency.
2. **Missing Vital Signs Safeguard ("Never Assume Normal"):**
   If a vital sign cannot be measured at intake (e.g., cuff failure, unpalpable radial pulse, missing thermometer), staff check **"Unavailable"**. The engine explicitly records `UNAVAILABLE`, flags `HUMAN REVIEW REQUIRED`, and conservatively escalates the patient to **URGENT** rather than defaulting to Routine.
3. **Mandatory Emergency Red-Flag Acknowledgement:**
   When an **EMERGENCY** criterion is triggered, a high-contrast modal blocks standard routing until the healthcare worker clicks **"Acknowledge Emergency & Notify Medical Officer"**, logging their name, role, action notes, and timestamp in the audit trail.
4. **No Automated Priority Downgrading:**
   If a patient previously triaged as **EMERGENCY** undergoes reassessment, the rule engine blocks automatic downgrading to Routine/Urgent. Downgrades require an explicit **Clinician Override** by a Medical Officer with a mandatory written justification.
5. **100% Explainable & Deterministic Rule Trace:**
   Every triage outcome lists the exact `Rule ID`, protocol threshold, and observed patient finding. No black-box or probabilistic LLM hallucinations are used for clinical triage scoring.

---

## 5. Clinical Triage Protocol (`IN-PHC-TRIAGE-v2.4-DEMO`)

### Priority Tiers
* 🔴 **EMERGENCY (Immediate Resuscitation / Bed Allocation):** Life-threatening airway, breathing, circulatory, or neurological compromise.
* 🟡 **URGENT (Physician Review < 30 Minutes):** Acute abnormal physiology, high fever with rigors, moderate hypoxemia, or incomplete critical vitals requiring prompt evaluation.
* 🟢 **ROUTINE (Standard Outpatient Queue):** Stable physiological parameters with mild/subacute symptoms.

### Deterministic Rule Matrix

| Clinical Parameter | 🔴 EMERGENCY Criteria | 🟡 URGENT Criteria | 🟢 ROUTINE Reference |
| :--- | :--- | :--- | :--- |
| **Oxygen Saturation ($\text{SpO}_2$)** | `< 90%` (`V-SPO2-EMERGENCY`) | `90% – 93%` (`V-SPO2-URGENT`) | `95% – 100%` |
| **Blood Pressure (BP)** | `SBP ≥ 190` or `DBP ≥ 120 mmHg` (`V-BP-EMERGENCY-HIGH`)<br>`SBP < 90 mmHg` (`V-BP-EMERGENCY-LOW`) | `SBP 160–189` or `DBP 100–119 mmHg` (`V-BP-URGENT-HIGH`)<br>`SBP 90–99 mmHg` | `100–139 / 60–89 mmHg` |
| **Pulse / Heart Rate** | `≥ 135 bpm` or `≤ 40 bpm` (`V-HR-EMERGENCY`) | `105–134 bpm` or `41–50 bpm` (`V-HR-URGENT`) | `60 – 100 bpm` |
| **Respiratory Rate (RR)** | `≥ 30` or `≤ 8 breaths/min` (`V-RR-EMERGENCY`) | `22–29 breaths/min` (`V-RR-URGENT`) | `12 – 20 breaths/min` |
| **Body Temperature** | — | `≥ 39.5°C / 103.1°F` (`V-TEMP-URGENT-HIGH`)<br>`≤ 35.0°C / 95.0°F` (`V-TEMP-URGENT-LOW`) | `36.5°C – 37.5°C` |
| **Red-Flag Symptoms** | Audible stridor, severe dyspnea (`SYMP-AIRWAY-EMERGENCY`)<br>Convulsions, snake bite, head trauma, severe bleeding (`SYMP-CRITICAL-RED-FLAG`)<br>Radiating chest pain + diaphoresis (`SYMP-CHEST-SEVERE`) | Isolated acute chest discomfort (`SYMP-CHEST-URGENT`) | Mild cough, runny nose, sore throat |
| **High-Risk Combinations** | Chest pain + $\text{SpO}_2 < 94\%$ (`COMB-CHEST-HYPOXIA`) | High fever + tachycardia | — |
| **Missing Data Safeguard** | — | $\ge 2$ missing vitals or missing BP + Pulse (`SAFETY-INCOMPLETE-DATA`) | All key vitals recorded |

---

## 6. Functional Module Breakdown

### Screen 1: Live Triage Queue (`src/components/QueueView.tsx`)
* **Summary Counters:** Interactive status blocks for *Emergency*, *Urgent*, *Routine*, and *Awaiting Review*.
* **Queue Sorting:** Sorts by **Urgency First** (`Emergency` ➔ `Urgent` ➔ `Routine`), then by **Oldest Waiting Time First** within each priority tier. Users can also toggle to pure waiting-time sort.
* **Filtering & Search:** Filter by priority tier or *Offline Pending* status; instant search across Patient Name, ID, Village, Chief Complaint, and Symptoms.
* **Responsive View:** Full tabular view on desktop (`1440px`) and touch-friendly clinical cards on mobile/tablet screens.

### Screen 2: New Patient Intake & Triage (`src/components/RegistrationView.tsx`)
* **Multilingual Interview Guide:** Supports 6 languages (**English, Hindi, Marathi, Tamil, Telugu, Bengali**) with translated clinical interview prompts and quick-select rural presentation chips.
* **Section A — Demographics:** Auto-generated ID (`PHC-2026-XXXX`), Full Name, Age, Sex, Village/Locality, Phone, and Accompanying Person.
* **Section B — Chief Complaint & Symptoms:** Voice dictation via Web Speech API, multi-select symptom tags, onset, duration, severity, past medical history, current medications, and drug allergies.
* **Section C — Vital Signs:** Validated numeric inputs with explicit units (`mmHg`, `%`, `bpm`, `breaths/min`, `°C`) and individual **"Unavailable"** checkboxes.

### Screen 3 & 4: Patient Detail, CDS Report & Reassessment (`src/components/PatientDetailView.tsx`)
* **Care Status Workflow:** Transition patients across `Awaiting Assessment`, `Under Clinical Review`, `Reassessment Required`, and `Completed`.
* **Physiological Vitals Table:** Compares observed readings against normal reference ranges with `CRITICAL`, `ABNORMAL`, `UNAVAILABLE`, and `NORMAL` badges.
* **Transparent Rule Trace:** Displays every triggered rule ID, criterion, and plain-language explanation.
* **Reassessment Workflow (`+ Record Reassessment`):** Captures updated vital signs when a waiting patient deteriorates, generates a new versioned assessment (`v2`, `v3`), updates queue priority, and preserves longitudinal history.
* **Clinician Override:** Allows authorized Medical Officers to override priority with mandatory written clinical justification.
* **Print Clinical Slip:** Formatted print view (`window.print()`) for physical outpatient chart attachment.

### Screen 5: Offline Storage & Sync Center (`src/components/SyncCenterView.tsx`)
* **Connectivity Simulator:** One-click toggle between *Online (PHC Cloud)* and *Simulated Offline (Local IDB)* modes.
* **IndexedDB Diagnostics:** Real-time object store counters for `patients`, `encounters`, `assessments`, and `auditLogs`.
* **Central Registry Sync (`Sync Now`):** Reconciles `Pending Sync` and `Saved Locally` records when online and blocks false sync reporting when offline.
* **Data Portability:** Full JSON backup export (`Export Local Data`) and one-click reset to the 6 canonical demo cases.

### Screen 6: Clinical Protocol Inspector (`src/components/ProtocolInspectorView.tsx`)
* Interactive reference matrix of all deterministic rules and one-click scenario launchers for training and evaluation.

---

## 7. Pre-Loaded Clinical Demonstration Scenarios

| Case | Patient ID & Name | Age / Sex | Presentation & Vitals | Triage Priority | Clinical Feature Demonstrated |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | `PHC-2026-0101`<br>**Ramesh Kumar** | 58y / M | Retrosternal chest pain radiating to left arm, cold sweats.<br>$\text{SpO}_2\ 88\%$, $\text{BP}\ 154/96\ \text{mmHg}$ | 🔴 **EMERGENCY** | High-risk combination (`COMB-CHEST-HYPOXIA`) + Mandatory Red-Flag Acknowledgement. |
| **2** | `PHC-2026-0102`<br>**Priya Patel** | 34y / F | 3-day high fever with rigors.<br>$\text{Temp}\ 39.6^\circ\text{C}$, $\text{Pulse}\ 118\ \text{bpm}$ | 🟡 **URGENT** | Hyperpyrexia & tachycardia requiring physician evaluation within 30 minutes. |
| **3** | `PHC-2026-0103`<br>**Anil Sharma** | 22y / M | Mild dry cough & cold for 5 days.<br>$\text{SpO}_2\ 98\%$, $\text{BP}\ 118/76\ \text{mmHg}$, $\text{HR}\ 72\ \text{bpm}$ | 🟢 **ROUTINE** | Normal physiological parameters; standard outpatient queue placement. |
| **4** | `PHC-2026-0104`<br>**Meena Bai** | 45y / F | Severe acute breathlessness, audible stridor.<br>$\text{SpO}_2\ 84\%$, $\text{RR}\ 34\ \text{breaths/min}$ | 🔴 **EMERGENCY** | Acute airway & respiratory emergency (`SYMP-AIRWAY-EMERGENCY`). |
| **5** | `PHC-2026-0105`<br>**Sunil Verma** | 36y / M | Repeated vomiting, severe dizziness, dehydration.<br>$\text{BP}$ & $\text{Pulse}$ marked **UNAVAILABLE** | 🟡 **URGENT (Human Review)** | Missing vital signs safeguard (`SAFETY-INCOMPLETE-DATA`); prevents unsafe Routine classification. |
| **6** | `PHC-2026-0106`<br>**Kavita Devi** | 40y / F | Initial intake: Routine viral fever ($\text{SpO}_2\ 96\%$).<br>Reassessment: $\text{SpO}_2$ dropped to $89\%$, $\text{RR}\ 28$. | 🔴 **ESCALATED TO EMERGENCY** | Longitudinal reassessment workflow (`v1 Routine` ➔ `v2 Emergency`). |

---

## 8. File & Directory Structure

```text
/
├── index.html                          # HTML entry point & Google Fonts configuration
├── metadata.json                       # Application metadata & capabilities
├── package.json                        # Dependencies and scripts (dev, build, lint)
├── README.md                           # Complete system & clinical documentation
└── src/
    ├── main.tsx                        # React DOM root mount
    ├── App.tsx                         # Root state controller, routing & modal orchestration
    ├── index.css                       # Tailwind v4 configuration, typography & print styles
    ├── types/
    │   └── triage.ts                   # TypeScript interfaces for Patient, Encounter, Vitals, CDS
    ├── services/
    │   ├── triageEngine.ts             # Deterministic rule evaluator (IN-PHC-TRIAGE-v2.4-DEMO)
    │   └── patientRepository.ts        # IndexedDB persistence layer & mutation methods
    ├── utils/
    │   ├── mockData.ts                 # 6 canonical rural PHC cases, staff profiles & audit logs
    │   └── translations.ts             # 6-language prompt dictionary (EN, HI, MR, TA, TE, BN)
    └── components/
        ├── Header.tsx                  # Facility bar, connectivity toggle, staff switcher
        ├── Navigation.tsx              # Primary workspace navigation tabs with live badges
        ├── QueueView.tsx               # Priority-sorted queue table, mobile cards & filters
        ├── RegistrationView.tsx        # Patient intake form, voice input & vital sign capture
        ├── PatientDetailView.tsx       # CDS report, vitals analysis, reassessment & override modals
        ├── RedFlagAlertModal.tsx       # Mandatory emergency acknowledgement modal
        ├── SyncCenterView.tsx          # IndexedDB diagnostics, cloud sync & JSON export
        └── ProtocolInspectorView.tsx   # Rule matrix reference & quick-scenario loader
```

---

## 9. Setup & Running Instructions

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
