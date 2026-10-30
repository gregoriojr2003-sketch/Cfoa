import React, { useState, useMemo } from 'react';
import {
  Crown,
  Search,
  TrendingUp,
  Share2,
  Clock,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Play,
  Users,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  ClassStudentRecord,
  COMPETENCY_PILLARS,
  calculateStudentAverageAccuracy,
} from '../data/presets';
import { CohortCategory, normalizeCohortCategory } from './DiagnosticCharts';

interface MobileRosterCardsProps {
  classRoster: ClassStudentRecord[];
  tableFilter: 'ALL' | CohortCategory;
  setTableFilter: (f: 'ALL' | CohortCategory) => void;
  isInstructor: (s: ClassStudentRecord) => boolean;
  recentStudentId: string | null;
  currentStudentName: string;
  onInspectStudent: (student: ClassStudentRecord) => void;
  onShareStudent: (student: ClassStudentRecord) => void;
  onUpdateStudentScore: (student: ClassStudentRecord) => void;
  onManualSync: () => void;
}

export const MobileRosterCards: React.FC<MobileRosterCardsProps> = ({
  classRoster,
  tableFilter,
  setTableFilter,
  isInstructor,
  recentStudentId,
  currentStudentName,
  onInspectStudent,
  onShareStudent,
  onUpdateStudentScore,
  onManualSync,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncClick = async () => {
    setIsSyncing(true);
    await onManualSync();
    setTimeout(() => setIsSyncing(false), 600);
  };

  // Estatísticas rápidas coletivas para cabeçalho mobile
  const stats = useMemo(() => {
    const t1 = classRoster.filter(
      (s) => normalizeCohortCategory(s.cohort, isInstructor(s)) === 'Turma 01'
    );
    const t2 = classRoster.filter(
      (s) => normalizeCohortCategory(s.cohort, isInstructor(s)) === 'Turma 02'
    );
    const vis = classRoster.filter(
      (s) => normalizeCohortCategory(s.cohort, isInstructor(s)) === 'Visitantes'
    );
    const calcAvg = (list: ClassStudentRecord[]) =>
      list.length > 0
        ? Math.round(list.reduce((a, b) => a + b.score, 0) / list.length)
        : 0;
    const calcInitial = (list: ClassStudentRecord[]) =>
      list.length > 0
        ? Math.round(
            list.reduce((a, b) => a + (b.history?.[0]?.score ?? b.score), 0) /
              list.length
          )
        : 0;

    return {
      total: classRoster.length,
      t1Count: t1.length,
      t1Avg: calcAvg(t1),
      t1Init: calcInitial(t1),
      t2Count: t2.length,
      t2Avg: calcAvg(t2),
      t2Init: calcInitial(t2),
      visCount: vis.length,
      visAvg: calcAvg(vis),
      visInit: calcInitial(vis),
    };
  }, [classRoster]);

  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return [...classRoster]
      .sort((a, b) => b.score - a.score)
      .filter((s) => {
        const cat = normalizeCohortCategory(s.cohort, false);
        const matchCohort = tableFilter === 'ALL' || cat === tableFilter;
        if (!matchCohort) return false;
        if (!q) return true;
        return (
          s.name.toLowerCase().includes(q) ||
          s.registration.toLowerCase().includes(q) ||
          s.cohort.toLowerCase().includes(q) ||
          cat.toLowerCase().includes(q)
        );
      });
  }, [classRoster, tableFilter, searchQuery]);

  const leaderScore = useMemo(() => {
    if (filteredList.length === 0) return 0;
    return filteredList[0].score;
  }, [filteredList]);

  return (
    <div className="space-y-4">
      {/* BARRA DE CONTROLE RÁPIDO DO RANKING: BUSCA + ATUALIZAÇÃO AO VIVO */}
      <div className="bg-slate-950/90 border border-emerald-700/50 rounded-2xl p-3.5 sm:p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
              RANKING OFICIAL · Classificação pelo Cadastro [Nome de Guerra / Identificação do Militar]
            </span>
          </div>
          <button
            type="button"
            onClick={handleSyncClick}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            Atualizar Ranking Ao Vivo Agora
          </button>
        </div>

        {/* Resumo Compacto Coletivo Mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
          <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-700/50">
            <span className="text-[10px] font-mono-num text-emerald-400 font-bold uppercase block">
              Turma 01 ({stats.t1Count} cadastrados)
            </span>
            <div className="text-xs sm:text-sm font-mono-num font-bold text-white mt-0.5">
              {stats.t1Init} ➔ <span className="text-emerald-400">{stats.t1Avg} pts</span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-sky-950/40 border border-sky-700/50">
            <span className="text-[10px] font-mono-num text-sky-400 font-bold uppercase block">
              Turma 02 ({stats.t2Count} cadastrados)
            </span>
            <div className="text-xs sm:text-sm font-mono-num font-bold text-white mt-0.5">
              {stats.t2Init} ➔ <span className="text-sky-400">{stats.t2Avg} pts</span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-700/50">
            <span className="text-[10px] font-mono-num text-purple-300 font-bold uppercase block">
              Visitantes ({stats.visCount} cadastrados)
            </span>
            <div className="text-xs sm:text-sm font-mono-num font-bold text-white mt-0.5">
              {stats.visInit} ➔ <span className="text-purple-300">{stats.visAvg} pts</span>
            </div>
          </div>
        </div>

        {/* Busca Rápida por Nome de Guerra / Identificação do Militar + Filtro */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar no Ranking por [Nome de Guerra / Identificação do Militar], Gmail ou OPM..."
              className="w-full min-h-[44px] pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="grid grid-cols-2 sm:flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setTableFilter('ALL')}
              className={`py-2 px-2.5 rounded-lg font-bold transition cursor-pointer ${
                tableFilter === 'ALL'
                  ? 'bg-amber-400 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Ranking Geral
            </button>
            <button
              type="button"
              onClick={() => setTableFilter('Turma 01')}
              className={`py-2 px-2.5 rounded-lg font-bold transition cursor-pointer ${
                tableFilter === 'Turma 01'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Turma 01
            </button>
            <button
              type="button"
              onClick={() => setTableFilter('Turma 02')}
              className={`py-2 px-2.5 rounded-lg font-bold transition cursor-pointer ${
                tableFilter === 'Turma 02'
                  ? 'bg-sky-400 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Turma 02
            </button>
            <button
              type="button"
              onClick={() => setTableFilter('Visitantes')}
              className={`py-2 px-2.5 rounded-lg font-bold transition cursor-pointer ${
                tableFilter === 'Visitantes'
                  ? 'bg-purple-400 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Visitantes
            </button>
          </div>
        </div>
      </div>

      {/* LISTA DE CARDS INTERATIVOS PARA CELULAR (EXIBIDA EM TELAS < MD OU QUANDO FILTRANDO) */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {filteredList.map((student, idx) => {
          const isRecent = student.id === recentStudentId;
          const isMe =
            currentStudentName.trim() &&
            student.name.toLowerCase() === currentStudentName.trim().toLowerCase();
          const isLive = student.status === 'Em Missão';
          const isExpanded = expandedId === student.id;

          const firstScore = student.history?.[0]?.score ?? student.score;
          const gain = student.score - firstScore;
          const accuracySummary = calculateStudentAverageAccuracy(student);
          const gapToLeader = Math.max(0, leaderScore - student.score);
          const prevRankStudent = idx > 0 ? filteredList[idx - 1] : null;
          const gapToNextPos = prevRankStudent
            ? Math.max(1, prevRankStudent.score - student.score)
            : 0;
          const timeSpan =
            student.enrolledAt && student.enrolledAt !== student.completedAt
              ? `${student.enrolledAt} ➔ ${student.completedAt}`
              : student.completedAt || student.enrolledAt || '14:00';
          const category = normalizeCohortCategory(student.cohort, false);

          const badgeClass =
            category === 'Visitantes'
              ? 'bg-purple-950 text-purple-300 border-purple-700/60'
              : category === 'Turma 02'
              ? 'bg-sky-950 text-sky-300 border-sky-700/60'
              : 'bg-emerald-950 text-emerald-300 border-emerald-700/60';

          return (
            <div
              key={student.id}
              className={`rounded-2xl border p-4 transition-all ${
                isRecent
                  ? 'bg-amber-400/15 border-amber-400 ring-2 ring-amber-400/50'
                  : isMe
                  ? 'bg-emerald-950/40 border-emerald-500/70 ring-1 ring-emerald-400/40'
                  : 'bg-slate-950/90 border-slate-800'
              }`}
            >
              {/* Topo do Card */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <span
                      className={`font-mono-num text-xs font-black px-2 py-0.5 rounded border ${
                        idx === 0
                          ? 'bg-amber-400 text-slate-950 border-amber-200'
                          : idx === 1
                          ? 'bg-slate-200 text-slate-950 border-white'
                          : idx === 2
                          ? 'bg-amber-700 text-white border-amber-500'
                          : 'bg-slate-900 border-slate-700 text-amber-400'
                      }`}
                    >
                      {idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`}
                    </span>
                    <span
                      className={`text-[10px] font-mono-num font-bold px-2 py-0.5 rounded border ${badgeClass}`}
                    >
                      {student.cohort || category}
                    </span>
                    <span className="text-[10px] font-mono-num text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      {timeSpan}
                    </span>
                    {isMe && (
                      <span className="text-[10px] bg-emerald-500/20 border border-emerald-400/60 text-emerald-300 px-2 py-0.5 rounded font-black uppercase">
                        Seu Cadastro
                      </span>
                    )}
                    {isLive && (
                      <span className="text-[10px] bg-emerald-500 text-slate-950 px-2 py-0.5 rounded font-bold uppercase animate-pulse">
                        Em Missão ({student.progressQuestions ?? 0}/
                        {student.totalQuestionsCount ?? 10})
                      </span>
                    )}
                    {isRecent && (
                      <span className="text-[10px] bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" /> Atualizado
                      </span>
                    )}
                  </div>

                  <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    Nome de Guerra / Identificação do Militar:
                  </div>
                  <h4 className="font-display text-sm font-bold text-white truncate">
                    {student.name}
                  </h4>
                  <p className="text-[11px] font-mono-num text-slate-400">
                    {student.registration} ·{' '}
                    <span
                      className={
                        student.score >= 80
                          ? 'text-emerald-400 font-semibold'
                          : student.score >= 50
                          ? 'text-sky-400 font-semibold'
                          : 'text-amber-400 font-semibold'
                      }
                    >
                      {student.score >= 80
                        ? '★ Apto / Oficial CFOA'
                        : student.score >= 50
                        ? '● Em Aperfeiçoamento'
                        : '▲ Nível Inicial'}
                    </span>
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-mono-num text-xl font-extrabold text-white">
                    {student.score}
                    <span className="text-[11px] font-normal text-slate-400"> pts</span>
                  </div>
                  <div className="text-[10px] font-mono-num text-slate-300">
                    1ª: {firstScore} ➔ {student.score}{' '}
                    <span className={gain >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400'}>
                      ({gain >= 0 ? `+${gain}` : gain})
                    </span>
                  </div>
                  <div className="text-[10px] font-mono-num text-amber-300 mt-0.5">
                    Precisão Média: <strong>{accuracySummary.avgAccuracyPct}%</strong> ({accuracySummary.totalCorrect} acertos / {accuracySummary.missionsCompleted} {accuracySummary.missionsCompleted === 1 ? 'missão' : 'missões'})
                  </div>
                  <div className="text-[10px] font-mono-num text-sky-300 mt-0.5">
                    {idx === 0
                      ? '👑 Líder do Ranking'
                      : `Faltam +${gapToNextPos} pts p/ #${idx} (Líder: -${gapToLeader} pts)`}
                  </div>
                </div>
              </div>

              {/* Barra Visual de Evolução */}
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400 font-mono-num">
                  <span>Taxa de Precisão Média ({accuracySummary.missionsCompleted}x {accuracySummary.missionsCompleted > 1 ? 'missões' : 'missão'})</span>
                  <span className="text-emerald-400 font-bold">{accuracySummary.avgAccuracyPct}% ({accuracySummary.totalCorrect}/{accuracySummary.totalQuestionsAnswered} acertos)</span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden flex">
                  <div
                    className={`h-full transition-all duration-300 ${
                      accuracySummary.avgAccuracyPct >= 80
                        ? 'bg-emerald-500'
                        : accuracySummary.avgAccuracyPct >= 50
                        ? 'bg-sky-400'
                        : 'bg-amber-400'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(5, accuracySummary.avgAccuracyPct))}%` }}
                  />
                </div>
              </div>

              {/* Detalhes Expandidos dos 4 Pilares no Mobile */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-slate-800 space-y-2 animate-fade-in">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                    Desempenho Individual nos 4 Pilares da Apostila:
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {COMPETENCY_PILLARS.map((pillar) => {
                      const val = student.pillarScores?.[pillar] ?? student.score;
                      return (
                        <div
                          key={pillar}
                          className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-[11px]"
                        >
                          <span className="text-slate-300 truncate pr-1">{pillar}</span>
                          <strong
                            className={`font-mono-num ${
                              val >= 80
                                ? 'text-emerald-400'
                                : val >= 50
                                ? 'text-sky-400'
                                : 'text-amber-400'
                            }`}
                          >
                            {val}%
                          </strong>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Botões Touch-Friendly para Celular */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/80 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedId((prev) => (prev === student.id ? null : student.id))
                  }
                  className="min-h-[38px] px-2 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5 text-amber-400" /> Pilares
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5 text-amber-400" /> 4 Pilares
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onInspectStudent(student)}
                  className="min-h-[38px] px-2 py-1.5 rounded-xl bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer"
                >
                  <TrendingUp className="w-3.5 h-3.5" /> Histórico
                </button>

                <button
                  type="button"
                  onClick={() => onUpdateStudentScore(student)}
                  className="min-h-[38px] px-2 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                  title="Carregar meus dados e atualizar minha nota agora"
                >
                  <Play className="w-3 h-3 fill-current" /> Atualizar Nota
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
