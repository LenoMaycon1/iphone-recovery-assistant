export interface RawUsbDevice {
  friendlyName: string;
  instanceId: string;
  status: string;
}

export type DriverServiceState = 'running' | 'stopped' | 'not-installed' | 'unknown';

export interface UsbScanResult {
  supported: boolean;
  devices: RawUsbDevice[];
  driverService: DriverServiceState;
  error: string | null;
}

export interface DeviceDetails {
  udid: string | null;
  deviceName: string | null;
  productType: string | null;
  serialNumber: string | null;
  iosVersion: string | null;
  passcodeConfigured: boolean | null;
  trustedHostAttached: boolean | null;
}

export type InspectionStatus =
  | 'ok'
  | 'trust-pending'
  | 'driver-missing'
  | 'tool-missing'
  | 'dll-missing'
  | 'mode-mismatch'
  | 'read-error';

export interface InspectionResult {
  status: InspectionStatus;
  details: DeviceDetails | null;
  message: string | null;
  confirmedMode: 'normal' | 'recovery' | 'dfu' | null;
}

export interface InspectionRequest {
  mode: 'normal' | 'recovery' | 'dfu' | 'unknown';
  driverService: DriverServiceState;
}

export type BackupValidation = 'validated' | 'encrypted' | 'incomplete' | 'unverified';

export interface BackupEntry {
  name: string;
  modifiedAt: string;
  validation: BackupValidation;
  missingFiles: string[];
  deviceName: string | null;
  productType: string | null;
  productVersion: string | null;
  detail: string;
}

export interface BackupScanResult {
  available: boolean;
  directory: string;
  backups: BackupEntry[];
  error: string | null;
}

export interface AppInfo {
  version: string;
  platform: string;
}

export interface RestoreStatus {
  running: boolean;
  status: 'idle' | 'running' | 'completed' | 'failed';
  message: string;
  output: string[];
  exitCode: number | null;
  startedAt: string | null;
  finishedAt: string | null;
}

export interface DesktopBridge {
  getAppInfo: () => Promise<AppInfo>;
  scanUsbDevices: () => Promise<UsbScanResult>;
  inspectDevice: (request: InspectionRequest) => Promise<InspectionResult>;
  scanBackups: () => Promise<BackupScanResult>;
  openBackupsFolder: () => Promise<{ ok: boolean; error: string | null }>;
  openOfficialRestoreGuide: () => Promise<{ opened: boolean }>;
  openAppleDevices: () => Promise<{ opened: boolean }>;
  startOfficialRestore: () => Promise<{ started: boolean; cancelled?: boolean; status?: RestoreStatus }>;
  getRestoreStatus: () => Promise<RestoreStatus>;
  getReportsDirectory: () => Promise<string>;
  chooseReportsDirectory: () => Promise<string | null>;
  saveReport: (fileName: string, content: string) => Promise<{ path: string }>;
}

declare global {
  interface Window {
    iphoneRecovery?: DesktopBridge;
  }
}
