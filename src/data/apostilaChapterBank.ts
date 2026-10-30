import { CompetencyPillar, DiagnosticQuestion } from './presets';

export type GeneratorScopeMode = 'chapter' | 'pages' | 'subject' | 'all';

export const ALEPE_PORTAL_URL = 'https://legis.alepe.pe.gov.br/';
export const OFFICIAL_CFOA_PROGRAM_PDF =
  '/assets/aistudio/CFOA_SELECAO_INTERNA_-_programa_ca963974.pdf';

export interface LegislationReference {
  name: string;
  source: string;
  url: string;
  summary: string;
}

export const CFOA_PRIMARY_LEGISLATION: LegislationReference[] = [
  {
    name: 'Código Disciplinar dos Militares do Estado de Pernambuco',
    source: 'Lei Estadual nº 11.817, de 24 de julho de 2000 (ALEPE)',
    url: 'https://legis.alepe.pe.gov.br/',
    summary:
      'Dispõe sobre a deontologia militar estadual, deveres, direitos, classificação das transgressões disciplinares (leves, médias e graves), sanções (advertência, repreensão, detenção, prisão disciplinar, licenciamento e exclusão), competências e procedimentos disciplinares na PMPE.',
  },
  {
    name: 'Estatuto dos Policiais Militares do Estado de Pernambuco',
    source: 'Lei Estadual nº 6.783, de 16 de outubro de 1974 (ALEPE)',
    url: 'https://legis.alepe.pe.gov.br/',
    summary:
      'Regula a situação, obrigações, deveres, direitos e prerrogativas dos policiais militares da PMPE: hierarquia e disciplina, agregação, reversão, excedente, licenças, vencimentos, reforma e reserva remunerada.',
  },
  {
    name: 'Regulamento de Ética dos Militares do Estado de Pernambuco',
    source: 'Decreto Estadual nº 22.114, de 13 de março de 2000 (ALEPE)',
    url: 'https://legis.alepe.pe.gov.br/',
    summary:
      'Estabelece os princípios éticos e normas de conduta moral para os policiais militares e bombeiros militares de Pernambuco.',
  },
  {
    name: 'Conselho de Disciplina da Polícia Militar de Pernambuco',
    source: 'Decreto Estadual nº 3.639, de 19 de agosto de 1975 (ALEPE)',
    url: 'https://legis.alepe.pe.gov.br/',
    summary:
      'Regulamenta o processo especial de julgamento da capacidade de Guardas, Cabos e Sargentos da PMPE com estabilidade assegurada de permanecerem na ativa; composição de 3 Oficiais e decisão do Comandante Geral.',
  },
  {
    name: 'Conselho de Justificação',
    source: 'Lei Federal nº 5.836, de 5 de dezembro de 1972',
    url: 'https://legis.alepe.pe.gov.br/',
    summary:
      'Julgamento da capacidade moral e funcional de Oficiais da ativa e da reserva, composto por 3 Oficiais superiores, com envio ao Tribunal competente (TJPE / Justiça Militar).',
  },
  {
    name: 'Nova Lei de Licitações e Contratos Administrativos',
    source: 'Lei Federal nº 14.133, de 1º de abril de 2021',
    url: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14133.htm',
    summary:
      'Modalidades licitatórias (pregão, concorrência, concurso, leilão, diálogo competitivo), segregação de funções, Sistema de Registro de Preços (SRP), PMI e crimes licitatórios (Arts. 337-E a 337-P do CP).',
  },
];

export interface BankQuestion extends DiagnosticQuestion {
  chapterId: string;
  keywords: string[];
  pageNumbers?: number[];
}

