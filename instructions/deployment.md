# Deployment Instructions

## Architecture

```
User Request
    ↓
OpenWebUI
    ↕ (OpenAI-compatible API)
Two-Way API Wrapper
    ↕ (Job management)
Codex CLI Runtime
    ↕ (Git operations)
GitHub Repository
    ↕ (Webhook trigger)
GitHub Actions CI
    ↕ (Auto-deploy)
Coolify Platform
    ↓
Live Application
```

## GitHub Actions Pipeline

Pipeline triggers on:
- Push to `develop` branch
- Pull request to `develop` branch

Pipeline steps:
1. Checkout repository
2. Setup Node.js
3. Install dependencies (`npm install`)
4. Run tests (`npm test`)
5. Build Docker image
6. Validate build success

## Coolify Deployment

### Setup

1. Open Coolify dashboard
2. Create or select a project
3. Add new resource → GitHub repository
4. Select the generated repository
5. Configure:
   - Branch: `develop`
   - Deployment type: Dockerfile
   - Application directory: `app/`
   - Port: 3000 (or let Coolify auto-detect)
   - Auto-deploy: Enabled
6. Deploy

### Auto-Deploy

Coolify watches the `develop` branch. When GitHub Actions completes successfully, Coolify automatically:
1. Pulls latest code
2. Builds Docker image from app/Dockerfile
3. Deploys new container
4. Provides generated domain

### Port Configuration

- **Application**: Uses `process.env.PORT || 3000`
- **Local testing**: http://localhost:3000
- **Coolify**: Assigns runtime port and proxies to generated domain

### Domain

Use Coolify's generated domain (e.g., `https://app-abc123.coolify.domain`).

No custom domain configuration required for proof of concept.

## Local Testing

Before deployment:

1. **Install dependencies**:
   ```bash
   cd app
   npm install
   ```

2. **Run tests**:
   ```bash
   npm test
   ```

3. **Test locally**:
   ```bash
   npm start
   # Visit http://localhost:3000
   ```

4. **Validate Docker**:
   ```bash
   docker build -t hello-world-test .
   docker run -p 3000:3000 hello-world-test
   # Visit http://localhost:3000
   ```

## Deployment Flow

1. **Local validation**: Tests pass, Docker builds
2. **Git commit**: Commit generated/updated files
3. **Push to develop**: Trigger GitHub Actions
4. **CI validation**: GitHub Actions runs tests and builds
5. **Coolify auto-deploy**: Deploys if CI passes
6. **Live application**: Accessible via Coolify domain

## Verification

After deployment:

1. Check Coolify dashboard for deployment status
2. Copy generated domain URL
3. Visit URL in browser
4. Verify "Hello World" message appears
5. Check `/health` endpoint

## Troubleshooting

### GitHub Actions fails
- Check test output in Actions tab
- Ensure all tests pass locally first
- Verify Dockerfile builds successfully

### Coolify deployment fails
- Check Coolify logs in dashboard
- Verify branch is set to `develop`
- Ensure Dockerfile is valid
- Check port configuration

### Application not accessible
- Verify deployment status in Coolify
- Check application logs
- Ensure PORT environment variable is used correctly
- Verify Docker container is running

## Environment Variables

Application uses:
- `PORT` - Provided by Coolify at runtime (default: 3000 for local)

No other environment variables required for Hello World proof of concept.

Future applications may require:
- Database connection strings
- API keys
- Authentication secrets

These should be configured in Coolify environment settings.
