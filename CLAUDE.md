# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Running the Application
- `npm run dev` - Start both frontend and backend servers concurrently
- `npm run build` - Build both frontend and backend TypeScript to production
- `node start-app.ts` - Alternative TypeScript startup script (requires ts-node globally)
- `cd backend && npm run dev` - Run only the backend server (port 3001) with SQLite database
- `cd frontend && npm start` - Run only the frontend development server (port 3000)

### Alternative Frontend Startup Methods (if main startup fails)
- `cd frontend && npm run start:simple` - Quick HTML version with Python server
- `cd frontend && npm run start:node` - Simple Node.js server (no dependencies)
- `cd frontend && npm run start:npx` - Use npx to bypass local binary issues
- Open `frontend/public/simple.html` in browser (static version)

### Backend TypeScript Commands
- `cd backend && npm run build` - Compile TypeScript to JavaScript in `dist/` folder
- `cd backend && npm run dev` - Run TypeScript backend with ts-node and SQLite database
- `cd backend && npm run seed` - Seed SQLite database with sample data (TypeScript)
- `cd backend && npm start` - Run compiled JavaScript from `dist/` folder

### Frontend TypeScript Commands
- All React files are now `.tsx` and `.ts` extensions
- TypeScript compilation handled automatically by react-scripts
- `cd frontend && npm test` - Run React tests (TypeScript support included)
- `cd frontend && npm run build` - Build frontend for production

### Installation
- `npm run install-all` - Install dependencies for root, backend, and frontend
- Or manually: `npm install && cd backend && npm install && cd ../frontend && npm install`

## Architecture Overview

This is a full-stack recipe management application with hierarchical tag organization:

### Backend Architecture (`backend/src/`)
- **Express.js API server** written in TypeScript on port 3001
- **SQLite database** with persistent storage and referential integrity
- **Type definitions** in `types.ts` for Recipe, Tag, and API interfaces
- **Main server**: `server.ts` - SQLite-based server with full CRUD operations
- **Database schema**:
  - `recipes` - stores recipe data (title, ingredients, instructions, timing, etc.)
  - `tags` - hierarchical tag system with parent-child relationships
  - `recipe_tags` - junction table linking recipes to tags with foreign key constraints
- **Database initialization**: `database.ts` - schema creation and connection management
- **Sample data**: `seed.ts` - populates database with example recipes and tag hierarchy

### Frontend Architecture (`frontend/src/`)
- **React 18 application** written in TypeScript with Context API for state management
- **Shared type definitions** in `types.ts` for Recipe, Tag, and Context interfaces
- **Two main contexts** (TypeScript):
  - `RecipeContext.tsx` - manages recipe data, current recipe, loading states
  - `TagContext.tsx` - manages tag hierarchy, selected tags for filtering
- **Component structure** (all TypeScript):
  - `RecipeList.tsx` - displays recipe cards in grid layout
  - `RecipeDetail.tsx` - shows full recipe details
  - `TagTree.tsx` - renders hierarchical tag structure for filtering
  - `SearchBar.tsx` - handles text-based recipe search
- **TypeScript features**:
  - Strict typing for props and state
  - Type-safe API calls and responses
  - Interface definitions for all data structures

### API Endpoints
- `GET /api/recipes` - fetch all recipes with tags
- `GET /api/recipes/:id` - fetch specific recipe
- `POST /api/recipes` - create new recipe
- `PUT /api/recipes/:id` - update existing recipe
- `DELETE /api/recipes/:id` - delete recipe
- `GET /api/tags` - fetch tag hierarchy
- `POST /api/tags` - create new tag
- `GET /api/search?q=term&tags=tag1,tag2` - search recipes

### State Management Pattern
The application uses React Context with useReducer for state management. Both contexts follow similar patterns:
- Actions for SET_LOADING, SET_ERROR, SET_DATA
- API calls wrapped in try-catch with loading states
- Data fetched on context provider mount

### Database Schema (SQLite)
- **Hierarchical tags**: Tags can have parent_tag_id for tree structure with foreign key constraints
- **Many-to-many**: Recipes linked to tags via junction table with CASCADE deletes
- **Full recipe data**: Includes prep time, cook time, servings, timestamps
- **Search optimization**: Recipes joined with tags for filtering and search
- **Referential integrity**: Foreign key constraints ensure data consistency
- **Transaction support**: ACID properties for complex operations

