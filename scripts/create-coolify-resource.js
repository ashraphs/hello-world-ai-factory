const https = require('https');
const http = require('http');

const COOLIFY_URL = (process.env.COOLIFY_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '');
const COOLIFY_TOKEN = process.env.COOLIFY_TOKEN;

const PROJECT_NAME = process.env.PROJECT_NAME || 'hello-world-ai-factory';
const APP_NAME = process.env.APP_NAME || 'hello-world-ai-factory-app';
const REPO_URL = process.env.REPO_URL || 'https://github.com/ashraphs/hello-world-ai-factory';
const BRANCH = process.env.BRANCH || 'develop';
const ENVIRONMENT_NAME = process.env.ENVIRONMENT_NAME || 'production';
const PORT = process.env.APP_PORT || '3000';

if (!COOLIFY_TOKEN) {
  console.error('Missing COOLIFY_TOKEN. Create one in Coolify: Keys & Tokens → API tokens.');
  process.exit(1);
}

function api(method, path, body, ok = []) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${COOLIFY_URL}${path}`);
    const data = body ? JSON.stringify(body) : null;
    const lib = url.protocol === 'https:' ? https : http;
    const req = lib.request({
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: `${url.pathname}${url.search}`,
      method,
      rejectUnauthorized: false,
      headers: {
        Authorization: `Bearer ${COOLIFY_TOKEN}`,
        Accept: 'application/json',
        ...(data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {})
      }
    }, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        let parsed = {};
        try { parsed = raw ? JSON.parse(raw) : {}; } catch { parsed = { raw }; }
        if ((res.statusCode >= 200 && res.statusCode < 300) || ok.includes(res.statusCode)) {
          resolve({ status: res.statusCode, body: parsed, raw });
        } else {
          reject(new Error(`${method} ${path} failed ${res.statusCode}: ${raw}`));
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function findOrCreateProject() {
  const list = await api('GET', '/projects');
  const existing = Array.isArray(list.body) ? list.body.find(p => p.name === PROJECT_NAME) : null;
  if (existing?.uuid) {
    console.log(`Project exists: ${PROJECT_NAME} (${existing.uuid})`);
    return existing.uuid;
  }
  const created = await api('POST', '/projects', {
    name: PROJECT_NAME,
    description: 'AI Software Factory POC'
  });
  console.log(`Project created: ${PROJECT_NAME} (${created.body.uuid})`);
  return created.body.uuid;
}

async function getServerUuid() {
  const servers = await api('GET', '/servers');
  if (!Array.isArray(servers.body) || servers.body.length === 0) throw new Error('No Coolify servers found');
  const usable = servers.body.find(s => s.settings?.is_usable !== false) || servers.body[0];
  console.log(`Using server: ${usable.name || usable.uuid} (${usable.uuid})`);
  return usable.uuid;
}

async function createApplication(projectUuid, serverUuid) {
  const payload = {
    project_uuid: projectUuid,
    server_uuid: serverUuid,
    environment_name: ENVIRONMENT_NAME,
    git_repository: REPO_URL,
    git_branch: BRANCH,
    build_pack: 'dockerfile',
    ports_exposes: PORT,
    name: APP_NAME,
    description: 'Hello World app deployed via OpenWebUI, Codex CLI, GitHub, and Coolify',
    base_directory: '/app',
    dockerfile_location: '/Dockerfile',
    is_auto_deploy_enabled: true,
    autogenerate_domain: true,
    instant_deploy: true,
    health_check_enabled: true,
    health_check_path: '/health',
    health_check_port: PORT,
    health_check_method: 'GET',
    health_check_return_code: 200,
    health_check_scheme: 'http'
  };

  const created = await api('POST', '/applications/public', payload, [400, 409]);
  if (created.status >= 400) {
    throw new Error(`Create app failed: ${created.raw}`);
  }
  console.log(`Application created: ${APP_NAME} (${created.body.uuid})`);
  return created.body.uuid;
}

async function deploy(uuid) {
  const started = await api('GET', `/deploy?uuid=${encodeURIComponent(uuid)}&force=true`);
  console.log('Deployment triggered:');
  console.log(JSON.stringify(started.body, null, 2));
}

(async () => {
  console.log(`Coolify API: ${COOLIFY_URL}`);
  const projectUuid = await findOrCreateProject();
  const serverUuid = await getServerUuid();
  const appUuid = await createApplication(projectUuid, serverUuid);
  await deploy(appUuid);
  console.log('\nDONE');
  console.log(`Project UUID: ${projectUuid}`);
  console.log(`Application UUID: ${appUuid}`);
  console.log('Live URL: check Coolify dashboard for generated domain.');
})().catch(err => {
  console.error(err.message);
  process.exit(1);
});
