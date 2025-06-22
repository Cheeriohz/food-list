import React, { useState } from 'react';
import { RecipeProvider, useRecipes } from './contexts/RecipeContext';
import { TagProvider } from './contexts/TagContext';
import RecipeList from './components/RecipeList';
import RecipeDetail from './components/RecipeDetail';
import RecipeForm from './components/RecipeForm';
import TagManagement from './components/TagManagement';
import TagTree from './components/TagTree';
import SearchBar from './components/SearchBar';

type ViewMode = 'list' | 'detail' | 'create' | 'manage-tags';

function AppContent() {
  const { fetchRecipes } = useRecipes();
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

  const handleManageTags = (): void => {
    setViewMode('manage-tags');
  };

  return (
    <div className="App">
      <header className="header">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1>Recipe Manager</h1>
            {viewMode === 'list' && (
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={handleManageTags}
                  style={{
                    backgroundColor: '#3498db',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: 'bold'
                  }}
                >
                  Manage Tags
                </button>
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
              </div>
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
            ) : viewMode === 'manage-tags' ? (
              <TagManagement
                onBack={handleBackToList}
                onTagsChanged={fetchRecipes}
              />
            ) : (
              <RecipeList onRecipeClick={handleRecipeClick} />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <RecipeProvider>
      <TagProvider>
        <AppContent />
      </TagProvider>
    </RecipeProvider>
  );
}

export default App;