### Development Notes
- **All code converted to TypeScript** with proper type definitions
- **Compilation**: Backend compiles to `backend/dist/`, frontend handled by react-scripts
- **Type safety**: Interfaces defined for all data structures and API responses
- **SQLite database**: Persistent storage with referential integrity and transaction support
- **Frontend development server** proxies API calls to backend
- **Sample data** available via TypeScript seed script (`npm run seed`)
- **CORS enabled** for local development
- **Database initialization**: Automatic schema creation on first run

### TypeScript Configuration
- **Backend**: Uses CommonJS modules, compiles to ES2020
- **Frontend**: Uses React JSX transform, includes DOM types
- **Shared types**: Recipe, Tag, and API interfaces defined in both projects
- **Development**: ts-node for backend development, react-scripts handles frontend

## Git Workflow Instructions
When creating or modifying files:
1. Add new/modified files to git tracking with `git add <filename>` 
2. DO NOT automatically stage changes for commit
3. DO NOT automatically commit changes  
4. Let the user review code changes before they decide to commit
5. Only commit when explicitly requested by the user

## Planning and Design Workflow
When asked to create a plan for new work:
1. Create a formal plan as a markdown file
2. Put feature plans in individual folders under `features/` at the project root
3. Put bug fix plans in individual folders under `bugs/` at the project root
4. Use descriptive folder names (e.g., `features/tag-management/`, `bugs/recipe-click-crash/`)
5. Store the main plan as `plan.md` within each feature/bug folder
6. Add plan files to git tracking for review and iteration
7. Include in plans: problem statement, solution approach, implementation steps, technical considerations
8. Wait for plan approval before proceeding with implementation

### Feature Folder Structure
Each feature should follow this structure:
```
features/
└── feature-name/
    ├── plan.md                    # Main feature plan
    └── validation/                # Validation documentation
        ├── validation-plan.md     # Test strategy and scenarios
        ├── puppeteer-tests.js     # Automated Puppeteer tests
        ├── manual-test-checklist.md # Manual testing checklist
        └── test-results.md        # Test execution results
```

### Bug Folder Structure
Each bug fix should follow this structure:
```
bugs/
└── bug-name/
    ├── plan.md                    # Bug analysis and fix plan
    └── validation/                # Validation documentation
        ├── reproduction-steps.md  # Steps to reproduce the bug
        ├── fix-validation.md      # Validation that fix works
        └── regression-tests.md    # Tests to prevent regression
```

## Documentation Workflow
When asked to create documentation of the current codebase (outside of features and bugfixes):
1. Create documentation under a `documentation/` folder at the project root
2. Structure documentation in a tree hierarchy:
   - First layer: Documentation type (e.g., `api/`, `architecture/`, `components/`, `deployment/`, `user-guides/`)
   - Subsequent layers: Organize as needed for each documentation type
3. Use descriptive filenames and maintain markdown format
4. Add documentation files to git tracking
5. Examples of documentation types:
   - `documentation/api/` - API endpoint documentation, request/response schemas
   - `documentation/architecture/` - System design, data flow, database schema
   - `documentation/components/` - Component interfaces, usage examples, props documentation
   - `documentation/deployment/` - Setup instructions, environment configuration, troubleshooting
   - `documentation/user-guides/` - End-user documentation, tutorials, workflows
   - `documentation/development/` - Coding standards, testing guidelines, contribution workflows

## Feature and Bug Validation Workflow
After implementing any feature or bug fix:
1. **Create comprehensive validation documentation** in the feature/bug validation folder
2. **Write Puppeteer automated tests** to validate the functionality works as expected
3. **Create manual test checklists** for human validation scenarios
4. **Execute both automated and manual tests** before considering work complete
5. **Document test results** and any issues found
6. **Use validation documents** for future regression testing and onboarding

### Validation Requirements
- **Every feature MUST have**: validation plan, Puppeteer tests, manual checklist
- **Every bug fix MUST have**: reproduction steps, fix validation, regression tests
- **Tests should cover**: functionality, performance, accessibility, edge cases
- **Document all test results** including failures and resolutions
- **Validation is not optional** - it's part of the definition of done

