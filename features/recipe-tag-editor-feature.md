# Recipe Tag Editor Feature Plan

## Problem Statement

The current recipe detail view only displays tags but doesn't allow users to modify them. Users need the ability to:

- Add new tags to existing recipes
- Remove tags from existing recipes  
- Stage multiple tag changes before committing them
- Search and browse available tags in a user-friendly interface
- See visual feedback for pending changes before applying them

Currently, tag modification requires deleting and recreating recipes, which is cumbersome and destroys recipe history.

## Current State Analysis

### Existing Components That Need Refactoring
- **TagManagement.tsx** - Contains autocomplete logic that should be extracted
- **RecipeDetail.tsx** - Static tag display, needs editing capabilities
- **TagTree.tsx** - Hierarchical display, could be made more flexible
- **RecipeForm.tsx** - Has tag selection, but different pattern than needed

### Reusable Patterns Identified
- **Autocomplete functionality** from TagManagement (search, keyboard nav, dropdown)
- **Tag hierarchy traversal** from TagTree
- **Tag chip display** from multiple components
- **Form staging patterns** from RecipeForm

## Solution Approach

### Core Design Principles
1. **Maximum Component Reuse** - Extract common patterns into reusable components
2. **Staged Changes** - Allow multiple modifications before committing
3. **Progressive Enhancement** - Expand existing RecipeDetail without breaking current functionality
4. **Consistent UX** - Use established patterns from TagManagement autocomplete

### Visual Design Concept
```
┌─ Recipe Detail ────────────────────────────────────────┐
│ Title, Description, Ingredients, Instructions...       │
│                                                        │
│ Current Tags: [Dinner] [Medium Effort] [Weeknight]    │
│ ┌─ Edit Tags [▼] ─────────────────────────────────┐   │
│ │ 🔍 Search tags...                    [×]        │   │
│ │ ┌─ Suggestions ─────────────────────────────┐   │   │
│ │ │ > Breakfast                               │   │   │
│ │ │ > Quick & Easy                            │   │   │
│ │ │ > Healthy                                 │   │   │
│ │ └───────────────────────────────────────────┘   │   │
│ │                                                 │   │
│ │ Staged Changes:                                 │   │
│ │ + Adding: [Healthy] [Quick & Easy]              │   │
│ │ - Removing: [Medium Effort]                     │   │
│ │                                                 │   │
│ │ [Cancel] [Apply Changes]                        │   │
│ └─────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────┘
```

## Implementation Plan

### Phase 1: Extract Reusable Components

#### 1.1 Create TagAutocomplete Component
**Purpose**: Reusable autocomplete with tag search and selection
**Extracted from**: TagManagement.tsx parent tag selection logic

**Features**:
- Search filtering with keyboard navigation
- Dropdown with highlighting
- Click outside to close
- Enter/Escape key handling
- Custom placeholder and styling props

**Props Interface**:
```typescript
interface TagAutocompleteProps {
  tags: Tag[];
  selectedTagIds?: number[];
  onTagSelect: (tag: Tag) => void;
  placeholder?: string;
  excludeTagIds?: number[]; // Don't show already selected tags
  className?: string;
}
```

#### 1.2 Create TagChip Component  
**Purpose**: Consistent tag display with optional actions
**Extracted from**: Multiple components (RecipeDetail, TagTree, etc.)

**Features**:
- Consistent tag styling
- Optional delete/remove button
- Different visual states (normal, staged-add, staged-remove)
- Click handlers

**Props Interface**:
```typescript
interface TagChipProps {
  tag: Tag;
  variant?: 'normal' | 'staged-add' | 'staged-remove';
  onRemove?: (tag: Tag) => void;
  onClick?: (tag: Tag) => void;
  removable?: boolean;
}
```

#### 1.3 Create TagHierarchyBrowser Component
**Purpose**: Reusable expandable tag tree navigation
**Refactored from**: TagTree.tsx

**Features**:
- Hierarchical tag display
- Expandable/collapsible sections
- Search filtering
- Selection callbacks
- Different selection modes (single, multiple)

### Phase 2: Recipe Tag Editor Component

#### 2.1 Create RecipeTagEditor Component
**Purpose**: Main tag editing interface with staging

**Features**:
- Expandable/collapsible panel
- Integration with TagAutocomplete
- Staged changes management
- Current tags display with removal options
- Commit/cancel functionality

**State Management**:
```typescript
interface TagEditorState {
  isExpanded: boolean;
  stagedAdditions: Set<number>; // Tag IDs to add
  stagedRemovals: Set<number>;  // Tag IDs to remove
  searchQuery: string;
  showDropdown: boolean;
}
```

**Key Methods**:
- `stageTagAddition(tag: Tag)` - Add tag to staged additions
- `stageTagRemoval(tag: Tag)` - Add tag to staged removals  
- `unstageTag(tag: Tag)` - Remove from staging
- `commitChanges()` - Apply all staged changes via API
- `cancelChanges()` - Clear all staged changes
- `getEffectiveTags()` - Current tags + additions - removals

#### 2.2 Visual State Management
**Current Tags**: Show with remove buttons
**Staged Additions**: Show with green chips and "+" indicator
**Staged Removals**: Show current tags with red strikethrough and "-" indicator
**Effective Preview**: Optional preview of final tag state

