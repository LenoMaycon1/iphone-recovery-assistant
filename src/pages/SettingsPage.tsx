import { FolderCog, Info, Monitor, Radio, UserRound } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import { Field, INPUT_CLASSES, Toggle } from '@/components/ui/FormControls';
import type { Preferences } from '@/lib/preferences';

const REFRESH_OPTIONS = [3, 5, 10, 30];

interface SettingsPageProps {
  appVersion: string;
  platform: string;
  preferences: Preferences;
  onUpdatePreferences: (patch: Partial<Preferences>) => void;
}

function SettingsRow({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-t border-white/[0.06] pt-5 first:border-t-0 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-medium text-white">{title}</p>
        <p className="text-sm text-graphite-400">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function SettingsPage({ appVersion, platform, preferences, onUpdatePreferences }: SettingsPageProps) {
  const bridge = window.iphoneRecovery;
  const [reportsDirectory, setReportsDirectory] = useState<string | null>(null);
  const [directoryError, setDirectoryError] = useState<string | null>(null);

  useEffect(() => {
    if (!bridge) return;
    bridge
      .getReportsDirectory()
      .then(setReportsDirectory)
      .catch(() => setDirectoryError('Não foi possível ler a pasta de relatórios.'));
  }, [bridge]);

  const handleChooseDirectory = async () => {
    if (!bridge) return;
    setDirectoryError(null);
    try {
      const selected = await bridge.chooseReportsDirectory();
      if (selected) setReportsDirectory(selected);
    } catch {
      setDirectoryError('Não foi possível alterar a pasta de relatórios.');
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Sistema"
        title="Configurações"
        description="Ajuste a detecção USB, a pasta dos relatórios e as preferências do técnico."
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="space-y-5">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-electric-400" />
            <h2 className="text-base font-semibold text-white">Informações do programa</h2>
          </div>
          <dl className="space-y-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-graphite-400">Nome</dt>
              <dd className="text-right text-white">iPhone Recovery Assistant</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-graphite-400">Versão</dt>
              <dd className="font-mono text-white">{appVersion}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-graphite-400">Ambiente</dt>
              <dd className="text-right text-white">{bridge ? `Aplicativo desktop (${platform})` : 'Visualização no navegador'}</dd>
            </div>
          </dl>
          <p className="text-xs leading-relaxed text-graphite-500">
            Este programa identifica o modo do aparelho pela conexão USB e não executa restaurações, apagamentos ou desbloqueios.
          </p>
        </Card>

        <Card className="space-y-6">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-electric-400" />
            <h2 className="text-base font-semibold text-white">Configuração USB</h2>
          </div>
          <SettingsRow
            title="Atualização automática"
            description="Consulta periodicamente os dispositivos Apple conectados."
          >
            <Toggle
              label="Atualização automática"
              checked={preferences.autoRefresh}
              onChange={(autoRefresh) => onUpdatePreferences({ autoRefresh })}
            />
          </SettingsRow>
          <SettingsRow title="Intervalo de verificação" description="Tempo entre cada consulta ao Windows.">
            <select
              className={`${INPUT_CLASSES} w-auto py-2 pr-9`}
              value={preferences.refreshSeconds}
              disabled={!preferences.autoRefresh}
              onChange={(event) => onUpdatePreferences({ refreshSeconds: Number(event.target.value) })}
            >
              {REFRESH_OPTIONS.map((seconds) => (
                <option key={seconds} value={seconds}>
                  A cada {seconds} segundos
                </option>
              ))}
            </select>
          </SettingsRow>
        </Card>

        <Card className="space-y-5">
          <div className="flex items-center gap-2">
            <FolderCog className="h-4 w-4 text-electric-400" />
            <h2 className="text-base font-semibold text-white">Diretório de relatórios</h2>
          </div>
          {bridge ? (
            <>
              <p className="break-all rounded-xl border border-white/[0.06] bg-graphite-850/70 p-4 font-mono text-xs text-graphite-200">
                {reportsDirectory ?? 'Carregando...'}
              </p>
              <Button variant="secondary" onClick={handleChooseDirectory}>
                <FolderCog className="h-4 w-4" />
                Alterar pasta
              </Button>
            </>
          ) : (
            <p className="text-sm leading-relaxed text-graphite-400">
              Nesta visualização, os relatórios são baixados pelo navegador. No aplicativo desktop, você escolhe a pasta onde eles são salvos.
            </p>
          )}
          {directoryError && <p className="text-sm text-red-300">{directoryError}</p>}
        </Card>

        <Card className="space-y-5">
          <div className="flex items-center gap-2">
            <UserRound className="h-4 w-4 text-electric-400" />
            <h2 className="text-base font-semibold text-white">Preferências</h2>
          </div>
          <Field label="Nome do técnico" hint="Aparece no cabeçalho dos relatórios técnicos.">
            <input
              className={INPUT_CLASSES}
              placeholder="Ex.: Carlos Silva"
              value={preferences.technicianName}
              maxLength={80}
              onChange={(event) => onUpdatePreferences({ technicianName: event.target.value })}
            />
          </Field>
          <div className="flex items-center gap-2 text-xs text-graphite-500">
            <Monitor className="h-3.5 w-3.5" />
            As preferências são salvas automaticamente neste computador.
          </div>
        </Card>
      </div>
    </div>
  );
}
