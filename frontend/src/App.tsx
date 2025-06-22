import React, { useState } from 'react';
import { RecipeProvider } from './contexts/RecipeContext';
import { TagProvider } from './contexts/TagContext';
import RecipeList from './components/RecipeList';
import RecipeDetail from './components/RecipeDetail';
import RecipeForm from './components/RecipeForm';
import TagTree from './components/TagTree';
import SearchBar from './components/SearchBar';

type ViewMode = 'list' | 'detail' | 'create';

function App() {
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const handleRecipeClick = (recipeId: number): void => {
    setSelectedRecipeId(recipeId);
    setViewMode('detail');
  };

  const handleBackToList = (): void => {
    setSelectedRecipeId(null);
    setViewMode('list');
  };

  const handleCreateRecipe = (): void => {
    setViewMode('create');
  };

  const handleCreateSuccess = (): void => {
    setViewMode('list');
  };

  const handleCreateCancel = (): void => {
    setViewMode('list');
  };

  return (
    <RecipeProvider>
      <TagProvider>
        <div className="App">
          <header className="header">
            <div className="container">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>Recipe Manager</h1>
                {viewMode === 'list' && (
                  <button
                    onClick={handleCreateRecipe}
                    style={{
                      backgroundColor: '#27ae60',
                      color: 'white',
                      border: 'none',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: 'bold'
                    }}
                  >
                    + Create Recipe
                  </button>
                )}
              </div>
            </div>
          </header>
          
          <div className="container">
            <div className="main-content">
              {viewMode === 'list' && (
                <aside className="sidebar">
                  <SearchBar />
                  <TagTree />
                </aside>
              )}
              
              <main className="content">
                {viewMode === 'detail' && selectedRecipeId ? (
                  <RecipeDetail
                    recipeId={selectedRecipeId}
                    onBack={handleBackToList}
                  />
                ) : viewMode === 'create' ? (
                  <RecipeForm
                    onCancel={handleCreateCancel}
                    onSuccess={handleCreateSuccess}
                  />
                ) : (
                  <RecipeList onRecipeClick={handleRecipeClick} />
                )}
              </main>
            </div>
          </div>
        </div>
      </TagProvider>
    </RecipeProvider>
  );
}

export default App;