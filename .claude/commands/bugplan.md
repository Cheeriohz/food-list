---
description: "Structured bug analysis and resolution planning"
allowed-tools: ["Read", "Glob", "Grep", "LS", "Write", "mcp__puppeteer__puppeteer_screenshot", "mcp__puppeteer__puppeteer_navigate", "mcp__puppeteer__puppeteer_connect_active_tab"]
---

# Bug Analysis Process

We are beginning the discovery phase of bug resolution. Follow this structured process:

## Discovery Phase Process
1. **Create Analysis Directory**: Create a directory under `bugfixes/` at root for the working assessment
2. **Create PLAN.md**: In that directory, create a `PLAN.md` file to contain the analysis
3. **Conduct Analysis**: Read relevant parts of the repo, leverage puppeteer tooling for UI exploration
4. **NO CODE CHANGES**: This is analysis only - implementation follows later

## Required Deliverables
The analysis must include:
- **Initial problem statement**: Clear description of the bug and its impact
- **Root cause of the issue**: Technical analysis of what's causing the problem
- **Code files that need to be updated**: Specific file paths and components affected
- **Proposed implementation**: Detailed plan to fix the issue
- **Verification checklist**: Step-by-step actions to resolve and verify resolution

## Documentation Standards
- Be specific and detailed
- Create documentation effective for future LLM pickup
- Break down complex problems into manageable steps
- Include file paths, line numbers, and code references where relevant
- Use puppeteer tooling for UI exploration when applicable

## Arguments
Use `$ARGUMENTS` to specify the bug description or issue to analyze.

Example usage: `/project:bugplan "Search functionality not working on mobile"`