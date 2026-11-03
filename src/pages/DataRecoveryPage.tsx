import { AlertTriangle, DatabaseBackup, FolderOpen, Headset, HardDrive, Cloud, RefreshCw, RefreshCcw, ShieldCheck, RotateCcw, Activity, ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/ui/PageHeader';
import { formatDateTime } from '@/lib/format';
import type { BackupScanResult, BackupValidation } from '@/types/desktop';

const BACKUP_VALIDATION_INFO: Record<BackupValidation, { label: string; tone: 'green' | 'amber' | 'red' | 'neutral' }> = {
  validated: { label: 'Backup validado', tone: 'green' },
  encrypted: { label: 'Backup criptografado', tone: 'amber' },
  incomplete: { label: 'Pasta incompleta', tone: 'red' },
  unverified: { label: 'Pasta encontrada', tone: 'neutral' },
};

const OFFICIAL_METHODS = [
  {
    icon: HardDrive,
    title: 'Backup do computador',
    text: 'Restaure pelo Finder (Mac) ou pelo iTunes/Apple Devices (Windows), escolhendo o backup local confirmado com o cliente. A restauração substitui os dados atuais do aparelho.',
  },
  {
    icon: Cloud,
    title: 'Backup do iCloud',
    text: 'Em Ajustes, toque no nome do cliente, depois em iCloud e Gerenciar armazenamento, para confirmar a data do último backup. A restauração pelo iCloud também substitui o conteúdo atual.',
  },
  {
    icon: RefreshCcw,
    title: 'Atualizar sem apagar dados',
    text: 'Em Ajustes > Geral > Atualização de Software, instale a versão disponível. Pelo Finder ou iTunes, escolha "Atualizar", nunca "Restaurar". Mantenha energia e conexão estáveis durante todo o processo.',
  },
  {
    icon: Headset,
    title: 'Suporte oficial da Apple',
    text: 'Bloqueio de Ativação, questões de conta e defeitos de hardware devem ser tratados pelo suporte oficial da Apple. Este programa não contorna essas proteções.',
  },
];

export default function DataRecoveryPage() {
  const bridgeAvailable = Boolean(window.iphoneRecovery);
  const [scan, setScan] = useState<BackupScanResult | null>(null);
  const [isLoading, setIsLoading] = useState(bridgeAvailable);
  const [openError, setOpenError] = useState<string | null>(null);
  const [restoreConsent, setRestoreConsent] = useState(false);
  const [restorePhrase, setRestorePhrase] = useState('');
  const [restoreGuideError, setRestoreGuideError] = useState<string | null>(null);
  const [openingRestoreGuide, setOpeningRestoreGuide] = useState(false);
  const [openingAppleDevices, setOpeningAppleDevices] = useState(false);
  const [appleDevicesError, setAppleDevicesError] = useState<string | null>(null);
  const [restoreStatus, setRestoreStatus] = useState<{ running: boolean; status: 'idle' | 'running' | 'completed' | 'failed'; message: string; output: string[]; exitCode: number | null; startedAt: string | null; finishedAt: string | null } | null>(null);

  useEffect(() => {
    const bridge = window.iphoneRecovery;
    if (!bridge) return;

    let active = true;
    const load = async () => {
      try {
        const result = await bridge.scanBackups();
        if (active) setScan(result);
      } catch {
        if (active) {
          setScan({ available: false, directory: '', backups: [], error: 'Não foi possível ler os backups locais.' });
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  const handleRefresh = async () => {
    const bridge = window.iphoneRecovery;
    if (!bridge) return;
    setIsLoading(true);
    try {
      setScan(await bridge.scanBackups());
    } catch {
      setScan({ available: false, directory: '', backups: [], error: 'Não foi possível ler os backups locais.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenFolder = async () => {
    const bridge = window.iphoneRecovery;
    if (!bridge) return;
    setOpenError(null);
    const result = await bridge.openBackupsFolder();
    if (!result.ok) {
      setOpenError(result.error ?? 'Não foi possível abrir a pasta de backups.');
    }
  };

  const handleOpenAppleDevices = async () => {
    const bridge = window.iphoneRecovery;
    if (!bridge) return;
    setOpeningAppleDevices(true);
    setAppleDevicesError(null);
    try {
      await bridge.openAppleDevices();
    } catch (error) {
      setAppleDevicesError(error instanceof Error ? error.message : 'Não foi possível abrir o aplicativo Dispositivos Apple.');
    } finally {
      setOpeningAppleDevices(false);
    }
  };

  const handleOpenRestoreGuide = async () => {
    const bridge = window.iphoneRecovery;
    if (!bridge || !restoreConsent || restorePhrase.trim().toUpperCase() !== 'RESTAURAR') return;
    setOpeningRestoreGuide(true);
    setRestoreGuideError(null);
    try {
      const result = await bridge.startOfficialRestore();
      if (result.started && result.status) setRestoreStatus(result.status);
    } catch (error) {
      setRestoreGuideError(error instanceof Error ? error.message : 'Não foi possível iniciar a restauração.');
    } finally {
      setOpeningRestoreGuide(false);
    }
  };

  useEffect(() => {
    const bridge = window.iphoneRecovery;
    if (!bridge || !restoreStatus?.running) return;
    let active = true;
    const timer = window.setInterval(async () => {
      try {
        const next = await bridge.getRestoreStatus();
        if (active) setRestoreStatus(next);
      } catch {
        if (active) setRestoreGuideError('Não foi possível atualizar o acompanhamento da restauração.');
      }
    }, 1500);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [restoreStatus?.running]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Proteção de dados"
        title="Recuperação de Dados"
        description="Verifique backups e, com autorização explícita, execute uma restauração oficial do iOS em aparelhos compatíveis."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="space-y-5 lg:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <DatabaseBackup className="h-4 w-4 text-electric-400" />
              <h2 className="text-base font-semibold text-white">Backups neste computador</h2>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={handleRefresh} disabled={!bridgeAvailable || isLoading}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button variant="secondary" onClick={handleOpenFolder} disabled={!bridgeAvailable}>
                <FolderOpen className="h-4 w-4" />
                Abrir pasta
              </Button>
            </div>
          </div>

          {!bridgeAvailable && (
            <EmptyState
              icon={DatabaseBackup}
              title="Verificação disponível no aplicativo desktop"
              description="A leitura dos backups locais acontece no Windows, dentro do aplicativo instalado."
            />
          )}

          {bridgeAvailable && isLoading && !scan && (
            <p className="text-sm text-graphite-400">Procurando backups locais...</p>
          )}

          {scan?.error && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{scan.error}</p>
          )}

          {scan && !scan.error && !scan.available && (
            <EmptyState
              icon={DatabaseBackup}
              title="Nenhum backup local encontrado"
              description="Não há backups do Finder ou iTunes nesta conta do Windows. Backups do iCloud não aparecem nesta lista."
            />
          )}

          {scan && scan.available && scan.backups.length > 0 && (
            <>
              <ul className="divide-y divide-white/[0.06] rounded-xl border border-white/[0.06] bg-graphite-850/60">
                {scan.backups.map((backup) => {
                  const validation = BACKUP_VALIDATION_INFO[backup.validation];
                  return (
                    <li key={backup.name} className="space-y-3 px-4 py-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <span className="truncate font-mono text-xs text-graphite-200">{backup.name}</span>
                        <Badge tone={validation.tone}>{validation.label}</Badge>
                      </div>
                      <dl className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-3">
                        <div>
                          <dt className="text-graphite-500">Aparelho</dt>
                          <dd className="text-graphite-200">{backup.deviceName ?? 'Não lido'}</dd>
                        </div>
                        <div>
                          <dt className="text-graphite-500">Modelo</dt>
                          <dd className="font-mono text-graphite-200">{backup.productType ?? 'Não lido'}</dd>
                        </div>
                        <div>
                          <dt className="text-graphite-500">Versão do iOS</dt>
                          <dd className="text-graphite-200">{backup.productVersion ?? 'Não lida'}</dd>
                        </div>
                      </dl>
                      <p className="text-xs leading-relaxed text-graphite-400">{backup.detail}</p>
                      {backup.missingFiles.length > 0 && (
                        <p className="text-xs text-amber-200">Arquivos ausentes: {backup.missingFiles.join(', ')}</p>
                      )}
                      <p className="text-[11px] text-graphite-500">
                        Última alteração da pasta: {formatDateTime(backup.modifiedAt)}
                      </p>
                    </li>
                  );
                })}
              </ul>
              <p className="text-xs leading-relaxed text-graphite-500">
                Pastas encontradas não são backups confirmados. Somente a estrutura validada passou nas leituras de identificação. Nenhum arquivo foi alterado.
              </p>
            </>
          )}

          {scan && scan.directory && (
            <p className="break-all font-mono text-[11px] text-graphite-500">Pasta verificada: {scan.directory}</p>
          )}
          {openError && <p className="text-sm text-red-300">{openError}</p>}
        </Card>

        <Card className="space-y-4 border-red-500/25 bg-red-950/20 lg:col-span-2">
          <div className="flex items-center gap-2 text-red-200">
            <AlertTriangle className="h-5 w-5" />
            <h2 className="text-base font-semibold">Antes de qualquer operação destrutiva</h2>
          </div>
          <ul className="space-y-3 text-sm leading-relaxed text-red-100/90">
            <li>Restaurar, apagar ou formatar o aparelho remove os dados atuais.</li>
            <li>Confirme que existe um backup recente e que ele foi testado.</li>
            <li>Obtenha autorização explícita e por escrito do cliente.</li>
          </ul>
          <p className="flex items-center gap-2 border-t border-red-500/20 pt-4 text-xs text-red-200/80">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            A restauração só começa após confirmação explícita e seleção do firmware.
          </p>
        </Card>
      </div>

      <Card className="space-y-5 border-red-500/30 bg-red-950/15">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-300">
            <RotateCcw className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Restaurar iPhone de fábrica</h2>
            <p className="text-sm text-graphite-400">Último recurso quando o código de tela foi esquecido.</p>
          </div>
        </div>
        <div className="rounded-xl border border-red-500/25 bg-red-500/[0.06] p-4 text-sm leading-relaxed text-red-100">
          <p className="font-semibold">Atenção: a restauração apaga o conteúdo e os ajustes do iPhone.</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-red-100/85">
            <li>Fotos, mensagens e arquivos sem backup serão perdidos.</li>
            <li>O Bloqueio de Ativação pode continuar exigindo a Conta Apple vinculada ao aparelho.</li>
            <li>Tenha um backup confirmado e a autorização do proprietário antes de prosseguir.</li>
          </ul>
        </div>
        <label className="flex cursor-pointer items-start gap-3 text-sm text-graphite-200">
          <input type="checkbox" className="mt-1 h-4 w-4 accent-red-500" checked={restoreConsent} onChange={(event) => setRestoreConsent(event.target.checked)} />
          <span>Confirmo que o proprietário autorizou a restauração e que existe backup confirmado ou que ele aceita perder os dados locais sem backup.</span>
        </label>
        <div className="max-w-sm space-y-2">
          <label htmlFor="restore-confirmation" className="text-xs font-medium text-graphite-400">Digite RESTAURAR para confirmar</label>
          <input id="restore-confirmation" className="w-full rounded-xl border border-white/10 bg-graphite-900 px-3 py-2.5 text-sm text-white outline-none focus:border-red-400" value={restorePhrase} onChange={(event) => setRestorePhrase(event.target.value)} placeholder="RESTAURAR" autoComplete="off" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={handleOpenAppleDevices} disabled={!bridgeAvailable || openingAppleDevices}>
            <ExternalLink className="h-4 w-4" />
            {openingAppleDevices ? 'Abrindo...' : 'Abrir Dispositivos Apple'}
          </Button>
          <Button variant="primary" className="bg-red-600 hover:bg-red-500 active:bg-red-700" onClick={handleOpenRestoreGuide} disabled={!bridgeAvailable || !restoreConsent || restorePhrase.trim().toUpperCase() !== 'RESTAURAR' || openingRestoreGuide || Boolean(restoreStatus?.running)}>
            <RotateCcw className="h-4 w-4" />
            {openingRestoreGuide ? 'Preparando...' : restoreStatus?.running ? 'Restauração em andamento' : 'Selecionar firmware e restaurar'}
          </Button>
          <p className="text-xs text-graphite-500">Selecione um arquivo IPSW oficial. O programa confirma o modo Recovery/DFU e pede uma segunda confirmação antes de apagar.</p>
        </div>
        {appleDevicesError && <p role="alert" className="text-sm text-red-300">{appleDevicesError}</p>}
        {restoreGuideError && <p role="alert" className="text-sm text-red-300">{restoreGuideError}</p>}
        {restoreStatus && restoreStatus.status !== 'idle' && (
          <div className="space-y-3 rounded-xl border border-white/10 bg-graphite-900/70 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Activity className={`h-4 w-4 ${restoreStatus.running ? 'animate-pulse text-amber-300' : restoreStatus.status === 'completed' ? 'text-emerald-300' : 'text-red-300'}`} />
              {restoreStatus.running ? 'Restauração em andamento' : restoreStatus.status === 'completed' ? 'Comando de restauração concluído' : 'Restauração interrompida ou com erro'}
            </div>
            <p className="text-sm text-graphite-300">{restoreStatus.message}</p>
            {restoreStatus.output.length > 0 && <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-black/40 p-3 font-mono text-[11px] text-graphite-300">{restoreStatus.output.join('\n')}</pre>}
            {restoreStatus.status === 'completed' && <p className="text-xs text-amber-200">Confirme no próprio iPhone se apareceu a tela de configuração. O término do processo não remove o Bloqueio de Ativação.</p>}
          </div>
        )}
      </Card>

      <section className="space-y-4">
        <h2 className="text-base font-semibold text-white">Métodos oficiais de recuperação</h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {OFFICIAL_METHODS.map((method) => {
            const Icon = method.icon;
            return (
              <Card key={method.title} interactive className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-electric-500/12 text-electric-300">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-white">{method.title}</h3>
                  <p className="text-sm leading-relaxed text-graphite-300">{method.text}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
