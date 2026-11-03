import { CONNECTION_MODE_INFO, type ConnectedDevice } from '@/lib/usb';
import type { DeviceDetails } from '@/types/desktop';

export const DIAGNOSTIC_PROCEDURES = [
  'Cabo original ou certificado testado',
  'Porta USB alternativa testada',
  'Computador reiniciado e aparelho reconectado',
  'Confiança no computador confirmada no aparelho',
  'Modo do aparelho confirmado visualmente',
  'Backup verificado antes de qualquer procedimento',
  'Cliente informado sobre os riscos do atendimento',
] as const;

export interface ReportInput {
  generatedAt: Date;
  technicianName: string;
  device: ConnectedDevice | null;
  details: DeviceDetails | null;
  deviceModel: string;
  iosVersion: string;
  diagnosis: string;
  procedures: string[];
  notes: string;
}

const NOT_AVAILABLE = 'Não disponível nesta leitura';

function formatDateTime(date: Date): string {
  return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' });
}

export function buildReportFileName(date: Date): string {
  const stamp = date.toISOString().slice(0, 19).replace(/[:T]/g, '-');
  return `relatorio-tecnico_${stamp}.txt`;
}

export function buildTechnicalReport(input: ReportInput): string {
  const { device, details } = input;
  const mode = device ? CONNECTION_MODE_INFO[device.mode] : null;
  const lines = [
    'RELATÓRIO TÉCNICO - iPhone Recovery Assistant',
    '='.repeat(48),
    `Gerado em: ${formatDateTime(input.generatedAt)}`,
    `Técnico responsável: ${input.technicianName || NOT_AVAILABLE}`,
    '',
    'APARELHO',
    '-'.repeat(48),
    `Identificação USB: ${device ? device.label : NOT_AVAILABLE}`,
    `Código do produto USB: ${device ? device.productId : NOT_AVAILABLE}`,
    `Modelo do iPhone: ${input.deviceModel || NOT_AVAILABLE}`,
    `Número de série: ${details?.serialNumber ?? NOT_AVAILABLE}`,
    `Versão do iOS: ${input.iosVersion || NOT_AVAILABLE}`,
    '',
    'DIAGNÓSTICO',
    '-'.repeat(48),
    `Modo identificado: ${mode ? mode.label : NOT_AVAILABLE}`,
    `Observação: ${mode ? mode.description : NOT_AVAILABLE}`,
    `Resumo: ${input.diagnosis || NOT_AVAILABLE}`,
    '',
    'PROCEDIMENTOS REALIZADOS',
    '-'.repeat(48),
    ...(input.procedures.length > 0
      ? input.procedures.map((procedure) => `[x] ${procedure}`)
      : ['Nenhum procedimento registrado.']),
    '',
    'OBSERVAÇÕES',
    '-'.repeat(48),
    input.notes || 'Sem observações.',
    '',
    'Modo do aparelho é identificado pela conexão USB.',
    'Número de série, identificador do modelo e versão do iOS vêm das ferramentas oficiais quando disponíveis.',
    'Modelo comercial e versão do iOS também podem ser informados pelo técnico.',
  ];
  return lines.join('\r\n');
}
