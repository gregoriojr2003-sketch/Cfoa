import React from 'react';
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Newspaper,
  FileText,
  Sparkles,
  Shield
} from 'lucide-react';
import { DiagnosticQuestion } from '../data/presets';
import { OFFICIAL_APOSTILA_PDF_URL } from './ApostilaViewer';

interface JornalPopModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: DiagnosticQuestion | null;
  questionIndex: number;
  selectedOptionIndex?: number;
  onOpenApostilaTab?: () => void;
}

export const JornalPopModal: React.FC<JornalPopModalProps> = ({
  isOpen,
  onClose,
  question,
  questionIndex,
  selectedOptionIndex,
  onOpenApostilaTab
}) => {
  if (!isOpen || !question) return null;

  const optionLetters = ['A', 'B', 'C', 'D'];
  const isCorrect = selectedOptionIndex === question.correctIndex;
  const pageLabel = question.pageRef || 'Apostila Oficial DT-SEI (CAS PMPE 2026)';
  const pdfPage = question.pdfPageNumber || 10;
  const pdfUrlWithPage = `${OFFICIAL_APOSTILA_PDF_URL}#page=${pdfPage}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/90 backdrop-blur-md animate-in fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border-2 border-amber-400/80 rounded-2xl max-w-2xl w-full shadow-[0_0_50px_rgba(245,158,11,0.25)] overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho Estilo "Jornal Pop Oficial DT-SEI" */}
        <div className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-slate-950 px-4 sm:px-6 py-3.5 border-b-2 border-slate-950 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center shrink-0 shadow">
              <Newspaper className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="block text-[10px] font-black uppercase tracking-widest text-slate-900">
                JORNAL POP DT-SEI · BOLETIM OFICIAL DA APOSTILA (PMPE / DEIP)
              </span>
              <h3 className="font-display text-sm sm:text-base font-black text-slate-950 truncate">
                Missão 0{questionIndex + 1} · {question.topic}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-slate-950 text-amber-300 hover:bg-slate-800 text-xs font-black uppercase tracking-wider cursor-pointer shrink-0"
          >
            ✕ Fechar
          </button>
        </div>

        {/* Subcabeçalho com Destaque da Página Exata da Apostila */}
        <div className="bg-slate-950 px-4 sm:px-6 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 font-black flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              Fonte na Apostila: {pageLabel}
            </span>
          </div>
          <span className="font-mono-num text-[11px] text-amber-400 font-bold">
            Pilar: {question.pillar}
          </span>
        </div>

        {/* Corpo Rolável do Jornal Pop */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Enunciado da Questão */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Questão Avaliada no Desafio:
            </span>
            <p className="text-xs sm:text-sm font-bold text-white leading-relaxed">
              {question.stem}
            </p>
          </div>

          {/* Sua Resposta vs Resposta Certa */}
          <div className="grid grid-cols-1 gap-3">
            {selectedOptionIndex !== undefined && (
              <div
                className={`p-3.5 rounded-xl border-2 ${
                  isCorrect
                    ? 'bg-emerald-950/50 border-emerald-500/80 text-emerald-100'
                    : 'bg-rose-950/50 border-rose-500/80 text-rose-100'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                    {isCorrect ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-300">Sua Resposta (Você Acertou!)</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-rose-400" />
                        <span className="text-rose-300">Sua Resposta Marcada (Incorreta)</span>
                      </>
                    )}
                  </span>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed font-medium text-white">
                  ({optionLetters[selectedOptionIndex]}) {question.options[selectedOptionIndex]}
                </p>
              </div>
            )}

            {/* Resposta Certa (Gabarito Oficial da Apostila) */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/80 via-slate-900 to-emerald-950/60 border-2 border-emerald-400 shadow-lg space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Resposta Certa (Gabarito Oficial da Apostila)
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[11px]">
                  {pageLabel}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-black text-white leading-relaxed">
                ({optionLetters[question.correctIndex]}) {question.options[question.correctIndex]}
              </p>
            </div>
          </div>

          {/* Coluna Editorial do Jornal Pop: Trecho Literal da Página da Apostila + Explicação */}
          <div className="bg-amber-950/25 border-2 border-amber-400/50 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-amber-500/30 pb-2">
              <div className="flex items-center gap-2 text-amber-300 font-black text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Recorte Oficial da Apostila DT-SEI · {pageLabel}</span>
              </div>
              <span className="text-[11px] font-mono-num text-amber-200 font-bold">
                Pág. {pdfPage}
              </span>
            </div>

            {question.apostilaExcerpt && (
              <blockquote className="p-3 rounded-xl bg-slate-950/90 border-l-4 border-amber-400 text-xs sm:text-sm text-amber-100 italic leading-relaxed">
                {question.apostilaExcerpt}
              </blockquote>
            )}

            <div className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              <strong className="text-emerald-400 font-black uppercase tracking-wide mr-1.5">
                Síntese para Prova e Serviço:
              </strong>
              {question.explanation}
            </div>
          </div>
        </div>

        {/* Rodapé do Jornal Pop com Ações Rápidas para Ver a Página no PDF ou Apostila */}
        <div className="bg-slate-950 px-4 sm:px-6 py-3.5 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
          <div className="flex flex-col sm:flex-row gap-2">
            <a
              href={pdfUrlWithPage}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-amber-400/50 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <FileText className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Abrir PDF Oficial na Pág. {pdfPage}</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            </a>

            {onOpenApostilaTab && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenApostilaTab();
                }}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Ler Apostila no Aplicativo</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center cursor-pointer shadow-lg"
          >
            Entendido · Fechar Jornal Pop
          </button>
        </div>
      </div>
    </div>
  );
};
