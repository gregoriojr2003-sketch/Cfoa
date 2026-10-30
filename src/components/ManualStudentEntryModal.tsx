import React, { useState } from 'react';
import { UserPlus, X, CheckCircle2, Shield, Clock } from 'lucide-react';
import {
  ClassStudentRecord,
  MILITARY_RANKS,
  PMPE_UNITS,
  StudentAttemptLog,
} from '../data/presets';
import { buildCanonicalStudentId, isValidGmailAddress } from '../firebase';

interface ManualStudentEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveStudent: (student: ClassStudentRecord) => void;
}

export const ManualStudentEntryModal: React.FC<ManualStudentEntryModalProps> = ({
  isOpen,
  onClose,
  onSaveStudent,
}) => {
  const [rank, setRank] = useState('1º SGT PM');
  const [warName, setWarName] = useState('');
  const [registration, setRegistration] = useState('');
  const [cohort, setCohort] = useState('1º BPM');
  const [score, setScore] = useState<number>(80);
  const [accessTime, setAccessTime] = useState(() =>
    new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanWar = warName.trim().toUpperCase();
    if (!cleanWar) {
      setErrorMsg('Informe o Nome de Guerra do militar para incluí-lo no Resultado Geral.');
      return;
    }

    const cleanReg = registration.trim().toLowerCase();
    if (!isValidGmailAddress(cleanReg)) {
      setErrorMsg('Informe uma conta de e-mail válida terminada em @gmail.com.');
      return;
    }

    const fullName = `${rank} ${cleanWar}`.trim();
    const safeScore = Math.min(100, Math.max(0, Math.round(Number(score) || 0)));
    const tier: 'Iniciante' | 'Intermediário' | 'Avançado' =
      safeScore >= 80 ? 'Avançado' : safeScore >= 50 ? 'Intermediário' : 'Iniciante';
    const patentTitle =
      safeScore >= 80
        ? 'Oficial de Administração (CFOA)'
        : safeScore >= 50
        ? 'Candidato em Evolução'
        : 'Praça em Preparação';
    const intimacyLevel =
      safeScore >= 80
        ? 'Avançado / Alto Rendimento'
        : safeScore >= 50
        ? 'Intermediário / Conhecimento Básico'
        : 'Iniciante / Base Inicial';

    const cleanTime =
      accessTime.trim() ||
      new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const dateStr = new Date().toLocaleDateString('pt-BR');

    const attempt: StudentAttemptLog = {
      attemptNumber: 1,
      score: safeScore,
      tier,
      patentTitle,
      intimacyLevel,
      completedAt: cleanTime,
      date: dateStr,
      avgTimeSec: 10,
      maxStreak: Math.max(1, Math.round(safeScore / 10)),
      correctCount: Math.round(safeScore / 10),
      totalQuestions: 10,
      pillarScores: {
        'Legislação PM & Regime Disciplinar': safeScore,
        'Direito Penal & Processual Militar': safeScore,
        'Direito Constitucional & Administrativo': safeScore,
        'Administração & Conhecimentos Gerais': safeScore,
      },
    };

    const docId = buildCanonicalStudentId(fullName, cohort, cleanReg);
    const newRecord: ClassStudentRecord = {
      id: docId,
      name: fullName,
      registration: cleanReg,
      cohort,
      score: safeScore,
      tier,
      enrolledAt: cleanTime,
      completedAt: cleanTime,
      status: 'Concluído',
      progressQuestions: 10,
      totalQuestionsCount: 10,
      updatedAtMs: Date.now(),
      avgTimeSec: 10,
      maxStreak: attempt.maxStreak,
      pillarScores: attempt.pillarScores,
      attemptsCount: 1,
      history: [attempt],
      mode: 'Oficial',
    };

    onSaveStudent(newRecord);
    setWarName('');
    setRegistration('');
    setErrorMsg(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border-2 border-emerald-500/70 rounded-2xl p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-300 shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                Regularização & Inclusão Direta no Banco em Nuvem
              </span>
              <h3 className="text-base sm:text-lg font-black text-white leading-snug">
                Incluir / Regularizar Aluno no Resultado Geral
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Caso algum militar tenha realizado o teste antes da sincronização em nuvem ou em modo offline, registre os dados abaixo (incluindo sua conta <strong>@gmail.com</strong>) para elencá-lo imediatamente no <strong>Resultado Geral e Gráficos das Unidades</strong>.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Graduação / Patente
              </label>
              <select
                value={rank}
                onChange={(e) => setRank(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-amber-300 font-bold focus:outline-none focus:border-emerald-500"
              >
                {MILITARY_RANKS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Nome de Guerra do Aluno <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={warName}
                onChange={(e) => {
                  setWarName(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="Ex.: SILVA, SANTOS, CARLOS EDUARDO..."
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                autoFocus
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                UNIDADE <span className="text-rose-400">* (obrigatório)</span>
              </label>
              <select
                value={cohort}
                onChange={(e) => setCohort(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-white font-semibold focus:outline-none focus:border-emerald-500"
              >
                {PMPE_UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Conta de E-mail GMAIL <span className="text-rose-400">* (obrigatório)</span>
              </label>
              <input
                type="email"
                required
                value={registration}
                onChange={(e) => {
                  setRegistration(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="Ex.: militar.pmpe@gmail.com"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Nota Obtida (0 a 100 pts)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                step={5}
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-emerald-400 font-mono-num font-black focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Horário do Acesso (HH:MM)
              </label>
              <input
                type="text"
                value={accessTime}
                onChange={(e) => setAccessTime(e.target.value)}
                placeholder="Ex.: 16:30"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-amber-300 font-mono-num font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-400 font-semibold bg-rose-950/40 border border-rose-800/60 p-2.5 rounded-xl">
              {errorMsg}
            </p>
          )}

          <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs sm:text-sm font-black flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>Salvar no Resultado Geral</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
