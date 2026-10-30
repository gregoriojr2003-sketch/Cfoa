import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  Calendar,
  Clock,
  BookOpen,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  X,
  ExternalLink,
  RotateCcw,
  Download,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';
import { CompetencyPillar } from '../data/presets';
import { APOSTILA_CHAPTERS_DATA } from '../data/apostilaChapterBank';
import { soundFX } from '../utils/soundEffects';

export interface ReviewReminderData {
  id: string;
  studentName: string;
  studentRank?: string;
  cohort: string;
  completedAtMs: number;
  scheduledForMs: number;
  lowestPillar: CompetencyPillar;
  lowestScorePct: number;
  chapterId: string;
  chapterNumber: string;
  chapterTitle: string;
  pages: string;
  normativeBase: string;
  summaryHint: string;
  keyRule: string;
  dismissed: boolean;
  notifiedBrowser?: boolean;
}

const STORAGE_KEY = 'sei_cas_review_reminder_v1';

export interface PillarRecommendation {
  pillar: CompetencyPillar;
  chapterId: string;
  chapterNumber: string;
  chapterTitle: string;
  pages: string;
  normativeBase: string;
  summaryHint: string;
  keyRule: string;
}

export const PILLAR_RECOMMENDATIONS: Record<CompetencyPillar, PillarRecommendation> = {
  'Legislação PM & Regime Disciplinar': {
    pillar: 'Legislação PM & Regime Disciplinar',
    chapterId: 'cap-10',
    chapterNumber: 'Módulos 09, 10 e 11',
    chapterTitle: 'Estatuto (Lei 6.783/74), Código Disciplinar (Lei 11.817/00) e Conselhos (Dec. 3.639/75 e Lei 5.836/72)',
    pages: 'Edital Bloco II · ALEPE',
    normativeBase: 'Legislação Estadual de PE (ALEPE: https://legis.alepe.pe.gov.br/)',
    summaryHint:
      'Revisão obrigatória das transgressões disciplinares (leves, médias e graves), sanções, agregação, Conselho de Disciplina para praças estáveis e Conselho de Justificação para oficiais.',
    keyRule:
      'Conselho de Disciplina julga Praças Estáveis da PMPE (3 oficiais); Conselho de Justificação julga Oficiais (nomeado pelo Governador). Advertência não é publicada ostensivamente em boletim.',
  },
  'Direito Penal & Processual Militar': {
    pillar: 'Direito Penal & Processual Militar',
    chapterId: 'cap-4',
    chapterNumber: 'Módulos 04, 05 e 06',
    chapterTitle: 'CPM (Art. 9º, Excludentes e Crimes em Espécie), CPPM (IPM e APFD) e Crimes por Extensão',
    pages: 'Edital Bloco II · CPM e CPPM',
    normativeBase: 'Decreto-Lei nº 1.001/1969 · Decreto-Lei nº 1.002/1969 · Lei nº 13.869/2019',
    summaryHint:
      'Prazos do IPM (20 dias preso, 40 solto prorrogáveis por 20). Abuso de Autoridade (Lei 13.869/19) exige elemento subjetivo específico. Crimes militares por extensão são julgados na Justiça Militar Estadual.',
    keyRule:
      'Ordem manifestamente criminosa não deve ser cumprida: a obediência cega não isenta de responsabilidade penal militar.',
  },
  'Direito Constitucional & Administrativo': {
    pillar: 'Direito Constitucional & Administrativo',
    chapterId: 'cap-8',
    chapterNumber: 'Módulos 07 e 08',
    chapterTitle: 'CF/88 (Arts. 5º, 37, 42 e 144), Atos Administrativos e Licitações (Lei 14.133/2021)',
    pages: 'Edital Bloco II · CF/88 e Lei 14.133',
    normativeBase: 'Constituição Federal de 1988 · Lei Federal nº 14.133/2021',
    summaryHint:
      'Vedação expressa de greve, sindicalização e filiação partidária ativa aos militares. Elementos do Ato (COFIFOMO) e atributos (PATI). Modalidades licitatórias: pregão, concorrência, concurso, leilão e diálogo competitivo.',
    keyRule:
      'O princípio da segregação de funções impede que o mesmo servidor atue simultaneamente na elaboração do termo de referência e na fiscalização/liquidação da despesa.',
  },
  'Administração & Conhecimentos Gerais': {
    pillar: 'Administração & Conhecimentos Gerais',
    chapterId: 'cap-3',
    chapterNumber: 'Módulos 01, 02, 03 e 12',
    chapterTitle: 'Noções de Administração (Linha/Staff), Português/Redação Oficial, Raciocínio Lógico e Direitos Humanos',
    pages: 'Edital Bloco I e Bloco II (DH)',
    normativeBase: 'Teoria Geral da Administração · Manual de Redação Oficial · DUDH (1948)',
    summaryHint:
      'Órgãos de Linha detêm comando direto sobre a missão fim; Assessoria (Staff) presta suporte técnico especializado sem autoridade direta sobre a tropa. Pronome Vossa Excelência para Comandante Geral.',
    keyRule:
      'Redação oficial militar exige impessoalidade e padrão culto. Negação lógica de "Todo A é B" é "Algum A não é B". Convenção PcD possui status de Emenda Constitucional.',
  },
};

