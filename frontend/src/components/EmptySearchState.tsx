import React from 'react';
import './EmptySearchState.css';

interface EmptySearchStateProps {
  onSearchFocus?: () => void;
  onCreateRecipe?: () => void;
  onManageTags?: () => void;
  onBrowseAll?: () => void;
}

const EmptySearchState: React.FC<EmptySearchStateProps> = ({ onSearchFocus, onCreateRecipe, onManageTags, onBrowseAll }) => {


  return (
    <div className="empty-search-state">
      <div className="hero-section">
        <div className="hero-icon">🍳</div>
        <h1 className="hero-title">Find Your Perfect Recipe</h1>
        <p className="hero-description">
          Search through our collection of delicious recipes by ingredient, cuisine, or dish name
        </p>
        <div className="action-buttons">
          <button 
            className="primary-action-button"
            onClick={onSearchFocus}
          >
            <span className="button-icon">🔍</span>
            Start Searching
          </button>
          
          <button 
            className="browse-all-button"
            onClick={onBrowseAll}
          >
            <span className="button-icon">📚</span>
            Browse All Recipes
          </button>
          
          <div className="secondary-actions">
            <button 
              className="secondary-action-button"
              onClick={onCreateRecipe}
            >
              <span className="button-icon">➕</span>
              Add Recipe
            </button>
            
            <button 
              className="secondary-action-button"
              onClick={onManageTags}
            >
              <span className="button-icon">🏷️</span>
              Manage Tags
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmptySearchState;