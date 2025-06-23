import React, { useState, useCallback } from 'react';
import { Recipe, Tag } from '../types';

export interface SearchFilters {
  tags: string[];
  prepTimeRange: [number, number];
  cookTimeRange: [number, number];
  servingsRange: [number, number];
  sortBy: 'relevance' | 'title' | 'prep_time' | 'cook_time' | 'total_time' | 'servings' | 'created_at';
  sortOrder: 'asc' | 'desc';
  hasDescription: boolean | null;
  minIngredients: number | null;
  maxIngredients: number | null;
}

interface AdvancedSearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  availableTags: Tag[];
  isOpen: boolean;
  onToggle: () => void;
  onReset: () => void;
}

const AdvancedSearchFilters: React.FC<AdvancedSearchFiltersProps> = ({
  filters,
  onFiltersChange,
  availableTags,
  isOpen,
  onToggle,
  onReset
}) => {
  const [selectedTagsExpanded, setSelectedTagsExpanded] = useState(false);

  const updateFilter = useCallback(<K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  }, [filters, onFiltersChange]);

  const handleTagToggle = useCallback((tagName: string) => {
    const newTags = filters.tags.includes(tagName)
      ? filters.tags.filter(t => t !== tagName)
      : [...filters.tags, tagName];
    updateFilter('tags', newTags);
  }, [filters.tags, updateFilter]);

  const sortOptions = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'title', label: 'Recipe Name' },
    { value: 'prep_time', label: 'Prep Time' },
    { value: 'cook_time', label: 'Cook Time' },
    { value: 'total_time', label: 'Total Time' },
    { value: 'servings', label: 'Servings' },
    { value: 'created_at', label: 'Date Added' }
  ];

  const renderRangeSlider = useCallback((
    label: string,
    value: [number, number],
    min: number,
    max: number,
    step: number,
    unit: string,
    onChange: (value: [number, number]) => void
  ) => {
    return (
      <div className="filter-group">
        <label className="filter-label">
          {label}: {value[0]}{unit} - {value[1] === max ? `${max}+` : `${value[1]}`}{unit}
        </label>
        <div className="range-slider-container">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value[0]}
            onChange={(e) => onChange([Number(e.target.value), value[1]])}
            className="range-slider range-min"
          />
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value[1]}
            onChange={(e) => onChange([value[0], Number(e.target.value)])}
            className="range-slider range-max"
          />
        </div>
        <div className="range-labels">
          <span>{min}{unit}</span>
          <span>{max}+{unit}</span>
        </div>
      </div>
    );
  }, []);

  if (!isOpen) {
    return (
      <div className="filters-toggle">
        <button className="toggle-button" onClick={onToggle}>
          🔧 Advanced Filters
          {(filters.tags.length > 0 || 
            filters.prepTimeRange[0] > 0 || filters.prepTimeRange[1] < 180 ||
            filters.cookTimeRange[0] > 0 || filters.cookTimeRange[1] < 240 ||
            filters.servingsRange[0] > 1 || filters.servingsRange[1] < 12 ||
            filters.sortBy !== 'relevance' ||
            filters.hasDescription !== null ||
            filters.minIngredients !== null ||
            filters.maxIngredients !== null) && (
            <span className="active-indicator">●</span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="advanced-filters">
      <div className="filters-header">
        <h3>Advanced Filters</h3>
        <div className="header-actions">
          <button className="reset-button" onClick={onReset}>
            Reset All
          </button>
          <button className="close-button" onClick={onToggle}>
            ✕
          </button>
        </div>
      </div>

      <div className="filters-content">
        {/* Tag Filters */}
        <div className="filter-group">
          <label className="filter-label">
            Tags ({filters.tags.length} selected)
          </label>
          <div className="tag-filter-container">
            <div className="selected-tags">
              {filters.tags.map(tagName => (
                <span key={tagName} className="selected-tag">
                  {tagName}
                  <button
                    className="remove-tag"
                    onClick={() => handleTagToggle(tagName)}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
            <button
              className="expand-tags-button"
              onClick={() => setSelectedTagsExpanded(!selectedTagsExpanded)}
            >
              {selectedTagsExpanded ? 'Hide Tags' : 'Show All Tags'}
            </button>
            {selectedTagsExpanded && (
              <div className="available-tags">
                {availableTags.map(tag => (
                  <label key={tag.id} className="tag-checkbox">
                    <input
                      type="checkbox"
                      checked={filters.tags.includes(tag.name)}
                      onChange={() => handleTagToggle(tag.name)}
                    />
                    <span>{tag.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Time Range Filters */}
        {renderRangeSlider(
          'Prep Time',
          filters.prepTimeRange,
          0,
          180,
          5,
          'min',
          (value) => updateFilter('prepTimeRange', value)
        )}

        {renderRangeSlider(
          'Cook Time',
          filters.cookTimeRange,
          0,
          240,
          10,
          'min',
          (value) => updateFilter('cookTimeRange', value)
        )}

        {renderRangeSlider(
          'Servings',
          filters.servingsRange,
          1,
          12,
          1,
          '',
          (value) => updateFilter('servingsRange', value)
        )}

        {/* Ingredient Count Filters */}
        <div className="filter-group">
          <label className="filter-label">Ingredients Count</label>
          <div className="number-inputs">
            <input
              type="number"
              placeholder="Min"
              value={filters.minIngredients || ''}
              onChange={(e) => updateFilter('minIngredients', e.target.value ? Number(e.target.value) : null)}
              className="number-input"
              min="1"
              max="50"
            />
            <span>to</span>
            <input
              type="number"
              placeholder="Max"
              value={filters.maxIngredients || ''}
              onChange={(e) => updateFilter('maxIngredients', e.target.value ? Number(e.target.value) : null)}
              className="number-input"
              min="1"
              max="50"
            />
          </div>
        </div>

        {/* Content Filters */}
        <div className="filter-group">
          <label className="filter-label">Content Requirements</label>
          <div className="checkbox-group">
            <label className="checkbox-item">
              <input
                type="checkbox"
                checked={filters.hasDescription === true}
                onChange={(e) => updateFilter('hasDescription', e.target.checked ? true : null)}
              />
              <span>Has Description</span>
            </label>
          </div>
        </div>

        {/* Sort Options */}
        <div className="filter-group">
          <label className="filter-label">Sort By</label>
          <div className="sort-controls">
            <select
              value={filters.sortBy}
              onChange={(e) => updateFilter('sortBy', e.target.value as SearchFilters['sortBy'])}
              className="sort-select"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="sort-order">
              <label className="radio-item">
                <input
                  type="radio"
                  name="sortOrder"
                  value="asc"
                  checked={filters.sortOrder === 'asc'}
                  onChange={(e) => updateFilter('sortOrder', e.target.value as 'asc' | 'desc')}
                />
                <span>↑ Ascending</span>
              </label>
              <label className="radio-item">
                <input
                  type="radio"
                  name="sortOrder"
                  value="desc"
                  checked={filters.sortOrder === 'desc'}
                  onChange={(e) => updateFilter('sortOrder', e.target.value as 'asc' | 'desc')}
                />
                <span>↓ Descending</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .filters-toggle {
          margin-bottom: 1rem;
        }

        .toggle-button {
          background: rgba(52, 152, 219, 0.1);
          border: 1px solid rgba(52, 152, 219, 0.2);
          color: #3498db;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .toggle-button:hover {
          background: rgba(52, 152, 219, 0.2);
          border-color: rgba(52, 152, 219, 0.3);
        }

        .active-indicator {
          color: #e74c3c;
          font-size: 0.6rem;
        }

        .advanced-filters {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          margin-bottom: 1.5rem;
          overflow: hidden;
        }

        .filters-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          background: #f8f9fa;
          border-bottom: 1px solid #e9ecef;
        }

        .filters-header h3 {
          margin: 0;
          color: #2c3e50;
          font-size: 1.1rem;
        }

        .header-actions {
          display: flex;
          gap: 0.5rem;
        }

        .reset-button {
          background: #e74c3c;
          color: white;
          border: none;
          padding: 0.25rem 0.75rem;
          border-radius: 15px;
          font-size: 0.8rem;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .reset-button:hover {
          background: #c0392b;
        }

        .close-button {
          background: none;
          border: none;
          color: #666;
          font-size: 1.2rem;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .close-button:hover {
          background: rgba(0, 0, 0, 0.05);
          color: #333;
        }

        .filters-content {
          padding: 1.5rem;
          display: grid;
          gap: 1.5rem;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .filter-label {
          font-weight: 600;
          color: #2c3e50;
          font-size: 0.9rem;
        }

        .tag-filter-container {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .selected-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          min-height: 2rem;
          padding: 0.5rem;
          border: 1px solid #e9ecef;
          border-radius: 6px;
          background: #f8f9fa;
        }

        .selected-tag {
          background: #3498db;
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.8rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .remove-tag {
          background: none;
          border: none;
          color: white;
          font-size: 0.7rem;
          cursor: pointer;
          padding: 0;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .remove-tag:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .expand-tags-button {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          color: #666;
          padding: 0.5rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.8rem;
          transition: all 0.2s ease;
        }

        .expand-tags-button:hover {
          background: #e9ecef;
        }

        .available-tags {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 0.5rem;
          max-height: 200px;
          overflow-y: auto;
          border: 1px solid #e9ecef;
          border-radius: 6px;
          padding: 1rem;
          background: #fafafa;
        }

        .tag-checkbox {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          font-size: 0.85rem;
        }

        .tag-checkbox input {
          margin: 0;
        }

        .range-slider-container {
          position: relative;
          height: 20px;
          margin: 0.5rem 0;
        }

        .range-slider {
          position: absolute;
          width: 100%;
          height: 5px;
          border-radius: 5px;
          background: #e9ecef;
          outline: none;
          -webkit-appearance: none;
          appearance: none;
        }

        .range-slider::-webkit-slider-thumb {
          appearance: none;
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #3498db;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }

        .range-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #3498db;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }

        .range-labels {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          color: #666;
        }

        .number-inputs {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .number-input {
          width: 80px;
          padding: 0.5rem;
          border: 1px solid #e9ecef;
          border-radius: 6px;
          font-size: 0.9rem;
        }

        .number-input:focus {
          outline: none;
          border-color: #3498db;
        }

        .checkbox-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .checkbox-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          font-size: 0.9rem;
        }

        .checkbox-item input {
          margin: 0;
        }

        .sort-controls {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .sort-select {
          padding: 0.5rem;
          border: 1px solid #e9ecef;
          border-radius: 6px;
          font-size: 0.9rem;
          background: white;
        }

        .sort-select:focus {
          outline: none;
          border-color: #3498db;
        }

        .sort-order {
          display: flex;
          gap: 1rem;
        }

        .radio-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          font-size: 0.9rem;
        }

        .radio-item input {
          margin: 0;
        }

        @media (max-width: 768px) {
          .filters-content {
            padding: 1rem;
            gap: 1rem;
          }

          .available-tags {
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          }

          .sort-order {
            flex-direction: column;
            gap: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default AdvancedSearchFilters;