export function getLowestPillar(
  pillarScores: Record<CompetencyPillar, number>
): { pillar: CompetencyPillar; score: number } {
  const pillars: CompetencyPillar[] = [
    'Legislação PM & Regime Disciplinar',
    'Direito Penal & Processual Militar',
    'Direito Constitucional & Administrativo',
    'Administração & Conhecimentos Gerais',
  ];

  let lowestPillar = pillars[0];
  let minScore = 999;

  for (const p of pillars) {
    const sc = pillarScores[p] ?? 100;
    if (sc < minScore) {
      minScore = sc;
      lowestPillar = p;
    }
  }

  return { pillar: lowestPillar, score: minScore === 999 ? 100 : minScore };
}

export function buildReminderData(params: {
  studentName: string;
  studentRank?: string;
  cohort: string;
  pillarScores: Record<CompetencyPillar, number>;
  completedAtMs?: number;
}): ReviewReminderData {
  const completedAt = params.completedAtMs || Date.now();
  const scheduledFor = completedAt + 24 * 60 * 60 * 1000;
  const { pillar, score } = getLowestPillar(params.pillarScores);
  const rec = PILLAR_RECOMMENDATIONS[pillar];

  return {
    id: `reminder-${completedAt}`,
    studentName: params.studentName || 'Militar Avaliado',
    studentRank: params.studentRank,
    cohort: params.cohort || 'CAS PMPE 2026',
    completedAtMs: completedAt,
    scheduledForMs: scheduledFor,
    lowestPillar: pillar,
    lowestScorePct: score,
    chapterId: rec.chapterId,
    chapterNumber: rec.chapterNumber,
    chapterTitle: rec.chapterTitle,
    pages: rec.pages,
    normativeBase: rec.normativeBase,
    summaryHint: rec.summaryHint,
    keyRule: rec.keyRule,
    dismissed: false,
    notifiedBrowser: false,
  };
}

export function saveReminderToStorage(reminder: ReviewReminderData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reminder));
  } catch {
    // Storage might be disabled in private browsing
  }
}

export function getReminderFromStorage(): ReviewReminderData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearReminderFromStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}

interface ReviewReminderNotificationProps {
  pillarScores: Record<CompetencyPillar, number>;
  studentName: string;
  studentCohort: string;
  onOpenApostilaChapter: (chapterId: string) => void;
  onRetryQuizWithPillar?: (pillar: CompetencyPillar) => void;
  isResultsScreen?: boolean;
}

