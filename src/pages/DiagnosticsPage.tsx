import { AlertTriangle, CheckCircle2, Cable, FileText, LockKeyhole, Save, ShieldCheck, Stethoscope, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/ui/PageHeader';
import { Field, INPUT_CLASSES } from '@/components/ui/FormControls';
import DeviceInfoGrid from '@/components/device/DeviceInfoGrid';
import { DIAGNOSTIC_PROCEDURES, buildReportFileName, buildTechnicalReport } from '@/lib/reportBuilder';
import { saveReportFile } from '@/lib/reportFiles';
import { insertServiceRecord } from '@/lib/serviceRecords';
import { CONNECTION_MODE_INFO } from '@/lib/usb';
import { getIPhoneModelName } from '@/lib/iphoneModels';
import type { DeviceSnapshot } from '@/lib/deviceSession';
import type { PageId } from '@/lib/navigation';

interface DiagnosticsPageProps {
  snapshot: DeviceSnapshot | null;
  isDeviceConnected: boolean;
  technicianName: string;
  onNavigate: (page: PageId) => void;
  onRecordSaved: () => Promise<void>;
}

type Feedback = { tone: 'success' | 'error'; text: string };

export default function DiagnosticsPage({
  snapshot,
  isDeviceConnected,
  technicianName,
  onNavigate,
  onRecordSaved,
}: DiagnosticsPageProps) {
  const [modelInput, setModelInput] = useState('');
  const [iosInput, setIosInput] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [procedures, setProcedures] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [pendingAction, setPendingAction] = useState<'report' | 'record' | null>(null);

  useEffect(() => {
    const details = snapshot?.details;
    if (!details?.productType) {
      setModelInput('');
      return;
    }
    setModelInput(getIPhoneModelName(details.productType) ?? '');
  }, [snapshot?.details?.productType, snapshot?.details?.serialNumber]);

  if (!snapshot) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Análise"
          title="Diagnóstico"
          description="Identifique o modo do aparelho, registre o diagnóstico e gere o relatório técnico."
        />
        <Card>
          <EmptyState
            icon={Cable}
            title="Nenhum aparelho selecionado"
            description="Conecte o iPhone e escolha-o na tela de conexão para iniciar o diagnóstico."
            action={<Button onClick={() => onNavigate('connect')}>Conectar iPhone</Button>}
          />
        </Card>
      </div>
    );
  }

  const { device, details } = snapshot;
  const mode = CONNECTION_MODE_INFO[device.mode];
  const resolvedModel = modelInput.trim() || getIPhoneModelName(details?.productType) || details?.productType || '';
  const resolvedIosVersion = details?.iosVersion || iosInput.trim();
  const needsAttention = device.mode === 'recovery' || device.mode === 'dfu';
  const canSaveRecord = diagnosis.trim().length > 0 && pendingAction === null;
  const orderedProcedures = DIAGNOSTIC_PROCEDURES.filter((procedure) => procedures.includes(procedure));

  const toggleProcedure = (procedure: string) => {
    setProcedures((current) =>
      current.includes(procedure) ? current.filter((item) => item !== procedure) : [...current, procedure],
    );
  };

  const handleGenerateReport = async () => {
    setPendingAction('report');
    setFeedback(null);
    try {
      const now = new Date();
      const content = buildTechnicalReport({
        generatedAt: now,
        technicianName,
        device,
        details,
        deviceModel: resolvedModel,
        iosVersion: resolvedIosVersion,
        diagnosis: diagnosis.trim(),
        procedures: orderedProcedures,
        notes: notes.trim(),
      });
      const location = await saveReportFile(buildReportFileName(now), content);
      setFeedback({ tone: 'success', text: `Relatório técnico salvo em: ${location}` });
    } catch (error) {
      setFeedback({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Não foi possível gerar o relatório.',
      });
    } finally {
      setPendingAction(null);
    }
  };

  const handleSaveRecord = async () => {
    setPendingAction('record');
    setFeedback(null);
    try {
      await insertServiceRecord({
        deviceModel: resolvedModel || 'Não identificado',
        serialNumber: details?.serialNumber ?? null,
        iosVersion: resolvedIosVersion || null,
        connectionMode: device.mode,
        diagnosis: diagnosis.trim(),
        procedures: orderedProcedures,
        notes: notes.trim() || null,
      });
      await onRecordSaved();
      setFeedback({ tone: 'success', text: 'Atendimento registrado no histórico.' });
      setDiagnosis('');
      setNotes('');
      setProcedures([]);
    } catch (error) {
      setFeedback({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Não foi possível salvar o atendimento.',
      });
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Análise"
        title="Diagnóstico"
        description="Confira o modo do aparelho, registre o diagnóstico e gere o relatório técnico do atendimento."
        actions={
          <Button variant="secondary" onClick={() => onNavigate('connect')}>
            Trocar aparelho
          </Button>
        }
      />

      {!isDeviceConnected && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>O aparelho selecionado não está mais conectado. As informações abaixo mostram a última leitura.</p>
        </div>
      )}

      <Card className="space-y-6">
        <div className="flex items-center gap-2">
          <Stethoscope className="h-4 w-4 text-electric-400" />
          <h2 className="text-base font-semibold text-white">Modo e informações do aparelho</h2>
        </div>
        <DeviceInfoGrid device={device} details={details} deviceModel={modelInput.trim()} iosVersion={iosInput.trim()} />

        {needsAttention && (
          <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm leading-relaxed text-red-100">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Aparelho em {mode.label}. Antes de qualquer procedimento que possa apagar dados, confirme o backup e obtenha autorização explícita e por escrito do cliente.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field label="Modelo do iPhone" hint="Nome comercial. Quando disponível, o identificador técnico do aparelho aparece acima.">
            <input
              className={INPUT_CLASSES}
              placeholder="Ex.: iPhone 13 Pro"
              value={modelInput}
              onChange={(event) => setModelInput(event.target.value)}
              maxLength={80}
            />
          </Field>
          <Field label="Versão do iOS" hint="Opcional. Confirme em Ajustes do aparelho, se possível.">
            <input
              className={INPUT_CLASSES}
              placeholder="Ex.: 17.5.1"
              value={iosInput}
              onChange={(event) => setIosInput(event.target.value)}
              maxLength={20}
            />
          </Field>
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center gap-2">
          <LockKeyhole className="h-4 w-4 text-electric-400" />
          <h2 className="text-base font-semibold text-white">Verificação do código de tela</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-200">
              <CheckCircle2 className="h-4 w-4" />
              Comunicação USB
            </div>
            <p className="mt-2 text-sm text-graphite-300">
              {isDeviceConnected
                ? 'O Windows e as ferramentas autorizadas estão comunicando com o aparelho.'
                : 'O aparelho não está conectado neste momento. A última leitura é apenas informativa.'}
            </p>
          </div>
          <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-amber-200">
              <AlertTriangle className="h-4 w-4" />
              Código de 6 dígitos
            </div>
            <p className="mt-2 text-sm text-graphite-300">
              Não pode ser lido, revelado ou recuperado por conexão USB. A comunicação autorizada não significa que o código foi identificado.
            </p>
          </div>
        </div>
        <p className="flex items-start gap-2 border-t border-white/[0.06] pt-4 text-sm leading-relaxed text-graphite-300">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-electric-300" />
          <span>
            Para proteger os dados, este programa não testa combinações, não tenta contornar o bloqueio e não altera o aparelho. Evite inserir códigos aleatórios: tentativas incorretas podem aumentar o tempo de bloqueio e, conforme as configurações do iPhone, causar apagamento dos dados.
          </span>
        </p>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="space-y-5 lg:col-span-3">
          <h2 className="text-base font-semibold text-white">Diagnóstico</h2>
          <Field label="Resumo do diagnóstico *">
            <textarea
              className={`${INPUT_CLASSES} min-h-[120px] resize-y`}
              placeholder="Descreva o que foi identificado e a conclusão do atendimento."
              value={diagnosis}
              onChange={(event) => setDiagnosis(event.target.value)}
              maxLength={2000}
            />
          </Field>
          <Field label="Observações">
            <textarea
              className={`${INPUT_CLASSES} min-h-[88px] resize-y`}
              placeholder="Informações complementares para o histórico."
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              maxLength={2000}
            />
          </Field>
        </Card>

        <Card className="space-y-5 lg:col-span-2">
          <h2 className="text-base font-semibold text-white">Procedimentos realizados</h2>
          <ul className="space-y-2">
            {DIAGNOSTIC_PROCEDURES.map((procedure) => {
              const checked = procedures.includes(procedure);
              return (
                <li key={procedure}>
                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition duration-200 ${
                      checked
                        ? 'border-electric-500/40 bg-electric-500/10 text-white'
                        : 'border-white/[0.06] bg-graphite-850/60 text-graphite-300 hover:border-white/15'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 shrink-0 accent-electric-500"
                      checked={checked}
                      onChange={() => toggleProcedure(procedure)}
                    />
                    {procedure}
                  </label>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-white/[0.08] bg-graphite-900/80 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-2">
          {feedback ? (
            <p
              className={`flex items-start gap-2 text-sm ${feedback.tone === 'success' ? 'text-emerald-300' : 'text-red-300'}`}
              role="status"
            >
              {feedback.tone === 'success' ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              <span className="break-all">{feedback.text}</span>
            </p>
          ) : (
            <p className="text-sm text-graphite-400">
              {diagnosis.trim() ? 'Pronto para salvar o atendimento.' : 'Preencha o resumo do diagnóstico para registrar o atendimento.'}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={handleGenerateReport} disabled={pendingAction !== null}>
            <FileText className="h-4 w-4" />
            {pendingAction === 'report' ? 'Gerando...' : 'Gerar relatório técnico'}
          </Button>
          <Button onClick={handleSaveRecord} disabled={!canSaveRecord}>
            <Save className="h-4 w-4" />
            {pendingAction === 'record' ? 'Salvando...' : 'Registrar no histórico'}
          </Button>
        </div>
      </div>
    </div>
  );
}
