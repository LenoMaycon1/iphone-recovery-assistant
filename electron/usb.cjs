const { app } = require('electron');
const path = require('node:path');
const fs = require('node:fs/promises');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const { parseTopLevelStrings } = require('./plist.cjs');
const { ValidationError } = require('./ipc.cjs');

const execFileAsync = promisify(execFile);

const UDID_PATTERN = /^[0-9A-Za-z-]{8,64}$/;
const LOCKDOWN_PATTERN = /lockdown|pair|trust|dialog|password|locked/i;
const CONNECTION_MODES = ['normal', 'recovery', 'dfu', 'unknown'];
const DRIVER_SERVICE_STATES = ['running', 'stopped', 'not-installed', 'unknown'];
const SERVICE_STATE_NAMES = {
  Running: 'running',
  Stopped: 'stopped',
  NotInstalled: 'not-installed',
};
const TOOL_OUTPUT_LIMIT = 4 * 1024 * 1024;
const TOOL_TIMEOUT_MS = 20000;
const DLL_NOT_FOUND_EXIT_CODES = new Set([0xc0000135, -1073741515]);
const MODE_LABELS = { normal: 'modo normal', recovery: 'Recovery', dfu: 'DFU' };

const USB_SCAN_SCRIPT = `
$ErrorActionPreference = 'SilentlyContinue'
$devices = @(Get-PnpDevice -PresentOnly |
  Where-Object { $_.InstanceId -like 'USB\\VID_05AC*' } |
  Select-Object FriendlyName, InstanceId, Status)
$service = Get-Service -Name 'Apple Mobile Device Service'
$serviceState = if ($service) { [string]$service.Status } else { 'NotInstalled' }
ConvertTo-Json -InputObject ([PSCustomObject]@{ devices = $devices; service = $serviceState }) -Compress -Depth 4
`;

const ENCODED_USB_SCAN_SCRIPT = Buffer.from(USB_SCAN_SCRIPT, 'utf16le').toString('base64');

const DRIVER_MESSAGES = {
  'not-installed':
    'O serviço Apple Mobile Device não está instalado. Instale o Apple Devices (Microsoft Store) ou o iTunes da Apple e reconecte o aparelho.',
  stopped:
    'O serviço Apple Mobile Device está parado. Abra o Apple Devices, reinicie o Windows e reconecte o aparelho.',
  unknown:
    'Não foi possível verificar o serviço Apple Mobile Device. Confirme se o Apple Devices ou o iTunes está instalado.',
};

function toArray(value) {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

function parseKeyValueLines(text) {
  const values = {};
  for (const line of text.split(/\r?\n/)) {
    const separator = line.indexOf(':');
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    if (key && !(key in values)) values[key] = line.slice(separator + 1).trim();
  }
  return values;
}

function parseBooleanValue(value) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (['true', 'yes', '1'].includes(normalized)) return true;
  if (['false', 'no', '0'].includes(normalized)) return false;
  return null;
}

function toolsDirectory() {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'tools')
    : path.join(__dirname, '..', 'tools');
}

async function runTool(name, args) {
  const toolPath = path.join(toolsDirectory(), `${name}.exe`);
  try {
    await fs.access(toolPath);
  } catch {
    return { kind: 'missing' };
  }

  try {
    const { stdout } = await execFileAsync(toolPath, args, {
      windowsHide: true,
      timeout: TOOL_TIMEOUT_MS,
      maxBuffer: TOOL_OUTPUT_LIMIT,
    });
    return { kind: 'ok', output: stdout };
  } catch (error) {
    if (DLL_NOT_FOUND_EXIT_CODES.has(error.code)) return { kind: 'dll-missing' };
    return {
      kind: 'failed',
      output: `${error.stdout ?? ''}\n${error.stderr ?? ''}\n${error.message ?? ''}`,
    };
  }
}

function result(status, details, message, confirmedMode = null) {
  return { status, details: details ?? null, message: message ?? null, confirmedMode };
}

function toolProblem(outcome, name) {
  if (outcome.kind === 'missing') {
    return result(
      'tool-missing',
      null,
      `Componente necessário ausente: ${name}.exe. Coloque as ferramentas libimobiledevice na pasta tools do programa (veja tools/README.md).`,
    );
  }
  if (outcome.kind === 'dll-missing') {
    return result(
      'dll-missing',
      null,
      `Uma DLL necessária para ${name}.exe não foi encontrada. Copie para a pasta tools todas as DLLs que acompanham a ferramenta (veja tools/README.md).`,
    );
  }
  return null;
}

function unconfirmed(requestedMode, status, detail, details = null) {
  return result(
    status,
    details,
    `Identificado pela porta USB como ${MODE_LABELS[requestedMode]}, mas ainda não confirmado. ${detail}`,
  );
}

