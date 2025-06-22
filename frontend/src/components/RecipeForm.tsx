import React, { useState, FormEvent } from 'react';
import { useRecipes } from '../contexts/RecipeContext';
import { useTags } from '../contexts/TagContext';

interface RecipeFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

interface FormData {
  title: string;
  description: string;
  ingredients: string;
  instructions: string;
  prep_time: string;
  cook_time: string;
  servings: string;
  selectedTags: string[];
}

const RecipeForm: React.FC<RecipeFormProps> = ({ onCancel, onSuccess }) => {
  const { createRecipe, loading, error } = useRecipes();
  const { tags, selectedTags, selectTag, deselectTag, clearSelectedTags } = useTags();
  
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    ingredients: '',
    instructions: '',
    prep_time: '',
    cook_time: '',
    servings: '',
    selectedTags: []
  });

  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleTagToggle = (tagName: string): void => {
    const isSelected = formData.selectedTags.includes(tagName);
    if (isSelected) {
      setFormData(prev => ({
        ...prev,
        selectedTags: prev.selectedTags.filter(tag => tag !== tagName)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        selectedTags: [...prev.selectedTags, tagName]
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }
    
    if (!formData.ingredients.trim()) {
      errors.ingredients = 'Ingredients are required';
    }
    
    if (!formData.instructions.trim()) {
      errors.instructions = 'Instructions are required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const recipeData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        ingredients: formData.ingredients.trim(),
        instructions: formData.instructions.trim(),
        prep_time: formData.prep_time ? parseInt(formData.prep_time) : undefined,
        cook_time: formData.cook_time ? parseInt(formData.cook_time) : undefined,
        servings: formData.servings ? parseInt(formData.servings) : undefined,
        tags: formData.selectedTags
      };

      await createRecipe(recipeData);
      onSuccess();
    } catch (err) {
      console.error('Failed to create recipe:', err);
    }
  };

  const renderTagSelector = () => {
    const allTagNames = tags.map(tag => tag.name);
    
    return (
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Tags (optional):
        </label>
        <div style={{ 
          border: '1px solid #ddd', 
          borderRadius: '4px', 
          padding: '0.5rem',
          maxHeight: '120px',
          overflowY: 'auto'
        }}>
          {allTagNames.map(tagName => (
            <label key={tagName} style={{ 
              display: 'block', 
              marginBottom: '0.25rem',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={formData.selectedTags.includes(tagName)}
                onChange={() => handleTagToggle(tagName)}
                style={{ marginRight: '0.5rem' }}
              />
              {tagName}
            </label>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{ 
      padding: '2rem', 
      backgroundColor: 'white', 
      borderRadius: '8px', 
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <h2 style={{ marginBottom: '1.5rem', color: '#2c3e50' }}>Create New Recipe</h2>
      
      {error && (
        <div style={{ 
          backgroundColor: '#e74c3c', 
          color: 'white', 
          padding: '0.75rem', 
          borderRadius: '4px', 
          marginBottom: '1rem' 
        }}>
          Error: {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            style={{ 
              width: '100%', 
              padding: '0.5rem', 
              border: validationErrors.title ? '2px solid #e74c3c' : '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem'
            }}
            placeholder="Enter recipe title"
          />
          {validationErrors.title && (
            <div style={{ color: '#e74c3c', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              {validationErrors.title}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            style={{ 
              width: '100%', 
              padding: '0.5rem', 
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem',
              resize: 'vertical',
              minHeight: '80px'
            }}
            placeholder="Brief description of the recipe"
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Ingredients *
          </label>
          <textarea
            name="ingredients"
            value={formData.ingredients}
            onChange={handleInputChange}
            style={{ 
              width: '100%', 
              padding: '0.5rem', 
              border: validationErrors.ingredients ? '2px solid #e74c3c' : '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem',
              resize: 'vertical',
              minHeight: '120px'
            }}
            placeholder="Enter ingredients, one per line"
          />
          {validationErrors.ingredients && (
            <div style={{ color: '#e74c3c', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              {validationErrors.ingredients}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Instructions *
          </label>
          <textarea
            name="instructions"
            value={formData.instructions}
            onChange={handleInputChange}
            style={{ 
              width: '100%', 
              padding: '0.5rem', 
              border: validationErrors.instructions ? '2px solid #e74c3c' : '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem',
              resize: 'vertical',
              minHeight: '150px'
            }}
            placeholder="Enter cooking instructions, one step per line"
          />
          {validationErrors.instructions && (
            <div style={{ color: '#e74c3c', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              {validationErrors.instructions}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Prep Time (min)
            </label>
            <input
              type="number"
              name="prep_time"
              value={formData.prep_time}
              onChange={handleInputChange}
              style={{ 
                width: '100%', 
                padding: '0.5rem', 
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
              placeholder="15"
              min="0"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Cook Time (min)
            </label>
            <input
              type="number"
              name="cook_time"
              value={formData.cook_time}
              onChange={handleInputChange}
              style={{ 
                width: '100%', 
                padding: '0.5rem', 
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
              placeholder="30"
              min="0"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Servings
            </label>
            <input
              type="number"
              name="servings"
              value={formData.servings}
              onChange={handleInputChange}
              style={{ 
                width: '100%', 
                padding: '0.5rem', 
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
              placeholder="4"
              min="1"
            />
          </div>
        </div>

        {renderTagSelector()}

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
          <button
            type="button"
            onClick={onCancel}
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
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: loading ? '#bdc3c7' : '#3498db',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '1rem'
            }}
          >
            {loading ? 'Creating...' : 'Create Recipe'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RecipeForm;