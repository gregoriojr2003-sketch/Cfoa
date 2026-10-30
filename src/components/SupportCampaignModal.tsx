import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  HeartHandshake,
  Copy,
  Check,
  QrCode,
  Server,
  Database,
  ShieldCheck,
  Sparkles,
  X,
  ArrowRight,
  AlertCircle,
  UserCheck,
  RefreshCw,
  MailCheck,
} from 'lucide-react';

export const PIX_RANDOM_KEY = '942472f0-1c44-44b0-94b3-2d6f7b568a21';

export const SUPPORT_MODAL_STORAGE_KEY = 'cfoa_support_modal_last_shown_ms_v1';
export const SUPPORT_MODAL_INTERVAL_MS = 2 * 24 * 60 * 60 * 1000; // 2 dias (48 horas)

/**
 * Verifica se a solicitação de colaboração deve ser exibida automaticamente:
 * apenas no primeiro acesso do usuário e, depois disso, a cada 2 dias.
 */
export function shouldAutoShowSupportModal(): boolean {
  try {
    const raw = localStorage.getItem(SUPPORT_MODAL_STORAGE_KEY);
    if (!raw) {
      return true; // Primeiro acesso
    }
    const lastShownMs = Number(raw);
    if (isNaN(lastShownMs) || lastShownMs <= 0) {
      return true;
    }
    return Date.now() - lastShownMs >= SUPPORT_MODAL_INTERVAL_MS;
  } catch {
    return false;
  }
}

export function markSupportModalShown(): void {
  try {
    localStorage.setItem(SUPPORT_MODAL_STORAGE_KEY, String(Date.now()));
  } catch {}
}

export type SupportTierAmount = 5 | 10 | 15;

interface SupportTierOption {
  amount: SupportTierAmount;
  label: string;
  title: string;
  description: string;
  badge?: string;
}

export const SUPPORT_TIERS: SupportTierOption[] = [
  {
    amount: 5,
    label: 'R$ 5,00',
    title: 'Apoio Básico · Servidor Ativo',
    description: 'Ajuda a custear horas de processamento em nuvem e tráfego de dados dos simulados.',
  },
  {
    amount: 10,
    label: 'R$ 10,00',
    title: 'Apoio Intermediário · Banco em Tempo Real',
    description: 'Contribui para manter o banco de dados do Placar Coletivo e atualizações da ALEPE.',
    badge: 'Mais Escolhido',
  },
  {
    amount: 15,
    label: 'R$ 15,00',
    title: 'Apoio Mantenedor · Missão CFOA no Ar',
    description: 'Fortalece a infraestrutura completa, geração de simulados IA e manutenção contínua.',
    badge: 'Mantenedor',
  },
];

/**
 * Gera payload EMVCo BRCode PIX oficial (Banco Central do Brasil) com CRC16-CCITT (0x1021)
 * para a chave aleatória 942472f0-1c44-44b0-94b3-2d6f7b568a21 e valor selecionado.
 */
export function buildPixBrCodePayload(key: string, amount?: number): string {
  const formatField = (id: string, value: string) => {
    const len = value.length.toString().padStart(2, '0');
    return `${id}${len}${value}`;
  };

  const gui = formatField('00', 'br.gov.bcb.pix');
  const chave = formatField('01', key);
  const merchantAccountInfo = formatField('26', `${gui}${chave}`);

  const merchantCategoryCode = formatField('52', '0000');
  const transactionCurrency = formatField('53', '986'); // BRL
  const transactionAmount =
    amount && amount > 0 ? formatField('54', amount.toFixed(2)) : '';
  const countryCode = formatField('58', 'BR');
  const merchantName = formatField('59', 'CFOA PMPE APP');
  const merchantCity = formatField('60', 'RECIFE');
  const txId = formatField('05', 'CFOAPMPE');
  const additionalDataField = formatField('62', txId);

  const payloadWithoutCrc =
    formatField('00', '01') +
    merchantAccountInfo +
    merchantCategoryCode +
    transactionCurrency +
    transactionAmount +
    countryCode +
    merchantName +
    merchantCity +
    additionalDataField +
    '6304';

  // Cálculo CRC16-CCITT (0xFFFF, polinômio 0x1021)
  let crc = 0xffff;
  for (let i = 0; i < payloadWithoutCrc.length; i++) {
    crc ^= payloadWithoutCrc.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }

  const crcHex = crc.toString(16).toUpperCase().padStart(4, '0');
  return `${payloadWithoutCrc}${crcHex}`;
}

interface SupportCampaignCardContentProps {
  onClose?: () => void;
  isModal?: boolean;
}

