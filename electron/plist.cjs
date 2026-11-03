const PLIST_HEADER_BINARY = 'bplist';

function detectPlistFormat(text) {
  if (text.startsWith(PLIST_HEADER_BINARY)) return 'binary';
  if (/<plist[\s>]/.test(text)) return 'xml';
  return 'unreadable';
}

function decodeXmlEntities(text) {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function parseTopLevelStrings(xml) {
  const values = {};
  const pattern = /<key>([^<]+)<\/key>\s*<string>([^<]*)<\/string>/g;
  let match;
  while ((match = pattern.exec(xml)) !== null) {
    const key = decodeXmlEntities(match[1]);
    if (!(key in values)) values[key] = decodeXmlEntities(match[2]).trim();
  }
  return values;
}

function parseTopLevelBooleans(xml) {
  const values = {};
  const pattern = /<key>([^<]+)<\/key>\s*<(true|false)\s*\/>/g;
  let match;
  while ((match = pattern.exec(xml)) !== null) {
    const key = decodeXmlEntities(match[1]);
    if (!(key in values)) values[key] = match[2] === 'true';
  }
  return values;
}

module.exports = { detectPlistFormat, parseTopLevelStrings, parseTopLevelBooleans };
