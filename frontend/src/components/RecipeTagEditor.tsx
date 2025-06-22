import React, { useState, useEffect } from 'react';
import { Recipe, Tag } from '../types';
import TagAutocomplete from './TagAutocomplete';
import TagChip from './TagChip';
import TagHierarchyBrowser from './TagHierarchyBrowser';
import useTagValidation from '../hooks/useTagValidation';

interface RecipeTagEditorProps {
  recipe: Recipe;
  allTags: Tag[];
  onSave: (tagIds: number[]) => Promise<void>;
  onCancel: () => void;
  isExpanded?: boolean;
}

interface StagedChange {
  tagId: number;
  action: 'add' | 'remove';
  tag: Tag;
}

const RecipeTagEditor: React.FC<RecipeTagEditorProps> = ({
  recipe,
  allTags,
  onSave,
  onCancel,
  isExpanded = false
}) => {
  const [stagedChanges, setStagedChanges] = useState<StagedChange[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showHierarchyBrowser, setShowHierarchyBrowser] = useState(false);
  const [saving, setSaving] = useState(false);
  const [recentlyUsedTags, setRecentlyUsedTags] = useState<Tag[]>([]);
  const [showChangePreview, setShowChangePreview] = useState(false);

  // Get current tag IDs from recipe
  const currentTagIds = recipe.tags?.map(tag => tag.id).filter(id => id !== undefined) as number[] || [];
  
  // Validation hook
  const validation = useTagValidation(stagedChanges, currentTagIds);

  // Calculate effective tag state (current + staged changes)
  const getEffectiveTagIds = (): number[] => {
    let effectiveIds = [...currentTagIds];
    
    stagedChanges.forEach(change => {
      if (change.action === 'add' && !effectiveIds.includes(change.tagId)) {
        effectiveIds.push(change.tagId);
      } else if (change.action === 'remove') {
        effectiveIds = effectiveIds.filter(id => id !== change.tagId);
      }
    });
    
    return effectiveIds;
  };

  const getEffectiveTags = (): Tag[] => {
    const effectiveIds = getEffectiveTagIds();
    const flatTags = getAllTagsFlat(allTags);
    return flatTags.filter(tag => tag.id && effectiveIds.includes(tag.id));
  };

  const getAllTagsFlat = (tagList: Tag[]): Tag[] => {
    let flatTags: Tag[] = [];
    const traverse = (tags: Tag[]) => {
      for (const tag of tags) {
        flatTags.push(tag);
        if (tag.children) {
          traverse(tag.children);
        }
      }
    };
    traverse(tagList);
    return flatTags;
  };

  const getTagById = (id: number): Tag | undefined => {
    return getAllTagsFlat(allTags).find(tag => tag.id === id);
  };

  const addStagedChange = (tag: Tag, action: 'add' | 'remove') => {
    if (!tag.id) return;

    setStagedChanges(prev => {
      // Remove any existing change for this tag
      const filtered = prev.filter(change => change.tagId !== tag.id);
      
      // Add new change
      return [...filtered, {
        tagId: tag.id!,
        action,
        tag
      }];
    });
  };

  const removeStagedChange = (tagId: number) => {
    setStagedChanges(prev => prev.filter(change => change.tagId !== tagId));
  };

  const handleTagSelect = (tag: Tag | null) => {
    if (!tag?.id) return;

    const isCurrentlyOnRecipe = currentTagIds.includes(tag.id);
    const effectiveIds = getEffectiveTagIds();
    const isEffectivelyOnRecipe = effectiveIds.includes(tag.id);

    if (isEffectivelyOnRecipe) {
      // Tag is currently on recipe (either originally or staged to add)
      if (isCurrentlyOnRecipe) {
        // Originally on recipe, stage for removal
        addStagedChange(tag, 'remove');
      } else {
        // Staged for addition, remove the staging
        removeStagedChange(tag.id);
      }
    } else {
      // Tag is not on recipe, stage for addition
      addStagedChange(tag, 'add');
    }

    setSearchQuery('');
  };

  const handleTagToggle = (tagName: string) => {
    const tag = getAllTagsFlat(allTags).find(t => t.name === tagName);
    if (tag) {
      handleTagSelect(tag);
    }
  };

  const handleChipRemove = (tag: Tag) => {
    if (!tag.id) return;
    
    const isCurrentlyOnRecipe = currentTagIds.includes(tag.id);
    if (isCurrentlyOnRecipe) {
      addStagedChange(tag, 'remove');
    } else {
      removeStagedChange(tag.id);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const finalTagIds = getEffectiveTagIds();
      await onSave(finalTagIds);
      
      // Update recently used tags
      const addedTags = stagedChanges
        .filter(change => change.action === 'add')
        .map(change => change.tag);
      
      setRecentlyUsedTags(prev => {
        const combined = [...addedTags, ...prev];
        const unique = combined.filter((tag, index, arr) => 
          arr.findIndex(t => t.id === tag.id) === index
        );
        return unique.slice(0, 5); // Keep only 5 most recent
      });
      
      setStagedChanges([]);
      setShowChangePreview(false);
    } catch (error) {
      console.error('Failed to save tag changes:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setStagedChanges([]);
    setSearchQuery('');
    setShowHierarchyBrowser(false);
    onCancel();
  };

  const getTagDisplayVariant = (tag: Tag): 'normal' | 'staged-add' | 'staged-remove' => {
    if (!tag.id) return 'normal';
    
    const stagedChange = stagedChanges.find(change => change.tagId === tag.id);
    if (stagedChange) {
      return stagedChange.action === 'add' ? 'staged-add' : 'staged-remove';
    }
    
    return 'normal';
  };

  const hasChanges = stagedChanges.length > 0;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isExpanded) return;
      
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && hasChanges) {
        e.preventDefault();
        handleSave();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded, hasChanges]);

  // Bulk operations
  const handleRemoveAllTags = () => {
    const currentTags = recipe.tags || [];
    currentTags.forEach(tag => {
      if (tag.id && currentTagIds.includes(tag.id)) {
        addStagedChange(tag, 'remove');
      }
    });
  };

  const getRecentTagSuggestions = () => {
    const effectiveIds = getEffectiveTagIds();
    return recentlyUsedTags.filter(tag => 
      tag.id && !effectiveIds.includes(tag.id)
    ).slice(0, 3);
  };

  const getChangeSummary = () => {
    const additions = stagedChanges.filter(c => c.action === 'add').length;
    const removals = stagedChanges.filter(c => c.action === 'remove').length;
    
    if (additions === 0 && removals === 0) return '';
    
    const parts = [];
    if (additions > 0) parts.push(`Adding ${additions} tag${additions > 1 ? 's' : ''}`);
    if (removals > 0) parts.push(`Removing ${removals} tag${removals > 1 ? 's' : ''}`);
    
    return parts.join(', ');
  };

  if (!isExpanded) return null;

  return (
    <div style={{
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      padding: '1rem',
      marginTop: '1rem',
      backgroundColor: '#f9f9f9'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: '1rem',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        <div style={{ flex: '1', minWidth: '200px' }}>
          <h3 style={{ margin: 0, color: '#2c3e50' }}>Edit Recipe Tags</h3>
          <small style={{ color: '#666', fontSize: '0.75rem', display: 'block', marginTop: '0.25rem' }}>
            Press Escape to cancel • Ctrl+Enter to save changes
          </small>
        </div>
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          {(recipe.tags?.length || 0) > 0 && (
            <button
              onClick={handleRemoveAllTags}
              style={{
                backgroundColor: '#e74c3c',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
              title="Remove all tags"
            >
              Clear All
            </button>
          )}
          <button
            onClick={() => setShowChangePreview(!showChangePreview)}
            disabled={!hasChanges}
            style={{
              backgroundColor: hasChanges ? '#f39c12' : '#95a5a6',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: hasChanges ? 'pointer' : 'not-allowed',
              fontSize: '0.875rem'
            }}
            title="Preview changes"
          >
            Preview
          </button>
          <button
            onClick={() => setShowHierarchyBrowser(!showHierarchyBrowser)}
            style={{
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            {showHierarchyBrowser ? 'Hide' : 'Browse'} Tags
          </button>
        </div>
      </div>

      {/* Tag Autocomplete */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Add Tags:
        </label>
        <TagAutocomplete
          tags={allTags}
          onTagSelect={handleTagSelect}
          placeholder="Search and select tags to add..."
          excludeTagIds={getEffectiveTagIds()}
          value={searchQuery}
          onChange={setSearchQuery}
        />
        
        {/* Recent Tag Suggestions */}
        {getRecentTagSuggestions().length > 0 && (
          <div style={{ marginTop: '0.5rem' }}>
            <small style={{ color: '#666', marginBottom: '0.25rem', display: 'block' }}>
              Recently used:
            </small>
            <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
              {getRecentTagSuggestions().map(tag => (
                <button
                  key={tag.id}
                  onClick={() => handleTagSelect(tag)}
                  style={{
                    backgroundColor: '#e8f4fd',
                    color: '#1976d2',
                    border: '1px solid #bbdefb',
                    borderRadius: '12px',
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                  title={`Add ${tag.name}`}
                >
                  + {tag.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Change Preview */}
      {showChangePreview && hasChanges && (
        <div style={{
          backgroundColor: '#fff9e6',
          border: '1px solid #ffd43b',
          borderRadius: '4px',
          padding: '1rem',
          marginBottom: '1rem'
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#b8860b' }}>Change Preview</h4>
          <div style={{ fontSize: '0.875rem' }}>
            <strong>{getChangeSummary()}</strong>
            <div style={{ marginTop: '0.5rem' }}>
              {stagedChanges.filter(c => c.action === 'add').length > 0 && (
                <div style={{ marginBottom: '0.5rem' }}>
                  <span style={{ color: '#27ae60', fontWeight: 'bold' }}>Adding: </span>
                  {stagedChanges
                    .filter(c => c.action === 'add')
                    .map(c => c.tag.name)
                    .join(', ')}
                </div>
              )}
              {stagedChanges.filter(c => c.action === 'remove').length > 0 && (
                <div>
                  <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>Removing: </span>
                  {stagedChanges
                    .filter(c => c.action === 'remove')
                    .map(c => c.tag.name)
                    .join(', ')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tag Hierarchy Browser */}
      {showHierarchyBrowser && (
        <div style={{
          border: '1px solid #ddd',
          borderRadius: '4px',
          padding: '1rem',
          marginBottom: '1rem',
          backgroundColor: 'white',
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          <TagHierarchyBrowser
            tags={allTags}
            selectedTagNames={getEffectiveTags().map(tag => tag.name)}
            onTagToggle={handleTagToggle}
            searchQuery={searchQuery}
            selectionMode="multiple"
            showExpandableControls={true}
            title="Tag Hierarchy"
          />
        </div>
      )}

      {/* Current Tags Display */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Current Tags:
        </label>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          minHeight: '2rem',
          padding: '0.5rem',
          border: '1px solid #ddd',
          borderRadius: '4px',
          backgroundColor: 'white'
        }}>
          {getEffectiveTags().length === 0 ? (
            <span style={{ color: '#999', fontStyle: 'italic' }}>No tags assigned</span>
          ) : (
            getEffectiveTags().map(tag => (
              <TagChip
                key={tag.id}
                tag={tag}
                variant={getTagDisplayVariant(tag)}
                removable={true}
                onRemove={handleChipRemove}
                size="medium"
              />
            ))
          )}
        </div>
      </div>

      {/* Validation Warnings */}
      {validation.hasConflicts && (
        <div style={{
          backgroundColor: '#ffebee',
          border: '1px solid #ffcdd2',
          borderRadius: '4px',
          padding: '0.75rem',
          marginBottom: '1rem'
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#d32f2f' }}>⚠️ Validation Issues</h4>
          {validation.conflictingTags.length > 0 && (
            <div style={{ marginBottom: '0.5rem', fontSize: '0.875rem', color: '#d32f2f' }}>
              <strong>Conflicting changes:</strong> {validation.conflictingTags.map(tag => tag.name).join(', ')} 
              (being both added and removed)
            </div>
          )}
          {validation.duplicateAdditions.length > 0 && (
            <div style={{ marginBottom: '0.5rem', fontSize: '0.875rem', color: '#d32f2f' }}>
              <strong>Already present:</strong> {validation.duplicateAdditions.map(tag => tag.name).join(', ')}
            </div>
          )}
          {validation.unnecessaryRemovals.length > 0 && (
            <div style={{ fontSize: '0.875rem', color: '#d32f2f' }}>
              <strong>Not present:</strong> {validation.unnecessaryRemovals.map(tag => tag.name).join(', ')}
            </div>
          )}
        </div>
      )}

      {/* Enhanced Staged Changes Summary */}
      {hasChanges && !showChangePreview && (
        <div style={{
          backgroundColor: validation.isValid ? '#fff3cd' : '#ffebee',
          border: `1px solid ${validation.isValid ? '#ffeaa7' : '#ffcdd2'}`,
          borderRadius: '4px',
          padding: '0.75rem',
          marginBottom: '1rem'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '0.5rem'
          }}>
            <h4 style={{ margin: 0, color: validation.isValid ? '#856404' : '#d32f2f' }}>
              Pending Changes: {getChangeSummary()}
              {!validation.isValid && ' (Issues detected)'}
            </h4>
            <button
              onClick={() => setShowChangePreview(true)}
              style={{
                background: 'none',
                border: `1px solid ${validation.isValid ? '#ffeaa7' : '#ffcdd2'}`,
                borderRadius: '3px',
                padding: '0.25rem 0.5rem',
                fontSize: '0.75rem',
                cursor: 'pointer',
                color: validation.isValid ? '#856404' : '#d32f2f'
              }}
            >
              View Details
            </button>
          </div>
          <div style={{ fontSize: '0.875rem', color: validation.isValid ? '#856404' : '#d32f2f' }}>
            {validation.isValid 
              ? 'Click individual tags below to undo changes, or use "Save Changes" to apply all.'
              : 'Please resolve validation issues before saving changes.'
            }
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        gap: '0.5rem',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={handleCancel}
          disabled={saving}
          style={{
            backgroundColor: '#95a5a6',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '4px',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: '1rem'
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!hasChanges || saving || !validation.isValid}
          style={{
            backgroundColor: hasChanges && !saving && validation.isValid ? '#27ae60' : 
                           hasChanges && !validation.isValid ? '#e74c3c' : '#95a5a6',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '4px',
            cursor: hasChanges && !saving && validation.isValid ? 'pointer' : 'not-allowed',
            fontSize: '1rem',
            position: 'relative'
          }}
          title={
            !hasChanges ? 'No changes to save' :
            !validation.isValid ? 'Please resolve validation issues' :
            `${getChangeSummary()} • Ctrl+Enter`
          }
        >
          {saving ? 'Saving...' : 
           !validation.isValid ? '⚠️ Cannot Save' :
           hasChanges ? `Save Changes (${stagedChanges.length})` : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default RecipeTagEditor;