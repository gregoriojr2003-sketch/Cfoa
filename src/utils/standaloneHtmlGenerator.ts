import { DiagnosticAssessment, ClassStudentRecord } from '../data/presets';

export function generateStandaloneHtml(
  assessment: DiagnosticAssessment,
  classRoster: ClassStudentRecord[]
): string {
  const safeAssessmentJson = JSON.stringify(assessment, null, 2).replace(
    /<\/script>/gi,
    '<\\/script>'
  );
  const safeRosterJson = JSON.stringify(classRoster, null, 2).replace(
    /<\/script>/gi,
    '<\\/script>'
  );

  return `<!DOCTYPE html>
<html lang="pt-BR" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
  <title>Guia de Aperfeiçoamento — QUIZ DE APROVAÇÃO SGT GREGÓRIO</title>
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- FontAwesome CDN -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" />
  <!-- Chart.js CDN -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js"></script>
  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: #0b131e;
      color: #f8fafc;
    }
    h1, h2, h3, h4, .font-display {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    }
    .font-mono-num {
      font-family: 'IBM Plex Mono', monospace;
      font-variant-numeric: tabular-nums;
    }
    .fade-step {
      animation: fadeSlide 180ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes fadeSlide {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes pulseHit {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.015); }
    }
    .anim-hit { animation: pulseHit 220ms ease-out; }

    /* Animações suaves de fade-in e destaque de atividade recente para o Quadro Geral */
    @keyframes tableSmoothFadeIn {
      0% { opacity: 0; transform: translateY(14px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    @keyframes rowRecentHighlight {
      0% {
        opacity: 0;
        transform: translateY(10px) scale(0.985);
        background-color: rgba(245, 158, 11, 0.45);
        box-shadow: inset 0 0 22px rgba(245, 158, 11, 0.55), 0 0 20px rgba(245, 158, 11, 0.3);
      }
      25% {
        opacity: 1;
        transform: translateY(0) scale(1.008);
        background-color: rgba(16, 185, 129, 0.35);
        box-shadow: inset 0 0 22px rgba(16, 185, 129, 0.5), 0 0 16px rgba(16, 185, 129, 0.35);
      }
      65% {
        transform: scale(1);
        background-color: rgba(245, 158, 11, 0.22);
        box-shadow: inset 0 0 12px rgba(245, 158, 11, 0.3);
      }
      100% {
        opacity: 1;
        transform: translateY(0) scale(1);
        background-color: rgba(245, 158, 11, 0.12);
        box-shadow: none;
      }
    }
    @keyframes rowItemFadeIn {
      0% { opacity: 0; transform: translateY(8px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    @keyframes pulseRecentGlow {
      0%, 100% { opacity: 1; filter: drop-shadow(0 0 4px rgba(245, 158, 11, 0.7)); }
      50% { opacity: 0.75; filter: drop-shadow(0 0 10px rgba(16, 185, 129, 0.85)); }
    }
    .animate-table-fade-in { animation: tableSmoothFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }
    .animate-row-recent { animation: rowRecentHighlight 2.4s cubic-bezier(0.16, 1, 0.3, 1) both; }
    .animate-row-item { animation: rowItemFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both; }
    .animate-pulse-glow { animation: pulseRecentGlow 2.2s infinite ease-in-out; }

    @media print {
      .no-print { display: none !important; }
      body { background-color: #ffffff !important; color: #0f172a !important; }
    }
  </style>
</head>
<body class="min-h-screen flex flex-col bg-[#0b131e] text-slate-100 selection:bg-emerald-500 selection:text-slate-950">
  <!-- Canvas de Confete de Conquista -->
  <canvas id="confetti-canvas" class="fixed inset-0 pointer-events-none z-50 hidden no-print"></canvas>

  <!-- Top Bar Militar -->
  <header class="bg-slate-950/95 border-b border-emerald-900/60 px-4 sm:px-6 py-3.5 sticky top-0 z-30 backdrop-blur-md no-print">
    <div class="max-w-6xl mx-auto flex items-center justify-between gap-4">
      <div class="flex items-center gap-2.5 min-w-0">
        <i class="fa-solid fa-shield-halved text-amber-400 text-lg shrink-0"></i>
        <span class="font-display font-bold text-white text-sm sm:text-base tracking-tight truncate">
          QUIZ DE APROVAÇÃO SGT GREGÓRIO
        </span>
      </div>
      <div class="flex items-center gap-3 text-xs text-slate-300 font-medium shrink-0">
        <span class="hidden sm:inline">CAS PMPE 2026</span>
        <span class="hidden sm:inline">·</span>
        <span class="font-mono-num text-amber-400 font-semibold">10 Missões (100 pts)</span>
      </div>
    </div>
  </header>

  <main class="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
    <!-- HUD TÁTICO EM TEMPO REAL (Visível na Tela 2) -->
    <div id="game-hud" class="hidden mb-5 bg-slate-900/95 border border-emerald-800/60 rounded-2xl p-3.5 sm:p-4 space-y-3 no-print">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2.5">
          <i class="fa-solid fa-user-shield text-emerald-400"></i>
          <div>
            <span class="text-[10px] text-slate-400 block">Militar em Missão</span>
            <strong id="hud-player" class="text-xs sm:text-sm font-semibold text-white"></strong>
          </div>
        </div>
        <div class="flex items-center gap-4 sm:gap-6">
          <div>
            <span class="text-[10px] text-slate-400 block">Score</span>
            <strong id="hud-xp" class="font-mono-num text-sm sm:text-base font-bold text-emerald-400">0 pts</strong>
          </div>
          <div>
            <span class="text-[10px] text-slate-400 block">Combo</span>
            <strong id="hud-streak" class="font-mono-num text-sm sm:text-base font-bold text-amber-400">0x</strong>
          </div>
          <div>
            <span class="text-[10px] text-slate-400 block">Nível de Intimidade</span>
            <strong id="hud-intimacy" class="text-xs sm:text-sm font-bold text-amber-300">Soldado Recruta</strong>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
        <div>
          <div class="flex justify-between text-[11px] text-slate-300 mb-1">
            <span>Progresso da Operação</span>
            <span id="hud-progress-text" class="font-mono-num font-semibold text-white">1/10 (10%)</span>
          </div>
          <div class="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
            <div id="hud-progress-bar" class="h-full bg-emerald-500 transition-all duration-200" style="width: 10%"></div>
          </div>
        </div>
        <div>
          <div class="flex justify-between text-[11px] text-slate-300 mb-1">
            <span>Nível de Intimidade com o Sistema</span>
            <span id="hud-intimacy-pct" class="font-mono-num font-semibold text-amber-400">0%</span>
          </div>
          <div class="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
            <div id="hud-intimacy-bar" class="h-full bg-amber-400 transition-all duration-200" style="width: 0%"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- TELA 1: BRIEFING INICIAL -->
    <section id="step-1" class="fade-step bg-slate-900/90 border border-emerald-900/60 rounded-2xl p-5 sm:p-9 shadow-xl">
      <div class="text-xs font-semibold text-amber-400 mb-2 flex items-center gap-2">
        <i class="fa-solid fa-compass"></i>
        <span>Tela 1 · Briefing Tático Inicial · CAS PMPE 2026</span>
      </div>
      <h1 id="quiz-title" class="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2.5"></h1>
      <p id="quiz-subtitle" class="text-slate-300 text-sm sm:text-base leading-relaxed mb-6"></p>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 py-3.5 px-4 bg-slate-950/90 border border-slate-800 rounded-xl mb-6 text-xs sm:text-sm">
        <div>
          <span class="text-slate-400 block text-[11px]">Missões Calibradas</span>
          <strong class="font-mono-num text-white font-semibold" id="meta-count">10 Missões</strong>
        </div>
        <div>
          <span class="text-slate-400 block text-[11px]">Escala de Pontuação</span>
          <strong class="font-mono-num text-emerald-400 font-semibold">0 a 100 Pontos</strong>
        </div>
        <div>
          <span class="text-slate-400 block text-[11px]">Instrutor do Curso</span>
          <strong class="font-mono-num text-amber-400 font-semibold">1º SGT PM GREGÓRIO</strong>
        </div>
      </div>

      <form id="student-form" class="space-y-4">
        <div>
          <label for="student-war-name" class="block text-sm font-medium text-slate-200 mb-1.5">
            Nome de Guerra / Identificação do Militar <span class="text-rose-400">*</span>
          </label>
          <div class="relative flex rounded-xl border border-slate-700 bg-slate-950 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 overflow-hidden">
            <!-- Botão com Janela Flutuante para Escolha de Graduação/Patente -->
            <button
              type="button"
              id="btn-rank-selector"
              class="inline-flex items-center gap-1.5 px-3.5 py-3 bg-emerald-950/80 hover:bg-emerald-900 text-amber-400 font-mono-num font-bold text-xs sm:text-sm border-r border-slate-800 transition cursor-pointer select-none shrink-0"
              title="Clique para abrir a janela flutuante e escolher sua graduação ou patente"
            >
              <span id="label-rank">2º SGT PM</span>
              <i class="fa-solid fa-chevron-down text-xs"></i>
            </button>
            <input
              type="text"
              id="student-war-name"
              required
              placeholder="Digite o Nome de Guerra (ex.: CARLOS EDUARDO)"
              class="w-full min-h-[48px] px-3.5 py-3 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
            />
          </div>
          <p class="text-[11px] text-slate-400 mt-1">
            Toque no botão <strong id="hint-rank" class="text-amber-400">2º SGT PM</strong> para abrir a janela flutuante e trocar sua graduação ou patente.
          </p>
          <p id="name-error" class="hidden text-xs text-rose-400 mt-1.5">Informe seu Nome de Guerra para iniciar a operação.</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label for="student-id" class="block text-sm font-medium text-slate-200 mb-1.5">
              Conta de E-mail GMAIL <span class="text-rose-400 font-semibold">* (obrigatório)</span>
            </label>
            <input
              type="email"
              id="student-id"
              required
              placeholder="Ex.: militar.pmpe@gmail.com"
              class="w-full min-h-[48px] px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            />
            <p id="email-error" class="hidden text-xs text-rose-400 mt-1.5 font-semibold">
              Informe uma conta de e-mail válida terminada em @gmail.com para iniciar a missão.
            </p>
          </div>
          <div>
            <label for="student-cohort" class="block text-sm font-medium text-slate-200 mb-1.5">
              Pelotão / Turma CAS <span class="text-rose-400 font-semibold">* (obrigatório)</span>
            </label>
            <select
              id="student-cohort"
              required
              class="w-full min-h-[48px] px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition cursor-pointer"
            >
              <option value="" disabled selected>-- Selecione a Unidade --</option>
              <option value="Turma 01">Turma 01</option>
              <option value="Turma 02">Turma 02</option>
              <option value="Visitantes">Visitantes</option>
            </select>
            <p id="cohort-error" class="hidden text-xs text-rose-400 mt-1.5 font-semibold">
              Selecione o Pelotão / Turma CAS do militar para iniciar a missão.
            </p>
          </div>
        </div>

        <div class="p-3.5 bg-emerald-950/40 border border-emerald-800/50 rounded-xl flex items-start gap-2.5 text-xs">
          <i class="fa-solid fa-circle-check text-emerald-400 mt-0.5"></i>
          <div>
            <strong class="text-white block font-semibold mb-0.5">Regra de Tentativas Ilimitadas:</strong>
            <span class="text-slate-300">
              Militares podem realizar a sondagem quantas vezes for necessário. Prevalecerá sempre a <strong>última nota obtida</strong> no Quadro Geral da Turma.
            </span>
          </div>
        </div>

        <div class="pt-4">
          <button
            type="submit"
            class="w-full sm:w-auto min-h-[48px] px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-slate-950 font-bold text-sm rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
          >
            <i class="fa-solid fa-play"></i>
            Iniciar Missão
          </button>
        </div>
      </form>
    </section>

    <!-- TELA 2: PAINEL INTERATIVO DE MISSÕES (QUIZ) -->
    <section id="step-2" class="hidden fade-step bg-slate-900/90 border border-emerald-900/60 rounded-2xl p-5 sm:p-9 shadow-xl">
      <div class="mb-5">
        <div class="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 mb-2">
          <span id="question-meta" class="text-amber-400 font-semibold"></span>
          <span id="question-timer" class="font-mono-num text-slate-300"></span>
        </div>
        <h2 id="question-stem" class="font-display text-base sm:text-xl font-bold text-white leading-relaxed"></h2>
      </div>

      <div id="options-container" class="space-y-3 mb-6" role="radiogroup"></div>

      <div id="instant-feedback" class="hidden mb-6 p-4 rounded-xl border text-xs sm:text-sm leading-relaxed"></div>

      <p id="option-warning" class="hidden text-xs text-amber-300 bg-amber-950/60 border border-amber-700 rounded-xl px-4 py-3 mb-6">
        Selecione uma das 4 opções antes de avançar para a próxima fase.
      </p>

      <div class="flex items-center justify-between gap-3 pt-4 border-t border-slate-800">
        <button
          type="button"
          id="btn-prev"
          class="min-h-[46px] px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl transition cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
        >
          <i class="fa-solid fa-arrow-left mr-1.5"></i> Anterior
        </button>

        <button
          type="button"
          id="btn-next"
          class="min-h-[46px] px-6 py-2.5 text-xs sm:text-sm font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-xl transition cursor-pointer"
        >
          Avançar Fase <i class="fa-solid fa-arrow-right ml-1.5"></i>
        </button>
      </div>
    </section>

    <!-- TELA 3: PAINEL DE RESULTADOS, INSÍGNIAS E GRÁFICOS DA TURMA -->
    <section id="step-3" class="hidden fade-step space-y-6">
      <div class="bg-slate-900/90 border border-emerald-800/70 rounded-2xl p-5 sm:p-8 shadow-xl">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-5 pb-6 border-b border-slate-800">
          <div>
            <div class="text-xs font-semibold text-amber-400 mb-1">
              Relatório Final de Operação · <span id="res-date" class="font-mono-num"></span>
            </div>
            <h2 id="res-student-name" class="font-display text-2xl sm:text-3xl font-bold text-white"></h2>
            <p id="res-student-meta" class="text-xs sm:text-sm text-slate-400 mt-0.5"></p>
          </div>

          <div class="flex flex-wrap items-center gap-5">
            <div>
              <span class="block text-xs text-slate-400">Pontuação Final</span>
              <div class="font-mono-num text-3xl sm:text-4xl font-bold text-white">
                <span id="res-score">0</span><span class="text-lg text-slate-400 font-normal">/100</span>
              </div>
            </div>
            <div id="res-badge" class="px-4 py-3 rounded-xl border text-xs sm:text-sm font-bold"></div>
          </div>
        </div>

        <div class="pt-6 space-y-2">
          <h3 class="font-display text-base font-bold text-white" id="res-tier-title"></h3>
          <p id="res-feedback-text" class="text-xs sm:text-sm text-slate-300 leading-relaxed"></p>
        </div>

        <!-- QUADRO DE INSÍGNIAS DE CONQUISTA (ACHIEVEMENT BADGES) -->
        <div class="pt-6 mt-6 border-t border-slate-800">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-display text-sm sm:text-base font-bold text-amber-400 flex items-center gap-2">
              <i class="fa-solid fa-medal"></i>
              Quadro de Medalhas e Conquistas (Achievement Badges)
            </h3>
            <span id="badges-counter" class="font-mono-num text-xs text-slate-400"></span>
          </div>
          <div id="badges-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"></div>
        </div>

        <!-- PROGRESSO DO ALUNO NAS ETAPAS & HISTÓRICO DE TENTATIVAS -->
        <div id="student-progress-box" class="mt-6 p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <i class="fa-solid fa-arrow-trend-up text-emerald-400"></i>
              Progresso do Aluno nas Etapas & Tentativas
            </span>
            <span id="progress-attempts-count" class="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono-num">
              1 tentativa
            </span>
          </div>
          <div id="progress-history-summary" class="text-xs text-slate-300">
            <!-- Preenchido dinamicamente via JS com histórico e ganho de pontos -->
          </div>
        </div>

        <!-- AVISO DE NOTA ATUALIZADA / REGISTRO -->
        <div class="mt-4 p-4 rounded-xl border bg-emerald-950/40 border-emerald-600/60 text-emerald-200 text-xs flex items-center gap-3">
          <i class="fa-solid fa-circle-check text-amber-400 text-base shrink-0"></i>
          <div>
            <strong class="block text-white font-semibold">Tentativa Gravada no Quadro da Turma!</strong>
            <span>Você pode refazer o desafio quantas vezes desejar — sua última nota registrada sempre prevalecerá sobre a anterior.</span>
          </div>
        </div>

        <!-- CARD DE LEMBRETE DE REVISÃO EM 24H (BASEADO NO PILAR DE MENOR NOTA) -->
        <div id="review-24h-card" class="mt-4 p-5 rounded-xl border-2 border-emerald-500/60 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/30 text-xs space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold">
                <i class="fa-solid fa-bell"></i>
              </div>
              <div>
                <span class="text-[10px] font-black uppercase tracking-wider text-amber-400 block">Metodologia CAS PMPE 2026 · Curva de Fixação 24h</span>
                <h4 class="font-bold text-white text-sm">Lembrete de Revisão Tática (24h Pós-Desafio)</h4>
              </div>
            </div>
            <button type="button" id="btn-simulate-24h" class="min-h-[36px] px-3 py-1.5 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/40 text-amber-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer">
              <i class="fa-solid fa-wand-magic-sparkles"></i> Simular Lembrete de 24h Agora
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="p-3.5 rounded-lg bg-slate-950 border border-slate-800">
              <span class="text-[10px] text-slate-400 font-bold uppercase block">Pilar com Menor Rendimento:</span>
              <div class="text-sm font-black text-amber-300 mt-0.5" id="rem-pillar-name">Tramitação & Integridade</div>
              <div class="text-[11px] font-mono-num text-rose-400 font-bold" id="rem-pillar-score">40% de acerto</div>
              <div class="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <i class="fa-regular fa-clock text-cyan-400"></i> Agendado para: <span id="rem-scheduled-time" class="text-slate-200 font-bold">Amanhã</span>
              </div>
            </div>

            <div class="p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 space-y-1">
              <div class="flex items-center justify-between">
                <span class="text-[10px] text-emerald-400 font-black uppercase">Tópico Designado da Apostila:</span>
                <span class="text-[10px] font-mono-num font-bold text-amber-300 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700" id="rem-pages">Págs. 39 a 63</span>
              </div>
              <h5 class="text-xs font-bold text-white" id="rem-chapter-title">Módulo 08 — Tramitação, Sobrestamento e Anexação</h5>
              <p class="text-[11px] text-slate-300" id="rem-summary">Revise a distinção fundamental entre Anexação (definitiva) e Relacionamento (independente).</p>
            </div>
          </div>

          <div class="pt-1 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 border-t border-slate-800/80">
            <span>Dica do Instrutor: Revise o capítulo no dia seguinte para fixar o aprendizado na memória de longo prazo.</span>
            <div class="flex items-center gap-2">
              <button type="button" id="btn-native-notify" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center gap-1 cursor-pointer">
                <i class="fa-solid fa-bell-concierge text-amber-400"></i> Ativar Notificação
              </button>
            </div>
          </div>
        </div>

        <!-- BOTÕES DE AÇÃO -->
        <div class="pt-6 mt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 no-print">
          <button
            type="button"
            id="btn-restart"
            class="min-h-[44px] px-4 py-2.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl transition cursor-pointer"
          >
            <i class="fa-solid fa-rotate-left mr-1.5"></i> Refazer Missão (Atualizar Nota)
          </button>
          <div class="flex flex-wrap items-center gap-2.5">
            <!-- BOTÃO PRINCIPAL DE COMPARTILHAMENTO DE PATENTE E ESCALA CAS PMPE 2026 -->
            <button
              type="button"
              id="btn-open-share-rank"
              class="min-h-[44px] px-5 py-2.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-200 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-950/60"
            >
              <i class="fa-solid fa-share-nodes text-slate-950"></i> Compartilhar Minha Classificação SEI
            </button>
            <button
              type="button"
              id="btn-copy"
              class="min-h-[44px] px-4 py-2.5 text-xs font-semibold text-slate-200 bg-slate-950 border border-slate-700 hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              <i class="fa-solid fa-copy mr-1.5"></i> Copiar Meu Score
            </button>
            <button
              type="button"
              id="btn-print"
              class="min-h-[44px] px-4 py-2.5 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl transition cursor-pointer"
            >
              <i class="fa-solid fa-file-pdf mr-1.5"></i> Exportar Relatório PDF
            </button>
            <button
              type="button"
              id="btn-admin-reset"
              class="min-h-[44px] px-3.5 py-2 text-xs font-semibold text-rose-300 bg-rose-950/40 border border-rose-800/60 hover:bg-rose-900/60 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              title="Zerar resultados e simulações para primeiro uso oficial (mantém Instrutor)"
            >
              <i class="fa-solid fa-trash-can"></i> Zerar Turma (Admin)
            </button>
          </div>
        </div>
      </div>

      <!-- CARDS COMPARATIVOS DE CABEÇALHO: TURMA 01, TURMA 02 E VISITANTES -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-slate-900/90 border border-emerald-800/60 rounded-2xl p-4">
          <span class="text-[11px] font-bold text-emerald-400 font-mono-num uppercase block mb-1">TURMA 01</span>
          <div class="flex items-baseline justify-between mt-1">
            <span id="stat-t1-avg" class="font-mono-num text-2xl font-bold text-white">0 pts</span>
            <span id="stat-t1-count" class="text-xs text-slate-400 font-mono-num">0 militares</span>
          </div>
        </div>
        <div class="bg-slate-900/90 border border-sky-800/60 rounded-2xl p-4">
          <span class="text-[11px] font-bold text-sky-400 font-mono-num uppercase block mb-1">TURMA 02</span>
          <div class="flex items-baseline justify-between mt-1">
            <span id="stat-t2-avg" class="font-mono-num text-2xl font-bold text-white">0 pts</span>
            <span id="stat-t2-count" class="text-xs text-slate-400 font-mono-num">0 militares</span>
          </div>
        </div>
        <div class="bg-slate-900/90 border border-purple-800/60 rounded-2xl p-4">
          <span class="text-[11px] font-bold text-purple-300 font-mono-num uppercase block mb-1">VISITANTES</span>
          <div class="flex items-baseline justify-between mt-1">
            <span id="stat-vis-avg" class="font-mono-num text-2xl font-bold text-white">0 pts</span>
            <span id="stat-vis-count" class="text-xs text-slate-400 font-mono-num">0 militares</span>
          </div>
        </div>
      </div>

      <!-- GRÁFICOS INTERATIVOS CHART.JS -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- GRÁFICO COMPARATIVO ENTRE AS OPÇÕES -->
        <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col">
          <div class="flex items-center justify-between mb-2">
            <h3 class="font-display text-base font-bold text-white">Gráfico Comparativo (Pelotão / Turma)</h3>
            <span class="text-[11px] font-mono-num text-amber-400 font-semibold">Turma 01 · Turma 02 · Visitantes</span>
          </div>
          <p class="text-xs text-slate-400 mb-3">Média geral e desempenho médio nos 4 pilares do SEI</p>
          <div class="relative flex-1 min-h-[260px]">
            <canvas id="chart-cohort-compare"></canvas>
          </div>
        </div>

        <!-- GRÁFICO 1 · RADAR INDIVIDUAL -->
        <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col">
          <h3 class="font-display text-base font-bold text-white mb-1">Gráfico 1 · Radar de Competências SEI</h3>
          <p class="text-xs text-slate-400 mb-3">Seu perfil individual nos 4 pilares da apostila DTSEI</p>
          <div class="relative flex-1 min-h-[260px]">
            <canvas id="chart-radar"></canvas>
          </div>
        </div>
      </div>

      <!-- GRÁFICO COMPARATIVO ENTRE OS ALUNOS (RANKING GERAL) -->
      <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 class="font-display text-base font-bold text-white">Ranking Geral e Comparativo dos Alunos</h3>
            <p class="text-xs text-slate-400">Classificação geral dos candidatos por ordem de pontuação (0 a 100 pts)</p>
          </div>
        </div>
        <div class="relative min-h-[260px]">
          <canvas id="chart-ranking"></canvas>
        </div>
      </div>

      <!-- QUADRO GERAL DE CLASSIFICAÇÃO COM ANIMAÇÃO FADE-IN E DESTAQUE DE ATIVIDADE RECENTE -->
      <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-7">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div class="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-1">
              <i class="fa-solid fa-users"></i> Efetivo Avaliado · CFOA PMPE 2026
            </div>
            <h3 class="font-display text-base sm:text-lg font-bold text-white">
              Quadro Geral de Classificação da Turma
            </h3>
            <p class="text-xs text-slate-400">Classificação geral por pontuação com todos os candidatos em igualdade de condições</p>
          </div>
          <div class="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button type="button" id="roster-filter-all" class="px-3 py-1.5 rounded-lg font-semibold bg-amber-400 text-slate-950 cursor-pointer">Todas</button>
            <button type="button" id="roster-filter-t1" class="px-3 py-1.5 rounded-lg font-semibold text-slate-400 hover:text-white cursor-pointer">Turma 01</button>
            <button type="button" id="roster-filter-t2" class="px-3 py-1.5 rounded-lg font-semibold text-slate-400 hover:text-white cursor-pointer">Turma 02</button>
            <button type="button" id="roster-filter-vis" class="px-3 py-1.5 rounded-lg font-semibold text-slate-400 hover:text-white cursor-pointer">Visitantes</button>
          </div>
        </div>

        <!-- Banner de Atividade Recente -->
        <div id="roster-recent-banner" class="hidden mb-4 p-3.5 rounded-xl bg-gradient-to-r from-amber-950/70 via-slate-900 to-emerald-950/70 border border-amber-500/60 flex items-center justify-between text-xs animate-table-fade-in shadow-lg">
          <div class="flex items-center gap-2.5">
            <span class="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
            <span class="text-white">Atividade recente registrada: <strong id="roster-recent-name" class="text-amber-300"></strong></span>
          </div>
          <span class="text-[11px] text-amber-400 font-mono-num font-semibold">Atualizado agora</span>
        </div>

        <div id="roster-table-container" class="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/50 p-1 animate-table-fade-in">
          <table class="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr class="border-b border-slate-800 text-slate-400 text-xs">
                <th class="py-3 px-3 sm:px-4 font-semibold">Pos.</th>
                <th class="py-3 px-3 sm:px-4 font-semibold">Nome de Guerra</th>
                <th class="py-3 px-3 sm:px-4 font-semibold hidden sm:table-cell">Matrícula</th>
                <th class="py-3 px-3 sm:px-4 font-semibold">Turma</th>
                <th class="py-3 px-3 sm:px-4 font-semibold">Patente SEI</th>
                <th class="py-3 px-3 sm:px-4 font-semibold text-center hidden md:table-cell">Tentativas</th>
                <th class="py-3 px-3 sm:px-4 font-semibold text-right">Última Nota</th>
              </tr>
            </thead>
            <tbody id="roster-table-body" class="divide-y divide-slate-800/80"></tbody>
          </table>
        </div>
      </div>

      <!-- GABARITO COMENTADO -->
      <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-8">
        <h3 class="font-display text-lg font-bold text-white mb-1">Gabarito Técnico Comentado — Apostila DTSEI</h3>
        <p class="text-xs text-slate-400 mb-6">Conferência detalhada das 10 missões operacionais</p>
        <div id="review-list" class="divide-y divide-slate-800"></div>
      </div>
    </section>
  </main>

  <!-- JANELA FLUTUANTE (MODAL) PARA ESCOLHA DA GRADUAÇÃO / PATENTE -->
  <div id="rank-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
    <div class="bg-slate-900 border border-emerald-700/60 rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4">
      <div class="flex items-center justify-between pb-3 border-b border-slate-800">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
            <i class="fa-solid fa-shield"></i>
          </div>
          <div>
            <h3 class="font-display text-base font-bold text-white">Escolha sua Graduação / Patente</h3>
            <p class="text-[11px] text-slate-400">Polícia Militar de Pernambuco (PMPE)</p>
          </div>
        </div>
        <button type="button" id="btn-close-rank-modal" class="text-slate-400 hover:text-white text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 cursor-pointer">✕ Fechar</button>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 gap-2" id="rank-buttons-container"></div>

      <div class="pt-2 text-[11px] text-slate-400 text-center border-t border-slate-800">
        Graduação padrão do CAS: <strong class="text-amber-400">2º SGT PM</strong>
      </div>
    </div>
  </div>

  <!-- MODAL DE COMPARTILHAMENTO DE PATENTE E ESCALA DE CLASSIFICAÇÃO CAS PMPE 2026 -->
  <div id="share-rank-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md overflow-y-auto no-print">
    <div class="w-full max-w-3xl my-auto bg-slate-900 border-2 border-amber-500/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
      <!-- Cabeçalho do Modal -->
      <div class="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-5 py-4 border-b border-amber-500/50 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shrink-0">
            <i class="fa-solid fa-share-nodes text-lg"></i>
          </div>
          <div>
            <span class="text-[11px] font-bold text-amber-400 tracking-wider uppercase block">Patentes e Níveis de Intimidade SEI</span>
            <h3 class="font-display text-base sm:text-lg font-bold text-white">Escala de Classificação CAS PMPE 2026</h3>
          </div>
        </div>
        <button type="button" id="btn-close-share-modal" class="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer">✕</button>
      </div>

      <!-- Corpo do Certificado -->
      <div class="p-5 sm:p-7 space-y-5 overflow-y-auto max-h-[75vh]">
        <!-- Identificação -->
        <div class="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span class="text-[11px] font-semibold text-slate-400 block mb-1">Militar Avaliado:</span>
            <h4 id="sm-student-name" class="font-display text-lg sm:text-xl font-bold text-white"></h4>
            <div id="sm-student-meta" class="text-xs text-slate-400 mt-1"></div>
          </div>
          <div class="sm:text-right shrink-0">
            <span class="block text-[11px] text-slate-400">Score Conquistado</span>
            <div class="font-mono-num text-3xl font-bold text-white">
              <span id="sm-score"></span><span class="text-sm font-normal text-slate-400"> / 100</span>
            </div>
          </div>
        </div>

        <!-- Destaque Patente -->
        <div id="sm-tier-card" class="p-5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="space-y-1">
            <span class="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <i class="fa-solid fa-trophy"></i> Sua Patente Diagnosticada
            </span>
            <div id="sm-patent-title" class="font-display text-xl sm:text-2xl font-bold text-white"></div>
            <p id="sm-intimacy-level" class="text-xs sm:text-sm opacity-95"></p>
            <div id="sm-history-line" class="pt-1 text-xs text-emerald-300 font-semibold hidden"></div>
          </div>
          <div class="px-4 py-2 rounded-lg bg-slate-950/70 border border-white/20 text-center shrink-0">
            <span class="block text-[10px] text-slate-400 uppercase font-semibold">Classificação</span>
            <span id="sm-tier-short" class="font-bold text-base text-white"></span>
          </div>
        </div>

        <!-- Escala Oficial de Classificação -->
        <div class="space-y-2.5">
          <h4 class="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <i class="fa-solid fa-award"></i> Escala de Classificação Oficial · CAS PMPE 2026
          </h4>
          <div class="space-y-2 text-xs">
            <div id="sm-row-adv" class="p-3 rounded-xl border transition-all">
              <div class="flex justify-between items-center mb-1">
                <span class="font-bold text-white text-sm">★ Especialista / Gestor SEI</span>
                <span class="font-mono-num font-bold text-emerald-300">80 a 100 pontos</span>
              </div>
              <p class="text-[11px] text-slate-300">Avançado / Com Intimidade: Domínio pleno de fluxos, sigilo (credenciais pessoais), blocos e integridade.</p>
            </div>
            <div id="sm-row-int" class="p-3 rounded-xl border transition-all">
              <div class="flex justify-between items-center mb-1">
                <span class="font-bold text-white text-sm">● Operador Prático do SEI</span>
                <span class="font-mono-num font-bold text-sky-300">50 a 79 pontos</span>
              </div>
              <p class="text-[11px] text-slate-300">Intermediário / Conhecimento Básico: Opera rotinas diárias com segurança (autenticação, blocos internos).</p>
            </div>
            <div id="sm-row-beg" class="p-3 rounded-xl border transition-all">
              <div class="flex justify-between items-center mb-1">
                <span class="font-bold text-white text-sm">▲ Soldado Recruta do SEI</span>
                <span class="font-mono-num font-bold text-amber-300">0 a 49 pontos</span>
              </div>
              <p class="text-[11px] text-slate-300">Iniciante / Sem Intimidade: Requer treinamento prático na homologação (sei4treina.pe.gov.br) antes de operar processos críticos.</p>
            </div>
          </div>
        </div>

        <!-- Pilares -->
        <div class="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
          <span class="text-xs font-bold text-white block">Domínio nos 4 Pilares da Apostila DTSEI:</span>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs" id="sm-pillars-grid"></div>
        </div>

        <!-- Rodapé da Certificação -->
        <div class="pt-2 text-center text-xs text-slate-400 border-t border-slate-800">
          <p class="font-semibold text-slate-300">CFOA PMPE - TUTOR: 1ºSGT PM GREGÓRIO</p>
          <p class="text-[11px] text-amber-400 font-medium">*IMPORTHOUR© - todos os direitos reservados</p>
        </div>
      </div>

      <!-- Ações do Modal -->
      <div class="bg-slate-950 p-4 sm:p-5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <button type="button" id="btn-share-whatsapp" class="flex-1 sm:flex-initial min-h-[44px] px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/50">
          <i class="fa-brands fa-whatsapp text-sm"></i> Compartilhar no WhatsApp
        </button>
        <button type="button" id="btn-share-download-png" class="flex-1 sm:flex-initial min-h-[44px] px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer">
          <i class="fa-solid fa-download"></i> Baixar Imagem / PNG
        </button>
        <button type="button" id="btn-share-copy" class="flex-1 sm:flex-initial min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer">
          <i class="fa-solid fa-copy"></i> Copiar Certidão
        </button>
        <button type="button" id="btn-share-close-bottom" class="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold cursor-pointer">
          Fechar
        </button>
      </div>
    </div>
  </div>

  <script>
    const ASSESSMENT_DATA = ${safeAssessmentJson};
    const PILLARS = ['Legislação PM & Regime Disciplinar', 'Direito Penal & Processual Militar', 'Direito Constitucional & Administrativo', 'Administração & Conhecimentos Gerais'];
    const RANKS = ['SD PM', 'CB PM', '3º SGT PM', '2º SGT PM', '1º SGT PM', 'ST PM', 'ASP PM', '2º TEN PM', '1º TEN PM', 'CAP PM', 'MAJ PM', 'TC PM', 'CEL PM'];

    const INSTRUCTOR_RECORD = {
      id: 'instructor-gregorio',
      name: '1º SGT PM GREGÓRIO',
      registration: 'TUTOR-CFOA-PMPE',
      cohort: 'CFOA PMPE',
      score: 100,
      tier: 'Avançado',
      completedAt: '08:00',
      avgTimeSec: 5,
      maxStreak: 10,
      pillarScores: {
        'Legislação PM & Regime Disciplinar': 100,
        'Direito Penal & Processual Militar': 100,
        'Direito Constitucional & Administrativo': 100,
        'Administração & Conhecimentos Gerais': 100
      }
    };

    function isInstructor(s) {
      return false;
    }

    let CLASS_ROSTER = [];
    try {
      const savedRoster = localStorage.getItem('cfoa_pmpe_roster_zeroed_v1');
      if (savedRoster) {
        let parsed = JSON.parse(savedRoster);
        if (Array.isArray(parsed)) {
          CLASS_ROSTER = parsed;
        }
      }
    } catch(e) {}

    let selectedRank = '2º SGT PM';
    let currentIndex = 0;
    let studentWarName = '';
    let studentId = '';
    let studentCohort = 'CAS PMPE 2026 · 1ª TURMA';
    const userAnswers = new Array(ASSESSMENT_DATA.questions.length).fill(null);
    const questionTimes = new Array(ASSESSMENT_DATA.questions.length).fill(0);
    let questionStartTimestamp = Date.now();

    let radarChart = null;
    let cohortCompareChart = null;
    let rankingChart = null;

    document.getElementById('quiz-title').textContent = ASSESSMENT_DATA.title;
    document.getElementById('quiz-subtitle').textContent = ASSESSMENT_DATA.subtitle;

    const step1 = document.getElementById('step-1');
    const step2 = document.getElementById('step-2');
    const step3 = document.getElementById('step-3');
    const gameHud = document.getElementById('game-hud');
    const rankModal = document.getElementById('rank-modal');
    const labelRank = document.getElementById('label-rank');
    const hintRank = document.getElementById('hint-rank');

    // Inicialização da Janela Flutuante de Graduações
    const rankContainer = document.getElementById('rank-buttons-container');
    function renderRankButtons() {
      rankContainer.innerHTML = '';
      RANKS.forEach(function(r) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'p-2.5 rounded-xl border text-left font-mono-num font-semibold text-xs transition cursor-pointer flex items-center justify-between ' +
          (selectedRank === r ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold' : 'bg-slate-950/80 hover:bg-slate-800 border-slate-800 text-slate-200');
        btn.innerHTML = '<span>' + r + '</span>' + (selectedRank === r ? '<i class="fa-solid fa-check"></i>' : '');
        btn.addEventListener('click', function() {
          selectedRank = r;
          labelRank.textContent = r;
          hintRank.textContent = r;
          rankModal.classList.add('hidden');
          renderRankButtons();
        });
        rankContainer.appendChild(btn);
      });
    }
    renderRankButtons();

    document.getElementById('btn-rank-selector').addEventListener('click', function() {
      rankModal.classList.remove('hidden');
    });
    document.getElementById('btn-close-rank-modal').addEventListener('click', function() {
      rankModal.classList.add('hidden');
    });

    function getMetrics() {
      let score = 0;
      let curStreak = 0;
      let maxStreak = 0;
      let answeredCount = 0;
      let totalTime = 0;
      let fastest = 999;

      const pillarData = {};
      PILLARS.forEach(function(p) { pillarData[p] = { earned: 0, total: 0 }; });

      ASSESSMENT_DATA.questions.forEach(function(q, idx) {
        const u = userAnswers[idx];
        const isOk = u === q.correctIndex;
        const time = questionTimes[idx] || 0;
        const pKey = q.pillar && PILLARS.indexOf(q.pillar) >= 0 ? q.pillar : 'Normas & Tipos Processuais';

        pillarData[pKey].total += q.points;
        if (isOk) {
          pillarData[pKey].earned += q.points;
          score += q.points;
          curStreak += 1;
          if (curStreak > maxStreak) maxStreak = curStreak;
          if (time > 0 && time < fastest) fastest = time;
        } else if (u !== null) {
          curStreak = 0;
        }

        if (u !== null) {
          answeredCount++;
          totalTime += time > 0 ? time : 5;
        }
      });

      const pillarPct = {};
      PILLARS.forEach(function(p) {
        pillarPct[p] = pillarData[p].total > 0 ? Math.round((pillarData[p].earned / pillarData[p].total) * 100) : 0;
      });

      return {
        score: score,
        maxStreak: maxStreak,
        avgTime: answeredCount > 0 ? totalTime / answeredCount : 0,
        fastest: fastest === 999 ? 0 : fastest,
        pillarPct: pillarPct
      };
    }

    function renderQuestion(index) {
      const q = ASSESSMENT_DATA.questions[index];
      document.getElementById('question-meta').textContent = 'Missão ' + (index + 1) + ' de ' + ASSESSMENT_DATA.questions.length + ' · ' + q.pillar + ' (' + q.points + ' pts)';
      document.getElementById('question-stem').textContent = q.stem;
      document.getElementById('hud-progress-text').textContent = (index + 1) + '/' + ASSESSMENT_DATA.questions.length + ' (' + Math.round(((index + 1) / ASSESSMENT_DATA.questions.length) * 100) + '%)';
      document.getElementById('hud-progress-bar').style.width = Math.round(((index + 1) / ASSESSMENT_DATA.questions.length) * 100) + '%';

      const m = getMetrics();
      document.getElementById('hud-xp').textContent = m.score + ' pts';
      document.getElementById('hud-streak').textContent = m.maxStreak + 'x';
      document.getElementById('hud-intimacy-pct').textContent = m.score + '%';
      document.getElementById('hud-intimacy-bar').style.width = m.score + '%';

      const optContainer = document.getElementById('options-container');
      optContainer.innerHTML = '';
      const letters = ['A', 'B', 'C', 'D'];
      const fb = document.getElementById('instant-feedback');
      fb.classList.add('hidden');

      q.options.forEach(function(optText, optIdx) {
        const isSelected = userAnswers[index] === optIdx;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'w-full text-left p-4 rounded-xl border transition flex items-start gap-3.5 cursor-pointer ' +
          (isSelected
            ? (optIdx === q.correctIndex ? 'bg-emerald-950/70 border-emerald-500 text-emerald-100 anim-hit' : 'bg-rose-950/70 border-rose-500 text-rose-100 anim-hit')
            : 'bg-slate-950/80 hover:bg-slate-900 border-slate-800 text-slate-200');

        btn.innerHTML = '<span class="w-6 h-6 rounded-lg font-mono-num text-xs font-bold flex items-center justify-center shrink-0 ' +
          (isSelected ? (optIdx === q.correctIndex ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white') : 'bg-slate-800 text-slate-300') + '">' +
          letters[optIdx] + '</span><span class="text-xs sm:text-sm leading-relaxed">' + optText + '</span>';

        btn.addEventListener('click', function() {
          if (userAnswers[index] === null) {
            questionTimes[index] = Math.max(1, (Date.now() - questionStartTimestamp) / 1000);
          }
          userAnswers[index] = optIdx;
          document.getElementById('option-warning').classList.add('hidden');
          renderQuestion(index);

          fb.classList.remove('hidden');
          if (optIdx === q.correctIndex) {
            fb.className = 'mb-6 p-4 rounded-xl border bg-emerald-950/80 border-emerald-500/80 text-emerald-200 text-xs sm:text-sm leading-relaxed';
            fb.innerHTML = '<strong class="text-emerald-400 block mb-1">✓ Resposta Correta (+10 pts)</strong>' + q.explanation;
          } else {
            fb.className = 'mb-6 p-4 rounded-xl border bg-rose-950/80 border-rose-500/80 text-rose-200 text-xs sm:text-sm leading-relaxed';
            fb.innerHTML = '<strong class="text-rose-400 block mb-1">✕ Atenção — Diretriz da Apostila:</strong>' + q.explanation;
          }
        });

        optContainer.appendChild(btn);
      });

      document.getElementById('btn-prev').disabled = index === 0;
      document.getElementById('btn-next').innerHTML = index === ASSESSMENT_DATA.questions.length - 1 ? 'Finalizar Operação <i class="fa-solid fa-flag-checkered ml-1.5"></i>' : 'Avançar Fase <i class="fa-solid fa-arrow-right ml-1.5"></i>';
    }

    document.getElementById('student-form').addEventListener('submit', function(e) {
      e.preventDefault();
      studentWarName = document.getElementById('student-war-name').value.trim();
      studentId = document.getElementById('student-id').value.trim();
      studentCohort = document.getElementById('student-cohort').value;

      var hasFormError = false;
      if (!studentWarName) {
        document.getElementById('name-error').classList.remove('hidden');
        hasFormError = true;
      } else {
        document.getElementById('name-error').classList.add('hidden');
      }

      var validGmail = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(studentId || '');
      if (!validGmail) {
        var emailErr = document.getElementById('email-error');
        if (emailErr) emailErr.classList.remove('hidden');
        document.getElementById('student-id').classList.add('border-rose-500');
        hasFormError = true;
      } else {
        var emailErrOk = document.getElementById('email-error');
        if (emailErrOk) emailErrOk.classList.add('hidden');
        document.getElementById('student-id').classList.remove('border-rose-500');
      }

      if (!studentCohort) {
        document.getElementById('cohort-error').classList.remove('hidden');
        document.getElementById('student-cohort').classList.add('border-rose-500');
        hasFormError = true;
      } else {
        document.getElementById('cohort-error').classList.add('hidden');
        document.getElementById('student-cohort').classList.remove('border-rose-500');
      }

      if (hasFormError) return;

      const fullStudentName = selectedRank + ' ' + studentWarName;
      document.getElementById('hud-player').textContent = fullStudentName + ' · ' + studentCohort;
      step1.classList.add('hidden');
      gameHud.classList.remove('hidden');
      step2.classList.remove('hidden');
      currentIndex = 0;
      questionStartTimestamp = Date.now();
      renderQuestion(0);
    });

    document.getElementById('student-cohort').addEventListener('change', function() {
      document.getElementById('cohort-error').classList.add('hidden');
      document.getElementById('student-cohort').classList.remove('border-rose-500');
    });

    document.getElementById('btn-prev').addEventListener('click', function() {
      if (currentIndex > 0) {
        currentIndex--;
        questionStartTimestamp = Date.now();
        renderQuestion(currentIndex);
      }
    });

    document.getElementById('btn-next').addEventListener('click', function() {
      if (userAnswers[currentIndex] === null) {
        document.getElementById('option-warning').classList.remove('hidden');
        return;
      }
      document.getElementById('option-warning').classList.add('hidden');
      if (currentIndex < ASSESSMENT_DATA.questions.length - 1) {
        currentIndex++;
        questionStartTimestamp = Date.now();
        renderQuestion(currentIndex);
      } else {
        showResults();
      }
    });

    function launchConfetti(scoreVal) {
      const canvas = document.getElementById('confetti-canvas');
      canvas.classList.remove('hidden');
      const ctx = canvas.getContext('2d');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const colors = scoreVal >= 80
        ? ['#fbbf24', '#10b981', '#34d399', '#fde047', '#38bdf8', '#ffffff']
        : ['#38bdf8', '#fbbf24', '#10b981', '#818cf8', '#f8fafc'];
      const particles = [];
      for (let i = 0; i < 130; i++) {
        const fromLeft = i % 2 === 0;
        const angle = fromLeft ? (-Math.PI / 3 + (Math.random() - 0.5) * 0.6) : (-2 * Math.PI / 3 + (Math.random() - 0.5) * 0.6);
        const speed = 8 + Math.random() * 11;
        particles.push({
          x: fromLeft ? canvas.width * 0.15 : canvas.width * 0.85,
          y: canvas.height * 0.65,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 7 + Math.random() * 6,
          color: colors[Math.floor(Math.random() * colors.length)],
          rot: Math.random() * 6.28,
          rotSpeed: (Math.random() - 0.5) * 0.2,
          wobble: Math.random() * 6.28,
          opacity: 1
        });
      }
      const start = performance.now();
      function frame(now) {
        const elapsed = now - start;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let alive = 0;
        particles.forEach(function(p) {
          p.vx *= 0.985;
          p.vy = p.vy * 0.985 + 0.22;
          p.wobble += 0.07;
          p.x += p.vx + Math.sin(p.wobble) * 1.3;
          p.y += p.vy;
          p.rot += p.rotSpeed;
          if (elapsed > 3000) p.opacity = Math.max(0, 1 - (elapsed - 3000) / 1500);
          if (p.y < canvas.height + 40 && p.opacity > 0.01) {
            alive++;
            ctx.save();
            ctx.globalAlpha = p.opacity;
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
            ctx.restore();
          }
        });
        if (elapsed < 4500 && alive > 0) requestAnimationFrame(frame);
        else {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          canvas.classList.add('hidden');
        }
      }
      requestAnimationFrame(frame);
    }

    function showResults() {
      step2.classList.add('hidden');
      gameHud.classList.add('hidden');
      step3.classList.remove('hidden');

      const m = getMetrics();
      const totalScore = m.score;
      launchConfetti(totalScore);

      const fullStudentName = selectedRank + ' ' + studentWarName;

      const dateStr = new Date().toLocaleDateString('pt-BR');
      const timeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      // Se o militar já realizou o teste, a última nota sempre prevalece mantendo o histórico de progresso!
      const existingIdx = CLASS_ROSTER.findIndex(function(s) {
        if (isInstructor(s)) return false; // Nunca substitui o instrutor
        const matchName = s.name.trim().toLowerCase() === fullStudentName.trim().toLowerCase();
        const matchId = studentId && s.registration && s.registration.trim().toLowerCase() === studentId.trim().toLowerCase();
        return matchName || matchId;
      });

      let currentHistory = [];
      const newAttemptItem = {
        attemptNumber: 1,
        score: totalScore,
        date: dateStr,
        time: timeStr,
        pillarScores: m.pillarPct
      };

      if (existingIdx >= 0) {
        const existing = CLASS_ROSTER[existingIdx];
        const prevHist = existing.history && existing.history.length > 0 ? existing.history : [{
          attemptNumber: 1,
          score: existing.score,
          date: dateStr,
          time: existing.completedAt || timeStr,
          pillarScores: existing.pillarScores || m.pillarPct
        }];
        newAttemptItem.attemptNumber = prevHist.length + 1;
        currentHistory = prevHist.concat([newAttemptItem]);

        const updatedStudent = {
          id: existing.id,
          name: fullStudentName,
          registration: studentId || existing.registration || 'CAS-2026',
          cohort: studentCohort,
          score: totalScore,
          tier: totalScore < 50 ? 'Iniciante' : totalScore < 80 ? 'Intermediário' : 'Avançado',
          completedAt: timeStr,
          pillarScores: m.pillarPct,
          attemptsCount: currentHistory.length,
          history: currentHistory
        };
        CLASS_ROSTER[existingIdx] = updatedStudent;
      } else {
        currentHistory = [newAttemptItem];
        const newRecord = {
          id: 'cur-' + Date.now(),
          name: fullStudentName,
          registration: studentId || 'CAS-2026',
          cohort: studentCohort,
          score: totalScore,
          tier: totalScore < 50 ? 'Iniciante' : totalScore < 80 ? 'Intermediário' : 'Avançado',
          completedAt: timeStr,
          pillarScores: m.pillarPct,
          attemptsCount: 1,
          history: currentHistory
        };
        // Adiciona novo candidato ao placar geral em igualdade de condições
        CLASS_ROSTER = [newRecord].concat(CLASS_ROSTER);
      }

      try {
        localStorage.setItem('cfoa_pmpe_roster_zeroed_v1', JSON.stringify(CLASS_ROSTER));
      } catch (e) {}

      // Atualiza visualização de progresso do aluno nas etapas
      const attemptsCount = currentHistory.length;
      document.getElementById('progress-attempts-count').textContent = attemptsCount + (attemptsCount === 1 ? ' tentativa' : ' tentativas');
      const progressBox = document.getElementById('progress-history-summary');
      if (attemptsCount > 1) {
        const firstScore = currentHistory[0].score;
        const diff = totalScore - firstScore;
        progressBox.innerHTML = '<div class="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">' +
          '<div class="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between"><span class="text-slate-400">1ª Tentativa:</span><strong class="text-slate-200">' + firstScore + ' pts</strong></div>' +
          '<div class="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between"><span class="text-slate-400">Última Tentativa:</span><strong class="text-emerald-400">' + totalScore + ' pts</strong></div>' +
          '<div class="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between"><span class="text-slate-400">Evolução:</span><strong class="' + (diff >= 0 ? 'text-emerald-400' : 'text-rose-400') + '">' + (diff >= 0 ? '+' : '') + diff + ' pts</strong></div>' +
          '</div>';
      } else {
        progressBox.innerHTML = '<p class="text-slate-400 text-xs">Esta é a sua 1ª tentativa registrada. Você pode refazer o desafio quantas vezes quiser — sua evolução ficará guardada etapa por etapa!</p>';
      }

      document.getElementById('res-date').textContent = dateStr;
      document.getElementById('res-student-name').textContent = fullStudentName;
      document.getElementById('res-student-meta').textContent = (studentId ? studentId + ' · ' : '') + studentCohort + ' · Tempo médio: ' + m.avgTime.toFixed(1) + 's/missão';
      document.getElementById('res-score').textContent = String(totalScore);

      const badgeEl = document.getElementById('res-badge');
      const tierTitleEl = document.getElementById('res-tier-title');
      const feedbackEl = document.getElementById('res-feedback-text');

      if (totalScore <= 49) {
        badgeEl.className = 'px-4 py-3 rounded-xl border text-xs sm:text-sm font-bold bg-amber-950/90 border-amber-500 text-amber-300';
        badgeEl.textContent = '▲ Soldado Recruta do SEI (0–49 pts)';
        tierTitleEl.textContent = 'Iniciante / Sem Intimidade — Necessita Capacitação Básica';
        feedbackEl.textContent = 'Recomendação: Pratique no Ambiente de Treinamento (www.sei4treina.pe.gov.br) e revise os conceitos basilares do Decreto nº 45.157/2017 e da Portaria SAD nº 123/2020.';
      } else if (totalScore <= 79) {
        badgeEl.className = 'px-4 py-3 rounded-xl border text-xs sm:text-sm font-bold bg-sky-950/90 border-sky-500 text-sky-300';
        badgeEl.textContent = '● Operador Prático do SEI (50–79 pts)';
        tierTitleEl.textContent = 'Intermediário / Conhecimento Básico — Opera Rotinas com Segurança';
        feedbackEl.textContent = 'Bom domínio operacional! Para atingir o nível de Especialista SEI, revise as nuances de Processos Sigilosos (credenciais pessoais), desanexação e prazos.';
      } else {
        badgeEl.className = 'px-4 py-3 rounded-xl border text-xs sm:text-sm font-bold bg-emerald-950/90 border-emerald-500 text-emerald-300';
        badgeEl.textContent = '★ Especialista / Gestor SEI (80–100 pts)';
        tierTitleEl.textContent = 'Avançado / Com Intimidade — Domínio Total dos Fluxos e Regras';
        feedbackEl.textContent = 'Excelente desempenho na Operação SEI em Foco! Você domina integralmente as regras técnicas e normativas da apostila DTSEI para o CAS PMPE 2026.';
      }

      // Render Achievement Badges
      const badges = [
        { title: 'Fast Responder (Resposta Rápida)', desc: 'Média ≤ 15s por missão', unlocked: m.avgTime > 0 && m.avgTime <= 15, stat: m.avgTime.toFixed(1) + 's/item', icon: 'fa-bolt' },
        { title: 'Perfect Combo (Combo Perfeito)', desc: 'Sequência de 5+ acertos seguidos', unlocked: m.maxStreak >= 5, stat: 'Streak: ' + m.maxStreak + 'x', icon: 'fa-fire' },
        { title: 'SEI Master (Mestre do SEI)', desc: 'Pontuação final ≥ 80 pontos', unlocked: totalScore >= 80, stat: totalScore + '/100 pts', icon: 'fa-crown' },
        { title: 'Guardião do Sigilo & 2FA', desc: '100% em Segurança e Normas', unlocked: m.pillarPct['Segurança & Acesso'] === 100 && m.pillarPct['Normas & Tipos Processuais'] === 100, stat: 'Pilares Críticos', icon: 'fa-shield-halved' },
        { title: 'Reflexo Tático', desc: 'Acerto cravado em até 6 segundos', unlocked: m.fastest > 0 && m.fastest <= 6, stat: (m.fastest > 0 ? m.fastest.toFixed(1) + 's' : '--'), icon: 'fa-stopwatch' },
        { title: 'Gabarito Impecável CAS', desc: '100/100 pontos sem erros', unlocked: totalScore === 100, stat: Math.round(totalScore / 10) + '/10 missões', icon: 'fa-award' }
      ];

      const unlockedCount = badges.filter(function(b) { return b.unlocked; }).length;
      document.getElementById('badges-counter').textContent = unlockedCount + ' de ' + badges.length + ' desbloqueadas';

      const bGrid = document.getElementById('badges-grid');
      bGrid.innerHTML = '';
      badges.forEach(function(b) {
        const card = document.createElement('div');
        card.className = 'p-3.5 rounded-xl border flex items-start gap-3 ' +
          (b.unlocked ? 'bg-emerald-950/50 border-amber-400/70 text-white' : 'bg-slate-950/50 border-slate-800 text-slate-500 opacity-65');
        card.innerHTML = '<div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ' + (b.unlocked ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-500') + '"><i class="fa-solid ' + b.icon + '"></i></div>' +
          '<div class="min-w-0 flex-1"><div class="text-xs font-bold truncate">' + b.title + '</div><div class="text-[11px] opacity-80">' + b.desc + '</div><div class="text-[10px] font-mono-num mt-1 ' + (b.unlocked ? 'text-amber-300 font-semibold' : '') + '">' + (b.unlocked ? '★ DESBLOQUEADA · ' : 'Bloqueada · ') + b.stat + '</div></div>';
        bGrid.appendChild(card);
      });

      // Popula o Lembrete de Revisão em 24h baseado no pilar de menor rendimento
      const pillarsList = ['Segurança & Acesso', 'Normas & Tipos Processuais', 'Documentos & Blocos', 'Tramitação & Integridade'];
      let lowestP = pillarsList[0];
      let minPScore = 999;
      pillarsList.forEach(function(p) {
        const sc = m.pillarPct[p] !== undefined ? m.pillarPct[p] : 100;
        if (sc < minPScore) {
          minPScore = sc;
          lowestP = p;
        }
      });

      const remMap = {
        'Segurança & Acesso': {
          title: 'Módulo 01 e Módulo 04 — Acesso gov.br, 2FA e Níveis de Sigilo',
          pages: 'Págs. 07 a 12 e 64 a 68',
          summary: 'Acesso gov.br com Duplo Fator (2FA) obrigatório; processos Sigilosos exigem Credencial de Acesso concedida pessoa a pessoa.'
        },
        'Normas & Tipos Processuais': {
          title: 'Módulo 09 — Ciência no Processo, Base de Conhecimento e Pesquisa',
          pages: 'Págs. 41 e 69 a 75',
          summary: 'Uso do ícone Ciência (polegar/check) no lugar de despachos repetitivos; operadores booleanos e Base de Conhecimento.'
        },
        'Documentos & Blocos': {
          title: 'Módulo 05 e Módulo 07 — Documentos Internos vs. Externos e Blocos de Assinatura',
          pages: 'Págs. 24 a 34 e 44 a 52',
          summary: 'Documento escaneado exige OCR a 300 dpi (200 MB); no Bloco de Assinatura é obrigatório clicar em Disponibilizar Bloco.'
        },
        'Tramitação & Integridade': {
          title: 'Módulo 08 e Módulo 10 — Tramitação, Sobrestamento, Anexação e Cancelamento',
          pages: 'Págs. 36 a 38, 39 a 43 e 56 a 63',
          summary: 'NÃO existe exclusão de processos no SEI; Anexação une definitivamente os processos; Sobrestamento suspende temporariamente.'
        }
      };

      const remData = remMap[lowestP] || remMap['Tramitação & Integridade'];
      const remPillarNameEl = document.getElementById('rem-pillar-name');
      const remPillarScoreEl = document.getElementById('rem-pillar-score');
      const remChapterTitleEl = document.getElementById('rem-chapter-title');
      const remPagesEl = document.getElementById('rem-pages');
      const remSummaryEl = document.getElementById('rem-summary');
      const remScheduledTimeEl = document.getElementById('rem-scheduled-time');

      if (remPillarNameEl) remPillarNameEl.textContent = lowestP;
      if (remPillarScoreEl) remPillarScoreEl.textContent = minPScore + '% de acerto no diagnóstico';
      if (remChapterTitleEl) remChapterTitleEl.textContent = remData.title;
      if (remPagesEl) remPagesEl.textContent = remData.pages;
      if (remSummaryEl) remSummaryEl.textContent = remData.summary;

      const schedDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      if (remScheduledTimeEl) {
        remScheduledTimeEl.textContent = schedDate.toLocaleDateString('pt-BR') + ' às ' + schedDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + ' (em 24h)';
      }

      const btnSim24h = document.getElementById('btn-simulate-24h');
      if (btnSim24h) {
        btnSim24h.onclick = function() {
          alert('🔔 ALERTA DE REVISÃO TÁTICA (24h Pós-Desafio) — CAS PMPE 2026\n\nSargento ' + fullStudentName + ',\nSeu menor rendimento foi em: ' + lowestP + ' (' + minPScore + '%).\n\nTópico recomendado da Apostila DT-SEI:\n' + remData.title + ' (' + remData.pages + ').\n\nPonto-chave:\n' + remData.summary);
          playVictorySound();
        };
      }

      const btnNatNotify = document.getElementById('btn-native-notify');
      if (btnNatNotify) {
        btnNatNotify.onclick = function() {
          if ('Notification' in window) {
            Notification.requestPermission().then(function(perm) {
              if (perm === 'granted') {
                alert('✓ Notificações do navegador ativadas para o lembrete de 24h!');
              } else {
                alert('Permissão de notificação não concedida.');
              }
            });
          } else {
            alert('Navegador sem suporte à API de notificações.');
          }
        };
      }

      // Gráfico 1: Radar Individual
      if (radarChart) radarChart.destroy();
      radarChart = new Chart(document.getElementById('chart-radar').getContext('2d'), {
        type: 'radar',
        data: {
          labels: PILLARS,
          datasets: [{
            label: 'Seu Perfil (%)',
            data: PILLARS.map(function(p) { return m.pillarPct[p] || 0; }),
            backgroundColor: 'rgba(16, 185, 129, 0.25)',
            borderColor: '#10b981',
            pointBackgroundColor: '#fbbf24',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: { r: { beginAtZero: true, max: 100, grid: { color: 'rgba(148,163,184,0.2)' }, pointLabels: { color: '#e2e8f0', font: { size: 10 } }, ticks: { display: false } } },
          plugins: { legend: { labels: { color: '#cbd5e1' } } }
        }
      });

      // Classificador de opção (Turma 01, Turma 02, Visitantes)
      function getCategory(s) {
        const c = (s.cohort || '').trim();
        if (c.indexOf('Visitante') >= 0 || c.indexOf('Outras') >= 0) return 'Visitantes';
        if (c.indexOf('Turma 02') >= 0 || c.indexOf('2ª') >= 0) return 'Turma 02';
        return 'Turma 01';
      }

      const t1Students = CLASS_ROSTER.filter(function(s) { return getCategory(s) === 'Turma 01'; });
      const t2Students = CLASS_ROSTER.filter(function(s) { return getCategory(s) === 'Turma 02'; });
      const visStudents = CLASS_ROSTER.filter(function(s) { return getCategory(s) === 'Visitantes'; });

      const avgT1 = t1Students.length > 0 ? Math.round(t1Students.reduce(function(a, s) { return a + s.score; }, 0) / t1Students.length) : 0;
      const avgT2 = t2Students.length > 0 ? Math.round(t2Students.reduce(function(a, s) { return a + s.score; }, 0) / t2Students.length) : 0;
      const avgVis = visStudents.length > 0 ? Math.round(visStudents.reduce(function(a, s) { return a + s.score; }, 0) / visStudents.length) : 0;

      document.getElementById('stat-t1-avg').textContent = avgT1 + ' pts';
      document.getElementById('stat-t1-count').textContent = t1Students.length + ' militar(es)';
      document.getElementById('stat-t2-avg').textContent = avgT2 + ' pts';
      document.getElementById('stat-t2-count').textContent = t2Students.length + ' militar(es)';
      if (document.getElementById('stat-vis-avg')) document.getElementById('stat-vis-avg').textContent = avgVis + ' pts';
      if (document.getElementById('stat-vis-count')) document.getElementById('stat-vis-count').textContent = visStudents.length + ' militar(es)';

      function calcPillarAvg(list, p) {
        if (list.length === 0) return 0;
        const sum = list.reduce(function(a, s) { return a + (s.pillarScores && s.pillarScores[p] ? s.pillarScores[p] : s.score); }, 0);
        return Math.round(sum / list.length);
      }

      // Gráfico 2: Comparativo entre as Opções (Barras)
      if (cohortCompareChart) cohortCompareChart.destroy();
      cohortCompareChart = new Chart(document.getElementById('chart-cohort-compare').getContext('2d'), {
        type: 'bar',
        data: {
          labels: ['Média Geral', 'Segurança', 'Normas', 'Documentos', 'Tramitação'],
          datasets: [
            {
              label: 'Turma 01 (' + t1Students.length + ')',
              data: [avgT1, calcPillarAvg(t1Students, 'Segurança & Acesso'), calcPillarAvg(t1Students, 'Normas & Tipos Processuais'), calcPillarAvg(t1Students, 'Documentos & Blocos'), calcPillarAvg(t1Students, 'Tramitação & Integridade')],
              backgroundColor: '#10b981',
              borderRadius: 6
            },
            {
              label: 'Turma 02 (' + t2Students.length + ')',
              data: [avgT2, calcPillarAvg(t2Students, 'Segurança & Acesso'), calcPillarAvg(t2Students, 'Normas & Tipos Processuais'), calcPillarAvg(t2Students, 'Documentos & Blocos'), calcPillarAvg(t2Students, 'Tramitação & Integridade')],
              backgroundColor: '#38bdf8',
              borderRadius: 6
            },
            {
              label: 'Visitantes (' + visStudents.length + ')',
              data: [avgVis, calcPillarAvg(visStudents, 'Segurança & Acesso'), calcPillarAvg(visStudents, 'Normas & Tipos Processuais'), calcPillarAvg(visStudents, 'Documentos & Blocos'), calcPillarAvg(visStudents, 'Tramitação & Integridade')],
              backgroundColor: '#a78bfa',
              borderRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true, max: 100, ticks: { color: '#94a3b8' } },
            x: { ticks: { color: '#e2e8f0', font: { size: 10 } } }
          },
          plugins: { legend: { labels: { color: '#cbd5e1' } } }
        }
      });

      // Gráfico 3: Ranking e Comparativo dos Alunos (Instrutor sempre em 1º)
      const sortedStudents = CLASS_ROSTER.slice().sort(function(a, b) {
        const aIs = isInstructor(a);
        const bIs = isInstructor(b);
        if (aIs && !bIs) return -1;
        if (!aIs && bIs) return 1;
        return b.score - a.score;
      });

      if (rankingChart) rankingChart.destroy();
      rankingChart = new Chart(document.getElementById('chart-ranking').getContext('2d'), {
        type: 'bar',
        data: {
          labels: sortedStudents.map(function(s) {
            return isInstructor(s) ? '★ 1º SGT PM GREGÓRIO [DOC]' : (s.name.length > 20 ? s.name.slice(0, 20) + '…' : s.name) + ' [' + getCategory(s) + ']';
          }),
          datasets: [{
            label: 'Pontuação (0–100)',
            data: sortedStudents.map(function(s) { return s.score; }),
            backgroundColor: sortedStudents.map(function(s) {
              if (isInstructor(s)) return '#f59e0b';
              if (s.name.trim().toLowerCase() === fullStudentName.trim().toLowerCase()) return '#fde047';
              const cat = getCategory(s);
              if (cat === 'Visitantes') return '#a78bfa';
              if (cat === 'Turma 02') return '#38bdf8';
              return '#10b981';
            }),
            borderRadius: 6,
            maxBarThickness: 20
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { beginAtZero: true, max: 100, ticks: { color: '#94a3b8' } },
            y: { ticks: { color: '#e2e8f0', font: { size: 10 } } }
          },
          plugins: { legend: { display: false } }
        }
      });

      // Renderização do Quadro Geral com Animação Fade-in e Destaque
      let rosterFilter = 'ALL';
      function renderRosterTable(highlightId) {
        const tbody = document.getElementById('roster-table-body');
        const container = document.getElementById('roster-table-container');
        if (!tbody || !container) return;

        container.classList.remove('animate-table-fade-in');
        void container.offsetWidth;
        container.classList.add('animate-table-fade-in');

        const sorted = CLASS_ROSTER.slice().sort(function(a, b) {
          const aIs = isInstructor(a);
          const bIs = isInstructor(b);
          if (aIs && !bIs) return -1;
          if (!aIs && bIs) return 1;
          return b.score - a.score;
        }).filter(function(s) {
          if (isInstructor(s)) return true;
          if (rosterFilter === 'ALL') return true;
          return getCategory(s) === rosterFilter;
        });

        tbody.innerHTML = '';
        sorted.forEach(function(s, idx) {
          const isInst = isInstructor(s);
          const isTarget = highlightId && (s.id === highlightId || s.name.trim().toLowerCase() === fullStudentName.trim().toLowerCase());
          const tr = document.createElement('tr');
          tr.style.animationDelay = Math.min(idx * 30, 300) + 'ms';

          let rowClass = 'hover:bg-slate-950/50 text-slate-200 transition-colors animate-row-item';
          if (isInst) {
            rowClass = 'bg-amber-950/30 text-white border-l-4 border-amber-400 font-semibold';
            if (isTarget) rowClass += ' ring-2 ring-amber-400/80 animate-row-recent shadow-lg';
          } else if (isTarget) {
            rowClass = 'bg-amber-400/20 text-white font-semibold border-l-4 border-amber-400 ring-2 ring-amber-400/70 animate-row-recent shadow-lg';
          }
          tr.className = rowClass;

          const tierLabel = s.score >= 80 ? '★ Especialista SEI' : (s.score >= 50 ? '● Operador Prático' : '▲ Soldado Recruta');
          const tierColor = s.score >= 80 ? 'text-emerald-400' : (s.score >= 50 ? 'text-sky-400' : 'text-amber-400');
          const attempts = s.attemptsCount || (s.history ? s.history.length : 1);
          const cat = getCategory(s);
          const badgeStyle = cat === 'Visitantes'
            ? 'bg-purple-950 text-purple-300 border border-purple-800/60'
            : cat === 'Turma 02'
            ? 'bg-sky-950 text-sky-300 border border-sky-800/60'
            : 'bg-emerald-950 text-emerald-300 border border-emerald-800/60';

          tr.innerHTML = '<td class="py-3.5 px-3 sm:px-4 font-mono-num font-bold">' +
            (isInst ? '<span class="text-amber-400 flex items-center gap-1"><i class="fa-solid fa-crown text-xs"></i> #1</span>' : '<span class="text-slate-400">#' + (idx + 1) + '</span>') +
            '</td>' +
            '<td class="py-3.5 px-3 sm:px-4 font-semibold text-white">' +
            '<div class="flex flex-wrap items-center gap-1.5">' +
            '<span>' + s.name + '</span>' +
            (isInst ? '<span class="text-[10px] bg-amber-400 text-slate-950 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Instrutor</span>' : '') +
            (isTarget && !isInst ? '<span class="inline-flex items-center gap-1 text-[10px] bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm animate-pulse-glow"><i class="fa-solid fa-sparkles"></i> Nota Recente</span>' : '') +
            '</div>' +
            '</td>' +
            '<td class="py-3.5 px-3 sm:px-4 font-mono-num text-slate-400 hidden sm:table-cell">' + (s.registration || 'CAS-2026') + '</td>' +
            '<td class="py-3.5 px-3 sm:px-4 text-slate-300"><span class="px-2 py-0.5 rounded text-[11px] font-medium ' + badgeStyle + '">' + cat + '</span></td>' +
            '<td class="py-3.5 px-3 sm:px-4"><span class="font-semibold ' + tierColor + '">' + tierLabel + '</span></td>' +
            '<td class="py-3.5 px-3 sm:px-4 text-center hidden md:table-cell font-mono-num text-xs text-slate-300"><span class="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">' + attempts + (attempts === 1 ? ' tentativa' : ' tentativas') + '</span></td>' +
            '<td class="py-3.5 px-3 sm:px-4 text-right font-mono-num font-bold text-white">' + s.score + ' pts</td>';

          tbody.appendChild(tr);
        });
      }

      // Banner de atividade recente
      const banner = document.getElementById('roster-recent-banner');
      if (banner) {
        banner.classList.remove('hidden');
        document.getElementById('roster-recent-name').textContent = fullStudentName + ' (' + totalScore + ' pts)';
      }

      renderRosterTable(existingIdx >= 0 ? CLASS_ROSTER[existingIdx].id : 'cur-latest');

      const fAll = document.getElementById('roster-filter-all');
      const fT1 = document.getElementById('roster-filter-t1');
      const fT2 = document.getElementById('roster-filter-t2');
      const fVis = document.getElementById('roster-filter-vis');
      const filterButtons = [
        { el: fAll, val: 'ALL', activeClass: 'bg-amber-400 text-slate-950' },
        { el: fT1, val: 'Turma 01', activeClass: 'bg-emerald-500 text-slate-950' },
        { el: fT2, val: 'Turma 02', activeClass: 'bg-sky-400 text-slate-950' },
        { el: fVis, val: 'Visitantes', activeClass: 'bg-purple-400 text-slate-950' }
      ];
      filterButtons.forEach(function(item) {
        if (!item.el) return;
        item.el.onclick = function() {
          rosterFilter = item.val;
          filterButtons.forEach(function(b) {
            if (!b.el) return;
            b.el.className = b.val === rosterFilter
              ? 'px-3 py-1.5 rounded-lg font-semibold ' + b.activeClass + ' cursor-pointer'
              : 'px-3 py-1.5 rounded-lg font-semibold text-slate-400 hover:text-white cursor-pointer';
          });
          renderRosterTable(null);
        };
      });

      const reviewList = document.getElementById('review-list');
      reviewList.innerHTML = '';
      const letters = ['A', 'B', 'C', 'D'];
      ASSESSMENT_DATA.questions.forEach(function(q, idx) {
        const uAns = userAnswers[idx];
        const ok = uAns === q.correctIndex;
        const div = document.createElement('div');
        div.className = 'py-4 first:pt-0 last:pb-0 space-y-1.5';
        div.innerHTML = '<div class="flex justify-between text-xs"><span class="text-amber-400 font-semibold">Missão ' + (idx + 1) + ' · ' + q.topic + '</span><span class="font-mono-num font-bold ' + (ok ? 'text-emerald-400' : 'text-rose-400') + '">' + (ok ? '✓ +' + q.points + ' pts' : '✕ 0 pts') + '</span></div>' +
          '<p class="text-sm font-semibold text-white">' + q.stem + '</p>' +
          '<p class="text-xs text-emerald-300">Gabarito: (' + letters[q.correctIndex] + ') ' + q.options[q.correctIndex] + '</p>' +
          '<p class="text-xs text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800">' + q.explanation + '</p>';
        reviewList.appendChild(div);
      });
    }

    document.getElementById('btn-restart').addEventListener('click', function() {
      currentIndex = 0;
      userAnswers.fill(null);
      questionTimes.fill(0);
      var cohortSelect = document.getElementById('student-cohort');
      if (cohortSelect) {
        cohortSelect.selectedIndex = 0;
        cohortSelect.classList.remove('border-rose-500');
      }
      document.getElementById('name-error').classList.add('hidden');
      document.getElementById('cohort-error').classList.add('hidden');
      step3.classList.add('hidden');
      step1.classList.remove('hidden');
    });

    document.getElementById('btn-print').addEventListener('click', function() { window.print(); });
    document.getElementById('btn-copy').addEventListener('click', function() {
      const score = document.getElementById('res-score').textContent;
      const badge = document.getElementById('res-badge').textContent;
      const fullStudentName = selectedRank + ' ' + studentWarName;
      navigator.clipboard.writeText('CAS 2026 - DT-SEI - INST. 1ºSGT PM GREGÓRIO\nMilitar: ' + fullStudentName + '\nScore: ' + score + '/100 pts\nPatente: ' + badge);
      const btn = document.getElementById('btn-copy');
      btn.innerHTML = '<i class="fa-solid fa-check mr-1.5"></i> Score Copiado!';
      setTimeout(function() { btn.innerHTML = '<i class="fa-solid fa-copy mr-1.5"></i> Copiar Meu Score'; }, 2000);
    });

    const shareModal = document.getElementById('share-rank-modal');
    const btnOpenShareRank = document.getElementById('btn-open-share-rank');
    const btnCloseShareModal = document.getElementById('btn-close-share-modal');
    const btnShareCloseBottom = document.getElementById('btn-share-close-bottom');

    function openShareRankModal() {
      const m = getMetrics();
      const fullStudentName = selectedRank + ' ' + (studentWarName.trim() || 'Militar');
      const score = m.score;
      const tierShort = score >= 80 ? 'Avançado' : score >= 50 ? 'Intermediário' : 'Iniciante';
      const patentTitle = score >= 80 ? 'Especialista / Gestor SEI' : score >= 50 ? 'Operador Prático do SEI' : 'Soldado Recruta do SEI';
      const intimacyLevel = score >= 80 ? 'Avançado / Com Intimidade' : score >= 50 ? 'Intermediário / Conhecimento Básico' : 'Iniciante / Sem Intimidade';
      const currentDate = new Date().toLocaleDateString('pt-BR');

      document.getElementById('sm-student-name').textContent = fullStudentName;
      document.getElementById('sm-student-meta').textContent = (studentId ? 'Matrícula: ' + studentId + ' · ' : '') + studentCohort + ' · ' + currentDate;
      document.getElementById('sm-score').textContent = score;
      document.getElementById('sm-patent-title').innerHTML = (score >= 80 ? '★ ' : score >= 50 ? '● ' : '▲ ') + patentTitle;
      document.getElementById('sm-intimacy-level').innerHTML = '<strong>Nível de Intimidade:</strong> ' + intimacyLevel;
      document.getElementById('sm-tier-short').textContent = tierShort;

      const tierCard = document.getElementById('sm-tier-card');
      if (score >= 80) {
        tierCard.className = 'p-5 rounded-xl border bg-emerald-950/60 border-emerald-500 text-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4';
      } else if (score >= 50) {
        tierCard.className = 'p-5 rounded-xl border bg-sky-950/60 border-sky-500 text-sky-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4';
      } else {
        tierCard.className = 'p-5 rounded-xl border bg-amber-950/60 border-amber-500 text-amber-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4';
      }

      // Linhas da Escala Oficial
      const rowAdv = document.getElementById('sm-row-adv');
      const rowInt = document.getElementById('sm-row-int');
      const rowBeg = document.getElementById('sm-row-beg');
      rowAdv.className = score >= 80 ? 'p-3 rounded-xl border bg-emerald-950/80 border-emerald-400 ring-1 ring-emerald-400' : 'p-3 rounded-xl border bg-slate-950/60 border-slate-800 opacity-60';
      rowInt.className = score >= 50 && score < 80 ? 'p-3 rounded-xl border bg-sky-950/80 border-sky-400 ring-1 ring-sky-400' : 'p-3 rounded-xl border bg-slate-950/60 border-slate-800 opacity-60';
      rowBeg.className = score < 50 ? 'p-3 rounded-xl border bg-amber-950/80 border-amber-400 ring-1 ring-amber-400' : 'p-3 rounded-xl border bg-slate-950/60 border-slate-800 opacity-60';

      // Pilares
      const pGrid = document.getElementById('sm-pillars-grid');
      pGrid.innerHTML = '';
      PILLARS.forEach(function(p) {
        const pct = m.pillarPct[p] || 0;
        const col = document.createElement('div');
        col.className = 'p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-center';
        col.innerHTML = '<span class="text-[10px] text-slate-400 block truncate" title="' + p + '">' + p + '</span>' +
          '<strong class="font-mono-num font-bold text-sm ' + (pct >= 80 ? 'text-emerald-400' : pct >= 50 ? 'text-sky-400' : 'text-amber-400') + '">' + pct + '%</strong>';
        pGrid.appendChild(col);
      });

      shareModal.classList.remove('hidden');
    }

    if (btnOpenShareRank) btnOpenShareRank.addEventListener('click', openShareRankModal);
    if (btnCloseShareModal) btnCloseShareModal.addEventListener('click', function() { shareModal.classList.add('hidden'); });
    if (btnShareCloseBottom) btnShareCloseBottom.addEventListener('click', function() { shareModal.classList.add('hidden'); });

    function getFormattedShareText() {
      const m = getMetrics();
      const fullStudentName = selectedRank + ' ' + (studentWarName.trim() || 'Militar');
      const score = m.score;
      const patentTitle = score >= 80 ? 'Especialista / Gestor SEI' : score >= 50 ? 'Operador Prático do SEI' : 'Soldado Recruta do SEI';
      const intimacyLevel = score >= 80 ? 'Avançado / Com Intimidade' : score >= 50 ? 'Intermediário / Conhecimento Básico' : 'Iniciante / Sem Intimidade';
      return [
        '🎖️ *CFOA PMPE - TUTOR: 1ºSGT PM GREGÓRIO*',
        '📋 *CERTIFICADO DE SONDAGEM DIAGNÓSTICA TÁTICA*',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '👤 *Militar:* ' + fullStudentName,
        (studentId ? '📧 *E-mail Gmail:* ' + studentId : ''),
        '🎖️ *Unidade:* ' + studentCohort,
        '',
        '🎯 *PONTUAÇÃO:* ' + score + ' / 100 PONTOS',
        '⭐ *PATENTE:* ' + patentTitle.toUpperCase(),
        '📊 *NÍVEL DE APTIDÃO:* ' + intimacyLevel,
        '',
        '📌 *ESCALA DE CLASSIFICAÇÃO CFOA PMPE:*',
        (score >= 80 ? '▶ [X] ' : '   [ ] ') + '80 a 100 pts: Oficial de Administração (Avançado)',
        (score >= 50 && score < 80 ? '▶ [X] ' : '   [ ] ') + '50 a 79 pts: Candidato em Evolução (Intermediário)',
        (score < 50 ? '▶ [X] ' : '   [ ] ') + '0 a 49 pts: Praça em Preparação (Iniciante)',
        '',
        '📚 *DOMÍNIO NOS 4 PILARES DO CFOA PMPE:*',
        PILLARS.map(function(p) { return '• ' + p + ': ' + (m.pillarPct[p] || 0) + '%'; }).join('\n'),
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '*IMPORTHOUR© - todos os direitos reservados'
      ].filter(Boolean).join('\n');
    }

    const btnShareWhatsApp = document.getElementById('btn-share-whatsapp');
    if (btnShareWhatsApp) {
      btnShareWhatsApp.addEventListener('click', function() {
        const text = encodeURIComponent(getFormattedShareText());
        window.open('https://api.whatsapp.com/send?text=' + text, '_blank');
      });
    }

    const btnShareCopy = document.getElementById('btn-share-copy');
    if (btnShareCopy) {
      btnShareCopy.addEventListener('click', function() {
        navigator.clipboard.writeText(getFormattedShareText());
        btnShareCopy.innerHTML = '<i class="fa-solid fa-check mr-1.5 text-emerald-400"></i> Copiado!';
        setTimeout(function() { btnShareCopy.innerHTML = '<i class="fa-solid fa-copy mr-1.5"></i> Copiar Certidão'; }, 2000);
      });
    }

    const btnShareDownloadPng = document.getElementById('btn-share-download-png');
    if (btnShareDownloadPng) {
      btnShareDownloadPng.addEventListener('click', function() {
        const m = getMetrics();
        const fullStudentName = selectedRank + ' ' + (studentWarName.trim() || 'Militar');
        const score = m.score;
        const patentTitle = score >= 80 ? 'Especialista / Gestor SEI' : score >= 50 ? 'Operador Prático do SEI' : 'Soldado Recruta do SEI';
        const intimacyLevel = score >= 80 ? 'Avançado / Com Intimidade' : score >= 50 ? 'Intermediário / Conhecimento Básico' : 'Iniciante / Sem Intimidade';

        const cvs = document.createElement('canvas');
        cvs.width = 1200;
        cvs.height = 900;
        const ctx = cvs.getContext('2d');

        // Fundo
        const bg = ctx.createLinearGradient(0, 0, 1200, 900);
        bg.addColorStop(0, '#090d16');
        bg.addColorStop(1, '#050811');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, 1200, 900);

        // Moldura
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 4;
        ctx.strokeRect(20, 20, 1160, 860);

        // Cabeçalho
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(26, 26, 1148, 100);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(26, 126, 1148, 4);

        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('PREPARATÓRIO CFOA PMPE · BASE LEGAL ALEPE', 600, 60);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 26px sans-serif';
        ctx.fillText('CFOA PMPE - TUTOR: 1ºSGT PM GREGÓRIO', 600, 96);

        // Militar
        ctx.textAlign = 'left';
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(50, 155, 1100, 100);
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText('MILITAR AVALIADO:', 70, 185);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText(fullStudentName, 70, 222);

        // Patente
        const isGold = score >= 80;
        ctx.fillStyle = isGold ? '#064e3b' : score >= 50 ? '#0c4a6e' : '#78350f';
        ctx.fillRect(50, 275, 1100, 130);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 60px sans-serif';
        ctx.fillText(String(score), 80, 360);
        ctx.font = 'bold 22px sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('/ 100 PTS', 185, 360);

        ctx.fillStyle = isGold ? '#a7f3d0' : score >= 50 ? '#bae6fd' : '#fde68a';
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText('★ PATENTE: ' + patentTitle.toUpperCase(), 360, 330);
        ctx.fillStyle = '#ffffff';
        ctx.font = '18px sans-serif';
        ctx.fillText('Classificação: ' + intimacyLevel, 360, 365);

        // Escala
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText('PATENTES E NÍVEIS DE INTIMIDADE SEI — ESCALA OFICIAL CAS PMPE 2026', 50, 440);

        function drawRow(y, pts, title, desc, active, col) {
          ctx.fillStyle = active ? '#1e293b' : '#0f172a';
          ctx.fillRect(50, y, 1100, 50);
          ctx.strokeStyle = active ? col : '#334155';
          ctx.strokeRect(50, y, 1100, 50);
          ctx.fillStyle = active ? col : '#94a3b8';
          ctx.font = 'bold 15px sans-serif';
          ctx.fillText((active ? '▶ [ALCANÇADA]  ' : '   [  ]  ') + pts + '  —  ' + title + ' (' + desc + ')', 70, y + 31);
        }

        drawRow(460, '80 a 100 pts', 'Especialista / Gestor SEI', 'Avançado: domínio total de fluxos, sigilo e integridade', score >= 80, '#34d399');
        drawRow(520, '50 a 79 pts', 'Operador Prático do SEI', 'Intermediário: opera rotinas administrativas com segurança', score >= 50 && score < 80, '#38bdf8');
        drawRow(580, '0 a 49 pts', 'Soldado Recruta do SEI', 'Iniciante: requer capacitação básica no treino', score < 50, '#fbbf24');

        // Pilares
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('APROVEITAMENTO NOS 4 PILARES DA APOSTILA DTSEI', 50, 665);
        PILLARS.forEach(function(p, i) {
          const px = 50 + i * 280;
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(px, 680, 260, 65);
          ctx.strokeStyle = '#334155';
          ctx.strokeRect(px, 680, 260, 65);
          ctx.fillStyle = '#94a3b8';
          ctx.font = '12px sans-serif';
          ctx.fillText(p, px + 15, 705);
          ctx.fillStyle = '#34d399';
          ctx.font = 'bold 20px sans-serif';
          ctx.fillText((m.pillarPct[p] || 0) + '%', px + 15, 732);
        });

        // Rodapé
        ctx.textAlign = 'center';
        ctx.fillStyle = '#64748b';
        ctx.font = '13px sans-serif';
        ctx.fillText('*IMPORTHOUR© - todos os direitos reservados', 600, 850);

        const link = document.createElement('a');
        link.download = 'Certificado_CFOA_PMPE_' + fullStudentName.replace(/[^a-zA-Z0-9_-]/g, '_') + '.png';
        link.href = cvs.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    }

    const btnAdminReset = document.getElementById('btn-admin-reset');
    if (btnAdminReset) {
      btnAdminReset.addEventListener('click', function() {
        if (confirm('Atenção Administrador:\n\nDeseja realmente zerar todos os registros do placar?')) {
          CLASS_ROSTER = [];
          try {
            localStorage.setItem('cfoa_pmpe_roster_zeroed_v1', JSON.stringify(CLASS_ROSTER));
          } catch(e) {}
          location.reload();
        }
      });
    }
  </script>
</body>
</html>`;
}
