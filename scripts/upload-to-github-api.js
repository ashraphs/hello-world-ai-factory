const fs = require('fs');
const path = require('path');
const https = require('https');

const token = process.env.GITHUB_TOKEN;
const owner = 'ashraphs';
const repo = 'hello-world-ai-factory';
const root = '/home/amirbahar/hello-world-ai-factory';
const branch = 'develop';

const skipDirs = new Set(['.git', 'node_modules']);
const skipFiles = new Set(['wrapper/.env']);

function request(method, apiPath, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: 'api.github.com',
      path: apiPath,
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'ai-factory-uploader',
        ...(data ? {'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data)} : {})
      }
    }, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        let parsed = raw ? JSON.parse(raw) : {};
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(parsed);
        else reject(new Error(`${method} ${apiPath} failed ${res.statusCode}: ${raw}`));
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function walk(dir, base='') {
  const entries = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const rel = path.join(base, name).replace(/\\/g, '/');
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      if (skipDirs.has(name) || name.startsWith('.git.local-backup')) continue;
      entries.push(...walk(full, rel));
    } else if (st.isFile()) {
      if (skipFiles.has(rel)) continue;
      entries.push({full, rel});
    }
  }
  return entries;
}

(async () => {
  if (!token) throw new Error('GITHUB_TOKEN missing');
  const files = walk(root);
  console.log(`Uploading ${files.length} files to ${owner}/${repo}:${branch}`);

  const tree = [];
  for (const f of files) {
    const content = fs.readFileSync(f.full).toString('base64');
    const blob = await request('POST', `/repos/${owner}/${repo}/git/blobs`, {
      content,
      encoding: 'base64'
    });
    tree.push({ path: f.rel, mode: '100644', type: 'blob', sha: blob.sha });
    console.log(`blob ${f.rel}`);
  }

  const newTree = await request('POST', `/repos/${owner}/${repo}/git/trees`, { tree });
  const commit = await request('POST', `/repos/${owner}/${repo}/git/commits`, {
    message: 'Initial commit: AI Software Factory POC',
    tree: newTree.sha
  });

  try {
    await request('POST', `/repos/${owner}/${repo}/git/refs`, {
      ref: `refs/heads/${branch}`,
      sha: commit.sha
    });
  } catch (e) {
    if (String(e.message).includes('Reference already exists')) {
      await request('PATCH', `/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
        sha: commit.sha,
        force: true
      });
    } else throw e;
  }

  console.log(`DONE commit=${commit.sha}`);
  console.log(`URL=https://github.com/${owner}/${repo}/tree/${branch}`);
})().catch(err => {
  console.error(err.message);
  process.exit(1);
});
