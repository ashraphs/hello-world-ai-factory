# Quick Start Guide

## Complete AI Software Factory Setup on Coolify

Location: `/home/amirbahar/hello-world-ai-factory`

## What Was Built

✅ **Complete end-to-end AI software factory** with:

1. **Hello World Express App** (`app/`)
   - Simple Node.js + Express web application
   - Automated tests
   - Dockerfile for containerization
   - PORT-aware configuration (process.env.PORT || 3000)

2. **OpenAI-Compatible API Wrapper** (`wrapper/`)
   - Two-way communication (request + streaming response)
   - Job management system
   - Codex CLI integration framework
   - Git automation
   - Coolify client integration
   - Server-Sent Events for real-time progress

3. **AI Agent Instructions** (`instructions/`)
   - skill.md: Three-question intake workflow
   - rule.md: Safety and behavior rules
   - deployment.md: Full deployment procedures

4. **CI/CD Configuration**
   - GitHub Actions pipeline (`.github/workflows/ci.yml`)
   - GitLab CI example (`.gitlab-ci.yml.example`)
   - Docker Compose for local testing

## Architecture Flow

```
User → OpenWebUI
         ↕ (OpenAI API)
    API Wrapper (port 8787)
         ↕ (Job System)
    Codex CLI Runtime
         ↕ (Git)
    GitHub Repository
         ↕ (Webhook)
    GitHub Actions CI
         ↕ (Auto-deploy)
    Coolify Platform
         ↓
    Live Application
```

## Three-Question Intake System

The system only asks users:

1. **Project name?**
2. **What should the app do?**
3. **Do you have any spec/design documents?**

Everything else (git, branch, tech stack, CI/CD, deployment) uses system defaults.

## Testing Locally

### 1. Test the Hello World App

```bash
cd ~/hello-world-ai-factory/app
npm test
```

Expected output:
```
✓ App starts successfully
✓ GET / returns HTTP 200
✓ Response contains "Hello World"

All tests passed!
```

### 2. Start the Wrapper (Terminal 1)

```bash
cd ~/hello-world-ai-factory/wrapper
npm start
```

Expected output:
```
Codex CLI Wrapper listening on port 8787
Health: http://localhost:8787/health
```

### 3. Test Wrapper Health

```bash
curl http://localhost:8787/health
```

Expected:
```json
{
  "status": "healthy",
  "timestamp": "2026-05-21T...",
  "activeJobs": 0
}
```

### 4. Test OpenAI-Compatible Endpoint

```bash
curl http://localhost:8787/v1/models \
  -H "Authorization: Bearer dev-secret"
```

Expected:
```json
{
  "object": "list",
  "data": [{
    "id": "codex-cli-wrapper",
    "object": "model",
    "created": ...,
    "owned_by": "ai-factory"
  }]
}
```

### 5. Test Non-Streaming Chat

```bash
curl http://localhost:8787/v1/chat/completions \
  -H "Authorization: Bearer dev-secret" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "codex-cli-wrapper",
    "messages": [{"role": "user", "content": "Build hello-world app"}],
    "stream": false
  }'
```

### 6. Test Streaming Chat

```bash
curl -N http://localhost:8787/v1/chat/completions \
  -H "Authorization: Bearer dev-secret" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "codex-cli-wrapper",
    "messages": [{"role": "user", "content": "Build hello-world app"}],
    "stream": true
  }'
```

Expected: Server-Sent Events stream with progress updates

### 7. Test Job Creation

```bash
curl http://localhost:8787/v1/jobs \
  -H "Authorization: Bearer dev-secret" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Build hello-world application",
    "autoPush": false
  }'
```

Expected:
```json
{
  "jobId": "job_...",
  "status": "queued"
}
```

### 8. Get Job Status

```bash
# Replace JOB_ID with actual job ID from previous step
curl http://localhost:8787/v1/jobs/JOB_ID \
  -H "Authorization: Bearer dev-secret"
```

## Running with Docker Compose

```bash
cd ~/hello-world-ai-factory
docker-compose up --build
```

This starts:
- Wrapper on port 8787
- App on port 3000

## Connecting OpenWebUI

### OpenWebUI Configuration

**Settings → Connections:**

