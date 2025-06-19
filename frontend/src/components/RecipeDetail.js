import React, { useEffect } from 'react';
import { useRecipes } from '../contexts/RecipeContext';

const RecipeDetail = ({ recipeId, onBack }) => {
  const { currentRecipe, fetchRecipe, loading, error } = useRecipes();

  useEffect(() => {
    if (recipeId) {
      fetchRecipe(recipeId);
    }
  }, [recipeId]);

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
      
      {currentRecipe.tags && currentRecipe.tags.length > 0 && (
        <div className="tags">
          {currentRecipe.tags.map((tag, index) => (
            <span key={index} className="tag">{tag}</span>
          ))}
        </div>
      )}
      
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