export const APOSTILA_QUESTION_BANK: BankQuestion[] = [
  {
    id: 101,
    chapterId: 'cap-1',
    topic: 'Redação Oficial: Pronomes de Tratamento',
    pillar: 'Administração & Conhecimentos Gerais',
    complexity: 'Básica / Conceitual',
    points: 10,
    pageRef: 'Pág. 01 do Programa CFOA',
    pdfPageNumber: 1,
    apostilaExcerpt:
      'Manual de Redação Oficial e Instruções Gerais da PMPE: Ao Comandante Geral da PMPE, Governadores e Secretários de Estado, emprega-se o pronome de tratamento Vossa Excelência (V. Ex.ª) e o vocativo Senhor Comandante Geral.',
    stem: 'Na confecção de uma Comunicação Interna ou Ofício no âmbito administrativo da PMPE, o emprego correto dos pronomes de tratamento para o Comandante Geral da Corporação e o Secretário de Defesa Social exige o uso de:',
    options: [
      'Vossa Excelência (V. Ex.ª), com vocativo "Senhor Comandante Geral" ou "Excelentíssimo Senhor".',
      'Vossa Senhoria (V. S.ª) para qualquer oficial militar sem distinção de posto.',
      'Vossa Magnificência privativo para generais e coronéis.',
      'Tratamento informal direto por primeiro nome e patente.',
    ],
    correctIndex: 0,
    explanation:
      'Conforme a norma culta e o padrão ofício militar, autoridades que chefiam órgãos de cúpula (Comandante Geral da PMPE, Secretários de Estado) recebem o tratamento de Vossa Excelência.',
    keywords: ['redação oficial', 'pronome de tratamento', 'vossa excelência', 'ofício', 'português'],
  },
  {
    id: 102,
    chapterId: 'cap-2',
    topic: 'Raciocínio Lógico: Negação de Proposições',
    pillar: 'Administração & Conhecimentos Gerais',
    complexity: 'Intermediária / Aplicação',
    points: 10,
    pageRef: 'Pág. 01 do Programa CFOA',
    pdfPageNumber: 1,
    apostilaExcerpt:
      'Lógica Proposicional: A negação de uma proposição condicional "Se P, então Q" equivale logicamente a "P e não Q" (mantém a primeira e nega a segunda).',
    stem: 'Em um estudo de caso sobre disciplina militar, considere a proposição: "Se o militar está de serviço, então ele porta armamento institucional". A negação lógica dessa proposição é:',
    options: [
      'O militar está de serviço e não porta armamento institucional.',
      'Se o militar não está de serviço, então não porta armamento institucional.',
      'O militar não está de serviço ou porta armamento institucional.',
      'Nenhum militar de serviço porta armamento institucional.',
    ],
    correctIndex: 0,
    explanation:
      'A negação da condicional p -> q é p ^ ~q. Portanto, "O militar está de serviço e não porta armamento institucional".',
    keywords: ['raciocínio lógico', 'negação', 'condicional', 'proposição', 'equivalência'],
  },
  {
    id: 103,
    chapterId: 'cap-3',
    topic: 'Teoria da Administração: Linha vs. Assessoria',
    pillar: 'Administração & Conhecimentos Gerais',
    complexity: 'Básica / Conceitual',
    points: 10,
    pageRef: 'Pág. 01 do Programa CFOA',
    pdfPageNumber: 1,
    apostilaExcerpt:
      'Teoria da Administração: Os órgãos de linha têm autoridade linear e responsabilidade executiva direta no cumprimento da atividade-fim; a assessoria (staff) presta consultoria, estudos e suporte técnico sem comando sobre a tropa.',
    stem: 'Na organização militar formal da PMPE, qual das seguintes funções exemplifica legitimamente um órgão de ASSESSORIA (Staff) em relação ao Comando do Batalhão?',
    options: [
      'A Assessoria Jurídica e a Seção de Planejamento e Estatística (P3), que analisam dados e emitem pareceres técnicos sem autoridade direta de comando sobre os Pelotões operacionais.',
      'O Comandante de Pelotão de Radiopatrulha em atendimento de ocorrência emergencial.',
      'O Oficial de Operações em perseguição policial de flagrante delito.',
      'A Guarda do Quartel durante a fiscalização do portão de entrada de viaturas.',
    ],
    correctIndex: 0,
    explanation:
      'Os órgãos de assessoria técnica (staff) apoiam o comando com planejamento, estatística e pareceres jurídicos, sem exercer comando operacional direto sobre as frações de linha.',
    keywords: ['administração', 'linha e assessoria', 'staff', 'organização militar', 'processo decisório'],
  },
  {
    id: 104,
    chapterId: 'cap-4',
    topic: 'Direito Penal Militar: Art. 9º CPM e Excludentes',
    pillar: 'Direito Penal & Processual Militar',
    complexity: 'Avançada / Análise',
    points: 10,
    pageRef: 'Art. 9º e 38 do CPM',
    pdfPageNumber: 1,
    apostilaExcerpt:
      'Código Penal Militar (Decreto-Lei nº 1.001/1969): Não é culpado quem comete o crime sob coação moral irresistível ou em estrita obediência a ordem de superior, desde que não seja manifestamente criminosa.',
    stem: 'Um Sargento da PMPE recebe de seu Capitão Comandante de Companhia uma ordem expressa para subtrair e ocultar autos de uma apuração disciplinar em andamento para favorecer um amigo civil. Se o Sargento cumprir a ordem, qual é a repercussão penal militar?',
    options: [
      'Ficará isento de pena militar por obediência hierárquica irrestrita.',
      'Responderá como coautor do crime militar, pois a ordem era manifestamente criminosa, hipótese em que a obediência cega não exclui a culpabilidade.',
      'Responderá apenas perante a Justiça Comum por ato de improbidade sem reflexo penal militar.',
      'A responsabilidade recai unicamente sobre o oficial que deu a ordem escrita.',
    ],
    correctIndex: 1,
    explanation:
      'O Art. 38 do CPM dispõe que a obediência a ordem de superior somente isenta de pena se a ordem não for manifestamente criminosa. Sendo evidente a ilicitude da ordem, respondem tanto o superior quanto o subordinado.',
    keywords: ['penal militar', 'cpm', 'obediência hierárquica', 'artigo 38', 'crime militar'],
  },
  {
    id: 105,
    chapterId: 'cap-5',
    topic: 'Abuso de Autoridade (Lei 13.869/2019)',
    pillar: 'Direito Penal & Processual Militar',
    complexity: 'Intermediária / Aplicação',
    points: 10,
    pageRef: 'Lei nº 13.869/2019 e Art. 9º CPM',
    pdfPageNumber: 1,
    apostilaExcerpt:
      'Lei nº 13.869/2019: As condutas descritas nesta Lei constituem crime de abuso de autoridade quando praticadas pelo agente com a finalidade específica de prejudicar outrem ou beneficiar a si mesmo ou a terceiro, ou, ainda, por mero capricho ou satisfação pessoal.',
    stem: 'Para a configuração de qualquer dos crimes previstos na Lei de Abuso de Autoridade (Lei nº 13.869/2019), o tipo penal exige imprescindivelmente:',
    options: [
      'A prova do dolo específico de prejudicar outrem, beneficiar a si ou a terceiro, ou de agir por mero capricho ou satisfação pessoal.',
      'A ocorrência de dano patrimonial superior a 50 salários mínimos ao erário público.',
      'A prévia condenação disciplinar do militar no Conselho de Disciplina.',
      'Que a conduta tenha sido praticada fora do horário de serviço militar.',
    ],
    correctIndex: 0,
    explanation:
      'O Art. 1º, § 1º da Lei nº 13.869/2019 expressamente exige a finalidade específica de prejudicar outrem, beneficiar a si ou a terceiro, ou agir por mero capricho ou satisfação pessoal, afastando a tipificação por mera divergência na interpretação de lei.',
    keywords: ['abuso de autoridade', '13.869', 'dolo específico', 'crimes por extensão', 'penal militar'],
  },
  {
    id: 106,
    chapterId: 'cap-6',
    topic: 'Processo Penal Militar: Prazos do IPM (Art. 20 CPPM)',
    pillar: 'Direito Penal & Processual Militar',
    complexity: 'Intermediária / Aplicação',
    points: 10,
    pageRef: 'Art. 20 do CPPM (Decreto-Lei nº 1.002/1969)',
    pdfPageNumber: 2,
    apostilaExcerpt:
      'Código de Processo Penal Militar (Art. 20 do CPPM): O inquérito policial militar deve terminar dentro em 20 dias, se o indiciado estiver preso, ou no prazo de 40 dias, quando estiver solto, prorrogável este último por mais 20 dias.',
    stem: 'Designado como encarregado de Inquérito Policial Militar (IPM) para apurar crime militar com indiciado respondendo ao processo em liberdade (solto), qual é o prazo inicial para a conclusão das investigações e a possibilidade de prorrogação segundo o CPPM?',
    options: [
      '40 dias corridos, prorrogáveis por mais 20 dias pela autoridade delegante mediante justificativa plausível.',
      '30 dias improrrogáveis em qualquer situação fática.',
      '20 dias corridos com prorrogação automática por mais 60 dias.',
      '15 dias úteis sem necessidade de formalização de relatório.',
    ],
    correctIndex: 0,
    explanation:
      'Nos termos do Art. 20 do CPPM, o prazo do IPM com indiciado solto é de 40 dias, admitindo prorrogação por mais 20 dias pela autoridade que o determinou.',
    keywords: ['processo penal militar', 'cppm', 'ipm', 'prazos ipm', '40 dias', '20 dias'],
  },
  {
    id: 107,
    chapterId: 'cap-7',
    topic: 'Direito Constitucional: Militares dos Estados (Arts. 42 e 142 CF/88)',
    pillar: 'Direito Constitucional & Administrativo',
    complexity: 'Básica / Conceitual',
    points: 10,
    pageRef: 'Arts. 42 e 142 da CF/88',
    pdfPageNumber: 2,
    apostilaExcerpt:
      'Constituição Federal de 1988: Os militares dos Estados, organizados com base na hierarquia e na disciplina, não podem exercer greve, não podem se sindicalizar e, enquanto em serviço ativo, não podem filiar-se a partidos políticos.',
    stem: 'Sobre os direitos políticos e prerrogativas sindicais dos Policiais Militares de Pernambuco, a Constituição Federal de 1988 preconiza que:',
    options: [
      'A greve e a sindicalização são expressamente vedadas aos militares estaduais, assim como a filiação a partidos políticos enquanto permanecerem no serviço ativo.',
      'O direito de greve pode ser exercido pelos policiais militares desde que previamente aprovado em assembleia geral.',
      'A sindicalização é permitida exclusivamente para pleitear reajustes remuneratórios anuais.',
      'A filiação a partidos políticos é livre para qualquer militar estadual com mais de 5 anos de serviço.',
    ],
    correctIndex: 0,
    explanation:
      'A Carta Magna veda categoricamente a sindicalização, a greve e a filiação partidária no serviço ativo aos militares (Art. 42 c/c Art. 142, § 3º, IV e V da CF/88).',
    keywords: ['constitucional', 'artigo 42', 'artigo 142', 'greve', 'sindicalização', 'militares estaduais'],
  },
  {
    id: 108,
    chapterId: 'cap-8',
    topic: 'Direito Administrativo: Lei 14.133/2021 e Segregação de Funções',
    pillar: 'Direito Constitucional & Administrativo',
    complexity: 'Avançada / Análise',
    points: 10,
    pageRef: 'Lei nº 14.133/2021 (Arts. 5º e 7º)',
    pdfPageNumber: 2,
    apostilaExcerpt:
      'Lei Federal nº 14.133/2021: O princípio da segregação de funções veda a designação do mesmo agente público para atuação simultânea em funções mais suscetíveis a riscos, de modo a reduzir a ocorrência de fraudes e erros.',
    stem: 'Na aplicação da Lei Federal nº 14.133/2021 aos procedimentos de aquisição de bens e contratação de serviços na PMPE, o princípio da segregação de funções determina que:',
    options: [
      'Deve haver separação entre as funções de planejamento, elaboração do edital, condução do certame e fiscalização/liquidação do contrato, impedindo a concentração em um único servidor.',
      'Todas as compras da OME devem ser realizadas por dispensa de licitação independentemente do valor da contratação.',
      'O Comandante do Batalhão deve obrigatoriamente assinar todos os atestos fiscais sem delegar a fiscais técnicos.',
      'O pregoeiro responde solidariamente pelo pagamento das parcelas contratuais sem análise da comissão de recebimento.',
    ],
    correctIndex: 0,
    explanation:
      'O princípio da segregação de funções (Art. 5º da Lei 14.133/2021) impede que o mesmo agente desempenhe atribuições concorrentes e suscetíveis a conflito de interesses na cadeia de contratação.',
    keywords: ['licitações', '14.133', 'segregação de funções', 'atos administrativos', 'direito administrativo'],
  },
  {
    id: 109,
    chapterId: 'cap-9',
    topic: 'Estatuto dos Policiais Militares de PE: Agregação (Lei 6.783/1974 - ALEPE)',
    pillar: 'Legislação PM & Regime Disciplinar',
    complexity: 'Intermediária / Aplicação',
    points: 10,
    pageRef: 'Arts. 75 a 82 da Lei Estadual nº 6.783/1974 (ALEPE)',
    pdfPageNumber: 2,
    apostilaExcerpt:
      'Lei Estadual nº 6.783/1974 (ALEPE): A agregação é a situação na qual o policial militar da ativa deixa de ocupar vaga na escala hierárquica do seu Quadro, nela permanecendo sem número. Ocorre quando for afastado temporariamente do serviço ativo por motivo de saúde pessoal superior a determinado prazo, licença para interesse particular ou posse em cargo público civil.',
    stem: 'Em conformidade com a Lei Estadual nº 6.783/1974 (Estatuto dos Policiais Militares de PE, disponível no portal da ALEPE), a situação do policial militar da ativa que deixa de ocupar vaga na escala hierárquica de seu quadro, nela permanecendo sem número em razão de licença para interesse particular superior a 6 meses, denomina-se:',
    options: [
      'Agregação.',
      'Reversão provisória.',
      'Excedência compulsória.',
      'Reforma administrativa imediata.',
    ],
    correctIndex: 0,
    explanation:
      'A agregação é o instituto estatutário pelo qual o policial militar da ativa afasta-se temporariamente do serviço ativo sem ocupar vaga na escala de seu Quadro, permanecendo sem número (Lei Estadual nº 6.783/1974 - ALEPE).',
    keywords: ['estatuto pmpe', '6.783', 'agregação', 'escala hierárquica', 'alepe'],
  },
  {
    id: 110,
    chapterId: 'cap-10',
    topic: 'Código Disciplinar PMPE: Sanções e Advertência (Lei 11.817/2000 - ALEPE)',
    pillar: 'Legislação PM & Regime Disciplinar',
    complexity: 'Intermediária / Aplicação',
    points: 10,
    pageRef: 'Arts. 13 a 22 da Lei Estadual nº 11.817/2000 (ALEPE)',
    pdfPageNumber: 2,
    apostilaExcerpt:
      'Lei Estadual nº 11.817/2000 (ALEPE - Código Disciplinar): A advertência é a forma mais branda de sanção disciplinar, de caráter meramente educativo, que deve ser aplicada de forma verbal ou reservada ao transgressor, não sendo passível de publicação em boletim ostensivo.',
    stem: 'Sobre as sanções disciplinares previstas no Código Disciplinar dos Militares de Pernambuco (Lei Estadual nº 11.817/2000, consultada no portal da ALEPE), assinale a afirmativa correta:',
    options: [
      'A advertência é a sanção disciplinar mais branda, aplicada verbalmente ou por escrito de forma reservada ao transgressor, não constando de publicação ostensiva em boletim.',
      'A prisão disciplinar pode ser aplicada por prazo superior a 90 dias a critério discricionário do Comandante de Companhia.',
      'A transgressão leve acarreta automaticamente o licenciamento a bem da disciplina do militar sem direito a recurso.',
      'O militar punido com repreensão perde a remuneração proporcional aos dias de punição.',
    ],
    correctIndex: 0,
    explanation:
      'Nos termos da Lei Estadual nº 11.817/2000 da ALEPE, a advertência é a sanção mais branda, aplicada de forma reservada para não estigmatizar o militar, sem publicação em boletim geral ostensivo.',
    keywords: ['código disciplinar', '11.817', 'advertência', 'sanções disciplinares', 'alepe'],
  },
  {
    id: 111,
    chapterId: 'cap-11',
    topic: 'Conselho de Disciplina (Dec. 3.639/1975) e Justificação (Lei 5.836/72)',
    pillar: 'Legislação PM & Regime Disciplinar',
    complexity: 'Avançada / Análise',
    points: 10,
    pageRef: 'Decreto Estadual nº 3.639/1975 (ALEPE) e Lei nº 5.836/1972',
    pdfPageNumber: 2,
    apostilaExcerpt:
      'Decreto Estadual nº 3.639/1975 (ALEPE): O Conselho de Disciplina é o processo especial destinado a julgar a capacidade moral e funcional de Guardas, Cabos e Sargentos da PMPE com estabilidade assegurada, sendo composto por 3 Oficiais e tendo decisão final do Comandante Geral. Já o Conselho de Justificação (Lei 5.836/72) destina-se exclusivamente aos Oficiais.',
    stem: 'Analise as distinções entre o Conselho de Disciplina (Decreto Estadual nº 3.639/1975 - ALEPE) e o Conselho de Justificação (Lei Federal nº 5.836/1972) no âmbito da Polícia Militar de Pernambuco:',
    options: [
      'O Conselho de Disciplina destina-se a julgar a incapacidade de Guardas, Cabos e Sargentos com estabilidade assegurada para permanecerem na ativa; já o Conselho de Justificação destina-se privativamente ao julgamento de Oficiais da Corporação.',
      'O Conselho de Disciplina julga Oficiais e o Conselho de Justificação julga Soldados não estáveis.',
      'Ambos os conselhos são presididos pelo Procurador Geral de Justiça de Pernambuco.',
      'O Conselho de Disciplina resulta em pena privativa de liberdade em penitenciária de segurança máxima.',
    ],
    correctIndex: 0,
    explanation:
      'O Decreto Estadual nº 3.639/1975 regula o Conselho de Disciplina aplicável a Praças estáveis da PMPE (Guardas, Cabos e Sargentos). A Lei Federal nº 5.836/1972 destina o Conselho de Justificação privativamente a Oficiais.',
    keywords: ['conselho de disciplina', 'conselho de justificação', '3.639', '5.836', 'praças estáveis', 'oficiais'],
  },
  {
    id: 112,
    chapterId: 'cap-12',
    topic: 'Direitos Humanos e Uso da Força Policial',
    pillar: 'Administração & Conhecimentos Gerais',
    complexity: 'Básica / Conceitual',
    points: 10,
    pageRef: 'DUDH (1948) e Pág. 02 do Programa CFOA',
    pdfPageNumber: 2,
    apostilaExcerpt:
      'Declaração Universal dos Direitos Humanos (1948) e Princípios Internacionais do Uso da Força: O emprego da força por agentes policiais deve pautar-se pela legalidade, necessidade, proporcionalidade, moderação e conveniência.',
    stem: 'Segundo os preceitos internacionais de Direitos Humanos e as diretrizes doutrinárias da PMPE, o uso da força policial durante o cumprimento de missões operacionais rege-se pelos princípios de:',
    options: [
      'Legalidade, necessidade, proporcionalidade, moderação e conveniência.',
      'Imperatividade absoluta, letalidade prévia e sigilo irrestrito.',
      'Conveniência partidária, oportunidade econômica e isenção judicial.',
      'Supremacia militar sobre as garantias fundamentais da Constituição.',
    ],
    correctIndex: 0,
    explanation:
      'Os princípios basilares do uso diferenciado da força adotados pelas polícias brasileiras e tratados internacionais de direitos humanos são: legalidade, necessidade, proporcionalidade, moderação e conveniência.',
    keywords: ['direitos humanos', 'uso da força', 'dudh', 'proporcionalidade', 'legalidade'],
  },
];

