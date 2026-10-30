import React, { useRef, useState } from 'react';
import {
  Share2,
  Download,
  Copy,
  Check,
  X,
  Trophy,
  Award,
  Crown,
  Shield,
  Zap,
  Flame,
  CheckCircle2,
  Calendar,
  Building2,
  User,
  Sparkles,
} from 'lucide-react';
import { CompetencyPillar, COMPETENCY_PILLARS, StudentAttemptLog } from '../data/presets';
import { AchievementBadge } from '../utils/achievements';

interface ShareRankModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  registration?: string;
  cohort: string;
  score: number;
  totalQuestions?: number;
  correctCount?: number;
  maxStreak?: number;
  avgTimeSec?: number;
  pillarScores: Record<CompetencyPillar, number>;
  patentTitle: string;
  intimacyLevel: string;
  tierShort: 'Iniciante' | 'Intermediário' | 'Avançado';
  unlockedBadges?: AchievementBadge[] | string[];
  history?: StudentAttemptLog[];
}

export const ShareRankModal: React.FC<ShareRankModalProps> = ({
  isOpen,
  onClose,
  studentName,
  registration,
  cohort,
  score,
  totalQuestions = 10,
  correctCount = Math.round((score / 100) * totalQuestions),
  maxStreak,
  avgTimeSec,
  pillarScores,
  patentTitle,
  intimacyLevel,
  tierShort,
  unlockedBadges = [],
  history = [],
}) => {
  const [copiedText, setCopiedText] = useState(false);
  const [isGeneratingPng, setIsGeneratingPng] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const currentDate = new Date().toLocaleDateString('pt-BR');
  const currentTime = new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Identificar nomes das badges desbloqueadas
  const badgeNames = unlockedBadges.map((b) =>
    typeof b === 'string' ? b : `${b.title} (${b.englishTag})`
  );

  // Histórico de evolução se houver mais de 1 tentativa
  const attemptsCount = history.length > 0 ? history.length : 1;
  const initialAttempt = history[0];
  const scoreEvolution =
    initialAttempt && attemptsCount > 1 ? score - initialAttempt.score : 0;

  // Formatação do texto militar para compartilhamento no WhatsApp / Redes
  const generateShareText = () => {
    const lines = [
      '🎖️ *CFOA PMPE - TUTOR: 1ºSGT PM GREGÓRIO*',
      '📋 *CERTIFICADO DE SONDAGEM DIAGNÓSTICA CFOA*',
      '⚖️ *BASE LEGAL: PORTAL ALEPE (https://legis.alepe.pe.gov.br/)*',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      `👤 *Militar:* ${studentName}`,
      registration ? `📧 *E-mail Gmail:* ${registration}` : '',
      `🎖️ *Unidade:* ${cohort}`,
      `📅 *Data de Conclusão:* ${currentDate} às ${currentTime}`,
      '',
      `🎯 *PONTUAÇÃO FINAL:* ${score} / 100 PONTOS (${correctCount}/${totalQuestions} missões)`,
      `⭐ *CLASSIFICAÇÃO:* ${patentTitle.toUpperCase()}`,
      `📊 *NÍVEL DE APTIDÃO:* ${intimacyLevel}`,
      attemptsCount > 1
        ? `📈 *Progresso na Operação:* ${attemptsCount} tentativas realizadas (Evolução: ${
            scoreEvolution >= 0 ? `+${scoreEvolution}` : scoreEvolution
          } pts)`
        : '',
      '',
      '📌 *ESCALA DE APTIDÃO PARA O CFOA PMPE:*',
      score >= 80
        ? '▶ [X] 80 a 100 pts: Apto / Avançado (Domínio Pleno das Leis ALEPE e Doutrina Militar)'
        : '   [ ] 80 a 100 pts: Apto / Avançado (Domínio Pleno das Leis ALEPE e Doutrina Militar)',
      score >= 50 && score < 80
        ? '▶ [X] 50 a 79 pts: Em Aperfeiçoamento (Intermediário / Conhecimento Operacional)'
        : '   [ ] 50 a 79 pts: Em Aperfeiçoamento (Intermediário / Conhecimento Operacional)',
      score < 50
        ? '▶ [X] 0 a 49 pts: Nível Inicial (Iniciante / Requer Revisão das Normas e Leis)'
        : '   [ ] 0 a 49 pts: Nível Inicial (Iniciante / Requer Revisão das Normas e Leis)',
      '',
      '📚 *DOMÍNIO NOS 4 PILARES DO CFOA PMPE:*',
      ...COMPETENCY_PILLARS.map((p) => `• ${p}: ${pillarScores[p] ?? 0}%`),
      '',
      badgeNames.length > 0
        ? `🏆 *Insígnias Conquistadas:* ${badgeNames.slice(0, 4).join(', ')}`
        : '',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '*IMPORTHOUR© - todos os direitos reservados',
    ]
      .filter(Boolean)
      .join('\n');

    return lines;
  };

  const handleCopyText = async () => {
    const text = generateShareText();
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleShareWhatsApp = () => {
    const text = generateShareText();
    const encoded = encodeURIComponent(text);
    const url = `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'CAS 2026 - DT-SEI - INST. 1ºSGT PM GREGÓRIO',
          text: generateShareText(),
        });
      } catch (e) {
        // User cancelled or unsupported
      }
    } else {
      handleCopyText();
    }
  };

  // Renderizar e Baixar Imagem PNG em Alta Resolução via Canvas 2D
  const handleDownloadPng = () => {
    setIsGeneratingPng(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 920;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Fundo Tático Gradiente Escuro
      const bgGrad = ctx.createLinearGradient(0, 0, 1200, 920);
      bgGrad.addColorStop(0, '#090d16');
      bgGrad.addColorStop(0.5, '#0d1527');
      bgGrad.addColorStop(1, '#050811');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1200, 920);

      // Moldura Dourada Militar
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 4;
      ctx.strokeRect(20, 20, 1160, 880);

      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(26, 26, 1148, 868);

      // Tarja Superior
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(28, 28, 1144, 110);

      // Linha Dourada Acima do Cabeçalho
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(28, 138, 1144, 4);

      // Textos do Cabeçalho
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 20px "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PREPARATÓRIO CFOA PMPE · BASE LEGAL ALEPE', 600, 64);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px "Segoe UI", Roboto, sans-serif';
      ctx.fillText('CFOA PMPE - TUTOR: 1ºSGT PM GREGÓRIO', 600, 102);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '16px "Segoe UI", Roboto, sans-serif';
      ctx.fillText('CERTIFICADO DE SONDAGEM DIAGNÓSTICA · MISSÃO CFOA', 600, 126);

      // Bloco do Militar Avaliado
      ctx.textAlign = 'left';
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(50, 165, 1100, 110);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.strokeRect(50, 165, 1100, 110);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 15px "Segoe UI", Roboto, sans-serif';
      ctx.fillText('MILITAR AVALIADO:', 75, 198);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 30px "Segoe UI", Roboto, sans-serif';
      ctx.fillText(studentName, 75, 235);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '16px "Segoe UI", Roboto, sans-serif';
      const regTxt = registration ? `E-mail Gmail: ${registration}  ·  ` : '';
      ctx.fillText(`${regTxt}Unidade: ${cohort}  ·  Data: ${currentDate}`, 75, 262);

      // Caixa Central de Destaque da Patente
      const patentY = 295;
      const isGold = score >= 80;
      const isBlue = score >= 50 && score < 80;

      ctx.fillStyle = isGold ? '#064e3b' : isBlue ? '#0c4a6e' : '#78350f';
      ctx.fillRect(50, patentY, 1100, 140);
      ctx.strokeStyle = isGold ? '#10b981' : isBlue ? '#38bdf8' : '#f59e0b';
      ctx.lineWidth = 2;
      ctx.strokeRect(50, patentY, 1100, 140);

      // Score grande
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 64px "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`${score}`, 85, patentY + 85);
      ctx.font = 'bold 24px "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('/ 100 PTS', 190, patentY + 85);

      // Patente e Nível
      ctx.fillStyle = isGold ? '#a7f3d0' : isBlue ? '#bae6fd' : '#fde68a';
      ctx.font = 'bold 32px "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`★ PATENTE: ${patentTitle.toUpperCase()}`, 380, patentY + 62);

      ctx.fillStyle = '#ffffff';
      ctx.font = '20px "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`Classificação: ${intimacyLevel}`, 380, patentY + 98);

      if (attemptsCount > 1) {
        ctx.fillStyle = '#34d399';
        ctx.font = 'bold 15px "Segoe UI", Roboto, sans-serif';
        ctx.fillText(
          `Histórico: ${attemptsCount} tentativas realizadas (Evolução: ${
            scoreEvolution >= 0 ? `+${scoreEvolution}` : scoreEvolution
          } pts)`,
          380,
          patentY + 124
        );
      }

      // Escala Oficial de Classificação (3 Faixas)
      const scaleY = 455;
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 18px "Segoe UI", Roboto, sans-serif';
      ctx.fillText(
        'PATENTES E NÍVEIS DE INTIMIDADE SEI — ESCALA OFICIAL CAS PMPE 2026',
        50,
        scaleY + 20
      );

      const drawScaleRow = (
        y: number,
        pts: string,
        title: string,
        desc: string,
        active: boolean,
        color: string
      ) => {
        ctx.fillStyle = active ? '#1e293b' : '#0f172a';
        ctx.fillRect(50, y, 1100, 52);
        ctx.strokeStyle = active ? color : '#334155';
        ctx.lineWidth = active ? 2 : 1;
        ctx.strokeRect(50, y, 1100, 52);

        // Indicador
        ctx.fillStyle = active ? color : '#64748b';
        ctx.font = 'bold 16px "Segoe UI", Roboto, sans-serif';
        ctx.fillText(active ? '▶ [ALCANÇADA]' : '  [  ]', 70, y + 32);

        ctx.fillStyle = active ? '#ffffff' : '#94a3b8';
        ctx.font = 'bold 16px "Segoe UI", Roboto, sans-serif';
        ctx.fillText(pts, 210, y + 32);

        ctx.fillStyle = active ? color : '#cbd5e1';
        ctx.fillText(title, 330, y + 32);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '14px "Segoe UI", Roboto, sans-serif';
        ctx.fillText(desc, 650, y + 32);
      };

      drawScaleRow(
        scaleY + 35,
        '80 a 100 pts',
        'Especialista / Gestor SEI',
        'Avançado: domínio total de fluxos, sigilo, blocos e integridade',
        score >= 80,
        '#34d399'
      );
      drawScaleRow(
        scaleY + 95,
        '50 a 79 pts',
        'Operador Prático do SEI',
        'Intermediário: opera rotinas administrativas com segurança',
        score >= 50 && score < 80,
        '#38bdf8'
      );
      drawScaleRow(
        scaleY + 155,
        '0 a 49 pts',
        'Soldado Recruta do SEI',
        'Iniciante: requer capacitação básica no ambiente de treino',
        score < 50,
        '#fbbf24'
      );

      // Desempenho nos 4 Pilares Doutrinários
      const pillarY = 705;
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 18px "Segoe UI", Roboto, sans-serif';
      ctx.fillText('APROVEITAMENTO NOS 4 PILARES DA APOSTILA DTSEI', 50, pillarY + 20);

      const pKeys = COMPETENCY_PILLARS;
      pKeys.forEach((p, idx) => {
        const px = 50 + idx * 280;
        const pScore = pillarScores[p] ?? 0;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px, pillarY + 35, 260, 65);
        ctx.strokeStyle = '#334155';
        ctx.strokeRect(px, pillarY + 35, 260, 65);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px "Segoe UI", Roboto, sans-serif';
        ctx.fillText(p, px + 15, pillarY + 58);

        ctx.fillStyle = pScore >= 80 ? '#34d399' : pScore >= 50 ? '#38bdf8' : '#fbbf24';
        ctx.font = 'bold 22px "Segoe UI", Roboto, sans-serif';
        ctx.fillText(`${pScore}%`, px + 15, pillarY + 88);
      });

      // Rodapé Oficial
      ctx.fillStyle = '#475569';
      ctx.font = '13px "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        'Certificação de Sondagem Diagnóstica — Polícia Militar de Pernambuco · CFOA PMPE',
        600,
        865
      );
      ctx.fillText(
        '*IMPORTHOUR© - todos os direitos reservados',
        600,
        885
      );

      // Download
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      const cleanFileName = (studentName || 'Militar')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .toLowerCase();
      a.download = `Certificado_SEI_CAS2026_${cleanFileName}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Erro ao gerar PNG:', err);
    } finally {
      setIsGeneratingPng(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md overflow-y-auto no-print"
      onClick={onClose}
    >
      <div
        ref={cardRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl my-auto bg-slate-900 border-2 border-amber-500/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100"
      >
        {/* Cabeçalho do Modal */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-5 py-4 border-b border-amber-500/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-md">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-amber-400 tracking-wider uppercase block">
                Patentes e Níveis de Intimidade SEI
              </span>
              <h3 className="font-display text-base sm:text-lg font-bold text-white">
                Escala de Classificação CAS PMPE 2026
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

        {/* Corpo do Cartão Militar */}
        <div className="p-5 sm:p-7 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Card de Identificação Militar */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 mb-1">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>Militar Avaliado:</span>
              </div>
              <h4 className="font-display text-lg sm:text-xl font-bold text-white">
                {studentName}
              </h4>
              <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                {registration && <span>E-mail Gmail: {registration}</span>}
                <span>· {cohort}</span>
                <span>· {currentDate} às {currentTime}</span>
              </div>
            </div>

            <div className="sm:text-right shrink-0">
              <span className="block text-[11px] text-slate-400">Score Conquistado</span>
              <div className="font-mono-num text-3xl font-bold text-white">
                {score}
                <span className="text-sm font-normal text-slate-400"> / 100</span>
              </div>
            </div>
          </div>

          {/* Destaque da Patente Atual Conquistada */}
          <div
            className={`p-5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              score >= 80
                ? 'bg-emerald-950/60 border-emerald-500 text-emerald-100'
                : score >= 50
                ? 'bg-sky-950/60 border-sky-500 text-sky-100'
                : 'bg-amber-950/60 border-amber-500 text-amber-100'
            }`}
          >
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Trophy className="w-4 h-4" />
                Sua Patente Diagnosticada
              </span>
              <div className="font-display text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <span>{score >= 80 ? '★' : score >= 50 ? '●' : '▲'}</span>
                <span>{patentTitle}</span>
              </div>
              <p className="text-xs sm:text-sm opacity-95">
                <strong>Nível de Intimidade:</strong> {intimacyLevel}
              </p>
              {attemptsCount > 1 && (
                <div className="pt-1 text-xs text-emerald-300 font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    Histórico: {attemptsCount} tentativas realizadas (Evolução:{' '}
                    {scoreEvolution >= 0 ? `+${scoreEvolution}` : scoreEvolution} pts)
                  </span>
                </div>
              )}
            </div>

            <div className="px-4 py-2.5 rounded-lg bg-slate-950/70 border border-white/20 text-center shrink-0">
              <span className="block text-[10px] text-slate-400 uppercase font-semibold">
                Classificação CAS
              </span>
              <span className="font-bold text-base text-white">{tierShort}</span>
            </div>
          </div>

          {/* ESCALA OFICIAL DE PATENTES E NÍVEIS DE INTIMIDADE SEI */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4" />
                Escala de Classificação Oficial · CAS PMPE 2026
              </h4>
              <span className="text-[11px] text-slate-400 font-mono-num">
                Critério de Intimidade
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {/* Faixa 1: Avançado / Especialista */}
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  score >= 80
                    ? 'bg-emerald-950/80 border-emerald-400 ring-1 ring-emerald-400 shadow-md shadow-emerald-950/50'
                    : 'bg-slate-950/60 border-slate-800 opacity-60'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1">
                  <div className="font-bold text-white flex items-center gap-2">
                    <span className="text-emerald-400 font-bold text-sm">★</span>
                    <span className="text-sm">Especialista / Gestor SEI</span>
                    {score >= 80 && (
                      <span className="text-[10px] bg-emerald-500 text-slate-950 px-2 py-0.5 rounded font-extrabold uppercase">
                        Sua Faixa
                      </span>
                    )}
                  </div>
                  <span className="font-mono-num font-bold text-emerald-300">
                    80 a 100 pontos
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  <strong>Avançado / Com Intimidade:</strong> Domínio pleno dos fluxos de trabalho, regras de sigilo (tarja vermelha/credencial), bloco de assinatura em lote, integridade processual e parametrização.
                </p>
              </div>

              {/* Faixa 2: Intermediário / Operador Prático */}
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  score >= 50 && score < 80
                    ? 'bg-sky-950/80 border-sky-400 ring-1 ring-sky-400 shadow-md shadow-sky-950/50'
                    : 'bg-slate-950/60 border-slate-800 opacity-60'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1">
                  <div className="font-bold text-white flex items-center gap-2">
                    <span className="text-sky-400 font-bold text-sm">●</span>
                    <span className="text-sm">Operador Prático do SEI</span>
                    {score >= 50 && score < 80 && (
                      <span className="text-[10px] bg-sky-400 text-slate-950 px-2 py-0.5 rounded font-extrabold uppercase">
                        Sua Faixa
                      </span>
                    )}
                  </div>
                  <span className="font-mono-num font-bold text-sky-300">
                    50 a 79 pontos
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  <strong>Intermediário / Conhecimento Básico:</strong> Executa as rotinas diárias com segurança (autenticação de documentos digitalizados, abertura de processos, blocos internos), requerendo revisão em itens de exceção.
                </p>
              </div>

              {/* Faixa 3: Iniciante / Recruta */}
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  score < 50
                    ? 'bg-amber-950/80 border-amber-400 ring-1 ring-amber-400 shadow-md shadow-amber-950/50'
                    : 'bg-slate-950/60 border-slate-800 opacity-60'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1">
                  <div className="font-bold text-white flex items-center gap-2">
                    <span className="text-amber-400 font-bold text-sm">▲</span>
                    <span className="text-sm">Soldado Recruta do SEI</span>
                    {score < 50 && (
                      <span className="text-[10px] bg-amber-400 text-slate-950 px-2 py-0.5 rounded font-extrabold uppercase">
                        Sua Faixa
                      </span>
                    )}
                  </div>
                  <span className="font-mono-num font-bold text-amber-300">
                    0 a 49 pontos
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  <strong>Iniciante / Sem Intimidade:</strong> Necessita de capacitação básica e treinamento prático no ambiente de homologação (sei4treina.pe.gov.br) antes de operar processos críticos.
                </p>
              </div>
            </div>
          </div>

          {/* Desempenho nos 4 Pilares da Apostila DTSEI */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-white block">
              Domínio nos 4 Pilares da Apostila DTSEI:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {COMPETENCY_PILLARS.map((p) => {
                const pct = pillarScores[p] ?? 0;
                return (
                  <div
                    key={p}
                    className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-center"
                  >
                    <span className="text-[10px] text-slate-400 block truncate" title={p}>
                      {p}
                    </span>
                    <span
                      className={`font-mono-num font-bold text-sm ${
                        pct >= 80
                          ? 'text-emerald-400'
                          : pct >= 50
                          ? 'text-sky-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Direitos Autorais */}
          <div className="pt-2 text-center text-xs text-slate-400 border-t border-slate-800">
            <p className="font-semibold text-slate-300">
              CFOA PMPE — TUTOR: 1ºSGT PM GREGÓRIO
            </p>
            <p className="text-[11px] text-amber-400 font-medium">
              *IMPORTHOUR© - todos os direitos reservados
            </p>
          </div>
        </div>

        {/* Rodapé com Botões de Compartilhamento Tático */}
        <div className="bg-slate-950 p-4 sm:p-5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="flex-1 sm:flex-initial min-h-[46px] px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-emerald-950/40"
          >
            <Share2 className="w-4 h-4" />
            <span>Compartilhar no WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPng}
            disabled={isGeneratingPng}
            className="flex-1 sm:flex-initial min-h-[46px] px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isGeneratingPng ? 'Gerando Imagem...' : 'Baixar Imagem / PNG'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyText}
            className="flex-1 sm:flex-initial min-h-[46px] px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            {copiedText ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Texto Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copiar Certidão</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto min-h-[46px] px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
