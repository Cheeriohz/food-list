import React from 'react';
import { useRecipes } from '../contexts/RecipeContext';
import RecipeCard from './RecipeCard';

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