export interface ApostilaChapterItem {
  id: string;
  number: string;
  title: string;
  pilar: string;
  competencyPillar: CompetencyPillar;
  pages: string;
  summary: string;
  normativeBase: string;
  keyPoints: string[];
  ficaADica: string;
  practicalExample: string;
}

export const APOSTILA_CHAPTERS_DATA: ApostilaChapterItem[] = [
  {
    id: 'cap-1',
    number: 'Módulo 01',
    title: 'Língua Portuguesa, Interpretação de Textos e Redação Oficial',
    pilar: 'Comunicação Oficial e Tipologia Textual',
    competencyPillar: 'Administração & Conhecimentos Gerais',
    pages: 'Edital Bloco I · Item 1 (Pág. 01)',
    summary:
      'Estudo aprofundado de interpretação de textos, tipologia textual, ortografia oficial, crase, concordância nominal/verbal, regência e elaboração técnica de correspondências oficiais (Padrão Ofício PMPE, pronomes de tratamento e vocativos regimentais).',
    normativeBase:
      'Manual de Redação Oficial · Instruções Gerais da PMPE · Gramática Normativa',
    keyPoints: [
      'Padrão Ofício: Clareza, impessoalidade, concisão, formalidade e padrão culto.',
      'Pronome de Tratamento: "Vossa Excelência" (V. Ex.ª) para Comandante Geral da PMPE, Governador, Secretários de Estado e membros do Judiciário; vocativo "Senhor Comandante Geral" ou "Excelentíssimo Senhor".',
      'Emprego da crase: Obrigatória diante de locuções femininas e vedada antes de substantivos masculinos e verbos.',
      'Concordância e regência verbal dos verbos frequentes no serviço policial militar (informar, visar, assistir, obedecer).',
    ],
    ficaADica:
      '#FICAADICA (Pág. 01): Na redação oficial militar, nunca inicie ofícios ou partes com adjetivos subjetivos ou opiniões pessoais: a impessoalidade e a objetividade são requisitos funcionais do futuro Oficial de Administração.',
    practicalExample:
      'Um Primeiro Sargenteante elabora a minuta de Ofício endereçada à Diretoria de Gestão de Pessoas (DGP), aplicando o pronome V. Ex.ª ao Diretor Coronel e mantendo estrutura estritamente técnica.',
  },
  {
    id: 'cap-2',
    number: 'Módulo 02',
    title: 'Raciocínio Lógico, Argumentação e Métodos Quantitativos',
    pilar: 'Estruturas Lógicas e Dedução',
    competencyPillar: 'Administração & Conhecimentos Gerais',
    pages: 'Edital Bloco I · Item 2 (Pág. 01)',
    summary:
      'Compreensão de estruturas lógicas, lógica de argumentação, diagramas lógicos de conjuntos, analogias, inferências, deduções, princípios da contagem e cálculo de probabilidade para planejamento administrativo e tomada de decisão.',
    normativeBase: 'Programa Oficial CFOA PMPE · Lógica Proposicional e Matemática',
    keyPoints: [
      'Equivalências e Negações: Negação de "Todo A é B" é "Algum A não é B"; negação de "Se P, então Q" é "P e não Q" (regra do MANÉ).',
      'Tabelas-Verdade: Conjunção (^), Disjunção (v), Condicional (->) e Bicondicional (<->).',
      'Diagramas de Venn para solução de problemas de efetivo, escalas e distribuição de viaturas.',
      'Princípio Fundamental da Contagem (PFC) e probabilidade simples aplicada à gestão logística e operacional.',
    ],
    ficaADica:
      '#FICAADICA (Pág. 01): Cuidado com a pegadinha clássica da banca: a negação de uma proposição universal afirmativa ("Todo policial militar é disciplinado") NÃO é "Nenhum policial...", mas sim a existência de ao menos uma exceção ("Algum policial não é disciplinado").',
    practicalExample:
      'Cálculo do número de combinações possíveis para organizar escalas de serviço de 4 oficiais em 3 turnos ininterruptos de plantão operacional.',
  },
  {
    id: 'cap-3',
    number: 'Módulo 03',
    title: 'Noções de Administração Geral, Organizações e Processo Decisório',
    pilar: 'Teorias da Administração, Linha e Assessoria',
    competencyPillar: 'Administração & Conhecimentos Gerais',
    pages: 'Edital Bloco I · Item 3 (Pág. 01)',
    summary:
      'Teorias clássicas da administração (Taylor, Fayol, Weber e Abordagem Mecanicista). Organização formal e burocrática. Estrutura de linha vs. assessoria (staff). Funções administrativas (Planejar, Organizar, Dirigir, Controlar - PODC), processo decisório e cultura organizacional.',
    normativeBase: 'Teoria Geral da Administração (TGA) · Doutrina Militar de Estado Maior',
    keyPoints: [
      'Burocracia de Max Weber: Legalidade, impessoalidade, hierarquia, competência técnica e padronização procedimental.',
      'Linha vs. Assessoria: Órgãos de LINHA possuem autoridade de comando direto e responsabilidade executiva na missão fim; órgãos de ASSESSORIA (Staff) prestam consultoria técnica especializada sem poder de comando direto sobre a tropa.',
      'Processo Decisório: Identificação do problema, diagnóstico, levantamento de alternativas, tomada de decisão e avaliação.',
      'Controle Organizacional: Elementos de controle prévio, concomitante e posterior para eficiência do gasto público militar.',
    ],
    ficaADica:
      '#FICAADICA (Pág. 01): Como Oficial de Administração (QOA), você exercerá preponderantemente funções de gestão de linha na administração interna e de assessoria técnica ao Comando nos processos de tomada de decisão.',
    practicalExample:
      'A Seção de Planejamento Operacional (EMO / Staff) elabora o plano de segurança do Carnaval e o Comandante do Batalhão (Linha) emite a Ordem de Serviço executiva para as Companhias.',
  },
  {
    id: 'cap-4',
    number: 'Módulo 04',
    title: 'Direito Penal Militar: Princípios, Excludentes e Crimes em Espécie',
    pilar: 'Código Penal Militar (Decreto-Lei nº 1.001/1969)',
    competencyPillar: 'Direito Penal & Processual Militar',
    pages: 'Edital Bloco II · Item 1 (Pág. 01)',
    summary:
      'Princípio da legalidade penal militar. Crimes militares em tempo de paz (Art. 9º do CPM). Equiparação a comandante e conceito de superior. Excludentes de ilicitude e culpabilidade (coação moral irresistível e obediência hierárquica estrita). Crimes contra autoridade, disciplina e administração militar.',
    normativeBase:
      'Código Penal Militar (Decreto-Lei nº 1.001/1969 com alterações da Lei nº 13.491/2017)',
    keyPoints: [
      'Art. 9º, II do CPM: Crimes praticados por militar da ativa contra militar da ativa, ou em lugar sujeito à administração militar, ou em serviço.',
      'Obediência Hierárquica (Art. 38 do CPM): Exclui a culpabilidade quando decorrente de ordem estrita de superior, respondendo o superior se a ordem não for manifestamente criminosa.',
      'Crimes contra a autoridade e disciplina militar: Insubordinação (recusa de obediência, oposição à ordem da sentinela), desacato a superior e desrespeito.',
      'Crimes contra o serviço e administração militar: Deserção, abandono de posto e peculato militar.',
    ],
    ficaADica:
      '#FICAADICA (Pág. 01): Se a ordem do superior for manifestamente criminosa, a obediência cega NÃO exclui a responsabilidade do subordinado! Ambos respondem em concurso de pessoas pelo crime militar praticado.',
    practicalExample:
      'Instauração de Inquérito Policial Militar para apurar abandono de posto de sentinela da guarda do Quartel do Comando Geral (Art. 195 do CPM).',
  },
  {
    id: 'cap-5',
    number: 'Módulo 05',
    title: 'Crimes Militares por Extensão e Legislação Especial Extravagante',
    pilar: 'Lei 13.869/19, Lei 7.716/89 e Crimes Licitatórios',
    competencyPillar: 'Direito Penal & Processual Militar',
    pages: 'Edital Bloco II · Item 1 (Pág. 01)',
    summary:
      'Regime dos crimes militares por extensão (introduzido pela Lei nº 13.491/2017 ao Art. 9º, II do CPM). Crimes de abuso de autoridade (Lei nº 13.869/2019). Crimes resultantes de preconceito de raça ou de cor (Lei nº 7.716/1989). Crimes em licitações e contratos administrativos (Arts. 337-E a 337-P do Código Penal pela Lei nº 14.133/2021).',
    normativeBase:
      'Lei nº 13.869/2019 · Lei nº 7.716/1989 · Lei nº 14.133/2021 · Art. 9º CPM',
    keyPoints: [
      'Crimes Militares por Extensão: Toda conduta tipificada na legislação penal comum praticada nas situações do Art. 9º, II do CPM é crime militar de competência da Justiça Militar Estadual.',
      'Abuso de Autoridade (Lei nº 13.869/2019): Exige dolo específico de prejudicar outrem, beneficiar a si ou a terceiro, ou mero capricho/satisfação pessoal (Art. 1º, § 1º). A divergência hermenêutica não configura abuso.',
      'Crimes Raciais (Lei nº 7.716/1989): Inafiançáveis e imprescritíveis conforme o Art. 5º, XLII da CF/88.',
      'Crimes Licitatórios: Fraude à licitação, contratação indevida e frustração do caráter competitivo no âmbito das OMEs.',
    ],
    ficaADica:
      '#FICAADICA (Pág. 01): Na Lei de Abuso de Autoridade (Lei 13.869/2019), a conduta só é criminosa se comprovado o elemento subjetivo especial ("com a finalidade específica de prejudicar outrem ou beneficiar a si mesmo ou a terceiro, ou por mero capricho").',
    practicalExample:
      'Oficial de Administração atuando como pregoeiro que frustra licitação da PMPE para beneficiar fornecedor amigo responde por crime licitatório militar por extensão perante a Justiça Militar.',
  },
  {
    id: 'cap-6',
    number: 'Módulo 06',
    title: 'Direito Processual Penal Militar: PJM, IPM, APFD e Prisões',
    pilar: 'Polícia Judiciária Militar e Instrução Provisória',
    competencyPillar: 'Direito Penal & Processual Militar',
    pages: 'Edital Bloco II · Itens 7, 8 e 9 (Págs. 01 e 02)',
    summary:
      'Exercício da Polícia Judiciária Militar pelas autoridades competentes da PMPE. Inquérito Policial Militar (IPM): instauração, prazos (20 dias preso, 40 dias solto prorrogáveis por 20), relatório e encerramento. Auto de Prisão em Flagrante Delito (APFD), instrução provisória de deserção, acareação, perícias e prisão preventiva.',
    normativeBase: 'Código de Processo Penal Militar (Decreto-Lei nº 1.002/1969)',
    keyPoints: [
      'Polícia Judiciária Militar: Exercida pelos Comandantes de OME e Oficiais designados para apuração de infrações penais militares.',
      'Prazos do IPM: 20 dias com indiciado preso (a contar da execução da ordem) e 40 dias com indiciado solto, prorrogável por mais 20 dias mediante requerimento motivado.',
      'APFD no CPPM: Lavratura, interrogatório, testemunhas, nota de culpa em até 24 horas e comunicação imediata ao juiz auditor militar e Ministério Público.',
      'Instrução Provisória de Deserção: Lavratura do termo após consumada a ausência injustificada superior a 8 (oito) dias contínuos.',
    ],
    ficaADica:
      '#FICAADICA (Págs. 01 e 02): Na deserção (Art. 187 do CPM), a ausência inicial do militar de 1 a 8 dias configura apenas a contravenção/transgressão preliminar; a deserção só se consuma à zero hora do 9º dia!',
    practicalExample:
      'O Oficial de Dia lavra o Auto de Prisão em Flagrante Delito (APFD) de policial militar flagrado em flagrante delito de concussão durante blitz de trânsito.',
  },
  {
    id: 'cap-7',
    number: 'Módulo 07',
    title: 'Direito Constitucional: Direitos Fundamentais, Militares e Segurança Pública',
    pilar: 'Arts. 5º, 37, 42, 142 e 144 da CF/88',
    competencyPillar: 'Direito Constitucional & Administrativo',
    pages: 'Edital Bloco II · Item 2 (Pág. 02)',
    summary:
      'Direitos e Garantias Fundamentais individuais e coletivos (Art. 5º CF/88). Princípios constitucionais da Administração Pública (Art. 37 - LIMPE). Regime constitucional dos Militares dos Estados (Art. 42 c/c Art. 142). Vedações a sindicalização, greve e filiação partidária na ativa. Segurança Pública (Art. 144): missão constitucional da PMPE (polícia ostensiva e preservação da ordem pública).',
    normativeBase:
      'Constituição da República Federativa do Brasil de 1988 (CF/88)',
    keyPoints: [
      'Art. 42 e 142 § 3º: Vedação absoluta de greve e sindicalização aos policiais militares estaduais; vedação de filiação partidária em serviço ativo.',
      'Inviolabilidade de domicílio (Art. 5º, XI): Entrada com consentimento ou, a qualquer hora, em flagrante delito, desastre ou para prestar socorro; por determinação judicial, apenas durante o dia.',
      'Segurança Pública (Art. 144, § 5º): Às polícias militares cabem a polícia ostensiva e a preservação da ordem pública; são forças auxiliares e reserva do Exército.',
      'Competência da Justiça Militar Estadual (Art. 125, § 4º): Julga os militares dos Estados nos crimes militares e ações judiciais contra atos disciplinares militares.',
    ],
    ficaADica:
      '#FICAADICA (Pág. 02): Lembre-se da Súmula Vinculante 11 do STF sobre o uso de algemas: permitido apenas em casos de resistência e de fundado receio de fuga ou de perigo à integridade física própria ou alheia, justificado por escrito.',
    practicalExample:
      'Comandante de Companhia orienta a tropa sobre a necessidade de justificar expressamente no Boletim de Ocorrência o uso de algemas durante a condução de suspeito violento.',
  },
  {
    id: 'cap-8',
    number: 'Módulo 08',
    title: 'Direito Administrativo, Poderes, Atos e Licitações (Lei 14.133/2021)',
    pilar: 'Atos Administrativos, Poder de Polícia e Contratações',
    competencyPillar: 'Direito Constitucional & Administrativo',
    pages: 'Edital Bloco II · Item 2 (Pág. 02)',
    summary:
      'Princípios expressos e implícitos da Administração. Poderes administrativos (vinculado, discricionário, hierárquico, disciplinar e poder de polícia). Atos Administrativos: elementos/requisitos (COFIFOMO) e atributos (PATI). Anulação vs. Revogação. Responsabilidade civil do Estado (Art. 37, § 6º da CF/88). Licitações e Contratos Públicos à luz da Lei Federal nº 14.133/2021.',
    normativeBase:
      'Lei Federal nº 14.133/2021 · Doutrina de Direito Administrativo · CF/88',
    keyPoints: [
      'Requisitos do Ato Administrativo: Competência, Finalidade, Forma, Motivo e Objeto.',
      'Atributos do Ato: Presunção de Legitimidade/Veracidade, Autoexecutoriedade, Tipicidade e Imperatividade.',
      'Anulação (ilegalidade, ex tunc, pode ser feita pela Adm ou Judiciário) vs. Revogação (conveniência e oportunidade, ex nunc, privativa da Administração).',
      'Nova Lei de Licitações (Lei 14.133/2021): Modalidades pregão, concorrência, concurso, leilão e diálogo competitivo; Sistema de Registro de Preços (SRP); Segregação de Funções.',
    ],
    ficaADica:
      '#FICAADICA (Pág. 02): Na Lei 14.133/2021, o Diálogo Competitivo é modalidade inédita voltada para contratações que envolvam inovações tecnológicas ou técnicas complexas onde a Administração não consegue definir a solução antecipadamente.',
    practicalExample:
      'Oficial de Administração fiscaliza contrato de manutenção predial do quartel, aplicando o princípio da segregação de funções para não atuar cumulativamente na liquidação e atesto da nota fiscal.',
  },
  {
    id: 'cap-9',
    number: 'Módulo 09',
    title: 'Estatuto dos Policiais Militares de PE (Lei Estadual nº 6.783/1974 - ALEPE)',
    pilar: 'Regime Jurídico, Hierarquia e Direitos na PMPE',
    competencyPillar: 'Legislação PM & Regime Disciplinar',
    pages: 'Edital Bloco II · Item 4 (Pág. 02)',
    summary:
      'Estatuto dos Policiais Militares do Estado de Pernambuco, consultado na íntegra no portal oficial da ALEPE (https://legis.alepe.pe.gov.br/). Hierarquia e disciplina. Provimento de postos e graduações. Situação de atividade e inatividade. Agregação, reversão e excedente. Licenças, prerrogativas, uso de uniformes e exclusão do serviço ativo.',
    normativeBase:
      'Lei Estadual nº 6.783, de 16 de outubro de 1974 (ALEPE: https://legis.alepe.pe.gov.br/)',
    keyPoints: [
      'Hierarquia e Disciplina: Bases institucionais das Forças Militares do Estado de Pernambuco.',
      'Círculos Hierárquicos: Oficiais Superiores, Intermediários e Subalternos; Praças Especiais; Praças (Subtenentes, Sargentos, Cabos e Soldados).',
      'Agregação (Arts. 75 a 82): O militar afasta-se temporariamente do serviço ativo sem ocupar vaga na escala hierárquica (ex.: saúde > 1 ano contínuo, licença para interesse particular).',
      'Excedente: Situação do militar que, promovido indevidamente ou retornando de agregação sem vaga imediata, aguarda vaga mantendo seus direitos.',
    ],
    ficaADica:
      '#FICAADICA (Pág. 02): No portal da ALEPE (https://legis.alepe.pe.gov.br/), sempre confira a redação atualizada do Estatuto (Lei 6.783/1974) com as sucessivas emendas sobre tempo de serviço e previdência militar.',
    practicalExample:
      'Chefe da Sargenteação instrui requerimento de licença especial de militar estadual fundamentando estritamente nos artigos vigentes da Lei Estadual nº 6.783/1974.',
  },
  {
    id: 'cap-10',
    number: 'Módulo 10',
    title: 'Código Disciplinar (Lei 11.817/2000) e Regulamento de Ética (Decreto 22.114/2000)',
    pilar: 'Deontologia, Transgressões e Sanções Disciplinares na ALEPE',
    competencyPillar: 'Legislação PM & Regime Disciplinar',
    pages: 'Edital Bloco II · Item 4 (Pág. 02)',
    summary:
      'Código Disciplinar dos Militares do Estado de Pernambuco (Lei nº 11.817/2000 - ALEPE) e Regulamento de Ética (Decreto nº 22.114/2000 - ALEPE). Deontologia policial militar, valores fundamentais, classificação das transgressões em leves, médias e graves. Sanções disciplinares, circunstâncias atenuantes e agravantes, prazos de defesa e recursos disciplinares.',
    normativeBase:
      'Lei Estadual nº 11.817/2000 e Decreto Estadual nº 22.114/2000 (ALEPE: https://legis.alepe.pe.gov.br/)',
    keyPoints: [
      'Classificação das Transgressões: Leve, Média e Grave, de acordo com o dano à disciplina ou à sociedade.',
      'Sanções Disciplinares: Advertência, Repreensão, Detenção, Prisão Disciplinar, Licenciamento a bem da disciplina e Exclusão a bem da disciplina.',
      'Circunstâncias Atenuantes: Bom comportamento anterior, confissão espontânea, relevância de serviços prestados e falta de prática do serviço.',
      'Prazos e Recursos: Reconsideração de ato e recurso inominado endereçado à autoridade superior com prazos estritos da Lei 11.817/2000.',
    ],
    ficaADica:
      '#FICAADICA (Pág. 02): A punição disciplinar militar de Prisão não pode ser aplicada sem o devido processo legal com ampla defesa prévia e contraditório, conforme o Art. 5º, LV da CF/88 e a Lei Estadual nº 11.817/2000 da ALEPE.',
    practicalExample:
      'Oficial encarregado de Procedimento Disciplinar Sumário concede prazo regulamentar para o militar indiciado apresentar sua defesa prévia com o rol de testemunhas.',
  },
  {
    id: 'cap-11',
    number: 'Módulo 11',
    title: 'Colegiados Disciplinares: Conselho de Disciplina (Dec. 3.639/1975) e Justificação (Lei 5.836/72)',
    pilar: 'Conselho de Disciplina e Conselho de Justificação',
    competencyPillar: 'Legislação PM & Regime Disciplinar',
    pages: 'Edital Bloco II · Itens 12 e 13 (Pág. 02)',
    summary:
      'Processos especiais colegiados para apuração de indignidade e incompatibilidade moral e funcional. Conselho de Disciplina (Decreto Estadual nº 3.639/1975 - ALEPE) voltado a praças estáveis da PMPE (Guardas, Cabos e Sargentos). Conselho de Justificação (Lei Federal nº 5.836/1972) destinado ao julgamento de Oficiais da Corporação.',
    normativeBase:
      'Decreto Estadual nº 3.639/1975 (ALEPE) · Lei Federal nº 5.836/1972',
    keyPoints: [
      'Conselho de Disciplina: Composto por 3 (três) Oficiais; prazo de 30 dias para conclusão (prorrogável por 20 dias); relatório conclusivo remetido ao Comandante Geral para decisão final.',
      'Hipóteses de submissão ao CD: Conduta que afete a honra pessoal e o pundonor militar; condenação criminal transitada em julgado; incapacidade moral.',
      'Conselho de Justificação: Nomeado pelo Governador do Estado; composto por 3 Oficiais de posto superior ao do justificante; decisão final apreciada pelo Tribunal de Justiça Militar ou TJPE.',
      'Garantias: Ampla defesa, contraditório pleno, presença de advogado ou defensor dativo obrigatória.',
    ],
    ficaADica:
      '#FICAADICA (Pág. 02): Atenção na prova do CFOA: Conselho de DISCIPLINA é para Praças com estabilidade; Conselho de JUSTIFICAÇÃO é privativo para Oficiais!',
    practicalExample:
      'Comandante Geral da PMPE acolhe o relatório do Conselho de Disciplina e decide pelo licenciamento a bem da disciplina de praça considerada incapaz de permanecer na ativa.',
  },
  {
    id: 'cap-12',
    number: 'Módulo 12',
    title: 'Direitos Humanos, Cidadania e Atuação Policial Democrática',
    pilar: 'DUDH, CEDAW e Convenção sobre Pessoas com Deficiência',
    competencyPillar: 'Administração & Conhecimentos Gerais',
    pages: 'Edital Bloco II · Item 3 (Pág. 02)',
    summary:
      'Fundamentos históricos e filosóficos dos Direitos Humanos. Declaração Universal dos Direitos Humanos de 1948 (DUDH). Convenção sobre a Eliminação de Todas as Formas de Discriminação contra a Mulher (CEDAW). Convenção Internacional sobre os Direitos das Pessoas com Deficiência. Aplicação dos Direitos Humanos no uso diferenciado da força policial.',
    normativeBase:
      'DUDH (1948) · Convenção de Nova York (Decreto nº 6.949/2009) · CEDAW',
    keyPoints: [
      'DUDH: Universalidade, indivisibilidade e inalienabilidade da dignidade da pessoa humana.',
      'CEDAW: Obrigações do Estado em coibir a violência de gênero e discriminações estruturais no ambiente público e militar.',
      'Convenção PcD: Acessibilidade, garantia de direitos e eliminação de barreiras comportamentais e físicas.',
      'Uso Diferenciado da Força: Princípios da legalidade, necessidade, proporcionalidade, moderação e conveniência.',
    ],
    ficaADica:
      '#FICAADICA (Pág. 02): Lembre-se de que a Convenção Internacional sobre os Direitos das Pessoas com Deficiência foi aprovada no Brasil pelo rito especial do Art. 5º, § 3º da CF/88, possuindo status de Emenda Constitucional!',
    practicalExample:
      'Em atendimento de ocorrência com pessoa em crise com deficiência psicossocial, a guarnição aplica técnicas de contenção verbal e mediação pacífica, respeitando os protocolos internacionais de direitos humanos.',
  },
];

