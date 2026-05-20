# AI Software Factory - Proof of Concept

Complete end-to-end AI software factory for building applications through natural language.

## Architecture

```
User
 ↓
OpenWebUI
 ↕ (OpenAI-compatible API)
Two-Way API Wrapper
 ↕ (Job Management & Streaming)
Codex CLI Agent Runtime
 ↕ (File Generation & Validation)
Local Workspace / Git Repo
 ↕ (Push)
GitHub Repository
 ↕ (Webhook)
GitHub Actions CI Pipeline
 ↕ (Auto-deploy)
Coolify Platform
 ↓
Live Application
```

## What This Does

This is a working proof of concept that allows users to build and deploy applications through conversation with an AI assistant.

1. User asks OpenWebUI to build an application
2. AI asks only 3 questions (or user says "use defaults")
3. System generates application code
4. Tests run automatically
5. Docker image validates
6. Code commits to GitHub develop branch
7. GitHub Actions CI runs
8. Coolify auto-deploys
9. Application goes live

## The Three-Question Intake Flow

The system only asks users these questions:

1. **Project name?**
2. **What should the app do?**
3. **Do you have any functional spec, business spec, design document, API document, user story, or related document?**

Everything else (Git provider, branch strategy, tech stack, CI/CD, deployment, domain) uses system defaults.

## Default System Decisions

- **Git**: GitHub only
- **Repository**: New repository (auto-created)
- **Branch**: develop (single branch)
- **Push**: AUTO_PUSH=true
- **CI**: GitHub Actions
- **Deployment**: Coolify auto-deploy from develop
- **Stack**: Node.js + Express + Docker
- **Port**: process.env.PORT || 3000
- **Domain**: Coolify generated domain
- **Auth**: None (by default)
- **Database**: None (by default)

## Project Structure

```
hello-world-ai-factory/
 ├── app/                     # Hello World application
 │   ├── package.json
 │   ├── server.js
 │   ├── test.js
 │   ├── Dockerfile
 │   ├── .dockerignore
 │   ├── .gitignore
 │   └── README.md
 │
 ├── wrapper/                 # OpenAI-compatible API wrapper
 │   ├── package.json
 │   ├── server.js            # Main API server
 │   ├── job-manager.js       # Job orchestration
 │   ├── codex-runner.js      # Codex CLI integration
 │   ├── git-runner.js        # Git operations
 │   ├── coolify-client.js    # Coolify API client
 │   ├── .env.example
 │   └── README.md
 │
 ├── instructions/            # AI agent instructions
 │   ├── skill.md             # Intake & workflow
 │   ├── rule.md              # Safety & behavior rules
 │   └── deployment.md        # Deployment procedures
 │
 ├── .github/
 │   └── workflows/
 │       └── ci.yml           # GitHub Actions pipeline
 │
 ├── .gitlab-ci.yml.example   # GitLab CI reference
 ├── docker-compose.yml       # Local testing
 └── README.md                # This file
```

## Two-Way API Communication

The API wrapper supports two-way communication:

### OpenAI-Compatible Endpoints

- `GET /health` - Health check
- `GET /v1/models` - List models
- `POST /v1/chat/completions` - Chat (streaming or non-streaming)

### Job Management Endpoints

- `POST /v1/jobs` - Create job
- `GET /v1/jobs/:jobId` - Job status
- `GET /v1/jobs/:jobId/logs` - Job logs
- `GET /v1/jobs/:jobId/events` - Stream events (SSE)
- `POST /v1/jobs/:jobId/cancel` - Cancel job

### Streaming Support

Both `/v1/chat/completions` and `/v1/jobs/:jobId/events` support Server-Sent Events for real-time progress updates:

- job_created
- codex_started
- reading_instructions
- creating_files
- running_tests
- validating_dockerfile
- git_status
- committing_changes
- pushing_to_remote
- waiting_for_pipeline
- waiting_for_coolify
- deployment_complete
- final_summary

## Running Locally

### Prerequisites

- Node.js 20+
- Docker
- npm

### Setup

```bash
cd hello-world-ai-factory

# Setup wrapper
cd wrapper
cp .env.example .env
# Edit .env with your configuration
npm install
cd ..

# Setup app
cd app
npm install
cd ..
```

### Start Services

```bash
# Start both services with docker-compose
docker-compose up --build

# Or run individually:

# Terminal 1: Start wrapper
cd wrapper
npm start

# Terminal 2: Start app
cd app
npm start
```

### Access

- **App**: http://localhost:3000
- **Wrapper**: http://localhost:8787
- **Health**: http://localhost:8787/health

## Testing the API