export const SupportCampaignCardContent: React.FC<SupportCampaignCardContentProps> = ({
  onClose,
  isModal = false,
}) => {
  const [selectedAmount, setSelectedAmount] = useState<SupportTierAmount>(10);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedBrCode, setCopiedBrCode] = useState(false);
  const [qrMode, setQrMode] = useState<'brcode' | 'rawkey'>('brcode');

  const pixBrCode = buildPixBrCodePayload(PIX_RANDOM_KEY, selectedAmount);
  const qrValue = qrMode === 'brcode' ? pixBrCode : PIX_RANDOM_KEY;

  const handleCopyKey = async () => {
    try {
      await navigator.clipboard.writeText(PIX_RANDOM_KEY);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 3000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = PIX_RANDOM_KEY;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 3000);
    }
  };

  const handleCopyBrCode = async () => {
    try {
      await navigator.clipboard.writeText(pixBrCode);
      setCopiedBrCode(true);
      setTimeout(() => setCopiedBrCode(false), 3000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = pixBrCode;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedBrCode(true);
      setTimeout(() => setCopiedBrCode(false), 3000);
    }
  };

  return (
    <div className="bg-slate-900 border-2 border-amber-500/60 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
      {/* Top Banner — Campanha de Apelo */}
      <div className="bg-gradient-to-r from-amber-950/90 via-slate-900 to-emerald-950/90 border-b border-amber-500/40 px-4 sm:px-6 py-4 relative">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center shrink-0">
              <HeartHandshake className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-amber-300 bg-amber-950/90 border border-amber-500/40 px-2.5 py-0.5 rounded-md">
                  <Sparkles className="w-3 h-3" /> App 100% Grátis · Mantido pelos Usuários
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-950/90 border border-emerald-500/40 px-2 py-0.5 rounded-md">
                  <RefreshCw className="w-3 h-3" /> Atualizações pelo Admin
                </span>
              </div>
              <h2 className="font-display text-lg sm:text-xl font-extrabold text-white leading-tight">
                Este Aplicativo é GRÁTIS, mas Mantido no Ar pelas Colaborações dos Usuários!
              </h2>
            </div>
          </div>

          {isModal && onClose && (
            <button
              type="button"
              onClick={onClose}
              title="Fechar aviso e acessar o aplicativo"
              className="p-2 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Corpo do Card */}
      <div className="p-4 sm:p-6 space-y-5">
        {/* Comunicado Oficial em 3 Pilares: App Grátis + Atualizações pelo Admin + Login Gmail e Perfil Obrigatório */}
        <div className="bg-slate-950/95 border border-amber-500/30 rounded-xl p-3.5 sm:p-4 space-y-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              <strong className="text-amber-300">INFORMAÇÃO IMPORTANTE AOS CANDIDATOS CFOA PMPE:</strong> Este aplicativo preparatório é{' '}
              <strong className="text-emerald-300 underline decoration-emerald-500/60">100% GRÁTIS</strong> para todos os militares, porém{' '}
              <strong className="text-white">é mantido no ar exclusivamente pelos seus usuários através de colaborações voluntárias</strong> para cobrir os custos contínuos de servidor em nuvem 24h, banco de dados em tempo real e geração de simulados.
            </p>
          </div>

          {/* 3 Cards Informativos Obrigatórios */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
            <div className="bg-slate-900/95 border border-emerald-500/30 rounded-lg p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-300">
                <HeartHandshake className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>1. App Grátis Mantido por Você</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                O acesso aos simulados e apostilas é <strong>totalmente gratuito</strong>, sendo mantido ativo graças às colaborações dos próprios alunos (R$ 5, R$ 10 ou R$ 15).
              </p>
            </div>

            <div className="bg-slate-900/95 border border-amber-500/30 rounded-lg p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-300">
                <RefreshCw className="w-4 h-4 text-amber-400 shrink-0" />
                <span>2. Atualizações e Melhorias</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                As <strong>atualizações do programa de estudos</strong> (legislação ALEPE e novos módulos), bem como <strong>melhorias contínuas no sistema</strong>, serão efetuadas pelo <strong>Administrador do App</strong>.
              </p>
            </div>

            <div className="bg-slate-900/95 border border-sky-500/30 rounded-lg p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-sky-300">
                <UserCheck className="w-4 h-4 text-sky-400 shrink-0" />
                <span>3. Conta Gmail e Perfil Obrigatório</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                Os usuários se conectam através de suas <strong>contas Gmail (@gmail.com)</strong> e são <strong>obrigados a preencher o perfil militar completo antes de iniciar a missão</strong>.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-300">
              <Server className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">Servidor 24/7 Ativo</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-300">
              <Database className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">Programas & Melhorias</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-300">
              <MailCheck className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="truncate">Login Gmail + Perfil</span>
            </div>
          </div>
        </div>

        {/* Seleção de Opções de Colaboração: R$ 5,00 / R$ 10,00 / R$ 15,00 */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-amber-300 mb-2">
            Opções de Colaboração Voluntária para Manutenção do App (R$ 5,00 / R$ 10,00 / R$ 15,00):
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {SUPPORT_TIERS.map((tier) => {
              const isSelected = selectedAmount === tier.amount;
              return (
                <button
                  key={tier.amount}
                  type="button"
                  onClick={() => setSelectedAmount(tier.amount)}
                  className={`relative text-left p-3.5 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-400 shadow-lg shadow-amber-500/10'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-600'
                  }`}
                >
                  {tier.badge && (
                    <span
                      className={`self-start text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded mb-1.5 ${
                        isSelected
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-slate-800 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {tier.badge}
                    </span>
                  )}
                  <div>
                    <div className="flex items-baseline justify-between gap-2">
                      <span
                        className={`font-display text-xl sm:text-2xl font-extrabold ${
                          isSelected ? 'text-amber-300' : 'text-white'
                        }`}
                      >
                        {tier.label}
                      </span>
                      <span
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? 'border-amber-400 bg-amber-400 text-slate-950'
                            : 'border-slate-600'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-200 mt-1">{tier.title}</p>
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug">{tier.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Área Principal: QR Code + Chave Aleatória para Copiar */}
        <div className="bg-slate-950 border border-emerald-500/40 rounded-xl p-4 sm:p-5">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            {/* Coluna QR Code */}
            <div className="md:col-span-5 flex flex-col items-center justify-center bg-white rounded-xl p-3.5 text-slate-900 shadow-inner">
              <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-800 mb-2">
                <QrCode className="w-4 h-4 text-emerald-700" />
                <span>QR Code PIX ({ `R$ ${selectedAmount},00` })</span>
              </div>

              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <QRCodeSVG
                  value={qrValue}
                  size={156}
                  level="M"
                  includeMargin={false}
                />
              </div>

              <div className="mt-2.5 flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 w-full justify-center">
                <button
                  type="button"
                  onClick={() => setQrMode('brcode')}
                  className={`text-[10px] font-bold px-2 py-1 rounded transition cursor-pointer ${
                    qrMode === 'brcode'
                      ? 'bg-emerald-700 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  QR PIX R$ {selectedAmount},00
                </button>
                <button
                  type="button"
                  onClick={() => setQrMode('rawkey')}
                  className={`text-[10px] font-bold px-2 py-1 rounded transition cursor-pointer ${
                    qrMode === 'rawkey'
                      ? 'bg-emerald-700 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  QR Chave Pura
                </button>
              </div>
              <p className="text-[10px] text-slate-600 text-center mt-1.5 font-medium">
                Aponte a câmera do aplicativo do seu banco para colaborar
              </p>
            </div>

            {/* Coluna Área para Copiar a Chave Aleatória */}
            <div className="md:col-span-7 space-y-3.5">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                    Chave PIX Aleatória (Copie abaixo):
                  </span>
                  <span className="text-xs font-bold text-amber-300 bg-amber-950/80 border border-amber-500/40 px-2 py-0.5 rounded">
                    Valor sugerido: R$ {selectedAmount},00
                  </span>
                </div>

                {/* Caixa Destacada da Chave Aleatória */}
                <div className="bg-slate-900 border-2 border-emerald-500/60 rounded-xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                  <code className="font-mono text-xs sm:text-sm font-bold text-emerald-300 break-all select-all bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 flex-1 text-center sm:text-left">
                    {PIX_RANDOM_KEY}
                  </code>

                  <button
                    type="button"
                    onClick={handleCopyKey}
                    className={`px-4 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer shrink-0 ${
                      copiedKey
                        ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25'
                        : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md'
                    }`}
                  >
                    {copiedKey ? (
                      <>
                        <Check className="w-4 h-4 stroke-[2.5]" />
                        <span>Chave Copiada!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copiar Chave</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Botão secundário para copiar código PIX Copia e Cola com valor */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
                <span className="text-[11px] text-slate-400">
                  Prefere colar no PIX Copia e Cola já com o valor de{' '}
                  <strong className="text-slate-200">R$ {selectedAmount},00</strong>?
                </span>
                <button
                  type="button"
                  onClick={handleCopyBrCode}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-emerald-300 flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0"
                >
                  {copiedBrCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>PIX Copia e Cola Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar PIX R$ {selectedAmount},00</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 text-[11px] text-slate-300 leading-relaxed">
                <strong>Como colaborar pelo banco:</strong> Abra a área PIX do seu banco, escolha{' '}
                <span className="text-amber-300 font-semibold">Transferir com Chave Aleatória</span> (ou{' '}
                <span className="text-emerald-300 font-semibold">Ler QR Code</span>), cole a chave{' '}
                <span className="font-mono text-emerald-300">{PIX_RANDOM_KEY}</span> e confirme o apoio de{' '}
                <strong>R$ 5,00</strong>, <strong>R$ 10,00</strong> ou <strong>R$ 15,00</strong>.
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé da Janela */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400">
            *IMPORTHOUR© - todos os direitos reservados
          </span>

          {isModal && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
            >
              <span>Continuar para o App CFOA PMPE</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

interface SupportCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupportCampaignModal: React.FC<SupportCampaignModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="w-full max-w-2xl my-auto">
        <SupportCampaignCardContent onClose={onClose} isModal={true} />
      </div>
    </div>
  );
};