- **API Base URL**: `http://coolify:8787/v1`  
  (or `http://localhost:8787/v1` if OpenWebUI on same host)

- **API Key**: `dev-secret`

- **Model**: `codex-cli-wrapper`

- **Enable Streaming**: Yes

### Test in OpenWebUI

Type in chat:
```
I want to build application hello-world
```

Or:
```
Build a Hello World app - use defaults
```

The AI will process the request through the job system.

## Enabling GitHub Auto-Push

To enable automatic GitHub push:

1. Create GitHub Personal Access Token:
   - https://github.com/settings/tokens
   - Select: `repo` permissions
   - Generate token

2. Create GitHub repository:
   ```bash
   # On your development machine or via GitHub web UI
   # Repository name: hello-world-ai-factory
   ```

3. Configure wrapper:
   ```bash
   cd ~/hello-world-ai-factory/wrapper
   nano .env
   ```

   Update:
   ```
   GITHUB_TOKEN=your_github_pat_token
   GITHUB_OWNER=your_github_username
   GITHUB_REPO=hello-world-ai-factory
   AUTO_PUSH=true
   ```

4. Restart wrapper:
   ```bash
   npm start
   ```

## Setting Up Coolify Deployment

1. **Open Coolify Dashboard**

2. **Create/Select Project**

3. **Add New Resource** → **GitHub Repository**

4. **Configure:**
   - **Repository**: Select `hello-world-ai-factory`
   - **Branch**: `develop`
   - **Deployment Type**: Dockerfile
   - **Build Directory**: `app/`
   - **Port**: 3000 (or auto-detect)
   - **Auto-deploy**: Enable from `develop` branch

5. **Deploy**

6. **Copy Generated Domain**
   - Coolify provides: `https://app-xyz123.your-coolify.com`

7. **Visit URL** → Should see "Hello World" message

## Architecture Components

### app/ - Hello World Application
- **Purpose**: Sample Node.js web app
- **Stack**: Express.js
- **Port**: process.env.PORT || 3000
- **Tests**: Automated with npm test
- **Deployment**: Dockerfile-based

### wrapper/ - API Wrapper
- **Purpose**: OpenAI-compatible API bridge to Codex CLI
- **Features**:
  - Chat completions (streaming/non-streaming)
  - Job management API
  - Server-Sent Events
  - Job cancellation
  - Progress tracking
- **Port**: 8787
- **Auth**: Bearer token (dev-secret)

### instructions/ - AI Agent Guidance
- **skill.md**: Workflow and intake process
- **rule.md**: Safety and behavior rules
- **deployment.md**: Deployment procedures

### .github/workflows/ - CI Pipeline
- **ci.yml**: GitHub Actions pipeline
- **Triggers**: Push/PR to develop
- **Steps**: Install, test, build Docker, validate

## Environment Variables

### Wrapper Configuration

Located: `wrapper/.env`

**Required:**
```bash
API_KEY=dev-secret
PORT=8787
WORKSPACE=/home/amirbahar/hello-world-ai-factory
```

**Optional (GitHub):**
```bash
GITHUB_TOKEN=
GITHUB_OWNER=
GITHUB_REPO=
GIT_BRANCH=develop
AUTO_PUSH=true
```

**Optional (Coolify API):**
```bash
COOLIFY_URL=
COOLIFY_TOKEN=
COOLIFY_RESOURCE_ID=
```

## System Defaults

All users get these defaults automatically:

- ✅ GitHub only (no GitLab/Bitbucket questions)
- ✅ `develop` branch (single branch, no main/feature branches)
- ✅ AUTO_PUSH enabled (automatic push after tests pass)
- ✅ GitHub Actions CI (no Jenkins/CircleCI questions)
- ✅ Coolify deployment (no Heroku/AWS questions)
- ✅ Node.js + Express (no framework questions)
- ✅ Dockerfile deployment (no deployment method questions)
- ✅ Coolify generated domain (no domain questions)
- ✅ No auth, no database (by default)

## Next Steps

### Immediate Testing
1. ✅ Test app locally (`npm test`)
2. ✅ Test wrapper locally (`npm start` + curl tests)
3. ⬜ Configure GitHub credentials
4. ⬜ Push to GitHub
5. ⬜ Configure Coolify resource
6. ⬜ Verify auto-deployment
7. ⬜ Test live app

