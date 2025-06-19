import React, { useState } from 'react';
import { RecipeProvider } from './contexts/RecipeContext';
import { TagProvider } from './contexts/TagContext';
import RecipeList from './components/RecipeList';
import RecipeDetail from './components/RecipeDetail';
import TagTree from './components/TagTree';
import SearchBar from './components/SearchBar';

function App() {
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null);

  const handleRecipeClick = (recipeId: number): void => {
    setSelectedRecipeId(recipeId);
  };

  const handleBackToList = (): void => {
    setSelectedRecipeId(null);
  };

  return (
    <RecipeProvider>
      <TagProvider>
        <div className="App">
          <header className="header">
            <div className="container">
              <h1>Recipe Manager</h1>
            </div>
          </header>
          
          <div className="container">
            <div className="main-content">
              {!selectedRecipeId && (
                <aside className="sidebar">
                  <SearchBar />
                  <TagTree />
                </aside>
              )}
              
              <main className="content">
                {selectedRecipeId ? (
                  <RecipeDetail
                    recipeId={selectedRecipeId}
                    onBack={handleBackToList}
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