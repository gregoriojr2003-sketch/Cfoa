import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  BookOpen,
  FileText,
  ArrowLeft,
  X,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  ListFilter,
  Hash,
  Bookmark,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  HelpCircle,
  ShieldCheck
} from 'lucide-react';
import {
  APOSTILA_CHAPTERS_DATA,
  APOSTILA_QUESTION_BANK,
  CHAPTER_PAGE_MAPPINGS,
  ApostilaChapterItem,
  BankQuestion
} from '../data/apostilaChapterBank';
import { PRESET_ASSESSMENTS, DiagnosticQuestion } from '../data/presets';
import { OFFICIAL_APOSTILA_PDF_URL } from './ApostilaViewer';

export type IndexEntryKind = 'chapter' | 'topic' | 'answer';

export interface ApostilaIndexEntry {
  id: string;
  indexCode: string;
  kind: IndexEntryKind;
  kindLabel: string;
  chapterId: string;
  chapterNumber: string;
  chapterTitle: string;
  pillar: string;
  pagesLabel: string;
  pdfPageNumber: number;
  pageNumbers: number[];
  title: string;
  directAnswer: string;
  detailedExplanation: string;
  apostilaExcerpt?: string;
  ficaADica?: string;
  normativeBase?: string;
  practicalExample?: string;
  questionStem?: string;
  questionOptions?: string[];
  correctOptionIndex?: number;
  keywords: string[];
  chapterData: ApostilaChapterItem;
  relatedQuestions: Array<BankQuestion | DiagnosticQuestion>;
}

