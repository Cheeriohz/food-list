import { useState } from 'react';
import { UnifiedStateProvider, useUnifiedState } from './state/unified-state-context';
import SearchCentricLayout from './components/SearchCentricLayout';
import RecipeDetail from './components/RecipeDetail';
import RecipeForm from './components/RecipeForm';
import TagManagement from './components/TagManagement';

type ViewMode = 'list' | 'detail' | 'create' | 'manage-tags';

function AppContent() {
  const { loadRecipes } = useUnifiedState();
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');


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
    <SearchCentricLayout
      onCreateRecipe={handleCreateRecipe}
      onManageTags={handleManageTags}
    >
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
          onTagsChanged={loadRecipes}
        />
      ) : null}
    </SearchCentricLayout>
  );
}

function App() {
  return (
    <UnifiedStateProvider>
      <AppContent />
    </UnifiedStateProvider>
  );
}

export default App;