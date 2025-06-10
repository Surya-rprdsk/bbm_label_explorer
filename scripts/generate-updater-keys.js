import { generateKeyPairSync } from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Generating updater key pair...');

// Generate the key pair
const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 4096,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
  }
});

// Create the keys directory if it doesn't exist
const keysDir = path.join(__dirname, '..', 'keys');
if (!fs.existsSync(keysDir)) {
  fs.mkdirSync(keysDir, { recursive: true });
}

// Write the keys to files
fs.writeFileSync(path.join(keysDir, 'private.key'), privateKey);
fs.writeFileSync(path.join(keysDir, 'public.key'), publicKey);

// Output the public key content to be added to tauri.conf.json
console.log('\nPrivate key saved to keys/private.key');
console.log('Public key saved to keys/public.key');

// Extract just the base64 content from the public key (remove header/footer)
const publicKeyContent = publicKey
  .replace('-----BEGIN PUBLIC KEY-----\n', '')
  .replace('\n-----END PUBLIC KEY-----\n', '')
  .replace(/\n/g, '');

console.log('\nAdd this pubkey to your tauri.conf.json:');
console.log(publicKeyContent);