### Production Enhancements
1. Replace simulated Codex with real Codex CLI integration
2. Add GitHub API for automatic repository creation
3. Add Coolify API for deployment status detection
4. Add job persistence (database instead of in-memory)
5. Add proper job queue (Redis/BullMQ)
6. Add OAuth authentication
7. Add rate limiting
8. Add monitoring/logging
9. Add error recovery/retry logic
10. Support multiple concurrent users

## Troubleshooting

### Port already in use
```bash
# Kill process on port 3000
fuser -k 3000/tcp

# Or use different port
PORT=3333 npm start
```

### npm dependencies issues
```bash
rm -rf node_modules package-lock.json
npm install
```

### Docker build fails
```bash
cd app
docker build -t hello-world-test .
# Check Dockerfile syntax and dependencies
```

### Wrapper can't connect to Codex
- Current implementation simulates Codex
- Real integration requires Codex CLI installed and configured

### GitHub push fails
- Verify GITHUB_TOKEN has `repo` permissions
- Verify GITHUB_OWNER and GITHUB_REPO are correct
- Verify repository exists
- Check token expiry

### Coolify not deploying
- Verify branch is set to `develop` in Coolify
- Check Coolify logs
- Verify GitHub webhook is configured
- Ensure auto-deploy is enabled
- Check Docker build succeeds locally first

## File Structure Summary

```
/home/amirbahar/hello-world-ai-factory/
├── app/                          # Hello World application
│   ├── package.json
│   ├── server.js                 # Express server
│   ├── test.js                   # Automated tests
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── .gitignore
│   └── README.md
│
├── wrapper/                      # API wrapper
│   ├── package.json
│   ├── server.js                 # Main API server
│   ├── job-manager.js            # Job orchestration
│   ├── codex-runner.js           # Codex integration
│   ├── git-runner.js             # Git operations
│   ├── coolify-client.js         # Coolify API client
│   ├── Dockerfile
│   ├── .env                      # Configuration (KEEP SECRET)
│   ├── .env.example              # Template
│   └── README.md
│
├── instructions/                 # AI agent instructions
│   ├── skill.md                  # Workflow & intake
│   ├── rule.md                   # Safety rules
│   └── deployment.md             # Deployment guide
│
├── .github/workflows/
│   └── ci.yml                    # GitHub Actions CI
│
├── .gitlab-ci.yml.example        # GitLab CI reference
├── docker-compose.yml            # Local testing
└── README.md                     # Main documentation
```

## Security Notes

⚠️ **Important:**
- Keep `wrapper/.env` secure (contains API_KEY and GITHUB_TOKEN)
- Never commit `.env` to git
- Use `.env.example` as template only
- Rotate tokens regularly
- Use proper OAuth in production

## API Endpoints Reference

### OpenAI-Compatible
- `GET /health` - Health check
- `GET /v1/models` - List models
- `POST /v1/chat/completions` - Chat (stream/non-stream)

### Job Management
- `POST /v1/jobs` - Create job
- `GET /v1/jobs/:jobId` - Job status
- `GET /v1/jobs/:jobId/logs` - Job logs
- `GET /v1/jobs/:jobId/events` - Stream events (SSE)
- `POST /v1/jobs/:jobId/cancel` - Cancel job

## Success Criteria

✅ **Setup Complete When:**
1. App tests pass locally
2. Wrapper starts without errors
3. Health check returns healthy
4. Models endpoint returns codex-cli-wrapper
5. Chat completions endpoint accepts requests
6. Job creation works
7. Job status retrieval works

✅ **Full Flow Complete When:**
1. GitHub repository exists
2. GitHub credentials configured
3. Wrapper can push to GitHub
4. GitHub Actions pipeline runs
5. Coolify resource configured
6. Coolify auto-deploys from develop
7. Live app accessible via Coolify domain
8. Live app shows "Hello World" message

---

**Built**: 2026-05-21  
**Location**: SSH coolify (`/home/amirbahar/hello-world-ai-factory`)  
**Status**: ✅ Core infrastructure complete, ready for GitHub/Coolify integration
