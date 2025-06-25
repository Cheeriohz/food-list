import React, { useState, useEffect } from 'react';
import { useUnifiedData } from '../contexts/UnifiedDataContext';
import { Recipe } from '../types';
import UnifiedSearchBar from './UnifiedSearchBar';
import RecipeGrid from './RecipeGrid';
import RecipeDetail from './RecipeDetail';
import EmptySearchState from './EmptySearchState';
import AdvancedSearchFilters, { SearchFilters } from './AdvancedSearchFilters';
import { useTags } from '../contexts/TagContext';

interface SearchCentricLayoutProps {
  children?: React.ReactNode;
  onCreateRecipe?: () => void;
  onManageTags?: () => void;
  showEmptyState?: boolean;
}

const SearchCentricLayout: React.FC<SearchCentricLayoutProps> = ({ children, onCreateRecipe, onManageTags, showEmptyState = true }) => {
  const {
    searchQuery,
    searchResults,
    recipes,
    showResults,
    loading,
    indexing,
    error,
    selectedRecipeId,
    showRecipeDetail,
    setSearchQuery,
    clearSearch,
    selectRecipe,
    showRecipeDetailView
  } = useUnifiedData();

  const [searchFocused, setSearchFocused] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [browseMode, setBrowseMode] = useState(false);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    tags: [],
    prepTimeRange: [0, 180],
    cookTimeRange: [0, 240],
    servingsRange: [1, 12],
    sortBy: 'relevance',
    sortOrder: 'desc',
    hasDescription: null,
    minIngredients: null,
    maxIngredients: null
  });

  const { tags } = useTags();

  // Show results when there's a query, search is focused, or browse mode is active
  const shouldShowResults = showResults || searchQuery.length > 0 || searchFocused || browseMode;

  const handleFiltersReset = () => {
    setSearchFilters({
      tags: [],
      prepTimeRange: [0, 180],
      cookTimeRange: [0, 240],
      servingsRange: [1, 12],
      sortBy: 'relevance',
      sortOrder: 'desc',
      hasDescription: null,
      minIngredients: null,
      maxIngredients: null
    });
  };

  const handleBrowseAll = () => {
    setBrowseMode(true);
    setSearchFocused(false);
  };

  const handleBackToEmpty = () => {
    setBrowseMode(false);
    setSearchFocused(false);
    clearSearch();
    showRecipeDetailView(false);
    selectRecipe(null);
  };

  const handleRecipeClick = (recipeId: number) => {
    selectRecipe(recipeId);
    showRecipeDetailView(true);
  };

  const handleRecipeDetailBack = () => {
    showRecipeDetailView(false);
    selectRecipe(null);
  };

  // Get recipes to display
  const displayRecipes = searchQuery.length > 0 
    ? searchResults
        .filter(result => result.type === 'recipe')
        .map(result => recipes.find(r => r.id === result.id))
        .filter(Boolean) as Recipe[]
    : recipes;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchFocused(true);
        // Focus will be handled by the search bar component
      }
      
      // Escape to clear search and blur
      if (e.key === 'Escape') {
        if (searchQuery) {
          clearSearch();
        }
        setSearchFocused(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery, clearSearch]);

  if (error) {
    return (
      <div className="search-centric-layout error-state">
        <div className="error-container">
          <h2>⚠️ Something went wrong</h2>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="retry-button"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="search-centric-layout">
      {/* Header with search */}
      <header className="search-header">
        <div className="header-content">
          <h1 className="app-title">
            🍳 Recipe Manager
          </h1>
          
          <div className="search-container">
            <UnifiedSearchBar
              query={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search recipes, ingredients, or categories..."
            />
            
            {indexing && (
              <div className="indexing-indicator">
                <span className="spinner">⏳</span>
                Building search index...
              </div>
            )}
          </div>

          {/* Search stats */}
          {shouldShowResults && !loading && (
            <div className="search-stats">
              {searchQuery ? (
                <span>
                  Found {searchResults.length} recipes
                </span>
              ) : (
                <span>
                  {recipes.length} total recipes
                </span>
              )}
            </div>
          )}

          {/* Keyboard shortcuts hint */}
          {!shouldShowResults && (
            <div className="keyboard-hint">
              Press <kbd>Ctrl</kbd> + <kbd>K</kbd> to search
            </div>
          )}
        </div>
      </header>

      {/* Main content area */}
      <main className="search-content">
        {children ? (
          <div className="form-container fade-in">
            {children}
          </div>
        ) : shouldShowResults ? (
          loading ? (
            <div className="loading-state fade-in">
              <div className="loading-spinner">🔍</div>
              <p>Loading recipes...</p>
            </div>
          ) : (
            <div className="results-container fade-in">
              {browseMode && !searchQuery && (
                <div className="browse-header">
                  <button 
                    className="back-button"
                    onClick={handleBackToEmpty}
                  >
                    ← Back to Home
                  </button>
                  <h2>Browse All Recipes</h2>
                </div>
              )}
              {showRecipeDetail && selectedRecipeId ? (
                <RecipeDetail 
                  recipeId={selectedRecipeId}
                  onBack={handleRecipeDetailBack}
                />
              ) : (
                <>
                  <AdvancedSearchFilters
                    filters={searchFilters}
                    onFiltersChange={setSearchFilters}
                    availableTags={tags}
                    isOpen={filtersOpen}
                    onToggle={() => setFiltersOpen(!filtersOpen)}
                    onReset={handleFiltersReset}
                  />
                  <RecipeGrid 
                    recipes={displayRecipes}
                    onRecipeClick={handleRecipeClick}
                    loading={loading}
                  />
                </>
              )}
            </div>
          )
        ) : showEmptyState ? (
          <EmptySearchState 
            onSearchFocus={() => setSearchFocused(true)}
            onCreateRecipe={onCreateRecipe}
            onManageTags={onManageTags}
            onBrowseAll={handleBrowseAll}
          />
        ) : null}
      </main>

      {/* Additional content (for future features) */}

      <style>{`
        .search-centric-layout {
          min-height: 100vh;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          display: flex;
          flex-direction: column;
        }

        .search-header {
          background: rgba(255, 255, 255, 0.95);
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
          padding: 1.5rem 0;
          position: relative;
          z-index: 10;
          box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
        }

        .header-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .app-title {
          font-size: 2.5rem;
          font-weight: 700;
          color: #2c3e50;
          margin: 0;
          text-align: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .search-container {
          width: 100%;
          max-width: 600px;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          z-index: 20;
        }

        .indexing-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #666;
          font-size: 0.875rem;
          background: rgba(255, 193, 7, 0.1);
          padding: 0.5rem 1rem;
          border-radius: 20px;
          border: 1px solid rgba(255, 193, 7, 0.3);
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .search-stats {
          color: #666;
          font-size: 0.875rem;
          text-align: center;
          padding: 0.5rem 1rem;
          background: rgba(52, 152, 219, 0.1);
          border-radius: 15px;
          border: 1px solid rgba(52, 152, 219, 0.2);
        }

        .keyboard-hint {
          color: #999;
          font-size: 0.8rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .keyboard-hint kbd {
          background: #f1f1f1;
          border: 1px solid #ccc;
          border-radius: 3px;
          padding: 0.1rem 0.3rem;
          font-size: 0.75rem;
          font-family: monospace;
        }

        .search-content {
          flex: 1;
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          width: 100%;
          box-sizing: border-box;
          position: relative;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .results-container {
          width: 100%;
        }

        .browse-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(10px);
        }

        .back-button {
          background: rgba(52, 152, 219, 0.1);
          border: 1px solid rgba(52, 152, 219, 0.2);
          color: #3498db;
          padding: 0.75rem 1.25rem;
          border-radius: 25px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .back-button:hover {
          background: rgba(52, 152, 219, 0.2);
          border-color: rgba(52, 152, 219, 0.4);
          transform: translateX(-2px);
        }

        .browse-header h2 {
          margin: 0;
          color: #2c3e50;
          font-size: 1.5rem;
          font-weight: 700;
        }

        .fade-in {
          animation: fadeInSlide 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes fadeInSlide {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 300px;
          color: #666;
        }

        .loading-spinner {
          font-size: 3rem;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }

        .error-state {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 2rem;
        }

        .error-container {
          text-align: center;
          background: white;
          padding: 3rem;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          max-width: 500px;
        }

        .error-container h2 {
          color: #e74c3c;
          margin-bottom: 1rem;
        }

        .error-container p {
          color: #666;
          margin-bottom: 2rem;
          line-height: 1.6;
        }

        .retry-button {
          background: #3498db;
          color: white;
          border: none;
          padding: 0.75rem 2rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 500;
          transition: background 0.2s ease;
        }

        .retry-button:hover {
          background: #2980b9;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .header-content {
            padding: 0 1rem;
          }

          .app-title {
            font-size: 2rem;
          }

          .search-content {
            padding: 1rem;
          }

          .keyboard-hint {
            display: none;
          }
        }

        @media (max-width: 480px) {
          .app-title {
            font-size: 1.75rem;
          }

          .search-stats {
            font-size: 0.8rem;
            padding: 0.4rem 0.8rem;
          }
        }
      `}</style>
    </div>
  );
};

export default SearchCentricLayout;