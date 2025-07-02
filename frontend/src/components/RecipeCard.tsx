import React from 'react';
import { Recipe } from '../types';
import TagChip from './TagChip';

interface RecipeCardProps {
  recipe: Recipe;
  onRecipeClick: (id: number) => void;
}

const RecipeCard = ({ recipe, onRecipeClick }: RecipeCardProps) => {
  return (
    <div className="recipe-card" onClick={() => recipe.id && onRecipeClick(recipe.id)}>
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

export default RecipeCard;