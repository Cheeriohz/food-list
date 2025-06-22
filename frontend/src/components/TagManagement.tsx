import React, { useState } from 'react';
import { useTags } from '../contexts/TagContext';
import { Tag } from '../types';
import TagAutocomplete from './TagAutocomplete';
import TagChip from './TagChip';

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
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    tag: Tag;
    affectedRecipes: any[];
    promotedChildren: any[];
  } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleParentTagSelect = (tag: Tag | null) => {
    setSelectedParentId(tag?.id || null);
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
          <TagChip 
            tag={tag}
            variant="normal"
            size={level === 0 ? 'medium' : 'small'}
          />
          
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

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Parent Tag (optional):
              </label>
              <TagAutocomplete
                tags={tags}
                selectedTagIds={selectedParentId ? [selectedParentId] : []}
                onTagSelect={handleParentTagSelect}
                placeholder="Search for parent tag or leave empty for root level"
                allowNoParent={true}
              />
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