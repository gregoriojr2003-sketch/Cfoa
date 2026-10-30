export type CompetencyPillar =
  | 'Legislação PM & Regime Disciplinar'
  | 'Direito Penal & Processual Militar'
  | 'Direito Constitucional & Administrativo'
  | 'Administração & Conhecimentos Gerais';

export interface DiagnosticQuestion {
  id: number;
  topic: string;
  pillar: CompetencyPillar;
  complexity: 'Básica / Conceitual' | 'Intermediária / Aplicação' | 'Avançada / Análise';
  points: number;
  stem: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  pageRef?: string;
  pdfPageNumber?: number;
  apostilaExcerpt?: string;
}

export interface StudentAttemptLog {
  attemptNumber: number;
  score: number;
  tier: 'Iniciante' | 'Intermediário' | 'Avançado';
  patentTitle: string;
  intimacyLevel: string;
  completedAt: string;
  date: string;
  avgTimeSec?: number;
  maxStreak?: number;
  correctCount: number;
  totalQuestions: number;
  pillarScores: Record<CompetencyPillar, number>;
  unlockedBadges?: string[];
}

export interface ClassStudentRecord {
  id: string;
  name: string;
  registration: string;
  cohort: string;
  score: number;
  tier: 'Iniciante' | 'Intermediário' | 'Avançado';
  completedAt: string;
  enrolledAt?: string;
  status?: 'Em Missão' | 'Concluído';
  progressQuestions?: number;
  totalQuestionsCount?: number;
  updatedAtMs?: number;
  avgTimeSec?: number;
  maxStreak?: number;
  pillarScores: Record<CompetencyPillar, number>; // 0-100% per pillar
  attemptsCount?: number;
  history?: StudentAttemptLog[];
  mode?: 'Oficial' | 'Treinamento';
}

export interface DiagnosticAssessment {
  id: string;
  title: string;
  subtitle: string;
  subjectArea: string;
  estimatedMinutes: number;
  sourceMaterial: string;
  questions: DiagnosticQuestion[];
  initialClassRoster: ClassStudentRecord[];
}

export interface StudentAccuracySummary {
  avgAccuracyPct: number;
  totalCorrect: number;
  totalQuestionsAnswered: number;
  missionsCompleted: number;
}

/**
 * Calcula a taxa de precisão média do aluno:
 * porcentagem de acertos totais sobre o número de missões realizadas.
 */
export function calculateStudentAverageAccuracy(
  student: ClassStudentRecord
): StudentAccuracySummary {
  const history = Array.isArray(student.history) ? student.history : [];
  if (history.length > 0) {
    const missionsCompleted = history.length;
    let totalCorrect = 0;
    let totalQuestionsAnswered = 0;
    let sumMissionAccuracyPct = 0;

    for (const h of history) {
      const qCount = Number(h.totalQuestions) > 0 ? Number(h.totalQuestions) : 10;
      const cCount =
        typeof h.correctCount === 'number' && !isNaN(h.correctCount)
          ? h.correctCount
          : Math.round(((Number(h.score) || 0) / 100) * qCount);
      totalCorrect += cCount;
      totalQuestionsAnswered += qCount;
      const missionPct =
        qCount > 0 ? (cCount / qCount) * 100 : Number(h.score) || 0;
      sumMissionAccuracyPct += missionPct;
    }

    const avgAccuracyPct =
      missionsCompleted > 0
        ? Math.round(sumMissionAccuracyPct / missionsCompleted)
        : totalQuestionsAnswered > 0
        ? Math.round((totalCorrect / totalQuestionsAnswered) * 100)
        : Math.round(Number(student.score) || 0);

    return {
      avgAccuracyPct: Math.min(100, Math.max(0, avgAccuracyPct)),
      totalCorrect,
      totalQuestionsAnswered,
      missionsCompleted,
    };
  }

  const missionsCompleted = Math.max(1, Number(student.attemptsCount) || 1);
  const qPerMission =
    Number(student.totalQuestionsCount) > 0
      ? Number(student.totalQuestionsCount)
      : 10;
  const avgAccuracyPct = Math.min(
    100,
    Math.max(0, Math.round(Number(student.score) || 0))
  );
  const totalQuestionsAnswered = qPerMission * missionsCompleted;
  const totalCorrect = Math.round(
    (avgAccuracyPct / 100) * totalQuestionsAnswered
  );

  return {
    avgAccuracyPct,
    totalCorrect,
    totalQuestionsAnswered,
    missionsCompleted,
  };
}

