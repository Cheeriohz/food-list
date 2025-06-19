# Recipe Management App

A local React application for managing recipes with tree-like tag organization, built with React frontend and Node.js/Express backend with SQLite database.

## Features

- **Recipe Management**: Create, view, update, and delete recipes
- **Hierarchical Tag System**: Organize recipes with a tree-like tag structure
- **Search & Filter**: Search recipes by text and filter by tags
- **Local Storage**: SQLite database for persistent local storage
- **Responsive UI**: Clean, simple interface focused on functionality

## Project Structure

```
recipe-management-app/
├── backend/                 # Express.js API server
│   ├── server.js           # Main server file
│   ├── database.js         # SQLite database setup
│   ├── seed.js            # Sample data seeder
│   └── package.json       # Backend dependencies
├── frontend/               # React application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # Context API for state management
│   │   ├── App.js        # Main App component
│   │   └── index.js      # Entry point
│   └── package.json      # Frontend dependencies
└── package.json          # Root package with scripts
```

## Setup Instructions

### Prerequisites

- Node.js (v14 or later)
- npm

### Installation

1. **Clone or download the project**
   ```bash
   cd recipe-management-app
   ```

2. **Install all dependencies**
   ```bash
   # Install root dependencies (concurrently for running both servers)
   npm install

   # Install backend dependencies
   cd backend && npm install

   # Install frontend dependencies
   cd ../frontend && npm install
   ```

3. **Seed the database with sample data** (optional)
   ```bash
   cd backend
   node seed.js
   ```

### Running the Application

#### Development Mode (Both servers concurrently)
```bash
# From the root directory
npm run dev
```

This will start:
- Backend API server on http://localhost:3001
- Frontend React app on http://localhost:3000

#### Individual Servers

**Backend only:**
```bash
cd backend
npm run dev
```

**Frontend only:**
```bash
cd frontend
npm start
```

## API Endpoints

### Recipes
- `GET /api/recipes` - Get all recipes
- `GET /api/recipes/:id` - Get specific recipe
- `POST /api/recipes` - Create new recipe
- `PUT /api/recipes/:id` - Update recipe
- `DELETE /api/recipes/:id` - Delete recipe

### Tags
- `GET /api/tags` - Get all tags with hierarchy
- `POST /api/tags` - Create new tag

### Search
- `GET /api/search?q=term&tags=tag1,tag2` - Search recipes

## Database Schema

### Tables
- **recipes**: id, title, description, ingredients, instructions, prep_time, cook_time, servings, created_at, updated_at
- **tags**: id, name, parent_tag_id, created_at
- **recipe_tags**: recipe_id, tag_id (junction table)

## Usage

1. **View Recipes**: The main page displays all recipes in a grid layout
2. **Search**: Use the search bar to find recipes by text
3. **Filter by Tags**: Click on tags in the sidebar to filter recipes
4. **View Recipe Details**: Click on any recipe card to view full details
5. **Tag Hierarchy**: Tags are organized in a tree structure (Cuisine > Italian, Meal Type > Dinner, etc.)

## Sample Data

The application includes sample recipes and a tag hierarchy:
- **Tag Categories**: Cuisine, Meal Type, Dietary
- **Sample Recipes**: Spaghetti Carbonara, Veggie Breakfast Bowl, Chicken Tacos, Tofu Stir Fry

## Development Notes

- Frontend uses Context API for state management
- Backend uses SQLite for local database storage
- API includes CORS configuration for local development
- Frontend proxy configuration routes API calls to backend
- Simple, clean UI focusing on functionality over styling