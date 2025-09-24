#!/usr/bin/env node
import { spawn } from 'node:child_process';
import http from 'node:http';
import net from 'node:net';

const project = process.argv[2];
if (!project) {
  console.error('Usage: node scripts/serve-preview.mjs <nxProjectName>');
  process.exit(2);
}

async function getFreePort() {
  return await new Promise((resolve) => {
    const srv = net.createServer();
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

function waitForHealthy(url, timeoutMs = 90_000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve(true);
      });
      req.on('error', () => {
        if (Date.now() - start > timeoutMs) return reject(new Error('Timeout waiting for server'));
        setTimeout(attempt, 1000);
      });
    };
    attempt();
  });
}

const port = Number(process.env.PORT) || await getFreePort();
const url = `http://127.0.0.1:${port}`;

const candidates = [
  ['preview', ['--', '--port', String(port)]],
  ['serve', ['--', '--port', String(port)]],
  ['start', ['--', '--port', String(port)]]
];

let child;
for (const [target, extraArgs] of candidates) {
  try {
    child = spawn('npx', ['nx', 'run', `${project}:${target}`, ...extraArgs], { stdio: 'pipe', shell: false });
    let errored = false;
    child.once('exit', (code) => { if (code !== 0) errored = true; });
    await new Promise((r) => setTimeout(r, 500));
    if (errored) continue;
    await waitForHealthy(url);
    console.log(`APP_URL=${url}`);
    process.stdin.resume();
    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
    child.on('exit', (code) => process.exit(code ?? 1));
    break;
  } catch (e) {
    if (child) { try { child.kill('SIGKILL'); } catch {}
    }
  }
}

if (!child || child.killed) {
  console.error(`No usable preview/serve/start target found for ${project}.`);
  process.exit(2);
}


