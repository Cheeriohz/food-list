import React, { useState, useEffect, useRef } from 'react';
import { useTags } from '../contexts/TagContext';
import { Tag } from '../types';

interface TagManagementProps {
  onBack: () => void;
  onTagsChanged?: () => void;
}

interface DeleteConfirmationProps {
  tag: Tag;
  affectedRecipes: any[];
  promotedChildren: any[];
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({
  tag,
  affectedRecipes,
  promotedChildren,
  onConfirm,
  onCancel,
  loading
}) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '2rem',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ marginBottom: '1rem', color: '#e74c3c' }}>
          Delete Tag: "{tag.name}"
        </h3>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ marginBottom: '1rem' }}>
            Are you sure you want to delete this tag? This action cannot be undone.
          </p>
          
          {affectedRecipes.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ marginBottom: '0.5rem', color: '#e67e22' }}>
                Impact: {affectedRecipes.length} recipe(s) will be affected
              </h4>
              <div style={{
                backgroundColor: '#fff3cd',
                border: '1px solid #ffeaa7',
                borderRadius: '4px',
                padding: '0.75rem',
                marginBottom: '1rem'
              }}>
                <strong>Affected Recipes:</strong>
                <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
                  {affectedRecipes.map((recipe: any) => (
                    <li key={recipe.id}>{recipe.title}</li>
                  ))}
                </ul>
                <small>These recipes will no longer have the "{tag.name}" tag.</small>
              </div>
            </div>
          )}
          
          {promotedChildren.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ marginBottom: '0.5rem', color: '#3498db' }}>
                {promotedChildren.length} child tag(s) will be promoted
              </h4>
              <div style={{
                backgroundColor: '#d4edda',
                border: '1px solid #c3e6cb',
                borderRadius: '4px',
                padding: '0.75rem'
              }}>
                <strong>Child tags to be promoted:</strong>
                <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
                  {promotedChildren.map((child: any) => (
                    <li key={child.id}>{child.name}</li>
                  ))}
                </ul>
                <small>These tags will move up one level in the hierarchy.</small>
              </div>
            </div>
          )}
          
          {affectedRecipes.length === 0 && promotedChildren.length === 0 && (
            <div style={{
              backgroundColor: '#d4edda',
              border: '1px solid #c3e6cb',
              borderRadius: '4px',
              padding: '0.75rem',
              marginBottom: '1rem'
            }}>
              ✅ No recipes or child tags will be affected by this deletion.
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              backgroundColor: '#95a5a6',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '1rem'
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              backgroundColor: loading ? '#c0392b' : '#e74c3c',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '1rem'
            }}
          >
            {loading ? 'Deleting...' : 'Delete Tag'}
          </button>
        </div>
      </div>
    </div>
  );
};

