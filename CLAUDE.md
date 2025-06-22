# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Running the Application
- `npm run dev` - Start both frontend and backend servers concurrently
- `npm run build` - Build both frontend and backend TypeScript to production
- `node start-app.ts` - Alternative TypeScript startup script (requires ts-node globally)
- `cd backend && npm run dev` - Run only the backend server (port 3001) in TypeScript mode
- `cd frontend && npm start` - Run only the frontend development server (port 3000)

### Alternative Frontend Startup Methods (if main startup fails)
- `cd frontend && npm run start:simple` - Quick HTML version with Python server
- `cd frontend && npm run start:node` - Simple Node.js server (no dependencies)
- `cd frontend && npm run start:npx` - Use npx to bypass local binary issues
- Open `frontend/public/simple.html` in browser (static version)

### Backend TypeScript Commands
- `cd backend && npm run build` - Compile TypeScript to JavaScript in `dist/` folder
- `cd backend && npm run dev` - Run TypeScript backend with ts-node (memory database)
- `cd backend && npm run dev:sqlite` - Run TypeScript backend with SQLite database
- `cd backend && npm run seed` - Seed database with sample data (TypeScript)
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
- **Two database options**:
  - `memory-database.ts` - In-memory database with sample data (default)
  - `database.ts` + `server.ts` - SQLite database with persistence
- **Type definitions** in `types.ts` for Recipe, Tag, and API interfaces
- **Main servers**:
  - `simple-server.ts` - Uses memory database (default)
  - `server.ts` - Uses SQLite database (requires sqlite3 installation)
- **Database schema** (SQLite version):
  - `recipes` - stores recipe data (title, ingredients, instructions, timing, etc.)
  - `tags` - hierarchical tag system with parent-child relationships
  - `recipe_tags` - junction table linking recipes to tags

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

### Database Schema
- **Hierarchical tags**: Tags can have parent_tag_id for tree structure
- **Many-to-many**: Recipes linked to tags via junction table
- **Full recipe data**: Includes prep time, cook time, servings, timestamps
- **Search optimization**: Recipes joined with tags for filtering and search

### Development Notes
- **All code converted to TypeScript** with proper type definitions
- **Compilation**: Backend compiles to `backend/dist/`, frontend handled by react-scripts
- **Type safety**: Interfaces defined for all data structures and API responses
- **Database flexibility**: Choose between memory database (default) or SQLite
- **Frontend development server** proxies API calls to backend
- **Sample data** available via TypeScript seed script
- **CORS enabled** for local development
- **Both servers** can run independently or concurrently

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