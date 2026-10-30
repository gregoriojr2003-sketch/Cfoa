import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import {
  INITIAL_COLLECTIVE_ROSTER,
  INSTRUCTOR_RECORD,
  ClassStudentRecord,
  StudentAttemptLog,
  COMPETENCY_PILLARS,
  CompetencyPillar,
} from './src/data/presets';
import {
  selectFallbackQuestionsForScope,
  GeneratorScopeMode,
} from './src/data/apostilaChapterBank';

dotenv.config();

const app = express();
app.use(express.json({ limit: '35mb' }));

// ============================================================================
// BANCO COLETIVO UNIFICADO (PERSISTÊNCIA MULTI-DISPOSITIVO EM TEMPO REAL)
// Garante que todos os militares que acessarem pelo celular ou computador
// apareçam na tabela única e nos gráficos comparativos das 2 turmas (1ª e 2ª).
// ============================================================================
const DATA_DIR = path.join(process.cwd(), 'data');
const ROSTER_FILE = path.join(DATA_DIR, 'collective-roster-cfoa-zeroed.json');
const KNOWLEDGE_BASE_FILE = path.join(DATA_DIR, 'knowledge-base.json');
const CUSTOM_PDF_FILE = path.join(DATA_DIR, 'custom-apostila.pdf');

interface CollectiveState {
  roster: ClassStudentRecord[];
  lastUpdatedAt: number;
  lastAction: {
    studentId: string;
    studentName: string;
    actionType: 'enrolled' | 'progress' | 'new' | 'updated';
    timestamp: number;
  } | null;
}

const isInstructorRecord = (s: ClassStudentRecord) =>
  s.id === 'instructor-gregorio' ||
  s.registration === 'INST-CAS-2026' ||
  s.registration === 'TUTOR-CFOA-PMPE';

const isLegacyNonGmailRecord = (s: ClassStudentRecord) => {
  if (!s) return true;
  if (isInstructorRecord(s)) return true;
  if (s.id?.startsWith('cfoa-pmpe-') || s.id?.startsWith('cas-pmpe-')) return true;
  const reg = (s.registration || '').trim().toLowerCase();
  if (!reg.endsWith('@gmail.com')) return true;
  return false;
};

