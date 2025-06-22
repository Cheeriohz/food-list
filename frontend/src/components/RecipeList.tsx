import React from 'react';
import { useRecipes } from '../contexts/RecipeContext';
import { Recipe } from '../types';
import TagChip from './TagChip';

interface RecipeCardProps {
  recipe: Recipe;
  onRecipeClick: (id: number) => void;
}

const RecipeCard = ({ recipe, onRecipeClick }: RecipeCardProps) => {
  return (
    <div className="recipe-card" onClick={() => onRecipeClick(recipe.id!)}>
      <h3>{recipe.title}</h3>
      <p>{recipe.description}</p>
      <div className="recipe-meta">
        {recipe.prep_time && <span>Prep: {recipe.prep_time}min</span>}
        {recipe.cook_time && <span>Cook: {recipe.cook_time}min</span>}
        {recipe.servings && <span>Serves: {recipe.servings}</span>}
      </div>
      <div className="recipe-tags" style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '0.25rem', 
        marginTop: '0.5rem' 
      }}>
        {recipe.tags && recipe.tags.map((tag) => (
          <TagChip
            key={tag.id}
            tag={tag}
            variant="normal"
            size="small"
          />
        ))}
      </div>
    </div>
  );
};

interface RecipeListProps {
  onRecipeClick: (id: number) => void;
}

const RecipeList = ({ onRecipeClick }: RecipeListProps) => {
  const { recipes, loading, error } = useRecipes();

  if (loading) return <div>Loading recipes...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="recipe-grid">
      {recipes.length === 0 ? (
        <div>No recipes found.</div>
      ) : (
        recipes.map(recipe => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            onRecipeClick={onRecipeClick}
          />
        ))
      )}
    </div>
  );
};

export default RecipeList;