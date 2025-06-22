# Component Relationships Documentation

## Overview

This document describes the component hierarchy, data flow, and relationships within the Recipe Management application. The application follows a hierarchical component structure with React Context for state management.

## Component Hierarchy

```
App.tsx (Root Component)
├── RecipeProvider (Context)
│   ├── TagProvider (Context)
│   │   ├── SearchBar.tsx
│   │   ├── TagTree.tsx
│   │   ├── RecipeList.tsx
│   │   │   └── RecipeCard (internal component)
│   │   ├── RecipeDetail.tsx
│   │   │   ├── TagChip.tsx (multiple instances)
│   │   │   └── RecipeTagEditor.tsx
│   │   │       ├── TagAutocomplete.tsx
│   │   │       ├── TagChip.tsx (multiple instances)
│   │   │       └── TagHierarchyBrowser.tsx
│   │   ├── RecipeForm.tsx
│   │   │   ├── TagAutocomplete.tsx
│   │   │   └── TagChip.tsx (multiple instances)
│   │   └── TagManagement.tsx
│   │       ├── TagAutocomplete.tsx
│   │       ├── TagChip.tsx (multiple instances)
│   │       └── DeleteConfirmation (internal component)
```

## Component Dependencies

### Core Components

#### App.tsx
- **Purpose**: Root application component and router
- **Dependencies**: RecipeProvider, TagProvider
- **State**: Current view mode (`'list' | 'detail' | 'create' | 'manage-tags'`)
- **Props**: None (root component)

#### Context Providers

##### RecipeProvider
- **File**: `contexts/RecipeContext.tsx`
- **Purpose**: Manages global recipe state and API operations
- **Dependencies**: None
- **Provides**:
  - Recipe CRUD operations
  - Current recipe state
  - Loading/error states
  - Search functionality

##### TagProvider  
- **File**: `contexts/TagContext.tsx`
- **Purpose**: Manages tag hierarchy and selection state
- **Dependencies**: None
- **Provides**:
  - Tag CRUD operations
  - Tag hierarchy structure
  - Selected tags for filtering
  - Tag relationship management

### View Components

#### RecipeList.tsx
- **Purpose**: Grid display of recipe cards
- **Dependencies**: 
  - `useRecipes()` hook
  - `TagChip` component
- **Props**:
  ```typescript
  interface RecipeListProps {
    onRecipeClick: (id: number) => void;
  }
  ```
- **Internal Components**: `RecipeCard`

#### RecipeDetail.tsx
- **Purpose**: Full recipe display with tag editing capability
- **Dependencies**:
  - `useRecipes()` hook
  - `useTags()` hook
  - `TagChip` component
  - `RecipeTagEditor` component
- **Props**:
  ```typescript
  interface RecipeDetailProps {
    recipeId: number;
    onBack: () => void;
  }
  ```

#### RecipeForm.tsx
- **Purpose**: Recipe creation/editing form
- **Dependencies**:
  - `useRecipes()` hook
  - `useTags()` hook
  - `TagAutocomplete` component
  - `TagChip` component
- **Props**:
  ```typescript
  interface RecipeFormProps {
    onBack: () => void;
    onRecipeCreated?: () => void;
  }
  ```

#### TagManagement.tsx
- **Purpose**: Tag hierarchy management interface
- **Dependencies**:
  - `useTags()` hook
  - `TagAutocomplete` component
  - `TagChip` component
- **Props**:
  ```typescript
  interface TagManagementProps {
    onBack: () => void;
    onTagsChanged?: () => void;
  }
  ```

### Reusable Components

#### TagAutocomplete.tsx
- **Purpose**: Searchable tag selection with keyboard navigation
- **Dependencies**: None (pure component)
- **Used By**: RecipeTagEditor, TagManagement, RecipeForm
- **Props**:
  ```typescript
  interface TagAutocompleteProps {
    tags: Tag[];
    selectedTagIds?: number[];
    onTagSelect: (tag: Tag | null) => void;
    placeholder?: string;
    excludeTagIds?: number[];
    className?: string;
    allowNoParent?: boolean;
    value?: string;
    onChange?: (value: string) => void;
  }
  ```

#### TagChip.tsx
- **Purpose**: Consistent tag display with action capabilities
- **Dependencies**: None (pure component)
- **Used By**: RecipeList, RecipeDetail, RecipeTagEditor, TagManagement
- **Props**:
  ```typescript
  interface TagChipProps {
    tag: Tag;
    variant?: 'normal' | 'staged-add' | 'staged-remove';
    onRemove?: (tag: Tag) => void;
    onClick?: (tag: Tag) => void;
    removable?: boolean;
    size?: 'small' | 'medium' | 'large';
  }
  ```

#### TagHierarchyBrowser.tsx
- **Purpose**: Expandable tree view for tag browsing
- **Dependencies**: None (pure component)
- **Used By**: RecipeTagEditor
- **Props**:
  ```typescript
  interface TagHierarchyBrowserProps {
    tags: Tag[];
    selectedTagNames?: string[];
    onTagSelect?: (tag: Tag) => void;
    onTagToggle?: (tagName: string) => void;
    searchQuery?: string;
    selectionMode?: 'single' | 'multiple' | 'none';
    showExpandableControls?: boolean;
    title?: string;
    className?: string;
  }
  ```

