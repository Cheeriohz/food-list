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
        <button  className="control-button" onClick={onToggle}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
          </svg>
          Advanced Filters
          {(filters.tags.length > 0 || 
            filters.prepTimeRange[0] > 0 || filters.prepTimeRange[1] < 180 ||
            filters.cookTimeRange[0] > 0 || filters.cookTimeRange[1] < 240 ||
            filters.servingsRange[0] > 1 || filters.servingsRange[1] < 12 ||
            filters.sortBy !== 'relevance' ||
            filters.hasDescription !== null ||
            filters.minIngredients !== null ||
            filters.maxIngredients !== null) && (
            <span className="active-indicator">
              <svg width="8" height="8" viewBox="0 0 8 8">
                <circle cx="4" cy="4" r="4" fill="#ff6b6b"/>
              </svg>
            </span>
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
          background: rgba(108, 117, 125, 0.08);
          border: 1px solid rgba(108, 117, 125, 0.2);
          color: #6c757d;
          padding: 0.5rem 0.75rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.8rem;
          font-weight: 500;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .toggle-button:hover {
          background: rgba(108, 117, 125, 0.12);
          border-color: rgba(108, 117, 125, 0.3);
        }

        .active-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.1);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .advanced-filters {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1), 0 8px 32px rgba(0, 0, 0, 0.08);
          margin-bottom: 1.5rem;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.2);
          position: relative;
        }

        .advanced-filters::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.5), transparent);
        }

        .filters-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 2rem;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-bottom: 1px solid rgba(233, 236, 239, 0.8);
          position: relative;
        }

        .filters-header::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 2rem;
          right: 2rem;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.3), transparent);
        }

        .filters-header h3 {
          margin: 0;
          color: #2c3e50;
          font-size: 1.25rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .filters-header h3::before {
          content: '';
          width: 4px;
          height: 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 2px;
        }

        .header-actions {
          display: flex;
          gap: 0.5rem;
        }

        .reset-button {
          background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 10px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
        }

        .reset-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(255, 107, 107, 0.6);
        }

        .reset-button:active {
          transform: translateY(0);
        }

        .close-button {
          background: rgba(102, 126, 234, 0.1);
          border: 1px solid rgba(102, 126, 234, 0.2);
          color: #667eea;
          font-size: 1.1rem;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 8px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-button:hover {
          background: rgba(102, 126, 234, 0.2);
          color: #5a67d8;
          transform: rotate(90deg);
        }

        .filters-content {
          padding: 2rem;
          display: grid;
          gap: 2rem;
          background: linear-gradient(135deg, rgba(248, 249, 250, 0.8) 0%, rgba(255, 255, 255, 0.9) 100%);
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          background: white;
          padding: 1.5rem;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
          border: 1px solid rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
        }

        .filter-group:hover {
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }

        .filter-label {
          font-weight: 700;
          color: #2c3e50;
          font-size: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .filter-label::before {
          content: '';
          width: 3px;
          height: 16px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 2px;
        }

        .tag-filter-container {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .selected-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          min-height: 3rem;
          padding: 1rem;
          border: 2px solid rgba(102, 126, 234, 0.2);
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(255, 255, 255, 0.8) 100%);
          transition: all 0.3s ease;
        }

        .selected-tags:hover {
          border-color: rgba(102, 126, 234, 0.3);
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(255, 255, 255, 0.9) 100%);
        }

        .selected-tag {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 0.5rem 0.75rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          box-shadow: 0 2px 10px rgba(102, 126, 234, 0.3);
          transition: all 0.3s ease;
        }

        .selected-tag:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }

        .remove-tag {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          font-size: 0.7rem;
          cursor: pointer;
          padding: 0;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .remove-tag:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.1);
        }

        .expand-tags-button {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
          border: 2px solid rgba(102, 126, 234, 0.2);
          color: #667eea;
          padding: 0.75rem 1rem;
          border-radius: 10px;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 600;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .expand-tags-button:hover {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
          border-color: rgba(102, 126, 234, 0.3);
          transform: translateY(-1px);
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.2);
        }

        .available-tags {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 0.75rem;
          max-height: 250px;
          overflow-y: auto;
          border: 2px solid rgba(102, 126, 234, 0.1);
          border-radius: 12px;
          padding: 1.5rem;
          background: linear-gradient(135deg, rgba(248, 249, 250, 0.8) 0%, rgba(255, 255, 255, 0.9) 100());
          backdrop-filter: blur(10px);
        }

        .available-tags::-webkit-scrollbar {
          width: 6px;
        }

        .available-tags::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 3px;
        }

        .available-tags::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 3px;
        }

        .tag-checkbox {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
          font-size: 0.9rem;
          padding: 0.5rem;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .tag-checkbox:hover {
          background: rgba(102, 126, 234, 0.1);
        }

        .tag-checkbox input {
          margin: 0;
          width: 16px;
          height: 16px;
          accent-color: #667eea;
        }

        .range-slider-container {
          position: relative;
          height: 24px;
          margin: 1rem 0;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100());
          border-radius: 12px;
          padding: 2px;
        }

        .range-slider {
          position: absolute;
          width: 100%;
          height: 8px;
          border-radius: 6px;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
          outline: none;
          -webkit-appearance: none;
          appearance: none;
          cursor: pointer;
        }

        .range-slider::-webkit-slider-thumb {
          appearance: none;
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
          transition: all 0.3s ease;
        }

        .range-slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
        }

        .range-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100());
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }

        .range-labels {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          color: #667eea;
          font-weight: 600;
          margin-top: 0.5rem;
        }

        .number-inputs {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .number-inputs span {
          color: #667eea;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .number-input {
          width: 90px;
          padding: 0.75rem;
          border: 2px solid rgba(102, 126, 234, 0.2);
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 600;
          background: linear-gradient(135deg, rgba(248, 249, 250, 0.8) 0%, rgba(255, 255, 255, 0.9) 100());
          transition: all 0.3s ease;
        }

        .number-input:focus {
          outline: none;
          border-color: rgba(102, 126, 234, 0.5);
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          transform: translateY(-1px);
        }

        .checkbox-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .checkbox-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 600;
          padding: 0.5rem;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .checkbox-item:hover {
          background: rgba(102, 126, 234, 0.1);
        }

        .checkbox-item input {
          margin: 0;
          width: 16px;
          height: 16px;
          accent-color: #667eea;
        }

        .sort-controls {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .sort-select {
          padding: 0.75rem 1rem;
          border: 2px solid rgba(102, 126, 234, 0.2);
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 600;
          background: linear-gradient(135deg, rgba(248, 249, 250, 0.8) 0%, rgba(255, 255, 255, 0.9) 100());
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .sort-select:focus {
          outline: none;
          border-color: rgba(102, 126, 234, 0.5);
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          transform: translateY(-1px);
        }

        .sort-order {
          display: flex;
          gap: 1rem;
        }

        .radio-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 600;
          padding: 0.5rem;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .radio-item:hover {
          background: rgba(102, 126, 234, 0.1);
        }

        .radio-item input {
          margin: 0;
          width: 16px;
          height: 16px;
          accent-color: #667eea;
        }

        @media (max-width: 768px) {
          .filters-content {
            padding: 1.5rem;
            gap: 1.5rem;
          }

          .filters-header {
            padding: 1rem 1.5rem;
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .filters-header h3 {
            font-size: 1.1rem;
            justify-content: center;
          }

          .header-actions {
            justify-content: center;
          }

          .filter-group {
            padding: 1rem;
          }

          .toggle-button {
            padding: 1rem 1.5rem;
            font-size: 1rem;
          }

          .available-tags {
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            padding: 1rem;
          }

          .sort-order {
            flex-direction: column;
            gap: 0.75rem;
          }

          .number-inputs {
            flex-direction: column;
            align-items: stretch;
            gap: 0.75rem;
          }

          .number-input {
            width: 100%;
          }

          .selected-tags {
            min-height: 4rem;
          }

          .range-slider-container {
            margin: 1.5rem 0;
          }
        }

        @media (max-width: 480px) {
          .advanced-filters {
            border-radius: 16px;
            margin: 0 0.5rem 1rem;
          }

          .filters-content {
            padding: 1rem;
            gap: 1rem;
          }

          .filter-group {
            padding: 0.75rem;
          }

          .toggle-button {
            padding: 0.875rem 1.25rem;
            font-size: 0.9rem;
          }

          .filters-header h3 {
            font-size: 1rem;
          }

          .available-tags {
            grid-template-columns: 1fr;
            max-height: 150px;
          }

          .selected-tag {
            font-size: 0.8rem;
            padding: 0.375rem 0.625rem;
          }
        }
      `}</style>
    </div>
  );
};

export default AdvancedSearchFilters;