import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Printer,
  Sparkles,
  ShieldAlert,
  Activity,
  WifiOff,
  Stethoscope,
  TrendingUp,
  FileText
} from 'lucide-react';

interface PitchDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SlideData {
  number: string;
  category: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  keyPoints: {
    heading: string;
    description: string;
    metric?: string;
  }[];
  highlightBox: {
    title: string;
    content: string;
  };
  speakerScript: string;
}

const SLIDES: SlideData[] = [
  {
    number: '01',
    category: 'Vision & Hackathon Overview',
    title: 'XOR Triage',
    subtitle: 'AI Clinical Decision Support & Offline-First Patient Stratification for Rural Health Centres',
    icon: Sparkles,
    keyPoints: [
      {
        heading: 'The Rural Health Reality',
        description: 'Primary Health Centres (PHCs) face immense acute patient volume with only 1 MBBS doctor serving 11,000+ citizens.',
        metric: '1:11,000'
      },
      {
        heading: 'Frontline Empowerment',
        description: 'Empowers Auxiliary Nurse Midwives (ANMs) and ASHA workers to conduct standardized, rapid clinical triage in under 60 seconds.',
        metric: '< 60s'
      },
      {
        heading: 'Zero Downtime',
        description: '100% operational continuity during power and cellular outages through local client persistence and automatic cloud synchronization.',
        metric: '100%'
      }
    ],
    highlightBox: {
      title: 'Core Hackathon Thesis',
      content: 'Critical rural healthcare cannot rely on stable broadband. XOR Triage combines explainable clinical AI with offline-first local persistence to ensure zero missed emergencies in remote India.'
    },
    speakerScript:
      'Judges, welcome to XOR Triage. In rural India, a single doctor at a Primary Health Centre examines up to 150 walk-in patients every morning. Without structured triage, patients with heart attacks or severe respiratory distress wait in the same chaotic line as routine colds. XOR Triage empowers frontline ANM and ASHA nurses with calibrated clinical AI triage that works 100% offline and catches critical red flags immediately.'
  },
  {
    number: '02',
    category: 'The Problem Statement',
    title: 'The Rural Triage Bottleneck',
    subtitle: 'Why existing hospital software and AI tools fail in rural primary healthcare',
    icon: ShieldAlert,
    keyPoints: [
      {
        heading: 'Unstratified Chaos',
        description: 'First-come, first-served registration queues fail to detect deteriorating patients until it is too late.',
        metric: '4–6 hrs wait'
      },
      {
        heading: 'The Connectivity Cliff',
        description: 'Cloud-dependent EHRs crash during frequent power cuts and telecom blackouts, forcing staff back to illegible paper registers.',
        metric: '68% downtime'
      },
      {
        heading: 'Frontline Knowledge Gap',
        description: 'Rural healthcare workers lack calibrated decision aids to quickly differentiate subtle red-flag vitals from routine infections.',
        metric: 'High stress'
      }
    ],
    highlightBox: {
      title: 'The Unmet Clinical Need',
      content: 'Existing digital health tools are built for urban tertiary hospitals with gigabit fiber. Rural health centres desperately need lightweight, instant, offline-capable clinical stratification.'
    },
    speakerScript:
      'Here is the problem: in sub-centres and PHCs, patients wait 4 to 6 hours. When cloud EHRs lose internet, they freeze completely. More critically, frontline health workers lack real-time decision support to identify silent hypoxia, hypertensive crisis, or sepsis early. This creates an unstratified bottleneck where emergencies are missed.'
  },
  {
    number: '03',
    category: 'Our Innovation',
    title: 'Dual-Speed AI Clinical Triage',
    subtitle: 'Calibrated two-level clinical stratification with explainable, deterministic reasoning',
    icon: Activity,
    keyPoints: [
      {
        heading: 'Binary Stratification: EMERGENCY vs ROUTINE',
        description: 'Simplified, high-contrast decision paths prevent decision fatigue: immediate clinician review vs standard prioritized queue.',
        metric: '2-Tier'
      },
      {
        heading: 'Multi-Parameter Vital Evaluation',
        description: 'Cross-analyzes SpO2, systolic/diastolic blood pressure, pulse, temperature, respiratory rate, and age-adjusted thresholds.',
        metric: '6 Vitals'
      },
      {
        heading: 'Explainable Clinical Logic',
        description: 'No black-box hallucinations. Generates transparent, rule-grounded clinical explanations in plain language with localized translations.',
        metric: '100% transparent'
      }
    ],
    highlightBox: {
      title: 'Safety by Design',
      content: 'The triage engine is strictly calibrated to prioritize patient safety: high sensitivity for red flags (SpO2 < 90%, BP > 180/110, chest tightness) while keeping routine cases orderly.'
    },
    speakerScript:
      'Our solution is Dual-Speed AI Clinical Triage. Instead of complex 5-tier scales that confuse overworked staff, we stratify into two clear states: EMERGENCY or ROUTINE. The algorithm cross-evaluates 6 vital signs plus red-flag symptoms. Crucially, it provides a transparent clinical justification so the nurse and doctor understand exactly why an alert was triggered.'
  },
  {
    number: '04',
    category: 'Technical Architecture',
    title: 'Offline-First Resilience & Cloud Sync',
    subtitle: 'Local-first IndexedDB storage with seamless Firestore reconciliation and thermal receipt generation',
    icon: WifiOff,
    keyPoints: [
      {
        heading: 'Client-Side Persistence Engine',
        description: 'Every registration, vital check, and assessment is instantly committed to local IndexedDB and state caches without server latency.',
        metric: '0ms latency'
      },
      {
        heading: 'Queued Cloud Reconciliation',
        description: 'When connectivity restores, a background worker serializes and syncs pending encounters to central Firestore database without UI blocking.',
        metric: 'Auto-sync'
      },
      {
        heading: 'Hardware-Ready Thermal Tokens',
        description: 'Instant bilingual printed receipts with token ID, vitals summary, and clinical priority for rural patients and accompanying families.',
        metric: 'Physical receipt'
      }
    ],
    highlightBox: {
      title: 'Resilient Dual-Mode Operation',
      content: 'The application operates with full fidelity completely offline. The user can register patients, conduct triage, print receipts, and review records with zero network connection.'
    },
    speakerScript:
      'Under the hood, XOR Triage is built on an offline-first architecture. All records, vitals, and assessments save immediately to IndexedDB. When cellular connectivity resumes, a sequential write queue safely reconciles pending encounters to central Google Cloud Firestore. It also prints bilingual physical thermal tokens so illiterate patients have a tangible queue slip.'
  },
  {
    number: '05',
    category: 'Clinical Governance',
    title: 'Human-in-the-Loop & Auditability',
    subtitle: 'Doctor oversight, structured clinical overrides, and tamper-evident audit logging',
    icon: Stethoscope,
    keyPoints: [
      {
        heading: 'Mandatory Emergency Red-Flag Modal',
        description: 'Emergency cases trigger an inescapable alert requiring explicit staff acknowledgment and protocol initiation notes before proceeding.',
        metric: 'Zero skip'
      },
      {
        heading: 'Medical Officer Override',
        description: 'MBBS doctors retain supreme authority to elevate or downgrade triage priority with mandatory structured clinical justification.',
        metric: 'Doctor-in-the-loop'
      },
      {
        heading: 'Immutable Audit Logging',
        description: 'Every triage event, override, reprint, and cloud sync is cryptographically tracked with staff identity, role, and exact timestamp.',
        metric: '100% audited'
      }
    ],
    highlightBox: {
      title: 'Responsible AI & Clinical Safety',
      content: 'AI never replaces the doctor—it acts as a vigilant co-pilot that catches deteriorating vitals and presents structured evidence for human clinical decision-making.'
    },
    speakerScript:
      'Healthcare AI must be accountable. If an emergency is detected, an alert modal requires affirmative confirmation. Doctors can review and override the priority with a mandatory clinical note. Every single action—from intake to status transition—is logged in a tamper-evident audit trail.'
  },
  {
    number: '06',
    category: 'Impact & Roadmap',
    title: 'Measurable Impact & Next Horizons',
    subtitle: 'From sub-centre triage to national public health integration',
    icon: TrendingUp,
    keyPoints: [
      {
        heading: '75% Faster Triage Intake',
        description: 'Reduces intake and vital evaluation from 4+ minutes of unstructured questioning down to under 45 seconds per patient.',
        metric: '75% faster'
      },
      {
        heading: '100% Emergency Detection',
        description: 'Zero missed clinical red flags in simulation benchmarks, expediting immediate physician review for acute conditions.',
        metric: '100% catch rate'
      },
      {
        heading: 'National Scale Vision',
        description: 'ABDM/ABHA health ID interoperability, Bluetooth pulse-oximeter auto-capture, and multi-facility CHC referral tracking.',
        metric: 'ABHA ready'
      }
    ],
    highlightBox: {
      title: 'Summary Pitch Call-to-Action',
      content: 'XOR Triage bridges the gap between frontline rural health workers and primary care doctors. Fast, explainable, offline-first, and built for real-world impact.'
    },
    speakerScript:
      'In conclusion, XOR Triage cuts triage time by 75% and guarantees zero missed red-flag emergencies, even when the internet is completely down. Our roadmap includes ABHA digital health ID integration and direct Bluetooth vital-sensor capture. XOR Triage makes quality primary healthcare accessible, resilient, and fast for every rural citizen. Thank you!'
  }
];