#### RecipeTagEditor.tsx
- **Purpose**: Advanced tag editing with staging functionality
- **Dependencies**:
  - `TagAutocomplete` component
  - `TagChip` component
  - `TagHierarchyBrowser` component
  - `useTagValidation` hook
- **Used By**: RecipeDetail
- **Props**:
  ```typescript
  interface RecipeTagEditorProps {
    recipe: Recipe;
    allTags: Tag[];
    onSave: (tagIds: number[]) => Promise<void>;
    onCancel: () => void;
    isExpanded?: boolean;
  }
  ```

## Data Flow

### State Management Flow

```mermaid
graph TD
    A[App.tsx] --> B[RecipeProvider]
    B --> C[TagProvider]
    C --> D[Child Components]
    
    B --> E[Recipe State]
    C --> F[Tag State]
    
    E --> G[recipes: Recipe[]]
    E --> H[currentRecipe: Recipe | null]
    E --> I[loading: boolean]
    E --> J[error: string | null]
    
    F --> K[tags: Tag[]]
    F --> L[selectedTags: string[]]
    F --> M[loading: boolean]
    F --> N[error: string | null]
    
    D --> O[useRecipes() hook]
    D --> P[useTags() hook]
    
    O --> Q[CRUD Operations]
    P --> R[Tag Operations]
```

### Component Communication Patterns

#### Parent-to-Child Communication
- **Props**: Primary mechanism for passing data and callbacks
- **Context**: Global state access via hooks
- **Example**:
  ```typescript
  // App.tsx passes callback to RecipeList
  <RecipeList onRecipeClick={(id) => setCurrentView('detail')} />
  
  // RecipeDetail accesses global state
  const { currentRecipe } = useRecipes();
  ```

#### Child-to-Parent Communication
- **Callback Props**: Functions passed down as props
- **Context Actions**: Direct context method calls
- **Example**:
  ```typescript
  // TagManagement notifies parent of changes
  <TagManagement onTagsChanged={() => fetchRecipes()} />
  
  // RecipeTagEditor saves via context
  await updateRecipeTags(recipeId, tagIds);
  ```

#### Sibling Communication
- **Shared Context**: Components communicate via shared state
- **Parent Coordination**: Parent component orchestrates sibling updates
- **Example**:
  ```typescript
  // TagTree selection affects RecipeList display
  const { selectedTags } = useTags(); // Both components use same context
  ```

## Component Reusability

### Reusable Component Design Principles

1. **Single Responsibility**: Each component has one clear purpose
2. **Prop Interface**: Well-defined TypeScript interfaces
3. **Controlled/Uncontrolled**: Flexible state management patterns
4. **Styling Isolation**: Self-contained styling
5. **Event Handling**: Consistent callback patterns

### Reusability Matrix

| Component | Reusability Level | Usage Count | Standardized Interface |
|-----------|------------------|-------------|----------------------|
| TagChip | High | 4+ components | ✅ Complete |
| TagAutocomplete | High | 3 components | ✅ Complete |
| TagHierarchyBrowser | Medium | 1-2 components | ✅ Complete |
| RecipeTagEditor | Low | 1 component | ✅ Specialized |

### Component Extraction Benefits

1. **Code Reduction**: ~40% reduction in duplicate tag-related code
2. **Consistency**: Uniform UX across tag interactions
3. **Maintainability**: Single source of truth for tag components
4. **Testing**: Isolated component testing capabilities
5. **Performance**: Optimized rendering with React.memo potential

## Hooks and Custom Logic

### Custom Hooks

#### useTagValidation
- **File**: `hooks/useTagValidation.ts`
- **Purpose**: Validates staged tag changes for conflicts
- **Used By**: RecipeTagEditor
- **Returns**:
  ```typescript
  interface ValidationResult {
    hasConflicts: boolean;
    conflictingTags: Tag[];
    duplicateAdditions: Tag[];
    unnecessaryRemovals: Tag[];
    isValid: boolean;
  }
  ```

### Context Hooks

#### useRecipes()
- **Provides**: Recipe state and operations
- **Methods**: fetchRecipes, createRecipe, updateRecipe, deleteRecipe, updateRecipeTags
- **State**: recipes, currentRecipe, loading, error

#### useTags()
- **Provides**: Tag state and operations  
- **Methods**: fetchTags, createTag, deleteTag, selectTag, deselectTag
- **State**: tags, selectedTags, loading, error

## Future Considerations

### Scalability Patterns
1. **Code Splitting**: Lazy load non-critical components
2. **Memoization**: React.memo for expensive renders
3. **State Optimization**: Selector patterns for large datasets
4. **Component Libraries**: Extract to shared component library

### Extension Points
1. **Plugin Architecture**: Tag editor could support custom fields
2. **Theme System**: Centralized styling configuration
3. **Internationalization**: Component text externalization
4. **Accessibility**: ARIA support and keyboard navigation

---

*This documentation follows React/TypeScript best practices and is maintained alongside component implementations.*