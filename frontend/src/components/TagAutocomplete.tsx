import React, { useState, useEffect, useRef } from 'react';
import { Tag } from '../types';

interface TagAutocompleteProps {
  tags: Tag[];
  selectedTagIds?: number[];
  onTagSelect: (tag: Tag | null) => void;
  placeholder?: string;
  excludeTagIds?: number[];
  className?: string;
  allowNoParent?: boolean;
  value?: string;
  onChange?: (value: string) => void;
}

const TagAutocomplete: React.FC<TagAutocompleteProps> = ({
  tags,
  selectedTagIds = [],
  onTagSelect,
  placeholder = 'Search tags...',
  excludeTagIds = [],
  className = '',
  allowNoParent = false,
  value: controlledValue,
  onChange: controlledOnChange
}) => {
  const [inputValue, setInputValue] = useState(controlledValue || '');
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  // Handle controlled vs uncontrolled input
  const value = controlledValue !== undefined ? controlledValue : inputValue;
  const onChange = controlledOnChange || setInputValue;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getAllTagsFlat = (tagList: Tag[]): Tag[] => {
    let flatTags: Tag[] = [];
    const traverse = (tags: Tag[]) => {
      for (const tag of tags) {
        flatTags.push(tag);
        if (tag.children) {
          traverse(tag.children);
        }
      }
    };
    traverse(tagList);
    return flatTags;
  };

  const getFilteredTags = (): Tag[] => {
    const allTags = getAllTagsFlat(tags);
    let filtered = allTags;

    // Filter by search term
    if (value.trim()) {
      filtered = filtered.filter(tag => 
        tag.name.toLowerCase().includes(value.toLowerCase())
      );
    }

    // Exclude specific tag IDs
    if (excludeTagIds.length > 0) {
      filtered = filtered.filter(tag => 
        tag.id && !excludeTagIds.includes(tag.id)
      );
    }

    return filtered;
  };

  const getDropdownOptions = (): (Tag | null)[] => {
    const filtered = getFilteredTags();
    
    if (allowNoParent) {
      if (!value.trim()) {
        return [null, ...filtered];
      }
      return filtered;
    }
    
    return filtered;
  };

  const handleTagSelect = (tag: Tag | null) => {
    if (tag) {
      onChange(tag.name);
    } else {
      onChange('');
    }
    setShowDropdown(false);
    setHighlightedIndex(-1);
    onTagSelect(tag);
  };

  const handleInputChange = (newValue: string) => {
    onChange(newValue);
    setShowDropdown(true);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;

    const options = getDropdownOptions();
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < options.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : options.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < options.length) {
          handleTagSelect(options[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowDropdown(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const clearSelection = () => {
    onChange('');
    setShowDropdown(false);
    setHighlightedIndex(-1);
    onTagSelect(null);
  };

  return (
    <div ref={autocompleteRef} className={`tag-autocomplete ${className}`} style={{ position: 'relative' }}>
      <input
        type="text"
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => setShowDropdown(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '0.5rem',
          paddingRight: value ? '2.5rem' : '0.5rem',
          border: '1px solid #ddd',
          borderRadius: '4px',
          fontSize: '1rem'
        }}
      />
      
      {value && (
        <button
          type="button"
          onClick={clearSelection}
          style={{
            position: 'absolute',
            right: '0.5rem',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1.2rem',
            color: '#999'
          }}
        >
          ×
        </button>
      )}
      
      {showDropdown && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: 'white',
          border: '1px solid #ddd',
          borderTop: 'none',
          borderRadius: '0 0 4px 4px',
          maxHeight: '200px',
          overflowY: 'auto',
          zIndex: 1000,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          {getDropdownOptions().map((option, index) => {
            const isHighlighted = index === highlightedIndex;
            const isSelected = option ? selectedTagIds.includes(option.id || 0) : false;
            
            return (
              <div
                key={option?.id || 'no-parent'}
                onClick={() => handleTagSelect(option)}
                onMouseEnter={() => setHighlightedIndex(index)}
                style={{
                  padding: '0.5rem',
                  cursor: 'pointer',
                  borderBottom: '1px solid #eee',
                  backgroundColor: isHighlighted 
                    ? '#2196f3' 
                    : isSelected 
                      ? '#e3f2fd' 
                      : 'white',
                  color: isHighlighted ? 'white' : 'black'
                }}
              >
                {option ? option.name : <em>No parent (root level)</em>}
              </div>
            );
          })}
          {getDropdownOptions().length === 0 && (
            <div style={{
              padding: '0.5rem',
              color: '#999',
              fontStyle: 'italic'
            }}>
              No matching tags found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TagAutocomplete;