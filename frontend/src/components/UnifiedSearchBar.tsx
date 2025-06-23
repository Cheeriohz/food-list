import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useUnifiedData } from '../contexts/UnifiedDataContext';

interface SearchSuggestion {
  text: string;
  type: 'query' | 'tag' | 'ingredient' | 'recipe';
  icon: string;
  description?: string;
}

interface UnifiedSearchBarProps {
  query: string;
  onChange: (query: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

const UnifiedSearchBar: React.FC<UnifiedSearchBarProps> = ({
  query,
  onChange,
  onFocus,
  onBlur,
  placeholder = "Search recipes, ingredients, or categories...",
  autoFocus = false,
  className = ""
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const { getSuggestions } = useUnifiedData();

  // Focus input when autoFocus changes
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Generate suggestions based on query
  const generateSuggestions = useCallback((searchQuery: string): SearchSuggestion[] => {
    if (searchQuery.length < 2) return [];

    const suggestions: SearchSuggestion[] = [];
    const maxSuggestions = 8;
    
    // Get basic term suggestions from search service
    const termSuggestions = getSuggestions(searchQuery);
    
    // Add query suggestions (search terms)
    termSuggestions.slice(0, 3).forEach(term => {
      suggestions.push({
        text: term,
        type: 'query',
        icon: '🔍',
        description: `Search for "${term}"`
      });
    });

    // Add common ingredient suggestions
    const commonIngredients = [
      'chicken', 'beef', 'pork', 'fish', 'pasta', 'rice', 'potatoes', 
      'tomatoes', 'onions', 'garlic', 'cheese', 'eggs', 'milk', 'flour',
      'oil', 'butter', 'salt', 'pepper', 'herbs', 'spices'
    ];
    
    const matchingIngredients = commonIngredients
      .filter(ingredient => ingredient.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 2);
      
    matchingIngredients.forEach(ingredient => {
      suggestions.push({
        text: ingredient,
        type: 'ingredient',
        icon: '🥬',
        description: `Recipes with ${ingredient}`
      });
    });

    // Add common tag suggestions
    const commonTags = [
      'main dish', 'appetizer', 'dessert', 'soup', 'salad', 'breakfast',
      'lunch', 'dinner', 'vegetarian', 'vegan', 'gluten-free', 'quick',
      'easy', 'healthy', 'comfort food', 'holiday', 'italian', 'mexican',
      'asian', 'american', 'french', 'indian'
    ];
    
    const matchingTags = commonTags
      .filter(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 2);
      
    matchingTags.forEach(tag => {
      suggestions.push({
        text: tag,
        type: 'tag',
        icon: '🏷️',
        description: `Browse ${tag} recipes`
      });
    });

    // Add recipe title suggestions (simulated - would come from actual recipe data)
    if (searchQuery.length >= 3) {
      const recipePatterns = [
        { pattern: /chick/i, suggestion: 'Chicken Alfredo', icon: '🍝' },
        { pattern: /beef/i, suggestion: 'Beef Stir Fry', icon: '🥩' },
        { pattern: /pasta/i, suggestion: 'Pasta Primavera', icon: '🍝' },
        { pattern: /salad/i, suggestion: 'Caesar Salad', icon: '🥗' },
        { pattern: /soup/i, suggestion: 'Tomato Soup', icon: '🍲' },
        { pattern: /cake/i, suggestion: 'Chocolate Cake', icon: '🎂' }
      ];

      const matchingRecipes = recipePatterns
        .filter(({ pattern }) => pattern.test(searchQuery))
        .slice(0, 1);

      matchingRecipes.forEach(({ suggestion, icon }) => {
        suggestions.push({
          text: suggestion,
          type: 'recipe',
          icon,
          description: 'Recipe'
        });
      });
    }

    return suggestions.slice(0, maxSuggestions);
  }, [getSuggestions]);

  // Update suggestions when query changes
  useEffect(() => {
    const newSuggestions = generateSuggestions(query);
    setSuggestions(newSuggestions);
    setHighlightedIndex(-1);
  }, [query, generateSuggestions]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setShowSuggestions(newValue.length > 0);
  };

  const handleInputFocus = () => {
    setShowSuggestions(query.length > 0 || suggestions.length > 0);
    onFocus?.();
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow click events
    setTimeout(() => {
      setShowSuggestions(false);
      onBlur?.();
    }, 150);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
        
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[highlightedIndex]);
        }
        break;
        
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    onChange(suggestion.text);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const handleSuggestionMouseEnter = (index: number) => {
    setHighlightedIndex(index);
  };

  const clearSearch = () => {
    onChange('');
    inputRef.current?.focus();
  };

  return (
    <div className={`unified-search-bar ${className}`}>
      <div className="search-input-container">        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="search-input"
          autoComplete="off"
          spellCheck="false"
        />
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div ref={suggestionsRef} className="suggestions-dropdown">
          {suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.type}-${suggestion.text}`}
              className={`suggestion-item ${index === highlightedIndex ? 'highlighted' : ''}`}
              onClick={() => handleSuggestionSelect(suggestion)}
              onMouseEnter={() => handleSuggestionMouseEnter(index)}
            >
              <span className="suggestion-icon">{suggestion.icon}</span>
              <div className="suggestion-content">
                <span className="suggestion-text">{suggestion.text}</span>
                {suggestion.description && (
                  <span className="suggestion-description">{suggestion.description}</span>
                )}
              </div>
              <span className="suggestion-type">{suggestion.type}</span>
            </div>
          ))}
          
          <div className="suggestions-footer">
            <span>↑↓ to navigate • Enter to select • Esc to close</span>
          </div>
        </div>
      )}

      <style>{`
        .unified-search-bar {
          position: relative;
          width: 100%;
          z-index: 30;
        }

        .search-input-container {
          position: relative;
          display: flex;
          align-items: center;
          background: white;
          border: 2px solid #e1e8ed;
          border-radius: 25px;
          padding: 0.75rem 1rem;
          transition: all 0.2s ease;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .search-input-container:focus-within {
          border-color: #3498db;
          box-shadow: 0 4px 20px rgba(52, 152, 219, 0.2);
        }

        .search-icon {
          color: #999;
          margin-right: 0.75rem;
          font-size: 1.2rem;
        }

        .search-input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 1rem;
          color: #333;
          background: transparent;
        }

        .search-input::placeholder {
          color: #999;
        }

        .clear-button {
          background: none;
          border: none;
          color: #999;
          cursor: pointer;
          padding: 0.25rem;
          margin-left: 0.5rem;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .clear-button:hover {
          background: #f1f1f1;
          color: #666;
        }

        .suggestions-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #e1e8ed;
          border-radius: 12px;
          margin-top: 0.5rem;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
          z-index: 1000;
          max-height: 400px;
          overflow-y: auto;
        }

        .suggestion-item {
          display: flex;
          align-items: center;
          padding: 0.75rem 1rem;
          cursor: pointer;
          border-bottom: 1px solid #f8f9fa;
          transition: background 0.15s ease;
        }

        .suggestion-item:hover,
        .suggestion-item.highlighted {
          background: #f8f9fa;
        }

        .suggestion-item:last-of-type {
          border-bottom: none;
        }

        .suggestion-icon {
          font-size: 1.2rem;
          margin-right: 0.75rem;
          flex-shrink: 0;
        }

        .suggestion-content {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .suggestion-text {
          font-weight: 500;
          color: #333;
          margin-bottom: 0.1rem;
        }

        .suggestion-description {
          font-size: 0.8rem;
          color: #666;
        }

        .suggestion-type {
          font-size: 0.75rem;
          color: #999;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 500;
          flex-shrink: 0;
        }

        .suggestions-footer {
          padding: 0.5rem 1rem;
          background: #f8f9fa;
          border-top: 1px solid #e1e8ed;
          border-radius: 0 0 12px 12px;
        }

        .suggestions-footer span {
          font-size: 0.75rem;
          color: #999;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .search-input-container {
            padding: 0.6rem 0.8rem;
          }

          .search-input {
            font-size: 16px; /* Prevents zoom on iOS */
          }

          .suggestions-dropdown {
            margin-top: 0.25rem;
          }

          .suggestion-item {
            padding: 0.6rem 0.8rem;
          }

          .suggestions-footer {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default UnifiedSearchBar;