/**
 * Final Proxispeak - Environment Verification Script
 */

import net from 'net';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function checkPort(host, port, serviceName) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(2000);

    socket.on('connect', () => {
      socket.destroy();
      resolve({ service: serviceName, host, port, ok: true });
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve({ service: serviceName, host, port, ok: false, error: 'Connection timed out' });
    });

    socket.on('error', (err) => {
      socket.destroy();
      resolve({ service: serviceName, host, port, ok: false, error: err.message });
    });

    socket.connect(port, host);
  });
}

async function verifyEnvironment() {
  console.log('=== Final Proxispeak Environment Verification ===\n');

  // 1. Check Node.js version
  const nodeVersion = process.version;
  console.log(`[Node.js] Version: ${nodeVersion} - OK`);

  // 2. Check .env file
  const envPath = path.join(rootDir, '.env');
  const envExists = fs.existsSync(envPath);
  console.log(`[.env] Configuration file: ${envExists ? 'Found' : 'MISSING (Please copy .env.example to .env)'}`);

  // 3. Check MongoDB port
  const mongoCheck = await checkPort('127.0.0.1', 27017, 'MongoDB');
  if (mongoCheck.ok) {
    console.log(`[MongoDB] Running on 127.0.0.1:27017 - OK`);
  } else {
    console.warn(`[MongoDB] Warning: Could not connect on 127.0.0.1:27017 (${mongoCheck.error})`);
  }

  // 4. Check Redis port
  const redisCheck = await checkPort('127.0.0.1', 6379, 'Redis');
  if (redisCheck.ok) {
    console.log(`[Redis] Running on 127.0.0.1:6379 - OK`);
  } else {
    console.warn(`[Redis] Warning: Could not connect on 127.0.0.1:6379 (${redisCheck.error})`);
  }

  console.log('\nEnvironment verification completed.\n');
  return { mongo: mongoCheck.ok, redis: redisCheck.ok };
}

verifyEnvironment();