### Phase 3: Integration with RecipeDetail

#### 3.1 Update RecipeDetail Component
- Add RecipeTagEditor below current tag display
- Integrate with RecipeContext for updates
- Handle loading states during tag updates
- Refresh recipe data after successful changes

#### 3.2 Update RecipeContext
- Add `updateRecipeTags(id: number, tags: string[])` method
- Handle optimistic updates vs server confirmation
- Proper error handling and rollback

### Phase 4: Enhanced User Experience

#### 4.1 Advanced Features
- **Bulk Operations**: "Remove all tags", "Add category preset"
- **Smart Suggestions**: Recently used tags, related tags
- **Keyboard Shortcuts**: Ctrl+T to open editor, Escape to cancel
- **Change Preview**: Show before/after tag comparison

#### 4.2 Validation and Feedback
- **Conflict Detection**: Warn about adding/removing same tag
- **Change Summary**: "Adding 2 tags, removing 1 tag"
- **Undo Support**: Recent changes history (future enhancement)

## Technical Implementation Details

### Component Extraction Strategy

#### From TagManagement.tsx:
```typescript
// Extract this logic into TagAutocomplete
const autocompleteLogic = {
  handleKeyDown,
  handleParentTagInputChange,
  getDropdownOptions,
  highlightedIndex management
};
```

#### Shared Interfaces:
```typescript
interface TagSelectionEvent {
  tag: Tag;
  action: 'add' | 'remove';
  source: 'autocomplete' | 'chip' | 'tree';
}

interface StagedChanges {
  additions: Tag[];
  removals: Tag[];
  hasChanges: boolean;
}
```

### State Management Pattern
```typescript
// RecipeTagEditor will manage staging
const [stagedChanges, setStagedChanges] = useState<StagedChanges>({
  additions: [],
  removals: [],
  hasChanges: false
});

// Methods to update staging
const addToStaging = (tag: Tag, action: 'add' | 'remove') => {
  // Logic to manage staged additions/removals
  // Handle conflicts (adding a tag staged for removal)
};
```

### API Integration
```typescript
// New RecipeContext method
const updateRecipeTags = async (recipeId: number, newTags: string[]) => {
  const response = await fetch(`/api/recipes/${recipeId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...currentRecipe, tags: newTags })
  });
  // Handle response and refresh
};
```

## Component Reusability Matrix

| Component | Used By | Reusability Benefit |
|-----------|---------|-------------------|
| TagAutocomplete | RecipeTagEditor, TagManagement, RecipeForm | Consistent search UX |
| TagChip | RecipeDetail, RecipeList, TagEditor | Consistent tag display |
| TagHierarchyBrowser | Tag filtering, Tag selection | Flexible tree navigation |

## User Experience Flow

### Opening Tag Editor
1. User views recipe detail
2. Clicks "Edit Tags" or "+" button next to tags
3. Panel expands with current tags and autocomplete

### Making Changes  
1. User types in autocomplete to find tags
2. Selects tag → Added to "staged additions"
3. Clicks "×" on current tag → Added to "staged removals"
4. Sees live preview of staged changes

### Committing Changes
1. User reviews staged changes summary
2. Clicks "Apply Changes" 
3. Loading state while API updates
4. Success: Panel collapses, recipe refreshes
5. Error: Shows error, keeps staging for retry

### Canceling Changes
1. User clicks "Cancel" or "×" 
2. All staged changes cleared
3. Panel collapses or stays open with original state

## Risk Assessment

### Technical Risks
- **Component Extraction Complexity**: Medium - requires careful interface design
- **State Synchronization**: Medium - staging state must stay consistent  
- **Performance**: Low - tag operations are lightweight

### User Experience Risks
- **Learning Curve**: Low - builds on familiar autocomplete pattern
- **Staging Confusion**: Medium - clear visual indicators mitigate this
- **Accidental Changes**: Low - staging + confirmation prevents this

## Success Criteria

### Functional Requirements
- ✅ Users can add tags to existing recipes
- ✅ Users can remove tags from existing recipes  
- ✅ Multiple changes can be staged before committing
- ✅ Changes are reflected immediately after commit
- ✅ Components are reusable across the application

### Technical Requirements
- ✅ Consistent autocomplete behavior across components
- ✅ Proper error handling and rollback on failures
- ✅ Performance remains acceptable with large tag sets
- ✅ Code reuse reduces overall bundle size

### User Experience Requirements
- ✅ Intuitive staging and commit workflow
- ✅ Clear visual feedback for pending changes
- ✅ Keyboard navigation works consistently
- ✅ Mobile-friendly responsive design

## Implementation Timeline

- **Phase 1 (Component Extraction)**: 4-6 hours
- **Phase 2 (RecipeTagEditor)**: 6-8 hours  
- **Phase 3 (Integration)**: 2-3 hours
- **Phase 4 (Enhancements)**: 3-4 hours
- **Total Estimated Effort**: 15-21 hours

This plan provides a comprehensive approach to recipe tag editing while maximizing component reusability and maintaining consistency with existing application patterns.