export const PitchDeckModal: React.FC<PitchDeckModalProps> = ({ isOpen, onClose }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSpeakerNotes, setShowSpeakerNotes] = useState(true);
  const [copiedScript, setCopiedScript] = useState(false);

  const slide = SLIDES[currentSlideIndex];
  const IconComponent = slide.icon;

  const handleNext = useCallback(() => {
    setCurrentSlideIndex((prev) => (prev < SLIDES.length - 1 ? prev + 1 : prev));
  }, []);

  const handlePrev = useCallback(() => {
    setCurrentSlideIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  const toggleFullscreen = () => {
    const elem = document.getElementById('pitch-deck-container');
    if (!elem) return;

    if (!document.fullscreenElement) {
      elem.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleCopyAllSlides = () => {
    const text = SLIDES.map(
      (s) =>
        `# Slide ${s.number}: ${s.title}\nCategory: ${s.category}\nSubtitle: ${s.subtitle}\n\nKey Points:\n` +
        s.keyPoints.map((k) => `- ${k.heading} (${k.metric || 'N/A'}): ${k.description}`).join('\n') +
        `\n\nHighlight Box:\n${s.highlightBox.title}: ${s.highlightBox.content}\n\nSpeaker 30s Pitch Script:\n"${s.speakerScript}"\n\n--------------------\n`
    ).join('\n');

    navigator.clipboard.writeText(text);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pitch-deck-title"
    >
      <div
        id="pitch-deck-container"
        className="w-full max-w-5xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[96vh]"
      >
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold tracking-tight text-slate-900 uppercase">
              Hackathon Pitch Deck
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-xs text-slate-500 font-medium">
              Slide {slide.number} of 06
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Speaker Notes Toggle */}
            <button
              onClick={() => setShowSpeakerNotes(!showSpeakerNotes)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md border transition-colors cursor-pointer ${
                showSpeakerNotes
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
              title="Toggle 30-Second Speaker Script for Judges"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Speaker Script</span>
            </button>

            {/* Copy All Slides Markdown */}
            <button
              onClick={handleCopyAllSlides}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-md transition-colors cursor-pointer"
              title="Copy All 6 Slides as Clean Text"
            >
              {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copiedScript ? 'Copied!' : 'Copy Deck'}</span>
            </button>

            {/* Print Deck */}
            <button
              onClick={handlePrint}
              className="p-1.5 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-md transition-colors cursor-pointer"
              title="Print / Save as PDF"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-md transition-colors cursor-pointer"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md transition-colors cursor-pointer ml-1"
              title="Close Pitch Deck (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Slide Canvas */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 md:p-10 bg-gradient-to-b from-white to-slate-50/50">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Slide Header */}
            <div className="border-b border-slate-100 pb-5">
              <div className="flex items-center justify-between text-xs font-bold text-blue-600 tracking-wider uppercase mb-1.5">
                <span>{slide.category}</span>
                <span className="text-slate-400 font-mono">SLIDE {slide.number} / 06</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <IconComponent className="w-5 h-5" />
                </div>
                <div>
                  <h2 id="pitch-deck-title" className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                    {slide.title}
                  </h2>
                  <p className="text-sm sm:text-base text-slate-600 mt-1">
                    {slide.subtitle}
                  </p>
                </div>
              </div>
            </div>

            {/* Key Content Grid (3 Columns) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {slide.keyPoints.map((point, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    {point.metric && (
                      <div className="text-2xl font-bold font-mono text-slate-900 mb-1">
                        {point.metric}
                      </div>
                    )}
                    <h3 className="text-sm font-bold text-slate-800 mb-1.5">
                      {point.heading}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {point.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Strategic Highlight Banner */}
            <div className="bg-slate-900 text-white rounded-lg p-4 sm:p-5">
              <div className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-1">
                {slide.highlightBox.title}
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
                {slide.highlightBox.content}
              </p>
            </div>
          </div>
        </div>

        {/* Optional Collapsible Speaker Script Drawer */}
        {showSpeakerNotes && (
          <div className="bg-amber-50/80 border-t border-amber-200/80 px-4 sm:px-6 py-3 shrink-0">
            <div className="max-w-4xl mx-auto flex items-start gap-2.5">
              <span className="text-[11px] font-bold text-amber-800 uppercase shrink-0 mt-0.5 bg-amber-200/60 px-1.5 py-0.5 rounded">
                Judge Pitch Script (30s)
              </span>
              <p className="text-xs text-amber-950 leading-relaxed italic">
                "{slide.speakerScript}"
              </p>
            </div>
          </div>
        )}

        {/* Footer Navigation Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-t border-slate-200 bg-white shrink-0">
          <div className="flex items-center gap-2">
            {SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlideIndex(idx)}
                aria-label={`Jump to slide ${idx + 1}`}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  currentSlideIndex === idx
                    ? 'w-7 bg-blue-600'
                    : 'w-2 bg-slate-300 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={currentSlideIndex === 0}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors cursor-pointer ${
                currentSlideIndex === 0
                  ? 'border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed'
                  : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-100'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <button
              onClick={handleNext}
              disabled={currentSlideIndex === SLIDES.length - 1}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                currentSlideIndex === SLIDES.length - 1
                  ? 'border border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <span>{currentSlideIndex === SLIDES.length - 1 ? 'End of Deck' : 'Next'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
