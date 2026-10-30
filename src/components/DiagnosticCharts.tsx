import React, { useEffect, useRef, useMemo, useState } from 'react';
import {
  Chart,
  RadarController,
  RadialLinearScale,
  PointElement,
  LineElement,
  LineController,
  Filler,
  BarController,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import {
  COMPETENCY_PILLARS,
  CompetencyPillar,
  ClassStudentRecord,
} from '../data/presets';
import { Crown, Users, TrendingUp, BarChart3, Trophy, Clock } from 'lucide-react';

Chart.register(
  RadarController,
  RadialLinearScale,
  PointElement,
  LineElement,
  LineController,
  Filler,
  BarController,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
);

export type CohortCategory = 'Turma 01' | 'Turma 02' | 'Visitantes';

export function normalizeCohortCategory(cohort?: string, _isInst = false): CohortCategory {
  const c = (cohort || '').trim();
  if (
    c.includes('Visitante') ||
    c.includes('Outr') ||
    c.startsWith('D') ||
    c.startsWith('C') ||
    c.includes('COMANDO') ||
    c.includes('EMG') ||
    c === 'ACG' ||
    c === 'AECI' ||
    c === 'AG'
  ) {
    if (!c.includes('CIPM') && !c.includes('CIPCães') && !c.includes('CIPMoto')) {
      return 'Visitantes';
    }
  }
  if (
    c.includes('Turma 02') ||
    c.includes('Bravo') ||
    c.includes('BIEsp') ||
    c.includes('BOPE') ||
    c.includes('BEPI') ||
    c.includes('BP') ||
    c.includes('RPMon') ||
    c.includes('CIPMoto') ||
    c.includes('CIPCães')
  ) {
    return 'Turma 02';
  }
  return 'Turma 01';
}

export function getCohortShortTag(category: CohortCategory): string {
  switch (category) {
    case 'Turma 01':
      return 'T01';
    case 'Turma 02':
      return 'T02';
    case 'Visitantes':
      return 'VIS';
  }
}

interface DiagnosticChartsProps {
  pillarScores: Record<CompetencyPillar, number>;
  totalScore: number;
  studentName: string;
  classRoster: ClassStudentRecord[];
}

export const DiagnosticCharts: React.FC<DiagnosticChartsProps> = ({
  pillarScores: pillarPercentages,
  totalScore: studentScore,
  studentName,
  classRoster,
}) => {
  const radarCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cohortCompareCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const classDistCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const classRankingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lapsoTimelineCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const radarChartRef = useRef<Chart | null>(null);
  const cohortCompareChartRef = useRef<Chart | null>(null);
  const classDistChartRef = useRef<Chart | null>(null);
  const classRankingChartRef = useRef<Chart | null>(null);
  const lapsoTimelineChartRef = useRef<Chart | null>(null);

  const [rankingFilter, setRankingFilter] = useState<'ALL' | CohortCategory>('ALL');
  const [timelineViewMode, setTimelineViewMode] = useState<'EXACT_TIME' | 'HOURLY'>('EXACT_TIME');

  const isInstructor = (_s: ClassStudentRecord) => false;

  // Métricas analíticas por opção: Turma 01, Turma 02 e Visitantes
  const cohortMetrics = useMemo(() => {
    const t1Students = classRoster.filter(
      (s) => normalizeCohortCategory(s.cohort, isInstructor(s)) === 'Turma 01'
    );
    const t2Students = classRoster.filter(
      (s) => normalizeCohortCategory(s.cohort, isInstructor(s)) === 'Turma 02'
    );
    const visitantesStudents = classRoster.filter(
      (s) => normalizeCohortCategory(s.cohort, isInstructor(s)) === 'Visitantes'
    );

    const calcAvg = (list: ClassStudentRecord[]) =>
      list.length > 0
        ? Math.round(list.reduce((acc, s) => acc + s.score, 0) / list.length)
        : 0;

    const calcInitialAvg = (list: ClassStudentRecord[]) =>
      list.length > 0
        ? Math.round(
            list.reduce((acc, s) => acc + (s.history?.[0]?.score ?? s.score), 0) /
              list.length
          )
        : 0;

    const calcPillarAvgs = (list: ClassStudentRecord[]): Record<CompetencyPillar, number> => {
      const res = {} as Record<CompetencyPillar, number>;
      COMPETENCY_PILLARS.forEach((p) => {
        if (list.length === 0) {
          res[p] = 0;
        } else {
          const sum = list.reduce(
            (acc, s) => acc + (s.pillarScores?.[p] ?? s.score),
            0
          );
          res[p] = Math.round(sum / list.length);
        }
      });
      return res;
    };

    const countTiers = (list: ClassStudentRecord[]) => [
      list.filter((s) => s.score <= 49).length,
      list.filter((s) => s.score >= 50 && s.score <= 79).length,
      list.filter((s) => s.score >= 80).length,
    ];

    const buildGroupStats = (list: ClassStudentRecord[]) => {
      const avg = calcAvg(list);
      const initialAvg = calcInitialAvg(list);
      return {
        count: list.length,
        avg,
        initialAvg,
        gain: avg - initialAvg,
        pillarAvgs: calcPillarAvgs(list),
        tiers: countTiers(list),
        completedCount: list.filter((s) => s.status !== 'Em Missão').length,
        inMissionCount: list.filter((s) => s.status === 'Em Missão').length,
      };
    };

    // Lapso Temporal Horário
    const baseHourBuckets = ['13h', '14h', '15h', '16h', '17h', '18h'];
    const dynamicHourSet = new Set<string>(baseHourBuckets);

    classRoster.forEach((s) => {
      const rawTime = s.completedAt || s.enrolledAt || '14:00';
      const hourPart = rawTime.split(':')[0]?.trim();
      if (hourPart && /^\d{1,2}$/.test(hourPart)) {
        dynamicHourSet.add(`${hourPart.padStart(2, '0')}h`);
      }
      s.history?.forEach((h) => {
        const hPart = h.completedAt?.split(':')[0]?.trim();
        if (hPart && /^\d{1,2}$/.test(hPart)) {
          dynamicHourSet.add(`${hPart.padStart(2, '0')}h`);
        }
      });
    });

    const sortedHours = Array.from(dynamicHourSet).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true })
    );

    const calcHourlyStats = (list: ClassStudentRecord[], hourLabel: string) => {
      const prefix = hourLabel.replace('h', '');
      const matched = list.filter((s) => {
        const t = (s.completedAt || s.enrolledAt || '').trim();
        return t.startsWith(`${prefix}:`) || t.startsWith(`${Number(prefix)}:`);
      });
      const avgScore =
        matched.length > 0
          ? Math.round(matched.reduce((a, b) => a + b.score, 0) / matched.length)
          : null;
      return {
        count: matched.length,
        avgScore,
        names: matched.map((m) => m.name),
      };
    };

    const hourlyT1 = sortedHours.map((h) => calcHourlyStats(t1Students, h));
    const hourlyT2 = sortedHours.map((h) => calcHourlyStats(t2Students, h));
    const hourlyVis = sortedHours.map((h) => calcHourlyStats(visitantesStudents, h));
    const hourlyTotalCounts = sortedHours.map(
      (_, i) =>
        hourlyT1[i].count +
        hourlyT2[i].count +
        hourlyVis[i].count
    );

    // Eventos exatos HH:MM
    interface ExactAccessEvent {
      time: string;
      minutesOfDay: number;
      studentName: string;
      shortName: string;
      registration: string;
      cohort: string;
      category: CohortCategory;
      score: number;
      attemptNumber: number;
      isInitial: boolean;
      status: string;
    }

    const parseMinutes = (hhmm: string): number => {
      const clean = (hhmm || '14:00').trim();
      const parts = clean.split(':');
      const hh = parseInt(parts[0] || '14', 10);
      const mm = parseInt(parts[1] || '0', 10);
      return (isNaN(hh) ? 14 : hh) * 60 + (isNaN(mm) ? 0 : mm);
    };

    const exactEvents: ExactAccessEvent[] = [];

    classRoster.forEach((s) => {
      const shortName = s.name
        .replace(/^(1º|2º|3º)\s+SGT\s+PM\s+/i, 'SGT ')
        .replace(/^SUBTEN\s+PM\s+/i, 'ST ')
        .replace(/^CB\s+PM\s+/i, 'CB ')
        .replace(/^SD\s+PM\s+/i, 'SD ');
      const category = normalizeCohortCategory(s.cohort, isInstructor(s));

      if (s.history && s.history.length > 0) {
        s.history.forEach((h, idx) => {
          const t = (h.completedAt || s.completedAt || s.enrolledAt || '14:00').trim();
          exactEvents.push({
            time: t,
            minutesOfDay: parseMinutes(t),
            studentName: s.name,
            shortName,
            registration: s.registration,
            cohort: s.cohort,
            category,
            score: h.score,
            attemptNumber: h.attemptNumber || idx + 1,
            isInitial: idx === 0,
            status: s.status || 'Concluído',
          });
        });
      } else {
        const t = (s.completedAt || s.enrolledAt || '14:00').trim();
        exactEvents.push({
          time: t,
          minutesOfDay: parseMinutes(t),
          studentName: s.name,
          shortName,
          registration: s.registration,
          cohort: s.cohort,
          category,
          score: s.score,
          attemptNumber: s.attemptsCount || 1,
          isInitial: true,
          status: s.status || 'Concluído',
        });
      }
    });

    exactEvents.sort((a, b) => {
      if (a.minutesOfDay !== b.minutesOfDay) return a.minutesOfDay - b.minutesOfDay;
      return a.studentName.localeCompare(b.studentName);
    });

    let runningSum = 0;
    const cumulativeAvgSeries = exactEvents.map((ev, idx) => {
      runningSum += ev.score;
      return Math.round(runningSum / (idx + 1));
    });

    return {
      t1: buildGroupStats(t1Students),
      t2: buildGroupStats(t2Students),
      visitantes: buildGroupStats(visitantesStudents),
      lapsoHourly: {
        hours: sortedHours,
        t1: hourlyT1,
        t2: hourlyT2,
        visitantes: hourlyVis,
        totalCounts: hourlyTotalCounts,
      },
      exactTimeline: {
        events: exactEvents,
        cumulativeAvgSeries,
      },
    };
  }, [classRoster]);

  // Ordenação geral por maior pontuação (todos os candidatos em igualdade de condições)
  const filteredStudents = useMemo(() => {
    const sorted = [...classRoster].sort((a, b) => b.score - a.score);

    if (rankingFilter === 'ALL') return sorted;
    return sorted.filter(
      (s) => normalizeCohortCategory(s.cohort, false) === rankingFilter
    );
  }, [classRoster, rankingFilter]);

  useEffect(() => {
    const textColor = '#cbd5e1';
    const gridColor = 'rgba(148, 163, 184, 0.16)';

    // ========================================================================
    // GRÁFICO 0: LINHA DO TEMPO COM HORÁRIO REAL DE ACESSO (4 OPÇÕES)
    // ========================================================================
    if (lapsoTimelineCanvasRef.current) {
      if (lapsoTimelineChartRef.current) lapsoTimelineChartRef.current.destroy();
      const ctx = lapsoTimelineCanvasRef.current.getContext('2d');
      if (ctx) {
        if (timelineViewMode === 'EXACT_TIME') {
          const events = cohortMetrics.exactTimeline.events;
          const labels = events.map((ev) => {
            const surname = ev.shortName.split(' ').slice(-1)[0] || ev.shortName;
            const tryTag = ev.attemptNumber > 1 ? ` (${ev.attemptNumber}ªx)` : '';
            return `🕒 ${ev.time} · ${surname}${tryTag}`;
          });

          lapsoTimelineChartRef.current = new Chart(ctx, {
            type: 'bar',
            data: {
              labels,
              datasets: [
                {
                  type: 'bar',
                  label: 'Turma 01',
                  data: events.map((ev) =>
                    ev.category === 'Turma 01' ? ev.score : null
                  ),
                  backgroundColor: 'rgba(16, 185, 129, 0.88)',
                  borderColor: '#10b981',
                  borderWidth: 1.5,
                  borderRadius: 6,
                  yAxisID: 'yScore',
                },
                {
                  type: 'bar',
                  label: 'Turma 02',
                  data: events.map((ev) =>
                    ev.category === 'Turma 02' ? ev.score : null
                  ),
                  backgroundColor: 'rgba(56, 189, 248, 0.88)',
                  borderColor: '#38bdf8',
                  borderWidth: 1.5,
                  borderRadius: 6,
                  yAxisID: 'yScore',
                },
                {
                  type: 'bar',
                  label: 'Visitantes',
                  data: events.map((ev) =>
                    ev.category === 'Visitantes' ? ev.score : null
                  ),
                  backgroundColor: 'rgba(167, 139, 250, 0.88)',
                  borderColor: '#a78bfa',
                  borderWidth: 1.5,
                  borderRadius: 6,
                  yAxisID: 'yScore',
                },
                {
                  type: 'line',
                  label: 'Média Acumulada no Horário',
                  data: cohortMetrics.exactTimeline.cumulativeAvgSeries,
                  borderColor: '#fde047',
                  backgroundColor: 'rgba(253, 224, 71, 0.15)',
                  borderWidth: 2.5,
                  pointBackgroundColor: '#fde047',
                  pointBorderColor: '#0f172a',
                  pointRadius: 4,
                  tension: 0.3,
                  fill: false,
                  yAxisID: 'yScore',
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              interaction: { mode: 'index', intersect: false },
              scales: {
                yScore: {
                  type: 'linear',
                  position: 'left',
                  beginAtZero: true,
                  max: 100,
                  grid: { color: gridColor },
                  ticks: {
                    color: textColor,
                    stepSize: 20,
                    callback: (val) => `${val} pts`,
                  },
                  title: {
                    display: true,
                    text: 'Nota Obtida no Horário Real (0–100 pts)',
                    color: '#10b981',
                    font: { size: 11, weight: 'bold' },
                  },
                },
                x: {
                  stacked: true,
                  grid: { display: false },
                  ticks: {
                    color: '#f8fafc',
                    maxRotation: 45,
                    minRotation: 30,
                    font: {
                      family: "'JetBrains Mono', monospace",
                      size: 10,
                      weight: 'bold',
                    },
                  },
                },
              },
              plugins: {
                legend: {
                  position: 'top',
                  labels: { color: textColor, boxWidth: 12, font: { size: 11 } },
                },
                tooltip: {
                  backgroundColor: '#0f172a',
                  titleColor: '#fbbf24',
                  bodyColor: '#f8fafc',
                  borderColor: '#334155',
                  borderWidth: 1,
                  callbacks: {
                    title: (items) => {
                      const idx = items[0]?.dataIndex ?? 0;
                      const ev = events[idx];
                      if (!ev) return '';
                      return `🕒 Horário Real de Acesso: ${ev.time} — ${ev.studentName}`;
                    },
                    afterBody: (items) => {
                      const idx = items[0]?.dataIndex ?? 0;
                      const ev = events[idx];
                      if (!ev) return [];
                      return [
                        `Pelotão / Turma: ${ev.category} (${ev.cohort})`,
                        `Matrícula: ${ev.registration}`,
                        `Tentativa registrada: ${ev.attemptNumber}ª tentativa (${ev.score} pts)`,
                        `Status: ${ev.status}`,
                      ];
                    },
                  },
                },
              },
            },
          });
        } else {
          lapsoTimelineChartRef.current = new Chart(ctx, {
            type: 'bar',
            data: {
              labels: cohortMetrics.lapsoHourly.hours.map((h) => `Faixa ${h}`),
              datasets: [
                {
                  type: 'bar',
                  label: 'Turma 01 (Média na Hora)',
                  data: cohortMetrics.lapsoHourly.t1.map((d) => d.avgScore),
                  backgroundColor: 'rgba(16, 185, 129, 0.85)',
                  borderColor: '#10b981',
                  borderWidth: 1,
                  borderRadius: 6,
                  yAxisID: 'yScore',
                },
                {
                  type: 'bar',
                  label: 'Turma 02 (Média na Hora)',
                  data: cohortMetrics.lapsoHourly.t2.map((d) => d.avgScore),
                  backgroundColor: 'rgba(56, 189, 248, 0.85)',
                  borderColor: '#38bdf8',
                  borderWidth: 1,
                  borderRadius: 6,
                  yAxisID: 'yScore',
                },
                {
                  type: 'bar',
                  label: 'Visitantes (Média na Hora)',
                  data: cohortMetrics.lapsoHourly.visitantes.map((d) => d.avgScore),
                  backgroundColor: 'rgba(167, 139, 250, 0.85)',
                  borderColor: '#a78bfa',
                  borderWidth: 1,
                  borderRadius: 6,
                  yAxisID: 'yScore',
                },
                {
                  type: 'line',
                  label: 'Total de Acessos na Hora',
                  data: cohortMetrics.lapsoHourly.totalCounts,
                  borderColor: '#fde047',
                  backgroundColor: 'rgba(253, 224, 71, 0.2)',
                  borderWidth: 2.5,
                  pointBackgroundColor: '#fde047',
                  pointRadius: 5,
                  tension: 0.3,
                  yAxisID: 'yCount',
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              interaction: { mode: 'index', intersect: false },
              scales: {
                yScore: {
                  type: 'linear',
                  position: 'left',
                  beginAtZero: true,
                  max: 100,
                  grid: { color: gridColor },
                  ticks: {
                    color: textColor,
                    stepSize: 20,
                    callback: (val) => `${val} pts`,
                  },
                  title: {
                    display: true,
                    text: 'Média de Pontos (0–100)',
                    color: '#10b981',
                    font: { size: 11, weight: 'bold' },
                  },
                },
                yCount: {
                  type: 'linear',
                  position: 'right',
                  beginAtZero: true,
                  suggestedMax: 8,
                  grid: { drawOnChartArea: false },
                  ticks: {
                    color: '#fbbf24',
                    stepSize: 1,
                    callback: (val) => `${val} mil.`,
                  },
                  title: {
                    display: true,
                    text: 'Militares Conectados / Concluídos',
                    color: '#fbbf24',
                    font: { size: 11, weight: 'bold' },
                  },
                },
                x: {
                  grid: { display: false },
                  ticks: {
                    color: '#f8fafc',
                    font: { family: "'JetBrains Mono', monospace", size: 11, weight: 'bold' },
                  },
                },
              },
              plugins: {
                legend: {
                  position: 'top',
                  labels: { color: textColor, boxWidth: 12, font: { size: 11 } },
                },
                tooltip: {
                  backgroundColor: '#0f172a',
                  titleColor: '#fbbf24',
                  bodyColor: '#f8fafc',
                  borderColor: '#334155',
                  borderWidth: 1,
                },
              },
            },
          });
        }
      }
    }

    // ========================================================================
    // GRÁFICO 1: RADAR DE COMPETÊNCIAS NOS 4 PILARES (4 OPÇÕES + VOCÊ)
    // ========================================================================
    if (radarCanvasRef.current) {
      if (radarChartRef.current) radarChartRef.current.destroy();
      const ctx = radarCanvasRef.current.getContext('2d');
      if (ctx) {
        const datasets: any[] = [
          {
            label: 'Turma 01 (%)',
            data: COMPETENCY_PILLARS.map((p) => cohortMetrics.t1.pillarAvgs[p]),
            backgroundColor: 'rgba(16, 185, 129, 0.18)',
            borderColor: '#10b981',
            pointBackgroundColor: '#10b981',
            pointBorderColor: '#0f172a',
            borderWidth: 2,
          },
          {
            label: 'Turma 02 (%)',
            data: COMPETENCY_PILLARS.map((p) => cohortMetrics.t2.pillarAvgs[p]),
            backgroundColor: 'rgba(56, 189, 248, 0.18)',
            borderColor: '#38bdf8',
            pointBackgroundColor: '#38bdf8',
            pointBorderColor: '#0f172a',
            borderWidth: 2,
          },
          {
            label: 'Visitantes (%)',
            data: COMPETENCY_PILLARS.map((p) => cohortMetrics.visitantes.pillarAvgs[p]),
            backgroundColor: 'rgba(167, 139, 250, 0.16)',
            borderColor: '#a78bfa',
            pointBackgroundColor: '#a78bfa',
            pointBorderColor: '#0f172a',
            borderWidth: 2,
          },
        ];

        if (studentName && studentName.trim().length > 0) {
          datasets.push({
            label: 'Seu Perfil (%)',
            data: COMPETENCY_PILLARS.map((p) => pillarPercentages[p] ?? 0),
            backgroundColor: 'rgba(253, 224, 71, 0.14)',
            borderColor: '#fde047',
            borderDash: [4, 4],
            pointBackgroundColor: '#fde047',
            pointBorderColor: '#0f172a',
            borderWidth: 2,
          });
        }

        radarChartRef.current = new Chart(ctx, {
          type: 'radar',
          data: {
            labels: COMPETENCY_PILLARS,
            datasets,
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              r: {
                beginAtZero: true,
                max: 100,
                ticks: {
                  stepSize: 25,
                  color: '#94a3b8',
                  backdropColor: 'transparent',
                  font: { size: 10 },
                },
                grid: { color: gridColor },
                angleLines: { color: gridColor },
                pointLabels: {
                  color: '#f8fafc',
                  font: { family: "'Plus Jakarta Sans', sans-serif", size: 11, weight: 'bold' },
                },
              },
            },
            plugins: {
              legend: {
                position: 'bottom',
                labels: { color: textColor, boxWidth: 12, font: { size: 10 } },
              },
              tooltip: {
                backgroundColor: '#0f172a',
                titleColor: '#fbbf24',
                bodyColor: '#f8fafc',
                borderColor: '#334155',
                borderWidth: 1,
              },
            },
          },
        });
      }
    }

    // ========================================================================
    // GRÁFICO 2: COMPARATIVO ENTRE AS 4 OPÇÕES (TURMA 01, TURMA 02, VISITANTES, CORPO DOCENTE)
    // ========================================================================
    if (cohortCompareCanvasRef.current) {
      if (cohortCompareChartRef.current) cohortCompareChartRef.current.destroy();
      const ctx = cohortCompareCanvasRef.current.getContext('2d');
      if (ctx) {
        const labels = [
          'Média 1ª Tent.',
          'Média Vigente',
          'Legislação PM',
          'Penal/Proc. Militar',
          'Const./Admin.',
          'Adm. & Gerais',
        ];

        cohortCompareChartRef.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels,
            datasets: [
              {
                label: `Turma 01 (${cohortMetrics.t1.count})`,
                data: [
                  cohortMetrics.t1.initialAvg,
                  cohortMetrics.t1.avg,
                  cohortMetrics.t1.pillarAvgs['Legislação PM & Regime Disciplinar'],
                  cohortMetrics.t1.pillarAvgs['Direito Penal & Processual Militar'],
                  cohortMetrics.t1.pillarAvgs['Direito Constitucional & Administrativo'],
                  cohortMetrics.t1.pillarAvgs['Administração & Conhecimentos Gerais'],
                ],
                backgroundColor: '#10b981',
                borderColor: '#34d399',
                borderWidth: 1,
                borderRadius: 6,
                maxBarThickness: 26,
              },
              {
                label: `Turma 02 (${cohortMetrics.t2.count})`,
                data: [
                  cohortMetrics.t2.initialAvg,
                  cohortMetrics.t2.avg,
                  cohortMetrics.t2.pillarAvgs['Legislação PM & Regime Disciplinar'],
                  cohortMetrics.t2.pillarAvgs['Direito Penal & Processual Militar'],
                  cohortMetrics.t2.pillarAvgs['Direito Constitucional & Administrativo'],
                  cohortMetrics.t2.pillarAvgs['Administração & Conhecimentos Gerais'],
                ],
                backgroundColor: '#38bdf8',
                borderColor: '#7dd3fc',
                borderWidth: 1,
                borderRadius: 6,
                maxBarThickness: 26,
              },
              {
                label: `Visitantes (${cohortMetrics.visitantes.count})`,
                data: [
                  cohortMetrics.visitantes.initialAvg,
                  cohortMetrics.visitantes.avg,
                  cohortMetrics.visitantes.pillarAvgs['Legislação PM & Regime Disciplinar'],
                  cohortMetrics.visitantes.pillarAvgs['Direito Penal & Processual Militar'],
                  cohortMetrics.visitantes.pillarAvgs['Direito Constitucional & Administrativo'],
                  cohortMetrics.visitantes.pillarAvgs['Administração & Conhecimentos Gerais'],
                ],
                backgroundColor: '#a78bfa',
                borderColor: '#c4b5fd',
                borderWidth: 1,
                borderRadius: 6,
                maxBarThickness: 26,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                max: 100,
                grid: { color: gridColor },
                ticks: {
                  color: textColor,
                  stepSize: 20,
                  callback: (val) => `${val}%`,
                },
              },
              x: {
                grid: { display: false },
                ticks: {
                  color: '#f8fafc',
                  font: { size: 10, weight: 'bold' },
                },
              },
            },
            plugins: {
              legend: {
                position: 'top',
                labels: { color: textColor, boxWidth: 12, font: { size: 10 } },
              },
              tooltip: {
                backgroundColor: '#0f172a',
                titleColor: '#fbbf24',
                bodyColor: '#f8fafc',
                borderColor: '#334155',
                borderWidth: 1,
                callbacks: {
                  label: (ctxItem) => `${ctxItem.dataset.label}: ${ctxItem.parsed.y} pts/%`,
                },
              },
            },
          },
        });
      }
    }

    // ========================================================================
    // GRÁFICO 3: DISTRIBUIÇÃO POR FAIXA DIAGNÓSTICA (TURMA 01, TURMA 02, VISITANTES, CORPO DOCENTE)
    // ========================================================================
    if (classDistCanvasRef.current) {
      if (classDistChartRef.current) classDistChartRef.current.destroy();
      const ctx = classDistCanvasRef.current.getContext('2d');
      if (ctx) {
        classDistChartRef.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: [
              'Soldado Recruta (0–49)',
              'Operador Prático (50–79)',
              'Especialista SEI (80–100)',
            ],
            datasets: [
              {
                label: 'Turma 01',
                data: cohortMetrics.t1.tiers,
                backgroundColor: '#10b981',
                borderColor: '#34d399',
                borderWidth: 1,
                borderRadius: 6,
                maxBarThickness: 34,
              },
              {
                label: 'Turma 02',
                data: cohortMetrics.t2.tiers,
                backgroundColor: '#38bdf8',
                borderColor: '#7dd3fc',
                borderWidth: 1,
                borderRadius: 6,
                maxBarThickness: 34,
              },
              {
                label: 'Visitantes',
                data: cohortMetrics.visitantes.tiers,
                backgroundColor: '#a78bfa',
                borderColor: '#c4b5fd',
                borderWidth: 1,
                borderRadius: 6,
                maxBarThickness: 34,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                ticks: { stepSize: 1, color: textColor },
                grid: { color: gridColor },
              },
              x: {
                ticks: { color: '#f8fafc', font: { size: 11, weight: 'bold' } },
                grid: { display: false },
              },
            },
            plugins: {
              legend: {
                position: 'top',
                labels: { color: textColor, boxWidth: 12, font: { size: 11 } },
              },
              tooltip: {
                backgroundColor: '#0f172a',
                titleColor: '#fbbf24',
                bodyColor: '#f8fafc',
                borderColor: '#334155',
                borderWidth: 1,
                callbacks: {
                  label: (ctxItem) =>
                    `${ctxItem.dataset.label}: ${ctxItem.parsed.y} militar(es)`,
                },
              },
            },
          },
        });
      }
    }

    // ========================================================================
    // GRÁFICO 4: RANKING & PROGRESSÃO NOMINAL DE TODOS OS MILITARES (COM AS 4 OPÇÕES)
    // ========================================================================
    if (classRankingCanvasRef.current) {
      if (classRankingChartRef.current) classRankingChartRef.current.destroy();
      const ctx = classRankingCanvasRef.current.getContext('2d');
      if (ctx) {
        const cleanCurrentName = studentName.trim().toLowerCase();

        const labels = filteredStudents.map((s) => {
          const isInst = isInstructor(s);
          const isMe = !isInst && cleanCurrentName && s.name.toLowerCase() === cleanCurrentName;
          const category = normalizeCohortCategory(s.cohort, isInst);
          const cohortTag = getCohortShortTag(category);
          const realTime = s.completedAt || s.enrolledAt || '14:00';
          const shortName =
            s.name.length > 22 ? s.name.slice(0, 22) + '…' : s.name;
          if (isInst) return `★ ${shortName} [DOC · 🕒 ${realTime}]`;
          if (isMe) return `▶ ${shortName} (${cohortTag} · 🕒 ${realTime} · VOCÊ)`;
          return `${shortName} (${cohortTag} · 🕒 ${realTime})`;
        });

        const firstAttemptData = filteredStudents.map(
          (s) => s.history?.[0]?.score ?? s.score
        );
        const currentScoreData = filteredStudents.map((s) => s.score);

        const currentBgColors = filteredStudents.map((s) => {
          const isInst = isInstructor(s);
          if (isInst) return '#f59e0b';
          const isMe = cleanCurrentName && s.name.toLowerCase() === cleanCurrentName;
          if (isMe) return '#fde047';
          const cat = normalizeCohortCategory(s.cohort, isInst);
          if (cat === 'Visitantes') return '#a78bfa';
          if (cat === 'Turma 02') return '#38bdf8';
          return '#10b981';
        });

        classRankingChartRef.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels,
            datasets: [
              {
                label: '1ª Tentativa (Diagnóstico Inicial)',
                data: firstAttemptData,
                backgroundColor: 'rgba(148, 163, 184, 0.38)',
                borderColor: '#64748b',
                borderWidth: 1,
                borderRadius: 4,
                maxBarThickness: 14,
              },
              {
                label: 'Nota Vigente (Pós-Progressão)',
                data: currentScoreData,
                backgroundColor: currentBgColors,
                borderRadius: 4,
                maxBarThickness: 18,
              },
            ],
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                beginAtZero: true,
                max: 100,
                grid: { color: gridColor },
                ticks: {
                  color: textColor,
                  stepSize: 20,
                  callback: (val) => `${val} pts`,
                },
              },
              y: {
                grid: { display: false },
                ticks: {
                  color: '#f8fafc',
                  font: {
                    family: "'JetBrains Mono', monospace",
                    size: 10,
                  },
                },
              },
            },
            plugins: {
              legend: {
                display: true,
                position: 'top',
                labels: { color: textColor, boxWidth: 12, font: { size: 11 } },
              },
              tooltip: {
                backgroundColor: '#0f172a',
                titleColor: '#fbbf24',
                bodyColor: '#f8fafc',
                borderColor: '#334155',
                borderWidth: 1,
                callbacks: {
                  afterBody: (items) => {
                    const idx = items[0]?.dataIndex;
                    if (idx === undefined) return '';
                    const student = filteredStudents[idx];
                    if (!student) return '';
                    const first = student.history?.[0]?.score ?? student.score;
                    const diff = student.score - first;
                    const tries = student.attemptsCount || student.history?.length || 1;
                    const accessClock =
                      student.enrolledAt && student.enrolledAt !== student.completedAt
                        ? `${student.enrolledAt} ➔ ${student.completedAt}`
                        : student.completedAt || student.enrolledAt || '14:00';
                    const category = normalizeCohortCategory(
                      student.cohort,
                      isInstructor(student)
                    );
                    return [
                      `Pelotão / Turma: ${category}`,
                      `Matrícula: ${student.registration}`,
                      `Horário Real de Acesso: 🕒 ${accessClock}`,
                      `Tentativas realizadas: ${tries}x (${diff >= 0 ? '+' : ''}${diff} pts de evolução)`,
                    ];
                  },
                },
              },
            },
          },
        });
      }
    }

    return () => {
      if (lapsoTimelineChartRef.current) lapsoTimelineChartRef.current.destroy();
      if (radarChartRef.current) radarChartRef.current.destroy();
      if (cohortCompareChartRef.current) cohortCompareChartRef.current.destroy();
      if (classDistChartRef.current) classDistChartRef.current.destroy();
      if (classRankingChartRef.current) classRankingChartRef.current.destroy();
    };
  }, [pillarPercentages, studentScore, studentName, classRoster, cohortMetrics, filteredStudents, timelineViewMode]);

  const classAverage = useMemo(() => {
    if (classRoster.length === 0) return 0;
    const sum = classRoster.reduce((acc, s) => acc + s.score, 0);
    return Math.round(sum / classRoster.length);
  }, [classRoster]);

  const pctAdvanced = useMemo(() => {
    if (classRoster.length === 0) return 0;
    const adv = classRoster.filter((s) => s.score >= 80).length;
    return Math.round((adv / classRoster.length) * 100);
  }, [classRoster]);

  return (
    <div className="space-y-6">
      {/* PAINEL DE RESUMO DAS OPÇÕES: TURMA 01, TURMA 02 E VISITANTES */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card Turma 01 */}
        <div className="bg-slate-900/90 border border-emerald-700/60 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 font-mono-num uppercase tracking-wider">
              Turma 01
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/60 text-[11px] font-mono-num">
              {cohortMetrics.t1.count} militares
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block">1ª Tentativa ➔ Atual</span>
              <span className="font-mono-num text-xl font-bold text-white">
                {cohortMetrics.t1.initialAvg} ➔ {cohortMetrics.t1.avg} pts
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">Evolução Média</span>
              <span className="font-mono-num text-sm font-bold text-emerald-400">
                +{cohortMetrics.t1.gain} pts
              </span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono-num">
            <span>Concluídos: {cohortMetrics.t1.completedCount}</span>
            <span className="text-amber-400">Em Missão: {cohortMetrics.t1.inMissionCount}</span>
          </div>
        </div>

        {/* Card Turma 02 */}
        <div className="bg-slate-900/90 border border-sky-700/60 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-400 font-mono-num uppercase tracking-wider">
              Turma 02
            </span>
            <span className="px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-700/60 text-[11px] font-mono-num">
              {cohortMetrics.t2.count} militares
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block">1ª Tentativa ➔ Atual</span>
              <span className="font-mono-num text-xl font-bold text-white">
                {cohortMetrics.t2.initialAvg} ➔ {cohortMetrics.t2.avg} pts
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">Evolução Média</span>
              <span className="font-mono-num text-sm font-bold text-sky-400">
                +{cohortMetrics.t2.gain} pts
              </span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono-num">
            <span>Concluídos: {cohortMetrics.t2.completedCount}</span>
            <span className="text-amber-400">Em Missão: {cohortMetrics.t2.inMissionCount}</span>
          </div>
        </div>

        {/* Card Visitantes */}
        <div className="bg-slate-900/90 border border-purple-700/60 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-300 font-mono-num uppercase tracking-wider">
              Visitantes
            </span>
            <span className="px-2 py-0.5 rounded-full bg-purple-950 text-purple-200 border border-purple-700/60 text-[11px] font-mono-num">
              {cohortMetrics.visitantes.count} militares
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block">1ª Tentativa ➔ Atual</span>
              <span className="font-mono-num text-xl font-bold text-white">
                {cohortMetrics.visitantes.initialAvg} ➔ {cohortMetrics.visitantes.avg} pts
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">Evolução Média</span>
              <span className="font-mono-num text-sm font-bold text-purple-300">
                +{cohortMetrics.visitantes.gain} pts
              </span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono-num">
            <span>Concluídos: {cohortMetrics.visitantes.completedCount}</span>
            <span className="text-amber-400">Em Missão: {cohortMetrics.visitantes.inMissionCount}</span>
          </div>
        </div>
      </div>

      {/* GRÁFICO COM REGISTRO DO HORÁRIO REAL DE ACESSO (HH:MM EXATO DE CADA LOGIN / TENTATIVA) */}
      <div className="bg-slate-900/90 border border-amber-600/50 rounded-2xl p-5 sm:p-6 space-y-4 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" />
              Registro do Horário Real de Acesso no Gráfico (HH:MM Exato de Cada Militar)
            </span>
            <h3 className="font-display text-base sm:text-lg font-bold text-white">
              Linha do Tempo com Horário Real de Acesso (Turma 01 · Turma 02 · Visitantes)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Cada barra registra o <strong>horário real exato (HH:MM)</strong> em que o militar acessou e concluiu a missão no celular ou computador.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start">
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setTimelineViewMode('EXACT_TIME')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  timelineViewMode === 'EXACT_TIME'
                    ? 'bg-amber-400 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🕒 Horário Real (HH:MM)
              </button>
              <button
                type="button"
                onClick={() => setTimelineViewMode('HOURLY')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  timelineViewMode === 'HOURLY'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Por Faixa de Hora
              </button>
            </div>
          </div>
        </div>

        {/* Fita Cronológica dos Últimos Horários Reais Registrados */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-1 text-[11px] font-mono-num">
          <span className="text-slate-400 font-semibold shrink-0">Últimos acessos reais:</span>
          {cohortMetrics.exactTimeline.events
            .slice(-8)
            .reverse()
            .map((ev, i) => {
              const badgeColor =
                ev.category === 'Visitantes'
                  ? 'bg-purple-950/70 border-purple-700/60 text-purple-200'
                  : ev.category === 'Turma 02'
                  ? 'bg-sky-950/70 border-sky-700/60 text-sky-200'
                  : 'bg-emerald-950/70 border-emerald-700/60 text-emerald-200';
              return (
                <span
                  key={`${ev.studentName}-${ev.time}-${i}`}
                  className={`px-2.5 py-1 rounded-lg border shrink-0 flex items-center gap-1.5 ${badgeColor}`}
                >
                  <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                  <strong className="text-amber-300">{ev.time}</strong>
                  <span>·</span>
                  <span className="font-semibold text-white">{ev.shortName}</span>
                  <span className="text-[10px] opacity-80">[{ev.category}]</span>
                  <span className="text-slate-400">({ev.score} pts)</span>
                </span>
              );
            })}
        </div>

        <div className="relative min-h-[290px]">
          <canvas ref={lapsoTimelineCanvasRef} />
        </div>
      </div>

      {/* LINHA 1: COMPARATIVO ENTRE AS OPÇÕES + RADAR COMPARATIVO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* GRÁFICO COMPARATIVO ENTRE TURMA 01, TURMA 02 E VISITANTES */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 sm:p-6 flex flex-col">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5" />
                Comparativo Direto de Evolução e Domínio Técnico
              </span>
              <h3 className="font-display text-base sm:text-lg font-bold text-white">
                Turma 01 · Turma 02 · Visitantes (Notas e 4 Pilares CFOA)
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono-num">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Turma 01
              </span>
              <span className="flex items-center gap-1 text-sky-400">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" /> Turma 02
              </span>
              <span className="flex items-center gap-1 text-purple-300">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400 inline-block" /> Visitantes
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mb-3">
            Compare a média da 1ª tentativa, a nota vigente e o desempenho em cada eixo entre Turma 01, Turma 02 e Visitantes.
          </p>
          <div className="relative flex-1 min-h-[270px]">
            <canvas ref={cohortCompareCanvasRef} />
          </div>
        </div>

        {/* GRÁFICO 1 · RADAR DE COMPETÊNCIAS (OPÇÕES + VOCÊ) */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 sm:p-6 flex flex-col">
          <div className="mb-3">
            <span className="text-[11px] font-semibold text-emerald-400">
              Radar Comparativo por Pelotão / Turma
            </span>
            <h3 className="font-display text-base sm:text-lg font-bold text-white">
              4 Pilares CFOA (Turma 01 · Turma 02 · Visitantes)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Sobreposição de domínio entre as opções e seu perfil individual
            </p>
          </div>
          <div className="relative flex-1 min-h-[270px] flex items-center justify-center">
            <canvas ref={radarCanvasRef} />
          </div>
        </div>
      </div>

      {/* LINHA 2: GRÁFICO NOMINAL DE TODOS OS MILITARES COM HORÁRIO REAL DE ACESSO */}
      <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Gráfico Único Coletivo · Todos os Militares Registrados com Horário Real de Acesso
            </span>
            <h3 className="font-display text-base sm:text-lg font-bold text-white">
              Comparativo Nominal de Notas, Horário Real (🕒 HH:MM) e Evolução (1ª Tentativa ➔ Nota Vigente)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Cada militar exibe sua opção (<strong>T01, T02, VIS</strong>) e horário real de acesso (🕒 HH:MM).
            </p>
          </div>

          {/* Filtros pelas Opções */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs self-start">
            <button
              type="button"
              onClick={() => setRankingFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                rankingFilter === 'ALL'
                  ? 'bg-amber-400 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos ({classRoster.length})
            </button>
            <button
              type="button"
              onClick={() => setRankingFilter('Turma 01')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                rankingFilter === 'Turma 01'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Turma 01 ({cohortMetrics.t1.count})
            </button>
            <button
              type="button"
              onClick={() => setRankingFilter('Turma 02')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                rankingFilter === 'Turma 02'
                  ? 'bg-sky-400 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Turma 02 ({cohortMetrics.t2.count})
            </button>
            <button
              type="button"
              onClick={() => setRankingFilter('Visitantes')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                rankingFilter === 'Visitantes'
                  ? 'bg-purple-400 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Visitantes ({cohortMetrics.visitantes.count})
            </button>
          </div>
        </div>

        <div
          className="relative"
          style={{ minHeight: `${Math.max(300, filteredStudents.length * 36)}px` }}
        >
          <canvas ref={classRankingCanvasRef} />
        </div>
      </div>

      {/* LINHA 3: DISTRIBUIÇÃO COMPARATIVA POR FAIXA DIAGNÓSTICA */}
      <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 sm:p-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" />
              Distribuição Comparativa do Efetivo ({classRoster.length} militares)
            </span>
            <h3 className="font-display text-base sm:text-lg font-bold text-white">
              Efetivo por Patente / Faixa Diagnóstica (Turma 01 · Turma 02 · Visitantes)
            </h3>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">Média Coletiva Geral</span>
            <span className="font-mono-num text-base font-bold text-emerald-400">
              {classAverage} pts · {pctAdvanced}% Especialistas CFOA
            </span>
          </div>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Comparação da quantidade de militares de Turma 01, Turma 02 e Visitantes nas faixas Soldado Recruta (0–49), Operador Prático (50–79) e Especialista SEI (80–100)
        </p>
        <div className="relative min-h-[220px]">
          <canvas ref={classDistCanvasRef} />
        </div>
      </div>
    </div>
  );
};