export const COMPETENCY_PILLARS: CompetencyPillar[] = [
  'Legislação PM & Regime Disciplinar',
  'Direito Penal & Processual Militar',
  'Direito Constitucional & Administrativo',
  'Administração & Conhecimentos Gerais',
];

export const MILITARY_RANKS = [
  'ST PM',
  '1º SGT PM',
  '2º SGT PM',
  '3º SGT PM',
  'CB PM',
  'SD PM',
  'ASP PM',
  '2º TEN QOA',
  '1º TEN QOA',
  'CAP QOA',
  'MAJ QOA',
];

export const PMPE_UNITS: string[] = [
  '10ª CIPM',
  '10º BPM',
  '11º BPM',
  '11ª CIPM',
  '12º BPM',
  '13º BPM',
  '14º BPM',
  '15º BPM',
  '16º BPM',
  '17º BPM',
  '18º BPM',
  '19º BPM',
  '1ª CIPM',
  '1º BIEsp',
  '1º BPM',
  '20ºBPM',
  '21º BPM',
  '22º BPM',
  '23º BPM',
  '24ºBPM',
  '25º BPM',
  '26º BPM',
  '27ºBPM',
  '2ª CIPM',
  '2ªEMG',
  '2ºBIEsp',
  '2ºBPM',
  '3ºBPM',
  '4ªCIPM',
  '4ºBPM',
  '5ª CIPM',
  '5º BPM',
  '6ª CIPM',
  '6º BPM',
  '7ª CIPM',
  '7ºBPM',
  '8ª CIPM',
  '8º BPM',
  '9ª CIPM',
  '9º BPM',
  'ACG',
  'AECI',
  'AG',
  'APMP',
  'BEPI',
  'BOPE',
  'BPA',
  'BPChoque',
  'BPGd',
  'BPRP',
  'BPRv',
  'BPTran',
  'BPTur',
  'CEFD',
  'CFAP',
  'CFARM',
  'CIMUS',
  'CIPCães',
  'CIPMoto',
  'CMH',
  'CODONTO',
  'COMANDO-GERAL',
  'CORONÉIS PM',
  'CPM',
  'CPM/anexo1 - petrolina1',
  'CPO',
  'CPP',
  'CREED',
  'CRESEP',
  'CSM/INT',
  'CSM/MB',
  'CSM/MOTO',
  'CTT',
  'DAL',
  'DAS/CAS',
  'DASDH',
  'DASIS',
  'DEAJA',
  'DEIP',
  'DF',
  'DGA',
  'DGP',
  'DIM',
  'DINTER 1',
  'DINTER 2',
  'DIRESP',
  'DPJM',
  'DPO',
  'DPO COPOM',
  'DS',
  'DTEC',
  'DVP',
  'EMG',
  'RPMon',
  'SUBCOMANDO-GERAL',
  'Outros',
];

export const INSTRUCTOR_RECORD: ClassStudentRecord = {
  id: 'instructor-gregorio',
  name: '1º SGT PM GREGÓRIO',
  registration: 'INST-CFOA-2026',
  cohort: 'DEIP',
  score: 100,
  tier: 'Avançado',
  enrolledAt: '13:00',
  completedAt: '13:05',
  status: 'Concluído',
  progressQuestions: 10,
  totalQuestionsCount: 10,
  avgTimeSec: 5,
  maxStreak: 10,
  pillarScores: {
    'Legislação PM & Regime Disciplinar': 100,
    'Direito Penal & Processual Militar': 100,
    'Direito Constitucional & Administrativo': 100,
    'Administração & Conhecimentos Gerais': 100,
  },
  attemptsCount: 1,
  history: [
    {
      attemptNumber: 1,
      score: 100,
      tier: 'Avançado',
      patentTitle: 'Oficial de Administração (CFOA)',
      intimacyLevel: 'Avançado / Alto Rendimento',
      completedAt: '13:05',
      date: '29/10/2026',
      avgTimeSec: 5,
      maxStreak: 10,
      correctCount: 10,
      totalQuestions: 10,
      pillarScores: {
        'Legislação PM & Regime Disciplinar': 100,
        'Direito Penal & Processual Militar': 100,
        'Direito Constitucional & Administrativo': 100,
        'Administração & Conhecimentos Gerais': 100,
      },
      unlockedBadges: [
        'Mestre do CFOA',
        'Guardião da Legalidade',
        'Oficial Estrategista',
        'Perícia Disciplinar ALEPE',
        'Liderança Militar',
        'Gabarito Total',
      ],
    },
  ],
};

