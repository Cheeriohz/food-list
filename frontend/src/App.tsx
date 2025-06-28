import { useState, useEffect } from 'react';
import { UnifiedStateProvider, useUnifiedState } from './state/unified-state-context';
import { ThemeProvider } from './contexts/ThemeContext';
import SearchCentricLayout from './components/SearchCentricLayout';
import RecipeDetail from './components/RecipeDetail';
import RecipeForm from './components/RecipeForm';
import TagManagement from './components/TagManagement';
import { manualThemeTests } from './utils/manualThemeTest';
import { AccessibilityValidator } from './utils/accessibilityValidator';

type ViewMode = 'list' | 'detail' | 'create' | 'manage-tags';

function AppContent() {
  const { loadRecipes } = useUnifiedState();
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Make manual theme tests available for development testing
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      (window as any).manualThemeTests = manualThemeTests;
      (window as any).accessibilityValidator = new AccessibilityValidator();
      console.log('🧪 Manual theme tests available: window.manualThemeTests.runAllTests()');
      console.log('♿ Accessibility validator available: window.accessibilityValidator.runFullAccessibilityAudit()');
    }
  }, []);


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
    <ThemeProvider>
      <UnifiedStateProvider>
        <AppContent />
      </UnifiedStateProvider>
    </ThemeProvider>
  );
}

export default App;