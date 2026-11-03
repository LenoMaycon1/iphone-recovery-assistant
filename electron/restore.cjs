const { app, BrowserWindow, dialog } = require('electron');
const path = require('node:path');
const fs = require('node:fs/promises');
const { spawn, execFile } = require('node:child_process');
const { promisify } = require('node:util');
const { ValidationError } = require('./ipc.cjs');

const execFileAsync = promisify(execFile);
let activeChild = null;
let state = {
  running: false,
  status: 'idle',
  message: 'Nenhuma restauração iniciada.',
  output: [],
  exitCode: null,
  startedAt: null,
  finishedAt: null,
};

function toolsDirectory() {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'tools')
    : path.join(__dirname, '..', 'tools');
}

function snapshot() {
  return { ...state, output: [...state.output] };
}

function appendOutput(chunk) {
  const lines = String(chunk).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return;
  state.output = [...state.output, ...lines].slice(-12);
  state.message = lines[lines.length - 1].slice(0, 240);
}

async function startOfficialRestore() {
  if (process.platform !== 'win32') throw new ValidationError('A restauração assistida está disponível apenas no Windows.');
  if (state.running) throw new ValidationError('Já existe uma restauração em andamento.');

  const owner = BrowserWindow.getAllWindows()[0];
  const toolPath = path.join(toolsDirectory(), 'idevicerestore.exe');
  const recoveryToolPath = path.join(toolsDirectory(), 'irecovery.exe');
  try {
    await fs.access(toolPath);
    await fs.access(recoveryToolPath);
  } catch {
    throw new ValidationError('Ferramentas ausentes. Copie idevicerestore.exe, irecovery.exe e as DLLs necessárias para a pasta tools do programa.');
  }

  let recoveryInfo;
  try {
    const result = await execFileAsync(recoveryToolPath, ['-q'], {
      windowsHide: true,
      timeout: 10000,
      maxBuffer: 1024 * 1024,
      cwd: toolsDirectory(),
    });
    recoveryInfo = result.stdout || '';
  } catch (error) {
    throw new ValidationError(`Não foi possível consultar o iPhone em modo de recuperação. Verifique cabo e driver Apple. ${String(error.stderr || error.message || '').slice(0, 240)}`);
  }

  if (!/MODE\s*:\s*(Recovery|DFU)/i.test(recoveryInfo)) {
    throw new ValidationError('Nenhum iPhone em Recovery/DFU foi confirmado. Coloque o aparelho no modo de recuperação e tente novamente.');
  }

  const selection = await dialog.showOpenDialog(owner, {
    title: 'Selecione o firmware oficial do iPhone (.ipsw)',
    properties: ['openFile'],
    filters: [{ name: 'Firmware iPhone', extensions: ['ipsw'] }],
  });
  if (selection.canceled || selection.filePaths.length === 0) return { started: false, cancelled: true };
  const ipswPath = selection.filePaths[0];
  if (path.extname(ipswPath).toLowerCase() !== '.ipsw') throw new ValidationError('Selecione um arquivo de firmware .ipsw.');
  const fileInfo = await fs.stat(ipswPath);
  if (!fileInfo.isFile() || fileInfo.size < 100 * 1024 * 1024) {
    throw new ValidationError('O arquivo IPSW parece incompleto ou inválido. Baixe novamente o firmware oficial.');
  }

  const confirmation = await dialog.showMessageBox(owner, {
    type: 'warning',
    buttons: ['Cancelar', 'Apagar e restaurar'],
    defaultId: 0,
    cancelId: 0,
    noLink: true,
    title: 'Confirmar apagamento total do iPhone',
    message: 'A restauração apagará todos os dados locais do iPhone.',
    detail: 'O programa enviará o firmware selecionado ao dispositivo em Recovery/DFU. Use somente firmware oficial assinado pela Apple. O Bloqueio de Ativação não será removido e poderá exigir a Conta Apple vinculada. Esta ação não pode ser desfeita.',
  });
  if (confirmation.response !== 1) return { started: false, cancelled: true };

  state = {
    running: true,
    status: 'running',
    message: 'Iniciando restauração. Não desconecte o cabo nem desligue o computador.',
    output: [],
    exitCode: null,
    startedAt: new Date().toISOString(),
    finishedAt: null,
  };

  // A ferramenta verifica a assinatura do firmware com os servidores Apple durante o processo.
  activeChild = spawn(toolPath, ['--erase', ipswPath], {
    windowsHide: true,
    cwd: toolsDirectory(),
    shell: false,
  });
  activeChild.stdout.on('data', appendOutput);
  activeChild.stderr.on('data', appendOutput);
  activeChild.on('error', (error) => {
    state.running = false;
    state.status = 'failed';
    state.message = `Não foi possível iniciar idevicerestore: ${error.message}`;
    state.finishedAt = new Date().toISOString();
    activeChild = null;
  });
  activeChild.on('close', (code) => {
    state.running = false;
    state.exitCode = typeof code === 'number' ? code : -1;
    state.status = code === 0 ? 'completed' : 'failed';
    state.message = code === 0
      ? 'A ferramenta terminou sem reportar erro. Aguarde o iPhone reiniciar e confirme a tela de configuração.'
      : `A restauração terminou com código ${String(code)}. Consulte as mensagens abaixo; o processo pode não ter sido concluído.`;
    state.finishedAt = new Date().toISOString();
    activeChild = null;
  });

  return { started: true, status: snapshot() };
}

function getRestoreStatus() {
  return snapshot();
}

module.exports = { startOfficialRestore, getRestoreStatus };