async function inspectNormalDevice(driverService) {
  const list = await runTool('idevice_id', ['-l']);
  const problem = toolProblem(list, 'idevice_id');
  if (problem) return problem;
  if (list.kind === 'failed') {
    return result('read-error', null, 'Não foi possível consultar os aparelhos pelo serviço Apple.');
  }

  const udid = list.output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => UDID_PATTERN.test(line));

  if (!udid) {
    if (driverService !== 'running') {
      return result('driver-missing', null, DRIVER_MESSAGES[driverService] ?? DRIVER_MESSAGES.unknown);
    }
    return result(
      'read-error',
      null,
      'O Windows reconhece o aparelho, mas o serviço Apple ainda não o liberou. Desbloqueie o iPhone e reconecte o cabo.',
    );
  }

  const info = await runTool('ideviceinfo', ['-u', udid, '-x']);
  const infoProblem = toolProblem(info, 'ideviceinfo');
  if (infoProblem) return infoProblem;
  if (info.kind === 'failed' || !info.output.includes('<plist')) {
    const needsTrust = LOCKDOWN_PATTERN.test(info.output);
    const message = needsTrust
      ? 'Desbloqueie o iPhone e toque em "Confiar" quando ele perguntar se deve confiar neste computador.'
      : 'Não foi possível ler as informações do aparelho. Desbloqueie o iPhone e reconecte o cabo.';
    return result(needsTrust ? 'trust-pending' : 'read-error', null, message);
  }

  const values = parseTopLevelStrings(info.output);
  return result(
    'ok',
    {
      udid,
      deviceName: values.DeviceName || null,
      productType: values.ProductType || null,
      serialNumber: values.SerialNumber || null,
      iosVersion: values.ProductVersion || null,
      passcodeConfigured: parseBooleanValue(values.PasswordProtected),
      trustedHostAttached: parseBooleanValue(values.TrustedHostAttached),
    },
    null,
    'normal',
  );
}

function modeFromIrecovery(value) {
  const normalized = (value ?? '').trim().toLowerCase();
  if (normalized === 'recovery') return 'recovery';
  if (normalized === 'dfu') return 'dfu';
  return null;
}

async function inspectRecoveryDevice(requestedMode) {
  const info = await runTool('irecovery', ['-q']);
  const problem = toolProblem(info, 'irecovery');
  if (problem) return unconfirmed(requestedMode, problem.status, problem.message);
  if (info.kind === 'failed') {
    return unconfirmed(
      requestedMode,
      'read-error',
      'A ferramenta irecovery não conseguiu ler o aparelho. Verifique o cabo e o driver USB da Apple.',
    );
  }

  const values = parseKeyValueLines(info.output);
  const details = {
    udid: null,
    deviceName: null,
    productType: values.PRODUCT || null,
    serialNumber: values.SRNM || null,
    iosVersion: null,
  };
  const reportedMode = modeFromIrecovery(values.MODE);

  if (!reportedMode) {
    return unconfirmed(requestedMode, 'read-error', 'A ferramenta irecovery não informou o modo do aparelho.', details);
  }
  if (reportedMode !== requestedMode) {
    return result(
      'mode-mismatch',
      details,
      `A porta USB indica ${MODE_LABELS[requestedMode]}, mas a ferramenta informa ${MODE_LABELS[reportedMode]}. Nenhum modo foi confirmado.`,
    );
  }
  return result('ok', details, null, reportedMode);
}

async function scanUsbDevices() {
  if (process.platform !== 'win32') {
    return {
      supported: false,
      devices: [],
      driverService: 'unknown',
      error: 'A detecção USB está disponível apenas no Windows.',
    };
  }

  try {
    const { stdout } = await execFileAsync(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', ENCODED_USB_SCAN_SCRIPT],
      { windowsHide: true, timeout: 15000, maxBuffer: TOOL_OUTPUT_LIMIT },
    );
    const parsed = JSON.parse(stdout.trim() || '{}');
    return {
      supported: true,
      devices: toArray(parsed.devices).map((device) => ({
        friendlyName: String(device.FriendlyName ?? ''),
        instanceId: String(device.InstanceId ?? ''),
        status: String(device.Status ?? ''),
      })),
      driverService: SERVICE_STATE_NAMES[parsed.service] ?? 'unknown',
      error: null,
    };
  } catch {
    return {
      supported: true,
      devices: [],
      driverService: 'unknown',
      error: 'Não foi possível consultar os dispositivos USB do Windows.',
    };
  }
}

function validateInspectionRequest(request) {
  if (!request || typeof request !== 'object') throw new ValidationError('Pedido de leitura inválido.');
  if (!CONNECTION_MODES.includes(request.mode)) throw new ValidationError('Modo de conexão inválido.');
  if (!DRIVER_SERVICE_STATES.includes(request.driverService)) {
    throw new ValidationError('Estado do serviço Apple inválido.');
  }
  return request;
}

async function inspectDevice(rawRequest) {
  const request = validateInspectionRequest(rawRequest);
  if (request.mode === 'recovery' || request.mode === 'dfu') {
    return inspectRecoveryDevice(request.mode);
  }
  return inspectNormalDevice(request.driverService);
}

module.exports = { scanUsbDevices, inspectDevice };
