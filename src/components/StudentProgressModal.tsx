import React from 'react';
import {
  X,
  TrendingUp,
  Clock,
  Flame,
  Award,
  Crown,
  Share2,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Shield,
  Sparkles,
} from 'lucide-react';
import { ClassStudentRecord, COMPETENCY_PILLARS, StudentAttemptLog } from '../data/presets';

interface StudentProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: ClassStudentRecord | null;
  onOpenShareModal?: (student: ClassStudentRecord) => void;
}

export const StudentProgressModal: React.FC<StudentProgressModalProps> = ({
  isOpen,
  onClose,
  student,
  onOpenShareModal,
}) => {
  if (!isOpen || !student) return null;

  const history: StudentAttemptLog[] =
    student.history && student.history.length > 0
      ? student.history
      : [
          {
            attemptNumber: 1,
            score: student.score,
            tier: student.tier,
            patentTitle:
              student.score >= 80
                ? 'Especialista / Gestor SEI'
                : student.score >= 50
                ? 'Operador Prático do SEI'
                : 'Soldado Recruta do SEI',
            intimacyLevel:
              student.score >= 80
                ? 'Avançado / Com Intimidade'
                : student.score >= 50
                ? 'Intermediário / Conhecimento Básico'
                : 'Iniciante / Sem Intimidade',
            completedAt: student.completedAt,
            date: new Date().toLocaleDateString('pt-BR'),
            avgTimeSec: student.avgTimeSec,
            maxStreak: student.maxStreak,
            correctCount: Math.round((student.score / 100) * 10),
            totalQuestions: 10,
            pillarScores: student.pillarScores,
          },
        ];

  const firstAttempt = history[0];
  const lastAttempt = history[history.length - 1];
  const totalAttempts = history.length;
  const scoreEvolution = lastAttempt.score - firstAttempt.score;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md overflow-y-auto no-print"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl my-auto bg-slate-900 border-2 border-emerald-600/70 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100"
      >
        {/* Cabeçalho */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-emerald-400 tracking-wider uppercase block">
                Histórico de Progresso & Evolução
              </span>
              <h3 className="font-display text-base sm:text-lg font-bold text-white">
                {student.name}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer"
            title="Fechar Janela"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Metadados e Indicadores Resumo */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block">Total de Tentativas</span>
              <span className="font-mono-num font-bold text-xl text-white">
                {totalAttempts} {totalAttempts === 1 ? 'tentativa' : 'tentativas'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block">Última Nota</span>
              <span className="font-mono-num font-bold text-xl text-emerald-400">
                {student.score} pts
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block">Evolução Geral</span>
              <span
                className={`font-mono-num font-bold text-xl ${
                  scoreEvolution > 0
                    ? 'text-emerald-400'
                    : scoreEvolution < 0
                    ? 'text-rose-400'
                    : 'text-slate-300'
                }`}
              >
                {scoreEvolution > 0 ? `+${scoreEvolution}` : scoreEvolution} pts
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block">Patente Atual</span>
              <span className="font-bold text-xs text-amber-300 block truncate mt-1">
                {student.score >= 80
                  ? '★ Especialista'
                  : student.score >= 50
                  ? '● Operador Prático'
                  : '▲ Soldado Recruta'}
              </span>
            </div>
          </div>

          {/* Timeline de Tentativas Passo a Passo */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-400" />
                Linha do Tempo das Tentativas Realizadas
              </h4>
              <span className="text-[11px] text-slate-400 font-mono-num">
                Prevalece sempre a última nota
              </span>
            </div>

            <div className="space-y-2.5">
              {history.map((att, idx) => {
                const isLast = idx === history.length - 1;
                const prevScore = idx > 0 ? history[idx - 1].score : att.score;
                const deltaFromPrev = idx > 0 ? att.score - prevScore : 0;

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border transition ${
                      isLast
                        ? 'bg-emerald-950/40 border-emerald-500/80 ring-1 ring-emerald-500/50'
                        : 'bg-slate-950/60 border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-white font-mono-num text-xs font-bold">
                          Tentativa #{att.attemptNumber || idx + 1}
                        </span>
                        <span className="text-xs text-slate-400">
                          {att.date || 'Data não registrada'} às {att.completedAt}
                        </span>
                        {isLast && (
                          <span className="text-[10px] bg-emerald-500 text-slate-950 px-2 py-0.5 rounded font-extrabold uppercase">
                            Nota Vigente
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        {idx > 0 && (
                          <span
                            className={`text-xs font-mono-num font-bold ${
                              deltaFromPrev > 0
                                ? 'text-emerald-400'
                                : deltaFromPrev < 0
                                ? 'text-rose-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {deltaFromPrev > 0 ? `+${deltaFromPrev}` : deltaFromPrev} pts
                          </span>
                        )}
                        <span className="font-mono-num font-bold text-lg text-white">
                          {att.score} pts
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300 pt-2 border-t border-slate-800/80">
                      <div>
                        <span className="text-amber-400 font-semibold mr-2">
                          {att.patentTitle ||
                            (att.score >= 80
                              ? 'Especialista / Gestor SEI'
                              : att.score >= 50
                              ? 'Operador Prático do SEI'
                              : 'Soldado Recruta do SEI')}
                        </span>
                        <span>({att.intimacyLevel || att.tier})</span>
                      </div>

                      <div className="flex items-center gap-3 font-mono-num text-slate-400 text-[11px]">
                        <span>Acertos: {att.correctCount ?? Math.round(att.score / 10)}/10</span>
                        {att.maxStreak !== undefined && <span>Combo: {att.maxStreak}x</span>}
                        {att.avgTimeSec !== undefined && <span>Tempo: {att.avgTimeSec}s/q</span>}
                      </div>
                    </div>

                    {/* Barras Rápidas dos Pilares */}
                    {att.pillarScores && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2.5 mt-2 border-t border-slate-800/60 text-[11px]">
                        {COMPETENCY_PILLARS.map((p) => (
                          <div key={p} className="flex justify-between items-center bg-slate-900/60 px-2 py-1 rounded">
                            <span className="text-slate-400 truncate mr-1" title={p}>
                              {p.split('&')[0]}
                            </span>
                            <span className="font-mono-num font-bold text-white">
                              {att.pillarScores[p] ?? 0}%
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Destaque da Escala de Intimidade SEI */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-amber-400 block">
              Escala de Classificação CAS PMPE 2026:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div
                className={`p-2.5 rounded-lg border ${
                  student.score >= 80
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <span className="font-bold block">★ Especialista (80-100 pts)</span>
                <span className="text-[11px]">Avançado / Com Intimidade</span>
              </div>
              <div
                className={`p-2.5 rounded-lg border ${
                  student.score >= 50 && student.score < 80
                    ? 'bg-sky-950/60 border-sky-500 text-sky-200'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <span className="font-bold block">● Operador (50-79 pts)</span>
                <span className="text-[11px]">Intermediário / Conhecimento Básico</span>
              </div>
              <div
                className={`p-2.5 rounded-lg border ${
                  student.score < 50
                    ? 'bg-amber-950/60 border-amber-500 text-amber-200'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <span className="font-bold block">▲ Recruta (0-49 pts)</span>
                <span className="text-[11px]">Iniciante / Sem Intimidade</span>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="bg-slate-950 p-4 border-t border-slate-800 flex items-center justify-between gap-3">
          {onOpenShareModal && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenShareModal(student);
              }}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-2 transition cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Ver Certificado de Patente & Escala</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="ml-auto min-h-[44px] px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
