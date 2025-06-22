import React from 'react';
import { Tag } from '../types';

interface TagChipProps {
  tag: Tag;
  variant?: 'normal' | 'staged-add' | 'staged-remove';
  onRemove?: (tag: Tag) => void;
  onClick?: (tag: Tag) => void;
  removable?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const TagChip: React.FC<TagChipProps> = ({
  tag,
  variant = 'normal',
  onRemove,
  onClick,
  removable = false,
  size = 'medium'
}) => {
  const getVariantStyles = () => {
    const baseStyles = {
      display: 'inline-flex',
      alignItems: 'center',
      borderRadius: '12px',
      fontWeight: '500' as const,
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.2s ease'
    };

    const sizeStyles = {
      small: {
        padding: '0.25rem 0.5rem',
        fontSize: '0.75rem',
        gap: '0.25rem'
      },
      medium: {
        padding: '0.375rem 0.75rem',
        fontSize: '0.875rem',
        gap: '0.375rem'
      },
      large: {
        padding: '0.5rem 1rem',
        fontSize: '1rem',
        gap: '0.5rem'
      }
    };

    const variantStyles = {
      normal: {
        backgroundColor: '#e3f2fd',
        color: '#1976d2',
        border: '1px solid #bbdefb'
      },
      'staged-add': {
        backgroundColor: '#e8f5e8',
        color: '#2e7d32',
        border: '1px solid #c8e6c9',
        position: 'relative' as const
      },
      'staged-remove': {
        backgroundColor: '#ffebee',
        color: '#d32f2f',
        border: '1px solid #ffcdd2',
        textDecoration: 'line-through',
        opacity: 0.7
      }
    };

    return {
      ...baseStyles,
      ...sizeStyles[size],
      ...variantStyles[variant]
    };
  };

  const getIndicatorStyles = () => {
    if (variant === 'staged-add') {
      return {
        content: '"+',
        position: 'absolute' as const,
        top: '-4px',
        left: '-4px',
        backgroundColor: '#4caf50',
        color: 'white',
        borderRadius: '50%',
        width: '16px',
        height: '16px',
        fontSize: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold' as const
      };
    }
    return null;
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick(tag);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove(tag);
    }
  };

  const chipStyle = getVariantStyles();
  const indicatorStyle = getIndicatorStyles();

  return (
    <span
      style={chipStyle}
      onClick={handleClick}
      title={tag.name}
    >
      {variant === 'staged-add' && indicatorStyle && (
        <span style={indicatorStyle}>+</span>
      )}
      
      {variant === 'staged-remove' && (
        <span style={{
          position: 'absolute',
          top: '-4px',
          left: '-4px',
          backgroundColor: '#f44336',
          color: 'white',
          borderRadius: '50%',
          width: '16px',
          height: '16px',
          fontSize: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold'
        }}>
          −
        </span>
      )}
      
      <span>{tag.name}</span>
      
      {removable && onRemove && (
        <button
          onClick={handleRemove}
          style={{
            background: 'none',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            fontSize: '1.2em',
            lineHeight: 1,
            opacity: 0.7,
            marginLeft: '0.25rem',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title={`Remove ${tag.name}`}
        >
          ×
        </button>
      )}
    </span>
  );
};

export default TagChip;