require('dotenv').config();
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const JobManager = require('./job-manager');

const app = express();
const PORT = process.env.PORT || 8787;
const API_KEY = process.env.API_KEY || 'dev-secret';

app.use(express.json());

// Job manager
const jobManager = new JobManager();

// Auth middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const token = authHeader.substring(7);
  if (token !== API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  
  next();
}

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    activeJobs: jobManager.getActiveJobCount()
  });
});

// Models endpoint
app.get('/v1/models', authMiddleware, (req, res) => {
  res.json({
    object: 'list',
    data: [
      {
        id: 'codex-cli-wrapper',
        object: 'model',
        created: Date.now(),
        owned_by: 'ai-factory'
      }
    ]
  });
});

// Chat completions endpoint (OpenAI-compatible)
app.post('/v1/chat/completions', authMiddleware, async (req, res) => {
  const { messages, stream = false, model = 'codex-cli-wrapper' } = req.body;
  
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid messages format' });
  }
  
  // Extract user prompt
  const lastMessage = messages[messages.length - 1];
  const prompt = lastMessage.content;
  
  // Create job
  const jobId = await jobManager.createJob({
    prompt,
    workspace: process.env.WORKSPACE || '/workspace/hello-world-ai-factory',
    autoPush: process.env.AUTO_PUSH === 'true'
  });
  
  if (stream) {
    // Streaming response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    const streamId = `chatcmpl-${uuidv4()}`;
    
    // Stream job events
    jobManager.streamJobEvents(jobId, (event) => {
      const chunk = {
        id: streamId,
        object: 'chat.completion.chunk',
        created: Math.floor(Date.now() / 1000),
        model,
        choices: [{
          index: 0,
          delta: { content: event.message + '\n' },
          finish_reason: null
        }]
      };
      
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }, () => {
      // Stream complete
      const finalChunk = {
        id: streamId,
        object: 'chat.completion.chunk',
        created: Math.floor(Date.now() / 1000),
        model,
        choices: [{
          index: 0,
          delta: {},
          finish_reason: 'stop'
        }]
      };
      
      res.write(`data: ${JSON.stringify(finalChunk)}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    });
  } else {
    // Non-streaming response - wait for job completion
    const result = await jobManager.waitForJob(jobId);
    
    res.json({
      id: `chatcmpl-${uuidv4()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model,
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: result.summary
        },
        finish_reason: 'stop'
      }],
      usage: {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      }
    });
  }
});

// Job API endpoints
app.post('/v1/jobs', authMiddleware, async (req, res) => {
  const { prompt, workspace, autoPush = true } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }
  
  const jobId = await jobManager.createJob({
    prompt,
    workspace: workspace || process.env.WORKSPACE,
    autoPush
  });
  
  res.json({
    jobId,
    status: 'queued'
  });
});

app.get('/v1/jobs/:jobId', authMiddleware, (req, res) => {
  const { jobId } = req.params;
  const job = jobManager.getJob(jobId);
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  res.json({
    jobId: job.id,
    status: job.status,
    phase: job.phase,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    workspace: job.workspace,
    summary: job.summary
  });
});

app.get('/v1/jobs/:jobId/logs', authMiddleware, (req, res) => {
  const { jobId } = req.params;
  const logs = jobManager.getJobLogs(jobId);
  
  if (!logs) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  res.json({
    jobId,
    logs
  });
});

app.get('/v1/jobs/:jobId/events', authMiddleware, (req, res) => {
  const { jobId } = req.params;
  const job = jobManager.getJob(jobId);
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  jobManager.streamJobEvents(jobId, (event) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  }, () => {
    res.write('data: [DONE]\n\n');
    res.end();
  });
});

app.post('/v1/jobs/:jobId/cancel', authMiddleware, (req, res) => {
  const { jobId } = req.params;
  const success = jobManager.cancelJob(jobId);
  
  if (!success) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  res.json({
    jobId,
    status: 'cancelled'
  });
});

app.listen(PORT, () => {
  console.log(`Codex CLI Wrapper listening on port ${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
});
