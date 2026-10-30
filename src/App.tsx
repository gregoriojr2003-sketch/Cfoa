import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Printer,
  Copy,
  Check,
  Download,
  Code2,
  BookOpen,
  Sparkles,
  RotateCcw,
  FileText,
  Trophy,
  Zap,
  Shield,
  Volume2,
  VolumeX,
  Users,
  Plus,
  Flame,
  Crown,
  Award,
  Clock,
  Target,
  Trash2,
  AlertTriangle,
  ChevronDown,
  Share2,
  TrendingUp,
  History,
  Lock,
  ShieldCheck,
  KeyRound,
  Newspaper,
  Bell,
  BellRing,
  Search,
  UserPlus,
  Upload,
  Link2,
  RefreshCw,
  ExternalLink,
  HeartHandshake,
} from 'lucide-react';
import {
  PRESET_ASSESSMENTS,
  DiagnosticAssessment,
  DiagnosticQuestion,
  ClassStudentRecord,
  CompetencyPillar,
  COMPETENCY_PILLARS,
  MILITARY_RANKS,
  PMPE_UNITS,
  INSTRUCTOR_RECORD,
  INITIAL_COLLECTIVE_ROSTER,
  StudentAttemptLog,
  calculateStudentAverageAccuracy,
} from './data/presets';
import {
  DiagnosticCharts,
  CohortCategory,
  normalizeCohortCategory,
} from './components/DiagnosticCharts';
import { ConfettiOverlay } from './components/ConfettiOverlay';
import { ShareRankModal } from './components/ShareRankModal';
import { StudentProgressModal } from './components/StudentProgressModal';
import { ApostilaViewer, OFFICIAL_APOSTILA_PDF_URL } from './components/ApostilaViewer';
import {
  APOSTILA_CHAPTERS_DATA,
  ApostilaChapterItem,
  CHAPTER_PAGE_MAPPINGS,
  QUICK_PAGE_INTERVALS,
  OFFICIAL_APOSTILA_SUBJECTS,
  GeneratorScopeMode,
  getChaptersByPageInterval,
  getChaptersBySubjectQuery,
  formatChaptersIntoMaterial,
  elaborateQuestionsByProgramParameters,
  ProgramSelectionParameters,
} from './data/apostilaChapterBank';
import { MobileRosterCards } from './components/MobileRosterCards';
import { JornalPopModal } from './components/JornalPopModal';
import {
  ReviewReminderNotification,
  ReviewReminderData,
  getReminderFromStorage,
} from './components/ReviewReminderNotification';
import { ApostilaSearchIndexModal, ApostilaIndexEntry } from './components/ApostilaSearchIndexModal';
import { ManualStudentEntryModal } from './components/ManualStudentEntryModal';
import {
  SupportCampaignModal,
  shouldAutoShowSupportModal,
  markSupportModalShown,
} from './components/SupportCampaignModal';
import {
  upsertStudentToFirestore,
  syncLocalRosterToFirestore,
  resetFirestoreRoster,
  subscribeToCollectiveRoster,
  findMatchingStudentInRoster,
  buildCanonicalStudentId,
  sortAndDeduplicateRoster,
  isValidGmailAddress,
  signInWithGmailAccount,
  ensureZeroedFirestoreRoster,
} from './firebase';
import { generateStandaloneHtml } from './utils/standaloneHtmlGenerator';
import { soundFX } from './utils/soundEffects';
import { evaluateAchievements, AchievementBadge } from './utils/achievements';