const TagManagement: React.FC<TagManagementProps> = ({ onBack, onTagsChanged }) => {
  const { tags, loading, error, createTag, deleteTag, getTagRecipes } = useTags();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
  const [parentTagInput, setParentTagInput] = useState('');
  const [showParentDropdown, setShowParentDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    tag: Tag;
    affectedRecipes: any[];
    promotedChildren: any[];
  } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setShowParentDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  const getFilteredTags = (): Tag[] => {
    if (!parentTagInput.trim()) return getAllTagsFlat(tags);
    return getAllTagsFlat(tags).filter(tag => 
      tag.name.toLowerCase().includes(parentTagInput.toLowerCase())
    );
  };

  const getDropdownOptions = (): (Tag | null)[] => {
    const filtered = getFilteredTags();
    // Add null option for "No parent" when input is empty or when searching
    if (!parentTagInput.trim()) {
      return [null, ...filtered];
    }
    return filtered;
  };

  const handleParentTagSelect = (tag: Tag | null) => {
    if (tag) {
      setSelectedParentId(tag.id || null);
      setParentTagInput(tag.name);
    } else {
      setSelectedParentId(null);
      setParentTagInput('');
    }
    setShowParentDropdown(false);
    setHighlightedIndex(-1);
  };

  const handleParentTagInputChange = (value: string) => {
    setParentTagInput(value);
    setShowParentDropdown(true);
    setHighlightedIndex(-1);
    
    // If input exactly matches a tag name, select it
    const exactMatch = getAllTagsFlat(tags).find(tag => 
      tag.name.toLowerCase() === value.toLowerCase()
    );
    if (exactMatch) {
      setSelectedParentId(exactMatch.id || null);
    } else if (value === '') {
      setSelectedParentId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showParentDropdown) return;

    const options = getDropdownOptions();
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < options.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : options.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < options.length) {
          handleParentTagSelect(options[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowParentDropdown(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const clearParentSelection = () => {
    setSelectedParentId(null);
    setParentTagInput('');
    setShowParentDropdown(false);
    setHighlightedIndex(-1);
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    try {
      await createTag({
        name: newTagName.trim(),
        parent_tag_id: selectedParentId
      });
      setNewTagName('');
      setSelectedParentId(null);
      setParentTagInput('');
      setShowParentDropdown(false);
      setShowCreateForm(false);
      onTagsChanged?.();
    } catch (err) {
      console.error('Failed to create tag:', err);
    }
  };

  const handleDeleteClick = async (tag: Tag) => {
    if (!tag.id) return;

    try {
      // Get impact data
      const affectedRecipes = await getTagRecipes(tag.id);
      const promotedChildren = tag.children || [];
      
      setDeleteConfirmation({
        tag,
        affectedRecipes,
        promotedChildren
      });
    } catch (err) {
      console.error('Failed to get tag impact:', err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmation?.tag.id) return;

    setDeleteLoading(true);
    try {
      await deleteTag(deleteConfirmation.tag.id);
      setDeleteConfirmation(null);
      onTagsChanged?.();
    } catch (err) {
      console.error('Failed to delete tag:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const renderTagItem = (tag: Tag, level: number = 0) => {
    const indent = level * 20;
    
    return (
      <div key={tag.id} style={{ marginLeft: `${indent}px` }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.5rem',
          backgroundColor: level % 2 === 0 ? '#f8f9fa' : '#ffffff',
          borderRadius: '4px',
          marginBottom: '0.25rem',
          border: '1px solid #e9ecef'
        }}>
          <span style={{ 
            fontWeight: level === 0 ? 'bold' : 'normal',
            color: level === 0 ? '#2c3e50' : '#34495e'
          }}>
            {tag.name}
          </span>
          
          <button
            onClick={() => handleDeleteClick(tag)}
            style={{
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
            title={`Delete ${tag.name}`}
          >
            Delete
          </button>
        </div>
        
        {tag.children && tag.children.map(child => renderTagItem(child, level + 1))}
      </div>
    );
  };

  if (loading) return <div>Loading tags...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div style={{ 
      padding: '2rem',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <h2 style={{ color: '#2c3e50' }}>Manage Tags</h2>
        <button
          onClick={onBack}
          style={{
            backgroundColor: '#95a5a6',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          ← Back to Recipes
        </button>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <h3>Tag Hierarchy</h3>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            style={{
              backgroundColor: '#27ae60',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            {showCreateForm ? 'Cancel' : '+ Add Tag'}
          </button>
        </div>

        {showCreateForm && (
          <form onSubmit={handleCreateTag} style={{
            backgroundColor: '#f8f9fa',
            padding: '1rem',
            borderRadius: '4px',
            marginBottom: '1rem',
            border: '1px solid #e9ecef'
          }}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Tag Name:
              </label>
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Enter tag name"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
                required
              />
            </div>

            <div style={{ marginBottom: '1rem', position: 'relative' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Parent Tag (optional):
              </label>
              <div ref={autocompleteRef} style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={parentTagInput}
                  onChange={(e) => handleParentTagInputChange(e.target.value)}
                  onFocus={() => setShowParentDropdown(true)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search for parent tag or leave empty for root level"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    paddingRight: parentTagInput ? '2.5rem' : '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                />
                {parentTagInput && (
                  <button
                    type="button"
                    onClick={clearParentSelection}
                    style={{
                      position: 'absolute',
                      right: '0.5rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '1.2rem',
                      color: '#999'
                    }}
                  >
                    ×
                  </button>
                )}
                
                {showParentDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    border: '1px solid #ddd',
                    borderTop: 'none',
                    borderRadius: '0 0 4px 4px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    {getDropdownOptions().map((option, index) => {
                      const isHighlighted = index === highlightedIndex;
                      const isSelected = option ? selectedParentId === option.id : selectedParentId === null;
                      
                      return (
                        <div
                          key={option?.id || 'no-parent'}
                          onClick={() => handleParentTagSelect(option)}
                          onMouseEnter={() => setHighlightedIndex(index)}
                          style={{
                            padding: '0.5rem',
                            cursor: 'pointer',
                            borderBottom: '1px solid #eee',
                            backgroundColor: isHighlighted 
                              ? '#2196f3' 
                              : isSelected 
                                ? '#e3f2fd' 
                                : 'white',
                            color: isHighlighted ? 'white' : 'black'
                          }}
                        >
                          {option ? option.name : <em>No parent (root level)</em>}
                        </div>
                      );
                    })}
                    {getDropdownOptions().length === 0 && (
                      <div style={{
                        padding: '0.5rem',
                        color: '#999',
                        fontStyle: 'italic'
                      }}>
                        No matching tags found
                      </div>
                    )}
                  </div>
                )}
              </div>
              {selectedParentId && (
                <div style={{
                  marginTop: '0.5rem',
                  padding: '0.25rem 0.5rem',
                  backgroundColor: '#e3f2fd',
                  borderRadius: '4px',
                  fontSize: '0.875rem'
                }}>
                  Selected: <strong>{parentTagInput}</strong>
                </div>
              )}
            </div>

            <button
              type="submit"
              style={{
                backgroundColor: '#27ae60',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Create Tag
            </button>
          </form>
        )}

        <div style={{ 
          border: '1px solid #e9ecef',
          borderRadius: '4px',
          padding: '1rem'
        }}>
          {tags.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#6c757d' }}>No tags found.</p>
          ) : (
            tags.map(tag => renderTagItem(tag))
          )}
        </div>
      </div>

      {deleteConfirmation && (
        <DeleteConfirmation
          tag={deleteConfirmation.tag}
          affectedRecipes={deleteConfirmation.affectedRecipes}
          promotedChildren={deleteConfirmation.promotedChildren}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteConfirmation(null)}
          loading={deleteLoading}
        />
      )}
    </div>
  );
};

export default TagManagement;