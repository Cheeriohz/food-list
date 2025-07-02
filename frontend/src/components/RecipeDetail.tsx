import React, { useEffect, useState } from 'react';
import { useUnifiedState } from '../state/unified-state-context';
import RecipeTagEditor from './RecipeTagEditor';
import TagChip from './TagChip';

interface RecipeDetailProps {
  recipeId: number;
  onBack: () => void;
}

const RecipeDetail = ({ recipeId, onBack }: RecipeDetailProps) => {
  const { recipes, tags, selectedRecipeId, loading, error, updateRecipe } = useUnifiedState();
  const [isEditingTags, setIsEditingTags] = useState(false);

  // Find the current recipe from the recipes array using selectedRecipeId
  const currentRecipe = recipes.find(recipe => recipe.id === selectedRecipeId) || null;

  // Custom updateRecipeTags function using updateRecipe
  const updateRecipeTags = async (recipeId: number, tagIds: number[]) => {
    if (!currentRecipe) return;
    
    // Create updated recipe with new tags
    const updatedTags = tags.filter(tag => tagIds.includes(tag.id));
    const updatedRecipe = {
      ...currentRecipe,
      tags: updatedTags
    };
    
    await updateRecipe(recipeId, updatedRecipe);
  };

  if (loading) return <div>Loading recipe...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!currentRecipe) return <div>Recipe not found.</div>;

  return (
    <div className="recipe-detail">
      <button className="back-button" onClick={onBack}>
        ← Back to Recipes
      </button>
      
      <h2>{currentRecipe.title}</h2>
      
      {currentRecipe.description && (
        <p>{currentRecipe.description}</p>
      )}
      
      <div className="meta">
        {currentRecipe.prep_time && <span>Prep Time: {currentRecipe.prep_time} minutes</span>}
        {currentRecipe.cook_time && <span>Cook Time: {currentRecipe.cook_time} minutes</span>}
        {currentRecipe.servings && <span>Servings: {currentRecipe.servings}</span>}
      </div>
      
      <div className="tags-section" style={{ marginBottom: '1.5rem' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '0.5rem'
        }}>
          <h3 style={{ margin: 0 }}>Tags</h3>
          <button
            onClick={() => setIsEditingTags(!isEditingTags)}
            style={{
              backgroundColor: isEditingTags ? '#95a5a6' : '#3498db',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            {isEditingTags ? 'Cancel Edit' : 'Edit Tags'}
          </button>
        </div>
        
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          minHeight: '2rem',
          padding: '0.5rem',
          border: '1px solid #e0e0e0',
          borderRadius: '4px',
          backgroundColor: '#f9f9f9'
        }}>
          {currentRecipe.tags && currentRecipe.tags.length > 0 ? (
            currentRecipe.tags.map((tag) => (
              <TagChip
                key={tag.id}
                tag={tag}
                variant="normal"
                size="medium"
              />
            ))
          ) : (
            <span style={{ color: '#999', fontStyle: 'italic' }}>No tags assigned</span>
          )}
        </div>
        
        {currentRecipe.id && (
          <RecipeTagEditor
            recipe={currentRecipe}
            allTags={tags}
            onSave={async (tagIds: number[]) => {
              await updateRecipeTags(currentRecipe.id, tagIds);
              setIsEditingTags(false);
            }}
            onCancel={() => setIsEditingTags(false)}
            isExpanded={isEditingTags}
          />
        )}
      </div>
      
      <div className="section">
        <h3>Ingredients</h3>
        <div className="ingredients">{currentRecipe.ingredients}</div>
      </div>
      
      <div className="section">
        <h3>Instructions</h3>
        <div className="instructions">{currentRecipe.instructions}</div>
      </div>
    </div>
  );
};

export default RecipeDetail;