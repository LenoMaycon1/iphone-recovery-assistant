const { app } = require('electron');

const DEFAULT_DEV_SERVER_URL = 'http://localhost:5173';

function devServerUrl() {
  if (process.env.VITE_DEV_SERVER_URL) return process.env.VITE_DEV_SERVER_URL;
  return app.isPackaged ? null : DEFAULT_DEV_SERVER_URL;
}

function isAppUrl(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return false;
  }
  if (url.protocol === 'file:') return true;
  const devUrl = devServerUrl();
  if (!devUrl) return false;
  return url.origin === new URL(devUrl).origin;
}

module.exports = { devServerUrl, isAppUrl };
