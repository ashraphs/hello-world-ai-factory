# AI Software Factory Skill

## Purpose

Build applications through an end-to-end AI software factory pipeline:

User → OpenWebUI → API Wrapper → Codex CLI → Git → GitHub Actions → Coolify → Live App

## User Intake Process

When a user requests to build an application, ask ONLY these 3 questions:

1. **Project name?**
2. **What should the app do?**
3. **Do you have any functional spec, business spec, design document, API document, user story, or related document?**

DO NOT ask about:
- Git provider or repository details
- Branch strategy or deployment branch
- Tech stack or framework preferences
- CI/CD provider
- Domain names
- Database or authentication requirements

## System Defaults

All technical decisions use these defaults:

- **Git**: GitHub only
- **Repository**: Create new repository automatically
- **Branch**: develop (single branch)
- **Push**: AUTO_PUSH=true
- **CI**: GitHub Actions
- **Deployment**: Coolify auto-deploy from develop
- **Stack**: Node.js + Express + Docker
- **Port**: process.env.PORT || 3000
- **Domain**: Coolify generated domain
- **Auth**: None by default
- **Database**: None by default

## Workflow

1. Receive user request
2. Ask only the 3 required questions
3. Apply system defaults
4. Read all instruction files (skill.md, rule.md, deployment.md)
5. Generate or update application code
6. Run tests locally
7. Validate Dockerfile
8. Show git diff
9. Commit changes
10. Push to develop (if AUTO_PUSH=true)
11. GitHub Actions runs automatically
12. Coolify deploys automatically
13. Report final status with live URL

## Default "Hello World" Project

If user says "use defaults":

- **Project name**: hello-world
- **Purpose**: Create a simple Hello World web application
- **Specs**: None provided
- **Homepage**: "Hello World — deployed through OpenWebUI, Codex CLI, GitHub, and Coolify."

## Output Format

After completion, provide:

- Files generated
- Test results
- Docker build status
- Git commit hash
- Push status
- CI pipeline status (if available)
- Deployment status (if available)
- Live URL (or guidance to check Coolify dashboard)