export const ReviewReminderNotification: React.FC<ReviewReminderNotificationProps> = ({
  pillarScores,
  studentName,
  studentCohort,
  onOpenApostilaChapter,
  onRetryQuizWithPillar,
  isResultsScreen = false,
}) => {
  const [activeReminder, setActiveReminder] = useState<ReviewReminderData | null>(null);
  const [isDue, setIsDue] = useState<boolean>(false);
  const [browserPerm, setBrowserPerm] = useState<NotificationPermission>('default');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSimulatedActive, setIsSimulatedActive] = useState<boolean>(false);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);

  // Carregar e sincronizar estado do lembrete ao montar e atualizar
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setBrowserPerm(Notification.permission);
    }

    let stored = getReminderFromStorage();

    // Se estiver na tela de resultados, sempre calcula e atualiza o lembrete de 24h para esta sessão
    if (isResultsScreen) {
      const freshReminder = buildReminderData({
        studentName,
        cohort: studentCohort,
        pillarScores,
      });
      saveReminderToStorage(freshReminder);
      setActiveReminder(freshReminder);
      stored = freshReminder;
    } else if (stored) {
      setActiveReminder(stored);
    }

    // Checar se já completou as 24 horas
    const checkDue = () => {
      const current = getReminderFromStorage();
      if (current && !current.dismissed) {
        const now = Date.now();
        const due = now >= current.scheduledForMs;
        setIsDue(due);

        // Se chegou nas 24h e ainda não notificou o navegador, emite a notificação nativa
        if (
          due &&
          !current.notifiedBrowser &&
          typeof window !== 'undefined' &&
          'Notification' in window &&
          Notification.permission === 'granted'
        ) {
          triggerBrowserNotification(current);
          current.notifiedBrowser = true;
          saveReminderToStorage(current);
        }
      } else {
        setIsDue(false);
      }
    };

    checkDue();
    const interval = setInterval(checkDue, 15000);
    return () => clearInterval(interval);
  }, [isResultsScreen, pillarScores, studentName, studentCohort]);

  const triggerBrowserNotification = (data: ReviewReminderData) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    try {
      const n = new Notification('CAS PMPE 2026 · Hora de Revisar o SEI (24h)!', {
        body: `Sargento ${data.studentName}, seu pilar com menor nota foi "${data.lowestPillar}" (${data.lowestScorePct}%). Revise o ${data.chapterNumber} da Apostila DT-SEI (${data.pages})!`,
        icon: '/favicon.ico',
        tag: 'cas-pmpe-24h-review',
      });
      n.onclick = () => {
        window.focus();
        onOpenApostilaChapter(data.chapterId);
      };
    } catch {
      // Ignore notification creation errors
    }
  };

  const handleRequestBrowserPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setToastMessage('Seu navegador não oferece suporte nativo à API de Notificações.');
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }

    try {
      const perm = await Notification.requestPermission();
      setBrowserPerm(perm);
      if (perm === 'granted') {
        soundFX.playCorrect();
        setToastMessage('Notificações no navegador ativadas com sucesso! Você receberá o alerta em 24h.');
        if (activeReminder) {
          triggerBrowserNotification({
            ...activeReminder,
            summaryHint: 'Notificação de teste autorizada!',
          });
        }
      } else if (perm === 'denied') {
        soundFX.playWrong();
        setToastMessage('Permissão de notificação negada no navegador. Use o botão de Agenda (.ics) para receber no celular.');
      }
      setTimeout(() => setToastMessage(null), 5000);
    } catch {
      setToastMessage('Não foi possível registrar permissão de notificação.');
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handleSimulateNotificationNow = () => {
    if (!activeReminder) return;
    soundFX.playNotification();
    setIsSimulatedActive(true);
    setIsDue(true);
    setToastMessage('Alerta de 24 horas simulado com sucesso na tela!');
    setTimeout(() => setToastMessage(null), 4000);

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      triggerBrowserNotification(activeReminder);
    }
  };

  const handleDismissReminder = () => {
    if (activeReminder) {
      const updated = { ...activeReminder, dismissed: true };
      setActiveReminder(updated);
      saveReminderToStorage(updated);
    }
    setIsDue(false);
    setIsSimulatedActive(false);
    soundFX.playSelect();
  };

  // Gerar e baixar arquivo .ICS de calendário para celulares (Android e iPhone)
  const handleDownloadCalendarIcs = () => {
    if (!activeReminder) return;

    const startDate = new Date(activeReminder.scheduledForMs);
    const endDate = new Date(activeReminder.scheduledForMs + 45 * 60 * 1000); // 45 min study session

    const formatDateIcs = (date: Date) => {
      return date
        .toISOString()
        .replace(/[-:]/g, '')
        .split('.')[0] + 'Z';
    };

    const title = `[CAS PMPE 2026] Revisão Tática DT-SEI: ${activeReminder.lowestPillar}`;
    const desc = `Sessão de reforço de 24h recomendada pelo Instrutor 1º SGT PM Gregório.\\n\\n` +
      `Pilar de menor rendimento no diagnóstico: ${activeReminder.lowestPillar} (${activeReminder.lowestScorePct}% de aproveitamento).\\n\\n` +
      `Tópico recomendado da Apostila Oficial DT-SEI: ${activeReminder.chapterTitle} (${activeReminder.pages}).\\n\\n` +
      `Diretriz técnica:\\n${activeReminder.keyRule}\\n\\n` +
      `Base Normativa: ${activeReminder.normativeBase}`;

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//CAS PMPE 2026//DT-SEI 24h Review//PT-BR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:sei-review-${activeReminder.completedAtMs}@pmpe.pe.gov.br`,
      `DTSTAMP:${formatDateIcs(new Date())}`,
      `DTSTART:${formatDateIcs(startDate)}`,
      `DTEND:${formatDateIcs(endDate)}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${desc}`,
      'LOCATION:Ambiente SEI-PE (Apostila DT-SEI)',
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-PT15M',
      'ACTION:DISPLAY',
      'DESCRIPTION:Lembrete de Estudo DT-SEI CAS 2026',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Lembrete-Revisao-24h-DTSEI-${activeReminder.lowestPillar.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    soundFX.playSelect();
    setToastMessage('Arquivo de Agenda (.ics) baixado! Abra-o no celular para sincronizar o alarme de 24h.');
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Link direto para adicionar no Google Agenda com 1 toque
  const getGoogleCalendarUrl = () => {
    if (!activeReminder) return '#';
    const startDate = new Date(activeReminder.scheduledForMs);
    const endDate = new Date(activeReminder.scheduledForMs + 45 * 60 * 1000);

    const formatGCal = (date: Date) =>
      date
        .toISOString()
        .replace(/[-:]/g, '')
        .split('.')[0] + 'Z';

    const title = encodeURIComponent(`[CAS PMPE 2026] Revisão DT-SEI: ${activeReminder.lowestPillar}`);
    const details = encodeURIComponent(
      `Sessão de reforço de 24h recomendada pelo Instrutor 1º SGT PM Gregório.\n\n` +
        `Pilar de menor rendimento: ${activeReminder.lowestPillar} (${activeReminder.lowestScorePct}%).\n\n` +
        `Capítulo e Páginas da Apostila: ${activeReminder.chapterTitle} (${activeReminder.pages}).\n\n` +
        `Ponto-chave: ${activeReminder.keyRule}`
    );
    const location = encodeURIComponent('Apostila DT-SEI · CAS PMPE 2026');

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatGCal(
      startDate
    )}/${formatGCal(endDate)}&details=${details}&location=${location}`;
  };

  const reminder = activeReminder || buildReminderData({
    studentName,
    cohort: studentCohort,
    pillarScores,
  });

  const scheduledDateStr = new Date(reminder.scheduledForMs).toLocaleDateString('pt-BR');
  const scheduledTimeStr = new Date(reminder.scheduledForMs).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. FLOATING TOAST / BANNER QUANDO AS 24 HORAS SE COMPLETAREM (OU SIMULADO) */}
      {/* ========================================================================= */}
      {(isDue || isSimulatedActive) && !reminder.dismissed && (
        <aside
          role="region"
          aria-label="Alerta de Revisão Tática em 24 horas"
          className="fixed top-3 left-3 right-3 sm:left-auto sm:right-6 sm:top-20 z-50 max-w-lg bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/90 border-2 border-amber-400 rounded-2xl shadow-2xl p-4 sm:p-5 animate-in slide-in-from-top-4 duration-300 backdrop-blur-md"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
              </span>
              <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-300">
                <BellRing className="w-4 h-4 text-amber-400 animate-bounce" />
                <span>Alerta de Revisão Tática (24h Pós-Desafio)</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDismissReminder}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              title="Dispensar lembrete"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-2.5 space-y-2">
            <p className="text-xs sm:text-sm font-bold text-white leading-snug">
              Sargento {reminder.studentName}, passaram-se 24 horas desde sua missão!
            </p>
            <p className="text-xs text-slate-300 leading-relaxed">
              Seu pilar com menor aproveitamento foi{' '}
              <strong className="text-amber-300 underline underline-offset-2">
                {reminder.lowestPillar} ({reminder.lowestScorePct}%)
              </strong>
              . Para aplicar o método militar de curva de retenção de 24h, revise agora o tópico oficial:
            </p>

            <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-xs space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-black text-emerald-400">{reminder.chapterNumber}</span>
                <span className="font-mono-num text-[11px] px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-bold border border-slate-700">
                  {reminder.pages}
                </span>
              </div>
              <h4 className="font-bold text-white text-xs sm:text-sm leading-snug">
                {reminder.chapterTitle}
              </h4>
              <p className="text-[11px] text-slate-300 leading-normal">
                {reminder.summaryHint}
              </p>
            </div>
          </div>

          <div className="mt-3.5 pt-3 border-t border-slate-800/90 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                onOpenApostilaChapter(reminder.chapterId);
                soundFX.playSelect();
              }}
              className="flex-1 sm:flex-initial min-h-[42px] px-4 py-2 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <BookOpen className="w-4 h-4 stroke-[2.5]" />
              <span>Abrir Este Tópico na Apostila</span>
            </button>

            {onRetryQuizWithPillar && (
              <button
                type="button"
                onClick={() => {
                  onRetryQuizWithPillar(reminder.lowestPillar);
                  handleDismissReminder();
                }}
                className="flex-1 sm:flex-initial min-h-[42px] px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Refazer Quiz deste Pilar</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDismissReminder}
              className="min-h-[42px] px-3 py-2 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-xl hover:bg-slate-800 transition cursor-pointer"
            >
              Lembrar mais tarde
            </button>
          </div>
        </aside>
      )}

      {/* ========================================================================= */}
      {/* 2. CARD DEDICADO NA TELA 3 (RESULTADOS): AGENDAMENTO E GERENCIAMENTO 24H */}
      {/* ========================================================================= */}
      {isResultsScreen && (
        <section className="bg-gradient-to-br from-slate-900/95 via-slate-900 to-slate-950 border-2 border-emerald-500/60 rounded-2xl p-5 sm:p-7 shadow-2xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/50 flex items-center justify-center shrink-0 text-amber-300 mt-0.5">
                <Bell className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-400">
                    Curva de Fixação Tática · Metodologia CAS 2026
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono-num font-bold border border-emerald-500/40">
                    Ciclo 24 Horas Ativo
                  </span>
                </div>
                <h3 className="font-display text-lg sm:text-xl font-bold text-white mt-0.5">
                  Lembrete Programado de Revisão da Apostila (24h Pós-Desafio)
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSimulateNotificationNow}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/40 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0"
              title="Testa imediatamente a notificação e o banner de 24h sem precisar esperar um dia inteiro"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simular Lembrete de 24h Agora</span>
            </button>
          </div>

          {/* Racional Diagnóstico: Pilar Crítico + Módulo da Apostila */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
            {/* Box 1: Diagnóstico do Pilar com Menor Pontuação */}
            <div className="md:col-span-5 p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between gap-3">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Pilar com Menor Aproveitamento no Desafio:
                </span>
                <div className="flex items-baseline justify-between mt-1">
                  <h4 className="text-base font-black text-amber-300">
                    {reminder.lowestPillar}
                  </h4>
                  <span className="font-mono-num text-sm font-bold text-rose-400">
                    {reminder.lowestScorePct}% de acerto
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Para que a pontuação se consolide e se transforme em competência na rotina operacional da OME, a doutrina preconiza o reforço direcionado exatamente <strong>24 horas após o primeiro contato avaliativo</strong>.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  Agendado para:
                </span>
                <strong className="text-slate-200 font-mono-num">
                  {scheduledDateStr} às {scheduledTimeStr}
                </strong>
              </div>
            </div>

            {/* Box 2: Tópico e Páginas Recomendadas da Apostila DT-SEI */}
            <div className="md:col-span-7 p-4 sm:p-5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 flex flex-col justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                    Tópico Oficial da Apostila DT-SEI para Revisar:
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-200 text-xs font-mono-num font-bold border border-emerald-500/40">
                    {reminder.pages}
                  </span>
                </div>
                <h4 className="text-sm sm:text-base font-bold text-white leading-snug">
                  {reminder.chapterTitle}
                </h4>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  {reminder.summaryHint}
                </p>
                <div className="mt-2.5 p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px] text-amber-200 leading-snug">
                  <strong className="text-amber-300 block mb-0.5">Diretriz da Apostila:</strong>
                  {reminder.keyRule}
                </div>
              </div>

              <div className="pt-3 border-t border-emerald-900/40 flex flex-wrap items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    onOpenApostilaChapter(reminder.chapterId);
                    soundFX.playSelect();
                  }}
                  className="min-h-[42px] px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Estudar Este Capítulo Agora na Apostila</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowDetailModal(true)}
                  className="text-xs text-amber-300 hover:text-amber-200 font-semibold flex items-center gap-1 cursor-pointer transition"
                >
                  <span>Ver Detalhes do Agendamento</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Opções de Ativação do Lembrete: Navegador + Agenda de Celular (Google / .ICS) */}
          <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span>Como deseja ser notificado no seu celular ou computador?</span>
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Você pode autorizar notificações do navegador ou sincronizar com sua agenda (Google Agenda ou arquivo .ics) para tocar no celular amanhã às {scheduledTimeStr}.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {/* Notificação Web */}
              <button
                type="button"
                onClick={handleRequestBrowserPermission}
                className={`min-h-[42px] px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  browserPerm === 'granted'
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                    : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200'
                }`}
              >
                <BellRing className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {browserPerm === 'granted'
                    ? '✓ Notificações Web Ativas'
                    : 'Ativar Notificação do Navegador'}
                </span>
              </button>

              {/* Adicionar ao Google Agenda */}
              <a
                href={getGoogleCalendarUrl()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => soundFX.playSelect()}
                className="min-h-[42px] px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <span>Adicionar ao Google Agenda</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>

              {/* Baixar arquivo .ICS para celular */}
              <button
                type="button"
                onClick={handleDownloadCalendarIcs}
                className="min-h-[42px] px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar Lembrete (.ics celular)</span>
              </button>
            </div>
          </div>

          {toastMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* 3. MODAL DE DETALHES DO LEMBRETE TÁTICO DE 24 HORAS */}
      {/* ========================================================================= */}
      {showDetailModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in"
        >
          <div className="w-full max-w-lg bg-slate-900 border-2 border-emerald-500/60 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-white">
                    Detalhes do Lembrete de Revisão em 24h
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    CAS PMPE 2026 · Disciplina DT-SEI (DEIP)
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Militar Avaliado:</span>
                <p className="font-bold text-white text-sm">{reminder.studentName}</p>
                <p className="text-slate-400">{reminder.cohort}</p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Pilar Avaliado:</span>
                  <span className="font-bold text-amber-300 text-xs block mt-0.5">{reminder.lowestPillar}</span>
                  <span className="text-[11px] font-mono-num text-rose-400 font-bold">{reminder.lowestScorePct}% de acerto</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Alerta Programado:</span>
                  <span className="font-bold text-white text-xs block mt-0.5">{scheduledDateStr}</span>
                  <span className="text-[11px] font-mono-num text-cyan-400 font-bold">{scheduledTimeStr} (em 24h)</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-1">
                <span className="text-[10px] uppercase font-black text-emerald-400">Capítulo Designado:</span>
                <p className="font-bold text-white text-xs">{reminder.chapterTitle}</p>
                <p className="text-[11px] font-mono-num text-amber-300 font-bold">{reminder.pages}</p>
                <p className="text-[11px] text-slate-300 mt-1">{reminder.summaryHint}</p>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-[11px] leading-relaxed">
                <strong className="block text-amber-300 font-bold uppercase mb-0.5">Norma Aplicável:</strong>
                {reminder.normativeBase}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowDetailModal(false);
                  onOpenApostilaChapter(reminder.chapterId);
                }}
                className="flex-1 min-h-[42px] px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>Abrir Tópico na Apostila</span>
              </button>

              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="min-h-[42px] px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