type AppTab = 'assessment' | 'class-board' | 'material-generator' | 'standalone-export';
type QuizStep = 1 | 2 | 3;

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('assessment');
  // Janela de campanha de colaboradores exibida apenas no 1º acesso e a cada 2 dias (ou quando acionada pelo botão flutuante)
  const [showSupportModal, setShowSupportModal] = useState<boolean>(() => {
    const shouldShow = shouldAutoShowSupportModal();
    if (shouldShow) {
      markSupportModalShown();
    }
    return shouldShow;
  });
  const [currentAssessment, setCurrentAssessment] = useState<DiagnosticAssessment>(
    PRESET_ASSESSMENTS[0]
  );

  // Parâmetros para os alunos escolherem o assunto das questões com base no Programa Oficial CFOA PMPE
  const [selectedProgramPillar, setSelectedProgramPillar] = useState<'ALL' | CompetencyPillar>('ALL');
  const [selectedProgramChapterId, setSelectedProgramChapterId] = useState<'ALL' | string>('ALL');
  const [selectedProgramTheme, setSelectedProgramTheme] = useState<string>('ALL');
  const [customStudiedThemeInput, setCustomStudiedThemeInput] = useState<string>('');
  const [selectedProgramComplexity, setSelectedProgramComplexity] =
    useState<ProgramSelectionParameters['complexity']>('ALL');

  // Todos os candidatos (incluindo o Administrador SGT Gregório) possuem cadastro e ranking iguais
  const isInstructor = (_s: ClassStudentRecord) => false;

  // Placar Coletivo CFOA PMPE (Zerado inicialmente, exige conta Gmail)
  const [classRoster, setClassRoster] = useState<ClassStudentRecord[]>(() => {
    try {
      localStorage.removeItem('sei_cas_roster_pmpe_2026');
      const saved = localStorage.getItem('cfoa_pmpe_roster_zeroed_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return sortAndDeduplicateRoster(parsed);
        }
      }
    } catch (e) {
      // fallback
    }
    return [];
  });

  // Controle de sincronização em tempo real com o servidor coletivo (/api/roster) e Cloud Firestore
  const lastServerSyncRef = useRef<number>(0);

  // Função utilitária para enviar atualização ao servidor coletivo e ao Cloud Firestore (visível em todos os celulares/PCs)
  const pushStudentToCollectiveServer = async (
    studentRecord: ClassStudentRecord,
    actionType: 'enrolled' | 'progress' | 'new' | 'updated'
  ) => {
    // 1. Grava imediatamente no Cloud Firestore (compartilhado entre ais-pre e ais-dev em tempo real)
    upsertStudentToFirestore(studentRecord).catch(() => {});

    // 2. Mantém sincronizado também com a rota local Express (/api/roster/upsert)
    try {
      const res = await fetch('/api/roster/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student: studentRecord, actionType }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.roster)) {
          lastServerSyncRef.current = data.lastUpdatedAt || Date.now();
          setClassRoster((prev) => {
            const merged = sortAndDeduplicateRoster([...prev, ...data.roster, studentRecord]);
            try {
              localStorage.setItem('cfoa_pmpe_roster_zeroed_v1', JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }
      }
    } catch {
      // Continua funcionando via Firestore e localStorage caso rota local falhe
    }
  };

  // Sincronização em Tempo Real via Cloud Firestore (onSnapshot) + Backup Local Express
  useEffect(() => {
    let isMounted = true;

    const initialSync = async () => {
      try {
        try {
          localStorage.removeItem('sei_cas_roster_pmpe_2026');
        } catch {}

        await ensureZeroedFirestoreRoster();

        let localList: ClassStudentRecord[] = [];
        try {
          const raw = localStorage.getItem('cfoa_pmpe_roster_zeroed_v1');
          if (raw) localList = JSON.parse(raw);
        } catch {}

        await syncLocalRosterToFirestore(localList);

        const res = await fetch('/api/roster/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ localRoster: localList }),
        });
        if (res.ok && isMounted) {
          const data = await res.json();
          if (data && Array.isArray(data.roster)) {
            lastServerSyncRef.current = data.lastUpdatedAt || Date.now();
            setClassRoster((prev) => {
              const merged = sortAndDeduplicateRoster([...prev, ...data.roster]);
              try {
                localStorage.setItem('cfoa_pmpe_roster_zeroed_v1', JSON.stringify(merged));
              } catch {}
              return merged;
            });
            syncLocalRosterToFirestore(data.roster).catch(() => {});
          }
        }
      } catch {}
    };

    initialSync();

    // Assinatura em Tempo Real no Cloud Firestore (conecta todos os celulares instantaneamente)
    const unsubscribeFirestore = subscribeToCollectiveRoster((cloudRoster, newestStudent) => {
      if (!isMounted || !cloudRoster) return;
      setClassRoster(() => {
        const merged = sortAndDeduplicateRoster(cloudRoster);
        try {
          localStorage.setItem('cfoa_pmpe_roster_zeroed_v1', JSON.stringify(merged));
        } catch {}
        return merged;
      });

      if (newestStudent && newestStudent.updatedAtMs && newestStudent.updatedAtMs > lastServerSyncRef.current) {
        lastServerSyncRef.current = newestStudent.updatedAtMs;
        setRecentStudentId(newestStudent.id);
        setRecentStudentName(newestStudent.name);
        setRecentActionType(
          (newestStudent.attemptsCount || 1) > 1 ? 'updated' : 'new'
        );
        setRecentActionTime(newestStudent.updatedAtMs);
        setTableAnimationKey((k) => k + 1);
      }
    });

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/roster');
        if (!res.ok || !isMounted) return;
        const data = await res.json();
        if (
          data &&
          Array.isArray(data.roster) &&
          data.lastUpdatedAt &&
          data.lastUpdatedAt > lastServerSyncRef.current
        ) {
          lastServerSyncRef.current = data.lastUpdatedAt;
          setClassRoster((prev) => {
            const merged = sortAndDeduplicateRoster([...prev, ...data.roster]);
            try {
              localStorage.setItem('cfoa_pmpe_roster_zeroed_v1', JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }
      } catch {}
    }, 5000);

    return () => {
      isMounted = false;
      unsubscribeFirestore();
      clearInterval(pollInterval);
    };
  }, []);

  // Sincronização manual imediata sob demanda (botão "Atualizar Desempenho Ao Vivo")
  const handleManualRosterSync = async () => {
    try {
      await ensureZeroedFirestoreRoster();
      let localList: ClassStudentRecord[] = [];
      try {
        const raw = localStorage.getItem('cfoa_pmpe_roster_zeroed_v1');
        if (raw) localList = JSON.parse(raw);
      } catch {}
      await syncLocalRosterToFirestore(localList);

      const res = await fetch('/api/roster');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.roster)) {
          lastServerSyncRef.current = data.lastUpdatedAt || Date.now();
          setClassRoster((prev) => {
            const merged = sortAndDeduplicateRoster([...prev, ...data.roster]);
            try {
              localStorage.setItem('cfoa_pmpe_roster_zeroed_v1', JSON.stringify(merged));
            } catch {}
            return merged;
          });
          setTableAnimationKey((k) => k + 1);
        }
      }
    } catch {}
  };

  // Carregar dados de um militar específico para atualizar sua nota em tempo real pelo celular
  const handleLoadStudentForUpdate = (student: ClassStudentRecord) => {
    const matchedRank = MILITARY_RANKS.find((r) =>
      student.name.toUpperCase().startsWith(r.toUpperCase() + ' ')
    );
    if (matchedRank) {
      setSelectedRank(matchedRank);
      setStudentWarName(student.name.slice(matchedRank.length).trim());
    } else {
      setStudentWarName(student.name);
    }
    setStudentId(student.registration || '');
    setStudentCohort(student.cohort || '1º BPM');
    setNameError(false);
    setEmailError(false);
    setCohortError(false);
    setAnswers({});
    setQuestionTimesSec({});
    setCurrentQuestionIdx(0);
    setUnansweredWarning(false);
    setActiveTab('assessment');
    setStep(2);
    soundFX.playSelect();

    const nowTime = new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const updatedRecord: ClassStudentRecord = {
      ...student,
      status: 'Em Missão',
      progressQuestions: 0,
      totalQuestionsCount: currentAssessment.questions.length,
      enrolledAt: student.enrolledAt || nowTime,
      completedAt: nowTime,
      updatedAtMs: Date.now(),
    };
    setClassRoster((prev) =>
      prev.map((s) => (s.id === student.id ? updatedRecord : s))
    );
    pushStudentToCollectiveServer(updatedRecord, 'enrolled');
  };

  // Modal e Notificações do Administrador
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sei_cas_admin_auth') === 'true';
    } catch {
      return false;
    }
  });
  const [showAdminLoginModal, setShowAdminLoginModal] = useState<boolean>(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState<string>('');
  const [adminLoginError, setAdminLoginError] = useState<string | null>(null);
  const [adminLoginIntent, setAdminLoginIntent] = useState<'standalone-export' | 'download' | 'reset'>('standalone-export');

  const [showAdminResetModal, setShowAdminResetModal] = useState(false);
  const [resetSuccessToast, setResetSuccessToast] = useState(false);
  const [attemptNotice, setAttemptNotice] = useState<'new' | 'updated'>('new');
  const [tableFilter, setTableFilter] = useState<'ALL' | CohortCategory>('ALL');

  // Destaque e Animação Fade-in de Atividade Recente no Quadro Geral
  const [recentStudentId, setRecentStudentId] = useState<string | null>(null);
  const [recentStudentName, setRecentStudentName] = useState<string | null>(null);
  const [recentActionType, setRecentActionType] = useState<'new' | 'updated' | null>(null);
  const [recentActionTime, setRecentActionTime] = useState<number | null>(null);
  const [tableAnimationKey, setTableAnimationKey] = useState<number>(0);

  // Áudio, Modo Treinamento vs Modo Oficial e Quantidade de Questões
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [trainingMode, setTrainingMode] = useState<boolean>(false);
  const [selectedQuizLength, setSelectedQuizLength] = useState<5 | 8 | 10>(10);

  // Fluxo Game em 3 Telas + Persistência do Cadastro Obrigatório para refletir sempre no RANKING
  const [step, setStep] = useState<QuizStep>(1);
  const [selectedRank, setSelectedRank] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('cfoa_pmpe_registered_profile_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.rank) return parsed.rank;
      }
    } catch {}
    return '2º SGT PM';
  });
  const [studentWarName, setStudentWarName] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('cfoa_pmpe_registered_profile_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.warName) return parsed.warName;
      }
    } catch {}
    return '';
  });
  const [showRankModal, setShowRankModal] = useState<boolean>(false);
  const [studentId, setStudentId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('cfoa_pmpe_registered_profile_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.email) return parsed.email;
      }
    } catch {}
    return '';
  });
  const [studentCohort, setStudentCohort] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('cfoa_pmpe_registered_profile_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.cohort) return parsed.cohort;
      }
    } catch {}
    return '';
  });
  const [nameError, setNameError] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [cohortError, setCohortError] = useState(false);
  const [isAuthenticatingGmail, setIsAuthenticatingGmail] = useState(false);
  const [gmailAuthNotice, setGmailAuthNotice] = useState<string | null>(null);
  const [profileRankingSyncToast, setProfileRankingSyncToast] = useState<string | null>(null);
  const [isQuickReviewMode, setIsQuickReviewMode] = useState<boolean>(false);

  // Salva automaticamente o perfil cadastrado no navegador quando válido
  useEffect(() => {
    const cleanWar = studentWarName.trim();
    const cleanReg = studentId.trim().toLowerCase();
    const cleanCohort = studentCohort.trim();
    if (cleanWar && isValidGmailAddress(cleanReg) && cleanCohort) {
      try {
        localStorage.setItem(
          'cfoa_pmpe_registered_profile_v1',
          JSON.stringify({
            rank: selectedRank,
            warName: cleanWar,
            email: cleanReg,
            cohort: cleanCohort,
          })
        );
      } catch {}
    }
  }, [selectedRank, studentWarName, studentId, studentCohort]);

  // Nome completo formatado com a patente/graduação ([Nome de Guerra / Identificação do Militar])
  const studentName = studentWarName.trim()
    ? `${selectedRank} ${studentWarName.trim()}`
    : selectedRank;

  // Identifica se o usuário atual é o Administrador do App (autenticado por senha ou via conta Gmail do Administrador)
  const isAdminUser =
    isAdminAuthenticated ||
    studentId.trim().toLowerCase() === 'gregoriojr2003@gmail.com';

  // Tela 2: Missões e Cronometragem de Velocidade (para Achievement Badges)
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [questionTimesSec, setQuestionTimesSec] = useState<Record<number, number>>({});
  const [unansweredWarning, setUnansweredWarning] = useState(false);
  const [hitAnimation, setHitAnimation] = useState<'none' | 'correct' | 'wrong'>('none');
  const questionStartRef = useRef<number>(Date.now());
  const [liveElapsedSec, setLiveElapsedSec] = useState<number>(0);

  // Tela 3: Copiar Score, HTML, Confetti de Conquista, Compartilhamento e Jornal Pop da Apostila
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [copiedHtmlCode, setCopiedHtmlCode] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareModalTarget, setShareModalTarget] = useState<ClassStudentRecord | null>(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [selectedProgressStudent, setSelectedProgressStudent] = useState<ClassStudentRecord | null>(null);
  const [currentStudentAttempts, setCurrentStudentAttempts] = useState<StudentAttemptLog[]>([]);
  const [jornalPopTarget, setJornalPopTarget] = useState<{
    question: DiagnosticQuestion;
    index: number;
    selectedIdx?: number;
  } | null>(null);

  // Gerador IA a partir da Apostila (Capítulos, Páginas ou Assunto)
  const [apostilaViewMode, setApostilaViewMode] = useState<'mobile-reader' | 'pdf-embed' | 'generator'>('mobile-reader');
  const [generatorScopeMode, setGeneratorScopeMode] = useState<GeneratorScopeMode>('chapter');
  const [selectedGeneratorChapters, setSelectedGeneratorChapters] = useState<string[]>(['cap-1']);
  const [generatorStartPage, setGeneratorStartPage] = useState<number>(7);
  const [generatorEndPage, setGeneratorEndPage] = useState<number>(12);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('subj-2fa-govbr');
  const [customSubjectQuery, setCustomSubjectQuery] = useState<string>('');

  // Lembrete de Revisão em 24h pós-desafio
  const [activeReminderSummary, setActiveReminderSummary] = useState<ReviewReminderData | null>(null);
  const [showSearchIndexModal, setShowSearchIndexModal] = useState(false);
  const [searchIndexInitialQuery, setSearchIndexInitialQuery] = useState('');
  const [selectedSearchIndexEntry, setSelectedSearchIndexEntry] = useState<ApostilaIndexEntry | null>(null);
  const [showManualStudentModal, setShowManualStudentModal] = useState(false);

  useEffect(() => {
    const checkReminder = () => {
      const stored = getReminderFromStorage();
      setActiveReminderSummary(stored && !stored.dismissed ? stored : null);
    };
    checkReminder();
    const interval = setInterval(checkReminder, 10000);
    return () => clearInterval(interval);
  }, []);

  const [customMaterial, setCustomMaterial] = useState(
    PRESET_ASSESSMENTS[0].sourceMaterial
  );
  const [desiredQuestionCount, setDesiredQuestionCount] = useState<number>(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationSuccess, setGenerationSuccess] = useState(false);

  // ============================================================================
  // GERENCIADOR DE SUBSTITUIÇÃO DO MATERIAL BASE / APOSTILA PELO ADMIN (PDF OU LINK)
  // ============================================================================
  interface CustomKnowledgeBaseState {
    isCustom: boolean;
    updatedAt?: string;
    sourceType?: 'pdf' | 'link';
    fileName?: string;
    linkUrl?: string;
    pdfUrl?: string;
    title?: string;
    subtitle?: string;
    subjectArea?: string;
    chapters?: ApostilaChapterItem[];
    questions?: DiagnosticQuestion[];
  }

  const [customKnowledgeBase, setCustomKnowledgeBase] = useState<CustomKnowledgeBaseState | null>(() => {
    try {
      const saved = localStorage.getItem('sei_cas_custom_kb_2026');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.isCustom) return parsed;
      }
    } catch {}
    return null;
  });

  const [kbSourceType, setKbSourceType] = useState<'pdf' | 'link'>('pdf');
  const [kbFileName, setKbFileName] = useState<string>('');
  const [kbPdfBase64, setKbPdfBase64] = useState<string>('');
  const [kbLinkUrl, setKbLinkUrl] = useState<string>('');
  const [kbCustomTitle, setKbCustomTitle] = useState<string>('');
  const [kbSupplementalText, setKbSupplementalText] = useState<string>('');
  const [isReformingKb, setIsReformingKb] = useState<boolean>(false);
  const [kbStatusMessage, setKbStatusMessage] = useState<string | null>(null);
  const [kbErrorMessage, setKbErrorMessage] = useState<string | null>(null);

  // Carrega a Base de Conhecimento customizada do servidor ao iniciar
  useEffect(() => {
    let mounted = true;
    fetch('/api/knowledge-base')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!mounted || !data) return;
        if (data.isCustom && Array.isArray(data.chapters) && data.chapters.length > 0) {
          setCustomKnowledgeBase(data);
          try {
            localStorage.setItem('sei_cas_custom_kb_2026', JSON.stringify(data));
          } catch {}
          if (Array.isArray(data.questions) && data.questions.length > 0) {
            setCurrentAssessment((prev) => ({
              ...prev,
              title: data.title || prev.title,
              subtitle: data.subtitle || prev.subtitle,
              subjectArea: data.subjectArea || data.title || prev.subjectArea,
              questions: data.questions,
            }));
          }
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const activeApostilaChapters = useMemo<ApostilaChapterItem[]>(() => {
    if (
      customKnowledgeBase?.isCustom &&
      Array.isArray(customKnowledgeBase.chapters) &&
      customKnowledgeBase.chapters.length > 0
    ) {
      return customKnowledgeBase.chapters;
    }
    return APOSTILA_CHAPTERS_DATA;
  }, [customKnowledgeBase]);

  const handleAdminPdfFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setKbErrorMessage(null);
    setKbStatusMessage(null);
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setKbErrorMessage('Selecione um arquivo no formato PDF (.pdf).');
      return;
    }
    setKbFileName(file.name);
    if (!kbCustomTitle.trim()) {
      setKbCustomTitle(file.name.replace(/\.pdf$/i, ''));
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setKbPdfBase64(reader.result);
      }
    };
    reader.onerror = () => {
      setKbErrorMessage('Erro ao ler o arquivo PDF selecionado.');
    };
    reader.readAsDataURL(file);
  };

  const handleAdminReplaceKnowledgeBase = async (e: React.FormEvent) => {
    e.preventDefault();
    setKbErrorMessage(null);
    setKbStatusMessage(null);

    if (kbSourceType === 'pdf' && !kbPdfBase64) {
      setKbErrorMessage('Selecione um arquivo PDF do seu computador ou celular para substituir a Apostila.');
      soundFX.playWrong();
      return;
    }
    if (kbSourceType === 'link' && !kbLinkUrl.trim()) {
      setKbErrorMessage('Informe o Link / URL do novo material (PDF online, Google Drive ou página oficial).');
      soundFX.playWrong();
      return;
    }

    setIsReformingKb(true);
    try {
      const response = await fetch('/api/knowledge-base/reformulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType: kbSourceType,
          pdfBase64: kbSourceType === 'pdf' ? kbPdfBase64 : undefined,
          fileName: kbSourceType === 'pdf' ? kbFileName : undefined,
          linkUrl: kbSourceType === 'link' ? kbLinkUrl.trim() : undefined,
          customTitle: kbCustomTitle.trim(),
          supplementalText: kbSupplementalText.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Não foi possível reformular a Base do Conhecimento.');
      }

      setCustomKnowledgeBase(data);
      try {
        localStorage.setItem('sei_cas_custom_kb_2026', JSON.stringify(data));
      } catch {}

      if (Array.isArray(data.questions) && data.questions.length > 0) {
        setCurrentAssessment((prev) => ({
          ...prev,
          id: `kb-${Date.now()}`,
          title: data.title || 'Guia de Aperfeiçoamento',
          subtitle: data.subtitle || prev.subtitle,
          subjectArea: data.subjectArea || data.title || prev.subjectArea,
          questions: data.questions,
        }));
      }

      if (Array.isArray(data.chapters) && data.chapters.length > 0) {
        setSelectedGeneratorChapters([data.chapters[0].id]);
      }

      setSelectedSearchIndexEntry(null);
      setKbStatusMessage(
        `Base de Conhecimento substituída com sucesso! A seção APOSTILA (${data.chapters?.length || 0} módulos) e o Quiz (${data.questions?.length || 10} questões) foram totalmente reformulados para "${data.title}".`
      );
      soundFX.playVictory();
    } catch (err: any) {
      setKbErrorMessage(err?.message || 'Erro ao reformular a Base de Conhecimento.');
      soundFX.playWrong();
    } finally {
      setIsReformingKb(false);
    }
  };

  const handleAdminRestoreDefaultKnowledgeBase = async () => {
    setKbErrorMessage(null);
    setKbStatusMessage(null);
    setIsReformingKb(true);
    try {
      await fetch('/api/knowledge-base/reset', { method: 'POST' });
    } catch {}
    setCustomKnowledgeBase(null);
    try {
      localStorage.removeItem('sei_cas_custom_kb_2026');
    } catch {}
    setCurrentAssessment(PRESET_ASSESSMENTS[0]);
    setSelectedGeneratorChapters(['cap-1']);
    setSelectedSearchIndexEntry(null);
    setKbFileName('');
    setKbPdfBase64('');
    setKbLinkUrl('');
    setKbCustomTitle('');
    setKbSupplementalText('');
    setIsReformingKb(false);
    setKbStatusMessage('Apostila Original DT-SEI (CAS PMPE 2026) restaurada com sucesso!');
    soundFX.playSelect();
  };

  // Calcula dinamicamente os capítulos/páginas/assunto selecionados na Apostila ativa
  const resolvedScopeInfo = useMemo(() => {
    if (generatorScopeMode === 'chapter') {
      const matched = activeApostilaChapters.filter((ch) =>
        selectedGeneratorChapters.includes(ch.id)
      );
      const safeMatched = matched.length > 0 ? matched : [activeApostilaChapters[0]];
      const label =
        safeMatched.length === 1
          ? `${safeMatched[0].number} — ${safeMatched[0].title} (${safeMatched[0].pages})`
          : safeMatched.length === activeApostilaChapters.length
          ? `Todos os ${activeApostilaChapters.length} Capítulos da Apostila Ativa`
          : `${safeMatched.length} Capítulos (${safeMatched.map((c) => c.number).join(', ')})`;
      return {
        matchedChapters: safeMatched,
        scopeLabel: label,
        activeSubjectLabel: '',
        materialText: formatChaptersIntoMaterial(safeMatched, label),
        isValidInApostila: safeMatched.length > 0,
      };
    }

    if (generatorScopeMode === 'pages') {
      const minP = Math.min(generatorStartPage, generatorEndPage);
      const maxP = Math.max(generatorStartPage, generatorEndPage);
      const matched = customKnowledgeBase?.isCustom
        ? activeApostilaChapters
        : getChaptersByPageInterval(minP, maxP);
      const label = `Págs. ${String(minP).padStart(2, '0')} a ${String(maxP).padStart(2, '0')} (${matched
        .map((c) => c.number)
        .join(', ')})`;
      return {
        matchedChapters: matched,
        scopeLabel: label,
        activeSubjectLabel: '',
        materialText: formatChaptersIntoMaterial(matched, label),
        isValidInApostila: matched.length > 0,
      };
    }

    if (generatorScopeMode === 'subject') {
      const hasCustom = customSubjectQuery.trim().length > 0;
      const preset = OFFICIAL_APOSTILA_SUBJECTS.find((s) => s.id === selectedSubjectId);
      const queryToUse = hasCustom ? customSubjectQuery.trim() : preset?.id || '';
      const subjectDisplay = hasCustom
        ? customSubjectQuery.trim()
        : preset?.label || 'Assunto da Apostila';
      const matched = customKnowledgeBase?.isCustom
        ? activeApostilaChapters.filter((ch) => {
            if (!hasCustom) return true;
            const q = customSubjectQuery.trim().toLowerCase();
            return (
              ch.title.toLowerCase().includes(q) ||
              ch.summary.toLowerCase().includes(q) ||
              ch.pilar.toLowerCase().includes(q) ||
              ch.keyPoints.some((kp) => kp.toLowerCase().includes(q))
            );
          })
        : getChaptersBySubjectQuery(queryToUse);
      const finalMatched = matched.length > 0 ? matched : (customKnowledgeBase?.isCustom ? activeApostilaChapters : []);
      const label = `Assunto: ${subjectDisplay} (${finalMatched
        .map((c) => `${c.number} · ${c.pages}`)
        .join(' | ')})`;
      return {
        matchedChapters: finalMatched,
        scopeLabel: label,
        activeSubjectLabel: subjectDisplay,
        materialText: formatChaptersIntoMaterial(finalMatched, label),
        isValidInApostila: finalMatched.length > 0,
      };
    }

    // Modo 'all' (Apostila Completa)
    return {
      matchedChapters: activeApostilaChapters,
      scopeLabel: `Apostila Completa (${activeApostilaChapters.length} Módulos)`,
      activeSubjectLabel: '',
      materialText: customKnowledgeBase?.isCustom
        ? formatChaptersIntoMaterial(activeApostilaChapters, customKnowledgeBase.title || 'Apostila Completa')
        : PRESET_ASSESSMENTS[0].sourceMaterial,
      isValidInApostila: true,
    };
  }, [
    activeApostilaChapters,
    customKnowledgeBase,
    generatorScopeMode,
    selectedGeneratorChapters,
    generatorStartPage,
    generatorEndPage,
    selectedSubjectId,
    customSubjectQuery,
  ]);

  // Atualiza automaticamente o texto-base da Apostila conforme o aluno escolhe Capítulo, Páginas ou Assunto
  useEffect(() => {
    if (resolvedScopeInfo.isValidInApostila && resolvedScopeInfo.materialText) {
      setCustomMaterial(resolvedScopeInfo.materialText);
      setGenerationError(null);
    }
  }, [resolvedScopeInfo]);

  // Módulos e Temas disponíveis dinamicamente conforme os parâmetros do Programa Oficial CFOA PMPE
  const filteredProgramChapters = useMemo(() => {
    if (selectedProgramPillar === 'ALL') return APOSTILA_CHAPTERS_DATA;
    return APOSTILA_CHAPTERS_DATA.filter((ch) => ch.competencyPillar === selectedProgramPillar);
  }, [selectedProgramPillar]);

  const availableProgramThemes = useMemo(() => {
    const targetMappings = CHAPTER_PAGE_MAPPINGS.filter((m) => {
      if (selectedProgramChapterId !== 'ALL') return m.chapterId === selectedProgramChapterId;
      if (selectedProgramPillar !== 'ALL') return m.pilar === selectedProgramPillar;
      return true;
    });
    const uniqueThemes = new Set<string>();
    targetMappings.forEach((m) => {
      m.subjects.forEach((subj) => uniqueThemes.add(subj));
    });
    return Array.from(uniqueThemes);
  }, [selectedProgramPillar, selectedProgramChapterId]);

  // Elabora automaticamente as questões quando o aluno altera os parâmetros do Programa CFOA na Tela 1
  useEffect(() => {
    const activeStudiedTheme = customStudiedThemeInput.trim()
      ? customStudiedThemeInput.trim()
      : selectedProgramTheme;

    const elaborated = elaborateQuestionsByProgramParameters({
      pillar: selectedProgramPillar,
      chapterId: selectedProgramChapterId,
      studiedTheme: activeStudiedTheme,
      complexity: selectedProgramComplexity,
      questionCount: selectedQuizLength,
    });

    setCurrentAssessment((prev) => ({
      ...prev,
      title: elaborated.scopeTitle,
      subtitle: elaborated.scopeSubtitle,
      subjectArea: elaborated.subjectAreaLabel,
      questions: elaborated.questions,
    }));
  }, [
    selectedProgramPillar,
    selectedProgramChapterId,
    selectedProgramTheme,
    customStudiedThemeInput,
    selectedProgramComplexity,
    selectedQuizLength,
  ]);

  // Lista de questões ativas (5, 8 ou 10 questões retiradas do Programa Oficial CFOA PMPE, somando 100 pts)
  const questions = useMemo(() => {
    const sliced = currentAssessment.questions.slice(0, selectedQuizLength);
    const count = sliced.length || 1;
    const basePts = Math.floor(100 / count);
    const remainder = 100 - basePts * count;
    return sliced.map((q, idx) => ({
      ...q,
      points: basePts + (idx < remainder ? 1 : 0),
    }));
  }, [currentAssessment.questions, selectedQuizLength]);

  const totalQuestions = questions.length;
  const currentQuestion: DiagnosticQuestion = questions[currentQuestionIdx] || questions[0];

  // Atualizar cronômetro da missão ativa
  useEffect(() => {
    if (step !== 2) return;
    questionStartRef.current = Date.now();
    setLiveElapsedSec(0);
    const interval = setInterval(() => {
      if (answers[currentQuestionIdx] === undefined) {
        setLiveElapsedSec(
          Math.floor((Date.now() - questionStartRef.current) / 1000)
        );
      }
    }, 500);
    return () => clearInterval(interval);
  }, [step, currentQuestionIdx, answers]);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundFX.enabled = next;
  };

  // Cálculo de Métricas, Patentes, Pilares e Achievement Badges
  const results = useMemo(() => {
    let totalScore = 0;
    let correctCount = 0;
    let currentStreak = 0;
    let maxStreak = 0;
    let totalTimeSec = 0;
    let answeredCount = 0;
    let fastestCorrectSec = 999;

    const pillarData: Record<
      CompetencyPillar,
      { earned: number; total: number }
    > = {
      'Legislação PM & Regime Disciplinar': { earned: 0, total: 0 },
      'Direito Penal & Processual Militar': { earned: 0, total: 0 },
      'Direito Constitucional & Administrativo': { earned: 0, total: 0 },
      'Administração & Conhecimentos Gerais': { earned: 0, total: 0 },
    };

    const complexityMap: Record<
      string,
      { earned: number; total: number; correct: number; count: number }
    > = {
      'Básica / Conceitual': { earned: 0, total: 0, correct: 0, count: 0 },
      'Intermediária / Aplicação': { earned: 0, total: 0, correct: 0, count: 0 },
      'Avançada / Análise': { earned: 0, total: 0, correct: 0, count: 0 },
    };

    questions.forEach((q, idx) => {
      const selected = answers[idx];
      const isAnswered = selected !== undefined;
      const isCorrect = selected === q.correctIndex;
      const earnedPts = isCorrect ? q.points : 0;
      const qTime = questionTimesSec[idx] ?? 0;

      const pillarKey: CompetencyPillar =
        q.pillar && COMPETENCY_PILLARS.includes(q.pillar)
          ? q.pillar
          : 'Legislação PM & Regime Disciplinar';

      pillarData[pillarKey].total += q.points;
      pillarData[pillarKey].earned += earnedPts;

      totalScore += earnedPts;

      if (isAnswered) {
        answeredCount += 1;
        totalTimeSec += qTime > 0 ? qTime : 5;
      }

      if (isCorrect) {
        correctCount += 1;
        currentStreak += 1;
        if (currentStreak > maxStreak) maxStreak = currentStreak;
        if (qTime > 0 && qTime < fastestCorrectSec) {
          fastestCorrectSec = qTime;
        }
      } else if (isAnswered) {
        currentStreak = 0;
      }

      if (!complexityMap[q.complexity]) {
        complexityMap[q.complexity] = { earned: 0, total: 0, correct: 0, count: 0 };
      }
      complexityMap[q.complexity].total += q.points;
      complexityMap[q.complexity].earned += earnedPts;
      complexityMap[q.complexity].count += 1;
      if (isCorrect) complexityMap[q.complexity].correct += 1;
    });

    const pillarPercentages: Record<CompetencyPillar, number> = {
      'Legislação PM & Regime Disciplinar': 0,
      'Direito Penal & Processual Militar': 0,
      'Direito Constitucional & Administrativo': 0,
      'Administração & Conhecimentos Gerais': 0,
    };

    COMPETENCY_PILLARS.forEach((p) => {
      const d = pillarData[p];
      pillarPercentages[p] =
        d.total > 0 ? Math.round((d.earned / d.total) * 100) : 0;
    });

    const avgTimePerQuestionSec =
      answeredCount > 0 ? totalTimeSec / answeredCount : 0;

    // Patente / Nível de Intimidade com o Sistema
    let diagnosticTier: {
      code: 'beginner' | 'intermediate' | 'advanced';
      tierShort: 'Iniciante' | 'Intermediário' | 'Avançado';
      patentTitle: string;
      intimacyLevel: string;
      badgeLabel: string;
      glyph: string;
      headline: string;
      feedback: string;
      recommendations: string[];
      colorClasses: string;
    };

    if (totalScore <= 49) {
      diagnosticTier = {
        code: 'beginner',
        tierShort: 'Iniciante',
        patentTitle: 'Soldado Recruta do SEI',
        intimacyLevel: 'Iniciante / Sem Intimidade',
        badgeLabel: 'Soldado Recruta do SEI (0 a 49 pts)',
        glyph: '▲',
        headline:
          'Soldado Recruta do SEI — Iniciante / Sem Intimidade (Necessita Capacitação Básica)',
        feedback:
          'Sua sondagem indica necessidade de capacitação básica nos fluxos essenciais da Documentação Técnica — SEI (Decreto nº 45.157/2017 e Portaria SAD nº 123/2020). Antes de operar processos críticos em ambiente de produção, consolide a base no ambiente de treinamento.',
        recommendations: [
          'Pratique no Ambiente de Treinamento (www.sei4treina.pe.gov.br) a abertura de processos, inclusão de documentos e uso de Blocos Internos.',
          'Revise na apostila DTSEI as regras de assinatura via Expresso.PE, limite de 200 MB com OCR a 300 dpi e Autenticação em 2 Fatores (2FA).',
          'Estude o gabarito técnico comentado abaixo e reinicie a operação para conquistar a patente de Especialista SEI.',
        ],
        colorClasses: 'bg-amber-950/90 border-amber-500 text-amber-300',
      };
    } else if (totalScore <= 79) {
      diagnosticTier = {
        code: 'intermediate',
        tierShort: 'Intermediário',
        patentTitle: 'Operador Prático do SEI',
        intimacyLevel: 'Intermediário / Conhecimento Básico',
        badgeLabel: 'Operador Prático do SEI (50 a 79 pts)',
        glyph: '●',
        headline:
          'Operador Prático do SEI — Intermediário / Conhecimento Básico (Opera Rotinas com Segurança)',
        feedback:
          'Você já opera as rotinas administrativas do SEI PERNAMBUCO com segurança, demonstrando boa base conceitual. Para ascender à patente de Especialista/Gestor SEI, ajuste os detalhes normativos onde houve perda de pontos.',
        recommendations: [
          'Observe no Gráfico Radar qual dos 4 pilares ficou abaixo de 80% e revise os artigos correspondentes da Portaria SAD nº 123/2020.',
          'Reforce a distinção entre Processo Anexado (subordinado/escravo ao Processo Mater) e Processo Relacionado (tramitação independente).',
          'Atente-se às regras de Processo Sigiloso (acesso pessoal via Credenciais de Acesso e ícone de chave) e vedação de exclusão pós-trâmite.',
        ],
        colorClasses: 'bg-sky-950/90 border-sky-500 text-sky-300',
      };
    } else {
      diagnosticTier = {
        code: 'advanced',
        tierShort: 'Avançado',
        patentTitle: 'Especialista / Gestor SEI',
        intimacyLevel: 'Avançado / Com Intimidade',
        badgeLabel: 'Especialista / Gestor SEI (80 a 100 pts)',
        glyph: '★',
        headline:
          'Especialista / Gestor SEI — Avançado / Com Intimidade (Domínio Total dos Fluxos e Regras)',
        feedback:
          'Excelente missão, Sargento! Você demonstrou domínio técnico integral sobre a Apostila de Documentação Técnica — SEI (CAS PMPE 2026), compreendendo desde a governança SIP/NSI até a integridade processual e gestão de sigilo.',
        recommendations: [
          'Atue como multiplicador técnico na sua OME, auxiliando o efetivo no uso de Textos Padrão (@dia@, @ano@) e Blocos de Assinatura em lote.',
          'Auxilie na fiscalização da correta autenticação de documentos "Digitalizados nesta Unidade" (restrita a servidores públicos/comissionados).',
          'Confira suas Insígnias de Conquista (Achievement Badges) desbloqueadas e sua posição no Ranking Geral da Turma!',
        ],
        colorClasses: 'bg-emerald-950/90 border-emerald-500 text-emerald-300',
      };
    }

    const achievementBadges: AchievementBadge[] = evaluateAchievements({
      totalScore,
      maxStreak,
      totalQuestions,
      avgTimePerQuestionSec,
      fastestQuestionSec: fastestCorrectSec === 999 ? 0 : fastestCorrectSec,
      pillarPercentages,
    });

    return {
      totalScore,
      correctCount,
      currentStreak,
      maxStreak,
      avgTimePerQuestionSec,
      fastestCorrectSec: fastestCorrectSec === 999 ? 0 : fastestCorrectSec,
      complexityMap,
      pillarPercentages,
      diagnosticTier,
      achievementBadges,
    };
  }, [questions, answers, questionTimesSec, totalQuestions]);

  const standaloneHtmlCode = useMemo(
    () => generateStandaloneHtml(currentAssessment, classRoster),
    [currentAssessment, classRoster]
  );

  const handleAuthenticateWithGooglePopup = async () => {
    setIsAuthenticatingGmail(true);
    setGmailAuthNotice(null);
    try {
      const { email, displayName } = await signInWithGmailAccount();
      setStudentId(email);
      setEmailError(false);
      if (!studentWarName.trim() && displayName) {
        setStudentWarName(displayName.toUpperCase());
        setNameError(false);
      }
      if (email.trim().toLowerCase() === 'gregoriojr2003@gmail.com') {
        setIsAdminAuthenticated(true);
        try {
          localStorage.setItem('sei_cas_admin_auth', 'true');
        } catch {}
        setGmailAuthNotice(`Conta Gmail autenticada: ${email} (Administrador do App reconhecido)`);
      } else {
        setGmailAuthNotice(`Conta Gmail autenticada: ${email}`);
      }
      soundFX.playCorrect();
    } catch (err: any) {
      setGmailAuthNotice(
        err?.message ||
          'Digite seu endereço @gmail.com diretamente no campo abaixo caso o navegador bloqueie a janela pop-up.'
      );
    } finally {
      setIsAuthenticatingGmail(false);
    }
  };

  const triggerRandomAfterRegistrationRef = useRef<boolean>(false);

  // Sincroniza/reflete imediatamente o cadastro obrigatório [Nome de Guerra / Identificação do Militar] no RANKING
  const handleSyncProfileToRanking = () => {
    const cleanWar = studentWarName.trim();
    const cleanReg = studentId.trim().toLowerCase();
    const cleanCohort = studentCohort.trim();
    let hasError = false;

    if (!cleanWar) {
      setNameError(true);
      hasError = true;
    } else {
      setNameError(false);
    }

    if (!isValidGmailAddress(cleanReg)) {
      setEmailError(true);
      hasError = true;
    } else {
      setEmailError(false);
    }

    if (!cleanCohort) {
      setCohortError(true);
      hasError = true;
    } else {
      setCohortError(false);
    }

    if (hasError) {
      soundFX.playWrong();
      return false;
    }

    const cleanFullName = `${selectedRank} ${cleanWar}`.trim();
    const timeStr = new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const existing = findMatchingStudentInRoster(
      classRoster,
      cleanFullName,
      cleanReg,
      cleanCohort
    );

    const canonicalId =
      existing?.id ||
      buildCanonicalStudentId(cleanFullName, cleanCohort || '1º BPM', cleanReg);

    const registeredRecord: ClassStudentRecord = existing
      ? {
          ...existing,
          name: cleanFullName,
          registration: cleanReg,
          cohort: cleanCohort || existing.cohort || '1º BPM',
          enrolledAt: existing.enrolledAt || timeStr,
          completedAt: existing.completedAt || timeStr,
          updatedAtMs: Date.now(),
        }
      : {
          id: canonicalId,
          name: cleanFullName,
          registration: cleanReg,
          cohort: cleanCohort || '1º BPM',
          score: 0,
          tier: 'Iniciante',
          enrolledAt: timeStr,
          completedAt: timeStr,
          status: 'Em Missão',
          mode: trainingMode ? 'Treinamento' : 'Oficial',
          progressQuestions: 0,
          totalQuestionsCount: totalQuestions,
          updatedAtMs: Date.now(),
          pillarScores: {
            'Legislação PM & Regime Disciplinar': 0,
            'Direito Penal & Processual Militar': 0,
            'Direito Constitucional & Administrativo': 0,
            'Administração & Conhecimentos Gerais': 0,
          },
          attemptsCount: 1,
          history: [],
        };

    setClassRoster((prev) => {
      const next = sortAndDeduplicateRoster([...prev, registeredRecord]);
      try {
        localStorage.setItem('cfoa_pmpe_roster_zeroed_v1', JSON.stringify(next));
      } catch {}
      return next;
    });

    pushStudentToCollectiveServer(registeredRecord, existing ? 'updated' : 'enrolled');
    setRecentStudentId(registeredRecord.id);
    setRecentStudentName(cleanFullName);
    setRecentActionType(existing ? 'updated' : 'new');
    setRecentActionTime(Date.now());
    setProfileRankingSyncToast(
      `Perfil [${cleanFullName}] sincronizado e refletido no RANKING Oficial!`
    );
    soundFX.playCorrect();
    setTimeout(() => setProfileRankingSyncToast(null), 4500);
    return true;
  };

  // Iniciar Missão (Tela 1 -> Tela 2) — Exige Nome de Guerra, Conta Gmail (@gmail.com) e Unidade PMPE
  const handleStartQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    const isDirectAfterRegistration = triggerRandomAfterRegistrationRef.current;
    triggerRandomAfterRegistrationRef.current = false;

    const cleanWar = studentWarName.trim();
    const cleanReg = studentId.trim().toLowerCase();
    const cleanCohort = studentCohort.trim();
    let hasError = false;

    if (!cleanWar) {
      setNameError(true);
      hasError = true;
    } else {
      setNameError(false);
    }

    if (!isValidGmailAddress(cleanReg)) {
      setEmailError(true);
      hasError = true;
    } else {
      setEmailError(false);
    }

    if (!cleanCohort) {
      setCohortError(true);
      hasError = true;
    } else {
      setCohortError(false);
    }

    if (hasError) {
      soundFX.playWrong();
      setTimeout(() => {
        if (!cleanWar) {
          const nameEl = document.getElementById('student-name-input');
          nameEl?.focus();
          nameEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (!isValidGmailAddress(cleanReg)) {
          const emailEl = document.getElementById('student-id-input');
          emailEl?.focus();
          emailEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (!cleanCohort) {
          const cohortEl = document.getElementById('student-cohort-input');
          cohortEl?.focus();
          cohortEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
      return;
    }

    // Se o botão MISSÃO (VALENDO RANKING OFICIAL CFOA) for acionado logo após o cadastro (ou sem assunto específico selecionado), sorteia questões aleatórias do Programa Oficial CFOA PMPE
    const hasNoCustomSubjectSelected =
      selectedProgramPillar === 'ALL' &&
      selectedProgramChapterId === 'ALL' &&
      selectedProgramTheme === 'ALL' &&
      !customStudiedThemeInput.trim() &&
      !isQuickReviewMode;

    if (!customKnowledgeBase?.isCustom) {
      const useFullRandomProgram = isDirectAfterRegistration && hasNoCustomSubjectSelected;
      const activeStudiedTheme = useFullRandomProgram
        ? 'ALL'
        : customStudiedThemeInput.trim()
        ? customStudiedThemeInput.trim()
        : selectedProgramTheme;

      const resolvedComplexity = isQuickReviewMode
        ? 'Básica / Conceitual'
        : useFullRandomProgram
        ? 'ALL'
        : selectedProgramComplexity;

      const elaborated = elaborateQuestionsByProgramParameters({
        pillar: useFullRandomProgram ? 'ALL' : selectedProgramPillar,
        chapterId: useFullRandomProgram ? 'ALL' : selectedProgramChapterId,
        studiedTheme: activeStudiedTheme,
        complexity: resolvedComplexity,
        questionCount: selectedQuizLength,
        randomize: true,
      });

      setCurrentAssessment((prev) => ({
        ...prev,
        title: elaborated.scopeTitle,
        subtitle: elaborated.scopeSubtitle,
        subjectArea: elaborated.subjectAreaLabel,
        questions: elaborated.questions,
      }));
    }

    // Registra SEMPRE o aluno no RANKING e no Cloud Firestore com seu [Nome de Guerra / Identificação do Militar]
    const cleanFullName = `${selectedRank} ${cleanWar}`.trim();
    const now = new Date();
    const timeStr = now.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const existing = findMatchingStudentInRoster(
      classRoster,
      cleanFullName,
      cleanReg,
      cleanCohort
    );

    const canonicalId =
      existing?.id ||
      buildCanonicalStudentId(
        cleanFullName,
        cleanCohort || '1º BPM',
        cleanReg
      );

    const enrolledStudent: ClassStudentRecord = existing
      ? {
          ...existing,
          name: cleanFullName,
          registration: cleanReg,
          cohort: cleanCohort || existing.cohort || '1º BPM',
          enrolledAt: existing.enrolledAt || timeStr,
          completedAt: timeStr,
          status: 'Em Missão',
          mode: trainingMode ? (existing.mode === 'Oficial' ? 'Oficial' : 'Treinamento') : 'Oficial',
          progressQuestions: 0,
          totalQuestionsCount: totalQuestions,
          updatedAtMs: Date.now(),
        }
      : {
          id: canonicalId,
          name: cleanFullName,
          registration: cleanReg,
          cohort: cleanCohort || '1º BPM',
          score: 0,
          tier: 'Iniciante',
          enrolledAt: timeStr,
          completedAt: timeStr,
          status: 'Em Missão',
          mode: trainingMode ? 'Treinamento' : 'Oficial',
          progressQuestions: 0,
          totalQuestionsCount: totalQuestions,
          updatedAtMs: Date.now(),
          pillarScores: {
            'Legislação PM & Regime Disciplinar': 0,
            'Direito Penal & Processual Militar': 0,
            'Direito Constitucional & Administrativo': 0,
            'Administração & Conhecimentos Gerais': 0,
          },
          attemptsCount: 1,
          history: [],
        };

    setClassRoster((prev) => {
      const next = sortAndDeduplicateRoster([...prev, enrolledStudent]);
      try {
        localStorage.setItem('cfoa_pmpe_roster_zeroed_v1', JSON.stringify(next));
      } catch {}
      return next;
    });

    pushStudentToCollectiveServer(enrolledStudent, 'enrolled');

    setAnswers({});
    setQuestionTimesSec({});
    setCurrentQuestionIdx(0);
    setUnansweredWarning(false);
    setHitAnimation('none');
    questionStartRef.current = Date.now();
    soundFX.playSelect();
    setStep(2);
  };

  // Selecionar Alternativa na Tela 2
  const handleSelectOption = (optionIdx: number) => {
    // No Modo Treinamento, uma vez respondida a questão e exibido o feedback imediato, trava a alternativa da questão atual
    if (trainingMode && answers[currentQuestionIdx] !== undefined) {
      return;
    }

    const isFirstSelectionForQuestion = answers[currentQuestionIdx] === undefined;
    if (isFirstSelectionForQuestion) {
      const elapsedSec = Math.max(
        1,
        (Date.now() - questionStartRef.current) / 1000
      );
      setQuestionTimesSec((prev) => ({
        ...prev,
        [currentQuestionIdx]: elapsedSec,
      }));
    }

    if (trainingMode) {
      const isRight = optionIdx === currentQuestion.correctIndex;
      if (isRight) {
        soundFX.playCorrect();
        setHitAnimation('correct');
      } else {
        soundFX.playWrong();
        setHitAnimation('wrong');
      }
      setTimeout(() => setHitAnimation('none'), 400);
    } else {
      // No Modo Oficial, som neutro ao selecionar alternativa (feedback somente após a última questão)
      soundFX.playSelect();
    }

    const nextAnswers = {
      ...answers,
      [currentQuestionIdx]: optionIdx,
    };
    setAnswers(nextAnswers);
    setUnansweredWarning(false);

    // Envia progresso parcial ao vivo para o Quadro Geral e Cloud Firestore para TODOS os alunos
    const cleanWar = studentWarName.trim();
    if (cleanWar) {
      const cleanFullName = `${selectedRank} ${cleanWar}`.trim();
      const cleanReg = studentId.trim();
      const cleanCohort = studentCohort.trim() || 'CAS PMPE 2026 · 1ª TURMA';
      const answeredCount = Object.keys(nextAnswers).length;
      let partialScore = 0;
      questions.forEach((q, idx) => {
        if (nextAnswers[idx] === q.correctIndex) partialScore += q.points;
      });
      const existing = findMatchingStudentInRoster(
        classRoster,
        cleanFullName,
        cleanReg,
        cleanCohort
      );
      const timeStr = new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const canonicalId =
        existing?.id ||
        buildCanonicalStudentId(
          cleanFullName,
          cleanCohort,
          cleanReg || 'CAS-2026'
        );

      const liveRecord: ClassStudentRecord = {
        id: canonicalId,
        name: cleanFullName,
        registration: cleanReg || existing?.registration || 'CAS-2026',
        cohort: cleanCohort || existing?.cohort || 'CAS PMPE 2026 · 1ª TURMA',
        score:
          existing && existing.history && existing.history.length > 0 && answeredCount < totalQuestions
            ? Math.max(partialScore, existing.score)
            : partialScore,
        tier: partialScore >= 80 ? 'Avançado' : partialScore >= 50 ? 'Intermediário' : 'Iniciante',
        enrolledAt: existing?.enrolledAt || timeStr,
        completedAt: timeStr,
        status: 'Em Missão',
        mode: trainingMode ? (existing?.mode === 'Oficial' ? 'Oficial' : 'Treinamento') : 'Oficial',
        progressQuestions: answeredCount,
        totalQuestionsCount: totalQuestions,
        updatedAtMs: Date.now(),
        pillarScores: existing?.pillarScores || results.pillarPercentages,
        attemptsCount: existing?.attemptsCount || 1,
        history: existing?.history || [],
      };
      pushStudentToCollectiveServer(liveRecord, 'progress');
    }
  };

  // Avançar ou Finalizar Operação (Tela 2 -> Tela 3)
  const handleNextQuestion = () => {
    if (answers[currentQuestionIdx] === undefined) {
      setUnansweredWarning(true);
      soundFX.playWrong();
      return;
    }
    setUnansweredWarning(false);
    setHitAnimation('none');
    if (currentQuestionIdx < totalQuestions - 1) {
      soundFX.playSelect();
      setCurrentQuestionIdx((prev) => prev + 1);
    } else {
      const cleanWar = studentWarName.trim();
      const cleanFullName = `${selectedRank} ${cleanWar}`.trim();
      const cleanReg = studentId.trim();
      const cleanCohort = studentCohort.trim() || 'CAS PMPE 2026 · 1ª TURMA';
      const now = new Date();
      const dateStr = now.toLocaleDateString('pt-BR');
      const timeStr = now.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });

      const unlockedBadgeTitles = results.achievementBadges
        .filter((b) => b.unlocked)
        .map((b) => `${b.title} (${b.englishTag})`);

      setClassRoster((prev) => {
        // Garante que TODO aluno (Modo Oficial ou Modo Treinamento) seja elencado no Resultado Geral sem sobrescrever homônimos de outras turmas
        const existingMatch = findMatchingStudentInRoster(
          prev,
          cleanFullName,
          cleanReg,
          cleanCohort
        );

        let updatedList: ClassStudentRecord[];
        let finalHistory: StudentAttemptLog[];

        if (existingMatch) {
          setAttemptNotice('updated');
          const existing = existingMatch;
          const prevHistory: StudentAttemptLog[] =
            existing.history && existing.history.length > 0
              ? existing.history
              : existing.status === 'Em Missão'
              ? []
              : [
                  {
                    attemptNumber: 1,
                    score: existing.score,
                    tier: existing.tier,
                    patentTitle:
                      existing.score >= 80
                        ? 'Especialista / Gestor SEI'
                        : existing.score >= 50
                        ? 'Operador Prático do SEI'
                        : 'Soldado Recruta do SEI',
                    intimacyLevel:
                      existing.score >= 80
                        ? 'Avançado / Com Intimidade'
                        : existing.score >= 50
                        ? 'Intermediário / Conhecimento Básico'
                        : 'Iniciante / Sem Intimidade',
                    completedAt: existing.completedAt,
                    date: dateStr,
                    avgTimeSec: existing.avgTimeSec,
                    maxStreak: existing.maxStreak,
                    correctCount: Math.round((existing.score / 100) * totalQuestions),
                    totalQuestions,
                    pillarScores: existing.pillarScores,
                  },
                ];

          const newAttemptLog: StudentAttemptLog = {
            attemptNumber: prevHistory.length + 1,
            score: results.totalScore,
            tier: results.diagnosticTier.tierShort,
            patentTitle: results.diagnosticTier.patentTitle,
            intimacyLevel: results.diagnosticTier.intimacyLevel,
            completedAt: timeStr,
            date: dateStr,
            avgTimeSec: Math.round(results.avgTimePerQuestionSec),
            maxStreak: results.maxStreak,
            correctCount: results.correctCount,
            totalQuestions,
            pillarScores: results.pillarPercentages,
            unlockedBadges: unlockedBadgeTitles,
          };

          finalHistory = [...prevHistory, newAttemptLog];
          setCurrentStudentAttempts(finalHistory);

          const updatedStudent: ClassStudentRecord = {
            id: existing.id,
            name: cleanFullName,
            registration: cleanReg || existing.registration || 'CAS-2026',
            cohort: cleanCohort || existing.cohort || 'CAS PMPE 2026 · 1ª TURMA',
            score: results.totalScore,
            tier: results.diagnosticTier.tierShort,
            enrolledAt: existing.enrolledAt || timeStr,
            completedAt: timeStr,
            status: 'Concluído',
            mode: trainingMode ? 'Treinamento' : 'Oficial',
            progressQuestions: totalQuestions,
            totalQuestionsCount: totalQuestions,
            updatedAtMs: Date.now(),
            avgTimeSec: Math.round(results.avgTimePerQuestionSec),
            maxStreak: results.maxStreak,
            pillarScores: results.pillarPercentages,
            attemptsCount: finalHistory.length,
            history: finalHistory,
          };

          updatedList = sortAndDeduplicateRoster(
            prev.map((item) => (item.id === existing.id ? updatedStudent : item))
          );

          pushStudentToCollectiveServer(
            updatedStudent,
            prevHistory.length > 0 ? 'updated' : 'new'
          );

          setRecentStudentId(existing.id);
          setRecentStudentName(cleanFullName);
          setRecentActionType(prevHistory.length > 0 ? 'updated' : 'new');
          setRecentActionTime(Date.now());
          setTableAnimationKey((k) => k + 1);
        } else {
          setAttemptNotice('new');
          const newAttemptLog: StudentAttemptLog = {
            attemptNumber: 1,
            score: results.totalScore,
            tier: results.diagnosticTier.tierShort,
            patentTitle: results.diagnosticTier.patentTitle,
            intimacyLevel: results.diagnosticTier.intimacyLevel,
            completedAt: timeStr,
            date: dateStr,
            avgTimeSec: Math.round(results.avgTimePerQuestionSec),
            maxStreak: results.maxStreak,
            correctCount: results.correctCount,
            totalQuestions,
            pillarScores: results.pillarPercentages,
            unlockedBadges: unlockedBadgeTitles,
          };

          finalHistory = [newAttemptLog];
          setCurrentStudentAttempts(finalHistory);

          const newStudentId = buildCanonicalStudentId(
            cleanFullName,
            cleanCohort,
            cleanReg.toLowerCase()
          );
          const newRecord: ClassStudentRecord = {
            id: newStudentId,
            name: cleanFullName,
            registration: cleanReg.toLowerCase(),
            cohort: cleanCohort,
            score: results.totalScore,
            tier: results.diagnosticTier.tierShort,
            enrolledAt: timeStr,
            completedAt: timeStr,
            status: 'Concluído',
            mode: trainingMode ? 'Treinamento' : 'Oficial',
            progressQuestions: totalQuestions,
            totalQuestionsCount: totalQuestions,
            updatedAtMs: Date.now(),
            avgTimeSec: Math.round(results.avgTimePerQuestionSec),
            maxStreak: results.maxStreak,
            pillarScores: results.pillarPercentages,
            attemptsCount: 1,
            history: finalHistory,
          };

          updatedList = sortAndDeduplicateRoster([...prev, newRecord]);

          pushStudentToCollectiveServer(newRecord, 'new');

          setRecentStudentId(newStudentId);
          setRecentStudentName(cleanFullName);
          setRecentActionType('new');
          setRecentActionTime(Date.now());
          setTableAnimationKey((k) => k + 1);
        }

        try {
          localStorage.setItem('cfoa_pmpe_roster_zeroed_v1', JSON.stringify(updatedList));
        } catch (e) {}
        return updatedList;
      });

      soundFX.playVictory();
      setShowConfetti(true);
      setStep(3);
    }
  };

  const handleSimulateNewStudent = () => {
    const sampleNames = [
      'ALBUQUERQUE',
      'BARBOSA',
      'NASCIMENTO',
      'CAVALCANTI',
      'MEDEIROS',
      'FERREIRA',
      'OLIVEIRA',
      'WANDERLEY',
      'FIGUEIREDO',
      'LIMA',
      'ARAÚJO',
      'TEIXEIRA',
    ];
    const sampleRanks = ['2º SGT PM', '3º SGT PM', '1º SGT PM', 'CB PM', '1º TEN PM'];
    const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)];
    const randomRank = sampleRanks[Math.floor(Math.random() * sampleRanks.length)];
    const randomScore = [60, 70, 80, 90, 100][Math.floor(Math.random() * 5)];
    const sampleCohorts: CohortCategory[] = [
      'Turma 01',
      'Turma 02',
      'Visitantes',
    ];
    const randomCohort =
      sampleCohorts[Math.floor(Math.random() * sampleCohorts.length)];
    const cleanFullName = `${randomRank} ${randomName}`;
    const cleanReg = `${randomName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}.${Math.floor(100 + Math.random() * 899)}@gmail.com`;
    const now = new Date();
    const timeStr = now.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const dateStr = now.toLocaleDateString('pt-BR');
    const newSimId = `student-sim-${Date.now()}`;

    const newAttempt: StudentAttemptLog = {
      attemptNumber: 1,
      score: randomScore,
      tier: randomScore >= 80 ? 'Avançado' : randomScore >= 50 ? 'Intermediário' : 'Iniciante',
      patentTitle:
        randomScore >= 80
          ? 'Oficial de Administração (CFOA)'
          : randomScore >= 50
          ? 'Candidato em Evolução'
          : 'Praça em Preparação',
      intimacyLevel:
        randomScore >= 80
          ? 'Avançado / Alto Rendimento'
          : randomScore >= 50
          ? 'Intermediário / Conhecimento Básico'
          : 'Iniciante / Base Inicial',
      completedAt: timeStr,
      date: dateStr,
      avgTimeSec: 8,
      maxStreak: Math.floor(randomScore / 10),
      correctCount: Math.round(randomScore / 10),
      totalQuestions: 10,
      pillarScores: {
        'Legislação PM & Regime Disciplinar': randomScore,
        'Direito Penal & Processual Militar': randomScore,
        'Direito Constitucional & Administrativo': randomScore,
        'Administração & Conhecimentos Gerais': randomScore,
      },
    };

    const newSimRecord: ClassStudentRecord = {
      id: newSimId,
      name: cleanFullName,
      registration: cleanReg,
      cohort: randomCohort,
      score: randomScore,
      tier: newAttempt.tier,
      enrolledAt: timeStr,
      completedAt: timeStr,
      status: 'Concluído',
      progressQuestions: 10,
      totalQuestionsCount: 10,
      updatedAtMs: Date.now(),
      avgTimeSec: 8,
      maxStreak: newAttempt.maxStreak,
      pillarScores: newAttempt.pillarScores,
      attemptsCount: 1,
      history: [newAttempt],
    };

    setClassRoster((prev) => {
      const updated = sortAndDeduplicateRoster([newSimRecord, ...prev]);
      try {
        localStorage.setItem('cfoa_pmpe_roster_zeroed_v1', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    pushStudentToCollectiveServer(newSimRecord, 'new');

    setRecentStudentId(newSimId);
    setRecentStudentName(cleanFullName);
    setRecentActionType('new');
    setRecentActionTime(Date.now());
    setTableAnimationKey((k) => k + 1);
    soundFX.playVictory();
  };

  const handlePrevQuestion = () => {
    setUnansweredWarning(false);
    if (currentQuestionIdx > 0) {
      soundFX.playSelect();
      setCurrentQuestionIdx((prev) => prev - 1);
    }
  };

  const handleAdminResetRoster = async (restoreAfternoonLogs = false) => {
    const nextList: ClassStudentRecord[] = [];
    setClassRoster(nextList);
    try {
      localStorage.removeItem('sei_cas_roster_pmpe_2026');
      localStorage.setItem('cfoa_pmpe_roster_zeroed_v1', JSON.stringify(nextList));
    } catch (e) {}
    try {
      await resetFirestoreRoster(restoreAfternoonLogs);
    } catch {}
    try {
      await fetch('/api/roster/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restoreAfternoonLogs: false }),
      });
    } catch {}
    setShowAdminResetModal(false);
    setResetSuccessToast(true);
    soundFX.playSelect();
    setTimeout(() => setResetSuccessToast(false), 4000);
  };

  const handleResetQuizForNewPlayer = () => {
    setAnswers({});
    setQuestionTimesSec({});
    setCurrentQuestionIdx(0);
    setUnansweredWarning(false);
    setShowConfetti(false);
    setSelectedRank('2º SGT PM');
    setStudentWarName('');
    setStudentId('');
    setStudentCohort('');
    setNameError(false);
    setEmailError(false);
    setCohortError(false);
    setGmailAuthNotice(null);
    setCurrentStudentAttempts([]);
    soundFX.playSelect();
    setStep(1);
  };

  const handleRetrySamePlayer = () => {
    setAnswers({});
    setQuestionTimesSec({});
    setCurrentQuestionIdx(0);
    setUnansweredWarning(false);
    setShowConfetti(false);
    questionStartRef.current = Date.now();
    soundFX.playSelect();
    setStep(2);
  };

  const handleCopyResultSummary = async () => {
    const unlockedBadges = results.achievementBadges
      .filter((b) => b.unlocked)
      .map((b) => `${b.title} (${b.englishTag})`)
      .join(', ');

    const summaryLines = [
      'DESAFIO DIAGNÓSTICO CFOA PMPE — TUTOR: 1º SGT PM GREGÓRIO',
      `Militar: ${studentName}${studentId ? ` (${studentId})` : ''} · ${studentCohort}`,
      `Pontuação Final: ${results.totalScore} / 100 pontos (${results.correctCount}/${totalQuestions} missões)`,
      `Classificação Alcançada: ${results.diagnosticTier.patentTitle} (${results.diagnosticTier.intimacyLevel})`,
      `Melhor Combo Streak: ${results.maxStreak}x · Tempo Médio: ${results.avgTimePerQuestionSec.toFixed(1)}s/missão`,
      `Insígnias Desbloqueadas: ${unlockedBadges || 'Nenhuma'}`,
      '',
      'Perfil de Competência nos 4 Pilares:',
      ...COMPETENCY_PILLARS.map(
        (p) => `- ${p}: ${results.pillarPercentages[p]}%`
      ),
      '',
      '*IMPORTHOUR© - todos os direitos reservados',
    ].join('\n');

    await navigator.clipboard.writeText(summaryLines);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  const handleOpenStandaloneExportTab = () => {
    if (isAdminAuthenticated) {
      setActiveTab('standalone-export');
      soundFX.playSelect();
    } else {
      setAdminLoginIntent('standalone-export');
      setAdminPasswordInput('');
      setAdminLoginError(null);
      setShowAdminLoginModal(true);
      soundFX.playSelect();
    }
  };

  const handleAdminDownloadClick = () => {
    if (isAdminAuthenticated) {
      handleDownloadStandaloneHtml();
    } else {
      setAdminLoginIntent('download');
      setAdminPasswordInput('');
      setAdminLoginError(null);
      setShowAdminLoginModal(true);
      soundFX.playSelect();
    }
  };

  const handleAdminResetClick = () => {
    if (isAdminAuthenticated) {
      setShowAdminResetModal(true);
    } else {
      setAdminLoginIntent('reset');
      setAdminPasswordInput('');
      setAdminLoginError(null);
      setShowAdminLoginModal(true);
      soundFX.playSelect();
    }
  };

  const handleAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPwd = adminPasswordInput.trim().toLowerCase();
    const acceptedPasswords = [
      'cas2026',
      'pmpe2026',
      'cfoa2026',
      'gregorio',
      'gregório',
      'gregoriojr2003@gmail.com',
      '1ºsgt',
      '1sgt',
      'deip',
      'deip2026',
      'admin',
      '123456',
    ];

    if (acceptedPasswords.includes(cleanPwd)) {
      setIsAdminAuthenticated(true);
      try {
        localStorage.setItem('sei_cas_admin_auth', 'true');
      } catch {}
      setShowAdminLoginModal(false);
      setAdminLoginError(null);
      soundFX.playVictory();

      if (adminLoginIntent === 'standalone-export') {
        setActiveTab('standalone-export');
      } else if (adminLoginIntent === 'download') {
        handleDownloadStandaloneHtml();
      } else if (adminLoginIntent === 'reset') {
        setShowAdminResetModal(true);
      }
    } else {
      setAdminLoginError('Senha incorreta. Acesso restrito ao Instrutor / Administrador.');
      soundFX.playWrong();
    }
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    try {
      localStorage.removeItem('sei_cas_admin_auth');
    } catch {}
    if (activeTab === 'standalone-export') {
      setActiveTab('assessment');
    }
    soundFX.playSelect();
  };

  const handleDownloadStandaloneHtml = () => {
    const blob = new Blob([standaloneHtmlCode], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyStandaloneHtml = async () => {
    await navigator.clipboard.writeText(standaloneHtmlCode);
    setCopiedHtmlCode(true);
    setTimeout(() => setCopiedHtmlCode(false), 2500);
  };

  // Aciona o 'Modo Revisão Rápida' no Gerador Tático: seleciona automaticamente apenas questões de complexidade 'Básica'
  const handleActivateQuickReviewMode = (startImmediately = false) => {
    setIsQuickReviewMode(true);
    setSelectedProgramComplexity('Básica / Conceitual');
    setGenerationError(null);

    const targetQuizLen: 5 | 8 | 10 =
      desiredQuestionCount === 5 ? 5 : desiredQuestionCount === 8 ? 8 : 10;
    setSelectedQuizLength(targetQuizLen);

    const singleMatchedChapterId =
      generatorScopeMode === 'chapter' && resolvedScopeInfo.matchedChapters.length === 1
        ? resolvedScopeInfo.matchedChapters[0].id
        : selectedProgramChapterId;

    const studiedThemeForQuickReview =
      generatorScopeMode === 'subject'
        ? customSubjectQuery.trim() || resolvedScopeInfo.activeSubjectLabel || 'ALL'
        : customStudiedThemeInput.trim() || selectedProgramTheme;

    const elaborated = elaborateQuestionsByProgramParameters({
      pillar: selectedProgramPillar,
      chapterId: singleMatchedChapterId,
      studiedTheme: studiedThemeForQuickReview,
      complexity: 'Básica / Conceitual',
      questionCount: targetQuizLen,
      randomize: true,
    });

    setCurrentAssessment((prev) => ({
      ...prev,
      id: `quick-review-${Date.now()}`,
      title: elaborated.scopeTitle,
      subtitle: elaborated.scopeSubtitle,
      subjectArea: elaborated.subjectAreaLabel,
      questions: elaborated.questions,
    }));

    setAnswers({});
    setQuestionTimesSec({});
    setCurrentQuestionIdx(0);
    setGenerationSuccess(true);
    soundFX.playVictory();

    if (startImmediately) {
      setActiveTab('assessment');
      setStep(1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleGenerateFromMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerationError(null);
    setGenerationSuccess(false);

    if (!resolvedScopeInfo.isValidInApostila) {
      setGenerationError(
        'O capítulo, intervalo de páginas ou assunto escolhido não foi encontrado na Apostila Oficial DT-SEI (Págs. 07 a 75). Selecione um assunto ou intervalo presente na Apostila.'
      );
      soundFX.playWrong();
      return;
    }

    if (!customMaterial.trim() || customMaterial.trim().length < 30) {
      setGenerationError(
        'Selecione pelo menos um capítulo, intervalo de páginas (07 a 75) ou assunto da Apostila DT-SEI para formular as questões.'
      );
      return;
    }

    const activeComplexityFilter =
      isQuickReviewMode || selectedProgramComplexity === 'Básica / Conceitual'
        ? 'Básica / Conceitual'
        : selectedProgramComplexity || 'ALL';

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          material: customMaterial,
          questionCount: desiredQuestionCount,
          scopeMode: generatorScopeMode,
          scopeLabel: resolvedScopeInfo.scopeLabel,
          chapterIds: resolvedScopeInfo.matchedChapters.map((c) => c.id),
          startPage: generatorStartPage,
          endPage: generatorEndPage,
          subjectQuery:
            generatorScopeMode === 'subject'
              ? customSubjectQuery.trim() || resolvedScopeInfo.activeSubjectLabel
              : '',
          complexity: activeComplexityFilter,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Falha ao processar recorte da Apostila DT-SEI.');
      }

      const mappedQuestions: DiagnosticQuestion[] = (data.questions || []).map(
        (q: any, i: number) => ({
          ...q,
          complexity:
            activeComplexityFilter === 'Básica / Conceitual'
              ? 'Básica / Conceitual'
              : q.complexity || 'Básica / Conceitual',
          pillar:
            q.pillar && COMPETENCY_PILLARS.includes(q.pillar)
              ? q.pillar
              : resolvedScopeInfo.matchedChapters[i % Math.max(1, resolvedScopeInfo.matchedChapters.length)]
                  ?.competencyPillar || COMPETENCY_PILLARS[i % COMPETENCY_PILLARS.length],
          pageRef:
            q.pageRef ||
            resolvedScopeInfo.matchedChapters[i % Math.max(1, resolvedScopeInfo.matchedChapters.length)]
              ?.pages ||
            'Págs. 07 a 75',
          pdfPageNumber:
            typeof q.pdfPageNumber === 'number' ? q.pdfPageNumber : generatorStartPage || 10,
          apostilaExcerpt: q.apostilaExcerpt || q.explanation,
        })
      );

      const generatedAssessment: DiagnosticAssessment = {
        id: `custom-${Date.now()}`,
        title:
          data.title ||
          `${activeComplexityFilter === 'Básica / Conceitual' ? '[Modo Revisão Rápida · Básica] ' : ''}Missão DT-SEI: ${resolvedScopeInfo.scopeLabel}`,
        subtitle:
          data.subtitle ||
          `Sondagem gerada exclusivamente da Apostila Oficial DT-SEI — Recorte: ${resolvedScopeInfo.scopeLabel}.`,
        subjectArea:
          data.subjectArea ||
          `CFOA PMPE · ${resolvedScopeInfo.scopeLabel}${activeComplexityFilter === 'Básica / Conceitual' ? ' (Revisão Rápida · Básica)' : ''}`,
        estimatedMinutes: data.estimatedMinutes || 10,
        sourceMaterial: customMaterial,
        questions: mappedQuestions,
        initialClassRoster: classRoster,
      };

      const targetQuizLen: 5 | 8 | 10 =
        desiredQuestionCount === 5 ? 5 : desiredQuestionCount === 8 ? 8 : 10;

      setSelectedQuizLength(targetQuizLen);
      setCurrentAssessment(generatedAssessment);
      setAnswers({});
      setQuestionTimesSec({});
      setCurrentQuestionIdx(0);
      setStep(1);
      setGenerationSuccess(true);
      soundFX.playVictory();
    } catch (err: any) {
      setGenerationError(
        err?.message || 'Ocorreu um erro ao gerar as questões diagnósticas da Apostila.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenReviewChapter = (chapterId: string) => {
    setGeneratorScopeMode('chapter');
    setSelectedGeneratorChapters([chapterId]);
    setApostilaViewMode('mobile-reader');
    setActiveTab('material-generator');
    soundFX.playSelect();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRetryQuizWithPillar = (pillar: CompetencyPillar) => {
    const matched = APOSTILA_CHAPTERS_DATA.filter((ch) => ch.competencyPillar === pillar);
    if (matched.length > 0) {
      setGeneratorScopeMode('chapter');
      setSelectedGeneratorChapters(matched.map((m) => m.id));
    }
    handleRetrySamePlayer();
  };

  const renderBadgeIcon = (iconName: AchievementBadge['iconName']) => {
    switch (iconName) {
      case 'zap':
        return <Zap className="w-5 h-5" />;
      case 'flame':
        return <Flame className="w-5 h-5" />;
      case 'crown':
        return <Crown className="w-5 h-5" />;
      case 'shield':
        return <Shield className="w-5 h-5" />;
      case 'clock':
        return <Clock className="w-5 h-5" />;
      case 'award':
      default:
        return <Award className="w-5 h-5" />;
    }
  };

  const operationProgressPct = Math.round(
    ((currentQuestionIdx + 1) / totalQuestions) * 100
  );
  const optionLetters = ['A', 'B', 'C', 'D'];
  const selectedCurrentAnswer = answers[currentQuestionIdx];
  const unlockedBadgesCount = results.achievementBadges.filter(
    (b) => b.unlocked
  ).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#0b131e] text-slate-100 pb-20 md:pb-0">
      <ConfettiOverlay
        active={showConfetti}
        score={results.totalScore}
        onComplete={() => setShowConfetti(false)}
      />

      {/* Componente Global de Alerta Flutuante de 24h (quando fora da tela de resultados) */}
      {step !== 3 && (
        <ReviewReminderNotification
          pillarScores={results.pillarPercentages}
          studentName={studentName}
          studentCohort={studentCohort}
          onOpenApostilaChapter={handleOpenReviewChapter}
          onRetryQuizWithPillar={handleRetryQuizWithPillar}
          isResultsScreen={false}
        />
      )}
      {/* Top Bar Contract: Brand Title + Slim Quick Action Buttons Below Title */}
      <header className="bg-slate-950/95 border-b border-emerald-900/60 px-3.5 sm:px-6 py-2.5 sm:py-3 sticky top-0 z-30 backdrop-blur-md no-print">
        <div className="max-w-6xl mx-auto flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4 sm:gap-8">
            {/* Zone 1: Brand Title */}
            <a
              href="#top"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('assessment');
              }}
              className="font-display text-sm sm:text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 truncate"
            >
              QUIZ DE APROVAÇÃO SGT GREGÓRIO
            </a>

            {/* Zone 2: 4 Single-Line Nav Links (Desktop) */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
              <button
                type="button"
                onClick={() => setActiveTab('assessment')}
                className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 ${
                  activeTab === 'assessment'
                    ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                    : 'hover:text-white'
                }`}
              >
                Missão Quiz
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('class-board')}
                className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 flex items-center gap-1 ${
                  activeTab === 'class-board'
                    ? 'text-amber-400 border-b-2 border-amber-400 font-extrabold'
                    : 'hover:text-white font-bold text-amber-300'
                }`}
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>RANKING</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('material-generator')}
                className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 ${
                  activeTab === 'material-generator'
                    ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                    : 'hover:text-white'
                }`}
              >
                Programa CFOA & ALEPE
              </button>
              <button
                type="button"
                onClick={handleOpenStandaloneExportTab}
                className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 flex items-center gap-1.5 ${
                  activeTab === 'standalone-export'
                    ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                    : 'hover:text-white'
                }`}
                title={isAdminAuthenticated ? 'Área do Administrador' : 'Acesso exclusivo do Administrador'}
              >
                {isAdminAuthenticated ? (
                  <Code2 className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-amber-400/80" />
                )}
                <span>Código index.htm</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider ${
                    isAdminAuthenticated
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-700/60'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  Admin
                </span>
              </button>
            </nav>

            {/* Zone 3: Admin Action + Apoio PIX + Lembrete 24h + Sound Toggle */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Botão de Campanha de Colaboradores (PIX) */}
              <button
                type="button"
                onClick={() => {
                  setShowSupportModal(true);
                  soundFX.playSelect();
                }}
                title="Colaborar para manter o App CFOA PMPE no ar (R$ 5 / R$ 10 / R$ 15)"
                className="h-8 px-2.5 flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold rounded-lg transition cursor-pointer text-xs shrink-0 shadow-sm"
              >
                <HeartHandshake className="w-3.5 h-3.5 text-slate-950 shrink-0" />
                <span className="text-[11px] font-extrabold">Apoiar App</span>
              </button>

              {/* Botão de Acesso Rápido ao Lembrete de Revisão 24h */}
              <button
                type="button"
                onClick={() => {
                  if (activeReminderSummary) {
                    handleOpenReviewChapter(activeReminderSummary.chapterId);
                  } else {
                    setActiveTab('assessment');
                    if (step !== 3) {
                      soundFX.playSelect();
                    }
                  }
                }}
                title={
                  activeReminderSummary
                    ? `Lembrete 24h Ativo: ${activeReminderSummary.lowestPillar} (${activeReminderSummary.pages}) - Toque para revisar`
                    : 'Lembrete de Revisão em 24h da Apostila DT-SEI'
                }
                className="relative h-8 px-2 sm:px-2.5 flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 hover:border-amber-400/80 rounded-lg text-slate-300 hover:text-white transition cursor-pointer text-xs shrink-0"
              >
                <Bell className={`w-3.5 h-3.5 ${activeReminderSummary ? 'text-amber-400' : 'text-slate-400'}`} />
                <span className="hidden sm:inline text-[11px] font-bold">Revisão 24h</span>
                {activeReminderSummary && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={toggleSound}
                title={soundEnabled ? 'Silenciar efeitos sonoros' : 'Ativar efeitos sonoros'}
                className="h-8 w-8 flex items-center justify-center bg-slate-900 border border-slate-700/80 hover:border-slate-500 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
              >
                {soundEnabled ? (
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                )}
              </button>

              {isAdminAuthenticated ? (
                <div className="flex items-center gap-1.5">
                  <span className="hidden xl:flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-700/60 px-2 py-1 rounded-lg">
                    <ShieldCheck className="w-3 h-3" />
                    Admin Ativo
                  </span>
                  <button
                    type="button"
                    onClick={handleAdminLogout}
                    className="text-[11px] text-slate-400 hover:text-rose-400 px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 transition cursor-pointer"
                    title="Bloquear modo administrador"
                  >
                    Sair
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadStandaloneHtml}
                    className="h-8 px-2.5 sm:px-3 text-[11px] sm:text-xs font-bold text-slate-950 bg-amber-400 rounded-lg hover:bg-amber-300 active:scale-[0.98] transition whitespace-nowrap shrink-0 flex items-center gap-1 cursor-pointer shadow-sm"
                  >
                    <Download className="w-3 h-3" />
                    <span className="hidden sm:inline">Baixar index.html</span>
                    <span className="sm:hidden">HTML</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleAdminDownloadClick}
                  className="h-8 px-2.5 sm:px-3 text-[11px] sm:text-xs font-semibold text-slate-300 bg-slate-900/90 border border-slate-700 hover:border-amber-400/60 hover:text-white rounded-lg transition whitespace-nowrap shrink-0 flex items-center gap-1 cursor-pointer"
                  title="Acesso exclusivo ao Administrador"
                >
                  <Lock className="w-3 h-3 text-amber-400" />
                  <span className="hidden sm:inline">Baixar index.html (Admin)</span>
                  <span className="sm:hidden">Admin</span>
                </button>
              )}
            </div>
          </div>

          {/* Botões Slim e Discretos (porém visíveis e de fácil localização) abaixo do título "CAS 2026 - DT-SEI - INST. 1ºSGT PM GREGÓRIO" */}
          <div className="flex flex-wrap items-center gap-2 pt-1.5 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => {
                setActiveTab('class-board');
                soundFX.playSelect();
              }}
              className={`h-8 px-3 rounded-lg text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border ${
                activeTab === 'class-board'
                  ? 'bg-amber-400/20 border-amber-400 text-amber-300 shadow-sm'
                  : 'bg-slate-900/90 hover:bg-slate-800 border-amber-400/40 text-amber-300/95 hover:text-amber-200'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Ver Desempenho das Turmas</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('material-generator');
                soundFX.playSelect();
              }}
              className={`h-8 px-3 rounded-lg text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border ${
                activeTab === 'material-generator'
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-sm'
                  : 'bg-slate-900/90 hover:bg-slate-800 border-emerald-400/40 text-emerald-300/95 hover:text-emerald-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Ler / Baixar Apostila</span>
            </button>

            <a
              href="https://legis.alepe.pe.gov.br/"
              target="_blank"
              rel="noopener noreferrer"
              className="h-8 px-3 rounded-lg text-[11px] sm:text-xs font-bold flex items-center gap-1.5 transition border bg-amber-400/10 hover:bg-amber-400/20 border-amber-400/50 text-amber-300 hover:text-amber-200"
              title="Acessar Portal da Legislação Estadual de Pernambuco (ALEPE)"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Legislação ALEPE</span>
            </a>

            {activeTab !== 'assessment' && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('assessment');
                  soundFX.playSelect();
                }}
                className="h-8 px-3 rounded-lg text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border bg-slate-900/90 hover:bg-slate-800 border-slate-700 text-slate-200 hover:text-white"
              >
                <Target className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Voltar à Missão</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Banner Tático Corporativo (Exibido somente fora da Tela 1 para que o Briefing Inicial seja o primeiro card abaixo do cabeçalho) */}
        {(activeTab !== 'assessment' || step !== 1) && (
          <div className="mb-5 bg-gradient-to-r from-emerald-950/90 via-slate-900 to-slate-900 border border-emerald-800/60 rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 no-print">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-amber-400/15 border border-amber-400/40 flex items-center justify-center shrink-0 text-amber-400">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[11px] sm:text-xs text-amber-400 font-semibold">
                  <span>{currentAssessment.subjectArea}</span>
                  <span className="mx-1.5" aria-hidden="true">·</span>
                  <span className="font-mono-num">{totalQuestions} Missões</span>
                  <span className="mx-1.5" aria-hidden="true">·</span>
                  <span className="font-mono-num">Escala 0–100 pts</span>
                </div>
                <h1 className="font-display text-base sm:text-xl font-bold text-white tracking-tight">
                  {currentAssessment.title}
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5">
              {step === 3 ? (
                <div className="flex items-center gap-3 sm:gap-4 px-3.5 py-2 bg-slate-950/90 border border-slate-800 rounded-xl text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Score Final</span>
                    <span className="font-mono-num font-bold text-emerald-400 text-xs sm:text-sm">
                      {results.totalScore}/100
                    </span>
                  </div>
                  <div className="h-5 w-px bg-slate-800" />
                  <div>
                    <span className="text-slate-400 block text-[10px]">Melhor Combo</span>
                    <span className="font-mono-num font-bold text-amber-400 text-xs sm:text-sm flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5" />
                      {results.maxStreak}x
                    </span>
                  </div>
                  <div className="h-5 w-px bg-slate-800" />
                  <div>
                    <span className="text-slate-400 block text-[10px]">Insígnias</span>
                    <span className="font-mono-num font-bold text-amber-300 text-xs sm:text-sm">
                      {unlockedBadgesCount}/6
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 sm:gap-4 px-3.5 py-2 bg-slate-950/90 border border-slate-800 rounded-xl text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Desafio</span>
                    <span className="font-mono-num font-bold text-amber-400 text-xs sm:text-sm">
                      {totalQuestions} Questões
                    </span>
                  </div>
                  <div className="h-5 w-px bg-slate-800" />
                  <div>
                    <span className="text-slate-400 block text-[10px]">Feedback</span>
                    <span className="font-bold text-emerald-400 text-xs">
                      {trainingMode ? 'Imediato' : 'Ao Concluir'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ABA 1: OPERAÇÃO SEI EM FOCO (3 TELAS) */}
        {activeTab === 'assessment' && (
          <div className="space-y-5">
            {/* Navegador de Telas da Operação (Exibido apenas nas Telas 2 e 3 para que o Briefing Inicial seja o primeiro card abaixo do cabeçalho na Tela 1) */}
            {step !== 1 && (
              <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 sm:p-3 no-print">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="min-h-[48px] flex items-center gap-2.5 text-left p-2 rounded-xl transition cursor-pointer text-slate-400 hover:text-slate-200"
                >
                  <span className="w-7 h-7 rounded-lg font-mono-num text-xs font-bold flex items-center justify-center shrink-0 bg-emerald-600 text-white">
                    01
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate">Briefing</div>
                    <div className="text-[10px] text-slate-400 truncate hidden sm:block">
                      Identificação do Militar
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (
                      studentWarName.trim() &&
                      isValidGmailAddress(studentId.trim().toLowerCase()) &&
                      studentCohort.trim()
                    ) {
                      setStep(2);
                    }
                  }}
                  className={`min-h-[48px] flex items-center gap-2.5 text-left p-2 rounded-xl transition cursor-pointer ${
                    step === 2
                      ? 'bg-emerald-950/80 border border-emerald-600/50 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-lg font-mono-num text-xs font-bold flex items-center justify-center shrink-0 ${
                      step === 2
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    02
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate">Missões</div>
                    <div className="text-[10px] text-slate-400 truncate hidden sm:block">
                      {Object.keys(answers).length}/{totalQuestions} concluídas
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (Object.keys(answers).length === totalQuestions) setStep(3);
                  }}
                  disabled={Object.keys(answers).length < totalQuestions && step !== 3}
                  className={`min-h-[48px] flex items-center gap-2.5 text-left p-2 rounded-xl transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                    step === 3
                      ? 'bg-emerald-950/80 border border-emerald-600/50 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-lg font-mono-num text-xs font-bold flex items-center justify-center shrink-0 ${
                      step === 3
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    03
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate">Resultados</div>
                    <div className="text-[10px] text-slate-400 truncate hidden sm:block">
                      Insígnias & Gráficos
                    </div>
                  </div>
                </button>
              </div>
            )}

            {/* TELA 1: BRIEFING INICIAL + PARÂMETROS DO PROGRAMA CFOA */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
                <section className="lg:col-span-7 bg-slate-900/90 border border-emerald-900/60 rounded-2xl p-5 sm:p-8 shadow-xl">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-semibold text-amber-400">
                      Tela 1 de 3 · Briefing Inicial & Perfil Obrigatório
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950/90 border border-emerald-500/40 text-emerald-300">
                      <HeartHandshake className="w-3.5 h-3.5 text-amber-400" />
                      App 100% Grátis · Mantido pelos Usuários
                    </span>
                  </div>
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-white mb-2">
                    Guia de Aperfeiçoamento — CFOA PMPE
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                    {currentAssessment.subtitle}
                  </p>

                  <form onSubmit={handleStartQuiz} className="space-y-4 sm:space-y-5">
                    {/* 1. PASSO OBRIGATÓRIO: Cadastro de Perfil via Conta Gmail */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/90 border-2 border-sky-500/40 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
                        <div>
                          <span className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-sky-400 shrink-0" />
                            <span>PASSO OBRIGATÓRIO: Cadastro de Perfil via Conta Gmail</span>
                          </span>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            Conecte sua conta Gmail e preencha seu perfil militar completo para liberar o início da Missão
                          </span>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold border ${
                            studentWarName.trim() &&
                            isValidGmailAddress(studentId.trim().toLowerCase()) &&
                            studentCohort.trim()
                              ? 'bg-emerald-950/90 border-emerald-500/60 text-emerald-300'
                              : 'bg-amber-950/90 border-amber-500/60 text-amber-300'
                          }`}
                        >
                          {studentWarName.trim() &&
                          isValidGmailAddress(studentId.trim().toLowerCase()) &&
                          studentCohort.trim()
                            ? '✓ Perfil Completo · Missão Liberada'
                            : '⚠ Preencha o Perfil Antes da Missão'}
                        </span>
                      </div>

                      {/* Checklist visual dos 3 requisitos obrigatórios do perfil */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                        <div
                          className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 font-semibold ${
                             isValidGmailAddress(studentId.trim().toLowerCase())
                              ? 'bg-emerald-950/60 border-emerald-600/50 text-emerald-300'
                              : 'bg-slate-900 border-slate-800 text-slate-400'
                          }`}
                        >
                          {isValidGmailAddress(studentId.trim().toLowerCase()) ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <span className="w-3.5 h-3.5 rounded-full border border-slate-600 inline-block shrink-0" />
                          )}
                          <span className="truncate">1. Conta Gmail (@gmail.com)</span>
                        </div>
                        <div
                          className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 font-semibold ${
                            studentWarName.trim()
                              ? 'bg-emerald-950/60 border-emerald-600/50 text-emerald-300'
                              : 'bg-slate-900 border-slate-800 text-slate-400'
                          }`}
                        >
                          {studentWarName.trim() ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <span className="w-3.5 h-3.5 rounded-full border border-slate-600 inline-block shrink-0" />
                          )}
                          <span className="truncate">2. Graduação + Nome de Guerra</span>
                        </div>
                        <div
                          className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 font-semibold ${
                            studentCohort.trim()
                              ? 'bg-emerald-950/60 border-emerald-600/50 text-emerald-300'
                              : 'bg-slate-900 border-slate-800 text-slate-400'
                          }`}
                        >
                          {studentCohort.trim() ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <span className="w-3.5 h-3.5 rounded-full border border-slate-600 inline-block shrink-0" />
                          )}
                          <span className="truncate">3. Unidade (OPM / PMPE)</span>
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="student-name-input"
                          className="block text-sm font-medium text-slate-200 mb-1.5"
                        >
                          Nome de Guerra / Identificação do Militar{' '}
                          <span className="text-rose-400 font-semibold">* (perfil obrigatório)</span>
                        </label>
                        <div className="relative flex rounded-xl border border-slate-700 bg-slate-950 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 overflow-hidden shadow-inner">
                          <button
                            type="button"
                            onClick={() => setShowRankModal(true)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-3 bg-emerald-950/80 hover:bg-emerald-900 active:bg-emerald-800 text-amber-400 font-mono-num font-bold text-xs sm:text-sm border-r border-slate-800 transition cursor-pointer select-none shrink-0"
                            title="Clique para abrir a janela flutuante e escolher sua graduação/patente"
                          >
                            <span>{selectedRank}</span>
                            <ChevronDown className="w-3.5 h-3.5 text-amber-400/80" />
                          </button>
                          <input
                            id="student-name-input"
                            type="text"
                            value={studentWarName}
                            onChange={(e) => {
                              setStudentWarName(e.target.value);
                              if (nameError) setNameError(false);
                            }}
                            placeholder="Digite seu Nome de Guerra (ex.: CARLOS EDUARDO)"
                            className="w-full min-h-[48px] px-3.5 py-3 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
                          />
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Toque no botão <strong className="text-amber-400">{selectedRank}</strong> para abrir a janela flutuante e trocar sua graduação ou patente.
                        </p>
                        {nameError && (
                          <p className="text-xs text-rose-400 mt-1.5 font-semibold">
                            Perfil obrigatório antes da missão: preencha o Nome de Guerra do militar.
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <label
                              htmlFor="student-id-input"
                              className="block text-sm font-medium text-slate-200"
                            >
                              Conta de E-mail GMAIL{' '}
                              <span className="text-rose-400 font-semibold">* (obrigatório)</span>
                            </label>
                            <button
                              type="button"
                              onClick={handleAuthenticateWithGooglePopup}
                              disabled={isAuthenticatingGmail}
                              className="text-[11px] font-bold text-amber-300 hover:text-amber-200 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 px-2.5 py-1 rounded-lg transition cursor-pointer disabled:opacity-50"
                            >
                              {isAuthenticatingGmail ? 'Conectando Gmail...' : 'Conectar Conta Gmail'}
                            </button>
                          </div>
                          <input
                            id="student-id-input"
                            type="email"
                            required
                            value={studentId}
                            onChange={(e) => {
                              setStudentId(e.target.value);
                              if (emailError) setEmailError(false);
                            }}
                            placeholder="Ex.: seu.email@gmail.com"
                            className={`w-full min-h-[48px] px-4 py-3 bg-slate-950 border rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition ${
                              emailError
                                ? 'border-rose-500 ring-1 ring-rose-500/50'
                                : 'border-slate-700'
                            }`}
                          />
                          {emailError && (
                            <p className="text-xs text-rose-400 mt-1.5 font-semibold">
                              Conexão obrigatória via Gmail: autentique ou informe sua conta válida terminada em @gmail.com antes da missão.
                            </p>
                          )}
                          {gmailAuthNotice && !emailError && (
                            <p className="text-[11px] text-emerald-400 mt-1 font-medium">
                              {gmailAuthNotice}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="student-cohort-input"
                            className="block text-sm font-medium text-slate-200 mb-1.5"
                          >
                            UNIDADE (OPM){' '}
                            <span className="text-rose-400 font-semibold">* (obrigatório)</span>
                          </label>
                          <select
                            id="student-cohort-input"
                            value={studentCohort}
                            onChange={(e) => {
                              setStudentCohort(e.target.value);
                              if (cohortError) setCohortError(false);
                            }}
                            required
                            className={`w-full min-h-[48px] px-4 py-3 bg-slate-950 border rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition cursor-pointer ${
                              cohortError
                                ? 'border-rose-500 ring-1 ring-rose-500/50'
                                : 'border-slate-700'
                            }`}
                          >
                            <option value="" disabled>-- Selecione a UNIDADE --</option>
                            {PMPE_UNITS.map((unit) => (
                              <option key={unit} value={unit}>
                                {unit}
                              </option>
                            ))}
                          </select>
                          {cohortError && (
                            <p className="text-xs text-rose-400 mt-1.5 font-semibold">
                              Perfil obrigatório antes da missão: selecione a UNIDADE do militar.
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Vínculo Direto do Cadastro Obrigatório com o RANKING Oficial */}
                      <div className="pt-2 border-t border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="text-[11px] text-slate-300">
                          <span className="font-bold text-amber-300">Classificação no RANKING:</span>{' '}
                          {studentWarName.trim() ? (
                            <>
                              Seu perfil{' '}
                              <strong className="text-white font-mono-num">
                                {studentName}
                              </strong>{' '}
                              é usado diretamente na classificação e acompanhamento de desempenho do{' '}
                              <strong className="text-amber-300">RANKING</strong>.
                            </>
                          ) : (
                            'Preencha seu Nome de Guerra, Gmail e Unidade para refletir seu perfil no RANKING.'
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={handleSyncProfileToRanking}
                            className="px-3 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/60 text-amber-200 font-extrabold text-[11px] flex items-center gap-1.5 transition cursor-pointer"
                            title="Vincular ou atualizar seu cadastro obrigatório diretamente no RANKING da turma"
                          >
                            <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>Refletir Cadastro no RANKING</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab('class-board');
                              soundFX.playSelect();
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-300 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
                          >
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>Abrir RANKING</span>
                          </button>
                        </div>
                      </div>
                      {profileRankingSyncToast && (
                        <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-xs font-bold flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>{profileRankingSyncToast}</span>
                        </div>
                      )}
                    </div>

                    {/* 2. Quantas questões você deseja responder nesta Missão? */}
                    <div className="p-4 bg-slate-950/95 border-2 border-emerald-500/40 rounded-2xl space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="text-xs sm:text-sm font-black text-white block">
                            Quantas questões você deseja responder nesta Missão?
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Escolha a bateria de questões da missão (valendo 100 pontos no total)
                          </span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/50 text-amber-300 font-mono-num text-xs font-bold">
                          Escolhido: {selectedQuizLength} questões
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2.5">
                        {([5, 8, 10] as const).map((countOption) => {
                          const isSelectedCount = selectedQuizLength === countOption;
                          return (
                            <button
                              key={countOption}
                              type="button"
                              onClick={() => {
                                setSelectedQuizLength(countOption);
                                setDesiredQuestionCount(countOption);
                                setAnswers({});
                                setCurrentQuestionIdx(0);
                                soundFX.playSelect();
                              }}
                              className={`min-h-[52px] p-2.5 rounded-xl border-2 font-mono-num transition-all cursor-pointer flex flex-col items-center justify-center ${
                                isSelectedCount
                                  ? 'bg-gradient-to-b from-amber-300 to-amber-400 text-slate-950 border-amber-100 font-black shadow-lg shadow-amber-400/25 scale-[1.02]'
                                  : 'bg-slate-900 text-slate-200 border-slate-700 hover:border-amber-400/60 font-bold'
                              }`}
                            >
                              <span className="text-sm sm:text-base font-black">
                                {countOption} Questões
                              </span>
                              <span
                                className={`text-[10px] ${
                                  isSelectedCount ? 'text-slate-900 font-bold' : 'text-slate-400'
                                }`}
                              >
                                Vale 100 pts
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 3. [botão] MISSÃO (VALENDO RANKING OFICIAL CFOA) — Se acionado logo após o cadastro, faz questões aleatórias */}
                    <button
                      type="submit"
                      onClick={() => {
                        triggerRandomAfterRegistrationRef.current = true;
                      }}
                      className={`w-full min-h-[54px] px-5 py-3.5 active:scale-[0.98] text-slate-950 font-black text-xs sm:text-base rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xl border-2 whitespace-nowrap ${
                        trainingMode
                          ? 'bg-gradient-to-r from-cyan-300 via-cyan-400 to-teal-300 hover:from-cyan-200 hover:to-teal-200 shadow-cyan-500/30 border-cyan-100'
                          : 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400 hover:from-emerald-300 hover:to-teal-300 shadow-emerald-500/30 border-emerald-200'
                      }`}
                    >
                      <Target className="w-5 h-5 stroke-[2.5] shrink-0" />
                      <span>
                        {trainingMode
                          ? 'MISSÃO (MODO TREINAMENTO · SEM RANKING)'
                          : 'MISSÃO (VALENDO RANKING OFICIAL CFOA)'}
                      </span>
                      <ArrowRight className="w-5 h-5 stroke-[2.5] shrink-0" />
                    </button>

                    {/* 4. ESCOLHA O ASSUNTO DAS QUESTÕES (PROGRAMA OFICIAL CFOA PMPE) */}
                    <div className="p-4 sm:p-5 bg-slate-950/95 border-2 border-amber-400/50 rounded-2xl space-y-4 shadow-lg">
                      <div className="flex flex-wrap items-start justify-between gap-2 pb-2.5 border-b border-slate-800">
                        <div>
                          <span className="text-xs sm:text-sm font-black text-amber-300 flex items-center gap-1.5">
                            <BookOpen className="w-4 h-4 text-amber-400 shrink-0" />
                            <span>ESCOLHA O ASSUNTO DAS QUESTÕES (PROGRAMA OFICIAL CFOA PMPE)</span>
                          </span>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            Defina os parâmetros abaixo para selecionar o eixo, a disciplina e o tema estudado que serão cobrados na sua Missão (ou acione MISSÃO acima para questões aleatórias)
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Botão Modo Revisão Rápida (Complexidade Básica) */}
                          <button
                            type="button"
                            onClick={() => handleActivateQuickReviewMode(!isQuickReviewMode)}
                            className={`px-3 py-1.5 rounded-xl text-[11px] font-black flex items-center gap-1.5 transition cursor-pointer border-2 shadow-md ${
                              isQuickReviewMode || selectedProgramComplexity === 'Básica / Conceitual'
                                ? 'bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-300 text-slate-950 border-white shadow-amber-400/30'
                                : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-400/60'
                            }`}
                            title="Seleciona automaticamente apenas questões de complexidade 'Básica' para um ciclo de estudos focado antes de missões complexas"
                          >
                            <Zap className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              {isQuickReviewMode || selectedProgramComplexity === 'Básica / Conceitual'
                                ? '⚡ Modo Revisão Rápida ATIVO (Complexidade Básica)'
                                : '⚡ Modo Revisão Rápida (Questões Básicas)'}
                            </span>
                          </button>

                          {(selectedProgramPillar !== 'ALL' ||
                            selectedProgramChapterId !== 'ALL' ||
                            selectedProgramTheme !== 'ALL' ||
                            customStudiedThemeInput.trim() !== '' ||
                            selectedProgramComplexity !== 'ALL' ||
                            isQuickReviewMode) && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedProgramPillar('ALL');
                                setSelectedProgramChapterId('ALL');
                                setSelectedProgramTheme('ALL');
                                setCustomStudiedThemeInput('');
                                setSelectedProgramComplexity('ALL');
                                setIsQuickReviewMode(false);
                                setAnswers({});
                                setCurrentQuestionIdx(0);
                                soundFX.playSelect();
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] font-bold text-slate-300 hover:text-white transition cursor-pointer"
                            >
                              Restaurar Programa Completo
                            </button>
                          )}
                        </div>
                      </div>

                      {(isQuickReviewMode || selectedProgramComplexity === 'Básica / Conceitual') && (
                        <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-400/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2 text-amber-200">
                            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                            <span>
                              <strong className="text-amber-300">Modo Revisão Rápida Ativado:</strong>{' '}
                              Gerando exclusivamente questões de complexidade <strong>Básica / Conceitual</strong> para aquecimento e fixação de conceitos antes de missões complexas.
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleActivateQuickReviewMode(false)}
                            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px] font-bold border border-slate-700 cursor-pointer shrink-0"
                          >
                            Voltar p/ Misto
                          </button>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {/* Parâmetro 1: Eixo / Bloco Programático */}
                        <div>
                          <label
                            htmlFor="program-pillar-select"
                            className="block text-xs font-bold text-slate-200 mb-1"
                          >
                            1. Eixo Programático do Edital CFOA
                          </label>
                          <select
                            id="program-pillar-select"
                            value={selectedProgramPillar}
                            onChange={(e) => {
                              const nextPillar = e.target.value as 'ALL' | CompetencyPillar;
                              setSelectedProgramPillar(nextPillar);
                              setSelectedProgramChapterId('ALL');
                              setSelectedProgramTheme('ALL');
                              setAnswers({});
                              setCurrentQuestionIdx(0);
                              soundFX.playSelect();
                            }}
                            className="w-full min-h-[44px] px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
                          >
                            <option value="ALL">Todos os Eixos (Programa Completo - Blocos I e II)</option>
                            {COMPETENCY_PILLARS.map((pillar) => (
                              <option key={pillar} value={pillar}>
                                {pillar}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Parâmetro 2: Disciplina / Módulo do Programa */}
                        <div>
                          <label
                            htmlFor="program-chapter-select"
                            className="block text-xs font-bold text-slate-200 mb-1"
                          >
                            2. Disciplina / Módulo do Programa ({filteredProgramChapters.length} disponíveis)
                          </label>
                          <select
                            id="program-chapter-select"
                            value={selectedProgramChapterId}
                            onChange={(e) => {
                              const nextChap = e.target.value;
                              setSelectedProgramChapterId(nextChap);
                              setSelectedProgramTheme('ALL');
                              setAnswers({});
                              setCurrentQuestionIdx(0);
                              soundFX.playSelect();
                            }}
                            className="w-full min-h-[44px] px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
                          >
                            <option value="ALL">Todas as Disciplinas deste Eixo</option>
                            {filteredProgramChapters.map((ch) => (
                              <option key={ch.id} value={ch.id}>
                                {ch.number} — {ch.title}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Parâmetro 3: Tema Estudado (Subtópico Oficial da Ementa) */}
                        <div>
                          <label
                            htmlFor="program-theme-select"
                            className="block text-xs font-bold text-slate-200 mb-1"
                          >
                            3. Tema Estudado (Ementa Oficial do Programa)
                          </label>
                          <select
                            id="program-theme-select"
                            value={selectedProgramTheme}
                            onChange={(e) => {
                              setSelectedProgramTheme(e.target.value);
                              if (e.target.value !== 'ALL') {
                                setCustomStudiedThemeInput('');
                              }
                              setAnswers({});
                              setCurrentQuestionIdx(0);
                              soundFX.playSelect();
                            }}
                            className="w-full min-h-[44px] px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
                          >
                            <option value="ALL">Todos os Tópicos da Disciplina Selecionada</option>
                            {availableProgramThemes.map((theme) => (
                              <option key={theme} value={theme}>
                                {theme}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Parâmetro 4: Nível de Exigência / Complexidade da Banca */}
                        <div>
                          <label
                            htmlFor="program-complexity-select"
                            className="block text-xs font-bold text-slate-200 mb-1"
                          >
                            4. Nível de Exigência (Padrão IAUPE / AOCP)
                          </label>
                          <select
                            id="program-complexity-select"
                            value={selectedProgramComplexity || 'ALL'}
                            onChange={(e) => {
                              const nextComp = e.target.value as ProgramSelectionParameters['complexity'];
                              setSelectedProgramComplexity(nextComp);
                              setIsQuickReviewMode(nextComp === 'Básica / Conceitual');
                              setAnswers({});
                              setCurrentQuestionIdx(0);
                              soundFX.playSelect();
                            }}
                            className="w-full min-h-[44px] px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
                          >
                            <option value="ALL">Calibragem Mista de Prova (Todos os Níveis)</option>
                            <option value="Básica / Conceitual">Básica / Conceitual (Lei Seca & Fundamentos)</option>
                            <option value="Intermediária / Aplicação">Intermediária / Aplicação Prática PMPE</option>
                            <option value="Avançada / Análise">Avançada / Análise de Casos e Jurisprudência</option>
                          </select>
                        </div>
                      </div>

                      {/* Campo opcional para digitar um tema específico estudado ou lei da ALEPE */}
                      <div>
                        <label
                          htmlFor="custom-studied-theme-input"
                          className="block text-xs font-bold text-slate-200 mb-1"
                        >
                          Filtro Específico por Tema Estudado ou Norma da ALEPE (Opcional)
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            id="custom-studied-theme-input"
                            type="text"
                            value={customStudiedThemeInput}
                            onChange={(e) => {
                              setCustomStudiedThemeInput(e.target.value);
                              setAnswers({});
                              setCurrentQuestionIdx(0);
                            }}
                            placeholder="Ex.: Lei 6.783/1974, Conselho de Disciplina, Inquérito Policial Militar, LRF, Licitações..."
                            className="w-full min-h-[42px] px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                          />
                          {customStudiedThemeInput.trim() && (
                            <button
                              type="button"
                              onClick={() => {
                                setCustomStudiedThemeInput('');
                                soundFX.playSelect();
                              }}
                              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold shrink-0 cursor-pointer"
                            >
                              Limpar Filtro
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Resumo do Tema Estudado Selecionado */}
                      <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>Tema Ativo para Elaboração das Questões:</span>
                          </div>
                          <p className="text-xs font-extrabold text-white">
                            {currentAssessment.subjectArea}
                          </p>
                          {selectedProgramChapterId !== 'ALL' && (
                            <p className="text-[11px] text-amber-300/90">
                              Base Legal ALEPE:{' '}
                              {APOSTILA_CHAPTERS_DATA.find((c) => c.id === selectedProgramChapterId)
                                ?.normativeBase || 'Legislação Estadual PMPE (ALEPE)'}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setApostilaViewMode('generator');
                            setActiveTab('material-generator');
                            soundFX.playSelect();
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="min-h-[36px] px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/50 text-sky-200 text-[11px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-sky-300 shrink-0" />
                          <span>Gerador IA Avançado & Leitor do Programa</span>
                        </button>
                      </div>
                    </div>

                    {/* 5. Escolha a Modalidade da Missão: */}
                    <div className="p-4 bg-slate-950/95 border-2 border-cyan-500/40 rounded-2xl space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="text-xs sm:text-sm font-black text-white block">
                            Escolha a Modalidade da Missão:
                          </span>
                          <span className="text-[11px] text-slate-400">
                            No Modo Treinamento você vê o gabarito a cada questão, mas não pontua no Ranking Geral
                          </span>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                            trainingMode
                              ? 'bg-cyan-400/20 border-cyan-400/60 text-cyan-300'
                              : 'bg-emerald-500/20 border-emerald-400/60 text-emerald-300'
                          }`}
                        >
                          {trainingMode ? 'Modo Treinamento Ativo' : 'Modo Oficial (Ranking)'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            setTrainingMode(false);
                            setAnswers({});
                            setCurrentQuestionIdx(0);
                            soundFX.playSelect();
                          }}
                          className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                            !trainingMode
                              ? 'bg-gradient-to-b from-emerald-400 to-emerald-500 text-slate-950 border-emerald-100 shadow-lg shadow-emerald-500/25 scale-[1.01]'
                              : 'bg-slate-900 text-slate-200 border-slate-700 hover:border-emerald-400/60'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs sm:text-sm font-black flex items-center gap-1.5">
                              <Trophy className="w-4 h-4 shrink-0" />
                              <span>Modo Oficial (Desafio)</span>
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-black uppercase ${
                                !trainingMode
                                  ? 'bg-slate-950 text-emerald-300'
                                  : 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                              }`}
                            >
                              Vale Ranking
                            </span>
                          </div>
                          <p
                            className={`text-[11px] leading-snug ${
                              !trainingMode ? 'text-slate-900 font-semibold' : 'text-slate-400'
                            }`}
                          >
                            Feedback somente após a última questão. Registra sua nota e patente no <strong>Ranking Geral da Turma</strong>.
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setTrainingMode(true);
                            setAnswers({});
                            setCurrentQuestionIdx(0);
                            soundFX.playSelect();
                          }}
                          className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                            trainingMode
                              ? 'bg-gradient-to-b from-cyan-300 to-cyan-400 text-slate-950 border-cyan-100 shadow-lg shadow-cyan-400/25 scale-[1.01]'
                              : 'bg-slate-900 text-slate-200 border-slate-700 hover:border-cyan-400/60'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs sm:text-sm font-black flex items-center gap-1.5">
                              <BookOpen className="w-4 h-4 shrink-0" />
                              <span>Modo Treinamento</span>
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-black uppercase ${
                                trainingMode
                                  ? 'bg-slate-950 text-amber-300'
                                  : 'bg-amber-950/80 text-amber-300 border border-amber-700/60'
                              }`}
                            >
                              Sem Ranking
                            </span>
                          </div>
                          <p
                            className={`text-[11px] leading-snug ${
                              trainingMode ? 'text-slate-900 font-semibold' : 'text-slate-400'
                            }`}
                          >
                            Mostra <strong>feedback imediato a cada questão</strong> + Jornal Pop, com o custo de <strong>não registrar pontuação no Ranking Geral</strong>.
                          </p>
                        </button>
                      </div>
                    </div>

                    {/* 6. [botão] "Regularizar / Incluir Aluno" (Visível exclusivamente para o ADM) */}
                    {isAdminUser && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowManualStudentModal(true);
                          soundFX.playSelect();
                        }}
                        className="w-full min-h-[50px] px-4 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs sm:text-sm font-black rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg border-2 border-amber-200"
                        title="Incluir ou regularizar imediatamente qualquer aluno no Resultado Geral (Exclusivo Admin)"
                      >
                        <UserPlus className="w-4 h-4 shrink-0" />
                        <span>Regularizar / Incluir Aluno</span>
                      </button>
                    )}

                    {/* 7. GESTÃO, ATUALIZAÇÕES E ACESSO (VISÃO EXCLUSIVA ADMIN) */}
                    {isAdminUser && (
                      <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/95 border-2 border-amber-400/50 space-y-3">
                        <div className="flex items-center justify-between gap-2 text-xs sm:text-sm font-extrabold text-amber-300">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                            <span>GESTÃO, ATUALIZAÇÕES E ACESSO (VISÃO EXCLUSIVA ADMIN)</span>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/60 text-[10px] font-bold uppercase">
                            Somente Admin
                          </span>
                        </div>
                        <ul className="space-y-2 text-xs text-slate-200 leading-relaxed">
                          <li className="flex items-start gap-2">
                            <span className="w-5 h-5 rounded-full bg-amber-400/20 border border-amber-400/50 text-amber-300 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                              1
                            </span>
                            <span>
                              <strong className="text-amber-300">Atualizações do Programa e Melhorias pelo Administrador:</strong>{' '}
                              Todas as <strong>atualizações do programa de estudos</strong> (novos tópicos do edital CFOA, legislações da ALEPE e baterias de questões IAUPE/AOCP), bem como <strong>melhorias técnicas e operacionais</strong> no aplicativo, são efetuadas diretamente pelo <strong>Administrador do App</strong>.
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="w-5 h-5 rounded-full bg-sky-400/20 border border-sky-400/50 text-sky-300 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                              2
                            </span>
                            <span>
                              <strong className="text-sky-300">Conexão via Conta Gmail e Perfil Obrigatório Antes da Missão:</strong>{' '}
                              Os usuários se conectam através de suas <strong>contas Gmail (@gmail.com)</strong> e são <strong>obrigados a preencher o Perfil do Candidato</strong> (Graduação/Patente, Nome de Guerra, Conta Gmail e Unidade PMPE) <strong>antes de iniciar qualquer missão</strong>.
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="w-5 h-5 rounded-full bg-emerald-400/20 border border-emerald-400/50 text-emerald-300 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                              3
                            </span>
                            <span>
                              <strong className="text-emerald-300">Aplicativo 100% Grátis Mantido pelos Usuários:</strong>{' '}
                              Este aplicativo é <strong>totalmente grátis</strong> para toda a tropa, mas <strong>é mantido no ar pelos seus próprios usuários através de colaborações voluntárias</strong> (R$ 5,00 / R$ 10,00 / R$ 15,00) para custear servidor em nuvem e banco de dados ativo.
                            </span>
                          </li>
                        </ul>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          <button
                            type="button"
                            onClick={handleOpenStandaloneExportTab}
                            className="w-full py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow"
                          >
                            <ShieldCheck className="w-4 h-4 shrink-0" />
                            <span>Painel de Gestão Admin</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowSupportModal(true);
                              soundFX.playSelect();
                            }}
                            className="w-full py-2.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow"
                          >
                            <HeartHandshake className="w-4 h-4 shrink-0" />
                            <span>Campanha PIX</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Demais cards na sequência após os itens acima */}
                    {trainingMode ? (
                      <div className="p-3.5 bg-cyan-950/40 border border-cyan-700/60 rounded-xl flex items-start gap-3 text-xs">
                        <div className="w-5 h-5 rounded-full bg-cyan-400/20 text-cyan-300 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                          !
                        </div>
                        <div className="space-y-1">
                          <strong className="text-cyan-300 block font-semibold">
                            Modo Treinamento Selecionado (Feedback Imediato · Sem Registro no Ranking Geral):
                          </strong>
                          <p className="text-slate-300 leading-relaxed">
                            • Ao responder cada questão, você verá <strong>imediatamente</strong> se acertou ou errou, a fundamentação legal na ALEPE e o botão do <strong>Jornal Pop</strong>.<br />
                            • <strong>Custo do Modo Treinamento:</strong> sua pontuação servirá apenas para estudo individual e <strong>NÃO será registrada no Ranking Geral da Turma</strong>.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3.5 bg-emerald-950/40 border border-emerald-800/50 rounded-xl flex items-start gap-3 text-xs">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                          ✓
                        </div>
                        <div className="space-y-1">
                          <strong className="text-white block font-semibold">
                            Regras do Desafio Oficial (Feedback Somente ao Concluir + Valendo Ranking Geral):
                          </strong>
                          <p className="text-slate-300 leading-relaxed">
                            • Ao responder cada questão e prosseguir, <strong>não é permitido voltar para alterar a resposta</strong>.<br />
                            • O <strong>feedback completo</strong> (com gabarito comentado, dispositivos da ALEPE e <strong>Jornal Pop</strong>) é exibido assim que você concluir e enviar a última questão.<br />
                            • Você pode refazer o desafio <strong>quantas vezes quiser</strong> — prevalecerá a última nota no Ranking Geral!
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t border-slate-800">
                      <button
                        type="submit"
                        className={`w-full min-h-[56px] px-6 py-4 active:scale-[0.98] text-slate-950 font-black text-sm sm:text-base rounded-2xl transition flex items-center justify-center gap-2.5 cursor-pointer shadow-xl border-2 whitespace-nowrap ${
                          trainingMode
                            ? 'bg-gradient-to-r from-cyan-300 via-cyan-400 to-teal-300 hover:from-cyan-200 hover:to-teal-200 shadow-cyan-500/30 border-cyan-100'
                            : 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400 hover:from-emerald-300 hover:to-teal-300 shadow-emerald-500/30 border-emerald-200'
                        }`}
                      >
                        <Target className="w-5 h-5 stroke-[2.5] shrink-0" />
                        <span>
                          {trainingMode
                            ? 'MISSÃO (INICIAR MODO TREINAMENTO)'
                            : 'MISSÃO (INICIAR DESAFIO OFICIAL CFOA)'}
                        </span>
                        <ArrowRight className="w-5 h-5 stroke-[2.5] shrink-0" />
                      </button>
                    </div>
                  </form>
                </section>

                {/* Card Lateral: Patentes e Insígnias de Conquista */}
                <aside className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-8 space-y-6">

                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-2">
                      <Trophy className="w-4 h-4" />
                      <span>Patentes e Níveis de Preparação CFOA</span>
                    </div>
                    <h3 className="font-display text-base font-bold text-white mb-2">
                      Escala de Classificação CFOA PMPE
                    </h3>
                    <div className="space-y-2.5 text-xs mt-3">
                      <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-700/50 flex items-center justify-between gap-3">
                        <div>
                          <span className="font-bold text-amber-300 block">
                            ▲ Praça em Preparação Inicial
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Iniciante — Reforçar leitura da Lei Seca (ALEPE)
                          </span>
                        </div>
                        <span className="font-mono-num font-bold text-amber-300 whitespace-nowrap">
                          0–49 pts
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-sky-950/40 border border-sky-700/50 flex items-center justify-between gap-3">
                        <div>
                          <span className="font-bold text-sky-300 block">
                            ● Candidato Competitivo CFOA
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Intermediário — Domina a base IAUPE / AOCP
                          </span>
                        </div>
                        <span className="font-mono-num font-bold text-sky-300 whitespace-nowrap">
                          50–79 pts
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-700/50 flex items-center justify-between gap-3">
                        <div>
                          <span className="font-bold text-emerald-300 block">
                            ★ Oficial de Administração (Apto CFOA)
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Avançado — Excelência no Programa Oficial
                          </span>
                        </div>
                        <span className="font-mono-num font-bold text-emerald-300 whitespace-nowrap">
                          80–100 pts
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Preview das Achievement Badges */}
                  <div className="pt-4 border-t border-slate-800 space-y-2.5">
                    <div className="text-xs font-semibold text-white flex items-center justify-between">
                      <span>Insígnias Desbloqueáveis na Missão:</span>
                      <span className="text-[11px] text-amber-400 font-mono-num">
                        6 Medalhas
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                      <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="truncate">Fast Responder (≤15s)</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center gap-2">
                        <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">Perfect Combo (5x+)</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center gap-2">
                        <Crown className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">CFOA Master (80+ pts)</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="truncate">Mestre da Lei (ALEPE)</span>
                      </div>
                    </div>
                  </div>
                </aside>

                {/* PAINEL COLETIVO PÚBLICO DIRETO NA TELA INICIAL: TABELA ÚNICA + COMPARATIVO 1ª VS 2ª TURMA + LAPSO 13H–18H */}
                <div className="lg:col-span-12 space-y-6 pt-2">
                  <section className="bg-slate-900/90 border border-emerald-800/70 rounded-2xl p-5 sm:p-8 shadow-xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-1">
                          <Trophy className="w-4 h-4 text-amber-400" />
                          <span>RANKING OFICIAL · Classificação pelo Cadastro Obrigatório dos Alunos</span>
                        </div>
                        <h2 className="font-display text-lg sm:text-xl font-bold text-white">
                          RANKING — Desempenho e Competição Saudável ({classRoster.length} Militares Cadastrados)
                        </h2>
                        <p className="text-xs text-slate-300 mt-1">
                          Toda a classificação reflete o <strong>cadastro obrigatório dos alunos [Nome de Guerra / Identificação do Militar]</strong>, Conta Gmail e Unidade (OPM), com acompanhamento contínuo de desempenho, precisão média e evolução de notas para uma <strong>competição saudável</strong>.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 self-start">
                        {isAdminUser && (
                          <button
                            type="button"
                            onClick={() => {
                              setShowManualStudentModal(true);
                              soundFX.playSelect();
                            }}
                            className="min-h-[40px] px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md"
                            title="Incluir ou regularizar imediatamente qualquer aluno no Resultado Geral (Exclusivo Admin)"
                          >
                            <UserPlus className="w-4 h-4 shrink-0" />
                            <span>Regularizar / Incluir Aluno</span>
                          </button>
                        )}
                        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                          <button
                            type="button"
                            onClick={() => setTableFilter('ALL')}
                            className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                              tableFilter === 'ALL'
                                ? 'bg-amber-400 text-slate-950'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            Todas ({classRoster.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setTableFilter('Turma 01')}
                            className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                              tableFilter === 'Turma 01'
                                ? 'bg-emerald-500 text-slate-950'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            Turma 01
                          </button>
                          <button
                            type="button"
                            onClick={() => setTableFilter('Turma 02')}
                            className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                              tableFilter === 'Turma 02'
                                ? 'bg-sky-400 text-slate-950'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            Turma 02
                          </button>
                          <button
                            type="button"
                            onClick={() => setTableFilter('Visitantes')}
                            className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                              tableFilter === 'Visitantes'
                                ? 'bg-purple-400 text-slate-950'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            Visitantes
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Cards Mobile-First + Comparativo Rápido 1ª vs 2ª Turma + Busca Individual */}
                    <div className="mb-5">
                      <MobileRosterCards
                        classRoster={classRoster}
                        tableFilter={tableFilter}
                        setTableFilter={setTableFilter}
                        isInstructor={isInstructor}
                        recentStudentId={recentStudentId}
                        currentStudentName={studentName}
                        onInspectStudent={(student) => {
                          setSelectedProgressStudent(student);
                          setShowProgressModal(true);
                        }}
                        onShareStudent={(student) => {
                          setShareModalTarget(student);
                          setShowShareModal(true);
                        }}
                        onUpdateStudentScore={handleLoadStudentForUpdate}
                        onManualSync={handleManualRosterSync}
                      />
                    </div>

                    <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-800/90 bg-slate-950/50 p-1 animate-table-fade-in shadow-inner">
                      <table className="w-full text-left border-collapse text-xs sm:text-sm">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 text-xs">
                            <th className="py-3 px-3 sm:px-4 font-semibold">Pos.</th>
                            <th className="py-3 px-3 sm:px-4 font-semibold">Nome de Guerra / Identificação do Militar</th>
                            <th className="py-3 px-3 sm:px-4 font-semibold">Conta Gmail</th>
                            <th className="py-3 px-3 sm:px-4 font-semibold">Unidade (OPM)</th>
                            <th className="py-3 px-3 sm:px-4 font-semibold">Meta / Competição Saudável</th>
                            <th className="py-3 px-3 sm:px-4 font-semibold text-center">Progressão (1ª ➔ Atual)</th>
                            <th
                              className="py-3 px-3 sm:px-4 font-semibold text-center text-amber-300"
                              title="Porcentagem de acertos totais sobre o número de missões realizadas"
                            >
                              Taxa de Precisão Média
                            </th>
                            <th className="py-3 px-3 sm:px-4 font-semibold text-right">Nota no Ranking</th>
                            <th className="py-3 px-3 sm:px-4 font-semibold text-center">Desempenho</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80">
                          {[...classRoster]
                            .sort((a, b) => b.score - a.score)
                            .filter(
                              (s) =>
                                tableFilter === 'ALL' ||
                                normalizeCohortCategory(s.cohort, false) === tableFilter
                            )
                            .map((student, idx) => {
                              const attemptsCount =
                                student.attemptsCount || student.history?.length || 1;
                              const firstScore =
                                student.history?.[0]?.score ?? student.score;
                              const scoreGain = student.score - firstScore;
                              const loginTime =
                                student.enrolledAt ||
                                student.history?.[0]?.completedAt ||
                                student.completedAt;
                              const isLive = student.status === 'Em Missão';
                              const accuracyStats = calculateStudentAverageAccuracy(student);

                              const sortedStep1List = [...classRoster]
                                .sort((a, b) => b.score - a.score)
                                .filter(
                                  (s) =>
                                    tableFilter === 'ALL' ||
                                    normalizeCohortCategory(s.cohort, false) === tableFilter
                                );
                              const prevAbove = idx > 0 ? sortedStep1List[idx - 1] : null;
                              const ptsToAdvance = prevAbove ? Math.max(1, prevAbove.score - student.score) : 0;
                              const isCurrentRegistered =
                                (studentWarName.trim() &&
                                  student.name.toLowerCase() === studentName.trim().toLowerCase()) ||
                                (studentId.trim() &&
                                  student.registration.toLowerCase() === studentId.trim().toLowerCase());

                              return (
                                <tr
                                  key={`step1-${student.id}`}
                                  className={
                                    isCurrentRegistered
                                      ? 'bg-amber-400/15 text-white border-l-4 border-amber-400 font-semibold'
                                      : isLive
                                      ? 'bg-emerald-950/30 text-white border-l-4 border-emerald-400'
                                      : 'hover:bg-slate-900/60 text-slate-200 transition-colors'
                                  }
                                >
                                  <td className="py-3 px-3 sm:px-4 font-mono-num font-bold">
                                    <span
                                      className={
                                        idx === 0
                                          ? 'text-amber-300 font-black'
                                          : idx === 1
                                          ? 'text-slate-200 font-black'
                                          : idx === 2
                                          ? 'text-amber-500 font-black'
                                          : 'text-slate-400'
                                      }
                                    >
                                      {idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`}
                                    </span>
                                  </td>
                                  <td className="py-3 px-3 sm:px-4 font-semibold text-white">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span>{student.name}</span>
                                      {isCurrentRegistered && (
                                        <span className="text-[10px] bg-amber-400 text-slate-950 px-2 py-0.5 rounded font-black uppercase">
                                          Seu Cadastro
                                        </span>
                                      )}
                                      {isLive && (
                                        <span className="text-[10px] bg-emerald-500 text-slate-950 px-2 py-0.5 rounded font-bold uppercase animate-pulse">
                                          Em Missão ({student.progressQuestions ?? 0}/{student.totalQuestionsCount ?? 10})
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-3 px-3 sm:px-4 font-mono-num text-slate-300">
                                    {student.registration}
                                  </td>
                                  <td className="py-3 px-3 sm:px-4">
                                    {(() => {
                                      const cat = normalizeCohortCategory(student.cohort, false);
                                      const badgeColors =
                                        cat === 'Visitantes'
                                          ? 'bg-purple-950 text-purple-300 border border-purple-700/60'
                                          : cat === 'Turma 02'
                                          ? 'bg-sky-950 text-sky-300 border border-sky-700/60'
                                          : 'bg-emerald-950 text-emerald-300 border border-emerald-700/60';
                                      return (
                                        <span
                                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${badgeColors}`}
                                        >
                                          {student.cohort || cat}
                                        </span>
                                      );
                                    })()}
                                  </td>
                                  <td className="py-3 px-3 sm:px-4 font-mono-num text-xs">
                                    {idx === 0 ? (
                                      <span className="px-2 py-0.5 rounded bg-amber-400/20 border border-amber-400/50 text-amber-300 font-bold text-[11px]">
                                        🏆 Líder do Ranking
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded bg-sky-950/70 border border-sky-700/50 text-sky-300 font-semibold text-[11px]">
                                        +{ptsToAdvance} pts p/ #{idx}
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3 px-3 sm:px-4 text-center">
                                    <div className="inline-flex items-center gap-1.5 font-mono-num text-xs bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
                                      <span className="text-slate-400">{firstScore}</span>
                                      <span className="text-slate-500">➔</span>
                                      <span className="font-bold text-white">{student.score} pts</span>
                                      {scoreGain > 0 && (
                                        <span className="text-emerald-400 font-bold">
                                          (+{scoreGain})
                                        </span>
                                      )}
                                      <span className="text-[10px] text-slate-400">
                                        [{attemptsCount}x]
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-3 sm:px-4 text-center">
                                    <div className="inline-flex flex-col items-center justify-center bg-slate-950 px-2.5 py-1 rounded-lg border border-amber-500/30">
                                      <span
                                        className={`font-mono-num text-xs font-extrabold ${
                                          accuracyStats.avgAccuracyPct >= 80
                                            ? 'text-emerald-400'
                                            : accuracyStats.avgAccuracyPct >= 50
                                            ? 'text-sky-400'
                                            : 'text-amber-400'
                                        }`}
                                      >
                                        {accuracyStats.avgAccuracyPct}%
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-mono-num">
                                        {accuracyStats.totalCorrect} acertos / {accuracyStats.missionsCompleted}{' '}
                                        {accuracyStats.missionsCompleted === 1 ? 'missão' : 'missões'}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-3 sm:px-4 text-right font-mono-num font-bold text-white">
                                    {student.score} pts
                                  </td>
                                  <td className="py-3 px-3 sm:px-4 text-center">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedProgressStudent(student);
                                        setShowProgressModal(true);
                                      }}
                                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 transition cursor-pointer inline-flex items-center gap-1 text-xs"
                                      title="Ver linha do tempo de tentativas e progressão"
                                    >
                                      <TrendingUp className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  {/* GRÁFICOS COLETIVOS E COMPARATIVO 1ª TURMA VS 2ª TURMA DIRETO NA TELA INICIAL */}
                  <DiagnosticCharts
                    studentName={studentName || classRoster[0]?.name || ''}
                    totalScore={results.totalScore || classRoster[0]?.score || 85}
                    pillarScores={
                      Object.keys(answers).length > 0
                        ? results.pillarPercentages
                        : classRoster[0]?.pillarScores || {
                            'Legislação PM & Regime Disciplinar': 100,
                            'Direito Penal & Processual Militar': 100,
                            'Direito Constitucional & Administrativo': 100,
                            'Administração & Conhecimentos Gerais': 100,
                          }
                    }
                    classRoster={classRoster}
                  />
                </div>
                </div>
              </div>
            )}

            {/* TELA 2: PAINEL INTERATIVO DE MISSÕES (QUIZ) */}
            {step === 2 && currentQuestion && (
              <section
                className={`max-w-3xl mx-auto bg-slate-900/95 border rounded-2xl p-5 sm:p-9 shadow-xl transition-transform duration-200 ${
                  hitAnimation === 'correct'
                    ? 'border-emerald-500 scale-[1.005]'
                    : hitAnimation === 'wrong'
                    ? 'border-rose-500'
                    : trainingMode
                    ? 'border-cyan-700/70'
                    : 'border-emerald-900/60'
                }`}
              >
                {/* Barras Duplas: Progresso da Operação + Modo Ativo */}
                <div className="mb-6 bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Barra 1: Progresso da Operação */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-400 font-medium">
                          {trainingMode
                            ? 'Progresso do Treinamento (Estudo Guiado)'
                            : 'Progresso do Desafio (Sem Retorno)'}
                        </span>
                        <span className="font-mono-num font-bold text-white">
                          Questão {currentQuestionIdx + 1} de {totalQuestions} ({operationProgressPct}%)
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className={`h-full transition-all duration-200 ${
                            trainingMode ? 'bg-cyan-400' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${operationProgressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Barra 2: Indicador do Modo (Treinamento vs Oficial) */}
                    <div
                      className={`flex flex-col justify-center rounded-lg px-3 py-1.5 border ${
                        trainingMode
                          ? 'bg-cyan-950/40 border-cyan-500/50'
                          : 'bg-slate-900/90 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 font-medium">
                          {trainingMode ? 'Modo Treinamento:' : 'Gabarito & Jornal Pop:'}
                        </span>
                        <span
                          className={`font-bold ${
                            trainingMode ? 'text-cyan-300' : 'text-amber-400'
                          }`}
                        >
                          {trainingMode
                            ? 'Feedback Imediato (Sem Ranking)'
                            : `Liberados após a ${totalQuestions}ª questão`}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        {trainingMode
                          ? 'Marque uma opção para ver a resposta certa e o Jornal Pop na hora.'
                          : 'Marque sua resposta com atenção e prossiga até concluir o envio.'}
                      </span>
                    </div>
                  </div>

                  {/* Metadados da Questão e Cronômetro Tático */}
                  <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="text-slate-300 font-medium">
                      <span className="text-amber-400 font-semibold">
                        {currentQuestion.pillar}
                      </span>
                      <span className="mx-1.5" aria-hidden="true">·</span>
                      <span>{currentQuestion.topic}</span>
                      <span className="mx-1.5" aria-hidden="true">·</span>
                      <span className="text-slate-400">{currentQuestion.complexity}</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono-num">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                        {questionTimesSec[currentQuestionIdx] !== undefined
                          ? `${questionTimesSec[currentQuestionIdx].toFixed(1)}s`
                          : `${liveElapsedSec}s`}
                      </span>
                      <span className="font-bold text-emerald-400">
                        Vale {currentQuestion.points} pts
                      </span>
                    </div>
                  </div>
                </div>

                {/* Enunciado da Missão */}
                <div className="mb-6">
                  <h2 className="font-display text-base sm:text-xl font-bold text-white leading-relaxed">
                    {currentQuestion.stem}
                  </h2>
                </div>

                {/* 4 Alternativas Táticas */}
                <div className="space-y-3 mb-6" role="radiogroup">
                  {currentQuestion.options.map((optionText, idx) => {
                    const isSelected = selectedCurrentAnswer === idx;
                    const isAnsweredInTraining =
                      trainingMode && selectedCurrentAnswer !== undefined;
                    const isCorrectOption = idx === currentQuestion.correctIndex;

                    let cardStyle = isSelected
                      ? 'border-amber-400 bg-amber-950/30 text-white ring-2 ring-amber-400/80 shadow-lg'
                      : 'border-slate-700 bg-slate-950/70 hover:border-slate-500 hover:bg-slate-950 text-slate-200';
                    let badgeStyle = isSelected
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-slate-800 text-slate-400';

                    if (isAnsweredInTraining) {
                      if (isCorrectOption) {
                        cardStyle =
                          'border-emerald-400 bg-emerald-950/50 text-white ring-2 ring-emerald-400/80 shadow-lg';
                        badgeStyle = 'bg-emerald-400 text-slate-950';
                      } else if (isSelected && !isCorrectOption) {
                        cardStyle =
                          'border-rose-500 bg-rose-950/50 text-rose-100 ring-2 ring-rose-500/80';
                        badgeStyle = 'bg-rose-500 text-white';
                      } else {
                        cardStyle =
                          'border-slate-800 bg-slate-950/40 text-slate-500 opacity-70';
                        badgeStyle = 'bg-slate-900 text-slate-500';
                      }
                    }

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectOption(idx)}
                        className={`w-full min-h-[54px] text-left p-4 rounded-xl border transition-all duration-150 flex items-start gap-3.5 cursor-pointer active:scale-[0.99] ${cardStyle}`}
                      >
                        <span
                          className={`w-7 h-7 rounded-lg font-mono-num text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 transition-colors ${badgeStyle}`}
                        >
                          {optionLetters[idx] || idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs sm:text-base leading-relaxed block">
                            {optionText}
                          </span>
                          {isAnsweredInTraining && isCorrectOption && (
                            <span className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-black text-emerald-300 uppercase">
                              ✓ Resposta Correta da Apostila DT-SEI
                            </span>
                          )}
                          {isAnsweredInTraining && isSelected && !isCorrectOption && (
                            <span className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-black text-rose-300 uppercase">
                              ✕ Sua Escolha (Incorreta)
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* FEEDBACK IMEDIATO EXCLUSIVO DO MODO TREINAMENTO */}
                {trainingMode && selectedCurrentAnswer !== undefined && (
                  <div
                    className={`mb-6 p-4 sm:p-5 rounded-2xl border-2 space-y-3 animate-table-fade-in ${
                      selectedCurrentAnswer === currentQuestion.correctIndex
                        ? 'bg-emerald-950/50 border-emerald-500/80'
                        : 'bg-rose-950/50 border-rose-500/80'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black uppercase ${
                          selectedCurrentAnswer === currentQuestion.correctIndex
                            ? 'bg-emerald-400 text-slate-950'
                            : 'bg-rose-500 text-white'
                        }`}
                      >
                        {selectedCurrentAnswer === currentQuestion.correctIndex
                          ? `✓ Você Acertou! (+${currentQuestion.points} pts no Treino)`
                          : `✕ Você Errou · A Correta é a Alternativa ${
                              optionLetters[currentQuestion.correctIndex]
                            }`}
                      </span>

                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-400/20 border border-amber-400/50 text-amber-300 font-mono-num text-xs font-bold">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>
                          Apostila DT-SEI · {currentQuestion.pageRef || 'Pág. Oficial'}
                        </span>
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                      <strong className="text-amber-300">Fundamentação da Apostila:</strong>{' '}
                      {currentQuestion.explanation}
                    </p>

                    <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] text-cyan-300 font-medium">
                        Modo Treinamento: esta pontuação não altera o Ranking Geral.
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setJornalPopTarget({
                            question: currentQuestion,
                            index: currentQuestionIdx,
                            selectedIdx: selectedCurrentAnswer,
                          })
                        }
                        className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs inline-flex items-center gap-1.5 shadow-md cursor-pointer transition"
                      >
                        <Newspaper className="w-4 h-4" />
                        <span>Visualizar Jornal Pop com a Resposta</span>
                      </button>
                    </div>
                  </div>
                )}

                {unansweredWarning && (
                  <div className="mb-6 px-4 py-3 rounded-xl bg-amber-950/80 border border-amber-600 text-xs text-amber-200 font-medium">
                    Selecione uma das 4 alternativas para confirmar sua resposta e prosseguir.
                  </div>
                )}

                {/* Navegação Sequencial Sem Retorno */}
                <div className="pt-5 border-t-2 border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                  {/* Indicador Sequencial de Etapas */}
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 overflow-x-auto py-1">
                    {questions.map((q, idx) => {
                      const isCurrent = idx === currentQuestionIdx;
                      const isCompletedStep = idx < currentQuestionIdx;
                      let dotClass = 'bg-slate-900 text-slate-500 border border-slate-800';
                      if (isCurrent) {
                        dotClass = 'bg-amber-400 text-slate-950 font-black ring-2 ring-amber-300';
                      } else if (isCompletedStep) {
                        if (trainingMode) {
                          const wasRight = answers[idx] === q.correctIndex;
                          dotClass = wasRight
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/70 font-bold'
                            : 'bg-rose-950 text-rose-300 border border-rose-500/70 font-bold';
                        } else {
                          dotClass = 'bg-emerald-950 text-emerald-300 border border-emerald-600/60 font-bold';
                        }
                      }
                      return (
                        <span
                          key={q.id}
                          title={
                            isCompletedStep
                              ? `Questão ${idx + 1} já respondida`
                              : `Questão ${idx + 1}`
                          }
                          className={`w-8 h-8 rounded-lg font-mono-num text-xs flex items-center justify-center shrink-0 select-none ${dotClass}`}
                        >
                          {isCompletedStep ? '✓' : idx + 1}
                        </span>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    className={`w-full sm:w-auto min-h-[56px] px-7 py-3.5 text-sm sm:text-base font-black text-slate-950 active:scale-[0.98] rounded-xl transition flex items-center justify-center gap-2.5 cursor-pointer whitespace-nowrap shadow-xl border-2 ${
                      trainingMode
                        ? 'bg-gradient-to-r from-cyan-300 via-cyan-400 to-teal-300 hover:from-cyan-200 hover:to-teal-200 border-cyan-100 shadow-cyan-500/30'
                        : 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400 hover:from-emerald-300 hover:to-teal-300 border-emerald-200 shadow-emerald-500/30'
                    }`}
                  >
                    <span>
                      {currentQuestionIdx === totalQuestions - 1
                        ? trainingMode
                          ? 'CONCLUIR TREINAMENTO (VER RESUMO)'
                          : 'CONCLUIR E ENVIAR DESAFIO (VER FEEDBACK)'
                        : trainingMode
                        ? 'PRÓXIMA QUESTÃO DO TREINO'
                        : 'CONFIRMAR RESPOSTA E PROSSEGUIR'}
                    </span>
                    <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                  </button>
                </div>
              </section>
            )}

            {/* TELA 3: PAINEL DE RESULTADOS, ACHIEVEMENT BADGES & GRÁFICOS DA TURMA */}
            {step === 3 && (
              <div className="space-y-6 sm:space-y-8">
                {/* Card Principal: Patente Individual, Score e Insígnias de Conquista */}
                <section className="bg-slate-900/90 border border-emerald-800/70 rounded-2xl p-5 sm:p-8 shadow-xl">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
                    <div>
                      <div className="text-xs text-amber-400 font-semibold mb-1">
                        <span>Patente Diagnóstica: {results.diagnosticTier.patentTitle}</span>
                        <span className="mx-2" aria-hidden="true">·</span>
                        <span className="font-mono-num">
                          {new Date().toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
                        {studentName || 'Militar Avaliado'}
                      </h2>
                      <div className="text-xs text-slate-400 mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                        {studentId && <span>{studentId}</span>}
                        {studentCohort && <span>· {studentCohort}</span>}
                        <span>
                          · Acertos:{' '}
                          <strong className="font-mono-num text-white">
                            {results.correctCount}/{totalQuestions}
                          </strong>
                        </span>
                        <span>
                          · Melhor Combo:{' '}
                          <strong className="font-mono-num text-amber-400">
                            {results.maxStreak}x
                          </strong>
                        </span>
                        <span>
                          · Velocidade Média:{' '}
                          <strong className="font-mono-num text-cyan-400">
                            {results.avgTimePerQuestionSec.toFixed(1)}s/missão
                          </strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-5">
                      <div>
                        <span className="block text-xs text-slate-400">
                          Score da Operação
                        </span>
                        <div className="font-mono-num text-3xl sm:text-4xl font-bold text-white">
                          {results.totalScore}
                          <span className="text-lg font-normal text-slate-400"> / 100</span>
                        </div>
                      </div>

                      <div
                        className={`px-4 py-3 rounded-xl border text-xs sm:text-sm font-bold ${results.diagnosticTier.colorClasses}`}
                      >
                        <span className="mr-1.5" aria-hidden="true">
                          {results.diagnosticTier.glyph}
                        </span>
                        {results.diagnosticTier.badgeLabel}
                      </div>
                    </div>
                  </div>

                  {/* SISTEMA DE INSÍGNIAS DE CONQUISTA (ACHIEVEMENT BADGES) */}
                  <div className="py-6 border-b border-slate-800">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                      <div>
                        <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                          <Trophy className="w-4 h-4" />
                          <span>Achievement Badges · Insígnias de Desempenho Tático</span>
                        </span>
                        <h3 className="font-display text-base sm:text-lg font-bold text-white mt-0.5">
                          Conquistas Desbloqueadas na Missão
                        </h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono-num text-xs font-semibold text-emerald-400">
                          {unlockedBadgesCount} de {results.achievementBadges.length} Conquistadas
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setShowConfetti(false);
                            setTimeout(() => setShowConfetti(true), 20);
                            soundFX.playVictory();
                          }}
                          className="px-3 py-1.5 rounded-lg bg-amber-400/15 border border-amber-400/40 hover:bg-amber-400/25 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer no-print"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Celebrar Conquista
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {results.achievementBadges.map((badge) => {
                        const unlockedStyles: Record<
                          AchievementBadge['accentColor'],
                          string
                        > = {
                          cyan: 'bg-cyan-950/40 border-cyan-500/70 text-cyan-100',
                          gold: 'bg-amber-950/40 border-amber-400/80 text-amber-100',
                          emerald:
                            'bg-emerald-950/40 border-emerald-500/80 text-emerald-100',
                          indigo:
                            'bg-indigo-950/40 border-indigo-500/80 text-indigo-100',
                          rose: 'bg-rose-950/40 border-rose-500/80 text-rose-100',
                        };

                        const iconStyles: Record<
                          AchievementBadge['accentColor'],
                          string
                        > = {
                          cyan: 'bg-cyan-400 text-slate-950',
                          gold: 'bg-amber-400 text-slate-950',
                          emerald: 'bg-emerald-400 text-slate-950',
                          indigo: 'bg-indigo-400 text-slate-950',
                          rose: 'bg-rose-400 text-slate-950',
                        };

                        return (
                          <div
                            key={badge.id}
                            className={`p-4 rounded-xl border transition flex items-start gap-3.5 ${
                              badge.unlocked
                                ? unlockedStyles[badge.accentColor]
                                : 'bg-slate-950/50 border-slate-800/80 text-slate-500 opacity-60'
                            }`}
                          >
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                badge.unlocked
                                  ? iconStyles[badge.accentColor]
                                  : 'bg-slate-800 text-slate-500'
                              }`}
                            >
                              {renderBadgeIcon(badge.iconName)}
                            </div>

                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="font-display text-xs sm:text-sm font-bold text-white truncate">
                                  {badge.title}
                                </h4>
                                <span className="text-[10px] font-mono-num text-slate-400 shrink-0">
                                  {badge.englishTag}
                                </span>
                              </div>
                              <p className="text-[11px] leading-snug opacity-90">
                                {badge.description}
                              </p>
                              <div className="pt-1 flex items-center justify-between text-[10px] font-mono-num">
                                <span
                                  className={
                                    badge.unlocked
                                      ? 'text-amber-300 font-bold'
                                      : 'text-slate-500'
                                  }
                                >
                                  {badge.unlocked ? '★ DESBLOQUEADA' : '🔒 Bloqueada'}
                                </span>
                                <span>{badge.progressText}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Diagnóstico e Barras dos 4 Pilares */}
                  <div className="pt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
                    <div className="lg:col-span-7 space-y-4">
                      <div>
                        <h3 className="font-display text-base font-bold text-white mb-1.5">
                          {results.diagnosticTier.headline}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                          {results.diagnosticTier.feedback}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-xs font-semibold text-amber-400 mb-2">
                          Plano de Ação Recomendado (CAS PMPE 2026):
                        </h4>
                        <ul className="space-y-1.5 text-xs sm:text-sm text-slate-300">
                          {results.diagnosticTier.recommendations.map((rec, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="font-mono-num font-bold text-emerald-400">
                                0{i + 1}.
                              </span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="lg:col-span-5 bg-slate-950/90 border border-slate-800 rounded-xl p-5 space-y-3.5">
                      <div className="text-xs font-bold text-white">
                        Domínio nos 4 Pilares da Apostila DTSEI
                      </div>
                      <div className="space-y-3 text-xs">
                        {COMPETENCY_PILLARS.map((pillar) => {
                          const pct = results.pillarPercentages[pillar] ?? 0;
                          return (
                            <div key={pillar}>
                              <div className="flex justify-between text-slate-300 mb-1">
                                <span>{pillar}</span>
                                <span className="font-mono-num font-bold text-white">
                                  {pct}%
                                </span>
                              </div>
                              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${
                                    pct >= 80
                                      ? 'bg-emerald-500'
                                      : pct >= 50
                                      ? 'bg-sky-400'
                                      : 'bg-amber-400'
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Progresso do Aluno nas Etapas & Histórico de Tentativas */}
                  <div className="mt-6 p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          Progresso do Aluno nas Etapas & Tentativas
                        </span>
                        <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono-num">
                          {currentStudentAttempts.length || 1} {(currentStudentAttempts.length || 1) === 1 ? 'tentativa' : 'tentativas'}
                        </span>
                      </div>

                      {currentStudentAttempts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProgressStudent({
                              id: 'current-player',
                              name: studentName,
                              registration: studentId,
                              cohort: studentCohort,
                              score: results.totalScore,
                              tier: results.diagnosticTier.tierShort,
                              completedAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                              pillarScores: results.pillarPercentages,
                              attemptsCount: currentStudentAttempts.length,
                              history: currentStudentAttempts,
                            });
                            setShowProgressModal(true);
                          }}
                          className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition cursor-pointer"
                        >
                          <History className="w-3.5 h-3.5" />
                          <span>Ver Linha do Tempo Completa</span>
                        </button>
                      )}
                    </div>

                    {/* Resumo da Linha de Evolução */}
                    {currentStudentAttempts.length > 1 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                          <span className="text-slate-400">1ª Tentativa (Base):</span>
                          <span className="font-mono-num font-bold text-slate-200">
                            {currentStudentAttempts[0]?.score ?? results.totalScore} pts
                          </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                          <span className="text-slate-400">Última Tentativa (Atual):</span>
                          <span className="font-mono-num font-bold text-emerald-400">
                            {results.totalScore} pts
                          </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                          <span className="text-slate-400">Evolução Conquistada:</span>
                          <span
                            className={`font-mono-num font-bold ${
                              results.totalScore - (currentStudentAttempts[0]?.score ?? results.totalScore) >= 0
                                ? 'text-emerald-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {results.totalScore - (currentStudentAttempts[0]?.score ?? results.totalScore) >= 0 ? '+' : ''}
                            {results.totalScore - (currentStudentAttempts[0]?.score ?? results.totalScore)} pts
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">
                        Esta é a sua 1ª tentativa registrada. Você pode refazer a missão quantas vezes desejar para acompanhar sua evolução rumo à patente de Especialista SEI — cada nova etapa ficará guardada no seu histórico!
                      </p>
                    )}
                  </div>

                  {/* Aviso de Registro Garantido no Resultado Geral (Modo Oficial e Modo Treinamento) */}
                  {trainingMode ? (
                    <div className="mt-4 p-4 rounded-xl border border-cyan-500/60 bg-cyan-950/40 text-cyan-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs leading-relaxed">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 shrink-0 text-cyan-400 mt-0.5" />
                        <div>
                          <strong className="block text-white font-semibold">
                            Modo Treinamento Concluído — Aluno Elencado no Resultado Geral da Turma!
                          </strong>
                          <span>
                            Você obteve <strong>{results.totalScore} pts</strong> no treino com feedback imediato e seu nome já está sincronizado no <strong>Quadro Geral de Classificação da Turma</strong> para avaliação do Instrutor.
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setTrainingMode(false);
                          setAnswers({});
                          setQuestionTimesSec({});
                          setCurrentQuestionIdx(0);
                          setUnansweredWarning(false);
                          setShowConfetti(false);
                          questionStartRef.current = Date.now();
                          soundFX.playSelect();
                          setStep(2);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs whitespace-nowrap cursor-pointer shadow-md transition shrink-0"
                      >
                        Fazer Agora no Modo Oficial
                      </button>
                    </div>
                  ) : (
                    <div className={`mt-4 p-4 rounded-xl border flex items-start sm:items-center gap-3 text-xs leading-relaxed ${
                      attemptNotice === 'updated'
                        ? 'bg-amber-950/40 border-amber-600/60 text-amber-200'
                        : 'bg-emerald-950/40 border-emerald-600/60 text-emerald-200'
                    }`}>
                      <CheckCircle2 className="w-5 h-5 shrink-0 text-amber-400 mt-0.5 sm:mt-0" />
                      <div className="flex-1">
                        <strong className="block text-white font-semibold">
                          {attemptNotice === 'updated'
                            ? 'Pontuação Atualizada no Quadro Geral da Turma (Sincronizado na Nuvem)!'
                            : 'Tentativa Registrada com Sucesso no Resultado Geral!'}
                        </strong>
                        <span>
                          {attemptNotice === 'updated'
                            ? `Sua nova nota (${results.totalScore} pts) substituiu a tentativa anterior no ranking. Você pode realizar o teste quantas vezes desejar — prevalecerá sempre a última nota.`
                            : `Sua nota (${results.totalScore} pts) está gravada no Quadro Geral da Turma para avaliação do Instrutor. Você pode refazer a missão a qualquer momento.`}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Botões de Ação com Botão de Compartilhamento em Destaque */}
                  <div className="pt-6 mt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 no-print">
                    <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={handleRetrySamePlayer}
                        className="flex-1 sm:flex-initial min-h-[46px] px-4 py-2.5 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Refaça o teste para tentar uma nota superior (a última prevalecerá)"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        {trainingMode ? 'Repetir Treinamento' : 'Refazer Missão (Atualizar Nota)'}
                      </button>

                      <button
                        type="button"
                        onClick={handleResetQuizForNewPlayer}
                        className="flex-1 sm:flex-initial min-h-[46px] px-4 py-2.5 text-xs font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-700 hover:bg-emerald-900 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Novo Militar / Trocar Modo
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                      {/* BOTÃO PRINCIPAL DE COMPARTILHAMENTO DA PATENTE E ESCALA CAS PMPE 2026 */}
                      <button
                        type="button"
                        onClick={() => {
                          setShareModalTarget({
                            id: 'current-player',
                            name: studentName,
                            registration: studentId,
                            cohort: studentCohort,
                            score: results.totalScore,
                            tier: results.diagnosticTier.tierShort,
                            completedAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                            pillarScores: results.pillarPercentages,
                            attemptsCount: currentStudentAttempts.length || 1,
                            history: currentStudentAttempts,
                          });
                          setShowShareModal(true);
                        }}
                        className="flex-1 sm:flex-initial min-h-[46px] px-5 py-2.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-200 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-950/60 ring-1 ring-amber-500/50"
                        title="Compartilhar sua Patente e Escala de Classificação CAS PMPE 2026"
                      >
                        <Share2 className="w-4 h-4 text-slate-950" />
                        <span>Compartilhar Minha Classificação SEI</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('class-board');
                          soundFX.playSelect();
                        }}
                        className="flex-1 sm:flex-initial min-h-[46px] px-4 py-2.5 text-xs font-bold text-emerald-300 bg-emerald-950/70 border border-emerald-500/60 hover:bg-emerald-900/80 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                        title="Ver sua posição e desempenho no RANKING Oficial"
                      >
                        <Trophy className="w-4 h-4 text-amber-400" />
                        <span>Ver Meu Desempenho no RANKING</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleCopyResultSummary}
                        className="flex-1 sm:flex-initial min-h-[46px] px-4 py-2.5 text-xs font-bold text-slate-200 bg-slate-950 border border-slate-700 hover:bg-slate-800 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {copiedSummary ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            Score Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            Copiar Meu Score
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="flex-1 sm:flex-initial min-h-[46px] px-4 py-2.5 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Exportar Relatório PDF
                      </button>

                      {isAdminUser && (
                        <button
                          type="button"
                          onClick={handleAdminResetClick}
                          className="min-h-[46px] px-3.5 py-2 text-xs font-semibold text-rose-300 bg-rose-950/40 border border-rose-800/60 hover:bg-rose-900/60 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                          title="Zerar dados da turma e simulações para primeiro uso oficial (Acesso restrito ao Admin)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Zerar Turma (Admin)
                        </button>
                      )}
                    </div>

                    {/* Direitos Reservados */}
                    <div className="w-full text-center pt-3 pb-1 border-t border-slate-800/80 text-[11px] text-slate-400">
                      <span className="font-mono-num text-amber-400/90 font-medium">
                        *IMPORTHOUR© - todos os direitos reservados
                      </span>
                    </div>
                  </div>
                </section>

                {/* Banner de Confirmação (Modo Oficial) ou Aviso de Treinamento (Sem Ranking) */}
                {trainingMode ? (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/80 via-slate-900 to-slate-900 border border-cyan-500/50 flex flex-wrap items-center justify-between gap-3 text-xs animate-table-fade-in shadow-lg">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-3 w-3 rounded-full bg-cyan-400"></span>
                      <span className="text-white text-xs sm:text-sm">
                        <strong className="text-cyan-300">Modo Treinamento:</strong> A pontuação de <strong className="text-amber-300">{studentName}</strong> ({results.totalScore} pts) serviu para estudo com feedback imediato e <strong>não foi lançada no Ranking Geral</strong>.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setTrainingMode(false);
                        setAnswers({});
                        setQuestionTimesSec({});
                        setCurrentQuestionIdx(0);
                        setStep(1);
                        soundFX.playSelect();
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow"
                    >
                      <span>Ir para Modo Oficial (Valendo Ranking)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-amber-950/70 border border-emerald-500/50 flex flex-wrap items-center justify-between gap-3 text-xs animate-table-fade-in shadow-lg">
                    <div className="flex items-center gap-3">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                      </span>
                      <span className="text-white text-xs sm:text-sm">
                        Resultado de <strong className="text-amber-400">{studentName}</strong> registrado com sucesso no <strong>Quadro Geral de Classificação da Turma</strong>!
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('class-board');
                        soundFX.playSelect();
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow"
                    >
                      <span>Conferir no RANKING</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* COMPONENTE DE NOTIFICAÇÃO E REVISÃO TÁTICA EM 24H (BASEADO NO PILAR DE MENOR NOTA) */}
                <ReviewReminderNotification
                  pillarScores={results.pillarPercentages}
                  studentName={studentName}
                  studentCohort={studentCohort}
                  onOpenApostilaChapter={handleOpenReviewChapter}
                  onRetryQuizWithPillar={handleRetryQuizWithPillar}
                  isResultsScreen={true}
                />

                {/* Gráficos Chart.js: Radar Individual + Distribuição e Ranking da Turma */}
                <DiagnosticCharts
                  studentName={studentName}
                  totalScore={results.totalScore}
                  pillarScores={results.pillarPercentages}
                  classRoster={classRoster}
                />

                {/* Gabarito Técnico Comentado Item a Item (Exibido Após Concluir o Desafio + Página da Apostila + Jornal Pop) */}
                <section className="bg-slate-900/90 border-2 border-emerald-500/40 rounded-2xl p-5 sm:p-8 shadow-2xl">
                  <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                    <div>
                      <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-400 mb-1">
                        <Newspaper className="w-4 h-4" />
                        <span>Feedback Oficial Pós-Desafio · Clique em qualquer questão para abrir o Jornal Pop</span>
                      </div>
                      <h3 className="font-display text-lg sm:text-xl font-bold text-white">
                        Gabarito Comentado e Páginas da Apostila DT-SEI — Revisão das {totalQuestions} Questões
                      </h3>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Confira o que você acertou ou errou, a resposta certa com a página oficial da Apostila DT-SEI e toque no botão <strong>"Visualizar Jornal Pop com a Resposta"</strong>.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleRetrySamePlayer}
                      className="min-h-[46px] px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg cursor-pointer shrink-0"
                    >
                      <RotateCcw className="w-4 h-4 stroke-[2.5]" />
                      <span>Refazer Desafio Agora</span>
                    </button>
                  </div>

                  <div className="divide-y divide-slate-800">
                    {questions.map((q, idx) => {
                      const selectedIdx = answers[idx];
                      const isCorrect = selectedIdx === q.correctIndex;
                      const qTime = questionTimesSec[idx];
                      const pageRefText = q.pageRef || 'Apostila Oficial DT-SEI (CAS PMPE 2026)';
                      return (
                        <div
                          key={q.id}
                          onClick={() =>
                            setJornalPopTarget({
                              question: q,
                              index: idx,
                              selectedIdx,
                            })
                          }
                          className="py-5 first:pt-0 last:pb-0 space-y-3 hover:bg-slate-950/40 p-3 rounded-xl transition cursor-pointer"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="flex flex-wrap items-center gap-2 text-slate-300 font-medium">
                              <span className="font-mono-num font-black text-white bg-slate-800 px-2.5 py-0.5 rounded-md">
                                Questão 0{idx + 1}
                              </span>
                              <span className="px-2.5 py-0.5 rounded-md bg-amber-400/20 border border-amber-400/50 text-amber-300 font-black flex items-center gap-1">
                                <BookOpen className="w-3.5 h-3.5" />
                                {pageRefText}
                              </span>
                              <span className="text-slate-400">{q.topic}</span>
                            </div>

                            <div className="flex items-center gap-3 font-mono-num">
                              {qTime !== undefined && (
                                <span className="text-slate-400 text-[11px]">
                                  {qTime.toFixed(1)}s
                                </span>
                              )}
                              <span
                                className={`font-black flex items-center gap-1 px-2.5 py-0.5 rounded-md ${
                                  isCorrect
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                }`}
                              >
                                {isCorrect ? (
                                  <>
                                    <CheckCircle2 className="w-4 h-4" /> ACERTOU (+{q.points} pts)
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-4 h-4" /> ERROU (0/{q.points} pts)
                                  </>
                                )}
                              </span>
                            </div>
                          </div>

                          <p className="text-sm sm:text-base font-bold text-white leading-snug">
                            {q.stem}
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div
                              className={`p-3.5 rounded-xl border ${
                                isCorrect
                                  ? 'bg-emerald-950/50 border-emerald-600 text-emerald-100'
                                  : 'bg-rose-950/50 border-rose-600 text-rose-100'
                              }`}
                            >
                              <span className="block font-black uppercase tracking-wider text-white mb-1">
                                {isCorrect ? '✓ Sua Resposta (Correta):' : '✗ Sua Resposta (Incorreta):'}
                              </span>
                              {selectedIdx !== undefined
                                ? `(${optionLetters[selectedIdx]}) ${q.options[selectedIdx]}`
                                : 'Não respondida'}
                            </div>

                            <div className="p-3.5 rounded-xl border-2 bg-emerald-950/60 border-emerald-400 text-emerald-100">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="font-black uppercase tracking-wider text-emerald-300">
                                  ★ Resposta Certa (Gabarito da Apostila):
                                </span>
                                <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-black text-[10px]">
                                  {pageRefText}
                                </span>
                              </div>
                              ({optionLetters[q.correctIndex]}) {q.options[q.correctIndex]}
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-300 bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 leading-relaxed">
                            <div className="flex-1">
                              <strong className="text-amber-400">
                                Fundamentação ({pageRefText}):{' '}
                              </strong>
                              {q.explanation}
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setJornalPopTarget({
                                  question: q,
                                  index: idx,
                                  selectedIdx,
                                });
                              }}
                              className="min-h-[42px] px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer shrink-0"
                            >
                              <Newspaper className="w-4 h-4 stroke-[2.5]" />
                              <span>Abrir Jornal Pop da Resposta</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
            )}
          </div>
        )}

        {/* ABA 2: GRÁFICOS GERAIS E LEADERBOARD DA TURMA */}
        {activeTab === 'class-board' && (
          <div className="space-y-6 sm:space-y-8">
            <DiagnosticCharts
              studentName={studentName || classRoster[0]?.name || ''}
              totalScore={results.totalScore || classRoster[0]?.score || 80}
              pillarScores={
                Object.keys(answers).length > 0
                  ? results.pillarPercentages
                  : classRoster[0]?.pillarScores || {
                      'Segurança & Acesso': 100,
                      'Normas & Tipos Processuais': 100,
                      'Documentos & Blocos': 100,
                      'Tramitação & Integridade': 67,
                    }
              }
              classRoster={classRoster}
            />

            <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-1">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>RANKING OFICIAL · Classificação pelo Cadastro dos Alunos [Nome de Guerra / Identificação do Militar]</span>
                  </div>
                  <h2 className="font-display text-lg sm:text-xl font-bold text-white">
                    RANKING — Classificação Geral e Acompanhamento de Desempenho ({classRoster.length} Militares Cadastrados)
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Toda a classificação obedece ao <strong>cadastro obrigatório dos alunos (Graduação + Nome de Guerra, Conta Gmail e OPM)</strong>, permitindo acompanhar a evolução individual, taxa de precisão e metas de pontuação para uma <strong>competição saudável</strong>.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 self-start">
                  {isAdminUser && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowManualStudentModal(true);
                        soundFX.playSelect();
                      }}
                      className="min-h-[44px] px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-xl transition flex items-center gap-2 cursor-pointer shadow-md"
                      title="Incluir ou regularizar manualmente um aluno que realizou o teste para que conste no Resultado Geral (Exclusivo Admin)"
                    >
                      <UserPlus className="w-4 h-4" />
                      Regularizar / Incluir Aluno
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      handleResetQuizForNewPlayer();
                      setActiveTab('assessment');
                    }}
                    className="min-h-[44px] px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    Avaliar Novo Militar
                  </button>

                  {isAdminUser && (
                    <>
                      <button
                        type="button"
                        onClick={handleSimulateNewStudent}
                        className="min-h-[44px] px-3.5 py-2 text-xs font-semibold text-amber-300 bg-amber-950/40 border border-amber-600/50 hover:bg-amber-900/50 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                        title="Adicionar rapidamente um resultado para ver o efeito visual de fade-in e destaque tático"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        Simular Novo Aluno (Testar Fade-In)
                      </button>

                      <button
                        type="button"
                        onClick={handleAdminResetClick}
                        className="min-h-[44px] px-3.5 py-2 text-xs font-semibold text-rose-300 bg-rose-950/40 border border-rose-800/70 hover:bg-rose-900/60 rounded-xl transition flex items-center gap-2 cursor-pointer"
                        title="Zerar resultados e limpar todas as notas da turma (Acesso restrito ao Admin)"
                      >
                        <Trash2 className="w-4 h-4 text-rose-400" />
                        Zerar Turma (Admin)
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Banner de Destaque de Atividade Recente no Quadro Geral */}
              {recentActionTime && recentStudentName && (
                <div className="mb-5 p-4 rounded-xl bg-gradient-to-r from-amber-950/70 via-slate-900 to-emerald-950/70 border border-amber-500/60 flex flex-wrap items-center justify-between gap-3 text-xs animate-table-fade-in shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-amber-400 shrink-0">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                        </span>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                          Atividade Recente Registrada
                        </span>
                      </div>
                      <p className="text-white font-medium text-xs sm:text-sm mt-0.5">
                        <strong className="text-amber-300">{recentStudentName}</strong>
                        {recentActionType === 'updated'
                          ? ' acabou de atualizar sua pontuação no desafio e sua posição foi recalculada!'
                          : ' concluiu a missão diagnóstica e foi posicionado no Quadro de Classificação!'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="text-[11px] text-amber-300 font-mono-num bg-slate-950/80 px-2.5 py-1 rounded-md border border-amber-500/30 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      Destaque Ativo
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setRecentStudentId(null);
                        setRecentActionTime(null);
                      }}
                      className="text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
                      title="Dispensar destaque"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-800">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">Filtrar por Pelotão / Turma:</span>
                  <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                    <button
                      type="button"
                      onClick={() => setTableFilter('ALL')}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                        tableFilter === 'ALL'
                          ? 'bg-amber-400 text-slate-950'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Todas
                    </button>
                    <button
                      type="button"
                      onClick={() => setTableFilter('Turma 01')}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                        tableFilter === 'Turma 01'
                          ? 'bg-emerald-500 text-slate-950'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Turma 01
                    </button>
                    <button
                      type="button"
                      onClick={() => setTableFilter('Turma 02')}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                        tableFilter === 'Turma 02'
                          ? 'bg-sky-400 text-slate-950'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Turma 02
                    </button>
                    <button
                      type="button"
                      onClick={() => setTableFilter('Visitantes')}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                        tableFilter === 'Visitantes'
                          ? 'bg-purple-400 text-slate-950'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Visitantes
                    </button>
                  </div>
                </div>

                <div className="text-[11px] text-amber-400 font-mono-num flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Classificação vinculada ao Cadastro Obrigatório [Nome de Guerra / Identificação do Militar]
                </div>
              </div>

              {/* Painel de Competição Saudável & Acompanhamento do Aluno Cadastrado */}
              {(() => {
                const sortedAll = [...classRoster].sort((a, b) => b.score - a.score);
                const top3 = sortedAll.slice(0, 3);
                const myIdx = sortedAll.findIndex(
                  (s) =>
                    (studentWarName.trim() &&
                      s.name.toLowerCase() === studentName.trim().toLowerCase()) ||
                    (studentId.trim() &&
                      s.registration.toLowerCase() === studentId.trim().toLowerCase())
                );
                const myRecord = myIdx >= 0 ? sortedAll[myIdx] : null;
                const nextTarget = myIdx > 0 ? sortedAll[myIdx - 1] : null;
                const myAccuracy = myRecord ? calculateStudentAverageAccuracy(myRecord) : null;

                return (
                  <div className="mb-5 grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Pódio Top 3 para Competição Saudável */}
                    <div className="lg:col-span-7 p-4 rounded-2xl bg-slate-950/90 border border-amber-500/40 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                          <Crown className="w-4 h-4 text-amber-400" />
                          <span>Pódio de Competição Saudável (Top 3 Alunos Cadastrados)</span>
                        </span>
                        <span className="text-[11px] font-mono-num text-slate-400">
                          Média Geral:{' '}
                          <strong className="text-emerald-400">
                            {sortedAll.length > 0
                              ? Math.round(
                                  sortedAll.reduce((acc, s) => acc + s.score, 0) / sortedAll.length
                                )
                              : 0}{' '}
                            pts
                          </strong>
                        </span>
                      </div>

                      {top3.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          {top3.map((leader, idx) => {
                            const acc = calculateStudentAverageAccuracy(leader);
                            const medal = idx === 0 ? '🥇 1º Lugar' : idx === 1 ? '🥈 2º Lugar' : '🥉 3º Lugar';
                            return (
                              <div
                                key={`podium-${leader.id}`}
                                onClick={() => {
                                  setSelectedProgressStudent(leader);
                                  setShowProgressModal(true);
                                }}
                                className={`p-3 rounded-xl border cursor-pointer transition ${
                                  idx === 0
                                    ? 'bg-gradient-to-b from-amber-500/20 to-slate-900 border-amber-400/70'
                                    : idx === 1
                                    ? 'bg-slate-900/90 border-slate-600/80'
                                    : 'bg-amber-950/30 border-amber-700/60'
                                }`}
                              >
                                <div className="flex items-center justify-between text-[11px] font-black mb-1">
                                  <span className="text-amber-300">{medal}</span>
                                  <span className="font-mono-num text-emerald-400">
                                    {leader.score} pts
                                  </span>
                                </div>
                                <div className="text-xs font-extrabold text-white truncate">
                                  {leader.name}
                                </div>
                                <div className="text-[10px] text-slate-400 truncate mt-0.5">
                                  {leader.cohort} · Precisão: <strong className="text-amber-300">{acc.avgAccuracyPct}%</strong>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400">
                          Nenhum aluno avaliado ainda. Complete seu cadastro obrigatório e inicie a primeira missão para liderar o RANKING!
                        </p>
                      )}
                    </div>

                    {/* Card do Cadastro do Aluno Atual & Meta de Evolução */}
                    <div className="lg:col-span-5 p-4 rounded-2xl bg-slate-950/90 border border-emerald-500/40 flex flex-col justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                            <Target className="w-4 h-4 text-emerald-400" />
                            <span>Seu Cadastro & Desempenho no RANKING</span>
                          </span>
                          {myRecord && (
                            <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-mono-num font-black text-[11px]">
                              Posição #{myIdx + 1} de {sortedAll.length}
                            </span>
                          )}
                        </div>

                        {myRecord ? (
                          <div className="pt-1 space-y-2 text-xs">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <strong className="text-white text-sm font-bold">
                                {myRecord.name}
                              </strong>
                              <span className="text-[11px] font-mono-num text-slate-300">
                                {myRecord.registration} · {myRecord.cohort}
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 pt-1">
                              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-center">
                                <span className="text-[10px] text-slate-400 block">Nota Atual</span>
                                <strong className="font-mono-num text-emerald-400 text-xs sm:text-sm">
                                  {myRecord.score} pts
                                </strong>
                              </div>
                              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-center">
                                <span className="text-[10px] text-slate-400 block">Precisão Média</span>
                                <strong className="font-mono-num text-amber-300 text-xs sm:text-sm">
                                  {myAccuracy?.avgAccuracyPct ?? 0}%
                                </strong>
                              </div>
                              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-center">
                                <span className="text-[10px] text-slate-400 block">Missões</span>
                                <strong className="font-mono-num text-sky-300 text-xs sm:text-sm">
                                  {myAccuracy?.missionsCompleted ?? 1}x
                                </strong>
                              </div>
                            </div>
                            <div className="text-[11px] text-slate-300 pt-0.5">
                              {myIdx === 0 ? (
                                <span className="text-amber-300 font-bold">
                                  🏆 Parabéns! Seu cadastro está em #1 no RANKING Geral. Continue praticando para manter a liderança!
                                </span>
                              ) : nextTarget ? (
                                <span>
                                  🎯 <strong className="text-sky-300">Meta de Competição Saudável:</strong> faltam{' '}
                                  <strong className="text-amber-300 font-mono-num">
                                    +{Math.max(1, nextTarget.score - myRecord.score)} pts
                                  </strong>{' '}
                                  para alcançar <strong>{nextTarget.name}</strong> (#{myIdx}).
                                </span>
                              ) : null}
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-300 leading-relaxed pt-1">
                            {studentWarName.trim() ? (
                              <>
                                Perfil preenchido como <strong className="text-amber-300">{studentName}</strong>. Clique abaixo para sincronizar seu cadastro diretamente no RANKING ou iniciar uma missão oficial!
                              </>
                            ) : (
                              'Você ainda não vinculou seu Perfil Obrigatório [Nome de Guerra / Identificação do Militar]. Cadastre-se na Tela 1 para aparecer no RANKING e acompanhar seu desempenho!'
                            )}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {studentWarName.trim() && !myRecord && (
                          <button
                            type="button"
                            onClick={handleSyncProfileToRanking}
                            className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer transition"
                          >
                            Incluir Meu Cadastro no RANKING Agora
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('assessment');
                            setStep(1);
                            soundFX.playSelect();
                          }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-300 font-bold text-xs cursor-pointer transition"
                        >
                          {myRecord ? 'Nova Missão p/ Subir no RANKING →' : 'Ir para Cadastro de Perfil (Tela 1) →'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Cards Mobile-First para Inspeção Coletiva e Individual em Celulares */}
              <div className="mb-5">
                <MobileRosterCards
                  classRoster={classRoster}
                  tableFilter={tableFilter}
                  setTableFilter={setTableFilter}
                  isInstructor={isInstructor}
                  recentStudentId={recentStudentId}
                  currentStudentName={studentName}
                  onInspectStudent={(student) => {
                    setSelectedProgressStudent(student);
                    setShowProgressModal(true);
                  }}
                  onShareStudent={(student) => {
                    setShareModalTarget(student);
                    setShowShareModal(true);
                  }}
                  onUpdateStudentScore={handleLoadStudentForUpdate}
                  onManualSync={handleManualRosterSync}
                />
              </div>

              {/* Tabela com Animação Suave de Fade-In e Destaque de Atividade Recente */}
              <div
                key={`class-roster-container-${tableAnimationKey}-${tableFilter}`}
                className="hidden md:block overflow-x-auto rounded-xl border border-slate-800/90 bg-slate-950/40 p-1 animate-table-fade-in shadow-inner"
              >
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-xs">
                      <th className="py-3 px-3 sm:px-4 font-semibold">Pos.</th>
                      <th className="py-3 px-3 sm:px-4 font-semibold">Nome de Guerra / Identificação do Militar</th>
                      <th className="py-3 px-3 sm:px-4 font-semibold">Conta Gmail</th>
                      <th className="py-3 px-3 sm:px-4 font-semibold">Unidade (OPM)</th>
                      <th className="py-3 px-3 sm:px-4 font-semibold hidden md:table-cell">
                        Meta / Competição Saudável
                      </th>
                      <th className="py-3 px-3 sm:px-4 font-semibold">Nível CFOA</th>
                      <th className="py-3 px-3 sm:px-4 font-semibold text-center">
                        Progressão (1ª ➔ Atual)
                      </th>
                      <th
                        className="py-3 px-3 sm:px-4 font-semibold text-center text-amber-300"
                        title="Porcentagem de acertos totais sobre o número de missões realizadas"
                      >
                        Taxa de Precisão Média
                      </th>
                      <th className="py-3 px-3 sm:px-4 font-semibold text-right">Última Nota</th>
                      <th className="py-3 px-3 sm:px-4 font-semibold text-center">Desempenho</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {[...classRoster]
                      .sort((a, b) => b.score - a.score)
                      .filter(
                        (s) =>
                          tableFilter === 'ALL' ||
                          normalizeCohortCategory(s.cohort, false) === tableFilter
                      )
                      .map((student, idx, filteredList) => {
                        const isCurrentPlayer =
                          (studentName.trim() &&
                            student.name.toLowerCase() === studentName.trim().toLowerCase()) ||
                          (studentId.trim() &&
                            student.registration.toLowerCase() === studentId.trim().toLowerCase());
                        const isRecent = student.id === recentStudentId;
                        const isLive = student.status === 'Em Missão';

                        const attemptsCount = student.attemptsCount || student.history?.length || 1;
                        const firstScore = student.history?.[0]?.score ?? student.score;
                        const scoreGain = student.score - firstScore;
                        const prevStudent = idx > 0 ? filteredList[idx - 1] : null;
                        const ptsToNext = prevStudent ? Math.max(1, prevStudent.score - student.score) : 0;
                        const accuracyStats = calculateStudentAverageAccuracy(student);

                        let rowClass = 'hover:bg-slate-950/50 text-slate-200 transition-colors animate-row-item';
                        if (isRecent) {
                          rowClass =
                            'bg-amber-400/20 text-white font-semibold border-l-4 border-amber-400 ring-2 ring-amber-400/70 animate-row-recent shadow-lg shadow-amber-950/60';
                        } else if (isCurrentPlayer) {
                          rowClass =
                            'bg-amber-400/10 text-white font-semibold border-l-2 border-amber-400/50 animate-row-item';
                        }

                        return (
                          <tr
                            key={student.id}
                            style={{ animationDelay: `${Math.min(idx * 30, 300)}ms` }}
                            className={rowClass}
                          >
                            <td className="py-3.5 px-3 sm:px-4 font-mono-num font-bold">
                              <span
                                className={
                                  idx === 0
                                    ? 'text-amber-300 font-black'
                                    : idx === 1
                                    ? 'text-slate-200 font-black'
                                    : idx === 2
                                    ? 'text-amber-500 font-black'
                                    : 'text-slate-400'
                                }
                              >
                                {idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 sm:px-4 font-semibold text-white">
                              <div className="flex flex-wrap items-center gap-2">
                                <span>{student.name}</span>
                                {isLive && (
                                  <span className="text-[10px] bg-emerald-500 text-slate-950 px-2 py-0.5 rounded font-bold uppercase animate-pulse">
                                    Em Missão ({student.progressQuestions ?? 0}/{student.totalQuestionsCount ?? 10})
                                  </span>
                                )}
                                {isRecent && (
                                  <span className="inline-flex items-center gap-1 text-[10px] bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm animate-pulse-glow">
                                    <Sparkles className="w-2.5 h-2.5" />
                                    {recentActionType === 'updated' ? 'Nota Atualizada' : 'Atividade Recente'}
                                  </span>
                                )}
                                {isCurrentPlayer && !isRecent && (
                                  <span className="text-[10px] bg-amber-400 text-slate-950 px-2 py-0.5 rounded font-black uppercase">
                                    Seu Cadastro
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-3 sm:px-4 font-mono-num text-slate-300">
                              {student.registration}
                            </td>
                            <td className="py-3.5 px-3 sm:px-4 text-slate-300">
                              {(() => {
                                const cat = normalizeCohortCategory(student.cohort, false);
                                const badgeColors =
                                  cat === 'Visitantes'
                                    ? 'bg-purple-950 text-purple-300 border border-purple-700/60'
                                    : cat === 'Turma 02'
                                    ? 'bg-sky-950 text-sky-300 border border-sky-800/60'
                                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800/60';
                                return (
                                  <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${badgeColors}`}>
                                    {student.cohort || cat}
                                  </span>
                                );
                              })()}
                            </td>
                            <td className="py-3.5 px-3 sm:px-4 font-mono-num text-xs hidden md:table-cell">
                              {idx === 0 ? (
                                <span className="px-2 py-0.5 rounded bg-amber-400/20 border border-amber-400/50 text-amber-300 font-bold text-[11px]">
                                  🏆 Líder (#1)
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-sky-950/70 border border-sky-700/50 text-sky-300 font-semibold text-[11px]">
                                  Faltam +{ptsToNext} pts p/ #{idx}
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-3 sm:px-4">
                              <span
                                className={`font-semibold ${
                                  student.score >= 80
                                    ? 'text-emerald-400'
                                    : student.score >= 50
                                    ? 'text-sky-400'
                                    : 'text-amber-400'
                                }`}
                              >
                                {student.score >= 80
                                  ? '★ Apto CFOA'
                                  : student.score >= 50
                                  ? '● Intermediário'
                                  : '▲ Em Formação'}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 sm:px-4 text-center">
                              <span className="font-mono-num text-xs text-slate-300 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800 inline-flex items-center gap-1">
                                <span>{firstScore} ➔ {student.score} pts</span>
                                {scoreGain !== 0 && (
                                  <span className={`font-bold ${scoreGain > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    ({scoreGain > 0 ? `+${scoreGain}` : scoreGain})
                                  </span>
                                )}
                                <span className="text-[10px] text-slate-400">
                                  [{attemptsCount}x]
                                </span>
                              </span>
                            </td>
                            <td className="py-3.5 px-3 sm:px-4 text-center">
                              <div className="inline-flex flex-col items-center justify-center bg-slate-950 px-2.5 py-1 rounded-lg border border-amber-500/30">
                                <span
                                  className={`font-mono-num text-xs font-extrabold ${
                                    accuracyStats.avgAccuracyPct >= 80
                                      ? 'text-emerald-400'
                                      : accuracyStats.avgAccuracyPct >= 50
                                      ? 'text-sky-400'
                                      : 'text-amber-400'
                                  }`}
                                >
                                  {accuracyStats.avgAccuracyPct}%
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono-num">
                                  {accuracyStats.totalCorrect} acertos / {accuracyStats.missionsCompleted}{' '}
                                  {accuracyStats.missionsCompleted === 1 ? 'missão' : 'missões'}
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-3 sm:px-4 text-right font-mono-num font-bold text-white">
                              {student.score} pts
                            </td>
                            <td className="py-3.5 px-3 sm:px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedProgressStudent(student);
                                    setShowProgressModal(true);
                                  }}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                                  title="Ver histórico de progresso e tentativas em cada etapa"
                                >
                                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShareModalTarget(student);
                                    setShowShareModal(true);
                                  }}
                                  className="p-1.5 rounded-lg bg-amber-400/20 hover:bg-amber-400/35 border border-amber-400/40 text-amber-300 transition cursor-pointer"
                                  title="Ver e compartilhar escala de patentes e certificação"
                                >
                                  <Share2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              {/* Direitos Reservados no Quadro da Turma */}
              <div className="pt-4 pb-1 text-center border-t border-slate-800 text-[11px] text-slate-400">
                <span className="font-mono-num text-amber-400/90 font-medium">
                  *IMPORTHOUR© - todos os direitos reservados
                </span>
              </div>
            </section>
          </div>
        )}

        {/* ABA 3: APOSTILA (LEITURA MOBILE, VISUALIZADOR PDF/LINK E DOWNLOAD) & GERADOR */}
        {activeTab === 'material-generator' && (
          <ApostilaViewer
            isAdminUnlocked={isAdminAuthenticated}
            initialViewMode={apostilaViewMode}
            selectedSearchResult={selectedSearchIndexEntry}
            customChapters={
              customKnowledgeBase?.isCustom ? customKnowledgeBase.chapters : undefined
            }
            customPdfUrl={
              customKnowledgeBase?.isCustom ? customKnowledgeBase.pdfUrl : undefined
            }
            customMaterialTitle={
              customKnowledgeBase?.isCustom ? customKnowledgeBase.title : undefined
            }
            customMaterialSubtitle={
              customKnowledgeBase?.isCustom ? customKnowledgeBase.subtitle : undefined
            }
            customSourceType={
              customKnowledgeBase?.isCustom ? customKnowledgeBase.sourceType : undefined
            }
            isCustomMaterialActive={Boolean(customKnowledgeBase?.isCustom)}
            onReturnToSearchResults={() => {
              setShowSearchIndexModal(true);
              soundFX.playSelect();
            }}
            onClearSearchResult={() => setSelectedSearchIndexEntry(null)}
            onOpenSearchIndexModal={(query) => {
              setSearchIndexInitialQuery(query || '');
              setShowSearchIndexModal(true);
              soundFX.playSelect();
            }}
            onSelectChapterForGenerator={(chapterId) => {
              setGeneratorScopeMode('chapter');
              setSelectedGeneratorChapters([chapterId]);
              setApostilaViewMode('generator');
              soundFX.playSelect();
            }}
            onStartQuiz={() => {
              setActiveTab('assessment');
              soundFX.playSelect();
            }}
            instructorGeneratorNode={
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
                <section className="lg:col-span-8 bg-slate-900/95 border border-slate-800 rounded-2xl p-4 sm:p-7 shadow-xl">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                      <BookOpen className="w-4 h-4" />
                      <span>
                        {customKnowledgeBase?.isCustom
                          ? `Base Oficial Ativa · ${customKnowledgeBase.title}`
                          : 'Base Oficial Exclusiva · Apostila DT-SEI (Págs. 07 a 75)'}
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold">
                      100% Fiel à Apostila Ativa
                    </span>
                  </div>

                  <h2 className="font-display text-xl sm:text-2xl font-bold text-white mb-1.5">
                    Gerador Tático de Questões por Capítulo, Páginas ou Assunto
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                    Escolha abaixo qual parte da <strong>Apostila Oficial</strong> você deseja praticar ou aferir: por <strong>Capítulos ({activeApostilaChapters.length} Módulos)</strong>, por <strong>Intervalo de Páginas</strong> ou por <strong>Assunto da Apostila</strong>.
                  </p>

                  {/* DESTAQUE NO GERADOR TÁTICO: BOTÃO 'MODO REVISÃO RÁPIDA' (COMPLEXIDADE BÁSICA) */}
                  <div
                    className={`mb-5 p-4 rounded-2xl border-2 transition-all ${
                      isQuickReviewMode || selectedProgramComplexity === 'Básica / Conceitual'
                        ? 'bg-gradient-to-r from-amber-950/80 via-slate-900 to-emerald-950/60 border-amber-400 shadow-lg shadow-amber-500/15'
                        : 'bg-slate-950/90 border-amber-500/40'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider">
                            Ciclo Focado Pré-Missão
                          </span>
                          <span className="text-xs font-extrabold text-amber-300">
                            Complexidade: Básica / Conceitual
                          </span>
                        </div>
                        <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-1.5">
                          <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>Modo Revisão Rápida — Gerador Tático</span>
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Seleciona automaticamente apenas questões de complexidade <strong>'Básica'</strong> (Lei Seca e conceitos fundamentais) para um ciclo de estudos focado antes de missões complexas.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleActivateQuickReviewMode(!isQuickReviewMode)}
                          className={`min-h-[46px] px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer border-2 shadow-lg ${
                            isQuickReviewMode || selectedProgramComplexity === 'Básica / Conceitual'
                              ? 'bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-300 text-slate-950 border-white shadow-amber-400/30 scale-[1.01]'
                              : 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-200'
                          }`}
                        >
                          <Zap className="w-4 h-4 stroke-[2.5] shrink-0" />
                          <span>
                            {isQuickReviewMode || selectedProgramComplexity === 'Básica / Conceitual'
                              ? '✓ Modo Revisão Rápida Ativo (Básica)'
                              : 'Modo Revisão Rápida'}
                          </span>
                        </button>

                        {(isQuickReviewMode || selectedProgramComplexity === 'Básica / Conceitual') && (
                          <button
                            type="button"
                            onClick={() => {
                              handleActivateQuickReviewMode(true);
                              setActiveTab('assessment');
                              setStep(1);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="min-h-[46px] px-3.5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                          >
                            <span>Praticar Ciclo Básico Agora →</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleGenerateFromMaterial} className="space-y-5">
                    {/* 1. SELETOR DE MODO DE ESCOPO (CAPÍTULOS | PÁGINAS | ASSUNTO | APOSTILA COMPLETA) */}
                    <div className="space-y-3 bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5 sm:p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                          1. Como você deseja escolher o conteúdo da Apostila?
                        </span>
                        <span className="text-[11px] text-sky-300 font-semibold">
                          {resolvedScopeInfo.matchedChapters.length} de {activeApostilaChapters.length} capítulos abrangidos
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { id: 'chapter' as GeneratorScopeMode, label: 'Por Capítulo / Módulo', sub: `${activeApostilaChapters.length} Módulos` },
                          { id: 'pages' as GeneratorScopeMode, label: 'Por Páginas', sub: 'Intervalo de Págs.' },
                          { id: 'subject' as GeneratorScopeMode, label: 'Por Assunto', sub: 'Temas da Apostila' },
                          { id: 'all' as GeneratorScopeMode, label: 'Apostila Completa', sub: `Todos os ${activeApostilaChapters.length} Módulos` },
                        ].map((tab) => {
                          const isSelected = generatorScopeMode === tab.id;
                          return (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => {
                                setGeneratorScopeMode(tab.id);
                                setGenerationSuccess(false);
                                soundFX.playSelect();
                              }}
                              className={`min-h-[54px] p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                isSelected
                                  ? 'bg-sky-400 text-slate-950 border-sky-200 font-black shadow-lg shadow-sky-500/20'
                                  : 'bg-slate-900 text-slate-200 border-slate-700 hover:border-sky-400/50'
                              }`}
                            >
                              <span className="text-xs font-black leading-tight">{tab.label}</span>
                              <span
                                className={`text-[10px] mt-0.5 ${
                                  isSelected ? 'text-slate-900 font-bold' : 'text-slate-400'
                                }`}
                              >
                                {tab.sub}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* MODO A: ESCOLHA POR CAPÍTULOS / MÓDULOS DA APOSTILA */}
                      {generatorScopeMode === 'chapter' && (
                        <div className="pt-3 border-t border-slate-800/90 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs text-slate-300 font-semibold">
                              Toque em um ou mais Capítulos da Apostila para gerar as questões:
                            </p>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedGeneratorChapters(activeApostilaChapters.map((c) => c.id))
                                }
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 text-[11px] font-bold border border-slate-700 cursor-pointer"
                              >
                                Marcar Todos ({activeApostilaChapters.length})
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedGeneratorChapters([activeApostilaChapters[0]?.id || 'cap-1'])}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold border border-slate-700 cursor-pointer"
                              >
                                Apenas Módulo 01
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[340px] overflow-y-auto pr-1">
                            {activeApostilaChapters.map((ch) => {
                              const isChecked = selectedGeneratorChapters.includes(ch.id);
                              return (
                                <button
                                  key={ch.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedGeneratorChapters((prev) => {
                                      if (prev.includes(ch.id)) {
                                        return prev.length > 1
                                          ? prev.filter((id) => id !== ch.id)
                                          : prev;
                                      }
                                      return [...prev, ch.id];
                                    });
                                    soundFX.playSelect();
                                  }}
                                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                                    isChecked
                                      ? 'bg-emerald-950/80 border-emerald-400 text-white shadow-md'
                                      : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-600'
                                  }`}
                                >
                                  <div
                                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 border text-xs font-black ${
                                      isChecked
                                        ? 'bg-emerald-400 text-slate-950 border-emerald-200'
                                        : 'bg-slate-950 text-transparent border-slate-700'
                                    }`}
                                  >
                                    ✓
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-1.5">
                                      <span className="text-xs font-black text-amber-300">
                                        {ch.number}
                                      </span>
                                      <span className="text-[10px] font-mono-num px-1.5 py-0.5 rounded bg-slate-950 text-emerald-300 border border-slate-800">
                                        {ch.pages}
                                      </span>
                                    </div>
                                    <p className="text-xs font-bold text-white leading-snug mt-0.5 line-clamp-2">
                                      {ch.title}
                                    </p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* MODO B: ESCOLHA POR INTERVALO DE PÁGINAS DA APOSTILA (07 A 75) */}
                      {generatorScopeMode === 'pages' && (
                        <div className="pt-3 border-t border-slate-800/90 space-y-3.5">
                          <p className="text-xs text-slate-300 font-semibold">
                            Escolha um recorte rápido de páginas ou defina a Página Inicial e Final (Págs. 07 a 75 da Apostila):
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {QUICK_PAGE_INTERVALS.map((interval) => {
                              const isActiveInterval =
                                generatorStartPage === interval.start &&
                                generatorEndPage === interval.end;
                              return (
                                <button
                                  key={interval.label}
                                  type="button"
                                  onClick={() => {
                                    setGeneratorStartPage(interval.start);
                                    setGeneratorEndPage(interval.end);
                                    soundFX.playSelect();
                                  }}
                                  className={`p-2.5 rounded-xl border text-left text-xs transition cursor-pointer ${
                                    isActiveInterval
                                      ? 'bg-amber-400/20 border-amber-400 text-amber-200 font-bold'
                                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-600'
                                  }`}
                                >
                                  {interval.label}
                                </button>
                              );
                            })}
                          </div>

                          <div className="grid grid-cols-2 gap-3 bg-slate-900/90 p-3.5 rounded-xl border border-slate-800">
                            <div>
                              <label
                                htmlFor="start-page-input"
                                className="block text-[11px] font-bold text-slate-300 mb-1"
                              >
                                Página Inicial (07 a 75):
                              </label>
                              <input
                                id="start-page-input"
                                type="number"
                                min={7}
                                max={75}
                                value={generatorStartPage}
                                onChange={(e) =>
                                  setGeneratorStartPage(
                                    Math.max(1, Math.min(75, Number(e.target.value) || 7))
                                  )
                                }
                                className="w-full min-h-[42px] px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono-num font-bold text-white"
                              />
                            </div>
                            <div>
                              <label
                                htmlFor="end-page-input"
                                className="block text-[11px] font-bold text-slate-300 mb-1"
                              >
                                Página Final (07 a 75):
                              </label>
                              <input
                                id="end-page-input"
                                type="number"
                                min={7}
                                max={75}
                                value={generatorEndPage}
                                onChange={(e) =>
                                  setGeneratorEndPage(
                                    Math.max(1, Math.min(75, Number(e.target.value) || 75))
                                  )
                                }
                                className="w-full min-h-[42px] px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono-num font-bold text-white"
                              />
                            </div>
                          </div>

                          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                            <strong className="text-emerald-400 block mb-1">
                              Capítulos localizados nas Págs. {Math.min(generatorStartPage, generatorEndPage)} a {Math.max(generatorStartPage, generatorEndPage)}:
                            </strong>
                            {resolvedScopeInfo.matchedChapters.length > 0 ? (
                              <ul className="space-y-1 text-[11px]">
                                {resolvedScopeInfo.matchedChapters.map((c) => (
                                  <li key={c.id} className="text-slate-200">
                                    • <strong>{c.number}</strong> ({c.pages}): {c.title}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <span className="text-rose-400 font-semibold">
                                Nenhum capítulo encontrado fora do intervalo didático (Págs. 07 a 75).
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* MODO C: ESCOLHA POR ASSUNTO DA APOSTILA */}
                      {generatorScopeMode === 'subject' && (
                        <div className="pt-3 border-t border-slate-800/90 space-y-3.5">
                          <div>
                            <label
                              htmlFor="subject-search-input"
                              className="block text-xs font-bold text-slate-200 mb-1.5"
                            >
                              Pesquisar termo ou assunto específico dentro da Apostila DT-SEI:
                            </label>
                            <input
                              id="subject-search-input"
                              type="text"
                              value={customSubjectQuery}
                              onChange={(e) => setCustomSubjectQuery(e.target.value)}
                              placeholder="Ex.: Bloco de Assinatura, Sobrestamento, 2FA, Sigiloso, Anexação, OCR 300 dpi..."
                              className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-900 border border-slate-700 focus:border-sky-400 rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-500 outline-none"
                            />
                            <p className="text-[11px] text-slate-400 mt-1">
                              Ou toque diretamente em um dos <strong>10 Assuntos Oficiais da Apostila</strong> abaixo:
                            </p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[290px] overflow-y-auto pr-1">
                            {OFFICIAL_APOSTILA_SUBJECTS.map((subj) => {
                              const isSelectedSubj =
                                !customSubjectQuery.trim() && selectedSubjectId === subj.id;
                              return (
                                <button
                                  key={subj.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedSubjectId(subj.id);
                                    setCustomSubjectQuery('');
                                    soundFX.playSelect();
                                  }}
                                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between gap-1 ${
                                    isSelectedSubj
                                      ? 'bg-sky-950/90 border-sky-400 text-white shadow-md'
                                      : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-600'
                                  }`}
                                >
                                  <span className="text-xs font-bold leading-snug">
                                    {subj.label}
                                  </span>
                                  <span className="text-[10px] font-mono-num text-amber-300">
                                    Referência na Apostila: {subj.pages}
                                  </span>
                                </button>
                              );
                            })}
                          </div>

                          {!resolvedScopeInfo.isValidInApostila && (
                            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-700 text-xs text-rose-200 font-semibold">
                              O assunto "{customSubjectQuery}" não consta na Apostila Oficial DT-SEI (Págs. 07 a 75). Digite ou selecione um assunto presente na Apostila.
                            </div>
                          )}
                        </div>
                      )}

                      {/* Resumo do Recorte Ativo */}
                      <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-700/50 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">
                            Recorte Selecionado para Gerar as Questões:
                          </span>
                          <strong className="text-emerald-300 font-bold">
                            {resolvedScopeInfo.scopeLabel}
                          </strong>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 font-mono-num text-[11px] border border-slate-700">
                          {customMaterial.length} caracteres da Apostila
                        </span>
                      </div>
                    </div>

                    {/* 2. QUANTIDADE DE QUESTÕES (5, 8 OU 10), MODO REVISÃO RÁPIDA E BOTÃO DE DISPARO */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <label
                          htmlFor="question-count-select"
                          className="text-xs font-bold text-slate-200"
                        >
                          Quantidade de Questões:
                        </label>
                        <select
                          id="question-count-select"
                          value={desiredQuestionCount}
                          onChange={(e) => setDesiredQuestionCount(Number(e.target.value))}
                          className="min-h-[44px] px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono-num font-bold text-amber-300 cursor-pointer"
                        >
                          <option value={5}>5 questões (100 pts)</option>
                          <option value={8}>8 questões (100 pts)</option>
                          <option value={10}>10 questões (100 pts)</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => handleActivateQuickReviewMode(!isQuickReviewMode)}
                          className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 border transition cursor-pointer ${
                            isQuickReviewMode || selectedProgramComplexity === 'Básica / Conceitual'
                              ? 'bg-amber-400 text-slate-950 border-amber-200 shadow-md'
                              : 'bg-slate-950 text-amber-300 border-amber-500/50 hover:border-amber-400'
                          }`}
                          title="Seleciona automaticamente apenas questões de complexidade 'Básica' para um ciclo de estudos focado"
                        >
                          <Zap className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            {isQuickReviewMode || selectedProgramComplexity === 'Básica / Conceitual'
                              ? 'Modo Revisão Rápida: ATIVO (Básica)'
                              : 'Modo Revisão Rápida (Só Básicas)'}
                          </span>
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={isGenerating || !resolvedScopeInfo.isValidInApostila}
                        className="min-h-[50px] px-6 py-3 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400 hover:from-emerald-300 hover:to-teal-300 disabled:opacity-50 text-slate-950 font-black text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 whitespace-nowrap"
                      >
                        <Sparkles className="w-4 h-4 stroke-[2.5]" />
                        {isGenerating
                          ? 'Gerando Questões deste Recorte...'
                          : isQuickReviewMode || selectedProgramComplexity === 'Básica / Conceitual'
                          ? 'Gerar Revisão Rápida (Complexidade Básica)'
                          : 'Gerar Questões do Recorte Escolhido'}
                      </button>
                    </div>

                    {/* Visualização opcional do texto extraído da Apostila */}
                    <details className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
                      <summary className="text-xs font-semibold text-slate-400 cursor-pointer select-none hover:text-white">
                        Ver conteúdo oficial da Apostila carregado neste recorte ({customMaterial.length} caracteres)
                      </summary>
                      <textarea
                        id="material-textarea"
                        rows={8}
                        value={customMaterial}
                        onChange={(e) => setCustomMaterial(e.target.value)}
                        className="mt-3 w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                      />
                    </details>

                    {generationError && (
                      <div className="p-4 rounded-xl bg-rose-950/70 border border-rose-700 text-xs text-rose-200 font-semibold">
                        {generationError}
                      </div>
                    )}

                    {generationSuccess && (
                      <div className="p-4 rounded-xl bg-emerald-950/80 border-2 border-emerald-500/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
                        <div className="text-xs text-emerald-100 space-y-0.5">
                          <strong className="font-black block text-white text-sm">
                            Missão gerada com sucesso a partir da Apostila DT-SEI!
                          </strong>
                          <span>
                            Recorte: <strong>{currentAssessment.subjectArea}</strong> ({questions.length} questões prontas).
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('assessment');
                            setStep(1);
                            soundFX.playSelect();
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="min-h-[44px] px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs sm:text-sm font-black rounded-xl cursor-pointer shrink-0 shadow-md"
                        >
                          Responder Estas Questões Agora →
                        </button>
                      </div>
                    )}
                  </form>
                </section>

                <aside className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
                  <div>
                    <h3 className="font-display text-base font-bold text-white">
                      Banco de Missões Ativo ({totalQuestions} questões)
                    </h3>
                    <p className="text-[11px] text-amber-300 font-semibold mt-0.5">
                      {currentAssessment.subjectArea}
                    </p>
                  </div>
                  <div className="divide-y divide-slate-800 max-h-[460px] overflow-y-auto pr-1">
                    {questions.map((q, i) => (
                      <div key={q.id} className="py-3 first:pt-0 last:pb-0 text-xs space-y-1">
                        <div className="flex items-center justify-between text-slate-400">
                          <span className="font-mono-num font-bold text-amber-400">
                            Q0{i + 1} · {q.topic}
                          </span>
                          <span className="font-mono-num text-emerald-400 font-bold">
                            +{q.points} pts
                          </span>
                        </div>
                        <p className="text-slate-200 font-medium line-clamp-2">{q.stem}</p>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                          <span>{q.pillar}</span>
                          {q.pageRef && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-sky-300 font-mono-num">
                              {q.pageRef}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </aside>
              </div>
            }
          />
        )}

        {/* ABA 4: PAINEL DO ADMINISTRADOR (TROCA DA BASE DE CONHECIMENTO / APOSTILA + EXPORTAÇÃO HTML) */}
        {activeTab === 'standalone-export' && (
          isAdminAuthenticated ? (
            <div className="space-y-6 animate-in fade-in">
              {/* =====================================================================
                  1. CENTRAL DE SUBSTITUIÇÃO DO MATERIAL BASE / APOSTILA (PDF OU LINK)
                 ===================================================================== */}
              <section className="bg-gradient-to-br from-slate-900 via-emerald-950/30 to-slate-900 border-2 border-emerald-500/60 rounded-2xl p-5 sm:p-8 space-y-6 shadow-2xl">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-black uppercase tracking-wider">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Gestão da Base do Conhecimento · Exclusivo Administrador</span>
                    </div>
                    <h2 className="font-display text-xl sm:text-2xl font-extrabold text-white">
                      Substituir Material Base / Apostila do Aplicativo (PDF ou Link)
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
                      Troque a apostila que serve como base do conhecimento deste aplicativo enviando um <strong>Arquivo PDF</strong> ou informando um <strong>Link / URL</strong>. Ao substituir o material, toda a seção <strong>APOSTILA</strong> (módulos de leitura no celular, visualizador integrado, pesquisa indexada e questões do Quiz) será totalmente reformulada para o novo conteúdo.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    {customKnowledgeBase?.isCustom && (
                      <button
                        type="button"
                        onClick={handleAdminRestoreDefaultKnowledgeBase}
                        disabled={isReformingKb}
                        className="min-h-[42px] px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-amber-300 text-xs font-black flex items-center gap-2 cursor-pointer transition"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Restaurar Apostila Original DT-SEI</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('material-generator');
                        soundFX.playSelect();
                      }}
                      className="min-h-[42px] px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-300 text-xs font-black flex items-center gap-2 cursor-pointer transition"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>Ver Seção Apostila Agora</span>
                    </button>
                  </div>
                </div>

                {/* Status da Base de Conhecimento Atualmente Ativa */}
                <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                      Material Base Atualmente em Vigor no Aplicativo:
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase ${
                          customKnowledgeBase?.isCustom
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                        }`}
                      >
                        {customKnowledgeBase?.isCustom ? 'MATERIAL SUBSTITUÍDO PELO ADMIN' : 'APOSTILA PADRÃO DT-SEI'}
                      </span>
                      <strong className="text-sm sm:text-base font-bold text-white">
                        {customKnowledgeBase?.isCustom
                          ? customKnowledgeBase.title
                          : 'Apostila Oficial DT-SEI — Guia Prático do Usuário SEI (4ª Edição)'}
                      </strong>
                    </div>
                    <p className="text-xs text-slate-400">
                      {customKnowledgeBase?.isCustom
                        ? `Atualizado em ${customKnowledgeBase.updatedAt || 'agora'} · Fonte: ${
                            customKnowledgeBase.sourceType === 'link'
                              ? `Link (${customKnowledgeBase.linkUrl})`
                              : `PDF (${customKnowledgeBase.fileName || 'Arquivo PDF'})`
                          } · ${customKnowledgeBase.chapters?.length || 0} Módulos estruturados`
                        : '10 Módulos Oficiais (Págs. 07 a 75) · Decreto Estadual nº 45.157/2017'}
                    </p>
                  </div>

                  {customKnowledgeBase?.isCustom && customKnowledgeBase.pdfUrl && (
                    <a
                      href={customKnowledgeBase.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[38px] px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 text-xs font-bold flex items-center gap-1.5 shrink-0 self-start sm:self-center"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Abrir Material Ativo</span>
                    </a>
                  )}
                </div>

                {/* Formulário de Substituição do Material (PDF ou Link) */}
                <form onSubmit={handleAdminReplaceKnowledgeBase} className="space-y-5">
                  {/* Seletor do Tipo de Fonte: PDF ou Link */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setKbSourceType('pdf');
                        setKbErrorMessage(null);
                      }}
                      className={`min-h-[58px] p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center gap-3.5 ${
                        kbSourceType === 'pdf'
                          ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-lg shadow-emerald-950/50'
                          : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          kbSourceType === 'pdf'
                            ? 'bg-emerald-400 text-slate-950'
                            : 'bg-slate-900 text-slate-400'
                        }`}
                      >
                        <Upload className="w-5 h-5 stroke-[2.5]" />
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm font-black block">
                          Opção 1: Enviar Arquivo PDF
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Faça upload de uma nova apostila ou manual em PDF do seu dispositivo
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setKbSourceType('link');
                        setKbErrorMessage(null);
                      }}
                      className={`min-h-[58px] p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center gap-3.5 ${
                        kbSourceType === 'link'
                          ? 'bg-amber-400/20 border-amber-400 text-white shadow-lg shadow-amber-950/50'
                          : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          kbSourceType === 'link'
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-slate-900 text-slate-400'
                        }`}
                      >
                        <Link2 className="w-5 h-5 stroke-[2.5]" />
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm font-black block">
                          Opção 2: Informar Link / URL
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Cole o link de um PDF online, Google Drive ou documento web
                        </span>
                      </div>
                    </button>
                  </div>

                  {/* Entrada de Arquivo PDF ou Link */}
                  {kbSourceType === 'pdf' ? (
                    <div className="bg-slate-950/90 border-2 border-dashed border-emerald-500/50 rounded-2xl p-5 text-center space-y-3">
                      <Upload className="w-8 h-8 text-emerald-400 mx-auto" />
                      <div className="space-y-1">
                        <label
                          htmlFor="admin-kb-pdf-upload"
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm cursor-pointer shadow-lg transition"
                        >
                          <Upload className="w-4 h-4 stroke-[2.5]" />
                          <span>Escolher Arquivo PDF da Nova Apostila</span>
                        </label>
                        <input
                          id="admin-kb-pdf-upload"
                          type="file"
                          accept="application/pdf,.pdf"
                          onChange={handleAdminPdfFileChange}
                          className="hidden"
                        />
                        <p className="text-[11px] text-slate-400 pt-1">
                          {kbFileName ? (
                            <span className="text-emerald-300 font-bold">
                              ✓ Arquivo carregado pronto para reformulação: {kbFileName}
                            </span>
                          ) : (
                            'Suporta apostilas, manuais, diretrizes e legislações em formato .PDF'
                          )}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-950/90 border border-amber-500/40 rounded-2xl p-4 sm:p-5 space-y-2">
                      <label
                        htmlFor="admin-kb-link-input"
                        className="block text-xs font-black uppercase tracking-wider text-amber-300"
                      >
                        Link / URL do Material Base (PDF Online, Google Drive ou Página Oficial):
                      </label>
                      <input
                        id="admin-kb-link-input"
                        type="url"
                        value={kbLinkUrl}
                        onChange={(e) => setKbLinkUrl(e.target.value)}
                        placeholder="Ex.: https://drive.google.com/file/d/... ou https://.../apostila.pdf"
                        className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-400 text-sm text-white placeholder:text-slate-500 outline-none"
                      />
                      <p className="text-[11px] text-slate-400">
                        O link informado ficará disponível para leitura direta e abertura na seção APOSTILA, e seu conteúdo será estruturado em módulos.
                      </p>
                    </div>
                  )}

                  {/* Título e Ementa / Texto Complementar Opcional */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="admin-kb-title-input"
                        className="block text-xs font-bold text-slate-200 mb-1.5"
                      >
                        Título do Novo Material / Disciplina <span className="text-slate-400 font-normal">(opcional)</span>:
                      </label>
                      <input
                        id="admin-kb-title-input"
                        type="text"
                        value={kbCustomTitle}
                        onChange={(e) => setKbCustomTitle(e.target.value)}
                        placeholder="Ex.: Apostila de Procedimentos Operacionais Padrão (POP PMPE)"
                        className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-emerald-400 text-xs sm:text-sm text-white placeholder:text-slate-500 outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="admin-kb-notes-input"
                        className="block text-xs font-bold text-slate-200 mb-1.5"
                      >
                        Resumo / Tópicos Prioritários ou Texto Base <span className="text-slate-400 font-normal">(opcional)</span>:
                      </label>
                      <textarea
                        id="admin-kb-notes-input"
                        rows={2}
                        value={kbSupplementalText}
                        onChange={(e) => setKbSupplementalText(e.target.value)}
                        placeholder="Cole aqui tópicos, capítulos ou trechos que deseja destacar na reformulação da Apostila..."
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-emerald-400 text-xs text-white placeholder:text-slate-500 outline-none"
                      />
                    </div>
                  </div>

                  {kbErrorMessage && (
                    <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-700 text-xs text-rose-200 font-semibold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{kbErrorMessage}</span>
                    </div>
                  )}

                  {kbStatusMessage && (
                    <div className="p-4 rounded-xl bg-emerald-950/90 border-2 border-emerald-500/70 text-xs sm:text-sm text-emerald-100 font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{kbStatusMessage}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('material-generator');
                          soundFX.playSelect();
                        }}
                        className="min-h-[40px] px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shrink-0 cursor-pointer"
                      >
                        Abrir Nova Apostila →
                      </button>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-slate-800">
                    <button
                      type="submit"
                      disabled={isReformingKb}
                      className="min-h-[50px] px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400 hover:from-emerald-300 hover:to-teal-300 disabled:opacity-50 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-500/20 cursor-pointer transition"
                    >
                      <RefreshCw className={`w-4 h-4 stroke-[2.5] ${isReformingKb ? 'animate-spin' : ''}`} />
                      <span>
                        {isReformingKb
                          ? 'Processando Material e Reformulando Seção APOSTILA...'
                          : 'Substituir Base do Conhecimento e Reformular Apostila'}
                      </span>
                    </button>
                  </div>
                </form>
              </section>

              {/* =====================================================================
                  2. EXPORTAÇÃO DO ARQUIVO HTML ÚNICO (INDEX.HTM)
                 ===================================================================== */}
              <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Área do Administrador · Acesso Autorizado (Instrutor 1º SGT PM Gregório)</span>
                    </div>
                    <h2 className="font-display text-lg sm:text-2xl font-bold text-white">
                      Código <code className="font-mono-num text-base bg-slate-950 px-2 py-0.5 rounded text-emerald-400">index.htm</code> — Guia de Aperfeiçoamento
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 mt-1">
                      Arquivo 100% autocontido (HTML5 + Tailwind CDN + Chart.js CDN), responsivo para celular e desktop, com *IMPORTHOUR© - todos os direitos reservados.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleAdminLogout}
                      className="min-h-[42px] px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-950 border border-slate-800 hover:bg-slate-800 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                      title="Bloquear sessão administrativa"
                    >
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      Bloquear Admin
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyStandaloneHtml}
                      className="min-h-[42px] px-4 py-2 text-xs font-bold text-slate-200 bg-slate-950 border border-slate-700 hover:bg-slate-800 rounded-xl transition flex items-center gap-2 cursor-pointer"
                    >
                      {copiedHtmlCode ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          HTML Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copiar Código HTML
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadStandaloneHtml}
                      className="min-h-[42px] px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-950/40"
                    >
                      <FileText className="w-4 h-4" />
                      Salvar como index.html
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <pre className="w-full max-h-[520px] overflow-auto p-4 sm:p-5 bg-slate-950 text-slate-200 rounded-xl border border-slate-800 font-mono-num text-xs leading-relaxed">
                    <code>{standaloneHtmlCode}</code>
                  </pre>
                </div>

                {/* Direitos Reservados */}
                <div className="pt-3 pb-1 text-center border-t border-slate-800 text-[11px] text-slate-400">
                  <span className="font-mono-num text-amber-400/90 font-medium">
                    *IMPORTHOUR© - todos os direitos reservados
                  </span>
                </div>
              </section>
            </div>
          ) : (
            <section className="bg-slate-900/90 border border-rose-900/60 rounded-2xl p-6 sm:p-12 text-center max-w-lg mx-auto space-y-6 animate-in fade-in shadow-2xl">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-950/60 border border-rose-700/60 flex items-center justify-center text-rose-400 shadow-xl">
                <Lock className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
                  Acesso Restrito ao Administrador
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  A aba <strong>"Código index.htm"</strong> e a exportação do código-fonte completo são de visualização exclusiva do Administrador do App CFOA PMPE.
                </p>
              </div>

              <form onSubmit={handleAdminLoginSubmit} className="space-y-3 max-w-sm mx-auto text-left">
                <label className="block text-xs font-semibold text-slate-300">
                  Senha Administrativa:
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={adminPasswordInput}
                    onChange={(e) => {
                      setAdminPasswordInput(e.target.value);
                      if (adminLoginError) setAdminLoginError(null);
                    }}
                    placeholder="Digite a senha administrativa..."
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer shrink-0"
                  >
                    Acessar
                  </button>
                </div>
                {adminLoginError && (
                  <p className="text-xs text-rose-400 font-medium flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    {adminLoginError}
                  </p>
                )}
              </form>

              <div className="pt-4 border-t border-slate-800 flex justify-center">
                <button
                  type="button"
                  onClick={() => setActiveTab('assessment')}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 cursor-pointer transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Voltar para Missão Quiz
                </button>
              </div>
            </section>
          )
        )}
      </main>

      {/* Rodapé Institucional */}
      <footer className="mt-12 py-6 px-4 text-center border-t border-slate-800 text-xs text-slate-400 no-print pb-28">
        <div className="max-w-4xl mx-auto space-y-1.5">
          <p className="text-[11px] text-slate-300 font-mono-num font-medium">
            *IMPORTHOUR© - todos os direitos reservados
          </p>
          <p className="text-[10px] text-slate-500">
            Curso de Formação de Oficiais de Administração (CFOA PMPE) · Base Legal Oficial: https://legis.alepe.pe.gov.br/
          </p>
        </div>
      </footer>

      {/* Barra Inferior Fixa de Alto Destaque e Visibilidade Prioritária para Celular (e Desktop) */}
      <nav
        aria-label="Navegação Principal Rápida"
        className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-xl border-t-2 border-emerald-500/70 shadow-[0_-10px_30px_rgba(0,0,0,0.85)] px-1.5 sm:px-4 py-2 no-print"
      >
        <div className="max-w-4xl mx-auto grid grid-cols-5 gap-1.5 sm:gap-2.5 items-stretch">
          <button
            type="button"
            onClick={() => {
              setActiveTab('assessment');
              soundFX.playSelect();
            }}
            className={`flex flex-col items-center justify-center min-h-[54px] px-1 py-1.5 rounded-xl border-2 transition-all cursor-pointer active:scale-[0.97] ${
              activeTab === 'assessment'
                ? 'bg-gradient-to-b from-emerald-400 to-emerald-500 text-slate-950 border-emerald-200 font-black shadow-lg shadow-emerald-500/30'
                : 'bg-slate-900/95 text-slate-100 border-slate-700 hover:border-emerald-400/70 font-bold'
            }`}
          >
            <Target className="w-5 h-5 stroke-[2.5]" />
            <span className="text-[10px] sm:text-xs mt-0.5 leading-tight tracking-tight">
              Missão
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('class-board');
              soundFX.playSelect();
            }}
            className={`relative flex flex-col items-center justify-center min-h-[54px] px-1 py-1.5 rounded-xl border-2 transition-all cursor-pointer active:scale-[0.97] ${
              activeTab === 'class-board'
                ? 'bg-gradient-to-b from-amber-300 to-amber-400 text-slate-950 border-amber-100 font-black shadow-lg shadow-amber-400/30'
                : 'bg-slate-900/95 text-amber-300 border-amber-500/50 hover:border-amber-400 font-bold'
            }`}
          >
            <span className="absolute -top-1.5 right-1 px-1.5 py-0.2 rounded-full bg-emerald-500 text-slate-950 font-mono-num font-black text-[9px] shadow">
              {classRoster.length}
            </span>
            <Trophy className="w-5 h-5 stroke-[2.5]" />
            <span className="text-[10px] sm:text-xs mt-0.5 leading-tight tracking-tight font-extrabold">
              RANKING
            </span>
          </button>

          {/* LUPA CENTRAL NO RODAPÉ: Pesquisa Indexada na Apostila (Tópicos, Páginas, Capítulos e Respostas) */}
          <button
            type="button"
            onClick={() => {
              setSearchIndexInitialQuery('');
              setShowSearchIndexModal(true);
              soundFX.playSelect();
            }}
            title="Pesquisar na Apostila (Tópicos, Páginas, Capítulos e Respostas em Formato Index)"
            className={`relative flex flex-col items-center justify-center min-h-[54px] px-1 py-1.5 rounded-xl border-2 transition-all cursor-pointer active:scale-[0.95] ${
              showSearchIndexModal
                ? 'bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 text-slate-950 border-white font-black shadow-xl shadow-amber-400/40'
                : 'bg-gradient-to-b from-emerald-500 via-emerald-600 to-teal-700 text-white border-amber-300/90 hover:from-emerald-400 hover:to-teal-600 font-black shadow-lg shadow-emerald-500/30'
            }`}
          >
            <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-mono-num font-black text-[8px] uppercase shadow whitespace-nowrap">
              INDEX
            </span>
            <Search className="w-5 h-5 stroke-[2.75]" />
            <span className="text-[10px] sm:text-xs mt-0.5 leading-tight tracking-tight">
              Pesquisar
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('material-generator');
              soundFX.playSelect();
            }}
            className={`relative flex flex-col items-center justify-center min-h-[54px] px-1 py-1.5 rounded-xl border-2 transition-all cursor-pointer active:scale-[0.97] ${
              activeTab === 'material-generator'
                ? 'bg-gradient-to-b from-emerald-400 to-teal-400 text-slate-950 border-emerald-200 font-black shadow-lg shadow-emerald-500/30'
                : 'bg-slate-900/95 text-emerald-300 border-emerald-500/50 hover:border-emerald-400 font-bold'
            }`}
          >
            <span className="absolute -top-1.5 right-1 px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-black text-[8px] uppercase shadow">
              PDF
            </span>
            <BookOpen className="w-5 h-5 stroke-[2.5]" />
            <span className="text-[10px] sm:text-xs mt-0.5 leading-tight tracking-tight">
              Apostila
            </span>
          </button>

          <button
            type="button"
            onClick={handleOpenStandaloneExportTab}
            className={`flex flex-col items-center justify-center min-h-[54px] px-1 py-1.5 rounded-xl border-2 transition-all cursor-pointer active:scale-[0.97] ${
              activeTab === 'standalone-export'
                ? 'bg-gradient-to-b from-amber-300 to-amber-400 text-slate-950 border-amber-100 font-black shadow-lg shadow-amber-400/30'
                : 'bg-slate-900/95 text-slate-200 border-slate-700 hover:border-amber-400/60 font-bold'
            }`}
          >
            {isAdminAuthenticated ? (
              <Code2 className="w-5 h-5 stroke-[2.5]" />
            ) : (
              <Lock className="w-5 h-5 stroke-[2.5] text-amber-400" />
            )}
            <span className="text-[10px] sm:text-xs mt-0.5 leading-tight tracking-tight flex items-center gap-0.5">
              Admin
              {!isAdminAuthenticated && (
                <span className="text-[9px] text-amber-400 font-bold">🔒</span>
              )}
            </span>
          </button>
        </div>
      </nav>

      {/* Janela Flutuante (Modal) para Seleção de Graduação / Patente */}
      {showRankModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setShowRankModal(false)}
        >
          <div
            className="bg-slate-900 border border-emerald-700/60 rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-white">
                    Escolha sua Graduação / Patente
                  </h3>
                  <p className="text-[11px] text-slate-400">Polícia Militar de Pernambuco (PMPE)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRankModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 cursor-pointer transition"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {MILITARY_RANKS.map((rank) => (
                <button
                  key={rank}
                  type="button"
                  onClick={() => {
                    setSelectedRank(rank);
                    setShowRankModal(false);
                    soundFX.playSelect();
                  }}
                  className={`p-2.5 rounded-xl border text-left font-mono-num font-semibold text-xs transition cursor-pointer flex items-center justify-between ${
                    selectedRank === rank
                      ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold shadow-lg shadow-amber-950/50'
                      : 'bg-slate-950/80 hover:bg-slate-800 border-slate-800 text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <span>{rank}</span>
                  {selectedRank === rank && <Check className="w-3.5 h-3.5 text-slate-950" />}
                </button>
              ))}
            </div>

            <div className="pt-2 text-[11px] text-slate-400 text-center border-t border-slate-800">
              Graduação padrão do CAS: <strong className="text-amber-400">2º SGT PM</strong>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Autenticação do Administrador (Proteção de Código index.htm e Zeramento) */}
      {showAdminLoginModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in"
          onClick={() => setShowAdminLoginModal(false)}
        >
          <div
            className="bg-slate-900 border border-emerald-700/60 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-white">
                    Autenticação do Administrador
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {adminLoginIntent === 'standalone-export'
                      ? 'Acesso restrito à aba Código index.htm'
                      : adminLoginIntent === 'download'
                      ? 'Download restrito do arquivo index.html'
                      : 'Permissão para Zerar Dados da Turma'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAdminLoginModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 cursor-pointer transition"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Esta funcionalidade é exclusiva para o <strong>Instrutor (1º SGT PM GREGÓRIO)</strong> e coordenação do CAS da DEIP / PMPE. Digite a senha administrativa para liberar o acesso.
            </p>

            <form onSubmit={handleAdminLoginSubmit} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Senha do Administrador:
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={adminPasswordInput}
                    onChange={(e) => {
                      setAdminPasswordInput(e.target.value);
                      if (adminLoginError) setAdminLoginError(null);
                    }}
                    placeholder="Digite a senha administrativa..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    autoFocus
                  />
                  <KeyRound className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              {adminLoginError && (
                <p className="text-xs text-rose-400 font-medium flex items-center gap-1.5 bg-rose-950/40 border border-rose-800/60 p-2.5 rounded-xl">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{adminLoginError}</span>
                </p>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAdminLoginModal(false)}
                  className="min-h-[42px] px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="min-h-[42px] px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-950/50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Liberar Acesso Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação: Zerar Dados da Turma (Admin) */}
      {showAdminResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-rose-900/80 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-950 border border-rose-800/60 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-white">
                  Zerar Dados da Turma (Admin)
                </h3>
                <span className="text-[11px] text-slate-400">Ação administrativa de limpeza</span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Você tem certeza que deseja <strong>zerar todos os resultados e registros</strong> da turma?
              Esta ação removerá todas as notas salvas no navegador, deixando o aplicativo pronto para o primeiro uso oficial.
            </p>

            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] text-amber-300">
              💡 <strong>Regra Mantida:</strong> Os alunos continuarão podendo realizar o teste quantas vezes for necessário, prevalecendo sempre a última nota registrada de cada um.
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowAdminResetModal(false)}
                className="min-h-[42px] px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleAdminResetRoster(false)}
                className="min-h-[42px] px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-lg shadow-rose-950/60"
              >
                <Trash2 className="w-4 h-4" />
                Zerar Placar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast de Confirmação de Zeramento */}
      {resetSuccessToast && (
        <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 bg-emerald-950 border border-emerald-600 text-emerald-200 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Quadro da turma zerado com sucesso! Pronto para a primeira aplicação.</span>
        </div>
      )}

      {/* Modal de Compartilhamento de Patente e Escala de Classificação CAS PMPE 2026 */}
      <ShareRankModal
        isOpen={showShareModal}
        onClose={() => {
          setShowShareModal(false);
          setShareModalTarget(null);
        }}
        studentName={shareModalTarget?.name || studentName}
        registration={shareModalTarget?.registration || studentId}
        cohort={shareModalTarget?.cohort || studentCohort}
        score={shareModalTarget?.score ?? results.totalScore}
        pillarScores={shareModalTarget?.pillarScores || results.pillarPercentages}
        patentTitle={
          shareModalTarget
            ? shareModalTarget.score >= 80
              ? 'Especialista / Gestor SEI'
              : shareModalTarget.score >= 50
              ? 'Operador Prático do SEI'
              : 'Soldado Recruta do SEI'
            : results.diagnosticTier.patentTitle
        }
        intimacyLevel={
          shareModalTarget
            ? shareModalTarget.score >= 80
              ? 'Avançado / Com Intimidade'
              : shareModalTarget.score >= 50
              ? 'Intermediário / Conhecimento Básico'
              : 'Iniciante / Sem Intimidade'
            : results.diagnosticTier.intimacyLevel
        }
        tierShort={
          shareModalTarget
            ? shareModalTarget.score >= 80
              ? 'Avançado'
              : shareModalTarget.score >= 50
              ? 'Intermediário'
              : 'Iniciante'
            : results.diagnosticTier.tierShort
        }
        unlockedBadges={
          shareModalTarget
            ? shareModalTarget.history?.[shareModalTarget.history.length - 1]?.unlockedBadges || []
            : results.achievementBadges.filter((b) => b.unlocked)
        }
        history={shareModalTarget?.history || currentStudentAttempts}
      />

      {/* Modal de Histórico de Progresso do Aluno */}
      <StudentProgressModal
        isOpen={showProgressModal}
        onClose={() => {
          setShowProgressModal(false);
          setSelectedProgressStudent(null);
        }}
        student={selectedProgressStudent}
        onOpenShareModal={(s) => {
          setShareModalTarget(s);
          setShowShareModal(true);
        }}
      />

      {/* Modal Jornal Pop com a Resposta Certa e Página da Apostila DT-SEI */}
      <JornalPopModal
        isOpen={Boolean(jornalPopTarget)}
        onClose={() => setJornalPopTarget(null)}
        question={jornalPopTarget?.question || null}
        questionIndex={jornalPopTarget?.index ?? 0}
        selectedOptionIndex={jornalPopTarget?.selectedIdx}
        onOpenApostilaTab={() => setActiveTab('material-generator')}
      />

      {/* Modal de Pesquisa Indexada na Apostila (Lupa Central do Rodapé) — Remete diretamente para a Apostila no App ao clicar */}
      <ApostilaSearchIndexModal
        isOpen={showSearchIndexModal}
        onClose={() => setShowSearchIndexModal(false)}
        initialQuery={searchIndexInitialQuery}
        customChapters={
          customKnowledgeBase?.isCustom ? customKnowledgeBase.chapters : undefined
        }
        customQuestions={
          customKnowledgeBase?.isCustom ? customKnowledgeBase.questions : undefined
        }
        customPdfUrl={
          customKnowledgeBase?.isCustom ? customKnowledgeBase.pdfUrl : undefined
        }
        isCustomMaterialActive={Boolean(customKnowledgeBase?.isCustom)}
        onSelectEntryForInAppApostila={(entry) => {
          setSelectedSearchIndexEntry(entry);
          setApostilaViewMode('mobile-reader');
          setActiveTab('material-generator');
          soundFX.playSelect();
        }}
        onNavigateToApostilaTab={() => {
          setApostilaViewMode('mobile-reader');
          setActiveTab('material-generator');
          soundFX.playSelect();
        }}
        onGenerateQuestionsFromChapter={(chapterId) => {
          setGeneratorScopeMode('chapter');
          setSelectedGeneratorChapters([chapterId]);
          setApostilaViewMode('generator');
          setActiveTab('material-generator');
          soundFX.playSelect();
        }}
      />

      {/* Modal para Incluir / Regularizar Aluno Manualmente no Resultado Geral (Sincronizado no Cloud Firestore) */}
      <ManualStudentEntryModal
        isOpen={showManualStudentModal}
        onClose={() => setShowManualStudentModal(false)}
        onSaveStudent={(newStudentRecord) => {
          setClassRoster((prev) => {
            const next = sortAndDeduplicateRoster([...prev, newStudentRecord]);
            try {
              localStorage.setItem('cfoa_pmpe_roster_zeroed_v1', JSON.stringify(next));
            } catch {}
            return next;
          });
          pushStudentToCollectiveServer(newStudentRecord, 'new');
          setRecentStudentId(newStudentRecord.id);
          setRecentStudentName(newStudentRecord.name);
          setRecentActionType('new');
          setRecentActionTime(Date.now());
          setTableAnimationKey((k) => k + 1);
          soundFX.playVictory();
        }}
      />

      {/* Botão Discreto e Flutuante Convidando à Colaboração e Manutenção do App */}
      <button
        type="button"
        onClick={() => {
          markSupportModalShown();
          setShowSupportModal(true);
          soundFX.playSelect();
        }}
        title="Colaborar para manter o aplicativo CFOA PMPE no ar (Opções PIX R$ 5 / R$ 10 / R$ 15)"
        className="fixed bottom-20 right-3.5 sm:bottom-6 sm:right-6 z-40 no-print group flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-slate-950/90 hover:bg-slate-900 border border-amber-400/50 hover:border-amber-400 text-amber-200 shadow-lg shadow-slate-950/80 backdrop-blur-md transition-all duration-200 hover:scale-[1.03] active:scale-95 cursor-pointer"
      >
        <span className="w-6 h-6 rounded-full bg-amber-400/20 border border-amber-400/50 flex items-center justify-center shrink-0">
          <HeartHandshake className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
        </span>
        <span className="text-[11px] sm:text-xs font-bold tracking-tight text-slate-200 group-hover:text-amber-300">
          Colaborar · Manter App
        </span>
      </button>

      {/* Janela Pop-up de Colaboração (Exibida automaticamente apenas no 1º acesso e a cada 2 dias, ou ao clicar no botão flutuante) */}
      <SupportCampaignModal
        isOpen={showSupportModal}
        onClose={() => {
          markSupportModalShown();
          setShowSupportModal(false);
        }}
      />
    </div>
  );
}
