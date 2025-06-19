import React, { useState, FormEvent } from 'react';
import { useRecipes } from '../contexts/RecipeContext';
import { useTags } from '../contexts/TagContext';

const SearchBar = () => {
  const [query, setQuery] = useState<string>('');
  const { searchRecipes } = useRecipes();
  const { selectedTags, clearSelectedTags } = useTags();

  const handleSearch = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    searchRecipes(query, selectedTags);
  };

  const handleClear = (): void => {
    setQuery('');
    clearSelectedTags();
    searchRecipes('', []);
  };

  return (
    <div className="search-bar">
      <form onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search recipes..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
          <button type="submit" style={{ 
            backgroundColor: '#3498db', 
            color: 'white', 
            border: 'none', 
            padding: '0.5rem 1rem', 
            borderRadius: '4px', 
            cursor: 'pointer' 
          }}>
            Search
          </button>
          <button type="button" onClick={handleClear} style={{ 
            backgroundColor: '#95a5a6', 
            color: 'white', 
            border: 'none', 
            padding: '0.5rem 1rem', 
            borderRadius: '4px', 
            cursor: 'pointer' 
          }}>
            Clear
          </button>
        </div>
        {selectedTags.length > 0 && (
          <div style={{ marginTop: '0.5rem' }}>
            <strong>Selected tags:</strong> {selectedTags.join(', ')}
          </div>
        )}
      </form>
    </div>
  );
};

export default SearchBar;