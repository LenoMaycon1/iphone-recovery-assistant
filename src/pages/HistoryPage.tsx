import { ClipboardList, Search, Smartphone } from 'lucide-react';
import { useMemo, useState } from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/ui/PageHeader';
import { INPUT_CLASSES } from '@/components/ui/FormControls';
import { formatDateTime } from '@/lib/format';
import { CONNECTION_MODE_INFO } from '@/lib/usb';
import type { ServiceRecord } from '@/lib/serviceRecords';

interface HistoryPageProps {
  records: ServiceRecord[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

function matchesQuery(record: ServiceRecord, query: string): boolean {
  const haystack = [record.deviceModel, record.serialNumber, record.diagnosis, record.notes, ...record.procedures]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(query);
}

export default function HistoryPage({ records, isLoading, error, onRetry }: HistoryPageProps) {
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLowerCase();

  const filteredRecords = useMemo(
    () => (normalizedQuery ? records.filter((record) => matchesQuery(record, normalizedQuery)) : records),
    [records, normalizedQuery],
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Registros"
        title="Histórico"
        description="Consulte os aparelhos atendidos, com data, modelo, diagnóstico e procedimentos realizados."
      />

      <Card className="space-y-6">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-graphite-500" />
          <input
            type="search"
            className={`${INPUT_CLASSES} pl-11`}
            placeholder="Buscar por modelo, série, diagnóstico ou procedimento"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Buscar no histórico"
          />
        </div>

        {isLoading && <p className="text-sm text-graphite-400">Carregando histórico...</p>}

        {!isLoading && error && (
          <div className="flex flex-col items-start gap-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-red-200">{error}</p>
            <Button variant="secondary" onClick={onRetry}>Tentar novamente</Button>
          </div>
        )}

        {!isLoading && !error && records.length === 0 && (
          <EmptyState
            icon={ClipboardList}
            title="Nenhum atendimento registrado"
            description="Ao registrar um diagnóstico, ele aparece nesta lista com todas as informações do atendimento."
          />
        )}

        {!isLoading && !error && records.length > 0 && filteredRecords.length === 0 && (
          <EmptyState
            icon={Search}
            title="Nenhum resultado encontrado"
            description="Tente outro termo de busca ou limpe o campo para ver todos os atendimentos."
          />
        )}

        {!isLoading && !error && filteredRecords.length > 0 && (
          <ul className="space-y-4">
            {filteredRecords.map((record) => {
              const mode = CONNECTION_MODE_INFO[record.connectionMode];
              return (
                <li
                  key={record.id}
                  className="space-y-4 rounded-2xl border border-white/[0.08] bg-graphite-850/60 p-5 transition duration-300 hover:border-electric-500/30 animate-fade-in"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-electric-500/12 text-electric-300">
                        <Smartphone className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">{record.deviceModel}</p>
                        <p className="text-xs text-graphite-400">{formatDateTime(record.attendedAt)}</p>
                      </div>
                    </div>
                    <Badge tone={mode.tone}>{mode.label}</Badge>
                  </div>

                  <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-graphite-500">Série</dt>
                      <dd className="font-mono text-graphite-200">{record.serialNumber ?? 'Não disponível'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-graphite-500">iOS</dt>
                      <dd className="font-mono text-graphite-200">{record.iosVersion ?? 'Não informado'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-graphite-500">Procedimentos</dt>
                      <dd className="text-graphite-200">{record.procedures.length}</dd>
                    </div>
                  </dl>

                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-wider text-graphite-500">Diagnóstico</p>
                    <p className="text-sm leading-relaxed text-graphite-200">{record.diagnosis}</p>
                  </div>

                  {record.procedures.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {record.procedures.map((procedure) => (
                        <span
                          key={procedure}
                          className="rounded-lg border border-white/[0.08] bg-graphite-800/80 px-2.5 py-1 text-xs text-graphite-300"
                        >
                          {procedure}
                        </span>
                      ))}
                    </div>
                  )}

                  {record.notes && (
                    <p className="border-t border-white/[0.06] pt-3 text-sm text-graphite-400">Observações: {record.notes}</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