export interface ChapterPageMapping {
  chapterId: string;
  number: string;
  title: string;
  pagesLabel: string;
  pilar: CompetencyPillar;
  ranges: Array<{ start: number; end: number }>;
  subjects: string[];
}

export const CHAPTER_PAGE_MAPPINGS: ChapterPageMapping[] = [
  {
    chapterId: 'cap-1',
    number: 'Módulo 01',
    title: 'Língua Portuguesa, Interpretação de Textos e Redação Oficial',
    pagesLabel: 'Bloco I · Pág. 01',
    pilar: 'Administração & Conhecimentos Gerais',
    ranges: [{ start: 1, end: 1 }],
    subjects: [
      'Interpretação e Compreensão de Textos',
      'Tipologia Textual e Ortografia Oficial',
      'Crase, Concordância e Regência',
      'Redação de Correspondências Oficiais (Padrão Ofício PMPE)',
    ],
  },
  {
    chapterId: 'cap-2',
    number: 'Módulo 02',
    title: 'Raciocínio Lógico, Argumentação e Métodos Quantitativos',
    pagesLabel: 'Bloco I · Pág. 01',
    pilar: 'Administração & Conhecimentos Gerais',
    ranges: [{ start: 1, end: 1 }],
    subjects: [
      'Estruturas Lógicas e Proposições',
      'Lógica de Argumentação e Deduções',
      'Diagramas Lógicos de Conjuntos',
      'Princípios de Contagem e Probabilidade',
    ],
  },
  {
    chapterId: 'cap-3',
    number: 'Módulo 03',
    title: 'Noções de Administração Geral, Organizações e Processo Decisório',
    pagesLabel: 'Bloco I · Pág. 01',
    pilar: 'Administração & Conhecimentos Gerais',
    ranges: [{ start: 1, end: 1 }],
    subjects: [
      'Teorias Clássicas da Administração e Burocracia',
      'Estruturas Organizacionais: Linha e Assessoria',
      'Direção e Princípios de Gestão',
      'Processo Decisório e Controle Organizacional',
    ],
  },
  {
    chapterId: 'cap-4',
    number: 'Módulo 04',
    title: 'Direito Penal Militar: Princípios, Excludentes e Crimes em Espécie',
    pagesLabel: 'Bloco II · Pág. 01',
    pilar: 'Direito Penal & Processual Militar',
    ranges: [{ start: 1, end: 1 }],
    subjects: [
      'Aplicação da Lei Penal Militar e Princípio da Legalidade',
      'Crimes Militares em Tempo de Paz (Art. 9º CPM)',
      'Excludentes de Crime e Obediência Hierárquica',
      'Crimes Contra a Autoridade, Disciplina e Serviço Militar',
    ],
  },
  {
    chapterId: 'cap-5',
    number: 'Módulo 05',
    title: 'Crimes Militares por Extensão e Legislação Especial Extravagante',
    pagesLabel: 'Bloco II · Pág. 01',
    pilar: 'Direito Penal & Processual Militar',
    ranges: [{ start: 1, end: 1 }],
    subjects: [
      'Crimes Militares por Extensão (Lei 13.491/2017)',
      'Lei de Abuso de Autoridade (Lei nº 13.869/2019)',
      'Crimes de Preconceito de Raça e Cor (Lei nº 7.716/1989)',
      'Crimes em Licitações e Contratos (Arts. 337-E a 337-P do CP)',
    ],
  },
  {
    chapterId: 'cap-6',
    number: 'Módulo 06',
    title: 'Direito Processual Penal Militar: PJM, IPM, APFD e Prisões',
    pagesLabel: 'Bloco II · Págs. 01 e 02',
    pilar: 'Direito Penal & Processual Militar',
    ranges: [{ start: 1, end: 2 }],
    subjects: [
      'Polícia Judiciária Militar e Competências',
      'Inquérito Policial Militar (IPM): Prazos e Rito',
      'Auto de Prisão em Flagrante Delito (APFD)',
      'Prisão Preventiva, Provisória e Deserção',
    ],
  },
  {
    chapterId: 'cap-7',
    number: 'Módulo 07',
    title: 'Direito Constitucional: Direitos Fundamentais, Militares e Segurança Pública',
    pagesLabel: 'Bloco II · Pág. 02',
    pilar: 'Direito Constitucional & Administrativo',
    ranges: [{ start: 2, end: 2 }],
    subjects: [
      'Direitos e Garantias Fundamentais (Art. 5º da CF/88)',
      'Administração Pública Militar (Art. 37 da CF/88)',
      'Militares dos Estados e Vedações (Arts. 42 e 142 da CF/88)',
      'Segurança Pública e Missão da PMPE (Art. 144 da CF/88)',
    ],
  },
  {
    chapterId: 'cap-8',
    number: 'Módulo 08',
    title: 'Direito Administrativo, Poderes, Atos e Licitações (Lei 14.133/2021)',
    pagesLabel: 'Bloco II · Pág. 02',
    pilar: 'Direito Constitucional & Administrativo',
    ranges: [{ start: 2, end: 2 }],
    subjects: [
      'Princípios e Poderes da Administração Pública',
      'Atos Administrativos: Requisitos e Atributos',
      'Responsabilidade Civil do Estado',
      'Nova Lei de Licitações (Lei nº 14.133/2021) e SRP',
    ],
  },
  {
    chapterId: 'cap-9',
    number: 'Módulo 09',
    title: 'Estatuto dos Policiais Militares de PE (Lei Estadual nº 6.783/1974 - ALEPE)',
    pagesLabel: 'Bloco II · Pág. 02 (ALEPE)',
    pilar: 'Legislação PM & Regime Disciplinar',
    ranges: [{ start: 2, end: 2 }],
    subjects: [
      'Hierarquia, Disciplina e Círculos Hierárquicos PMPE',
      'Agregação, Reversão e Excedente',
      'Licenças e Afastamentos Regulamentares',
      'Exclusão do Serviço Ativo e Reserva Remunerada',
    ],
  },
  {
    chapterId: 'cap-10',
    number: 'Módulo 10',
    title: 'Código Disciplinar (Lei 11.817/2000) e Regulamento de Ética (Decreto 22.114/2000)',
    pagesLabel: 'Bloco II · Pág. 02 (ALEPE)',
    pilar: 'Legislação PM & Regime Disciplinar',
    ranges: [{ start: 2, end: 2 }],
    subjects: [
      'Deontologia Policial Militar e Valores Institucionais',
      'Classificação das Transgressões Disciplinares',
      'Sanções Disciplinares e Processo Sumário',
      'Atenuantes, Agravantes e Recursos Disciplinares',
    ],
  },
  {
    chapterId: 'cap-11',
    number: 'Módulo 11',
    title: 'Colegiados Disciplinares: Conselho de Disciplina (Dec. 3.639/1975) e Justificação (Lei 5.836/72)',
    pagesLabel: 'Bloco II · Pág. 02 (ALEPE)',
    pilar: 'Legislação PM & Regime Disciplinar',
    ranges: [{ start: 2, end: 2 }],
    subjects: [
      'Conselho de Disciplina para Praças Estáveis (Dec. 3.639/1975)',
      'Conselho de Justificação para Oficiais (Lei 5.836/1972)',
      'Composição dos Colegiados e Prazos de Instrução',
      'Competência do Comandante Geral e do Tribunal competente',
    ],
  },
  {
    chapterId: 'cap-12',
    number: 'Módulo 12',
    title: 'Direitos Humanos, Cidadania e Atuação Policial Democrática',
    pagesLabel: 'Bloco II · Pág. 02',
    pilar: 'Administração & Conhecimentos Gerais',
    ranges: [{ start: 2, end: 2 }],
    subjects: [
      'Declaração Universal dos Direitos Humanos (1948)',
      'Convenção sobre Discriminação contra a Mulher (CEDAW)',
      'Convenção Internacional sobre Pessoas com Deficiência (PcD)',
      'Uso Diferenciado da Força e Legislação Protetiva no Brasil',
    ],
  },
];