### Puppeteer Validation Setup and Execution

#### Prerequisites for Puppeteer Testing
1. **Browser Installation**: Ensure a Chrome/Chromium browser is available for remote debugging
   - If not installed: `sudo apt update && sudo apt install -y chromium-browser`
   - Alternative Chrome installation (if needed):
     ```bash
     wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
     echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list
     sudo apt update && sudo apt install -y google-chrome-stable
     ```

2. **Application Running**: Ensure both frontend and backend are running
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001
   - Start with: `npm run dev`

3. **Port Conflict Resolution**: Clear any existing processes if needed
   ```bash
   # Kill existing processes on common ports
   lsof -ti:3000 | xargs kill -9 2>/dev/null
   lsof -ti:3001 | xargs kill -9 2>/dev/null
   lsof -ti:9222 | xargs kill -9 2>/dev/null
   ```

#### Browser Setup for Remote Debugging
1. **Kill existing browser instances**:
   ```bash
   pkill -f "chrome\|chromium" 2>/dev/null
   sleep 3
   ```

2. **Start browser with remote debugging**:
   ```bash
   # For Chromium
   chromium-browser --remote-debugging-port=9222 --no-first-run --no-default-browser-check --disable-web-security --user-data-dir=/tmp/chromium_dev_session http://localhost:3000 > /dev/null 2>&1 &
   
   # For Chrome (if available)
   google-chrome --remote-debugging-port=9222 --no-first-run --no-default-browser-check --disable-web-security --user-data-dir=/tmp/chrome_dev_session http://localhost:3000 > /dev/null 2>&1 &
   ```

3. **Verify debugging port accessibility**:
   ```bash
   curl -s http://localhost:9222/json | head -3
   # Should return JSON with browser tab information
   ```

#### Puppeteer Test Execution Steps
1. **Connect to active browser tab**:
   ```typescript
   mcp__puppeteer__puppeteer_connect_active_tab({ targetUrl: "http://localhost:3000" })
   ```

2. **Standard validation test sequence**:
   - Take initial screenshot: `mcp__puppeteer__puppeteer_screenshot({ name: "01_initial_state" })`
   - Test search functionality: `mcp__puppeteer__puppeteer_fill({ selector: "input[placeholder*='Search']", value: "test_term" })`
   - Test navigation: `mcp__puppeteer__puppeteer_click({ selector: ".recipe-card:first-child" })`
   - Test responsive design: Change viewport and take screenshots
   - Document all results with descriptive screenshot names

3. **Common validation scenarios to test**:
   - Initial page load and empty states
   - Search functionality and results display
   - Card/item click navigation
   - Back button and navigation flow
   - Responsive design (mobile/tablet/desktop)
   - Empty search results handling
   - Performance timing

#### Troubleshooting Common Issues
1. **"Failed to connect to Chrome debugging port 9222"**:
   - Ensure browser was started with `--remote-debugging-port=9222` flag
   - Check if port 9222 is accessible: `curl -s http://localhost:9222/json`
   - Kill and restart browser with correct flags

2. **"Navigation failed: Attempted to use detached Frame"**:
   - Restart browser and reconnect
   - Ensure target URL is accessible: `curl -I http://localhost:3000`

3. **Application not responding**:
   - Check if frontend/backend are running: `curl -I http://localhost:3000` and `curl -I http://localhost:3001/api/recipes`
   - Restart application: `npm run dev`

4. **Browser won't start**:
   - Verify browser installation: `which chromium-browser` or `which google-chrome`
   - Install if missing (see Prerequisites section)

#### Best Practices for Validation
1. **Systematic screenshot naming**: Use descriptive, numbered names (e.g., `01_initial_load`, `02_search_results`, `03_mobile_responsive`)
2. **Test critical user journeys**: Focus on main user workflows end-to-end
3. **Document edge cases**: Test and screenshot error states, empty results, etc.
4. **Responsive testing**: Always test mobile viewport (375x667) and desktop (1280x720)
5. **Performance validation**: Note load times and interaction responsiveness
6. **Cross-browser consideration**: Document which browser was used for testing