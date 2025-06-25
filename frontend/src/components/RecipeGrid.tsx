import React from 'react';
import { Recipe } from '../types';
import RecipeCard from './RecipeCard';

interface RecipeGridProps {
  recipes: Recipe[];
  onRecipeClick: (id: number) => void;
  loading?: boolean;
}

const RecipeGrid: React.FC<RecipeGridProps> = ({ recipes, onRecipeClick, loading = false }) => {
  if (loading) {
    return (
      <div className="recipe-grid-loading">
        <div className="loading-spinner">🔍</div>
        <p>Loading recipes...</p>
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <div className="recipe-grid-empty">
        <div className="empty-icon">🍽️</div>
        <h3>No recipes found</h3>
        <p>Try adjusting your search terms or browse all recipes.</p>
      </div>
    );
  }

  return (
    <div className="recipe-grid">
      {recipes.map(recipe => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
          onRecipeClick={onRecipeClick}
        />
      ))}
      
      <style>{`
        .recipe-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1rem;
          padding: 1rem 0;
        }

        .recipe-grid-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 300px;
          color: #666;
        }

        .recipe-grid-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 300px;
          text-align: center;
          color: #666;
          background: rgba(255, 255, 255, 0.5);
          border-radius: 12px;
          padding: 3rem;
          backdrop-filter: blur(10px);
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
          opacity: 0.7;
        }

        .recipe-grid-empty h3 {
          margin: 0 0 0.5rem 0;
          color: #2c3e50;
          font-size: 1.5rem;
        }

        .recipe-grid-empty p {
          margin: 0;
          font-size: 1rem;
          opacity: 0.8;
        }

        .loading-spinner {
          font-size: 3rem;
          animation: pulse 2s ease-in-out infinite;
          margin-bottom: 1rem;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .recipe-grid {
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 0.75rem;
          }
        }

        @media (max-width: 480px) {
          .recipe-grid {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }
          
          .recipe-grid-empty {
            padding: 2rem 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default RecipeGrid;