### Health Check

```bash
curl http://localhost:8787/health
```

### List Models

```bash
curl http://localhost:8787/v1/models \
  -H "Authorization: Bearer dev-secret"
```

### Non-Streaming Chat

```bash
curl http://localhost:8787/v1/chat/completions \
  -H "Authorization: Bearer dev-secret" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "codex-cli-wrapper",
    "messages": [
      {
        "role": "user",
        "content": "I want to build application hello-world"
      }
    ],
    "stream": false
  }'
```

### Streaming Chat

```bash
curl -N http://localhost:8787/v1/chat/completions \
  -H "Authorization: Bearer dev-secret" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "codex-cli-wrapper",
    "messages": [
      {
        "role": "user",
        "content": "I want to build application hello-world"
      }
    ],
    "stream": true
  }'
```

### Create Job Directly

```bash
curl http://localhost:8787/v1/jobs \
  -H "Authorization: Bearer dev-secret" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "I want to build application hello-world",
    "autoPush": true
  }'
```

### Get Job Status

```bash
curl http://localhost:8787/v1/jobs/<jobId> \
  -H "Authorization: Bearer dev-secret"
```

### Get Job Logs

```bash
curl http://localhost:8787/v1/jobs/<jobId>/logs \
  -H "Authorization: Bearer dev-secret"
```

### Stream Job Events

```bash
curl -N http://localhost:8787/v1/jobs/<jobId>/events \
  -H "Authorization: Bearer dev-secret"
```

### Cancel Job

```bash
curl -X POST http://localhost:8787/v1/jobs/<jobId>/cancel \
  -H "Authorization: Bearer dev-secret"
```

## Connecting OpenWebUI

### Configuration

In OpenWebUI settings:

**If OpenWebUI runs on host:**
- API URL: `http://localhost:8787/v1`
- API Key: `dev-secret`
- Model: `codex-cli-wrapper`
- Streaming: Enabled

**If OpenWebUI runs in Docker:**
- API URL: `http://host.docker.internal:8787/v1`
- API Key: `dev-secret`
- Model: `codex-cli-wrapper`
- Streaming: Enabled

### Test Prompt

In OpenWebUI, try:

```
I want to build application hello-world
```

Or use defaults:

```
Build a Hello World app - use defaults
```

The AI will ask the 3 intake questions (or use defaults) and build the application.

## GitHub Integration

### Setup

To enable automatic GitHub push and CI:

1. Create a GitHub personal access token with repo permissions
2. Create a new GitHub repository (or use existing)
3. Configure wrapper environment:

```bash
cd wrapper
cp .env.example .env
```

Edit `.env`:

```
GITHUB_TOKEN=your_github_token
GITHUB_OWNER=your_github_username
GITHUB_REPO=hello-world-ai-factory
AUTO_PUSH=true
```

### Repository Creation

The system will:
1. Initialize git in app/
2. Create develop branch
3. Add GitHub remote
4. Commit generated files
5. Push to develop

### GitHub Actions

After push, GitHub Actions automatically:
1. Installs dependencies
2. Runs tests
3. Builds Docker image
4. Reports status

View pipeline in: `https://github.com/OWNER/REPO/actions`

## Coolify Setup

### Configuration

1. Open your Coolify dashboard
2. Create or select a project
3. Add new resource → GitHub repository
4. Select your repository
5. Configure:
   - **Branch**: `develop`
   - **Deployment type**: Dockerfile
   - **Build directory**: `app/`
   - **Port**: 3000 (or auto-detect)
   - **Auto-deploy**: Enabled from develop branch

### Auto-Deploy

Once configured, Coolify watches the develop branch.

When GitHub Actions completes successfully:
1. Coolify pulls latest code
2. Builds Docker image
3. Deploys container
4. Provides generated domain

### Access

Coolify will provide a generated domain like:
- `https://hello-world-abc123.coolify.yourdomain.com`

Visit this URL to see your live application.

### Coolify API (Optional)

For programmatic deployment status:

Edit `wrapper/.env`:

```
COOLIFY_URL=https://your-coolify-instance.com
COOLIFY_TOKEN=your_coolify_token
COOLIFY_RESOURCE_ID=resource_id
```

The wrapper will attempt to fetch deployment URLs automatically.

## How Codex CLI Is Invoked

The wrapper invokes Codex CLI conceptually like this:

```bash
cd /workspace/hello-world-ai-factory

codex exec "
User request: Build Hello World application

Project intake:
- Project name: hello-world
- Project purpose: Simple Hello World web application
- Specification documents: None provided

System defaults:
- GitHub only
- New GitHub repository
- develop branch
- AUTO_PUSH=true
- GitHub Actions CI
- Coolify auto-deploy from develop
- Coolify generated domain
- Node.js + Express + Docker
- App uses process.env.PORT || 3000

Instructions:
- Read instructions/skill.md
- Read instructions/rule.md
- Read instructions/deployment.md
- Build or update the app in app/
- Run tests
- Validate Dockerfile
- Show git diff
- Commit changes
- Push to develop because AUTO_PUSH=true
- Never touch files outside WORKSPACE
- Never print secrets
- Never modify system files
- Never run destructive commands
"
```

## Final Output Example

After job completion, the system provides:

```
✓ Job completed successfully

Files generated:
- app/package.json
- app/server.js
- app/test.js
- app/Dockerfile
- app/.dockerignore
- app/.gitignore
- app/README.md

Tests: PASSED
Docker validation: PASSED
Git: Committed and pushed to develop
CI: GitHub Actions triggered
Coolify: Auto-deploy initiated

Live URL: Check Coolify dashboard for the generated domain
```

## Environment Variables

### Wrapper Configuration

Required:
- `API_KEY` - API authentication key
- `PORT` - Wrapper port (default: 8787)
- `WORKSPACE` - Project workspace path

Optional (GitHub):
- `GITHUB_TOKEN` - GitHub personal access token
- `GITHUB_OWNER` - GitHub username/org
- `GITHUB_REPO` - Repository name
- `GIT_BRANCH` - Branch (default: develop)
- `AUTO_PUSH` - Enable auto-push (default: true)

Optional (Coolify):
- `COOLIFY_URL` - Coolify instance URL
- `COOLIFY_TOKEN` - Coolify API token
- `COOLIFY_RESOURCE_ID` - Resource ID

## Known Limitations

1. **Codex CLI Integration**: Current implementation simulates Codex invocation. Real implementation would use actual Codex CLI.

2. **GitHub Repository Creation**: Requires manual repository creation or GitHub API integration for automatic creation.

3. **Coolify URL Detection**: Manual check in Coolify dashboard. Full API integration would auto-detect.

4. **Job Persistence**: Jobs stored in memory. Production should use database.

5. **Concurrent Jobs**: Basic queue. Production needs proper job queue (Redis, BullMQ).

6. **Error Recovery**: Basic error handling. Production needs retry logic and better recovery.

7. **Security**: Uses simple API key. Production needs OAuth, rate limiting, etc.

## Missing Setup Requirements

For full end-to-end functionality, you need:

1. **GitHub**:
   - Personal access token with repo permissions
   - Repository created (or API integration for auto-creation)
   - Token configured in wrapper/.env

2. **Coolify**:
   - Coolify instance running
   - Resource created and linked to GitHub repository
   - develop branch auto-deploy enabled
   - Optional: API token for programmatic access

3. **OpenWebUI** (optional for UI):
   - OpenWebUI instance running
   - Configured to use wrapper endpoint
   - API key set to match wrapper

## Next Steps

### For This POC

1. Configure GitHub credentials in `wrapper/.env`
2. Create GitHub repository
3. Configure Coolify resource
4. Run local tests
5. Push to GitHub
6. Verify CI pipeline
7. Verify Coolify deployment
8. Test live application

### For Production

1. Integrate real Codex CLI
2. Add GitHub API for repository creation
3. Add Coolify API for deployment status
4. Implement proper job queue
5. Add database for job persistence
6. Add OAuth authentication
7. Add rate limiting
8. Add monitoring and logging
9. Add error recovery and retries
10. Support multiple concurrent users

## Troubleshooting

### App won't start locally
```bash
cd app
rm -rf node_modules package-lock.json
npm install
npm start
```

### Wrapper won't start
```bash
cd wrapper
rm -rf node_modules package-lock.json
npm install
cp .env.example .env
npm start
```

### Tests fail
```bash
cd app
npm test
# Check error messages
```

### Docker build fails
```bash
cd app
docker build -t hello-world-test .
# Check Dockerfile syntax
```

### Git push fails
- Verify GITHUB_TOKEN is set
- Verify GITHUB_OWNER and GITHUB_REPO are correct
- Verify token has repo permissions
- Check repository exists

### Coolify not deploying
- Verify branch is set to `develop` in Coolify
- Check Coolify logs in dashboard
- Verify GitHub webhook is configured
- Ensure auto-deploy is enabled

## License

MIT

## Support

For issues or questions, check:
- GitHub Actions logs for CI failures
- Coolify dashboard logs for deployment issues
- Wrapper logs for API issues
- App logs for application issues
