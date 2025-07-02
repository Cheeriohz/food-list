---
description: "Implement bug fixes based on existing bugplan analysis"
allowed-tools: ["Read", "Write", "Edit", "MultiEdit", "Glob", "Grep", "Bash", "TodoWrite", "TodoRead", "mcp__puppeteer__puppeteer_screenshot", "mcp__puppeteer__puppeteer_navigate", "mcp__puppeteer__puppeteer_connect_active_tab"]
---

# Bug Implementation Process

We are beginning the implementation phase of bug resolution. This command follows the bugplan analysis and executes the planned fixes.

## Implementation Phase Process
1. **Locate Bug Analysis**: Find the specified bug directory under `bugfixes/`
2. **Read PLAN.md**: Load and parse the existing bug analysis and implementation plan
3. **Create Implementation Tracking**: Create an `IMPLEMENTATION.md` file to track progress
4. **Execute Planned Steps**: Follow the step-by-step implementation plan from the analysis
5. **Track Progress**: Document implementation decisions, challenges, and solutions
6. **Verify Changes**: Execute the verification checklist from the plan
7. **Document Results**: Create `VERIFICATION.md` with test results and validation

## Implementation Tracking Requirements
The implementation must be tracked with:
- **Step-by-step progress**: Document each implementation step as it's completed
- **Code changes made**: List all files modified, created, or deleted
- **Implementation decisions**: Document any deviations from the original plan and reasoning
- **Challenges encountered**: Record any issues found during implementation and how they were resolved
- **Testing performed**: Document verification steps executed and their results

## Code Deliverables
The implementation should deliver:
- **Completed code changes**: All planned fixes implemented according to the analysis
- **Working functionality**: The bug should be resolved and verified
- **Clean implementation**: Code should follow project standards and conventions
- **No regressions**: Existing functionality should remain intact

## Documentation Deliverables
Create in the bug directory:
- **`IMPLEMENTATION.md`**: Detailed log of implementation process, decisions, and changes made
- **`VERIFICATION.md`**: Results of verification testing, including:
  - Checklist completion status
  - Test results (pass/fail)
  - Screenshots or evidence where applicable
  - Performance impact assessment
  - Any remaining issues or follow-up needed

## Verification Standards
- Execute all verification steps from the original PLAN.md
- Validate that the root cause has been addressed
- Confirm no new issues were introduced
- Test both happy path and edge cases
- Verify cross-component integration still works
- Document any deviations from expected results

## Quality Standards
- Follow existing code patterns and conventions
- Maintain TypeScript strict mode compliance
- Ensure proper error handling
- Add appropriate comments only where necessary
- Follow TDD principles if new functionality is added

## Arguments
Use `$ARGUMENTS` to specify the bug directory name or reference.

Example usage: `/project:bugfix "recipe-card-context-error"`

## Process Flow
1. Parse `$ARGUMENTS` to identify target bug
2. Read `bugfixes/{bug-name}/PLAN.md`
3. Create `bugfixes/{bug-name}/IMPLEMENTATION.md`
4. Execute implementation steps sequentially
5. Track progress in IMPLEMENTATION.md
6. Run verification checklist
7. Create `bugfixes/{bug-name}/VERIFICATION.md`
8. Report completion status