const getRealTimeNowStr = (): string => {
  try {
    return new Date().toLocaleTimeString('pt-BR', {
      timeZone: 'America/Recife',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
};

function getStudentUniqueKey(item: ClassStudentRecord): string {
  const nameKey = (item.name || '').trim().toLowerCase();
  const cohortKey = (item.cohort || '1º bpm').trim().toLowerCase();
  const regKey = (item.registration || '').trim().toLowerCase();
  const hasRealReg = Boolean(regKey && regKey !== 'cas-2026' && regKey !== 's/m');
  return hasRealReg ? `${nameKey}::${cohortKey}::${regKey}` : `${nameKey}::${cohortKey}`;
}

function normalizeRoster(list: ClassStudentRecord[]): ClassStudentRecord[] {
  const map = new Map<string, ClassStudentRecord>();
  const fallbackNow = getRealTimeNowStr();
  for (const item of list) {
    if (!item || !item.name) continue;
    if (isLegacyNonGmailRecord(item)) continue;
    const uniqueKey = getStudentUniqueKey(item);
    const existing = map.get(uniqueKey);
    if (!existing) {
      const realEnrolled =
        item.enrolledAt || item.history?.[0]?.completedAt || item.completedAt || fallbackNow;
      const realCompleted = item.completedAt || realEnrolled;
      map.set(uniqueKey, {
        ...item,
        status: item.status || 'Concluído',
        enrolledAt: realEnrolled,
        completedAt: realCompleted,
      });
    } else {
      const existingHistory = existing.history || [];
      const itemHistory = item.history || [];
      const mergedHistory =
        itemHistory.length >= existingHistory.length ? itemHistory : existingHistory;
      const useIncoming =
        (item.updatedAtMs || 0) >= (existing.updatedAtMs || 0) ||
        itemHistory.length >= existingHistory.length;
      const base = useIncoming ? item : existing;
      map.set(uniqueKey, {
        ...existing,
        ...base,
        history: mergedHistory,
        attemptsCount: Math.max(
          mergedHistory.length,
          existing.attemptsCount || 1,
          item.attemptsCount || 1
        ),
        enrolledAt:
          existing.enrolledAt ||
          item.enrolledAt ||
          mergedHistory[0]?.completedAt ||
          base.completedAt ||
          fallbackNow,
        completedAt:
          base.completedAt ||
          item.completedAt ||
          existing.completedAt ||
          fallbackNow,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.score - a.score);
}

function loadCollectiveState(): CollectiveState {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(ROSTER_FILE)) {
      const raw = fs.readFileSync(ROSTER_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.roster)) {
        return {
          roster: normalizeRoster(parsed.roster),
          lastUpdatedAt: parsed.lastUpdatedAt || Date.now(),
          lastAction: parsed.lastAction || null,
        };
      }
    }
  } catch (err) {
    console.error('Erro ao carregar banco coletivo:', err);
  }

  const initial: CollectiveState = {
    roster: [],
    lastUpdatedAt: Date.now(),
    lastAction: null,
  };
  saveCollectiveState(initial);
  return initial;
}

function saveCollectiveState(state: CollectiveState) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(ROSTER_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Erro ao salvar banco coletivo:', err);
  }
}

let collectiveState: CollectiveState = loadCollectiveState();

// GET /api/roster - Retorna a tabela única coletiva para qualquer dispositivo
app.get('/api/roster', (_req, res) => {
  return res.json(collectiveState);
});

// POST /api/roster/upsert - Registra matrícula/login imediato, progresso ao vivo ou conclusão
app.post('/api/roster/upsert', (req, res) => {
  try {
    const { student, actionType = 'new' } = req.body as {
      student: ClassStudentRecord;
      actionType?: 'enrolled' | 'progress' | 'new' | 'updated';
    };

    if (!student || !student.name) {
      return res.status(400).json({ error: 'Dados do militar inválidos.' });
    }

    const nowMs = Date.now();
    const realNowTime = getRealTimeNowStr();
    const cleanFullName = student.name.trim();
    const cleanReg = (student.registration || '').trim().toLowerCase();
    const cleanCohort = (student.cohort || '1º BPM').trim();
    const hasRealReg = Boolean(
      cleanReg &&
        cleanReg.toLowerCase() !== 'cas-2026' &&
        cleanReg.toLowerCase() !== 's/m'
    );

    const prev = collectiveState.roster;
    const existingIdx = prev.findIndex((item) => {
      if (student.id && item.id === student.id) return true;

      const itemReg = (item.registration || '').trim();
      const itemHasRealReg = Boolean(
        itemReg &&
          itemReg.toLowerCase() !== 'cas-2026' &&
          itemReg.toLowerCase() !== 's/m'
      );

      if (hasRealReg && itemHasRealReg) {
        return itemReg.toLowerCase() === cleanReg.toLowerCase();
      }

      const sameName = item.name.trim().toLowerCase() === cleanFullName.toLowerCase();
      const sameCohort =
        !cleanCohort ||
        !item.cohort ||
        item.cohort.trim().toLowerCase() === cleanCohort.toLowerCase();

      if (sameName && sameCohort) {
        if (hasRealReg && itemHasRealReg && itemReg.toLowerCase() !== cleanReg.toLowerCase()) {
          return false;
        }
        return true;
      }

      return false;
    });

    let updatedRoster: ClassStudentRecord[];
    let finalStudent: ClassStudentRecord;

    if (existingIdx >= 0) {
      const existing = prev[existingIdx];
      const existingHistory: StudentAttemptLog[] = existing.history || [];
      const incomingHistory: StudentAttemptLog[] = student.history || [];

      let mergedHistory =
        incomingHistory.length >= existingHistory.length ? incomingHistory : existingHistory;

      finalStudent = {
        ...existing,
        ...student,
        id: existing.id,
        name: cleanFullName,
        registration: cleanReg || existing.registration || '',
        cohort: cleanCohort || existing.cohort || '1º BPM',
        enrolledAt:
          existing.enrolledAt || student.enrolledAt || existing.completedAt || realNowTime,
        completedAt: student.completedAt || realNowTime,
        updatedAtMs: nowMs,
        history: mergedHistory,
        attemptsCount: Math.max(
          mergedHistory.length,
          student.attemptsCount || 1,
          existing.attemptsCount || 1
        ),
      };

      updatedRoster = [...prev];
      updatedRoster[existingIdx] = finalStudent;
    } else {
      finalStudent = {
        ...student,
        id: student.id || `student-${nowMs}`,
        name: cleanFullName,
        registration: cleanReg || '',
        cohort: cleanCohort || '1º BPM',
        enrolledAt: student.enrolledAt || student.completedAt || realNowTime,
        completedAt: student.completedAt || student.enrolledAt || realNowTime,
        status: student.status || 'Concluído',
        updatedAtMs: nowMs,
      };
      updatedRoster = [finalStudent, ...prev];
    }

    collectiveState = {
      roster: updatedRoster,
      lastUpdatedAt: nowMs,
      lastAction: {
        studentId: finalStudent.id,
        studentName: finalStudent.name,
        actionType,
        timestamp: nowMs,
      },
    };
    saveCollectiveState(collectiveState);

    return res.json(collectiveState);
  } catch (error: any) {
    console.error('Erro em /api/roster/upsert:', error);
    return res.status(500).json({ error: 'Falha ao atualizar quadro coletivo.' });
  }
});

// POST /api/roster/sync - Sincroniza registros salvos no celular/navegador local com o banco coletivo
app.post('/api/roster/sync', (req, res) => {
  try {
    const { localRoster } = req.body as { localRoster?: ClassStudentRecord[] };
    if (Array.isArray(localRoster) && localRoster.length > 0) {
      const prevJson = JSON.stringify(collectiveState.roster);
      const merged = normalizeRoster([...collectiveState.roster, ...localRoster]);
      if (JSON.stringify(merged) !== prevJson) {
        collectiveState = {
          roster: merged,
          lastUpdatedAt: Date.now(),
          lastAction: collectiveState.lastAction,
        };
        saveCollectiveState(collectiveState);
      }
    }
    return res.json(collectiveState);
  } catch (error) {
    return res.json(collectiveState);
  }
});

// POST /api/roster/reset - Admin pode zerar o placar
app.post('/api/roster/reset', (_req, res) => {
  collectiveState = {
    roster: [],
    lastUpdatedAt: Date.now(),
    lastAction: null,
  };
  saveCollectiveState(collectiveState);
  return res.json(collectiveState);
});

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

app.post('/api/generate-quiz', async (req, res) => {
  const {
    material,
    questionCount = 10,
    scopeMode = 'all',
    scopeLabel = 'Apostila Completa (Módulos 01 a 10 · Págs. 07 a 75)',
    chapterIds = [],
    startPage = 7,
    endPage = 75,
    subjectQuery = '',
    complexity = 'ALL',
  } = req.body || {};

  const numQuestions = Math.min(Math.max(Number(questionCount) || 10, 5), 10);
  const isBasicOnly =
    complexity === 'Básica / Conceitual' || complexity === 'Básica';

  if (!material || typeof material !== 'string' || material.trim().length < 30) {
    return res.status(400).json({
      error: 'Forneça um recorte válido da Apostila DT-SEI (mínimo de 30 caracteres) para gerar as questões diagnósticas.',
    });
  }

  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY ausente; acionando banco estruturado da Apostila DT-SEI.');
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Você é um Professor Doutor Especialista em Concursos Militares e ASSISTENTE PREPARATÓRIO CFOA (PMPE), com foco exclusivo na preparação de praças para o Curso de Formação de Oficiais Administrativos da Polícia Militar de Pernambuco (CFOA PMPE). Você atuou diretamente em bancas examinadoras (incluindo Instituto AOCP e IAUPE/UPENET) e domina a jurisprudência, a legislação extravagante e os regulamentos internos pertinentes à PMPE.

Sua missão é gerar questões inéditas e simulados direcionados utilizando exclusivamente o estilo de cobrança das bancas IAUPE/UPENET e Instituto AOCP, com base no programa de estudo do CFOA e na legislação do Estado de Pernambuco, tendo como fonte primária o portal da ALEPE (https://legis.alepe.pe.gov.br/).

RECORTE ESCOLHIDO PELO MILITAR: "${scopeLabel}" (Modo: ${scopeMode})
${isBasicOnly ? 'MODO REVISÃO RÁPIDA ATIVO: Gere EXCLUSIVAMENTE questões de complexidade "Básica / Conceitual" (foco em lei seca, conceitos essenciais, definições diretas e fundamentos normativos para revisão rápida antes de missões complexas).' : ''}

DIRETRIZES OBRIGATÓRIAS:
1. Elabore exatamente ${numQuestions} questões de múltipla escolha no exato padrão das bancas IAUPE/UPENET e Instituto AOCP, priorizando pegadinhas clássicas (prazos, competências da Justiça Militar, transgressões disciplinares e crimes militares em tese).
2. Focar em situações práticas operacionais e administrativas típicas da rotina de um Oficial de Administração da PMPE.
3. Forneça gabarito detalhado e comentado, citando expressamente o artigo, parágrafo ou inciso da norma extraída do Portal ALEPE (https://legis.alepe.pe.gov.br/) ou legislação correlata vigente (Lei 6.783/1974 - Estatuto PMPE, Lei 11.817/2000 - CDPM, Decreto 22.114/2000 - Ética, Decreto 3.639/1975 - CD, Lei 5.836/1972 - CJ, Lei 14.133/2021, CPM, CPPM, CF/88).
4. ${isBasicOnly ? 'Classifique TODAS as questões estritamente com a complexidade "Básica / Conceitual" (Modo Revisão Rápida).' : 'Distribua as questões nos três níveis de complexidade:\n   - "Básica / Conceitual"\n   - "Intermediária / Aplicação"\n   - "Avançada / Análise"'}
5. Classifique cada questão em um dos 4 pilares oficiais do CFOA ("pillar"):
   - "Legislação PM & Regime Disciplinar"
   - "Direito Penal & Processual Militar"
   - "Direito Constitucional & Administrativo"
   - "Administração & Conhecimentos Gerais"
6. Cada questão deve ter exatamente 4 alternativas claras e plausíveis, com apenas 1 correta (índice 0 a 3).
7. Atribua pesos (points) inteiros para cada questão de modo que a soma exata de todas as ${numQuestions} questões seja igual a 100 pontos.
8. Inclua:
   - "explanation": justificativa pedagógica com fundamentação jurídica citando a Lei/Artigo da ALEPE.
   - "pageRef": referência do Módulo/Programa do CFOA e norma legal ALEPE.
   - "pdfPageNumber": número da página do programa (1 ou 2).
   - "apostilaExcerpt": trecho normativo fiel da legislação ALEPE ou do programa que fundamenta a resposta correta (para exibição no Jornal Pop).

CONTEÚDO DO RECORTE SELECIONADO:
"""
${material.slice(0, 30000)}
"""`,
      config: {
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: 'Título formal da Sondagem Diagnóstica baseado no módulo/assunto do CFOA.',
            },
            subtitle: {
              type: Type.STRING,
              description: 'Subtítulo descritivo indicando o módulo, matéria e fundamentação ALEPE avaliada.',
            },
            subjectArea: {
              type: Type.STRING,
              description: 'Recorte da disciplina (ex: CFOA PMPE · Módulo 01 · Legislação PMPE).',
            },
            estimatedMinutes: {
              type: Type.INTEGER,
              description: 'Tempo estimado de resolução em minutos.',
            },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  topic: {
                    type: Type.STRING,
                    description: 'Tópico específico curto do CFOA / Lei ALEPE (máx 5 palavras).',
                  },
                  pillar: {
                    type: Type.STRING,
                    description: 'Deve ser exatamente um destes: "Legislação PM & Regime Disciplinar", "Direito Penal & Processual Militar", "Direito Constitucional & Administrativo" ou "Administração & Conhecimentos Gerais".',
                  },
                  complexity: {
                    type: Type.STRING,
                    description: 'Deve ser exatamente um destes: "Básica / Conceitual", "Intermediária / Aplicação" ou "Avançada / Análise".',
                  },
                  points: {
                    type: Type.INTEGER,
                    description: 'Valor da questão em pontos (soma igual a 100).',
                  },
                  stem: {
                    type: Type.STRING,
                    description: 'Enunciado completo e contextualizado segundo a Apostila DT-SEI.',
                  },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Exatamente 4 alternativas de resposta (sem letras A/B/C/D no início).',
                  },
                  correctIndex: {
                    type: Type.INTEGER,
                    description: 'Índice da alternativa correta (0, 1, 2 ou 3).',
                  },
                  explanation: {
                    type: Type.STRING,
                    description: 'Explicação didática detalhada do gabarito citando a página da Apostila DT-SEI.',
                  },
                  pageRef: {
                    type: Type.STRING,
                    description: 'Referência de páginas na Apostila DT-SEI (ex: "Págs. 44 a 52").',
                  },
                  pdfPageNumber: {
                    type: Type.INTEGER,
                    description: 'Número inteiro da página da Apostila DT-SEI (7 a 75).',
                  },
                  apostilaExcerpt: {
                    type: Type.STRING,
                    description: 'Trecho oficial da Apostila DT-SEI que comprova o gabarito.',
                  },
                },
                required: [
                  'id',
                  'topic',
                  'pillar',
                  'complexity',
                  'points',
                  'stem',
                  'options',
                  'correctIndex',
                  'explanation',
                  'pageRef',
                  'pdfPageNumber',
                  'apostilaExcerpt',
                ],
              },
            },
          },
          required: ['title', 'subtitle', 'subjectArea', 'estimatedMinutes', 'questions'],
        },
      },
    });

    const rawText = response.text?.trim();
    if (!rawText) {
      throw new Error('O modelo não retornou dados válidos.');
    }

    const parsed = JSON.parse(rawText);

    if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
      const count = parsed.questions.length;
      const basePoints = Math.floor(100 / count);
      const remainder = 100 - basePoints * count;
      parsed.questions = parsed.questions.map((q: any, idx: number) => {
        const extra = idx < remainder ? 1 : 0;
        const validPillar: CompetencyPillar = COMPETENCY_PILLARS.includes(q.pillar)
          ? q.pillar
          : COMPETENCY_PILLARS[idx % COMPETENCY_PILLARS.length];
        const validPageNum =
          typeof q.pdfPageNumber === 'number' && q.pdfPageNumber >= 7 && q.pdfPageNumber <= 75
            ? q.pdfPageNumber
            : Number(startPage) || 10;
        return {
          ...q,
          id: idx + 1,
          pillar: validPillar,
          complexity: isBasicOnly ? 'Básica / Conceitual' : q.complexity || 'Básica / Conceitual',
          options: Array.isArray(q.options) ? q.options.slice(0, 4) : ['Opção A', 'Opção B', 'Opção C', 'Opção D'],
          correctIndex: typeof q.correctIndex === 'number' && q.correctIndex >= 0 && q.correctIndex <= 3 ? q.correctIndex : 0,
          points: basePoints + extra,
          pageRef: q.pageRef || `Pág. ${validPageNum}`,
          pdfPageNumber: validPageNum,
          apostilaExcerpt: q.apostilaExcerpt || q.explanation,
        };
      });
    }

    return res.json(parsed);
  } catch (error: any) {
    console.warn('Usando banco estruturado CFOA PMPE para o recorte selecionado:', error?.message);
    const fallbackQuestions = selectFallbackQuestionsForScope({
      mode: (scopeMode as GeneratorScopeMode) || 'all',
      chapterIds: Array.isArray(chapterIds) ? chapterIds : [],
      startPage: Number(startPage) || 1,
      endPage: Number(endPage) || 2,
      subjectQuery: String(subjectQuery || ''),
      questionCount: numQuestions,
      complexity: isBasicOnly ? 'Básica / Conceitual' : 'ALL',
    });

    return res.json({
      title: `${isBasicOnly ? '[Modo Revisão Rápida · Básica] ' : ''}Missão CFOA PMPE: ${scopeLabel}`,
      subtitle: isBasicOnly
        ? `Ciclo de Revisão Rápida (Complexidade Básica) gerado a partir do Programa Oficial CFOA e Legislação ALEPE (${scopeLabel}).`
        : `Sondagem gerada a partir do Programa Oficial CFOA e Legislação ALEPE (${scopeLabel}).`,
      subjectArea: `CFOA PMPE · ${scopeLabel}${isBasicOnly ? ' (Revisão Rápida · Básica)' : ''}`,
      estimatedMinutes: Math.max(5, numQuestions),
      questions: fallbackQuestions,
    });
  }
});

// ============================================================================
// GERENCIAMENTO DA BASE DO CONHECIMENTO / TROCA DA APOSTILA PELO ADMIN
// Permite enviar PDF ou Link para reformular 100% da seção APOSTILA e Questões
// ============================================================================
function normalizeExternalLinkForEmbed(rawUrl: string): string {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) return '';
  // Converte links do Google Drive (/file/d/ID/view) para /file/d/ID/preview para embutir no iframe
  const driveMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) {
    return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
  }
  return trimmed;
}

function buildFallbackReformulation(params: {
  title: string;
  sourceType: 'pdf' | 'link';
  pdfUrl: string;
  fileName?: string;
  linkUrl?: string;
  supplementalText?: string;
}) {
  const cleanTitle = params.title || params.fileName?.replace(/\.pdf$/i, '') || 'Apostila Oficial Substituída pelo Administrador';
  const rawNotes = (params.supplementalText || '').trim();
  const paragraphs = rawNotes
    ? rawNotes.split(/\n+/).map((p) => p.trim()).filter((p) => p.length > 15)
    : [];

  const chapterThemes = [
    { num: 'Módulo 01', pilar: 'Fundamentos e Diretrizes Gerais', comp: 'Normas & Tipos Processuais' as CompetencyPillar, pages: 'Págs. 01 a 05' },
    { num: 'Módulo 02', pilar: 'Acesso, Credenciamento e Segurança', comp: 'Segurança & Acesso' as CompetencyPillar, pages: 'Págs. 06 a 10' },
    { num: 'Módulo 03', pilar: 'Estrutura Operacional e Rotinas', comp: 'Documentos & Blocos' as CompetencyPillar, pages: 'Págs. 11 a 16' },
    { num: 'Módulo 04', pilar: 'Classificação, Níveis e Controle', comp: 'Segurança & Acesso' as CompetencyPillar, pages: 'Págs. 17 a 22' },
    { num: 'Módulo 05', pilar: 'Elaboração Técnica e Documentos', comp: 'Documentos & Blocos' as CompetencyPillar, pages: 'Págs. 23 a 30' },
    { num: 'Módulo 06', pilar: 'Validação, Assinatura e Fé Pública', comp: 'Normas & Tipos Processuais' as CompetencyPillar, pages: 'Págs. 31 a 38' },
    { num: 'Módulo 07', pilar: 'Gestão em Lote e Fluxos Colaborativos', comp: 'Documentos & Blocos' as CompetencyPillar, pages: 'Págs. 39 a 46' },
    { num: 'Módulo 08', pilar: 'Tramitação, Ciclo de Vida e Rastreabilidade', comp: 'Tramitação & Integridade' as CompetencyPillar, pages: 'Págs. 47 a 55' },
  ];

  const chapters = chapterThemes.map((theme, idx) => {
    const customSnippet = paragraphs[idx] || paragraphs[idx % Math.max(1, paragraphs.length)] || '';
    return {
      id: `cap-${idx + 1}`,
      number: theme.num,
      title: customSnippet
        ? `${theme.pilar}: ${customSnippet.slice(0, 68)}${customSnippet.length > 68 ? '...' : ''}`
        : `${theme.pilar} — ${cleanTitle}`,
      pilar: theme.pilar,
      competencyPillar: theme.comp,
      pages: theme.pages,
      summary: customSnippet
        ? customSnippet
        : `Síntese estruturada do ${theme.num} referente ao material base "${cleanTitle}", abordando ${theme.pilar.toLowerCase()} para consulta rápida e estudo dirigido no aplicativo.`,
      normativeBase: `Base de Conhecimento Oficial · ${cleanTitle}`,
      keyPoints: [
        customSnippet || `Diretriz principal do ${theme.num} extraída do material "${cleanTitle}".`,
        `Aplicação técnica das normas de ${theme.pilar} no âmbito operacional e administrativo.`,
        `Requisitos de conformidade, padronização e verificação previstos em ${theme.pages}.`,
        `Boas práticas de execução e prevenção de erros procedimentais no tema ${theme.pilar}.`,
      ],
      ficaADica: `#FICAADICA (${theme.pages}): Consulte diretamente o documento base "${cleanTitle}" no visualizador integrado para revisar os detalhes técnicos deste módulo.`,
      practicalExample: `Aplicação prática direta dos conceitos do ${theme.num} (${theme.pilar}) na rotina de aperfeiçoamento.`,
    };
  });

  const questions = chapters.slice(0, 8).map((ch, idx) => ({
    id: idx + 1,
    topic: `${ch.number} — ${ch.pilar}`,
    pillar: ch.competencyPillar,
    complexity: idx < 3 ? 'Básica / Conceitual' : idx < 6 ? 'Intermediária / Aplicação' : 'Avançada / Análise',
    points: idx < 4 ? 13 : 12,
    stem: `De acordo com o ${ch.number} (${ch.pages}) do material base "${cleanTitle}", qual diretriz caracteriza corretamente o eixo "${ch.pilar}"?`,
    options: [
      ch.keyPoints[0],
      'É permitido ignorar o procedimento formal sempre que houver urgência verbal não documentada.',
      'O controle técnico é opcional e independe de registro ou validação institucional.',
      'A responsabilidade funcional pode ser compartilhada mediante empréstimo de credencial pessoal.',
    ],
    correctIndex: 0,
    explanation: `Conforme estruturado no ${ch.number} (${ch.pages}) do material "${cleanTitle}": ${ch.summary}`,
    pageRef: ch.pages,
    pdfPageNumber: idx * 5 + 1,
    apostilaExcerpt: ch.summary,
  }));

  return {
    isCustom: true,
    updatedAt: new Date().toLocaleString('pt-BR'),
    sourceType: params.sourceType,
    fileName: params.fileName || '',
    linkUrl: params.linkUrl || '',
    pdfUrl: params.pdfUrl,
    title: cleanTitle,
    subtitle: `Apostila e Base de Conhecimento reformuladas pelo Administrador (${params.sourceType === 'pdf' ? 'Arquivo PDF' : 'Link Externo'}).`,
    subjectArea: cleanTitle,
    chapters,
    questions,
  };
}

app.get('/api/knowledge-base', (_req, res) => {
  try {
    if (!fs.existsSync(KNOWLEDGE_BASE_FILE)) {
      return res.json({ isCustom: false });
    }
    const raw = fs.readFileSync(KNOWLEDGE_BASE_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return res.json(parsed || { isCustom: false });
  } catch (err) {
    return res.json({ isCustom: false });
  }
});

app.get('/api/knowledge-base/pdf', (_req, res) => {
  try {
    if (fs.existsSync(CUSTOM_PDF_FILE)) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="Apostila-Ativa-Guia-Aperfeicoamento.pdf"');
      return res.sendFile(CUSTOM_PDF_FILE);
    }
    return res.status(404).send('Nenhum PDF customizado encontrado.');
  } catch (err) {
    return res.status(500).send('Erro ao carregar PDF.');
  }
});

app.post('/api/knowledge-base/reset', (_req, res) => {
  try {
    if (fs.existsSync(KNOWLEDGE_BASE_FILE)) {
      fs.unlinkSync(KNOWLEDGE_BASE_FILE);
    }
    if (fs.existsSync(CUSTOM_PDF_FILE)) {
      fs.unlinkSync(CUSTOM_PDF_FILE);
    }
    return res.json({ ok: true, isCustom: false });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Erro ao restaurar apostila padrão.' });
  }
});

app.post('/api/knowledge-base/reformulate', async (req, res) => {
  const {
    sourceType = 'pdf',
    pdfBase64,
    fileName,
    linkUrl,
    customTitle,
    supplementalText,
  } = req.body || {};

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    let resolvedPdfUrl = '/assets/aistudio/CFOA_SELECAO_INTERNA_-_programa_ca963974.pdf';
    let cleanBase64 = '';

    if (sourceType === 'pdf' && pdfBase64) {
      cleanBase64 = String(pdfBase64).replace(/^data:application\/pdf;base64,/i, '').trim();
      const pdfBuffer = Buffer.from(cleanBase64, 'base64');
      fs.writeFileSync(CUSTOM_PDF_FILE, pdfBuffer);
      resolvedPdfUrl = `/api/knowledge-base/pdf?t=${Date.now()}`;
    } else if (sourceType === 'link' && linkUrl) {
      resolvedPdfUrl = normalizeExternalLinkForEmbed(String(linkUrl));
    } else {
      return res.status(400).json({
        error: 'Envie um arquivo PDF válido ou informe um Link/URL do material para reformular a Apostila.',
      });
    }

    // Se for link, tenta buscar o conteúdo textual público da URL para enriquecer a leitura da IA
    let fetchedLinkText = '';
    if (sourceType === 'link' && linkUrl) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);
        const fetchRes = await fetch(String(linkUrl), { signal: controller.signal });
        clearTimeout(timeout);
        const contentType = fetchRes.headers.get('content-type') || '';
        if (contentType.includes('text/') || contentType.includes('json') || contentType.includes('xml')) {
          const rawHtml = await fetchRes.text();
          fetchedLinkText = rawHtml
            .replace(/<script[\s\S]*?<\/script>/gi, ' ')
            .replace(/<style[\s\S]*?<\/style>/gi, ' ')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 28000);
        }
      } catch {
        // Ignora erro de CORS/rede se o link for um PDF externo ou Google Drive fechado
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      const fallbackData = buildFallbackReformulation({
        title: customTitle || fileName || 'Nova Apostila Oficial',
        sourceType,
        pdfUrl: resolvedPdfUrl,
        fileName,
        linkUrl,
        supplementalText: supplementalText || fetchedLinkText,
      });
      fs.writeFileSync(KNOWLEDGE_BASE_FILE, JSON.stringify(fallbackData, null, 2), 'utf-8');
      return res.json(fallbackData);
    }

    const ai = new GoogleGenAI({ apiKey });

    const promptParts: any[] = [];
    if (cleanBase64 && cleanBase64.length > 100) {
      promptParts.push({
        inlineData: {
          mimeType: 'application/pdf',
          data: cleanBase64,
        },
      });
    }

    const instructionText = `Você é o Coordenador Pedagógico e Instrutor Chefe do aplicativo "Guia de Aperfeiçoamento — QUIZ DE APROVAÇÃO SGT GREGÓRIO".
O Administrador acabou de substituir a Apostila / Base de Conhecimento oficial do aplicativo.
${customTitle ? `Título informado pelo Administrador: "${customTitle}"` : ''}
${fileName ? `Arquivo enviado: "${fileName}"` : ''}
${linkUrl ? `Link/URL do Material: "${linkUrl}"` : ''}
${supplementalText ? `Conteúdo / Ementa / Observações adicionais:\n${supplementalText}` : ''}
${fetchedLinkText ? `Texto extraído do Link:\n${fetchedLinkText}` : ''}

TAREFA OBRIGATÓRIA:
Reformule TOTALMENTE a seção APOSTILA e o banco de questões diagnósticas do aplicativo para refletir fielmente este novo material:
1. Estruture entre 6 e 10 Módulos/Capítulos completos ("chapters") cobrindo todo o material enviado.
   - Cada capítulo DEVE conter:
     - "id": "cap-1", "cap-2", etc.
     - "number": "Módulo 01", "Módulo 02", etc.
     - "title": Título claro e completo do capítulo/módulo
     - "pilar": Nome do eixo temático do capítulo
     - "competencyPillar": Escolha exatamente um entre: "Segurança & Acesso", "Normas & Tipos Processuais", "Documentos & Blocos", "Tramitação & Integridade"
     - "pages": Referência de páginas no material (ex: "Págs. 01 a 05")
     - "summary": Resumo denso e explicativo do capítulo
     - "normativeBase": Base legal, técnica ou bibliográfica citada no capítulo
     - "keyPoints": Lista com 4 a 5 pontos-chave detalhados e fiéis ao material
     - "ficaADica": Uma dica prática importante no formato "#FICAADICA (Pág. X): ..."
     - "practicalExample": Um exemplo prático de aplicação do conteúdo
2. Elabore 10 questões diagnósticas inéditas ("questions") baseadas exclusivamente neste novo material, com 4 alternativas cada (A, B, C, D), índice correto (0 a 3), explicação detalhada, "pageRef", "pdfPageNumber" (inteiro >= 1) e "apostilaExcerpt".`;

    promptParts.push({ text: instructionText });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [{ role: 'user', parts: promptParts }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            subtitle: { type: Type.STRING },
            subjectArea: { type: Type.STRING },
            chapters: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  number: { type: Type.STRING },
                  title: { type: Type.STRING },
                  pilar: { type: Type.STRING },
                  competencyPillar: {
                    type: Type.STRING,
                    enum: [
                      'Legislação PM & Regime Disciplinar',
                      'Direito Penal & Processual Militar',
                      'Direito Constitucional & Administrativo',
                      'Administração & Conhecimentos Gerais',
                    ],
                  },
                  pages: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  normativeBase: { type: Type.STRING },
                  keyPoints: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  ficaADica: { type: Type.STRING },
                  practicalExample: { type: Type.STRING },
                },
                required: [
                  'id',
                  'number',
                  'title',
                  'pilar',
                  'competencyPillar',
                  'pages',
                  'summary',
                  'normativeBase',
                  'keyPoints',
                  'ficaADica',
                  'practicalExample',
                ],
              },
            },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  topic: { type: Type.STRING },
                  pillar: {
                    type: Type.STRING,
                    enum: [
                      'Segurança & Acesso',
                      'Normas & Tipos Processuais',
                      'Documentos & Blocos',
                      'Tramitação & Integridade',
                    ],
                  },
                  complexity: {
                    type: Type.STRING,
                    enum: [
                      'Básica / Conceitual',
                      'Intermediária / Aplicação',
                      'Avançada / Análise',
                    ],
                  },
                  points: { type: Type.INTEGER },
                  stem: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  correctIndex: { type: Type.INTEGER },
                  explanation: { type: Type.STRING },
                  pageRef: { type: Type.STRING },
                  pdfPageNumber: { type: Type.INTEGER },
                  apostilaExcerpt: { type: Type.STRING },
                },
                required: [
                  'id',
                  'topic',
                  'pillar',
                  'complexity',
                  'points',
                  'stem',
                  'options',
                  'correctIndex',
                  'explanation',
                  'pageRef',
                  'pdfPageNumber',
                  'apostilaExcerpt',
                ],
              },
            },
          },
          required: ['title', 'subtitle', 'subjectArea', 'chapters', 'questions'],
        },
      },
    });

    const rawText = response.text?.trim();
    if (!rawText) {
      throw new Error('Resposta vazia do modelo ao reformular a Apostila.');
    }

    const parsed = JSON.parse(rawText);

    const normalizedChapters = Array.isArray(parsed.chapters) && parsed.chapters.length > 0
      ? parsed.chapters.map((ch: any, idx: number) => ({
          id: `cap-${idx + 1}`,
          number: ch.number || `Módulo ${String(idx + 1).padStart(2, '0')}`,
          title: ch.title || `Capítulo ${idx + 1}`,
          pilar: ch.pilar || 'Conteúdo Programático',
          competencyPillar: COMPETENCY_PILLARS.includes(ch.competencyPillar)
            ? ch.competencyPillar
            : COMPETENCY_PILLARS[idx % COMPETENCY_PILLARS.length],
          pages: ch.pages || `Págs. ${idx * 5 + 1} a ${(idx + 1) * 5}`,
          summary: ch.summary || '',
          normativeBase: ch.normativeBase || (customTitle || 'Apostila Oficial'),
          keyPoints: Array.isArray(ch.keyPoints) && ch.keyPoints.length > 0
            ? ch.keyPoints
            : [ch.summary || 'Ponto-chave do capítulo.'],
          ficaADica: ch.ficaADica || `#FICAADICA: Revise os conceitos do ${ch.number || `Módulo ${idx + 1}`}.`,
          practicalExample: ch.practicalExample || 'Aplicação direta nas atividades do curso.',
        }))
      : [];

    const qCount = Array.isArray(parsed.questions) && parsed.questions.length > 0 ? parsed.questions.length : 1;
    const basePts = Math.floor(100 / qCount);
    const remPts = 100 - basePts * qCount;

    const normalizedQuestions = Array.isArray(parsed.questions) && parsed.questions.length > 0
      ? parsed.questions.map((q: any, idx: number) => ({
          ...q,
          id: idx + 1,
          pillar: COMPETENCY_PILLARS.includes(q.pillar)
            ? q.pillar
            : COMPETENCY_PILLARS[idx % COMPETENCY_PILLARS.length],
          options: Array.isArray(q.options) && q.options.length >= 4
            ? q.options.slice(0, 4)
            : ['Alternativa A', 'Alternativa B', 'Alternativa C', 'Alternativa D'],
          correctIndex:
            typeof q.correctIndex === 'number' && q.correctIndex >= 0 && q.correctIndex <= 3
              ? q.correctIndex
              : 0,
          points: basePts + (idx < remPts ? 1 : 0),
          pageRef: q.pageRef || `Pág. ${q.pdfPageNumber || idx + 1}`,
          pdfPageNumber: typeof q.pdfPageNumber === 'number' && q.pdfPageNumber >= 1 ? q.pdfPageNumber : idx + 1,
          apostilaExcerpt: q.apostilaExcerpt || q.explanation,
        }))
      : [];

    const finalPayload = {
      isCustom: true,
      updatedAt: new Date().toLocaleString('pt-BR'),
      sourceType,
      fileName: fileName || '',
      linkUrl: linkUrl || '',
      pdfUrl: resolvedPdfUrl,
      title: customTitle?.trim() || parsed.title || fileName?.replace(/\.pdf$/i, '') || 'Apostila Oficial Atualizada',
      subtitle:
        parsed.subtitle ||
        `Seção Apostila e Questões reformuladas integralmente com base no novo material (${sourceType === 'pdf' ? 'PDF' : 'Link'}).`,
      subjectArea: parsed.subjectArea || customTitle?.trim() || 'Guia de Aperfeiçoamento',
      chapters: normalizedChapters,
      questions: normalizedQuestions,
    };

    fs.writeFileSync(KNOWLEDGE_BASE_FILE, JSON.stringify(finalPayload, null, 2), 'utf-8');
    return res.json(finalPayload);
  } catch (err: any) {
    console.warn('Usando reformulador estruturado de contingência para o novo material:', err?.message);
    let fallbackPdfUrl = '/assets/aistudio/6._APOSTILA_-_DOCUMENTA__O_T_CNICA__DTSEI__beff3a81.pdf';
    if (sourceType === 'pdf' && fs.existsSync(CUSTOM_PDF_FILE)) {
      fallbackPdfUrl = `/api/knowledge-base/pdf?t=${Date.now()}`;
    } else if (sourceType === 'link' && linkUrl) {
      fallbackPdfUrl = normalizeExternalLinkForEmbed(String(linkUrl));
    }

    const fallbackData = buildFallbackReformulation({
      title: customTitle || fileName || 'Nova Apostila Oficial',
      sourceType,
      pdfUrl: fallbackPdfUrl,
      fileName,
      linkUrl,
      supplementalText,
    });
    fs.writeFileSync(KNOWLEDGE_BASE_FILE, JSON.stringify(fallbackData, null, 2), 'utf-8');
    return res.json(fallbackData);
  }
});

async function startServer() {
  const PORT = 3000;

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
