export async function saveReportFile(fileName: string, content: string): Promise<string> {
  const bridge = window.iphoneRecovery;
  if (bridge) {
    const { path } = await bridge.saveReport(fileName, content);
    return path;
  }

  const blob = new Blob([`\uFEFF${content}`], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return fileName;
}
