# Codex CLI Wrapper

OpenAI-compatible API wrapper for Codex CLI with two-way communication.

## Features

- OpenAI-compatible `/v1/chat/completions` endpoint
- Streaming and non-streaming responses
- Job management API
- Server-Sent Events for real-time progress
- Job cancellation support

## Endpoints

### OpenAI-Compatible Endpoints

- `GET /health` - Health check
- `GET /v1/models` - List available models
- `POST /v1/chat/completions` - Chat completions (streaming and non-streaming)

### Job Management Endpoints

- `POST /v1/jobs` - Create a new job
- `GET /v1/jobs/:jobId` - Get job status
- `GET /v1/jobs/:jobId/logs` - Get job logs
- `GET /v1/jobs/:jobId/events` - Stream job events (SSE)
- `POST /v1/jobs/:jobId/cancel` - Cancel a job

## Running

```bash
npm install
cp .env.example .env
# Edit .env with your configuration
npm start
```

## Environment Variables

See `.env.example` for all available configuration options.

Required:
- `API_KEY` - API key for authentication
- `WORKSPACE` - Path to project workspace

Optional (for GitHub integration):
- `GITHUB_TOKEN` - GitHub personal access token
- `GITHUB_OWNER` - GitHub repository owner
- `GITHUB_REPO` - GitHub repository name

Optional (for Coolify integration):
- `COOLIFY_URL` - Coolify instance URL
- `COOLIFY_TOKEN` - Coolify API token
- `COOLIFY_RESOURCE_ID` - Coolify resource ID

## Testing

### Non-streaming chat
```bash
curl http://localhost:8787/v1/chat/completions \
  -H "Authorization: Bearer dev-secret" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "codex-cli-wrapper",
    "messages": [{"role": "user", "content": "I want to build application hello-world"}],
    "stream": false
  }'
```

### Streaming chat
```bash
curl -N http://localhost:8787/v1/chat/completions \
  -H "Authorization: Bearer dev-secret" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "codex-cli-wrapper",
    "messages": [{"role": "user", "content": "I want to build application hello-world"}],
    "stream": true
  }'
```

### Create job
```bash
curl http://localhost:8787/v1/jobs \
  -H "Authorization: Bearer dev-secret" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "I want to build application hello-world",
    "autoPush": true
  }'
```

### Get job status
```bash
curl http://localhost:8787/v1/jobs/<jobId> \
  -H "Authorization: Bearer dev-secret"
```