export const QUICK_PAGE_INTERVALS = [
  {
    label: 'Bloco I Completo: Português, Raciocínio Lógico e Administração (Pág. 01)',
    start: 1,
    end: 1,
  },
  {
    label: 'Bloco II: Direito Penal Militar e Processual Militar (Págs. 01 e 02)',
    start: 1,
    end: 2,
  },
  {
    label: 'Bloco II: Direito Constitucional, Administrativo e Licitações (Pág. 02)',
    start: 2,
    end: 2,
  },
  {
    label: 'Bloco II: Legislação PMPE no Portal ALEPE (Estatuto, Código e Conselhos)',
    start: 2,
    end: 2,
  },
  {
    label: 'Programa Integral CFOA PMPE (Blocos I e II — Todos os 12 Módulos)',
    start: 1,
    end: 2,
  },
];

export const OFFICIAL_APOSTILA_SUBJECTS: Array<{
  id: string;
  label: string;
  chapterIds: string[];
  pages: string;
  keywords: string[];
}> = [
  {
    id: 'subj-legislacao-alepe-estatuto',
    label: 'Estatuto dos Policiais Militares de PE (Lei Estadual nº 6.783/1974 - ALEPE)',
    chapterIds: ['cap-9'],
    pages: 'Edital Bloco II (ALEPE)',
    keywords: [
      'estatuto',
      '6.783',
      '6783',
      'alepe',
      'agregação',
      'reversão',
      'excedente',
      'hierarquia',
      'disciplina',
      'postos',
      'graduações',
    ],
  },
  {
    id: 'subj-codigo-disciplinar-alepe',
    label: 'Código Disciplinar dos Militares de PE (Lei Estadual nº 11.817/2000 - ALEPE)',
    chapterIds: ['cap-10'],
    pages: 'Edital Bloco II (ALEPE)',
    keywords: [
      'código disciplinar',
      '11.817',
      '11817',
      'transgressão',
      'advertência',
      'detenção',
      'prisão',
      'repreensão',
      'atenuantes',
      'ética',
      '22.114',
    ],
  },
  {
    id: 'subj-conselhos-disciplina-justificacao',
    label: 'Conselho de Disciplina (Dec. 3.639/1975) e Conselho de Justificação (Lei 5.836/72)',
    chapterIds: ['cap-11'],
    pages: 'Edital Bloco II (ALEPE)',
    keywords: [
      'conselho de disciplina',
      'conselho de justificação',
      '3.639',
      '3639',
      '5.836',
      '5836',
      'praças estáveis',
      'oficiais',
      'colegiado',
    ],
  },
  {
    id: 'subj-penal-militar-cpm',
    label: 'Direito Penal Militar: Art. 9º CPM, Excludentes e Crimes em Espécie',
    chapterIds: ['cap-4'],
    pages: 'Edital Bloco II (CPM)',
    keywords: [
      'penal militar',
      'cpm',
      'artigo 9',
      'obediência hierárquica',
      'excludente',
      'insubordinação',
      'abandono de posto',
      'deserção',
    ],
  },
  {
    id: 'subj-processo-penal-militar-ipm',
    label: 'Processo Penal Militar: PJM, IPM, APFD e Prisões',
    chapterIds: ['cap-6'],
    pages: 'Edital Bloco II (CPPM)',
    keywords: [
      'processo penal militar',
      'cppm',
      'ipm',
      'pjm',
      'apfd',
      'flagrante',
      'preventiva',
      'prazos ipm',
      'acareação',
    ],
  },
  {
    id: 'subj-crimes-extensao-abuso',
    label: 'Crimes Militares por Extensão e Abuso de Autoridade (Lei 13.869/19)',
    chapterIds: ['cap-5'],
    pages: 'Edital Bloco II',
    keywords: [
      'extensão',
      '13.491',
      'abuso de autoridade',
      '13.869',
      'crimes raciais',
      '7.716',
      'crimes licitatórios',
    ],
  },
  {
    id: 'subj-constitucional-militares',
    label: 'Direito Constitucional: Direitos Fundamentais, Militares Estaduais e Segurança Pública',
    chapterIds: ['cap-7'],
    pages: 'Edital Bloco II (CF/88)',
    keywords: [
      'constitucional',
      'artigo 5',
      'artigo 42',
      'artigo 142',
      'artigo 144',
      'segurança pública',
      'greve',
      'sindicalização',
    ],
  },
  {
    id: 'subj-administrativo-licitacoes',
    label: 'Direito Administrativo, Poderes, Atos e Licitações (Lei 14.133/2021)',
    chapterIds: ['cap-8'],
    pages: 'Edital Bloco II (Lei 14.133)',
    keywords: [
      'administrativo',
      'atos',
      'poderes',
      'licitações',
      '14.133',
      'pregão',
      'segregação de funções',
      'srp',
    ],
  },
  {
    id: 'subj-administracao-linha-staff',
    label: 'Noções de Administração: Teorias, Linha/Assessoria e Processo Decisório',
    chapterIds: ['cap-3'],
    pages: 'Edital Bloco I (TGA)',
    keywords: [
      'administração',
      'teorias clássicas',
      'taylor',
      'weber',
      'linha e assessoria',
      'staff',
      'processo decisório',
      'controle',
    ],
  },
  {
    id: 'subj-portugues-redacao-oficial',
    label: 'Língua Portuguesa, Interpretação e Redação Oficial (Padrão Ofício PMPE)',
    chapterIds: ['cap-1'],
    pages: 'Edital Bloco I (Português)',
    keywords: [
      'português',
      'redação oficial',
      'padrão ofício',
      'pronome de tratamento',
      'vossa excelência',
      'crase',
      'concordância',
    ],
  },
  {
    id: 'subj-raciocinio-logico',
    label: 'Raciocínio Lógico, Argumentação, Deduções e Probabilidade',
    chapterIds: ['cap-2'],
    pages: 'Edital Bloco I (Lógica)',
    keywords: [
      'raciocínio lógico',
      'argumentação',
      'dedução',
      'diagramas lógicos',
      'probabilidade',
      'contagem',
    ],
  },
  {
    id: 'subj-direitos-humanos',
    label: 'Direitos Humanos: DUDH, Discriminação contra a Mulher e Pessoas com Deficiência',
    chapterIds: ['cap-12'],
    pages: 'Edital Bloco II (DH)',
    keywords: [
      'direitos humanos',
      'dudh',
      'cedaw',
      'mulher',
      'pcd',
      'deficiência',
      'cidadania',
    ],
  },
];

