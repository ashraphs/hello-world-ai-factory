const fs = require('fs');
const path = require('path');
const https = require('https');

const token = process.env.GITHUB_TOKEN;
const owner = process.env.GITHUB_OWNER || 'ashraphs';
const repo = process.env.GITHUB_REPO || 'hello-world-ai-factory';
const root = process.env.UPLOAD_ROOT || '/home/amirbahar/hello-world-ai-factory';
const branch = process.env.GITHUB_BRANCH || 'develop';

const skipDirs = new Set(['.git', 'node_modules']);
const skipFiles = new Set(['wrapper/.env']);

function request(method, apiPath, body, okStatuses = []) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: 'api.github.com',
      path: apiPath,
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'ai-factory-uploader',
        ...(data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {})
      }
    }, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        let parsed = {};
        try { parsed = raw ? JSON.parse(raw) : {}; } catch { parsed = { raw }; }
        if ((res.statusCode >= 200 && res.statusCode < 300) || okStatuses.includes(res.statusCode)) {
          resolve({ status: res.statusCode, body: parsed, raw });
        } else {
          reject(new Error(`${method} ${apiPath} failed ${res.statusCode}: ${raw}`));
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function walk(dir, base = '') {
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
      entries.push({ full, rel });
    }
  }
  return entries;
}

async function getRef(refBranch) {
  try {
    const r = await request('GET', `/repos/${owner}/${repo}/git/ref/heads/${refBranch}`, null, [404, 409]);
    if (r.status === 200) return r.body.object.sha;
    return null;
  } catch (e) {
    if (String(e.message).includes('404') || String(e.message).includes('409')) return null;
    throw e;
  }
}

async function initializeRepoIfEmpty() {
  let mainSha = await getRef('main');
  let developSha = await getRef(branch);
  if (developSha) return developSha;

  if (!mainSha) {
    console.log('Repo appears empty. Initializing README.md on main via Contents API...');
    const content = Buffer.from(`# ${repo}\n`).toString('base64');
    const init = await request('PUT', `/repos/${owner}/${repo}/contents/README.md`, {
      message: 'Initial commit',
      content
    });
    mainSha = init.body.commit.sha;
  }

  if (branch !== 'main') {
    console.log(`Creating ${branch} branch from main...`);
    const created = await request('POST', `/repos/${owner}/${repo}/git/refs`, {
      ref: `refs/heads/${branch}`,
      sha: mainSha
    }, [422]);

    if (created.status === 422) {
      const existing = await getRef(branch);
      if (existing) return existing;
      throw new Error(`Could not create ${branch} branch: ${created.raw}`);
    }
    return mainSha;
  }

  return mainSha;
}

async function getTreeSha(commitSha) {
  const commit = await request('GET', `/repos/${owner}/${repo}/git/commits/${commitSha}`);
  return commit.body.tree.sha;
}

(async () => {
  if (!token) throw new Error('GITHUB_TOKEN missing');

  const baseCommitSha = await initializeRepoIfEmpty();
  const baseTreeSha = await getTreeSha(baseCommitSha);
  const files = walk(root);
  console.log(`Uploading ${files.length} files to ${owner}/${repo}:${branch}`);

  const tree = [];
  for (const f of files) {
    const content = fs.readFileSync(f.full).toString('base64');
    const blob = await request('POST', `/repos/${owner}/${repo}/git/blobs`, {
      content,
      encoding: 'base64'
    });
    tree.push({ path: f.rel, mode: '100644', type: 'blob', sha: blob.body.sha });
    console.log(`blob ${f.rel}`);
  }

  const newTree = await request('POST', `/repos/${owner}/${repo}/git/trees`, {
    base_tree: baseTreeSha,
    tree
  });

  const commit = await request('POST', `/repos/${owner}/${repo}/git/commits`, {
    message: 'Initial commit: AI Software Factory POC',
    tree: newTree.body.sha,
    parents: [baseCommitSha]
  });

  await request('PATCH', `/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
    sha: commit.body.sha,
    force: true
  });

  console.log(`DONE commit=${commit.body.sha}`);
  console.log(`URL=https://github.com/${owner}/${repo}/tree/${branch}`);
})().catch(err => {
  console.error(err.message);
  process.exit(1);
});
