import { describe, it, expect } from 'vitest';
import { Tag } from '../types';
import {
  getAllTagNames,
  flattenTagHierarchy,
  findTagByName,
  buildTagHierarchy
} from './tagHierarchyUtils';

const getMockTag = (overrides?: Partial<Tag>): Tag => {
  return {
    id: 1,
    name: 'test-tag',
    created_at: '2024-01-01',
    ...overrides
  };
};

describe('Tag Hierarchy Utils', () => {
  describe('getAllTagNames', () => {
    it('should extract all tag names from flat list', () => {
      const tags = [
        getMockTag({ id: 1, name: 'vegetarian' }),
        getMockTag({ id: 2, name: 'quick' }),
        getMockTag({ id: 3, name: 'healthy' })
      ];

      const result = getAllTagNames(tags);

      expect(result).toEqual(['vegetarian', 'quick', 'healthy']);
    });

    it('should extract all tag names from hierarchical structure', () => {
      const tags = [
        {
          ...getMockTag({ id: 1, name: 'cuisine' }),
          children: [
            getMockTag({ id: 2, name: 'italian' }),
            getMockTag({ id: 3, name: 'asian' })
          ]
        },
        getMockTag({ id: 4, name: 'quick' })
      ];

      const result = getAllTagNames(tags);

      expect(result).toEqual(['cuisine', 'italian', 'asian', 'quick']);
    });

    it('should handle deeply nested hierarchies', () => {
      const tags = [
        {
          ...getMockTag({ id: 1, name: 'cuisine' }),
          children: [
            {
              ...getMockTag({ id: 2, name: 'asian' }),
              children: [
                getMockTag({ id: 3, name: 'chinese' }),
                getMockTag({ id: 4, name: 'japanese' })
              ]
            }
          ]
        }
      ];

      const result = getAllTagNames(tags);

      expect(result).toEqual(['cuisine', 'asian', 'chinese', 'japanese']);
    });

    it('should handle empty array', () => {
      const result = getAllTagNames([]);
      expect(result).toEqual([]);
    });
  });

  describe('flattenTagHierarchy', () => {
    it('should flatten hierarchical tags to flat array', () => {
      const hierarchicalTags = [
        {
          ...getMockTag({ id: 1, name: 'cuisine' }),
          children: [
            getMockTag({ id: 2, name: 'italian' }),
            getMockTag({ id: 3, name: 'asian' })
          ]
        },
        getMockTag({ id: 4, name: 'quick' })
      ];

      const result = flattenTagHierarchy(hierarchicalTags);

      expect(result).toHaveLength(4);
      expect(result.map(t => t.name)).toEqual(['cuisine', 'italian', 'asian', 'quick']);
    });

    it('should preserve all tag properties when flattening', () => {
      const hierarchicalTags = [
        {
          ...getMockTag({ id: 1, name: 'cuisine', created_at: '2024-01-01' }),
          children: [
            getMockTag({ id: 2, name: 'italian', created_at: '2024-01-02' })
          ]
        }
      ];

      const result = flattenTagHierarchy(hierarchicalTags);

      expect(result[0]).toEqual(
        expect.objectContaining({
          id: 1,
          name: 'cuisine',
          created_at: '2024-01-01'
        })
      );
      expect(result[1]).toEqual(
        expect.objectContaining({
          id: 2,
          name: 'italian',
          created_at: '2024-01-02'
        })
      );
    });
  });

  describe('findTagByName', () => {
    it('should find tag in flat list', () => {
      const tags = [
        getMockTag({ id: 1, name: 'vegetarian' }),
        getMockTag({ id: 2, name: 'quick' })
      ];

      const result = findTagByName(tags, 'quick');

      expect(result).toEqual(getMockTag({ id: 2, name: 'quick' }));
    });

    it('should find tag in hierarchical structure', () => {
      const tags = [
        {
          ...getMockTag({ id: 1, name: 'cuisine' }),
          children: [
            getMockTag({ id: 2, name: 'italian' }),
            getMockTag({ id: 3, name: 'asian' })
          ]
        }
      ];

      const result = findTagByName(tags, 'italian');

      expect(result).toEqual(getMockTag({ id: 2, name: 'italian' }));
    });

    it('should return undefined for non-existent tag', () => {
      const tags = [getMockTag({ id: 1, name: 'vegetarian' })];

      const result = findTagByName(tags, 'non-existent');

      expect(result).toBeUndefined();
    });
  });

  describe('buildTagHierarchy', () => {
    it('should build hierarchy from flat tags with parent relationships', () => {
      const flatTags = [
        getMockTag({ id: 1, name: 'cuisine' }),
        getMockTag({ id: 2, name: 'italian' }),
        getMockTag({ id: 3, name: 'asian' }),
        getMockTag({ id: 4, name: 'quick' })
      ];

      // Mock parent relationships - in real app this would come from database
      const parentRelationships = new Map([
        [2, 1], // italian -> cuisine
        [3, 1]  // asian -> cuisine
      ]);

      const result = buildTagHierarchy(flatTags, parentRelationships);

      expect(result).toHaveLength(2); // cuisine and quick as top-level
      
      const cuisineTag = result.find(t => t.name === 'cuisine');
      expect(cuisineTag?.children).toHaveLength(2);
      expect(cuisineTag?.children?.map(c => c.name)).toEqual(['italian', 'asian']);
    });

    it('should handle tags with no parent relationships', () => {
      const flatTags = [
        getMockTag({ id: 1, name: 'vegetarian' }),
        getMockTag({ id: 2, name: 'quick' })
      ];

      const result = buildTagHierarchy(flatTags, new Map());

      expect(result).toHaveLength(2);
      expect(result.every(tag => !tag.children || tag.children.length === 0)).toBe(true);
    });
  });
});