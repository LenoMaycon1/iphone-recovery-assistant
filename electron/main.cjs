
const { app, BrowserWindow, dialog, session, shell } = require('electron');
const path = require('node:path');
const { execFile } = require('node:child_process');
const fs = require('node:fs/promises');

const { scanUsbDevices, inspectDevice } = require('./usb.cjs');
const { scanBackups, backupsDirectory } = require('./backups.cjs');
const { ValidationError, handleIpc, requireString } = require('./ipc.cjs');
const { devServerUrl, isAppUrl } = require('./app-url.cjs');
const { startOfficialRestore, getRestoreStatus } = require('./restore.cjs');

const APP_FOLDER_NAME = 'iPhone Recovery Assistant';
const MAX_REPORT_CHARS = 2 * 1024 * 1024;
const MAX_FILE_NAME_CHARS = 120;

function settingsFilePath() {
  return path.join(app.getPath('userData'), 'settings.json');
}

async function readSettings() {
  try {
    return JSON.parse(await fs.readFile(settingsFilePath(), 'utf8'));
  } catch {
    return {};
  }
}

async function writeSettings(patch) {
  const next = { ...(await readSettings()), ...patch };
  await fs.mkdir(app.getPath('userData'), { recursive: true });
  await fs.writeFile(settingsFilePath(), JSON.stringify(next, null, 2), 'utf8');
}

async function resolveReportsDirectory() {
  const { reportsDirectory } = await readSettings();

  if (
    typeof reportsDirectory === 'string' &&
    path.isAbsolute(reportsDirectory)
  ) {
    return reportsDirectory;
  }

  return path.join(
    app.getPath('documents'),
    APP_FOLDER_NAME,
    'Relatorios'
  );
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 720,
    backgroundColor: '#08090B',
    title: 'iPhone Recovery Assistant',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  const url = devServerUrl();

  const loading = url
    ? window.loadURL(url)
    : window.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));

  loading.catch((error) => {
    console.error('[window] Falha ao carregar a interface:', error);
  });
}

app.on('web-contents-created', (_event, contents) => {
  contents.setWindowOpenHandler(() => ({ action: 'deny' }));

  contents.on('will-navigate', (event, url) => {
    if (!isAppUrl(url)) event.preventDefault();
  });
});

// Informações do aplicativo
handleIpc('app:info', () => ({
  version: app.getVersion(),
  platform: process.platform,
}));

// Diagnóstico USB
handleIpc('usb:scan', () => scanUsbDevices());

handleIpc('device:inspect', (_event, request) =>
  inspectDevice(request)
);

// Backups
handleIpc('backups:scan', () => scanBackups());

handleIpc('backups:open', async () => {
  const error = await shell.openPath(backupsDirectory());

  return {
    ok: error === '',
    error: error || null,
  };
});

// Instruções oficiais da Apple
handleIpc('restore:openOfficialGuide', async () => {
  await shell.openExternal(
    'https://support.apple.com/pt-br/118430'
  );

  return { opened: true };
});

// Abrir Dispositivos Apple no Windows
handleIpc('app:openAppleDevices', async () => {
  if (process.platform !== 'win32') {
    throw new Error(
      'O aplicativo Dispositivos Apple só pode ser aberto no Windows.'
    );
  }

  const script = [
    "$app = Get-StartApps | Where-Object { $_.Name -like '*Apple*' -or $_.Name -like '*Dispositivos Apple*' } | Select-Object -First 1",
    "if ($null -eq $app) { Write-Output 'APP_NOT_FOUND'; exit 2 }",
    "Start-Process -FilePath 'explorer.exe' -ArgumentList ('shell:AppsFolder\\' + $app.AppID)",
    "Write-Output 'OPENED'"
  ].join('; ');

  return new Promise((resolve, reject) => {
    execFile(
      'powershell.exe',
      [
        '-NoProfile',
        '-NonInteractive',
        '-ExecutionPolicy',
        'Bypass',
        '-Command',
        script
      ],
      {
        windowsHide: true,
        timeout: 15000,
        maxBuffer: 1024 * 1024
      },
      (error, stdout, stderr) => {
        const output = String(stdout || '');

        if (output.includes('APP_NOT_FOUND')) {
          reject(
            new Error(
              'Dispositivos Apple não encontrado. Instale pela Microsoft Store.'
            )
          );
          return;
        }

        if (error) {
          console.error('[Apple Devices]', stderr || error.message);

          reject(
            new Error(
              'Não foi possível abrir o aplicativo Dispositivos Apple.'
            )
          );
          return;
        }

        resolve({ opened: true });
      }
    );
  });
});

// Restauração
handleIpc('restore:start', () => startOfficialRestore());

handleIpc('restore:status', () => getRestoreStatus());

// Diretório dos relatórios
handleIpc('reports:getDirectory', () =>
  resolveReportsDirectory()
);

handleIpc('reports:chooseDirectory', async (event) => {
  const owner = BrowserWindow.fromWebContents(event.sender);

  const result = await dialog.showOpenDialog(owner, {
    title: 'Escolha a pasta dos relatórios',
    properties: ['openDirectory', 'createDirectory'],
    defaultPath: await resolveReportsDirectory(),
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const directory = result.filePaths[0];

  await writeSettings({ reportsDirectory: directory });

  return directory;
});

// Salvar relatórios
handleIpc('reports:save', async (_event, fileName, content) => {
  requireString(
    fileName,
    'Nome do arquivo',
    MAX_FILE_NAME_CHARS
  );

  requireString(
    content,
    'Conteúdo do relatório',
    MAX_REPORT_CHARS
  );

  const safeName = path
    .basename(fileName)
    .replace(/[^a-zA-Z0-9._-]/g, '_');

  if (!safeName.endsWith('.txt')) {
    throw new ValidationError('Nome do arquivo inválido.');
  }

  const directory = await resolveReportsDirectory();

  await fs.mkdir(directory, { recursive: true });

  const filePath = path.join(directory, safeName);

  await fs.writeFile(
    filePath,
    `\uFEFF${content}`,
    'utf8'
  );

  return { path: filePath };
});

// Instância única do aplicativo
const hasLock = app.requestSingleInstanceLock();

if (!hasLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const [window] = BrowserWindow.getAllWindows();

    if (window) {
      if (window.isMinimized()) window.restore();
      window.focus();
    }
  });

  app.whenReady().then(() => {
    session.defaultSession.setPermissionRequestHandler(
      (_contents, _permission, callback) => callback(false)
    );

    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });
}

app.on('window-all-closed', () => {
  app.quit();
});
