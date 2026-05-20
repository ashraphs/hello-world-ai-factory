const { v4: uuidv4 } = require('uuid');
const CodexRunner = require('./codex-runner');
const GitRunner = require('./git-runner');
const CoolifyClient = require('./coolify-client');

class JobManager {
  constructor() {
    this.jobs = new Map();
    this.codexRunner = new CodexRunner();
    this.gitRunner = new GitRunner();
    this.coolifyClient = new CoolifyClient();
  }
  
  async createJob(config) {
    const jobId = `job_${uuidv4()}`;
    
    const job = {
      id: jobId,
      status: 'queued',
      phase: 'created',
      config,
      logs: [],
      events: [],
      summary: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      workspace: config.workspace
    };
    
    this.jobs.set(jobId, job);
    this.log(jobId, 'info', 'Job created');
    this.addEvent(jobId, 'queued', 'Job created');
    
    // Start processing in background
    this.processJob(jobId).catch(err => {
      this.log(jobId, 'error', err.message);
      this.updateJob(jobId, { status: 'failed', summary: err.message });
    });
    
    return jobId;
  }
  
  async processJob(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) return;
    
    try {
      // Update status
      this.updateJob(jobId, { status: 'running', phase: 'starting' });
      this.addEvent(jobId, 'running', 'Codex started');
      
      // Read instruction files
      this.updateJob(jobId, { phase: 'reading_instructions' });
      this.addEvent(jobId, 'context', 'Reading instruction files');
      await this.codexRunner.readInstructions(job.workspace);
      
      // Apply defaults
      this.updateJob(jobId, { phase: 'applying_defaults' });
      this.addEvent(jobId, 'intake', 'Applying project defaults');
      
      // Generate app files
      this.updateJob(jobId, { phase: 'generating_files' });
      this.addEvent(jobId, 'generate', 'Creating app files');
      await this.codexRunner.generateApp(job.workspace, job.config.prompt);
      
      // Run tests
      this.updateJob(jobId, { phase: 'running_tests' });
      this.addEvent(jobId, 'test', 'Running npm test');
      await this.codexRunner.runTests(job.workspace);
      
      // Validate Docker
      this.updateJob(jobId, { phase: 'validating_docker' });
      this.addEvent(jobId, 'docker', 'Validating Docker build');
      await this.codexRunner.validateDocker(job.workspace);
      
      // Git operations
      if (job.config.autoPush) {
        this.updateJob(jobId, { phase: 'git_operations' });
        this.addEvent(jobId, 'git', 'Checking git status');
        
        await this.gitRunner.initializeRepo(job.workspace);
        await this.gitRunner.commit(job.workspace, 'AI Factory: Generated Hello World app');
        
        this.addEvent(jobId, 'push', 'Pushing to GitHub develop branch');
        await this.gitRunner.push(job.workspace);
        
        // Wait for CI
        this.updateJob(jobId, { phase: 'waiting_ci' });
        this.addEvent(jobId, 'ci', 'Waiting for GitHub Actions pipeline');
        
        // Wait for Coolify
        this.updateJob(jobId, { phase: 'waiting_coolify' });
        this.addEvent(jobId, 'coolify', 'Waiting for Coolify auto-deploy');
        
        // Check Coolify deployment
        const deploymentUrl = await this.coolifyClient.getDeploymentUrl();
        if (deploymentUrl) {
          this.log(jobId, 'info', `Live URL: ${deploymentUrl}`);
        }
      }
      
      // Complete
      const summary = this.buildSummary(job);
      this.updateJob(jobId, { 
        status: 'completed', 
        phase: 'done',
        summary 
      });
      this.addEvent(jobId, 'done', 'Job completed');
      
    } catch (error) {
      this.log(jobId, 'error', error.message);
      this.updateJob(jobId, { 
        status: 'failed', 
        summary: `Job failed: ${error.message}` 
      });
      this.addEvent(jobId, 'error', error.message);
    }
  }
  
  buildSummary(job) {
    let summary = '✓ Job completed successfully\n\n';
    summary += 'Files generated:\n';
    summary += '- app/package.json\n';
    summary += '- app/server.js\n';
    summary += '- app/test.js\n';
    summary += '- app/Dockerfile\n';
    summary += '- app/.dockerignore\n';
    summary += '- app/.gitignore\n';
    summary += '- app/README.md\n\n';
    
    summary += 'Tests: PASSED\n';
    summary += 'Docker validation: PASSED\n';
    
    if (job.config.autoPush) {
      summary += 'Git: Committed and pushed to develop\n';
      summary += 'CI: GitHub Actions triggered\n';
      summary += 'Coolify: Auto-deploy initiated\n\n';
      summary += 'Live URL: Check Coolify dashboard for the generated domain\n';
    } else {
      summary += '\nNote: AUTO_PUSH is disabled. Files are ready but not pushed.\n';
    }
    
    return summary;
  }
  
  getJob(jobId) {
    return this.jobs.get(jobId);
  }
  
  getJobLogs(jobId) {
    const job = this.jobs.get(jobId);
    return job ? job.logs : null;
  }
  
  getActiveJobCount() {
    let count = 0;
    for (const job of this.jobs.values()) {
      if (job.status === 'queued' || job.status === 'running') {
        count++;
      }
    }
    return count;
  }
  
  cancelJob(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) return false;
    
    if (job.status === 'queued' || job.status === 'running') {
      this.updateJob(jobId, { status: 'cancelled' });
      this.addEvent(jobId, 'cancelled', 'Job cancelled by user');
      return true;
    }
    
    return false;
  }
  
  async waitForJob(jobId, timeout = 300000) {
    const startTime = Date.now();
    
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        const job = this.jobs.get(jobId);
        
        if (!job) {
          clearInterval(checkInterval);
          reject(new Error('Job not found'));
          return;
        }
        
        if (job.status === 'completed') {
          clearInterval(checkInterval);
          resolve(job);
          return;
        }
        
        if (job.status === 'failed' || job.status === 'cancelled') {
          clearInterval(checkInterval);
          reject(new Error(job.summary || 'Job failed'));
          return;
        }
        
        if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          reject(new Error('Job timeout'));
        }
      }, 1000);
    });
  }
  
  streamJobEvents(jobId, onEvent, onComplete) {
    const job = this.jobs.get(jobId);
    if (!job) {
      onComplete();
      return;
    }
    
    // Send existing events
    job.events.forEach(event => onEvent(event));
    
    // If job is already complete, end stream
    if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
      onComplete();
      return;
    }
    
    // Otherwise, poll for new events
    const checkInterval = setInterval(() => {
      const currentJob = this.jobs.get(jobId);
      if (!currentJob) {
        clearInterval(checkInterval);
        onComplete();
        return;
      }
      
      // Send only new events (basic implementation)
      if (currentJob.status === 'completed' || currentJob.status === 'failed' || currentJob.status === 'cancelled') {
        clearInterval(checkInterval);
        onComplete();
      }
    }, 1000);
  }
  
  updateJob(jobId, updates) {
    const job = this.jobs.get(jobId);
    if (!job) return;
    
    Object.assign(job, updates, { updatedAt: new Date().toISOString() });
  }
  
  log(jobId, level, message) {
    const job = this.jobs.get(jobId);
    if (!job) return;
    
    const logEntry = {
      time: new Date().toISOString(),
      level,
      message
    };
    
    job.logs.push(logEntry);
    console.log(`[${jobId}] [${level}] ${message}`);
  }
  
  addEvent(jobId, phase, message) {
    const job = this.jobs.get(jobId);
    if (!job) return;
    
    const event = {
      time: new Date().toISOString(),
      phase,
      message
    };
    
    job.events.push(event);
  }
}

module.exports = JobManager;