export const INITIAL_COLLECTIVE_ROSTER: ClassStudentRecord[] = [];

export const PRESET_ASSESSMENTS: DiagnosticAssessment[] = [
  {
    id: 'simulado-oficial-cfoa-pmpe',
    title: 'Simulado Diagnóstico Oficial — Seleção Interna CFOA PMPE',
    subtitle:
      'Avaliação diagnóstica completa para o Curso de Formação de Oficiais da Administração (CFOA PMPE) baseada estritamente no Conteúdo Programático Oficial e na Legislação de Pernambuco (ALEPE).',
    subjectArea: 'CFOA PMPE · Polícia Militar de Pernambuco',
    estimatedMinutes: 15,
    sourceMaterial: `CONTEÚDOS PROGRAMÁTICOS OFICIAIS — SELEÇÃO INTERNA CFOA PMPE
POLÍCIA MILITAR DE PERNAMBUCO (SECRETARIA DE DEFESA SOCIAL)

BLOCO I – CONHECIMENTOS GERAIS
1. LÍNGUA PORTUGUESA COM INTERPRETAÇÃO DE TEXTO: Tipologia, Gramática, Concordância, Regência e Redação de correspondências oficiais (Padrão Ofício PMPE).
2. RACIOCÍNIO LÓGICO: Estruturas lógicas, Deduções, Diagramas lógicos e Probabilidade.
3. NOÇÕES DE ADMINISTRAÇÃO: Teorias clássicas e contemporâneas, Organização formal e burocrática, Conceito de linha e assessoria, Direção, Processo decisório, Controle e Cultura organizacional.

BLOCO II – CONHECIMENTOS ESPECÍFICOS
1. DIREITO PENAL MILITAR E PROCESSUAL PENAL MILITAR: Princípio de legalidade, Crimes militares em tempo de paz (Art. 9º CPM), Exclusão de crime, Obediência hierárquica, Crimes contra a autoridade e disciplina militar, Crimes contra a administração militar; Crimes militares por extensão (Lei nº 13.869/2019 - Abuso de Autoridade; Lei nº 7.716/1989 - Preconceito de raça ou cor; Crimes licitatórios da Lei nº 14.133/2021 no Código Penal). CPPM: Polícia Judiciária Militar, Inquérito Policial Militar (IPM), Auto de Prisão em Flagrante Delito (APFD), Instrução provisória de deserção, Medidas preventivas, Perícias, Prisão provisória e preventiva.
2. DIREITO CONSTITUCIONAL E ADMINISTRATIVO: Direitos e Garantias Fundamentais (Art. 5º CF/88), Administração Pública (Art. 37 CF/88), Militares dos Estados (Art. 42 e 142 CF/88), Segurança Pública (Art. 144 CF/88). Poderes e deveres do administrador, Atos Administrativos (requisitos e atributos), Poder de polícia, Responsabilidade civil do Estado, Processo administrativo estadual, Licitações e Contratos (Lei Federal nº 14.133/2021).
3. DIREITOS HUMANOS: DUDH (1948), CEDAW (Discriminação contra a Mulher), PcD (Pessoas com Deficiência) e reflexos na atuação policial.
4. LEGISLAÇÃO PM (FONTE ALEPE - https://legis.alepe.pe.gov.br/):
- Lei Estadual nº 6.783, de 16 de outubro de 1974 (Estatuto dos Policiais Militares de PE).
- Lei Estadual nº 11.817, de 24 de julho de 2000 (Código Disciplinar dos Militares de PE).
- Decreto Estadual nº 22.114, de 13 de março de 2000 (Regulamento de Ética dos Militares de PE).
- Decreto Estadual nº 3.639, de 19 de agosto de 1975 (Conselho de Disciplina da PMPE).
- Lei Federal nº 5.836, de 5 de dezembro de 1972 (Conselho de Justificação).`,
    questions: [
      {
        id: 1,
        topic: 'Código Disciplinar PMPE (Lei 11.817/2000)',
        pillar: 'Legislação PM & Regime Disciplinar',
        complexity: 'Intermediária / Aplicação',
        points: 10,
        pageRef: 'Art. 13 a 22 da Lei Estadual nº 11.817/2000 (ALEPE)',
        pdfPageNumber: 2,
        apostilaExcerpt:
          'Lei Estadual nº 11.817/2000 (ALEPE - Código Disciplinar dos Militares de Pernambuco): As sanções disciplinares aplicáveis aos militares estaduais classificam-se em advertência, repreensão, detenção, prisão disciplinar, licenciamento e exclusão a bem da disciplina. A advertência é a forma mais branda e tem caráter verbal ou escrito reservado, ao passo que o recolhimento em prisão disciplinar não pode ultrapassar o limite legal máximo estabelecido.',
        stem: 'No exercício das funções de Oficial de Administração da PMPE encarregado da apuração disciplinar preliminar, consoante o Código Disciplinar dos Militares do Estado de Pernambuco (Lei Estadual nº 11.817/2000 - Portal ALEPE), qual é a ordem de gradação das sanções disciplinares e a respectiva regra sobre publicidade da penalidade de Advertência?',
        options: [
          'A Advertência é publicada obrigatoriamente em Boletim Geral Ostensivo para conhecimento de toda a tropa como medida pedagógica exemplar.',
          'A Advertência é a forma mais branda de sanção disciplinar, aplicada verbalmente ou por escrito de forma reservada ao transgressor, não devendo constar na publicação de boletim ostensivo geral.',
          'A prisão disciplinar pode ser aplicada por prazo indeterminado pelo Comandante da OME até que o militar comprove retratação formal.',
          'O Código Disciplinar veda expressamente a punição de detenção disciplinar para militares com mais de 10 anos de efetivo serviço.',
        ],
        correctIndex: 1,
        explanation:
          'Conforme o Código Disciplinar dos Militares do Estado de Pernambuco (Lei Estadual nº 11.817/2000, disponível no acervo oficial da ALEPE - https://legis.alepe.pe.gov.br/): A advertência consiste em admoestação reservada e verbal ou escrita, sem publicidade estigmatizante em Boletim Geral Ostensivo, reservando-se a publicidade em boletim para as sanções de repreensão, detenção e prisão disciplinar.',
      },
      {
        id: 2,
        topic: 'Estatuto dos Policiais Militares (Lei 6.783/1974)',
        pillar: 'Legislação PM & Regime Disciplinar',
        complexity: 'Avançada / Análise',
        points: 10,
        pageRef: 'Arts. 75 a 82 da Lei Estadual nº 6.783/1974 (ALEPE)',
        pdfPageNumber: 2,
        apostilaExcerpt:
          'Lei Estadual nº 6.783/1974 (ALEPE - Estatuto dos Policiais Militares de PE): Agregação é a situação na qual o policial militar da ativa deixa de ocupar vaga na escala hierárquica do seu Quadro, nela permanecendo sem número. Ocorre quando for afastado temporariamente do serviço ativo por motivo de saúde pessoal superior a determinado prazo, licença para tratar de interesse particular ou posse em cargo público civil.',
        stem: 'À luz do Estatuto dos Policiais Militares do Estado de Pernambuco (Lei Estadual nº 6.783/1974, consultada na ALEPE), um policial militar da ativa que venha a ser afastado temporariamente do exercício das funções por ter sido julgado incapaz temporariamente após 1 (um) ano contínuo de tratamento de saúde deverá ser enquadrado na situação de:',
        options: [
          'Reversão imediata ao Quadro de Acesso por antiguidade.',
          'Excedente com perda imediata da remuneração básica.',
          'Agregação, deixando de ocupar vaga na escala hierárquica do seu Quadro, permanecendo sem número.',
          'Reforma administrativa compulsória automática após 30 dias de afastamento.',
        ],
        correctIndex: 2,
        explanation:
          'Conforme os artigos pertinentes da Lei Estadual nº 6.783/1974 (Estatuto dos Policiais Militares de PE - ALEPE): A agregação é a situação em que o militar da ativa deixa de ocupar vaga no respectivo quadro, ficando sem número, ocorrendo dentre outras hipóteses quando for julgado incapaz temporariamente após 1 ano contínuo de tratamento de saúde ou ao gozar licenças específicas.',
      },
      {
        id: 3,
        topic: 'Conselho de Disciplina (Decreto 3.639/1975)',
        pillar: 'Legislação PM & Regime Disciplinar',
        complexity: 'Intermediária / Aplicação',
        points: 10,
        pageRef: 'Decreto Estadual nº 3.639/1975 (ALEPE)',
        pdfPageNumber: 2,
        apostilaExcerpt:
          'Decreto Estadual nº 3.639/1975 (ALEPE - Conselho de Disciplina): O Conselho de Disciplina é destinado a julgar da incapacidade dos Guardas, Cabos e Sargentos da Polícia Militar de Pernambuco com estabilidade assegurada para permanecerem na ativa. É composto por 3 (três) Oficiais da Corporação, cabendo a decisão final ao Comandante Geral.',
        stem: 'No que concerne ao Conselho de Disciplina na PMPE, regulamentado pelo Decreto Estadual nº 3.639/1975 (disponível no portal da ALEPE), assinale a alternativa correta acerca de sua destinação subjetiva e composição colegiada:',
        options: [
          'Destina-se a julgar exclusivamente Oficiais Superiores da ativa e é presidido por um Coronel do Exército Brasileiro.',
          'Destina-se a julgar a capacidade moral e funcional de Guardas, Cabos e Sargentos da PMPE que possuam estabilidade assegurada, sendo composto por 3 (três) Oficiais da Corporação.',
          'É instaurado para julgar civis que cometam crimes contra o patrimônio sob administração militar estadual.',
          'Possui competência recursal privativa para anular sentenças transitadas em julgado da Vara da Justiça Militar Estadual.',
        ],
        correctIndex: 1,
        explanation:
          'Conforme o Decreto Estadual nº 3.639/1975 (ALEPE): O Conselho de Disciplina é o processo administrativo especial para julgar a incapacidade de praças com estabilidade assegurada (Guardas, Cabos e Sargentos) para permanecerem nas fileiras da corporação, composto por um colegiado de 3 Oficiais.',
      },
      {
        id: 4,
        topic: 'Conselho de Justificação (Lei 5.836/1972)',
        pillar: 'Legislação PM & Regime Disciplinar',
        complexity: 'Avançada / Análise',
        points: 10,
        pageRef: 'Lei Federal nº 5.836/1972 e aplicação PMPE',
        pdfPageNumber: 2,
        apostilaExcerpt:
          'Lei Federal nº 5.836/1972: O Conselho de Justificação é destinado a julgar da incapacidade do oficial das Forças Armadas e das Polícias Militares e Corpos de Bombeiros Militares para permanecer na ativa, criando-lhe, ao mesmo tempo, condições para se justificar. É composto por 3 (três) oficiais de posto superior ao do justificante.',
        stem: 'Em relação ao Conselho de Justificação (Lei Federal nº 5.836/1972), aplicável aos Oficiais da PMPE, qual é a autoridade competente para nomear o Conselho e a composição do colegiado processante?',
        options: [
          'É nomeado pelo Governador do Estado e composto por 3 (três) Oficiais de posto superior ao do justificante (ou mais antigos, se do último posto).',
          'É nomeado pelo Corregedor Geral e composto exclusivamente por Subtenentes e Primeiros Sargentos bacharéis em Direito.',
          'É nomeado pelo Juiz de Direito da Vara Militar e composto por 5 membros civis sorteados do Tribunal do Júri.',
          'É instaurado exclusivamente pelo Presidente da ALEPE com parecer vinculante da Comissão de Segurança Pública.',
        ],
        correctIndex: 0,
        explanation:
          'Nos termos da Lei nº 5.836/1972: O Conselho de Justificação para oficiais das corporações militares estaduais é convocado por ato do Governador do Estado (ou Comandante Geral mediante delegação conforme a legislação local) e composto por 3 oficiais de posto superior ao do justificante (ou mais antigos, caso seja Coronel).',
      },
      {
        id: 5,
        topic: 'Direito Penal Militar: Art. 9º CPM e Crimes por Extensão',
        pillar: 'Direito Penal & Processual Militar',
        complexity: 'Avançada / Análise',
        points: 10,
        pageRef: 'Art. 9º do Decreto-Lei nº 1.001/1969 e Lei 13.869/2019',
        pdfPageNumber: 1,
        apostilaExcerpt:
          'Código Penal Militar (Decreto-Lei nº 1.001/1969 com alterações da Lei nº 13.491/2017) e Crimes por Extensão: Consideram-se crimes militares em tempo de paz os crimes previstos no CPM e os previstos na legislação penal comum quando praticados por militar em serviço ou atuando em razão da função, inclusive os crimes da Lei de Abuso de Autoridade (Lei nº 13.869/2019).',
        stem: 'Durante patrulhamento ostensivo ordinário, uma guarnição da PMPE submete um cidadão a constrangimento ilegal com uso de violência desnecessária, configurando conduta tipificada na Lei de Abuso de Autoridade (Lei nº 13.869/2019). À luz da teoria dos crimes militares por extensão (Art. 9º, II do CPM com redação dada pela Lei nº 13.491/2017), qual é a tipificação e a competência para processamento?',
        options: [
          'Trata-se de crime comum estrito, com competência privativa do Juizado Especial Criminal Civil.',
          'Configura crime militar por extensão praticado por militar em serviço, atraindo a competência da Justiça Militar Estadual (Vara da Justiça Militar de PE).',
          'Trata-se de mera transgressão disciplinar militar atípica, desprovida de qualquer relevância penal.',
          'A competência é exclusiva da Justiça Federal em virtude da origem federal da Lei nº 13.869/2019.',
        ],
        correctIndex: 1,
        explanation:
          'Desde a vigência da Lei nº 13.491/2017, os delitos previstos na legislação penal comum (como a Lei de Abuso de Autoridade - Lei nº 13.869/2019), quando praticados por militar nas condições do Art. 9º, II do CPM (como em serviço ou em razão da função), passam a ser considerados crimes militares por extensão, julgados perante a Justiça Militar Estadual.',
      },
      {
        id: 6,
        topic: 'Direito Processual Penal Militar: IPM e APFD',
        pillar: 'Direito Penal & Processual Militar',
        complexity: 'Intermediária / Aplicação',
        points: 10,
        pageRef: 'Arts. 10 a 28 e 243 a 253 do CPPM (Decreto-Lei nº 1.002/1969)',
        pdfPageNumber: 2,
        apostilaExcerpt:
          'Código de Processo Penal Militar (Decreto-Lei nº 1.002/1969): O Inquérito Policial Militar (IPM) é a instrução provisória que tem por fim apurar a autoria e a materialidade dos fatos que configurem crime militar. O prazo de conclusão do IPM é de 20 (vinte) dias se o indiciado estiver preso, e de 40 (quarenta) dias se estiver solto, prorrogável por mais 20 dias mediante despacho motivado.',
        stem: 'Como futuro Oficial de Administração (QOA) designado Encarregado de Inquérito Policial Militar (IPM) pelo Comandante da OME, quais são os prazos legais previstos no Código de Processo Penal Militar (Art. 20 do CPPM) para a conclusão e remessa dos autos, estando o indiciado preso ou solto?',
        options: [
          '10 dias se preso e 30 dias se solto, improrrogáveis em qualquer circunstância.',
          '20 dias se o indiciado estiver preso (contados do dia em que se executar a ordem de prisão) e 40 dias se estiver solto, este último prorrogável por mais 20 dias pela autoridade delegante.',
          '30 dias se preso e 60 dias se solto, sem necessidade de relatório conclusivo.',
          '5 dias corridos se preso e 15 dias úteis se solto, aplicando-se supletivamente as regras do Código Eleitoral.',
        ],
        correctIndex: 1,
        explanation:
          'Conforme o Art. 20 do CPPM (Decreto-Lei nº 1.002/1969): O inquérito policial militar deve terminar dentro em 20 dias, se o indiciado estiver preso, contado esse prazo a partir do dia em que se executar a ordem de prisão; ou no prazo de 40 dias, quando o indiciado estiver solto, podendo este último ser prorrogado por mais 20 dias.',
      },
      {
        id: 7,
        topic: 'Direito Constitucional: Militares dos Estados (Art. 42 e 144 CF/88)',
        pillar: 'Direito Constitucional & Administrativo',
        complexity: 'Básica / Conceitual',
        points: 10,
        pageRef: 'Arts. 42 e 142 da Constituição Federal de 1988',
        pdfPageNumber: 2,
        apostilaExcerpt:
          'Constituição da República Federativa do Brasil de 1988 (Arts. 42, 142 e 144): Os membros das Polícias Militares e Corpos de Bombeiros Militares, instituições organizadas com base na hierarquia e na disciplina, são militares dos Estados, do Distrito Federal e dos Territórios. Ao militar são proibidas a sindicalização e a greve, bem como a filiação a partidos políticos enquanto em serviço ativo.',
        stem: 'Nos termos dos artigos 42 e 142 da Constituição Federal de 1988, aplicáveis aos Policiais Militares do Estado de Pernambuco, assinale a vedação constitucional expressa imposta aos militares estaduais em serviço ativo:',
        options: [
          'É permitida a sindicalização livre e a filiação partidária irrestrita com prévio aviso ao Comandante.',
          'Ao militar estadual são expressamente proibidas a sindicalização e a greve, sendo também vedada a filiação a partidos políticos enquanto estiver em serviço ativo.',
          'O militar pode exercer o direito de greve desde que em percentual mínimo de 30% do efetivo.',
          'A filiação a partidos políticos é livre e obrigatória para concorrer às promoções por merecimento no Quadro de Oficiais de Administração.',
        ],
        correctIndex: 1,
        explanation:
          'A Constituição Federal de 1988 estabelece categoricamente no Art. 42 c/c Art. 142, § 3º, incisos IV e V: "ao militar são proibidas a sindicalização e a greve" e "o militar, enquanto em serviço ativo, não pode estar filiado a partidos políticos".',
      },
      {
        id: 8,
        topic: 'Direito Administrativo & Licitações (Lei 14.133/2021)',
        pillar: 'Direito Constitucional & Administrativo',
        complexity: 'Avançada / Análise',
        points: 10,
        pageRef: 'Lei Federal nº 14.133/2021 (Arts. 28, 78 e 82)',
        pdfPageNumber: 2,
        apostilaExcerpt:
          'Lei Federal nº 14.133/2021 (Nova Lei de Licitações e Contratos): São modalidades de licitação: pregão, concorrência, concurso, leilão e diálogo competitivo. A segregação de funções veda a designação do mesmo agente público para atuação simultânea em funções mais suscetíveis a riscos, a fim de diminuir fraudes e erros.',
        stem: 'Na gestão das compras e contratações do Batalhão, o Oficial de Administração deve aplicar os preceitos da Lei Federal nº 14.133/2021. Sobre as modalidades licitatórias e o princípio da segregação de funções, assinale a opção correta:',
        options: [
          'A tomada de preços e o convite continuam sendo as modalidades obrigatórias para aquisições na PMPE.',
          'São modalidades licitatórias expressas na Lei nº 14.133/2021 o pregão, concorrência, concurso, leilão e diálogo competitivo; ademais, o princípio da segregação de funções impede que o mesmo agente seja responsável pela confecção do termo de referência e pela fiscalização/liquidação simultânea do contrato.',
          'O Sistema de Registro de Preços (SRP) só pode ser utilizado mediante leilão presencial sem publicação em Diário Oficial.',
          'O reajuste de preços é expressamente vedado na Administração Pública em contratos de prestação de serviços continuados.',
        ],
        correctIndex: 1,
        explanation:
          'A Lei Federal nº 14.133/2021 extinguiu as modalidades Convite e Tomada de Preços e consagrou: Pregão, Concorrência, Concurso, Leilão e Diálogo Competitivo. O princípio da segregação de funções (Art. 5º e 7º, § 1º) impede a sobreposição de papéis em etapas críticas de contratação para resguardar a integridade pública.',
      },
      {
        id: 9,
        topic: 'Noções de Administração: Linha e Assessoria / Decisão',
        pillar: 'Administração & Conhecimentos Gerais',
        complexity: 'Básica / Conceitual',
        points: 10,
        pageRef: 'Programa CFOA Bloco I - Noções de Administração',
        pdfPageNumber: 1,
        apostilaExcerpt:
          'Noções de Administração: Na organização formal burocrática, as unidades de linha possuem autoridade de comando direta e responsabilidade primária pelas decisões operacionais da missão fim; já as unidades de assessoria (staff) prestam consultoria, apoio técnico e recomendações especializadas, sem poder de comando direto sobre as tropas subordinadas.',
        stem: 'No estudo das teorias clássicas e estruturas organizacionais formais previsto no Bloco I do programa do CFOA, qual é a distinção técnica entre autoridade de LINHA e autoridade de ASSESSORIA (Staff) em uma corporação militar como a PMPE?',
        options: [
          'Autoridade de assessoria comanda diretamente os Pelotões operacionais de radiopatrulha em ocorrências de rua.',
          'A autoridade de linha possui poder de comando, hierarquia direta e poder decisório sobre as operações; já os órgãos de assessoria (staff) oferecem consultoria técnica, planejamento e suporte especializado, sem autoridade direta de comando sobre a linha.',
          'A autoridade de linha é temporária e consultiva, enquanto o staff responde civil e penalmente por todos os atos de tropa.',
          'Não há distinção entre linha e assessoria na doutrina administrativa contemporânea da segurança pública.',
        ],
        correctIndex: 1,
        explanation:
          'Em teoria da administração e organização militar: Os órgãos de linha (ex: Comandantes de Batalhão, Companhia e Pelotão) exercem autoridade linear e comando direto para o cumprimento da missão fim. Os órgãos de assessoria/staff (ex: Assessorias Jurídicas, Comunicação, Planejamento) prestam auxílio técnico especializado sem intervir na cadeia de comando executiva.',
      },
      {
        id: 10,
        topic: 'Língua Portuguesa & Redação de Correspondências Oficiais',
        pillar: 'Administração & Conhecimentos Gerais',
        complexity: 'Intermediária / Aplicação',
        points: 10,
        pageRef: 'Programa CFOA Bloco I - Redação Oficial e Gramática',
        pdfPageNumber: 1,
        apostilaExcerpt:
          'Redação de Correspondências Oficiais na Polícia Militar: A redação oficial caracteriza-se pela impessoalidade, clareza, concisão, formalidade e uso do padrão culto da língua portuguesa. O Padrão Ofício unifica comunicações formais externas e internas, observando os pronomes de tratamento adequados para autoridades civis e militares.',
        stem: 'Ao redigir correspondência oficial na seção administrativa da PMPE no formato Padrão Ofício endereçada ao Comandante Geral da PMPE e a um Secretário de Estado, qual pronome de tratamento e vocativo devem ser empregados em conformidade com as normas da Redação Oficial?',
        options: [
          'Pronome de tratamento "Vossa Excelência" e vocativo formal "Senhor Comandante Geral" ou "Excelentíssimo Senhor".',
          'Pronome de tratamento "Vossa Majestade" e vocativo "Querido Comandante".',
          'Pronome de tratamento "Vossa Senhoria" para Chefes de Poder Executivo e "Você" para Oficiais Superiores.',
          'Pronome de tratamento "Vossa Magnificência" exclusivo para Oficiais do Quadro de Administração.',
        ],
        correctIndex: 0,
        explanation:
          'Segundo o Manual de Redação Oficial e a praxe militar da PMPE: Para o Comandante Geral da PMPE, Secretários de Estado, Governadores e membros do Judiciário e Legislativo, utiliza-se o pronome de tratamento "Vossa Excelência" (V. Ex.ª) e o vocativo "Senhor Comandante Geral" ou "Excelentíssimo Senhor", mantendo-se a impessoalidade e a clareza do padrão culto.',
      },
    ],
    initialClassRoster: INITIAL_COLLECTIVE_ROSTER,
  },
];
