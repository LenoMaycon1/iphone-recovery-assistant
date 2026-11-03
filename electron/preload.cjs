const { contextBridge, ipcRenderer } = require('electron');

async function call(channel, ...args) {
  const response = await ipcRenderer.invoke(channel, ...args);
  if (!response || typeof response !== 'object' || typeof response.ok !== 'boolean') {
    throw new Error('Resposta inválida do programa.');
  }
  if (!response.ok) throw new Error(response.error);
  return response.data;
}

contextBridge.exposeInMainWorld('iphoneRecovery', {
  getAppInfo: () => call('app:info'),
  scanUsbDevices: () => call('usb:scan'),
  inspectDevice: (request) => call('device:inspect', request),
  scanBackups: () => call('backups:scan'),
  openBackupsFolder: () => call('backups:open'),
  openOfficialRestoreGuide: () => call('restore:openOfficialGuide'),
  openAppleDevices: () => call('app:openAppleDevices'),
  startOfficialRestore: () => call('restore:start'),
  getRestoreStatus: () => call('restore:status'),
  getReportsDirectory: () => call('reports:getDirectory'),
  chooseReportsDirectory: () => call('reports:chooseDirectory'),
  saveReport: (fileName, content) => call('reports:save', fileName, content),
});
