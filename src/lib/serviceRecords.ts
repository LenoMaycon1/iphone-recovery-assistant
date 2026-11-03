import { supabase } from '@/lib/supabase';
import type { ConnectionMode } from '@/lib/usb';

export interface ServiceRecord {
  id: string;
  attendedAt: string;
  deviceModel: string;
  serialNumber: string | null;
  iosVersion: string | null;
  connectionMode: ConnectionMode;
  diagnosis: string;
  procedures: string[];
  notes: string | null;
}

export interface NewServiceRecord {
  deviceModel: string;
  serialNumber: string | null;
  iosVersion: string | null;
  connectionMode: ConnectionMode;
  diagnosis: string;
  procedures: string[];
  notes: string | null;
}

interface ServiceRecordRow {
  id: string;
  attended_at: string;
  device_model: string;
  serial_number: string | null;
  ios_version: string | null;
  connection_mode: ConnectionMode;
  diagnosis: string;
  procedures: string[];
  notes: string | null;
}

function toServiceRecord(row: ServiceRecordRow): ServiceRecord {
  return {
    id: row.id,
    attendedAt: row.attended_at,
    deviceModel: row.device_model,
    serialNumber: row.serial_number,
    iosVersion: row.ios_version,
    connectionMode: row.connection_mode,
    diagnosis: row.diagnosis,
    procedures: row.procedures ?? [],
    notes: row.notes,
  };
}

export async function fetchServiceRecords(): Promise<ServiceRecord[]> {
  const { data, error } = await supabase
    .from('service_records')
    .select('id, attended_at, device_model, serial_number, ios_version, connection_mode, diagnosis, procedures, notes')
    .order('attended_at', { ascending: false })
    .limit(500);

  if (error || !Array.isArray(data)) {
    throw new Error('Não foi possível carregar o histórico de atendimentos.');
  }

  return (data as ServiceRecordRow[]).map(toServiceRecord);
}

export async function insertServiceRecord(record: NewServiceRecord): Promise<void> {
  const { error } = await supabase.from('service_records').insert({
    device_model: record.deviceModel,
    serial_number: record.serialNumber,
    ios_version: record.iosVersion,
    connection_mode: record.connectionMode,
    diagnosis: record.diagnosis,
    procedures: record.procedures,
    notes: record.notes,
  });

  if (error) {
    throw new Error('Não foi possível salvar o atendimento no histórico.');
  }
}
