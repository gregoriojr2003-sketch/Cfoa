import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  BookOpen,
  Download,
  Search,
  CheckCircle2,
  Sparkles,
  FileText,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Eye,
  Smartphone,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Hash,
  X
} from 'lucide-react';
import type { ApostilaIndexEntry } from './ApostilaSearchIndexModal';

import {
  APOSTILA_CHAPTERS_DATA,
  CFOA_PRIMARY_LEGISLATION,
  ALEPE_PORTAL_URL,
} from '../data/apostilaChapterBank';

export const OFFICIAL_APOSTILA_PDF_URL =
  '/assets/aistudio/CFOA_SELECAO_INTERNA_-_programa_ca963974.pdf';

export interface ApostilaChapter {
  id: string;
  number: string;
  title: string;
  pilar: string;
  pages: string;
  summary: string;
  normativeBase: string;
  keyPoints: string[];
  ficaADica: string;
  practicalExample: string;
}

export const APOSTILA_CHAPTERS: ApostilaChapter[] = [
  {
    id: 'cap-1',
    number: 'Módulo 01',
    title: 'Visão Geral do SEI-PE, Acesso gov.br e Duplo Fator (2FA)',
    pilar: 'Acesso, Segurança e Credenciamento',
    pages: 'Págs. 07 a 10',
    summary:
      'O Sistema Eletrônico de Informações (SEI), desenvolvido pelo TRF4 e cedido gratuitamente ao Governo de Pernambuco, é o sistema oficial de gestão de processos e documentos arquivísticos digitais na Administração Pública Estadual.',
    normativeBase: 'Decreto Estadual nº 45.157/2017 · Portaria SAD nº 123/2020',
    keyPoints: [
      'Acesso via navegador web (Google Chrome, Mozilla Firefox ou Microsoft Edge atualizados) pelo endereço oficial do SEI-PE.',
      'Integração com o Login Único gov.br e obrigatoriedade de configuração do Duplo Fator de Autenticação (2FA) via aplicativo autenticador para proteção da conta funcional.',
      'Credenciais de acesso e assinatura eletrônica são de uso estritamente pessoal e intransferível do militar/servidor.',
      'O compartilhamento de senha ou assinatura configura infração administrativa e de segurança da informação.'
    ],
    ficaADica:
      '#FICAADICA (Pág. 10): Caso troque de aparelho celular ou perca o acesso ao aplicativo autenticador (2FA), solicite imediatamente a redefinição ao ponto focal/NSI da sua Unidade ou suporte técnico antes de bloquear tentativas.',
    practicalExample:
      'Ao acessar o SEI pelo celular ou computador da OME, o militar insere seu CPF/senha e valida o código temporário de 6 dígitos gerado no aplicativo autenticador.'
  },
  {
    id: 'cap-2',
    number: 'Módulo 02',
    title: 'Gestão de Perfis, Lotação e Atuação do SIP / NSI',
    pilar: 'Gestão de Unidades e Perfis',
    pages: 'Págs. 10 a 12',
    summary:
      'O Sistema de Permissões (SIP) controla quais usuários possuem acesso a quais unidades (OMEs, Diretorias, Seções) e quais perfis de atuação detêm dentro do SEI.',
    normativeBase: 'Portaria SAD nº 123/2020 · Diretrizes DTEC/DEIP PMPE',
    keyPoints: [
      'Perfil Básico: Perfil padrão de operação completa para instrução processual (iniciar processos, elaborar, editar, assinar documentos, tramitar e gerenciar blocos).',
      'Toda movimentação de pessoal (transferência de Batalhão/Diretoria ou designação para nova função) exige atualização da permissão no SIP pelo Núcleo de Tecnologia/Segurança (NSI/ Ponto Focal).',
      'O seletor de Unidade no topo direito da tela do SEI permite alternar rapidamente entre unidades quando o militar é habilitado em mais de uma seção (ex.: P1 e Comando).'
    ],
    ficaADica:
      '#FICAADICA (Pág. 11): Se você foi movimentado de OME e a nova unidade não aparece na barra superior do SEI, não crie cadastro duplicado: acione o administrador local (SIP) para vincular seu login à nova sigla.',
    practicalExample:
      'Um Sargento transferido para a DEIP solicita habilitação no SIP na unidade PMPE-DEIP-DTSEI com Perfil Básico.'
  },
  {
    id: 'cap-3',
    number: 'Módulo 03',
    title: 'Tela Controle de Processos, Ícones de Alerta e Marcadores',
    pilar: 'Roteamento, Controle e Tramitação',
    pages: 'Págs. 12 a 19 e 53 a 55',
    summary:
      'A tela "Controle de Processos" é a mesa de trabalho virtual da unidade, dividida em duas colunas: processos "Recebidos" (à esquerda) e processos "Gerados" pela unidade (à direita).',
    normativeBase: 'Guia Prático do Usuário SEI — 4ª Edição (Págs. 12–19)',
    keyPoints: [
      'Número do processo em VERMELHO: Indica que o processo foi recebido na unidade e ainda não foi visualizado/aberto por nenhum integrante.',
      'Ponto de Exclamação (!) Vermelho/Laranja: Indica que um novo documento foi incluído ou assinado no processo após a última visualização.',
      'Atribuição de Processo: Permite vincular o processo ao login de um militar específico da seção sem impedir que os demais integrantes da mesma unidade o consultem.',
      'Marcadores e Controle de Prazos: Etiquetas coloridas criadas pela própria unidade para organizar prioridades, status ("Urgente", "Aguardando Parecer") e contagem de prazos.'
    ],
    ficaADica:
      '#FICAADICA (Pág. 54): Utilize a visualização detalhada e os Marcadores da unidade no lugar de planilhas paralelas. Cada unidade gerencia seus próprios marcadores internos sem poluir a visão de outros órgãos.',
    practicalExample:
      'Na sargenteação, os processos recebidos no dia são filtrados por Marcador "Despacho Comandante" e atribuídos ao encarregado responsável.'
  },
  {
    id: 'cap-4',
    number: 'Módulo 04',
    title: 'Iniciar Processo, Tipo Processual e Níveis de Acesso (Público, Restrito e Sigiloso)',
    pilar: 'Instrução Processual e Classificação',
    pages: 'Págs. 20 a 23 e 64 a 68',
    summary:
      'A abertura de um processo eletrônico exige a escolha adequada do Tipo de Processo (catálogo padronizado), Especificação clara, Interessados e definição rigorosa do Nível de Acesso.',
    normativeBase: 'Lei de Acesso à Informação (Lei nº 12.527/2011) · LGPD (Lei nº 13.709/2018)',
    keyPoints: [
      'Público (Regra Geral): Visível a qualquer usuário interno do SEI e passível de consulta externa conforme transparência ativa/passiva.',
      'Restrito (Caixa Amarela): O processo tramita entre unidades (visível apenas para as unidades pelas quais passou ou está aberto), exigindo indicação obrigatória da Hipótese Legal (ex.: Informação Pessoal - LGPD, Documento Preparatório).',
      'Sigiloso (Caixa Vermelha / Credencial): Visível exclusivamente aos usuários que receberam Credencial de Acesso nominalmente concedida, não ficando aberto para toda a unidade.'
    ],
    ficaADica:
      '#FICAADICA (Pág. 65): A publicidade é a regra! Sempre que selecionar acesso Restrito ou Sigiloso, é obrigatório fundamentar com a Hipótese Legal correspondente prevista na legislação.',
    practicalExample:
      'Processos contendo fichas médicas ou dados sensíveis de militares devem ser cadastrados como Restritos com a Hipótese Legal "Informação Pessoal".'
  },
  {
    id: 'cap-5',
    number: 'Módulo 05',
    title: 'Documentos Internos vs. Externos, Nato-Digitais e Digitalizados',
    pilar: 'Documentação e Validade Jurídica',
    pages: 'Págs. 24 a 34',
    summary:
      'O SEI distingue documentos gerados diretamente no editor do sistema (Internos) daqueles importados em formato PDF/mídia (Externos), bem como a origem física ou digital do arquivo.',
    normativeBase: 'Decreto Estadual nº 45.157/2017 · Portaria SAD nº 123/2020',
    keyPoints: [
      'Documento Interno: Elaborado diretamente no editor de textos do SEI (Ofício, Despacho, Memorando, Nota Técnica). Só adquire validade e visibilidade para outras unidades após ser ASSINADO.',
      'Documento Externo Nato-Digital: Arquivo que já nasceu originalmente em meio eletrônico (ex.: PDF assinado digitalmente, nota fiscal eletrônica, planilha oficial).',
      'Documento Externo Digitalizado: Arquivo obtido a partir da digitalização (scanner/foto) de um documento físico em papel. Exige informar o Formato ("Digitalizado nesta Unidade") e o Tipo de Conferência ("Cópia Autenticada Administrativamente", "Documento Original", etc.), além da autenticação pelo servidor.',
      'Uso de Textos Padrão e Modelos Favoritos para padronizar despachos e ofícios da PMPE.'
    ],
    ficaADica:
      '#FICAADICA (Pág. 33): Antes de digitalizar um documento físico em papel, ative o reconhecimento óptico de caracteres (OCR) no scanner para que o PDF fique pesquisável dentro do SEI!',
    practicalExample:
      'Ao anexar um atestado médico apresentado em papel pelo militar, registra-se como Documento Externo -> Digitalizado nesta Unidade -> Conferido com o Documento Original, aplicando a autenticação eletrônica.'
  },
  {
    id: 'cap-6',
    number: 'Módulo 06',
    title: 'Assinatura Eletrônica, Cargo/Função e Efeitos na Edição',
    pilar: 'Assinatura e Validade',
    pages: 'Págs. 35 a 38',
    summary:
      'A assinatura eletrônica no SEI (via Login/Senha ou Certificado Digital ICP-Brasil) confere autoria, integridade e validade jurídica plena ao documento administrativo.',
    normativeBase: 'Decreto Estadual nº 45.157/2017 (Art. 10)',
    keyPoints: [
      'Caneta PRETA: Indica que o documento possui assinatura eletrônica válida.',
      'Caneta AMARELA: Indica documento em fase de minuta/elaboração que ainda aguarda assinatura ou teve versão alterada.',
      'Ao assinar, o militar deve verificar cuidadosamente o Cargo/Função selecionado na lista (ex.: Comandante, Chefe de Seção, Sargenteante, Instrutor).',
      'Enquanto o documento assinado NÃO for visualizado por outra unidade nem enviado para fora da unidade geradora, ainda é possível editar ou cancelar se necessário; após tramitação/ciência externa, o documento torna-se imutável.'
    ],
    ficaADica:
      '#FICAADICA (Pág. 37): Documentos internos sem assinatura (minutas) ficam visíveis apenas para a própria unidade geradora. Outra OME não consegue ler uma minuta não assinada mesmo que o processo seja enviado!',
    practicalExample:
      'O Sargenteante redige a minuta do Ofício no SEI e a disponibiliza para o Comandante da Companhia assinar com seu Cargo/Função.'
  },
  {
    id: 'cap-7',
    number: 'Módulo 07',
    title: 'Blocos de Assinatura, Blocos Internos e Blocos de Reunião',
    pilar: 'Gestão Colaborativa e Assinatura em Lote',
    pages: 'Págs. 44 a 52',
    summary:
      'Os Blocos no SEI organizam conjuntos de processos ou documentos para finalidades específicas de assinatura externa, organização interna ou deliberação colegiada.',
    normativeBase: 'Guia Prático do Usuário SEI — 4ª Edição (Págs. 44–52)',
    keyPoints: [
      'Bloco de Assinatura: Único bloco que permite disponibilizar documentos internos (minutas) para que autoridades de OUTRAS unidades assinem sem precisar tramitar/enviar o processo inteiro.',
      'Bloco Interno: Ferramenta de organização exclusiva da própria unidade (como pastas temáticas de trabalho). Não pode ser disponibilizado para outras unidades.',
      'Bloco de Reunião: Permite disponibilizar processos inteiros para conhecimento prévio e deliberação conjunta entre unidades participantes de comissões, conselhos ou reuniões de comando.'
    ],
    ficaADica:
      '#FICAADICA (Pág. 46): Para que o Comandante de outra unidade assine uma minuta no Bloco de Assinatura, não basta incluir o documento no bloco — é obrigatório clicar no ícone "Disponibilizar Bloco"!',
    practicalExample:
      'A P1 agrupa 15 portarias e despachos em um Bloco de Assinatura para que o Comandante do Batalhão assine todos de uma só vez pelo celular ou computador.'
  },
  {
    id: 'cap-8',
    number: 'Módulo 08',
    title: 'Tramitação, Manter Aberto, Sobrestamento, Anexação e Relacionamento',
    pilar: 'Ciclo de Vida do Processo',
    pages: 'Págs. 39 a 43 e 56 a 63',
    summary:
      'Compreender a diferença técnica entre Enviar Processo, Sobrestar, Relacionar, Anexar e Concluir evita erros graves de instrução processual.',
    normativeBase: 'Guia Prático do Usuário SEI — 4ª Edição (Págs. 39–43, 56–63)',
    keyPoints: [
      'Enviar Processo: Tramita o processo para uma ou mais unidades. A opção "Manter processo aberto na unidade atual" deve ser usada apenas quando a unidade remetente ainda precisa praticar atos simultâneos.',
      'Sobrestamento: Suspensão temporária do andamento do processo quando ele depende de decisão externa ou cumprimento de condição futura (exige justificativa formal e retira o processo da tela inicial até sua remoção).',
      'Relacionamento de Processos: Cria um vínculo de consulta rápida (link cruzado) entre dois processos autônomos que continuam tramitando separadamente.',
      'Anexação de Processos: União definitiva e permanente de um processo acessório (menor) a um processo principal (tratando do mesmo objeto/interessado). O processo anexado passa a integrar a árvore do principal.'
    ],
    ficaADica:
      '#FICAADICA (Pág. 61): Atenção redobrada na Anexação! Diferente do Relacionamento (que é apenas um link entre processos independentes), a Anexação une os autos de forma definitiva.',
    practicalExample:
      'Dois processos sobre férias do mesmo militar gerados em duplicidade são unificados via Anexação; já um Processo Disciplinar e um Inquérito correlato apenas recebem Relacionamento.'
  },
  {
    id: 'cap-9',
    number: 'Módulo 09',
    title: 'Ciência no Processo/Documento, Base de Conhecimento e Pesquisa',
    pilar: 'Rastreabilidade e Gestão do Conhecimento',
    pages: 'Págs. 41, 69 a 75',
    summary:
      'O SEI substitui carimbos de "Ciente" por registros eletrônicos auditáveis e oferece pesquisa textual avançada em toda a base documental.',
    normativeBase: 'Guia Prático do Usuário SEI — 4ª Edição (Págs. 69–75)',
    keyPoints: [
      'Botão Ciência (Ícone de "Check/Polegar"): Registra formalmente no histórico que o usuário/unidade tomou conhecimento de uma decisão, circular ou processo, evitando a criação desnecessária de despachos meramente para dizer "Ciente".',
      'Pesquisa no SEI: Permite buscar por número SEI, CPF/Matrícula, palavras exatas entre aspas ("licença especial"), tipo de documento, unidade geradora e período.',
      'Base de Conhecimento: Repositório institucional vinculado aos tipos de processo com passo a passo e modelos padronizados de instrução.'
    ],
    ficaADica:
      '#FICAADICA (Pág. 41): Quando receber um Ofício Circular apenas para conhecimento da OME, clique no ícone "Ciência" no documento e depois em "Concluir Processo na Unidade" — não gaste tempo gerando despacho de "Ciente"!',
    practicalExample:
      'As companhias registram Ciência na Diretriz Operacional enviada pelo Comando e concluem o processo em suas telas.'
  },
  {
    id: 'cap-10',
    number: 'Módulo 10',
    title: 'Exclusão vs. Cancelamento de Documentos e Comparação de Versões',
    pilar: 'Auditoria e Preservação Processual',
    pages: 'Págs. 36 a 38',
    summary:
      'Para garantir a integridade e a não supressão indevida de peças processuais, o SEI possui regras estritas para Exclusão (lixeira) e Cancelamento (sem efeito).',
    normativeBase: 'Portaria SAD nº 123/2020 · Guia Prático SEI 4ª Edição',
    keyPoints: [
      'Exclusão de Documento (Ícone Lixeira): Só é permitida para minutas não assinadas ou documentos que NUNCA foram visualizados por outra unidade nem geraram efeitos externos.',
      'Cancelamento de Documento (Ícone "Proibido/Cancelar"): Utilizado quando um documento já assinado/tramitado contém erro insanável ou foi juntado indevidamente. Exige justificativa formal, mantém o registro de auditoria na árvore (com ícone de cancelado) e torna seu conteúdo inacessível.',
      'Versões do Documento: O SEI grava todas as edições de um documento interno, permitindo comparar lado a lado o que cada militar inseriu ou suprimiu.'
    ],
    ficaADica:
      '#FICAADICA (Pág. 38): Nunca tente excluir documento que já deu andamento em outra unidade: o sistema bloqueará a lixeira para preservar a fé pública e a cadeia de custódia do processo!',
    practicalExample:
      'Um despacho assinado com erro de matrícula que já foi aberto pela Diretoria é tornado sem efeito via Cancelamento justificado, seguido da emissão de novo Despacho retificador.'
  }
];

