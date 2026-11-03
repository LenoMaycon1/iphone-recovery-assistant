const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs/promises');
const { detectPlistFormat, parseTopLevelBooleans, parseTopLevelStrings } = require('./plist.cjs');

const REQUIRED_FILES = ['Info.plist', 'Manifest.plist', 'Status.plist', 'Manifest.db'];
const SQLITE_HEADER = 'SQLite format 3\u0000';
const MAX_PLIST_BYTES = 20 * 1024 * 1024;
const MAX_BACKUP_FOLDERS = 50;

const VALIDATION_DETAILS = {
  validated:
    'Backup validado: Info.plist, Manifest.plist e Status.plist são legíveis, o identificador confere com o nome da pasta e o Manifest.db tem cabeçalho de banco SQLite. Isto não garante que os dados estejam íntegros.',
  encrypted:
    'Backup criptografado. O programa não lê o conteúdo nem solicita senhas. A senha deve ser fornecida pelo cliente diretamente ao Finder ou ao Apple Devices.',
  incomplete: 'Pasta sem arquivos essenciais de backup. Pode ser um backup interrompido ou uma pasta não relacionada.',
  unverified:
    'Pasta encontrada, mas não validada: os arquivos de identificação estão em formato não lido por este programa ou não conferem com a pasta.',
};

async function readPlistText(filePath) {
  const stats = await fs.stat(filePath);
  if (!stats.isFile() || stats.size === 0 || stats.size > MAX_PLIST_BYTES) return null;
  const text = await fs.readFile(filePath, 'utf8');
  return detectPlistFormat(text) === 'xml' ? text : null;
}

async function hasSqliteHeader(filePath) {
  const handle = await fs.open(filePath, 'r');
  try {
    const buffer = Buffer.alloc(SQLITE_HEADER.length);
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    return bytesRead === buffer.length && buffer.toString('latin1') === SQLITE_HEADER;
  } finally {
    await handle.close();
  }
}

async function presentFiles(folderPath) {
  const present = new Set();
  for (const fileName of REQUIRED_FILES) {
    try {
      const stats = await fs.stat(path.join(folderPath, fileName));
      if (stats.isFile() && stats.size > 0) present.add(fileName);
    } catch {
      continue;
    }
  }
  return present;
}

async function inspectBackupFolder(folderPath, name, modifiedAt) {
  const present = await presentFiles(folderPath);
  const missingFiles = REQUIRED_FILES.filter((fileName) => !present.has(fileName));
  const base = { name, modifiedAt, missingFiles, deviceName: null, productType: null, productVersion: null };

  if (missingFiles.length > 0) {
    return { ...base, validation: 'incomplete', detail: VALIDATION_DETAILS.incomplete };
  }

  const [infoXml, manifestXml, statusXml] = await Promise.all([
    readPlistText(path.join(folderPath, 'Info.plist')).catch(() => null),
    readPlistText(path.join(folderPath, 'Manifest.plist')).catch(() => null),
    readPlistText(path.join(folderPath, 'Status.plist')).catch(() => null),
  ]);

  if (manifestXml && parseTopLevelBooleans(manifestXml).IsEncrypted === true) {
    const info = infoXml ? parseTopLevelStrings(infoXml) : {};
    return {
      ...base,
      validation: 'encrypted',
      deviceName: info['Device Name'] || null,
      productType: info['Product Type'] || null,
      productVersion: info['Product Version'] || null,
      detail: VALIDATION_DETAILS.encrypted,
    };
  }

  if (!infoXml || !manifestXml || !statusXml) {
    return { ...base, validation: 'unverified', detail: VALIDATION_DETAILS.unverified };
  }

  const info = parseTopLevelStrings(infoXml);
  const identifierMatches =
    typeof info['Unique Identifier'] === 'string' &&
    info['Unique Identifier'].toLowerCase() === name.toLowerCase();
  const databaseValid = await hasSqliteHeader(path.join(folderPath, 'Manifest.db')).catch(() => false);
  const validated = identifierMatches && databaseValid;

  return {
    ...base,
    validation: validated ? 'validated' : 'unverified',
    deviceName: info['Device Name'] || null,
    productType: info['Product Type'] || null,
    productVersion: info['Product Version'] || null,
    detail: validated ? VALIDATION_DETAILS.validated : VALIDATION_DETAILS.unverified,
  };
}

function backupsDirectory() {
  const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
  return path.join(appData, 'Apple Computer', 'MobileSync', 'Backup');
}

async function scanBackups() {
  const directory = backupsDirectory();
  let entries;
  try {
    entries = await fs.readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return { available: false, directory, backups: [], error: null };
    return { available: false, directory, backups: [], error: 'Não foi possível acessar a pasta de backups.' };
  }

  const folders = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || folders.length >= MAX_BACKUP_FOLDERS) continue;
    const folderPath = path.join(directory, entry.name);
    const stats = await fs.stat(folderPath).catch(() => null);
    if (!stats) continue;
    folders.push({ folderPath, name: entry.name, modifiedAt: stats.mtime.toISOString() });
  }

  const backups = await Promise.all(
    folders.map((folder) => inspectBackupFolder(folder.folderPath, folder.name, folder.modifiedAt)),
  );
  backups.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));

  return { available: true, directory, backups, error: null };
}

module.exports = { scanBackups, backupsDirectory };
