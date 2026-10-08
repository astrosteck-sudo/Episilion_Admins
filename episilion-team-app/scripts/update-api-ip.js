const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const isUsableIPv4 = (address) =>
  address &&
  address.family === 'IPv4' &&
  !address.internal &&
  !address.address.startsWith('169.254.');

const interfaces = os.networkInterfaces();
const wifiInterfaces = Object.entries(interfaces)
  .filter(([name]) => /wi-?fi|wireless|wlan/i.test(name))
  .flatMap(([, addresses]) => (addresses || []).filter(isUsableIPv4));

if (wifiInterfaces.length === 0) {
  console.error('Could not find an active Wi-Fi IPv4 address.');
  console.error('Connect to Wi-Fi, then run this command again.');
  process.exit(1);
}

const address = wifiInterfaces[0].address;
const envPath = path.resolve(__dirname, '..', '.env');
const contents = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
const newline = contents.includes('\r\n') ? '\r\n' : '\n';
const lines = contents.split(/\r?\n/);
const apiUrlLine = `EXPO_PUBLIC_API_URL=http://${address}:5000`;
const settingIndex = lines.findIndex((line) => /^\s*EXPO_PUBLIC_API_URL\s*=/.test(line));

if (settingIndex >= 0) {
  lines[settingIndex] = apiUrlLine;
} else {
  if (lines.length && lines[lines.length - 1] === '') lines.pop();
  lines.push(apiUrlLine);
}

fs.writeFileSync(envPath, lines.join(newline) + newline, 'utf8');
console.log(`Updated .env for Wi-Fi at ${address}:5000`);
