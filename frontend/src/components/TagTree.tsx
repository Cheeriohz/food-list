import React from 'react';
import { useTags } from '../contexts/TagContext';
import { Tag } from '../types';

interface TagNodeProps {
  tag: Tag;
  selectedTags: string[];
  onToggleTag: (tagName: string) => void;
}

const TagNode = ({ tag, selectedTags, onToggleTag }: TagNodeProps) => {
  const isSelected = selectedTags.includes(tag.name);
  
  return (
    <li>
      <button
        className={isSelected ? 'active' : ''}
        onClick={() => onToggleTag(tag.name)}
      >
        {tag.name}
      </button>
      {tag.children && tag.children.length > 0 && (
        <ul className="tag-children">
          {tag.children.map(child => (
            <TagNode
              key={child.id}
              tag={child}
              selectedTags={selectedTags}
              onToggleTag={onToggleTag}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

const TagTree = () => {
  const { tags, selectedTags, selectTag, deselectTag } = useTags();

  const handleToggleTag = (tagName: string): void => {
    if (selectedTags.includes(tagName)) {
      deselectTag(tagName);
    } else {
      selectTag(tagName);
    }
  };

  return (
    <div className="tag-tree">
      <h3>Tags</h3>
      <ul>
        {tags.map(tag => (
          <TagNode
            key={tag.id}
            tag={tag}
            selectedTags={selectedTags}
            onToggleTag={handleToggleTag}
          />
        ))}
      </ul>
    </div>
  );
};

export default TagTree;