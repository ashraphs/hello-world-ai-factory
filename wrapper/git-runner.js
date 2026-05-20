const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class GitRunner {
  async initializeRepo(workspace) {
    const appDir = `${workspace}/app`;
    
    try {
      // Check if git repo exists
      await execAsync('git rev-parse --git-dir', { cwd: appDir });
      console.log('Git repository already initialized');
    } catch {
      // Initialize git
      console.log('Initializing git repository...');
      await execAsync('git init', { cwd: appDir });
      await execAsync('git checkout -b develop', { cwd: appDir });
      
      // Add remote if configured
      const githubToken = process.env.GITHUB_TOKEN;
      const githubOwner = process.env.GITHUB_OWNER;
      const githubRepo = process.env.GITHUB_REPO;
      
      if (githubToken && githubOwner && githubRepo) {
        const remoteUrl = `https://${githubToken}@github.com/${githubOwner}/${githubRepo}.git`;
        await execAsync(`git remote add origin ${remoteUrl}`, { cwd: appDir });
        console.log('Git remote configured');
      } else {
        console.log('GitHub credentials not configured - skipping remote setup');
      }
    }
  }
  
  async commit(workspace, message) {
    const appDir = `${workspace}/app`;
    
    try {
      // Configure git user if needed
      try {
        await execAsync('git config user.email "ai-factory@example.com"', { cwd: appDir });
        await execAsync('git config user.name "AI Factory"', { cwd: appDir });
      } catch (e) {
        // Ignore if already configured
      }
      
      // Add all files
      await execAsync('git add .', { cwd: appDir });
      
      // Check if there are changes
      const { stdout: status } = await execAsync('git status --porcelain', { cwd: appDir });
      
      if (!status.trim()) {
        console.log('No changes to commit');
        return false;
      }
      
      // Commit
      await execAsync(`git commit -m "${message}"`, { cwd: appDir });
      console.log('Changes committed');
      
      return true;
    } catch (error) {
      console.error('Commit failed:', error.message);
      throw new Error('Git commit failed');
    }
  }
  
  async push(workspace) {
    const appDir = `${workspace}/app`;
    const branch = process.env.GIT_BRANCH || 'develop';
    
    // Check if remote is configured
    try {
      const { stdout } = await execAsync('git remote -v', { cwd: appDir });
      
      if (!stdout.includes('origin')) {
        console.log('No git remote configured - skipping push');
        console.log('To enable push, configure GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_REPO');
        return false;
      }
      
      // Push
      console.log(`Pushing to ${branch}...`);
      await execAsync(`git push -u origin ${branch}`, { cwd: appDir });
      console.log('Push successful');
      
      return true;
    } catch (error) {
      console.error('Push failed:', error.message);
      console.log('Push failed - this is expected if GitHub credentials are not configured');
      return false;
    }
  }
}

module.exports = GitRunner;