interface ApostilaSearchIndexModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  onNavigateToApostilaTab?: (chapterId?: string, pdfPageNumber?: number) => void;
  onSelectEntryForInAppApostila?: (entry: ApostilaIndexEntry) => void;
  onGenerateQuestionsFromChapter?: (chapterId: string) => void;
  customChapters?: ApostilaChapterItem[];
  customQuestions?: DiagnosticQuestion[];
  customPdfUrl?: string;
  isCustomMaterialActive?: boolean;
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export const ApostilaSearchIndexModal: React.FC<ApostilaSearchIndexModalProps> = ({
  isOpen,
  onClose,
  initialQuery = '',
  onNavigateToApostilaTab,
  onSelectEntryForInAppApostila,
  onGenerateQuestionsFromChapter,
  customChapters,
  customQuestions,
  customPdfUrl,
  isCustomMaterialActive = false,
}) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'answer' | 'topic' | 'chapter'>('ALL');
  const [selectedChapterFilter, setSelectedChapterFilter] = useState<string>('ALL');
  const [activeReadingEntry, setActiveReadingEntry] = useState<ApostilaIndexEntry | null>(null);
  const [readerFontSize, setReaderFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [showEmbeddedPdfInReader, setShowEmbeddedPdfInReader] = useState(true);

  const activeChaptersList = useMemo(
    () => (customChapters && customChapters.length > 0 ? customChapters : APOSTILA_CHAPTERS_DATA),
    [customChapters]
  );
  const activePdfUrl = customPdfUrl || OFFICIAL_APOSTILA_PDF_URL;

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveReadingEntry(null);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialQuery) {
      setSearchQuery(initialQuery);
    }
  }, [initialQuery]);

  // Build complete unified Index from Chapters, Topics/KeyPoints, and Official Questions/Answers
  const allIndexEntries = useMemo<ApostilaIndexEntry[]>(() => {
    const entries: ApostilaIndexEntry[] = [];
    const presetQuestions =
      isCustomMaterialActive && customQuestions && customQuestions.length > 0
        ? customQuestions
        : PRESET_ASSESSMENTS[0]?.questions || [];

    // Helper to get all questions for a chapter
    const getChapterQuestions = (chapterId: string, ranges: Array<{ start: number; end: number }>) => {
      const bank = isCustomMaterialActive
        ? []
        : APOSTILA_QUESTION_BANK.filter((q) => q.chapterId === chapterId);
      const preset = presetQuestions.filter((pq) => {
        if (!pq.pdfPageNumber) return false;
        return ranges.some((r) => pq.pdfPageNumber! >= r.start && pq.pdfPageNumber! <= r.end);
      });
      // Deduplicate by stem
      const seenStems = new Set<string>();
      const combined: Array<BankQuestion | DiagnosticQuestion> = [];
      [...bank, ...preset].forEach((q) => {
        if (!seenStems.has(q.stem)) {
          seenStems.add(q.stem);
          combined.push(q);
        }
      });
      return combined;
    };

    let counter = 1;

    // 1. Add Chapters
    activeChaptersList.forEach((ch, chIdx) => {
      const mapping = isCustomMaterialActive
        ? undefined
        : CHAPTER_PAGE_MAPPINGS.find((m) => m.chapterId === ch.id);
      const ranges = mapping?.ranges || [{ start: chIdx * 5 + 1, end: (chIdx + 1) * 5 }];
      const pageNums: number[] = [];
      ranges.forEach((r) => {
        for (let p = r.start; p <= r.end; p++) pageNums.push(p);
      });
      const firstPage = ranges[0]?.start || (isCustomMaterialActive ? 1 : 7);
      const relatedQuestions = getChapterQuestions(ch.id, ranges);

      entries.push({
        id: `idx-chap-${ch.id}`,
        indexCode: `CAP-${String(counter++).padStart(2, '0')}`,
        kind: 'chapter',
        kindLabel: 'CAPÍTULO COMPLETO',
        chapterId: ch.id,
        chapterNumber: ch.number,
        chapterTitle: ch.title,
        pillar: ch.competencyPillar,
        pagesLabel: ch.pages,
        pdfPageNumber: firstPage,
        pageNumbers: pageNums,
        title: `${ch.number}: ${ch.title}`,
        directAnswer: ch.summary,
        detailedExplanation: ch.keyPoints.join(' • '),
        apostilaExcerpt: ch.keyPoints.map((kp, i) => `${i + 1}. ${kp}`).join('\n\n'),
        ficaADica: ch.ficaADica,
        normativeBase: ch.normativeBase,
        practicalExample: ch.practicalExample,
        keywords: [
          ch.number,
          ch.title,
          ch.pilar,
          ch.competencyPillar,
          ch.pages,
          ch.normativeBase,
          ...(mapping?.subjects || [])
        ],
        chapterData: ch,
        relatedQuestions
      });
    });

    // 2. Add Topics & Key Rules from each Chapter
    let topicCounter = 1;
    activeChaptersList.forEach((ch, chIdx) => {
      const mapping = isCustomMaterialActive
        ? undefined
        : CHAPTER_PAGE_MAPPINGS.find((m) => m.chapterId === ch.id);
      const ranges = mapping?.ranges || [{ start: chIdx * 5 + 1, end: (chIdx + 1) * 5 }];
      const pageNums: number[] = [];
      ranges.forEach((r) => {
        for (let p = r.start; p <= r.end; p++) pageNums.push(p);
      });
      const firstPage = ranges[0]?.start || (isCustomMaterialActive ? 1 : 7);
      const relatedQuestions = getChapterQuestions(ch.id, ranges);

      ch.keyPoints.forEach((kp, idx) => {
        const subjectTitle =
          mapping?.subjects?.[idx] ||
          kp.split(':')[0]?.slice(0, 75) ||
          `Tópico ${idx + 1} — ${ch.number}`;

        entries.push({
          id: `idx-top-${ch.id}-${idx}`,
          indexCode: `TOP-${String(topicCounter++).padStart(2, '0')}`,
          kind: 'topic',
          kindLabel: 'TÓPICO & REGRA DA APOSTILA',
          chapterId: ch.id,
          chapterNumber: ch.number,
          chapterTitle: ch.title,
          pillar: ch.competencyPillar,
          pagesLabel: ch.pages,
          pdfPageNumber: firstPage,
          pageNumbers: pageNums,
          title: subjectTitle,
          directAnswer: kp,
          detailedExplanation: `${ch.summary}\n\nBase Normativa: ${ch.normativeBase}`,
          apostilaExcerpt: kp,
          ficaADica: ch.ficaADica,
          normativeBase: ch.normativeBase,
          practicalExample: ch.practicalExample,
          keywords: [subjectTitle, kp, ch.number, ch.pages, ch.title, ch.ficaADica],
          chapterData: ch,
          relatedQuestions
        });
      });
    });

    // 3. Add Official Answers from Question Bank & Preset Questions
    let ansCounter = 1;
    const seenQuestionStems = new Set<string>();

    const allQuestions: Array<{
      q: BankQuestion | DiagnosticQuestion;
      chapterId: string;
      pageNumbers: number[];
    }> = [];

    if (!isCustomMaterialActive) {
      APOSTILA_QUESTION_BANK.forEach((bq) => {
        seenQuestionStems.add(bq.stem);
        allQuestions.push({
          q: bq,
          chapterId: bq.chapterId,
          pageNumbers: bq.pageNumbers || [bq.pdfPageNumber || 1]
        });
      });
    }

    presetQuestions.forEach((pq, pqIdx) => {
      if (seenQuestionStems.has(pq.stem)) return;
      seenQuestionStems.add(pq.stem);
      const pg = pq.pdfPageNumber || (isCustomMaterialActive ? pqIdx + 1 : 7);
      const matchedMapping = isCustomMaterialActive
        ? undefined
        : CHAPTER_PAGE_MAPPINGS.find((m) =>
            m.ranges.some((r) => pg >= r.start && pg <= r.end)
          );
      const fallbackChap = activeChaptersList[pqIdx % Math.max(1, activeChaptersList.length)] || activeChaptersList[0];
      allQuestions.push({
        q: pq,
        chapterId: matchedMapping?.chapterId || fallbackChap.id,
        pageNumbers: [pg]
      });
    });

    allQuestions.forEach(({ q, chapterId, pageNumbers }) => {
      const ch =
        activeChaptersList.find((c) => c.id === chapterId) || activeChaptersList[0];
      const mapping = isCustomMaterialActive
        ? undefined
        : CHAPTER_PAGE_MAPPINGS.find((m) => m.chapterId === ch.id);
      const ranges = mapping?.ranges || [{ start: 1, end: 10 }];
      const relatedQuestions = getChapterQuestions(ch.id, ranges);
      const correctText = q.options[q.correctIndex] || '';
      const exactPage = q.pdfPageNumber || pageNumbers[0] || 1;
      const pagesLabel = q.pageRef || `Pág. ${exactPage} (${ch.pages})`;

      entries.push({
        id: `idx-ans-${q.id}`,
        indexCode: `RESP-${String(ansCounter++).padStart(2, '0')}`,
        kind: 'answer',
        kindLabel: 'RESPOSTA OFICIAL DA APOSTILA',
        chapterId: ch.id,
        chapterNumber: ch.number,
        chapterTitle: ch.title,
        pillar: q.pillar,
        pagesLabel,
        pdfPageNumber: exactPage,
        pageNumbers,
        title: `${q.topic} (${pagesLabel})`,
        directAnswer: correctText,
        detailedExplanation: q.explanation,
        apostilaExcerpt: q.apostilaExcerpt || ch.summary,
        ficaADica: ch.ficaADica,
        normativeBase: ch.normativeBase,
        practicalExample: ch.practicalExample,
        questionStem: q.stem,
        questionOptions: q.options,
        correctOptionIndex: q.correctIndex,
        keywords: [
          q.topic,
          q.stem,
          correctText,
          q.explanation,
          pagesLabel,
          `pág ${exactPage}`,
          `pagina ${exactPage}`,
          ch.number,
          ch.title,
          ...('keywords' in q ? q.keywords : [])
        ],
        chapterData: ch,
        relatedQuestions
      });
    });

    return entries;
  }, [activeChaptersList, customQuestions, isCustomMaterialActive]);

  // Filter entries by search query, category filter, and chapter filter
  const filteredEntries = useMemo(() => {
    const rawQuery = searchQuery.trim();
    const normQuery = normalizeText(rawQuery);

    // Check if user searched for a specific page number like "46", "pag 46", "página 38"
    const pageMatch = normQuery.match(/^(?:pag(?:ina)?s?\.?\s*)?(\d{1,2})$/);
    const searchedPageNum = pageMatch ? parseInt(pageMatch[1], 10) : null;

    return allIndexEntries.filter((entry) => {
      if (categoryFilter !== 'ALL' && entry.kind !== categoryFilter) return false;
      if (selectedChapterFilter !== 'ALL' && entry.chapterId !== selectedChapterFilter) {
        return false;
      }

      if (!normQuery) return true;

      if (searchedPageNum !== null) {
        if (
          entry.pdfPageNumber === searchedPageNum ||
          entry.pageNumbers.includes(searchedPageNum) ||
          normalizeText(entry.pagesLabel).includes(String(searchedPageNum))
        ) {
          return true;
        }
      }

      const searchableBlob = normalizeText(
        [
          entry.indexCode,
          entry.title,
          entry.directAnswer,
          entry.detailedExplanation,
          entry.apostilaExcerpt || '',
          entry.ficaADica || '',
          entry.normativeBase || '',
          entry.practicalExample || '',
          entry.questionStem || '',
          entry.chapterNumber,
          entry.chapterTitle,
          entry.pagesLabel,
          entry.pillar,
          ...entry.keywords
        ].join(' ')
      );

      // Support multi-word search where all terms match
      const terms = normQuery.split(/\s+/).filter(Boolean);
      return terms.every((term) => searchableBlob.includes(term));
    });
  }, [allIndexEntries, searchQuery, categoryFilter, selectedChapterFilter]);

  // Quick search suggestions for 1-tap mobile testing
  const quickSearchSuggestions = [
    '2FA gov.br',
    'Bloco de Assinatura',
    'Restrito vs Sigiloso',
    'Sobrestamento',
    'Anexação vs Relacionamento',
    'Exclusão vs Cancelamento',
    'Caneta Preta / Amarela',
    'OCR 300 dpi',
    'Ciência no Processo',
    'Pág 38',
    'Pág 46',
    'Pág 65'
  ];

  if (!isOpen) return null;

  const fontSizeClass =
    readerFontSize === 'xlarge'
      ? 'text-base sm:text-lg leading-relaxed'
      : readerFontSize === 'large'
      ? 'text-sm sm:text-base leading-relaxed'
      : 'text-xs sm:text-sm leading-relaxed';

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border-2 border-emerald-500/70 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-[0_0_50px_rgba(16,185,129,0.25)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* =====================================================================
            MODO 1: JANELA FLUTUANTE DE LEITURA (QUANDO O ALUNO CLICA NUM RESULTADO)
           ===================================================================== */}
        {activeReadingEntry ? (
          <div className="flex flex-col h-full max-h-[92vh] overflow-hidden">
            {/* Barra Superior Fixa da Janela Flutuante com Botão VOLTAR AOS RESULTADOS */}
            <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 border-b border-emerald-500/50 px-3.5 sm:px-5 py-3 flex items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setActiveReadingEntry(null);
                  setShowEmbeddedPdfInReader(false);
                }}
                className="min-h-[42px] px-3.5 sm:px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
                <span>VOLTAR AOS RESULTADOS</span>
              </button>

              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Controles de Fonte para Leitura no Celular */}
                <button
                  type="button"
                  onClick={() =>
                    setReaderFontSize((prev) =>
                      prev === 'xlarge' ? 'large' : prev === 'large' ? 'normal' : 'normal'
                    )
                  }
                  title="Diminuir fonte de leitura"
                  className="h-9 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">A-</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setReaderFontSize((prev) =>
                      prev === 'normal' ? 'large' : prev === 'large' ? 'xlarge' : 'xlarge'
                    )
                  }
                  title="Aumentar fonte de leitura"
                  className="h-9 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">A+</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="h-9 px-2.5 rounded-lg bg-slate-800 hover:bg-rose-950/80 border border-slate-700 hover:border-rose-500/50 text-slate-300 hover:text-rose-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  title="Fechar Janela"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Corpo Rolável de Leitura Completa */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              {/* Cabeçalho de Identificação no Index */}
              <div className="bg-slate-950/90 border border-emerald-500/40 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md bg-amber-400 text-slate-950 font-mono-num text-[11px] font-black uppercase">
                    ÍNDICE #{activeReadingEntry.indexCode}
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-black uppercase">
                    {activeReadingEntry.kindLabel}
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-amber-300 font-mono-num text-[11px] font-bold">
                    {activeReadingEntry.chapterNumber} · {activeReadingEntry.pagesLabel}
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300 text-[11px] font-semibold">
                    Pilar: {activeReadingEntry.pillar}
                  </span>
                </div>

                <h2 className="text-lg sm:text-2xl font-black text-white leading-snug">
                  {activeReadingEntry.title}
                </h2>

                <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2">
                  <span>
                    Capítulo de Referência:{' '}
                    <strong className="text-slate-200">
                      {activeReadingEntry.chapterNumber} — {activeReadingEntry.chapterTitle}
                    </strong>
                  </span>
                  <span>·</span>
                  <span>
                    Página Exata no PDF:{' '}
                    <strong className="text-amber-300">
                      Pág. {activeReadingEntry.pdfPageNumber}
                    </strong>
                  </span>
                </div>
              </div>

              {/* SE FOR UMA QUESTÃO/RESPOSTA: Enunciado + Resposta Certa Destacada */}
              {activeReadingEntry.questionStem && (
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-400">
                    <HelpCircle className="w-4 h-4 shrink-0" />
                    <span>Pergunta de Sondagem Relacionada na Apostila:</span>
                  </div>
                  <p className={`text-slate-200 font-medium ${fontSizeClass}`}>
                    {activeReadingEntry.questionStem}
                  </p>

                  {activeReadingEntry.questionOptions && (
                    <div className="space-y-2 pt-2">
                      {activeReadingEntry.questionOptions.map((opt, idx) => {
                        const isCorrect = idx === activeReadingEntry.correctOptionIndex;
                        return (
                          <div
                            key={idx}
                            className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                              isCorrect
                                ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-100 font-bold'
                                : 'bg-slate-900/60 border-slate-800/80 text-slate-400'
                            } ${fontSizeClass}`}
                          >
                            <span
                              className={`w-6 h-6 rounded-lg font-mono-num text-xs font-black flex items-center justify-center shrink-0 mt-0.5 ${
                                isCorrect
                                  ? 'bg-emerald-500 text-slate-950'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <div className="flex-1">
                              <span>{opt}</span>
                              {isCorrect && (
                                <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500 text-slate-950 text-[10px] font-black uppercase">
                                  ✓ Resposta Certa ({activeReadingEntry.pagesLabel})
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* RESPOSTA DIRETA / FUNDAMENTAÇÃO TÉCNICA DA APOSTILA */}
              <div className="bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-900 border-2 border-emerald-500/60 rounded-2xl p-4 sm:p-5 space-y-3 shadow-lg">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    Resposta Oficial & Síntese da Apostila ({activeReadingEntry.pagesLabel})
                  </span>
                </div>

                <div
                  className={`p-3.5 rounded-xl bg-slate-950/90 border border-emerald-500/30 text-white font-semibold ${fontSizeClass}`}
                >
                  {activeReadingEntry.directAnswer}
                </div>

                <div className={`text-slate-200 space-y-2 ${fontSizeClass}`}>
                  <strong className="text-amber-300 block text-xs uppercase tracking-wider">
                    Explicação Técnica / Fundamentação:
                  </strong>
                  <p className="whitespace-pre-line">{activeReadingEntry.detailedExplanation}</p>
                </div>

                {activeReadingEntry.apostilaExcerpt && (
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border-l-4 border-amber-400 text-slate-200 space-y-1">
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-300 block">
                      Trecho Literal da Apostila DT-SEI ({activeReadingEntry.pagesLabel}):
                    </span>
                    <p className={`italic text-slate-100 whitespace-pre-line ${fontSizeClass}`}>
                      {activeReadingEntry.apostilaExcerpt}
                    </p>
                  </div>
                )}
              </div>

              {/* LEITURA COMPLETA DO CAPÍTULO / MÓDULO CORRESPONDENTE */}
              <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 block">
                      Leitura Integral do Tópico e Capítulo
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-white">
                      {activeReadingEntry.chapterData.number} — {activeReadingEntry.chapterData.title} (
                      {activeReadingEntry.chapterData.pages})
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300 font-semibold">
                    {activeReadingEntry.chapterData.normativeBase}
                  </span>
                </div>

                <p className={`text-slate-300 bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 ${fontSizeClass}`}>
                  {activeReadingEntry.chapterData.summary}
                </p>

                <div className="space-y-2.5">
                  <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    Todos os Pontos-Chave deste Capítulo na Apostila:
                  </h4>
                  <ul className="space-y-2">
                    {activeReadingEntry.chapterData.keyPoints.map((kp, i) => (
                      <li
                        key={i}
                        className={`flex items-start gap-2.5 bg-slate-900/90 p-3 rounded-xl border border-slate-800/80 text-slate-200 ${fontSizeClass}`}
                      >
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span>{kp}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* #FICAADICA */}
                {activeReadingEntry.ficaADica && (
                  <div className={`p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-200 ${fontSizeClass}`}>
                    <strong className="text-amber-300 block mb-1 font-black uppercase tracking-wide text-xs">
                      💡 Destaque Oficial da Apostila (#FICAADICA):
                    </strong>
                    {activeReadingEntry.ficaADica}
                  </div>
                )}

                {/* Aplicação Prática PMPE */}
                {activeReadingEntry.practicalExample && (
                  <div className={`p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-100 ${fontSizeClass}`}>
                    <strong className="text-emerald-300 block mb-1 font-black uppercase tracking-wide text-xs">
                      🚓 Aplicação Prática na PMPE:
                    </strong>
                    {activeReadingEntry.practicalExample}
                  </div>
                )}
              </div>

              {/* OUTRAS RESPOSTAS DA APOSTILA NESTE MESMO CAPÍTULO */}
              {activeReadingEntry.relatedQuestions.length > 0 && (
                <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
                  <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-300 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-amber-400" />
                    Gabarito Rápido de Questões deste Capítulo ({activeReadingEntry.chapterNumber})
                  </h4>
                  <div className="space-y-2.5">
                    {activeReadingEntry.relatedQuestions.map((rq, idx) => (
                      <div
                        key={rq.id || idx}
                        className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-black text-emerald-300">
                            {idx + 1}. {rq.topic}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-mono-num text-[11px] font-bold">
                            {rq.pageRef || activeReadingEntry.pagesLabel}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300">{rq.stem}</p>
                        <div className="p-2.5 rounded-lg bg-emerald-950/50 border border-emerald-600/40 text-xs text-emerald-200 font-bold">
                          ✓ Resposta Correta: {rq.options[rq.correctIndex]}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Visualizador da Página no PDF Oficial (Opcional sob demanda) */}
              <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-amber-400" />
                      Consultar Folha Original no PDF (Pág. {activeReadingEntry.pdfPageNumber})
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Visualize a página diretamente no documento PDF oficial da Apostila DT-SEI
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowEmbeddedPdfInReader((prev) => !prev)}
                      className="min-h-[38px] px-3.5 py-2 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/50 text-amber-300 text-xs font-black cursor-pointer transition"
                    >
                      {showEmbeddedPdfInReader
                        ? 'Ocultar Visualizador PDF'
                        : `Ver Pág. ${activeReadingEntry.pdfPageNumber} no PDF Aqui`}
                    </button>
                    <a
                      href={`${activePdfUrl}#page=${activeReadingEntry.pdfPageNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[38px] px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                      <span>Abrir PDF Tela Cheia</span>
                    </a>
                  </div>
                </div>

                {showEmbeddedPdfInReader && (
                  <div className="w-full h-[55vh] min-h-[360px] rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
                    <iframe
                      src={`${activePdfUrl}#page=${activeReadingEntry.pdfPageNumber}`}
                      title={`Apostila PDF Página ${activeReadingEntry.pdfPageNumber}`}
                      className="w-full h-full border-0"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Rodapé Fixo da Janela Flutuante com Botão VOLTAR AOS RESULTADOS */}
            <div className="bg-slate-950 border-t border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setActiveReadingEntry(null);
                  setShowEmbeddedPdfInReader(false);
                }}
                className="flex-1 sm:flex-initial min-h-[46px] px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer transition"
              >
                <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
                <span>VOLTAR AOS RESULTADOS DA PESQUISA</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {onGenerateQuestionsFromChapter && (
                  <button
                    type="button"
                    onClick={() => {
                      onGenerateQuestionsFromChapter(activeReadingEntry.chapterId);
                      onClose();
                    }}
                    className="flex-1 sm:flex-initial min-h-[44px] px-4 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/50 text-sky-200 text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-sky-300" />
                    <span>Praticar este Capítulo</span>
                  </button>
                )}
                {onNavigateToApostilaTab && (
                  <button
                    type="button"
                    onClick={() => {
                      onNavigateToApostilaTab(activeReadingEntry.chapterId);
                      onClose();
                    }}
                    className="flex-1 sm:flex-initial min-h-[44px] px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Ir à Aba Apostila</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* =====================================================================
              MODO 2: CAMPO DE PESQUISA + RESULTADOS EM FORMATO INDEX
             ===================================================================== */
          <div className="flex flex-col h-full max-h-[92vh] overflow-hidden">
            {/* Cabeçalho da Busca Indexada */}
            <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 border-b border-emerald-500/40 p-4 sm:p-5 space-y-3.5 shrink-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-300 shrink-0 shadow-inner">
                    <Search className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                        ÍNDICE REMISSIVO DA APOSTILA
                      </span>
                      <span className="text-[11px] text-emerald-300 font-semibold hidden sm:inline">
                        {activeChaptersList.length} Módulos Ativos
                      </span>
                    </div>
                    <h2 className="text-base sm:text-xl font-black text-white leading-tight mt-0.5">
                      Pesquisa Indexada na Apostila (Tópicos, Páginas, Capítulos e Respostas)
                    </h2>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline">Fechar</span>
                </button>
              </div>

              {/* Campo de Pesquisa em Destaque */}
              <div className="relative">
                <Search className="w-5 h-5 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Digite o assunto, palavra-chave, capítulo ou página (ex: Bloco, 2FA, Sigiloso, Pág 46, Cancelamento)..."
                  className="w-full min-h-[50px] pl-11 pr-24 py-3 rounded-xl bg-slate-950 border-2 border-emerald-500/60 focus:border-amber-400 text-sm sm:text-base text-white placeholder:text-slate-400 outline-none shadow-inner"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      searchInputRef.current?.focus();
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                  >
                    Limpar
                  </button>
                )}
              </div>

              {/* Sugestões Rápidas (1 Toque no Celular) */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                <span className="text-[11px] text-slate-400 font-semibold whitespace-nowrap mr-1">
                  Busca rápida:
                </span>
                {quickSearchSuggestions.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setSearchQuery(sug)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition cursor-pointer border ${
                      normalizeText(searchQuery) === normalizeText(sug)
                        ? 'bg-amber-400 text-slate-950 border-amber-200 font-black'
                        : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border-slate-700/80'
                    }`}
                  >
                    {sug}
                  </button>
                ))}
              </div>

              {/* Filtros de Tipo de Índice + Filtro de Capítulo */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('ALL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black whitespace-nowrap cursor-pointer transition ${
                      categoryFilter === 'ALL'
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    📑 Índice Completo ({allIndexEntries.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('answer')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition ${
                      categoryFilter === 'answer'
                        ? 'bg-emerald-500 text-slate-950 font-black'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    ✅ Respostas & Gabaritos
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('topic')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition ${
                      categoryFilter === 'topic'
                        ? 'bg-emerald-500 text-slate-950 font-black'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    📌 Tópicos & Regras
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('chapter')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition ${
                      categoryFilter === 'chapter'
                        ? 'bg-emerald-500 text-slate-950 font-black'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    📘 Capítulos ({activeChaptersList.length})
                  </button>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <ListFilter className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
                  <select
                    value={selectedChapterFilter}
                    onChange={(e) => setSelectedChapterFilter(e.target.value)}
                    aria-label="Filtrar por Capítulo da Apostila"
                    className="h-8 px-2.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 font-semibold focus:outline-none focus:border-emerald-400"
                  >
                    <option value="ALL">Todos os Capítulos ({activeChaptersList.length})</option>
                    {activeChaptersList.map((ch) => (
                      <option key={ch.id} value={ch.id}>
                        {ch.number} ({ch.pages})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Contador de Resultados no Formato Index */}
            <div className="bg-slate-950/90 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-xs text-slate-400 shrink-0">
              <span>
                Relacionando{' '}
                <strong className="text-emerald-400 font-mono-num">
                  {filteredEntries.length}
                </strong>{' '}
                resultado(s) no <strong className="text-slate-200">Formato Index</strong>
                {searchQuery.trim() ? ` para "${searchQuery.trim()}"` : ''}
              </span>
              <span className="text-[11px] text-amber-300 font-semibold">
                Clique em qualquer resultado para abrir direto na Apostila do App →
              </span>
            </div>

            {/* Lista de Resultados em FORMATO INDEX */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
              {filteredEntries.length === 0 ? (
                <div className="text-center py-12 px-4 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
                    <Search className="w-6 h-6" />
                  </div>
                  <p className="text-sm sm:text-base font-bold text-white">
                    Nenhum tópico, página ou resposta encontrado para "{searchQuery}"
                  </p>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Tente buscar por termos da Apostila DT-SEI como{' '}
                    <strong className="text-slate-200">
                      2FA, SIP, Sigiloso, Restrito, Bloco, Sobrestamento, Anexação, Caneta Preta, Pág 38
                    </strong>{' '}
                    ou limpe o filtro.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setCategoryFilter('ALL');
                      setSelectedChapterFilter('ALL');
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs cursor-pointer"
                  >
                    Mostrar Índice Completo da Apostila
                  </button>
                </div>
              ) : (
                filteredEntries.map((item, idx) => {
                  const badgeStyle =
                    item.kind === 'answer'
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : item.kind === 'chapter'
                      ? 'bg-amber-400/20 border-amber-400/50 text-amber-300'
                      : 'bg-sky-500/20 border-sky-500/50 text-sky-300';

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        if (onSelectEntryForInAppApostila) {
                          onSelectEntryForInAppApostila(item);
                          onClose();
                        } else {
                          setActiveReadingEntry(item);
                          setShowEmbeddedPdfInReader(true);
                        }
                      }}
                      className="w-full text-left bg-slate-950/90 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/60 rounded-xl p-3.5 sm:p-4 transition-all cursor-pointer group flex items-start justify-between gap-3 shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        {/* Coluna Numérica do INDEX */}
                        <div className="flex flex-col items-center justify-center px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 group-hover:border-emerald-500/50 shrink-0 min-w-[54px]">
                          <span className="font-mono-num text-[10px] text-slate-400 font-bold uppercase">
                            INDEX
                          </span>
                          <span className="font-mono-num text-xs sm:text-sm font-black text-amber-400">
                            #{String(idx + 1).padStart(2, '0')}
                          </span>
                        </div>

                        {/* Dados Indexados: Capítulo, Página, Tópico e Resposta */}
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded border text-[10px] font-black uppercase tracking-wider ${badgeStyle}`}
                            >
                              {item.kindLabel}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-200 font-mono-num text-[10px] font-bold flex items-center gap-1">
                              <Bookmark className="w-2.5 h-2.5 text-emerald-400" />
                              {item.chapterNumber}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-amber-400/15 border border-amber-400/40 text-amber-300 font-mono-num text-[10px] font-black flex items-center gap-1">
                              <Hash className="w-2.5 h-2.5" />
                              {item.pagesLabel}
                            </span>
                          </div>

                          <h3 className="text-xs sm:text-sm font-black text-white group-hover:text-emerald-300 transition-colors leading-snug">
                            {item.title}
                          </h3>

                          {item.questionStem && (
                            <p className="text-[11px] text-slate-400 line-clamp-1">
                              <strong className="text-slate-300">Questão:</strong> {item.questionStem}
                            </p>
                          )}

                          <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed bg-slate-900/70 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
                            <strong className="text-emerald-400 font-bold mr-1">
                              {item.kind === 'answer' ? '✓ Resposta:' : '▸ Conteúdo:'}
                            </strong>
                            {item.directAnswer}
                          </p>
                        </div>
                      </div>

                      {/* Botão Indicador de Remeter para a Apostila no App */}
                      <div className="self-center shrink-0 flex items-center gap-1 px-2.5 py-2 rounded-xl bg-emerald-500/15 group-hover:bg-emerald-500 text-emerald-300 group-hover:text-slate-950 border border-emerald-500/30 font-black text-[11px] transition-all">
                        <BookOpen className="w-3.5 h-3.5 shrink-0" />
                        <span className="hidden sm:inline">Ver na Apostila</span>
                        <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Rodapé do Index */}
            <div className="bg-slate-950 border-t border-slate-800 px-4 py-2.5 flex items-center justify-between gap-2 text-[11px] text-slate-400 shrink-0">
              <span>
                Apostila Oficial DT-SEI · CAS PMPE 2026 · 1º SGT PM GREGÓRIO (DEIP)
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold cursor-pointer"
              >
                Fechar Pesquisa
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