interface ApostilaViewerProps {
  onStartQuiz?: () => void;
  isAdminUnlocked?: boolean;
  instructorGeneratorNode?: React.ReactNode;
  onSelectChapterForGenerator?: (chapterId: string) => void;
  initialViewMode?: 'mobile-reader' | 'pdf-embed' | 'generator';
  onOpenSearchIndexModal?: (initialQuery?: string) => void;
  selectedSearchResult?: ApostilaIndexEntry | null;
  onReturnToSearchResults?: () => void;
  onClearSearchResult?: () => void;
  customChapters?: ApostilaChapter[];
  customPdfUrl?: string;
  customMaterialTitle?: string;
  customMaterialSubtitle?: string;
  customSourceType?: 'pdf' | 'link';
  isCustomMaterialActive?: boolean;
}

export const ApostilaViewer: React.FC<ApostilaViewerProps> = ({
  onStartQuiz,
  instructorGeneratorNode,
  onSelectChapterForGenerator,
  initialViewMode = 'mobile-reader',
  onOpenSearchIndexModal,
  selectedSearchResult,
  onReturnToSearchResults,
  onClearSearchResult,
  customChapters,
  customPdfUrl,
  customMaterialTitle,
  customMaterialSubtitle,
  customSourceType,
  isCustomMaterialActive = false,
}) => {
  const activeChapters = useMemo(
    () => (customChapters && customChapters.length > 0 ? customChapters : APOSTILA_CHAPTERS_DATA),
    [customChapters]
  );
  const activePdfUrl = customPdfUrl || OFFICIAL_APOSTILA_PDF_URL;
  const activeTitle =
    isCustomMaterialActive && customMaterialTitle
      ? `${customMaterialTitle} — Programa Reformulado no Aplicativo`
      : 'Programa Oficial CFOA PMPE & Legislação ALEPE — Guia de Estudos e Leis';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState<string>('ALL');
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({
    'cap-1': true,
    'cap-2': true,
    'cap-3': true,
    'cap-4': true,
    'cap-5': true,
    'cap-6': true,
    'cap-7': true,
    'cap-8': true,
    'cap-9': true,
    'cap-10': true
  });
  const [viewMode, setViewMode] = useState<'mobile-reader' | 'pdf-embed' | 'generator'>(initialViewMode);
  const [activePdfPage, setActivePdfPage] = useState<number>(1);
  const [showInlinePdfForSearchResult, setShowInlinePdfForSearchResult] = useState<boolean>(true);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);
  const [studyHoursPerDay, setStudyHoursPerDay] = useState<number>(3);
  const [difficultySubject, setDifficultySubject] = useState<string>('Direito Penal & Processual Militar');
  const [easySubject, setEasySubject] = useState<string>('Legislação PM & Regime Disciplinar');
  const [simuladoDay, setSimuladoDay] = useState<string>('Domingo');
  const [showSchedulePanel, setShowSchedulePanel] = useState<boolean>(false);
  const targetResultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setViewMode(initialViewMode);
  }, [initialViewMode]);

  useEffect(() => {
    const nextExpanded: Record<string, boolean> = {};
    activeChapters.forEach((ch) => {
      nextExpanded[ch.id] = true;
    });
    setExpandedChapters(nextExpanded);
    setSelectedChapterId('ALL');
    setActivePdfPage(1);
  }, [activeChapters, isCustomMaterialActive]);

  // Quando o usuário clica num resultado da pesquisa, abre direto a Apostila no capítulo e página exatos
  useEffect(() => {
    if (selectedSearchResult) {
      setSelectedChapterId(selectedSearchResult.chapterId);
      setExpandedChapters((prev) => ({
        ...prev,
        [selectedSearchResult.chapterId]: true,
      }));
      setActivePdfPage(selectedSearchResult.pdfPageNumber || (isCustomMaterialActive ? 1 : 7));
      setShowInlinePdfForSearchResult(true);
      setViewMode('mobile-reader');
      setTimeout(() => {
        targetResultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    }
  }, [selectedSearchResult, isCustomMaterialActive]);

  const filteredChapters = useMemo(() => {
    return activeChapters.filter((ch) => {
      if (selectedChapterId !== 'ALL' && ch.id !== selectedChapterId) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        ch.title.toLowerCase().includes(q) ||
        ch.summary.toLowerCase().includes(q) ||
        ch.pilar.toLowerCase().includes(q) ||
        ch.ficaADica.toLowerCase().includes(q) ||
        ch.keyPoints.some((kp) => kp.toLowerCase().includes(q))
      );
    });
  }, [activeChapters, searchQuery, selectedChapterId]);

  const toggleChapter = (id: string) => {
    setExpandedChapters((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = (expand: boolean) => {
    const next: Record<string, boolean> = {};
    activeChapters.forEach((c) => {
      next[c.id] = expand;
    });
    setExpandedChapters(next);
  };

  const handleDownloadOfflineHtml = () => {
    const docHeaderTitle =
      isCustomMaterialActive && customMaterialTitle
        ? customMaterialTitle
        : 'Apostila DT-SEI — Guia Prático do Usuário SEI (4ª Edição)';
    const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${docHeaderTitle} — Guia de Aperfeiçoamento</title>
  <style>
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    body { margin: 0; padding: 16px; background: #0f172a; color: #f8fafc; line-height: 1.6; }
    .container { max-width: 900px; margin: 0 auto; background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 24px; }
    .header { border-bottom: 2px solid #10b981; padding-bottom: 18px; margin-bottom: 22px; }
    .badge { display: inline-block; background: #065f46; color: #6ee7b7; font-size: 12px; font-weight: 800; padding: 4px 10px; border-radius: 999px; text-transform: uppercase; letter-spacing: 1px; }
    h1 { margin: 10px 0 6px; font-size: 22px; color: #ffffff; }
    .subtitle { color: #94a3b8; font-size: 13px; margin: 0; }
    .chapter { background: #0f172a; border: 1px solid #334155; border-left: 4px solid #10b981; border-radius: 12px; padding: 18px; margin-bottom: 18px; page-break-inside: avoid; }
    .chapter-head { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
    .chapter-num { color: #34d399; font-weight: 800; font-size: 13px; text-transform: uppercase; }
    .chapter-pages { background: #1e293b; color: #cbd5e1; font-size: 12px; padding: 2px 8px; border-radius: 6px; border: 1px solid #475569; }
    h2 { margin: 4px 0 10px; font-size: 17px; color: #f8fafc; }
    .summary { color: #cbd5e1; font-size: 14px; margin-bottom: 12px; }
    ul { margin: 0 0 14px; padding-left: 20px; color: #e2e8f0; font-size: 14px; }
    li { margin-bottom: 6px; }
    .dica { background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.4); color: #fcd34d; padding: 12px 14px; border-radius: 10px; font-size: 13px; font-weight: 600; margin-bottom: 10px; }
    .example { background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); color: #a7f3d0; padding: 10px 14px; border-radius: 10px; font-size: 13px; }
    .footer { text-align: center; margin-top: 30px; padding-top: 16px; border-top: 1px solid #334155; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="badge">Guia de Aperfeiçoamento · QUIZ DE APROVAÇÃO SGT GREGÓRIO</span>
      <h1>${docHeaderTitle}</h1>
      <p class="subtitle">QUIZ DE APROVAÇÃO SGT GREGÓRIO · Guia de Aperfeiçoamento CFOA PMPE</p>
    </div>
    ${activeChapters.map(
      (ch) => `
      <div class="chapter">
        <div class="chapter-head">
          <span class="chapter-num">${ch.number} · ${ch.pilar}</span>
          <span class="chapter-pages">${ch.pages} · ${ch.normativeBase}</span>
        </div>
        <h2>${ch.title}</h2>
        <p class="summary">${ch.summary}</p>
        <ul>
          ${ch.keyPoints.map((kp) => `<li>${kp}</li>`).join('')}
        </ul>
        <div class="dica">${ch.ficaADica}</div>
        <div class="example"><strong>Aplicação Prática:</strong> ${ch.practicalExample}</div>
      </div>`
    ).join('')}
    <div class="footer">
      *IMPORTHOUR© - todos os direitos reservados · Guia de Aperfeiçoamento CFOA PMPE
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Apostila-Resumo-Mobile-Guia-Aperfeicoamento.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloadToast('Apostila Interativa Mobile baixada com sucesso no seu aparelho!');
    setTimeout(() => setDownloadToast(null), 4500);
  };

  return (
    <div ref={targetResultRef} className="space-y-5 pb-10">
      {/* =====================================================================
          PAINEL DE LEITURA DIRETA NA APOSTILA DO APLICATIVO (REMETIDO DA PESQUISA)
         ===================================================================== */}
      {selectedSearchResult && (
        <div className="bg-slate-900 border-2 border-amber-400 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(251,191,36,0.2)] animate-table-fade-in">
          {/* Barra Superior Flutuante com Botão VOLTAR AOS RESULTADOS DA PESQUISA */}
          <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-amber-950/60 border-b border-amber-400/50 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              {onReturnToSearchResults && (
                <button
                  type="button"
                  onClick={onReturnToSearchResults}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/25 active:scale-[0.98] transition cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
                  <span>VOLTAR AOS RESULTADOS DA PESQUISA</span>
                </button>
              )}
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 font-mono-num text-xs font-black uppercase">
                Apostila no Aplicativo · {selectedSearchResult.chapterNumber} ({selectedSearchResult.pagesLabel})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowInlinePdfForSearchResult((prev) => !prev)}
                className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 border transition cursor-pointer ${
                  showInlinePdfForSearchResult
                    ? 'bg-amber-400/20 border-amber-400/60 text-amber-300'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>
                  {showInlinePdfForSearchResult
                    ? `PDF Aberto na Pág. ${activePdfPage}`
                    : `Mostrar PDF na Pág. ${activePdfPage}`}
                </span>
              </button>

              {onClearSearchResult && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedChapterId('ALL');
                    onClearSearchResult();
                  }}
                  className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                  title="Ver todos os capítulos da Apostila"
                >
                  <X className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Ver Todos os Capítulos</span>
                </button>
              )}
            </div>
          </div>

          {/* Conteúdo Localizado na Apostila + Visualizador Direto da Página no App */}
          <div className="p-4 sm:p-6 space-y-5">
            {/* Destaque do Tópico / Resposta Oficial Localizada */}
            <div className="bg-slate-950/90 border border-emerald-500/50 rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded bg-amber-400 text-slate-950 font-mono-num text-[11px] font-black uppercase">
                  INDEX #{selectedSearchResult.indexCode}
                </span>
                <span className="px-2.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-black uppercase">
                  {selectedSearchResult.kindLabel}
                </span>
                <span className="px-2.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-300 font-mono-num text-[11px] font-bold flex items-center gap-1">
                  <Hash className="w-3 h-3" />
                  Página Exata na Apostila: Pág. {selectedSearchResult.pdfPageNumber} ({selectedSearchResult.pagesLabel})
                </span>
              </div>

              <h3 className="text-base sm:text-xl font-black text-white leading-snug">
                {selectedSearchResult.title}
              </h3>

              {selectedSearchResult.questionStem && (
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-black uppercase text-amber-400">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Questão da Sondagem Relacionada:</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 font-medium">
                    {selectedSearchResult.questionStem}
                  </p>
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/50 space-y-1.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Resposta / Regra Oficial na Apostila ({selectedSearchResult.pagesLabel}):
                </span>
                <p className="text-xs sm:text-base font-bold text-white leading-relaxed">
                  {selectedSearchResult.directAnswer}
                </p>
              </div>

              <div className="text-xs sm:text-sm text-slate-300 leading-relaxed space-y-1">
                <strong className="text-amber-300 uppercase text-[11px] tracking-wider block">
                  Fundamentação Técnica na Apostila DT-SEI:
                </strong>
                <p className="whitespace-pre-line">{selectedSearchResult.detailedExplanation}</p>
              </div>
            </div>

            {/* APOSTILA PDF VISUALIZADA DIRETAMENTE NO APLICATIVO NA PÁGINA EXATA */}
            {showInlinePdfForSearchResult && (
              <div className="bg-slate-950 border-2 border-emerald-500/50 rounded-2xl p-3.5 sm:p-5 space-y-3 shadow-inner">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-amber-400" />
                      <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                        Apostila Oficial DT-SEI Visualizada no Aplicativo — Folha Pág. {activePdfPage}
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Você foi remetido diretamente para a página <strong className="text-amber-300">Pág. {activePdfPage}</strong> ({selectedSearchResult.chapterNumber} — {selectedSearchResult.chapterTitle}). Abaixo você também pode ler o módulo formatado para celular.
                    </p>
                  </div>

                  {/* Controles de Paginação Direta da Apostila no App */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setActivePdfPage((p) => Math.max(1, p - 1))}
                      className="min-h-[36px] px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Pág. Anterior</span>
                    </button>
                    <span className="px-3 py-1.5 rounded-lg bg-amber-400/20 border border-amber-400/50 text-amber-300 font-mono-num text-xs font-black">
                      Pág. {activePdfPage} / 2
                    </span>
                    <button
                      type="button"
                      onClick={() => setActivePdfPage((p) => Math.min(2, p + 1))}
                      className="min-h-[36px] px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Próxima Pág.</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <a
                      href={`${activePdfUrl}#page=${activePdfPage}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[36px] px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-amber-300 text-xs font-bold flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Tela Cheia</span>
                    </a>
                  </div>
                </div>

                <div className="w-full h-[62vh] min-h-[420px] rounded-xl overflow-hidden border border-slate-700 bg-slate-900">
                  <iframe
                    key={`pdf-page-${activePdfPage}-${activePdfUrl}`}
                    src={`${activePdfUrl}#page=${activePdfPage}`}
                    title={`Apostila Oficial Página ${activePdfPage}`}
                    className="w-full h-full border-0"
                  />
                </div>
              </div>
            )}

            {/* Barra Inferior de Retorno Rápido aos Resultados */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
              {onReturnToSearchResults && (
                <button
                  type="button"
                  onClick={onReturnToSearchResults}
                  className="min-h-[42px] px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-2 shadow-md cursor-pointer transition"
                >
                  <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
                  <span>VOLTAR AOS RESULTADOS DA PESQUISA</span>
                </button>
              )}
              <span className="text-[11px] text-slate-400">
                Role abaixo para ler todos os pontos-chave do <strong className="text-emerald-300">{selectedSearchResult.chapterNumber}</strong> diretamente no leitor do aplicativo ↓
              </span>
            </div>
          </div>
        </div>
      )}

      {/* HERO CARD: Download & View Options Designed for Smartphone Users */}
      <div className="bg-gradient-to-br from-slate-900 via-emerald-950/50 to-slate-900 border-2 border-emerald-500/50 rounded-2xl p-4 sm:p-6 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-black uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5" />
              {isCustomMaterialActive
                ? `Material Base Atualizado (${customSourceType === 'link' ? 'Link Oficial' : 'PDF Oficial'}) · ${activeChapters.length} Módulos`
                : 'Conteúdo Programático Oficial CFOA PMPE · Legislação Estadual ALEPE'}
            </div>
            <h2 className="text-lg sm:text-2xl font-black text-white leading-tight">
              {activeTitle}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {isCustomMaterialActive && customMaterialSubtitle ? (
                customMaterialSubtitle
              ) : (
                <>
                  Acesse todo o conteúdo programático do{' '}
                  <strong className="text-emerald-300">Curso de Formação de Oficiais da Administração (CFOA PMPE)</strong>{' '}
                  diretamente no celular, consulte a legislação estadual no{' '}
                  <strong className="text-amber-300">Portal ALEPE (https://legis.alepe.pe.gov.br/)</strong> ou baixe o programa em PDF.
                </>
              )}
            </p>
          </div>

          {/* Prominent Mobile Action Buttons for Download */}
          <div className="flex flex-col sm:flex-row gap-2.5 shrink-0">
            <a
              href={activePdfUrl}
              target={customSourceType === 'link' ? '_blank' : undefined}
              rel={customSourceType === 'link' ? 'noopener noreferrer' : undefined}
              download={customSourceType === 'link' ? undefined : 'Apostila-Oficial-Guia-Aperfeicoamento.pdf'}
              onClick={() => {
                setDownloadToast(
                  customSourceType === 'link'
                    ? 'Abrindo material base externo...'
                    : 'Iniciando download do PDF Oficial da Apostila...'
                );
                setTimeout(() => setDownloadToast(null), 4000);
              }}
              className="flex items-center justify-center gap-2.5 min-h-[50px] px-5 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/25 active:scale-[0.98] transition-all cursor-pointer border border-amber-200"
            >
              {customSourceType === 'link' ? (
                <ExternalLink className="w-5 h-5 stroke-[2.5] shrink-0" />
              ) : (
                <Download className="w-5 h-5 stroke-[2.5] shrink-0" />
              )}
              <span>
                {customSourceType === 'link' ? 'ABRIR LINK DO MATERIAL BASE' : 'BAIXAR APOSTILA PDF OFICIAL'}
              </span>
            </a>

            <button
              type="button"
              onClick={handleDownloadOfflineHtml}
              className="flex items-center justify-center gap-2 min-h-[50px] px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Smartphone className="w-4 h-4 stroke-[2.5] shrink-0" />
              <span>Baixar Versão Leitura Celular</span>
            </button>
          </div>
        </div>

        {downloadToast && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 text-xs sm:text-sm font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{downloadToast}</span>
          </div>
        )}

        {/* Mode Selector Tabs (High-contrast buttons for mobile) */}
        <div className="mt-4 pt-4 border-t border-slate-800/90 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setViewMode('mobile-reader')}
            className={`min-h-[46px] px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer border ${
              viewMode === 'mobile-reader'
                ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-lg shadow-emerald-500/25'
                : 'bg-slate-950/90 text-slate-200 border-slate-700 hover:border-emerald-500/50'
            }`}
          >
            <Smartphone className="w-4 h-4 shrink-0" />
            <span>1. Leitura Rápida no Celular ({activeChapters.length} Módulos)</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('pdf-embed')}
            className={`min-h-[46px] px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer border ${
              viewMode === 'pdf-embed'
                ? 'bg-amber-400 text-slate-950 border-amber-200 shadow-lg shadow-amber-500/25'
                : 'bg-slate-950/90 text-slate-200 border-slate-700 hover:border-amber-400/50'
            }`}
          >
            <Eye className="w-4 h-4 shrink-0" />
            <span>2. Visualizar Documento Original no App</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('generator')}
            className={`min-h-[46px] px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer border ${
              viewMode === 'generator'
                ? 'bg-sky-400 text-slate-950 border-sky-200 shadow-lg shadow-sky-500/25'
                : 'bg-slate-950/90 text-slate-200 border-slate-700 hover:border-sky-400/50'
            }`}
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>3. Gerador Tático & Revisão Rápida</span>
          </button>
        </div>
      </div>

      {/* MODE 2: EMBEDDED OFFICIAL PDF / LINK VIEWER */}
      {viewMode === 'pdf-embed' && (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                Visualizador Integrado — {isCustomMaterialActive && customMaterialTitle ? customMaterialTitle : 'Apostila Oficial DT-SEI'} (Pág. {activePdfPage})
              </h3>
              <p className="text-xs text-slate-400">
                Caso o navegador do seu celular prefira abrir tela cheia, toque em "Abrir em Tela Cheia" ou em "Baixar Material".
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {onReturnToSearchResults && (
                <button
                  type="button"
                  onClick={onReturnToSearchResults}
                  className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Voltar aos Resultados</span>
                </button>
              )}
              <a
                href={`${activePdfUrl}#page=${activePdfPage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                Abrir em Tela Cheia
              </a>
              <a
                href={activePdfUrl}
                target={customSourceType === 'link' ? '_blank' : undefined}
                rel={customSourceType === 'link' ? 'noopener noreferrer' : undefined}
                download={customSourceType === 'link' ? undefined : 'Apostila-Oficial-Guia-Aperfeicoamento.pdf'}
                className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                {customSourceType === 'link' ? 'Abrir Link Externo' : 'Baixar PDF Agora'}
              </a>
            </div>
          </div>

          <div className="w-full h-[70vh] min-h-[480px] rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
            <iframe
              key={`embed-pdf-${activePdfPage}-${activePdfUrl}`}
              src={`${activePdfUrl}#page=${activePdfPage}`}
              title="Apostila Oficial PDF"
              className="w-full h-full border-0"
            />
          </div>
        </div>
      )}

      {/* MODE 3: QUESTION GENERATOR */}
      {viewMode === 'generator' && instructorGeneratorNode && (
        <div>{instructorGeneratorNode}</div>
      )}

      {/* MODE 1: INTERACTIVE MOBILE READER */}
      {viewMode === 'mobile-reader' && (
        <>
          {/* PORTAL DA LEGISLAÇÃO ESTADUAL ALEPE & METODOLOGIA IAUPE/AOCP */}
          <div className="bg-slate-900/95 border-2 border-amber-500/40 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 block">
                  Repositório Oficial de Legislação Estadual · CFOA PMPE
                </span>
                <h3 className="text-sm sm:text-base font-black text-white">
                  Fontes Primárias no Portal ALEPE & Cronograma IAUPE/UPENET e AOCP
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Consulte a letra da lei atualizada diretamente em{' '}
                  <a
                    href={ALEPE_PORTAL_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-300 underline font-bold hover:text-amber-200"
                  >
                    https://legis.alepe.pe.gov.br/
                  </a>{' '}
                  ou monte seu cronograma semanal personalizado (Lei Seca + Questões IAUPE/AOCP).
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <a
                  href={ALEPE_PORTAL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[40px] px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md"
                >
                  <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Abrir Portal ALEPE</span>
                </a>
                <button
                  type="button"
                  onClick={() => setShowSchedulePanel((prev) => !prev)}
                  className="min-h-[40px] px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-300 font-black text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{showSchedulePanel ? 'Ocultar Cronograma IAUPE/AOCP' : 'Anamnese & Cronograma Semanal'}</span>
                </button>
              </div>
            </div>

            {/* Links diretos para os Diplomas Legais da PMPE na ALEPE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {CFOA_PRIMARY_LEGISLATION.map((law) => (
                <a
                  key={law.source}
                  href={law.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-slate-950/90 hover:bg-slate-950 border border-slate-800 hover:border-amber-400/60 transition flex items-start justify-between gap-2 group"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-black text-amber-300 group-hover:text-amber-200 truncate">
                      {law.source}
                    </div>
                    <div className="text-[11px] font-bold text-white truncate">{law.name}</div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">{law.summary}</div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 shrink-0 mt-0.5" />
                </a>
              ))}
            </div>

            {/* PAINEL INTERATIVO: ANAMNESE & CRONOGRAMA SEMANAL (PASSO 1 A 4 - IAUPE/UPENET & AOCP) */}
            {showSchedulePanel && (
              <div className="pt-3 border-t border-slate-800 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      1. Horas Diárias de Estudo
                    </label>
                    <select
                      value={studyHoursPerDay}
                      onChange={(e) => setStudyHoursPerDay(Number(e.target.value))}
                      className="w-full min-h-[38px] px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-bold"
                    >
                      <option value={2}>2 horas / dia (14h/sem)</option>
                      <option value={3}>3 horas / dia (21h/sem)</option>
                      <option value={4}>4 horas / dia (28h/sem)</option>
                      <option value={5}>5+ horas / dia (35h/sem)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      2. Maior Dificuldade (Prioridade)
                    </label>
                    <select
                      value={difficultySubject}
                      onChange={(e) => setDifficultySubject(e.target.value)}
                      className="w-full min-h-[38px] px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-rose-300 font-bold"
                    >
                      <option value="Direito Penal & Processual Militar">Direito Penal & Processual Militar</option>
                      <option value="Legislação PM & Regime Disciplinar">Legislação PM & Regime Disciplinar</option>
                      <option value="Direito Constitucional & Administrativo">Direito Constitucional & Administrativo</option>
                      <option value="Administração & Conhecimentos Gerais">Administração, Português & RLM</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      3. Maior Facilidade
                    </label>
                    <select
                      value={easySubject}
                      onChange={(e) => setEasySubject(e.target.value)}
                      className="w-full min-h-[38px] px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-emerald-300 font-bold"
                    >
                      <option value="Legislação PM & Regime Disciplinar">Legislação PM & Regime Disciplinar</option>
                      <option value="Direito Penal & Processual Militar">Direito Penal & Processual Militar</option>
                      <option value="Direito Constitucional & Administrativo">Direito Constitucional & Administrativo</option>
                      <option value="Administração & Conhecimentos Gerais">Administração, Português & RLM</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      4. Dia de Simulado (IAUPE/AOCP)
                    </label>
                    <select
                      value={simuladoDay}
                      onChange={(e) => setSimuladoDay(e.target.value)}
                      className="w-full min-h-[38px] px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-amber-300 font-bold"
                    >
                      <option value="Sábado">Sábado</option>
                      <option value="Domingo">Domingo</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/90">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/90 text-amber-300">
                        <th className="py-2.5 px-3 font-black">Dia</th>
                        <th className="py-2.5 px-3 font-black">Teoria (Leitura da Lei Seca ALEPE)</th>
                        <th className="py-2.5 px-3 font-black">Resolução de Questões (IAUPE/AOCP)</th>
                        <th className="py-2.5 px-3 font-black">Revisão Ativa ({studyHoursPerDay}h/dia)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 text-slate-200">
                      <tr>
                        <td className="py-2 px-3 font-bold text-emerald-300">Segunda</td>
                        <td className="py-2 px-3">Lei Estadual nº 6.783/1974 (Estatuto PMPE - Arts. 1º a 49)</td>
                        <td className="py-2 px-3">15 questões IAUPE/AOCP sobre Hierarquia, Cargo e Função</td>
                        <td className="py-2 px-3">Flashcards de prazos e agregação/reversão</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-bold text-emerald-300">Terça</td>
                        <td className="py-2 px-3">Foco Prioritário: {difficultySubject} (CPM Arts. 9º, 38-42 e 149-195)</td>
                        <td className="py-2 px-3">20 questões AOCP/IAUPE sobre Crimes Militares em Tempo de Paz</td>
                        <td className="py-2 px-3">Mapa mental de excludentes e deserção/insubordinação</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-bold text-emerald-300">Quarta</td>
                        <td className="py-2 px-3">Lei Estadual nº 11.817/2000 (Código Disciplinar PMPE - Arts. 1º a 45)</td>
                        <td className="py-2 px-3">15 questões sobre Sanções, Prazos e Recursos Disciplinares</td>
                        <td className="py-2 px-3">Tabela comparativa: Detenção x Prisão x Licenciamento</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-bold text-emerald-300">Quinta</td>
                        <td className="py-2 px-3">CPPM (Arts. 8º a 28 - IPM e APFD) + Lei 14.133/2021 (Licitações)</td>
                        <td className="py-2 px-3">20 questões sobre Prazos do IPM (20d preso / 40d solto) e Pregão</td>
                        <td className="py-2 px-3">Caderno de erros da matéria: {difficultySubject}</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-bold text-emerald-300">Sexta</td>
                        <td className="py-2 px-3">Decreto nº 3.639/1975 (Conselho de Disciplina) e Lei 5.836/1972 (CJ)</td>
                        <td className="py-2 px-3">15 questões sobre CF/88 (Arts. 5º, 37, 42 e 144) + Direitos Humanos</td>
                        <td className="py-2 px-3">Manutenção rápida: {easySubject}</td>
                      </tr>
                      <tr className="bg-amber-950/20">
                        <td className="py-2 px-3 font-black text-amber-300">{simuladoDay}</td>
                        <td className="py-2 px-3 font-semibold text-white">Ciclo de Simulado Oficial CFOA PMPE (10 a 20 questões sem consulta)</td>
                        <td className="py-2 px-3">Correção com Gabarito Comentado + Artigos da ALEPE</td>
                        <td className="py-2 px-3">Meta de corte: ≥ 75% de acerto por disciplina</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                  <span className="text-slate-400 font-semibold">
                    Atalhos Externos de Questões (Filtros IAUPE/UPENET e Instituto AOCP):
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href="https://www.qconcursos.com/questoes-de-concursos/questoes?q=UPENET+IAUPE+PM+PE"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-sky-300 font-bold flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Qconcursos (IAUPE/AOCP)</span>
                    </a>
                    <a
                      href="https://www.tecconcursos.com.br/questoes"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-300 font-bold flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>TecConcursos</span>
                    </a>
                    <a
                      href="https://questoes.estrategia.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 font-bold flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Estratégia Questões</span>
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Search & Module Filter */}
          <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && onOpenSearchIndexModal) {
                      onOpenSearchIndexModal(searchQuery);
                    }
                  }}
                  placeholder="Buscar assunto no Programa CFOA ou Lei ALEPE (ex: Lei 11.817, IPM, Deserção, Lei 14.133, Conselho de Disciplina)..."
                  className="w-full min-h-[46px] bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {onOpenSearchIndexModal && (
                  <button
                    type="button"
                    onClick={() => onOpenSearchIndexModal(searchQuery)}
                    className="flex-1 sm:flex-initial min-h-[44px] px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition"
                  >
                    <Search className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Pesquisa em Formato Index</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => expandAll(true)}
                  className="flex-1 sm:flex-initial min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 cursor-pointer"
                >
                  Expandir Todos
                </button>
                <button
                  type="button"
                  onClick={() => expandAll(false)}
                  className="flex-1 sm:flex-initial min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 cursor-pointer"
                >
                  Recolher
                </button>
              </div>
            </div>

            {/* Module Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setSelectedChapterId('ALL')}
                className={`px-3 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                  selectedChapterId === 'ALL'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Todos os {activeChapters.length} Módulos
              </button>
              {activeChapters.map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => setSelectedChapterId(ch.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedChapterId === ch.id
                      ? 'bg-emerald-500 text-slate-950 font-black'
                      : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 border border-slate-700/60'
                  }`}
                >
                  {ch.number}
                </button>
              ))}
            </div>
          </div>

          {/* Chapters List */}
          <div className="space-y-3.5">
            {filteredChapters.map((chapter) => {
              const isExpanded = expandedChapters[chapter.id] !== false;
              return (
                <div
                  key={chapter.id}
                  className="bg-slate-900/95 border border-slate-800 hover:border-emerald-500/40 rounded-2xl overflow-hidden transition-all shadow-lg"
                >
                  <button
                    type="button"
                    onClick={() => toggleChapter(chapter.id)}
                    className="w-full text-left p-4 sm:p-5 flex items-start justify-between gap-3 bg-slate-900/60 hover:bg-slate-800/50 transition-colors cursor-pointer"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-black uppercase tracking-wider">
                          {chapter.number}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-bold">
                          {chapter.pages}
                        </span>
                        <span className="text-[11px] text-amber-300/90 font-semibold">
                          {chapter.pilar}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-white leading-snug">
                        {chapter.title}
                      </h3>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-800 text-slate-300 shrink-0 mt-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-4 sm:p-5 pt-2 border-t border-slate-800/80 space-y-4">
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                        {chapter.summary}
                      </p>

                      <div className="space-y-2">
                        <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Pontos-Chave do Módulo:
                        </h4>
                        <ul className="space-y-2">
                          {chapter.keyPoints.map((point, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60"
                            >
                              <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <span className="leading-relaxed">{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* #FICAADICA Highlight Box */}
                      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-200 text-xs sm:text-sm leading-relaxed">
                        <strong className="text-amber-300 block mb-0.5 font-black uppercase tracking-wide">
                          Destaque Oficial da Apostila:
                        </strong>
                        {chapter.ficaADica}
                      </div>

                      {/* Practical PMPE Scenario */}
                      <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-100 text-xs sm:text-sm leading-relaxed">
                        <strong className="text-emerald-300 font-black uppercase tracking-wide mr-1.5">
                          Aplicação Prática:
                        </strong>
                        {chapter.practicalExample}
                      </div>

                      {/* Direct Action to Generate Questions from this Chapter */}
                      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-t border-slate-800/80">
                        <span className="text-[11px] text-slate-400">
                          Deseja praticar questões exclusivas sobre o <strong className="text-slate-200">{chapter.number} ({chapter.pages})</strong>?
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (onSelectChapterForGenerator) {
                              onSelectChapterForGenerator(chapter.id);
                            }
                            setViewMode('generator');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="min-h-[40px] px-4 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/50 text-sky-200 font-black text-xs flex items-center justify-center gap-2 transition cursor-pointer shrink-0"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-sky-300" />
                          <span>Gerar Questões deste Capítulo ({chapter.pages})</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Download Card for Mobile Users */}
          <div className="bg-slate-900 border-2 border-amber-400/50 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="text-center sm:text-left">
              <p className="text-sm sm:text-base font-black text-white">
                {isCustomMaterialActive && customMaterialTitle
                  ? `Deseja guardar o material "${customMaterialTitle}" no celular?`
                  : 'Deseja guardar a Apostila Oficial no celular?'}
              </p>
              <p className="text-xs text-slate-300 mt-0.5">
                QUIZ DE APROVAÇÃO SGT GREGÓRIO · Guia de Aperfeiçoamento CFOA PMPE
              </p>
            </div>
            <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2.5 shrink-0">
              <a
                href={activePdfUrl}
                target={customSourceType === 'link' ? '_blank' : undefined}
                rel={customSourceType === 'link' ? 'noopener noreferrer' : undefined}
                download={customSourceType === 'link' ? undefined : 'Apostila-Oficial-Guia-Aperfeicoamento.pdf'}
                className="w-full sm:w-auto min-h-[48px] px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                {customSourceType === 'link' ? 'Abrir Link do Material' : 'Baixar Apostila PDF Oficial'}
              </a>
              {onStartQuiz && (
                <button
                  type="button"
                  onClick={onStartQuiz}
                  className="w-full sm:w-auto min-h-[48px] px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  <span>Responder Quiz</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
