import React, { useState } from 'react';
import { RecipeProvider, useRecipes } from './contexts/RecipeContext';
import { TagProvider } from './contexts/TagContext';
import { UnifiedDataProvider } from './contexts/UnifiedDataContext';
import SearchCentricLayout from './components/SearchCentricLayout';
import RecipeList from './components/RecipeList';
import RecipeDetail from './components/RecipeDetail';
import RecipeForm from './components/RecipeForm';
import TagManagement from './components/TagManagement';

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
    <SearchCentricLayout>
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
      ) : null}
    </SearchCentricLayout>
  );
}

function App() {
  return (
    <RecipeProvider>
      <TagProvider>
        <UnifiedDataProvider>
          <AppContent />
        </UnifiedDataProvider>
      </TagProvider>
    </RecipeProvider>
  );
}

export default App;