export function getChaptersByPageInterval(start: number, end: number): ApostilaChapterItem[] {
  const minP = Math.min(start, end);
  const maxP = Math.max(start, end);
  const matchedIds = new Set<string>();

  CHAPTER_PAGE_MAPPINGS.forEach((mapping) => {
    const hitsRange = mapping.ranges.some((r) => r.start <= maxP && r.end >= minP);
    if (hitsRange) {
      matchedIds.add(mapping.chapterId);
    }
  });

  return APOSTILA_CHAPTERS_DATA.filter((ch) => matchedIds.has(ch.id));
}

export function getChaptersBySubjectQuery(query: string): ApostilaChapterItem[] {
  if (!query || !query.trim()) return APOSTILA_CHAPTERS_DATA;
  const q = query.trim().toLowerCase();

  const matchedSubject = OFFICIAL_APOSTILA_SUBJECTS.find(
    (s) =>
      s.id === q ||
      s.label.toLowerCase().includes(q) ||
      s.keywords.some((k) => q.includes(k) || k.includes(q))
  );

  if (matchedSubject) {
    return APOSTILA_CHAPTERS_DATA.filter((ch) => matchedSubject.chapterIds.includes(ch.id));
  }

  const directMatch = APOSTILA_CHAPTERS_DATA.filter(
    (ch) =>
      ch.title.toLowerCase().includes(q) ||
      ch.pilar.toLowerCase().includes(q) ||
      ch.summary.toLowerCase().includes(q) ||
      ch.keyPoints.some((kp) => kp.toLowerCase().includes(q))
  );

  return directMatch.length > 0 ? directMatch : APOSTILA_CHAPTERS_DATA;
}

