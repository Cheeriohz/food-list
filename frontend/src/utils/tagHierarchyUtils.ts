import { Tag } from '../types';

// Define a hierarchical tag type that may have children
export interface HierarchicalTag extends Tag {
  children?: HierarchicalTag[];
}

// Pure function to extract all tag names from a hierarchical structure
export const getAllTagNames = (tags: HierarchicalTag[]): string[] => {
  const names: string[] = [];
  
  const traverse = (tagList: HierarchicalTag[]): void => {
    for (const tag of tagList) {
      names.push(tag.name);
      if (tag.children) {
        traverse(tag.children);
      }
    }
  };
  
  traverse(tags);
  return names;
};

// Pure function to flatten a hierarchical tag structure
export const flattenTagHierarchy = (hierarchicalTags: HierarchicalTag[]): Tag[] => {
  const flattened: Tag[] = [];
  
  const traverse = (tagList: HierarchicalTag[]): void => {
    for (const tag of tagList) {
      // Extract the base tag properties (without children)
      const { children, ...baseTag } = tag;
      flattened.push(baseTag);
      
      if (children) {
        traverse(children);
      }
    }
  };
  
  traverse(hierarchicalTags);
  return flattened;
};

// Pure function to find a tag by name in hierarchical structure
export const findTagByName = (tags: HierarchicalTag[], name: string): Tag | undefined => {
  for (const tag of tags) {
    if (tag.name === name) {
      const { children, ...baseTag } = tag;
      return baseTag;
    }
    
    if (tag.children) {
      const found = findTagByName(tag.children, name);
      if (found) {
        return found;
      }
    }
  }
  
  return undefined;
};

// Pure function to build hierarchy from flat tags with parent relationships
export const buildTagHierarchy = (
  flatTags: Tag[], 
  parentRelationships: Map<number, number>
): HierarchicalTag[] => {
  // Create a map of tag ID to hierarchical tag
  const tagMap = new Map<number, HierarchicalTag>();
  
  // Initialize all tags as hierarchical tags
  for (const tag of flatTags) {
    tagMap.set(tag.id, { ...tag, children: [] });
  }
  
  const rootTags: HierarchicalTag[] = [];
  
  // Build the hierarchy
  for (const tag of flatTags) {
    const hierarchicalTag = tagMap.get(tag.id)!;
    const parentId = parentRelationships.get(tag.id);
    
    if (parentId && tagMap.has(parentId)) {
      // This tag has a parent
      const parent = tagMap.get(parentId)!;
      if (!parent.children) {
        parent.children = [];
      }
      parent.children.push(hierarchicalTag);
    } else {
      // This is a root tag
      rootTags.push(hierarchicalTag);
    }
  }
  
  // Clean up empty children arrays
  const cleanupEmptyChildren = (tags: HierarchicalTag[]): void => {
    for (const tag of tags) {
      if (tag.children && tag.children.length === 0) {
        delete tag.children;
      } else if (tag.children) {
        cleanupEmptyChildren(tag.children);
      }
    }
  };
  
  cleanupEmptyChildren(rootTags);
  
  return rootTags;
};

// Pure function to check if tag hierarchy contains a specific tag
export const hierarchyContainsTag = (tags: HierarchicalTag[], targetName: string): boolean => {
  return getAllTagNames(tags).includes(targetName);
};

// Pure function to get all parent tag names for a given tag
export const getTagAncestors = (
  tags: HierarchicalTag[], 
  targetName: string, 
  currentPath: string[] = []
): string[] => {
  for (const tag of tags) {
    const newPath = [...currentPath, tag.name];
    
    if (tag.name === targetName) {
      return currentPath; // Don't include the target tag itself
    }
    
    if (tag.children) {
      const found = getTagAncestors(tag.children, targetName, newPath);
      if (found.length > 0) {
        return found;
      }
    }
  }
  
  return [];
};

// Pure function to filter tags by search query
export const filterTagsByQuery = (
  tags: HierarchicalTag[], 
  query: string
): HierarchicalTag[] => {
  if (!query.trim()) {
    return tags;
  }
  
  const lowerQuery = query.toLowerCase();
  
  const filterRecursive = (tagList: HierarchicalTag[]): HierarchicalTag[] => {
    const filtered: HierarchicalTag[] = [];
    
    for (const tag of tagList) {
      const matchesQuery = tag.name.toLowerCase().includes(lowerQuery);
      let filteredChildren: HierarchicalTag[] = [];
      
      if (tag.children) {
        filteredChildren = filterRecursive(tag.children);
      }
      
      // Include tag if it matches query or has matching children
      if (matchesQuery || filteredChildren.length > 0) {
        const filteredTag: HierarchicalTag = { ...tag };
        if (filteredChildren.length > 0) {
          filteredTag.children = filteredChildren;
        }
        filtered.push(filteredTag);
      }
    }
    
    return filtered;
  };
  
  return filterRecursive(tags);
};