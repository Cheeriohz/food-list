import React, { useState, useEffect } from 'react';
import { useUnifiedState } from '../state/unified-state-context';
import { Recipe } from '../types';
import UnifiedSearchBar from './UnifiedSearchBar';
import RecipeGrid from './RecipeGrid';
import RecipeDetail from './RecipeDetail';
import EmptySearchState from './EmptySearchState';
import AdvancedSearchFilters, { SearchFilters } from './AdvancedSearchFilters';
import ThemeToggle from './ThemeToggle';
import './SearchCentricLayout.css';

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
    tags,
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
  } = useUnifiedState();

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
          <div className="header-actions">
            <ThemeToggle />
          </div>
          
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
    </div>
  );
};

export default SearchCentricLayout;