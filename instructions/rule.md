# AI Software Factory Rules

## Safety Rules

1. **Workspace Isolation**: Never modify files outside the designated WORKSPACE directory
2. **Secret Protection**: Never print environment variables, API keys, or tokens
3. **No Destructive Commands**: Never run system-level destructive commands (rm -rf /, format, etc.)
4. **No System File Modification**: Never modify /etc, /usr, /System, or other system directories
5. **No Private Key Access**: Never read or modify SSH keys, certificates, or credentials

## User Interaction Rules

1. **Three Questions Only**: Only ask the 3 required intake questions
2. **No Tech Stack Questions**: Never ask about frameworks, languages, databases, or deployment platforms
3. **Apply Defaults Automatically**: Use system defaults for all technical decisions
4. **Clear Communication**: Provide clear status updates during execution
5. **Error Transparency**: If something fails, explain what failed and why

## Git Rules

1. **Branch**: Always use `develop` branch
2. **Remote**: Use `origin` as remote name
3. **Commit Message Format**: Clear, descriptive messages prefixed with "AI Factory:"
4. **Pre-Push Validation**: Always run tests before pushing
5. **AUTO_PUSH Respect**: Only push if AUTO_PUSH=true

## Testing Rules

1. **Tests Required**: Every application must have tests
2. **Pre-Commit Testing**: Run tests before committing
3. **Test Failure Blocks**: If tests fail, do not commit or push
4. **Docker Validation**: Validate Dockerfile builds successfully before push

## Code Generation Rules

1. **Port Configuration**: Always use `process.env.PORT || 3000`
2. **Environment Variables**: Use environment variables for configuration
3. **Documentation**: Include README.md with setup instructions
4. **Dockerization**: Every app must have a Dockerfile
5. **Gitignore**: Include .gitignore with node_modules, .env, etc.

## Deployment Rules

1. **Deployment Branch**: Coolify deploys from `develop` branch
2. **Dockerfile Deployment**: Use Dockerfile for deployment
3. **Port Exposure**: Let Coolify handle port mapping
4. **Domain**: Use Coolify generated domain
5. **No Manual Deployment**: Rely on auto-deploy from GitHub push

## Progress Reporting Rules

1. **Phase Updates**: Report current phase (reading, generating, testing, etc.)
2. **Log Important Actions**: Log file creation, test execution, git operations
3. **Stream Events**: Use event streaming for real-time progress in OpenWebUI
4. **Final Summary**: Provide comprehensive summary at completion
5. **URL Reporting**: Include live URL if available, or guidance to find it

## Error Handling Rules

1. **Graceful Degradation**: Continue with reduced functionality if optional features fail
2. **Clear Error Messages**: Explain what went wrong in user-friendly terms
3. **Recovery Suggestions**: Provide actionable steps to resolve errors
4. **No Silent Failures**: Always report failures, never hide them
5. **Credential Guidance**: If GitHub/Coolify credentials missing, clearly list what's needed
