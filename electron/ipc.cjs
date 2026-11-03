const { ipcMain } = require('electron');
const { isAppUrl } = require('./app-url.cjs');

class ValidationError extends Error {}

function requireString(value, label, maxLength) {
  if (typeof value !== 'string' || value.length === 0 || value.length > maxLength) {
    throw new ValidationError(`${label} inválido.`);
  }
  return value;
}

function handleIpc(channel, handler) {
  ipcMain.handle(channel, async (event, ...args) => {
    const frame = event.senderFrame;
    if (!frame || frame !== event.sender.mainFrame || !isAppUrl(frame.url)) {
      return { ok: false, error: 'Origem não autorizada.' };
    }
    try {
      return { ok: true, data: await handler(event, ...args) };
    } catch (error) {
      if (error instanceof ValidationError) return { ok: false, error: error.message };
      console.error(`[ipc] ${channel} falhou:`, error);
      return { ok: false, error: 'Ocorreu um erro inesperado no programa. Tente novamente.' };
    }
  });
}

module.exports = { ValidationError, handleIpc, requireString };