export function formatChaptersIntoMaterial(chapters: ApostilaChapterItem[], _scopeLabel?: string): string {
  if (!chapters || chapters.length === 0) return '';
  return chapters
    .map(
      (c) =>
        `[${c.number.toUpperCase()} — ${c.title.toUpperCase()}]
Eixo / Disciplina: ${c.competencyPillar} (${c.pilar})
Referência no Edital: ${c.pages}
Base Normativa Oficial (ALEPE / Legislação): ${c.normativeBase}
Link de Consulta Oficial: ${ALEPE_PORTAL_URL}

SÍNTESE DOUTRINÁRIA E PROCEDIMENTAL:
${c.summary}

PONTOS-CHAVE OBRIGATÓRIOS DO CFOA:
${c.keyPoints.map((kp, i) => `${i + 1}. ${kp}`).join('\n')}

DIRETRIZ ESTRATÉGICA (#FICAADICA):
${c.ficaADica}

APLICAÇÃO PRÁTICA NA ROTINA DO OFICIAL DE ADMINISTRAÇÃO (QOA):
${c.practicalExample}`
    )
    .join('\n\n========================================\n\n');
}

export interface ProgramSelectionParameters {
  pillar: 'ALL' | CompetencyPillar;
  chapterId: 'ALL' | string;
  studiedTheme: string;
  complexity: 'ALL' | 'Básica / Conceitual' | 'Intermediária / Aplicação' | 'Avançada / Análise';
  questionCount: 5 | 8 | 10;
  randomize?: boolean;
}

function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function shuffleQuestionOptions(q: DiagnosticQuestion): DiagnosticQuestion {
  const correctText = q.options[q.correctIndex];
  const shuffledOptions = shuffleArray(q.options);
  const nextCorrectIdx = shuffledOptions.indexOf(correctText);
  return {
    ...q,
    options: shuffledOptions,
    correctIndex: nextCorrectIdx >= 0 ? nextCorrectIdx : 0,
  };
}

