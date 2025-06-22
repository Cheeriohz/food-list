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
2. Put feature plans in a `features/` folder at the project root
3. Put bug fix plans in a `bugs/` folder at the project root
4. Name files descriptively (e.g., `tag-management-feature.md`, `recipe-click-crash-bug.md`)
5. Add plan files to git tracking for review and iteration
6. Include in plans: problem statement, solution approach, implementation steps, technical considerations
7. Wait for plan approval before proceeding with implementation

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

## Current Project Status (TEMPORARY - Remove on next session)

**IMPORTANT**: This section contains temporary project status information for session continuity. 
Remove this entire section when starting work in the next session to avoid polluting future context.

### Hierarchical Search Interface Implementation Status

**✅ COMPLETED: Phases 2 & 3**
- **Phase 2**: Search-First Interface Components (Complete)
  - SearchCentricLayout with keyboard shortcuts and responsive design
  - UnifiedSearchBar with intelligent suggestions and navigation
  - EmptySearchState with rotating tips and popular searches
  - HierarchicalResultsTree placeholder

- **Phase 3**: Hierarchical Tree Component (Complete)
  - Real hierarchical tree rendering with TreeNode data
  - Expandable/collapsible tree nodes with state management
  - Virtual scrolling for performance (50+ items trigger)
  - Recipe cards that expand to show full details
  - Search results highlighting and filtering integration

**🚧 PENDING: Phase 4 Enhanced UX Features**
- Phase 4.1: Keyboard navigation for tree nodes
- Phase 4.2: Drag and drop for tag organization  
- Phase 4.3: Recipe comparison feature
- Phase 4.4: Advanced search filters and sorting

### Key Implementation Files
- `/features/hierarchical-search-interface-feature.md` - Complete implementation plan
- `/frontend/src/services/SearchIndexService.ts` - Enterprise search engine with TF-IDF
- `/frontend/src/services/TreeDataService.ts` - Hierarchical data transformation
- `/frontend/src/contexts/UnifiedDataContext.tsx` - Centralized state management
- `/frontend/src/components/SearchCentricLayout.tsx` - Main search-first layout
- `/frontend/src/components/UnifiedSearchBar.tsx` - Intelligent search with suggestions
- `/frontend/src/components/EmptySearchState.tsx` - Landing page with tips
- `/frontend/src/components/HierarchicalResultsTree.tsx` - Full tree implementation
- `/frontend/src/components/VirtualScrollTree.tsx` - Performance optimization

### Current State
- All Phase 2 & 3 code is implemented and staged for commit
- TypeScript compilation clean (no errors)
- Build process working correctly
- Ready for Phase 4 implementation or deployment

### To Resume Phase 4 Work
1. Review `/features/hierarchical-search-interface-feature.md` for Phase 4 details
2. Current code is staged but not committed
3. Start with Phase 4.1 (keyboard navigation) as most accessible next step