export function elaborateQuestionsByProgramParameters(
  params: ProgramSelectionParameters
): {
  questions: DiagnosticQuestion[];
  scopeTitle: string;
  scopeSubtitle: string;
  subjectAreaLabel: string;
  matchedChapters: ApostilaChapterItem[];
} {
  const {
    pillar = 'ALL',
    chapterId = 'ALL',
    studiedTheme = 'ALL',
    complexity = 'ALL',
    questionCount = 10,
    randomize = false,
  } = params;

  let matchedChapters = [...APOSTILA_CHAPTERS_DATA];

  if (chapterId !== 'ALL') {
    const byChapter = matchedChapters.filter((ch) => ch.id === chapterId);
    if (byChapter.length > 0) {
      matchedChapters = byChapter;
    }
  } else if (pillar !== 'ALL') {
    const byPillar = matchedChapters.filter((ch) => ch.competencyPillar === pillar);
    if (byPillar.length > 0) {
      matchedChapters = byPillar;
    }
  }

  const cleanTheme =
    studiedTheme && studiedTheme !== 'ALL' ? studiedTheme.trim() : '';

  if (cleanTheme && chapterId === 'ALL') {
    const byTheme = getChaptersBySubjectQuery(cleanTheme);
    if (byTheme.length > 0) {
      matchedChapters =
        pillar !== 'ALL'
          ? byTheme.filter((c) => c.competencyPillar === pillar).length > 0
            ? byTheme.filter((c) => c.competencyPillar === pillar)
            : byTheme
          : byTheme;
    }
  }

  if (matchedChapters.length === 0) {
    matchedChapters = [...APOSTILA_CHAPTERS_DATA];
  }

  // Filtra primeiro questões reais do banco que correspondam aos módulos selecionados
  const matchedChapterIds = new Set(matchedChapters.map((c) => c.id));
  const themeLower = cleanTheme.toLowerCase();

  const bankCandidates = APOSTILA_QUESTION_BANK.filter((q) => {
    const inChapter = matchedChapterIds.has(q.chapterId);
    if (!inChapter) return false;
    if (complexity !== 'ALL' && q.complexity !== complexity) {
      return false;
    }
    if (cleanTheme) {
      const hitsTheme =
        q.topic.toLowerCase().includes(themeLower) ||
        q.stem.toLowerCase().includes(themeLower) ||
        q.explanation.toLowerCase().includes(themeLower) ||
        q.keywords.some((k) => themeLower.includes(k) || k.includes(themeLower));
      if (hitsTheme) return true;
    }
    return true;
  });

  // Ordena priorizando questões que batem com o tema estudado e a complexidade
  const sortedBank = [...bankCandidates].sort((a, b) => {
    const aThemeScore =
      cleanTheme &&
      (a.topic.toLowerCase().includes(themeLower) ||
        a.stem.toLowerCase().includes(themeLower))
        ? 2
        : 0;
    const bThemeScore =
      cleanTheme &&
      (b.topic.toLowerCase().includes(themeLower) ||
        b.stem.toLowerCase().includes(themeLower))
        ? 2
        : 0;
    const aCompScore = complexity !== 'ALL' && a.complexity === complexity ? 1 : 0;
    const bCompScore = complexity !== 'ALL' && b.complexity === complexity ? 1 : 0;
    return bThemeScore + bCompScore - (aThemeScore + aCompScore);
  });

  const questionTemplates = [
    (ch: ApostilaChapterItem, focusTheme: string, kp: string) => ({
      stem: `No âmbito da preparação para o CFOA PMPE, acerca do tema "${focusTheme}" (${ch.number} — ${ch.title}, fundamentado em: ${ch.normativeBase}), analise as proposições abaixo e assinale a diretriz técnica CORRETA:`,
      correct: kp,
      wrongs: [
        `No tema "${focusTheme}", a autoridade administrativa pode dispensar os requisitos formais previstos na legislação estadual mediante simples despacho verbal não publicado.`,
        `Segundo o acervo da ALEPE, as normas relativas a "${focusTheme}" aplicam-se exclusivamente a servidores civis, sendo inaplicáveis aos militares estaduais da ativa.`,
        `A inobservância das regras sobre "${focusTheme}" constitui mera irregularidade sem repercussão disciplinar ou administrativa no âmbito da PMPE.`,
      ],
    }),
    (ch: ApostilaChapterItem, focusTheme: string, kp: string) => ({
      stem: `[Situação Prática QOA — ${focusTheme}] Considere o seguinte caso prático da rotina do Oficial de Administração: "${ch.practicalExample}". À luz do ${ch.number} (${ch.normativeBase}), assinale a alternativa CORRETA:`,
      correct: kp,
      wrongs: [
        `O Oficial de Administração deve abster-se de fundamentar seus atos na legislação estadual quando atuar em funções de assessoria ou gestão interna.`,
        `Em situações práticas envolvendo "${focusTheme}", prevalece a costumeira praxe informal da unidade mesmo quando contrária ao texto expresso da lei na ALEPE.`,
        `A competência para decidir e instruir procedimentos sobre "${focusTheme}" é privativa de órgãos externos ao Poder Executivo Estadual.`,
      ],
    }),
    (ch: ApostilaChapterItem, focusTheme: string, kp: string) => ({
      stem: `[Atenção às Pegadinhas de Banca — ${focusTheme}] As bancas IAUPE/UPENET e AOCP exigem domínio rigoroso sobre ${ch.title} (${ch.pages}). Considerando a diretriz "${ch.ficaADica.replace(/^#FICAADICA[^:]*:\s*/i, '')}", qual alternativa está em perfeita conformidade com o programa oficial do CFOA PMPE?`,
      correct: kp,
      wrongs: [
        `A legislação vigente faculta ao militar ignorar prazos e formalidades regimentais sempre que alegar desconhecimento da norma publicada no portal ALEPE.`,
        `No regime jurídico avaliado em "${focusTheme}", todas as decisões administrativas prescindem de motivação, contraditório ou ampla defesa.`,
        `Os preceitos do ${ch.number} foram integralmente revogados, não possuindo aplicação atual na Polícia Militar de Pernambuco.`,
      ],
    }),
  ];

  const resultQuestions: DiagnosticQuestion[] = [];
  let nextId = 1;

  if (randomize) {
    // Gera um pool amplo combinando questões reais do banco e questões sintetizadas de todos os módulos selecionados, e embaralha
    const candidatePool: DiagnosticQuestion[] = [];

    if (!(cleanTheme && matchedChapters.length === 1)) {
      for (const bq of sortedBank) {
        candidatePool.push(
          shuffleQuestionOptions({
            ...bq,
            id: nextId++,
            complexity: complexity !== 'ALL' ? complexity : bq.complexity,
          })
        );
      }
    }

    const totalSynthToGenerate = Math.max(questionCount * 2, matchedChapters.length * 2);
    for (let sIdx = 0; sIdx < totalSynthToGenerate; sIdx++) {
      const ch = matchedChapters[sIdx % matchedChapters.length];
      const mapping = CHAPTER_PAGE_MAPPINGS.find((m) => m.chapterId === ch.id);
      const themeLabel =
        cleanTheme ||
        mapping?.subjects?.[sIdx % (mapping?.subjects?.length || 1)] ||
        ch.pilar;
      const kp = ch.keyPoints[sIdx % ch.keyPoints.length];
      const tpl = questionTemplates[sIdx % questionTemplates.length](
        ch,
        themeLabel,
        kp
      );

      const targetCorrectIdx = (sIdx + 1) % 4;
      const opts: string[] = [];
      let wrongPtr = 0;
      for (let o = 0; o < 4; o++) {
        if (o === targetCorrectIdx) {
          opts.push(tpl.correct);
        } else {
          opts.push(tpl.wrongs[wrongPtr++]);
        }
      }

      const resolvedComplexity: DiagnosticQuestion['complexity'] =
        complexity !== 'ALL'
          ? complexity
          : sIdx % 3 === 0
          ? 'Básica / Conceitual'
          : sIdx % 3 === 1
          ? 'Intermediária / Aplicação'
          : 'Avançada / Análise';

      candidatePool.push(
        shuffleQuestionOptions({
          id: nextId++,
          topic: `${ch.number} · ${themeLabel}`,
          pillar: ch.competencyPillar,
          complexity: resolvedComplexity,
          points: 10,
          pageRef: `${ch.pages} · ${ch.normativeBase}`,
          pdfPageNumber: ch.pages.includes('02') ? 2 : 1,
          apostilaExcerpt: `Tema Estudado: ${themeLabel} (${ch.number} — ${ch.title}). Base Legal: ${ch.normativeBase}. Ponto-Chave: "${kp}". ${ch.ficaADica}`,
          stem: tpl.stem,
          options: opts,
          correctIndex: targetCorrectIdx,
          explanation: `Gabarito Oficial (${ch.number} — Tema: ${themeLabel}): "${kp}". Fundamentação normativa: ${ch.normativeBase} (${ch.pages}). Consulte o texto legal atualizado em ${ALEPE_PORTAL_URL}.`,
        })
      );
    }

    const shuffledPool = shuffleArray(candidatePool);
    for (const sq of shuffledPool) {
      if (resultQuestions.length >= questionCount) break;
      resultQuestions.push(sq);
    }
  } else {
    // Se não houver filtro de tema específico ou se as questões do banco cobrirem o tema, inclui primeiro as do banco
    for (const bq of sortedBank) {
      if (resultQuestions.length >= questionCount) break;
      if (cleanTheme && matchedChapters.length === 1) {
        // Se o aluno escolheu um subtema específico dentro de 1 módulo, vamos personalizar o foco no tema estudado
        break;
      }
      resultQuestions.push({
        ...bq,
        id: nextId++,
        complexity:
          complexity !== 'ALL' ? complexity : bq.complexity,
      });
    }

    let synthIdx = 0;
    while (resultQuestions.length < questionCount) {
      const ch = matchedChapters[synthIdx % matchedChapters.length];
      const mapping = CHAPTER_PAGE_MAPPINGS.find((m) => m.chapterId === ch.id);
      const themeLabel =
        cleanTheme ||
        mapping?.subjects?.[synthIdx % (mapping?.subjects?.length || 1)] ||
        ch.pilar;
      const kp = ch.keyPoints[synthIdx % ch.keyPoints.length];
      const tpl = questionTemplates[synthIdx % questionTemplates.length](
        ch,
        themeLabel,
        kp
      );

      // Rotaciona deterministicamente a alternativa correta entre A (0), B (1), C (2) e D (3)
      const targetCorrectIdx = (synthIdx + 1) % 4;
      const opts: string[] = [];
      let wrongPtr = 0;
      for (let o = 0; o < 4; o++) {
        if (o === targetCorrectIdx) {
          opts.push(tpl.correct);
        } else {
          opts.push(tpl.wrongs[wrongPtr++]);
        }
      }

      const resolvedComplexity: DiagnosticQuestion['complexity'] =
        complexity !== 'ALL'
          ? complexity
          : synthIdx % 3 === 0
          ? 'Básica / Conceitual'
          : synthIdx % 3 === 1
          ? 'Intermediária / Aplicação'
          : 'Avançada / Análise';

      resultQuestions.push({
        id: nextId++,
        topic: `${ch.number} · ${themeLabel}`,
        pillar: ch.competencyPillar,
        complexity: resolvedComplexity,
        points: 10,
        pageRef: `${ch.pages} · ${ch.normativeBase}`,
        pdfPageNumber: ch.pages.includes('02') ? 2 : 1,
        apostilaExcerpt: `Tema Estudado: ${themeLabel} (${ch.number} — ${ch.title}). Base Legal: ${ch.normativeBase}. Ponto-Chave: "${kp}". ${ch.ficaADica}`,
        stem: tpl.stem,
        options: opts,
        correctIndex: targetCorrectIdx,
        explanation: `Gabarito Oficial (${ch.number} — Tema: ${themeLabel}): "${kp}". Fundamentação normativa: ${ch.normativeBase} (${ch.pages}). Consulte o texto legal atualizado em ${ALEPE_PORTAL_URL}.`,
      });

      synthIdx++;
    }
  }

  const basePts = Math.floor(100 / questionCount);
  const remainder = 100 - basePts * questionCount;
  const calibrated = resultQuestions.slice(0, questionCount).map((q, idx) => ({
    ...q,
    id: idx + 1,
    points: basePts + (idx < remainder ? 1 : 0),
  }));

  const isBasicQuickReview = complexity === 'Básica / Conceitual';
  const quickReviewPrefix = isBasicQuickReview ? '[Modo Revisão Rápida · Básica] ' : '';

  const scopeTitle = cleanTheme
    ? `${quickReviewPrefix}Missão Direcionada CFOA — Tema: ${cleanTheme}`
    : chapterId !== 'ALL' && matchedChapters.length === 1
    ? `${quickReviewPrefix}Missão CFOA — ${matchedChapters[0].number}: ${matchedChapters[0].title}`
    : pillar !== 'ALL'
    ? `${quickReviewPrefix}Missão CFOA — Eixo: ${pillar}`
    : isBasicQuickReview
    ? 'Modo Revisão Rápida CFOA PMPE — Ciclo Focado (Complexidade Básica)'
    : randomize
    ? 'Missão Oficial CFOA PMPE — Questões Aleatórias do Programa'
    : 'Simulado Diagnóstico Oficial — Seleção Interna CFOA PMPE';

  const scopeSubtitle = isBasicQuickReview
    ? `Ciclo de estudos focado com questões exclusivamente de complexidade 'Básica / Conceitual' selecionadas automaticamente no Gerador Tático para consolidação de base antes de missões complexas.`
    : cleanTheme
    ? `Questões elaboradas com base no Programa Oficial do CFOA PMPE focadas especificamente no tema estudado: "${cleanTheme}" (${matchedChapters.map((c) => c.number).join(', ')}).`
    : chapterId !== 'ALL' && matchedChapters.length === 1
    ? `${matchedChapters[0].summary}`
    : pillar !== 'ALL'
    ? `Avaliação direcionada ao eixo "${pillar}" do Conteúdo Programático Oficial do CFOA PMPE e Legislação Estadual (ALEPE).`
    : 'Avaliação diagnóstica completa para o Curso de Formação de Oficiais da Administração (CFOA PMPE) baseada estritamente no Conteúdo Programático Oficial e na Legislação de Pernambuco (ALEPE).';

  const subjectAreaLabel = cleanTheme
    ? `CFOA PMPE · Tema: ${cleanTheme}${isBasicQuickReview ? ' (Revisão Rápida · Básica)' : ''}`
    : chapterId !== 'ALL' && matchedChapters.length === 1
    ? `CFOA PMPE · ${matchedChapters[0].number} (${isBasicQuickReview ? 'Revisão Rápida · Básica' : matchedChapters[0].pilar})`
    : pillar !== 'ALL'
    ? `CFOA PMPE · ${pillar}${isBasicQuickReview ? ' (Revisão Rápida · Básica)' : ''}`
    : isBasicQuickReview
    ? 'CFOA PMPE · Modo Revisão Rápida (Complexidade Básica)'
    : randomize
    ? 'CFOA PMPE · Questões Aleatórias (Programa Completo)'
    : 'CFOA PMPE · Programa Completo (Blocos I e II)';

  return {
    questions: calibrated,
    scopeTitle,
    scopeSubtitle,
    subjectAreaLabel,
    matchedChapters,
  };
}

export function selectFallbackQuestionsForScope(params: {
  mode: GeneratorScopeMode;
  chapterIds?: string[];
  startPage?: number;
  endPage?: number;
  subjectQuery?: string;
  questionCount: number;
  complexity?: ProgramSelectionParameters['complexity'];
}): DiagnosticQuestion[] {
  const {
    mode,
    chapterIds = [],
    startPage = 1,
    endPage = 2,
    subjectQuery = '',
    questionCount,
    complexity = 'ALL',
  } = params;
  let targetChapters = APOSTILA_CHAPTERS_DATA;

  if (mode === 'chapter' && chapterIds.length > 0) {
    targetChapters = APOSTILA_CHAPTERS_DATA.filter((c) => chapterIds.includes(c.id));
  } else if (mode === 'pages') {
    targetChapters = getChaptersByPageInterval(startPage, endPage);
  } else if (mode === 'subject' && subjectQuery.trim()) {
    targetChapters = getChaptersBySubjectQuery(subjectQuery);
  }

  if (targetChapters.length === 0) {
    targetChapters = APOSTILA_CHAPTERS_DATA;
  }

  const count = (questionCount === 5 || questionCount === 8 || questionCount === 10
    ? questionCount
    : 10) as 5 | 8 | 10;

  return elaborateQuestionsByProgramParameters({
    pillar: 'ALL',
    chapterId: targetChapters.length === 1 ? targetChapters[0].id : 'ALL',
    studiedTheme: mode === 'subject' && subjectQuery.trim() ? subjectQuery.trim() : 'ALL',
    complexity: complexity || 'ALL',
    questionCount: count,
  }).questions;
}
