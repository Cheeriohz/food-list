import { Recipe, Tag } from '../types';
import { SearchResult } from './SearchIndexService';

interface TreeNode {
  id: string; // Unique identifier for the node
  type: 'tag' | 'recipe';
  name: string;
  level: number;
  expanded: boolean;
  visible: boolean;
  matchScore: number; // Search relevance 0-1
  children: TreeNode[];
  
  // Tag-specific properties
  tagData?: {
    id: number;
    parent_tag_id: number | null;
    recipeCount: number;
    path: string[]; // Full hierarchy path
  };
  
  // Recipe-specific properties  
  recipeData?: {
    id: number;
    title: string;
    description: string;
    ingredients: string;
    instructions: string;
    prep_time?: number;
    cook_time?: number;
    servings?: number;
    tags: Tag[];
    thumbnail?: string;
  };
}

interface TreeBuildOptions {
  searchResults?: SearchResult[];
  expandedNodes?: Set<string>;
  maxDepth?: number;
  showEmptyTags?: boolean;
}

interface VirtualItem {
  id: string;
  node: TreeNode;
  level: number;
  index: number;
  height: number;
  offsetTop: number;
}

class TreeDataService {
  private tagMap = new Map<number, Tag>();
  private recipeMap = new Map<number, Recipe>();
  private tagRecipeMap = new Map<number, Set<number>>(); // tag_id -> recipe_ids
  private recipeTagMap = new Map<number, Set<number>>(); // recipe_id -> tag_ids

  /**
   * Initialize the service with data
   */
  initialize(recipes: Recipe[], tags: Tag[]): void {
    console.log('🔧 TreeDataService: initialize called with', recipes.length, 'recipes and', tags.length, 'tags');
    console.log('🔧 TreeDataService: Sample recipe:', recipes[0]);
    console.log('🔧 TreeDataService: Sample tag:', tags[0]);
    
    console.log('🔧 TreeDataService: Clearing maps...');
    this.clearMaps();
    
    console.log('🔧 TreeDataService: About to call buildDataMaps...');
    this.buildDataMaps(recipes, tags);
    console.log('🔧 TreeDataService: buildDataMaps completed');
  }

  /**
   * Build hierarchical tree from flat data
   */
  buildTree(options: TreeBuildOptions = {}): TreeNode[] {
    const { 
      searchResults, 
      expandedNodes = new Set(), 
      maxDepth = 10, 
      showEmptyTags = false 
    } = options;

    console.log('🌿 TreeDataService: buildTree called with options:', options);
    console.log('🌿 Has search results:', searchResults?.length || 0);
    console.log('🌿 Show empty tags:', showEmptyTags);

    // If we have search results, build a filtered tree
    if (searchResults && searchResults.length > 0) {
      console.log('🌿 TreeDataService: Building search result tree');
      const tree = this.buildSearchResultTree(searchResults, expandedNodes, maxDepth);
      console.log('🌿 TreeDataService: Search result tree built with', tree.length, 'root nodes');
      return tree;
    }

    // Otherwise, build full hierarchy
    console.log('🌿 TreeDataService: Building full hierarchy');
    const tree = this.buildFullHierarchy(expandedNodes, maxDepth, showEmptyTags);
    console.log('🌿 TreeDataService: Full hierarchy built with', tree.length, 'root nodes');
    return tree;
  }

  /**
   * Filter tree based on search query
   */
  filterTree(tree: TreeNode[], query: string): TreeNode[] {
    if (!query || query.length < 2) return tree;

    const queryLower = query.toLowerCase();
    
    return tree
      .map(node => this.filterNode(node, queryLower))
      .filter(node => node !== null) as TreeNode[];
  }

  /**
   * Expand path to specific node
   */
  expandPath(tree: TreeNode[], nodeId: string): TreeNode[] {
    return tree.map(node => this.expandNodePath(node, nodeId));
  }

  /**
   * Convert tree to virtualized list for efficient rendering
   */
  flattenTreeForVirtualization(tree: TreeNode[], itemHeight: number = 60): VirtualItem[] {
    const items: VirtualItem[] = [];
    let currentOffset = 0;

    const traverse = (nodes: TreeNode[], level: number = 0) => {
      nodes.forEach((node, index) => {
        if (!node.visible) return;

        // Calculate dynamic height based on node type and expansion
        const height = this.calculateNodeHeight(node, itemHeight);
        
        items.push({
          id: node.id,
          node,
          level,
          index: items.length,
          height,
          offsetTop: currentOffset
        });

        currentOffset += height;

        // Recursively add children if expanded
        if (node.expanded && node.children.length > 0) {
          traverse(node.children, level + 1);
        }
      });
    };

    traverse(tree);
    return items;
  }

  /**
   * Get node by ID from tree
   */
  findNodeById(tree: TreeNode[], nodeId: string): TreeNode | null {
    for (const node of tree) {
      if (node.id === nodeId) return node;
      
      const found = this.findNodeById(node.children, nodeId);
      if (found) return found;
    }
    return null;
  }

  /**
   * Update node expansion state
   */
  updateNodeExpansion(tree: TreeNode[], nodeId: string, expanded: boolean): TreeNode[] {
    return tree.map(node => this.updateNodeExpansionRecursive(node, nodeId, expanded));
  }

  /**
   * Get statistics about the tree
   */
  getTreeStatistics(tree: TreeNode[]): {
    totalNodes: number;
    visibleNodes: number;
    tagNodes: number;
    recipeNodes: number;
    maxDepth: number;
  } {
    let totalNodes = 0;
    let visibleNodes = 0;
    let tagNodes = 0;
    let recipeNodes = 0;
    let maxDepth = 0;

    const traverse = (nodes: TreeNode[], depth: number = 0) => {
      maxDepth = Math.max(maxDepth, depth);
      
      nodes.forEach(node => {
        totalNodes++;
        if (node.visible) visibleNodes++;
        if (node.type === 'tag') tagNodes++;
        if (node.type === 'recipe') recipeNodes++;
        
        if (node.children.length > 0) {
          traverse(node.children, depth + 1);
        }
      });
    };

    traverse(tree);
    
    return { totalNodes, visibleNodes, tagNodes, recipeNodes, maxDepth };
  }

  /**
   * Build data maps for efficient lookups
   */
  private buildDataMaps(recipes: Recipe[], tags: Tag[]): void {
    console.log('🔧 TreeDataService: buildDataMaps called');
    console.log('🔧 Input recipes:', recipes.length);
    console.log('🔧 Input tags:', tags.length);

    // Build tag map
    tags.forEach(tag => {
      if (tag.id) {
        this.tagMap.set(tag.id, tag);
        console.log('🔧 Added tag:', tag.id, tag.name);
      }
    });
    console.log('🔧 Tag map size:', this.tagMap.size);

    // Build recipe map and tag associations
    recipes.forEach(recipe => {
      if (recipe.id) {
        this.recipeMap.set(recipe.id, recipe);
        console.log('🔧 Processing recipe:', recipe.id, recipe.title);
        console.log('🔧 Recipe tags:', recipe.tags);
        
        // Build recipe -> tags mapping
        const tagIds = new Set<number>();
        recipe.tags?.forEach(tag => {
          console.log('🔧 Processing recipe tag:', tag);
          if (tag.id) {
            tagIds.add(tag.id);
            console.log('🔧 Added tag ID', tag.id, 'to recipe', recipe.id);
            
            // Build tag -> recipes mapping
            if (!this.tagRecipeMap.has(tag.id)) {
              this.tagRecipeMap.set(tag.id, new Set());
            }
            this.tagRecipeMap.get(tag.id)!.add(recipe.id!);
            console.log('🔧 Added recipe', recipe.id, 'to tag', tag.id);
          } else {
            console.log('🔧 WARNING: Tag missing ID:', tag);
          }
        });
        
        this.recipeTagMap.set(recipe.id, tagIds);
        console.log('🔧 Recipe', recipe.id, 'associated with tags:', Array.from(tagIds));
      }
    });

    console.log('🔧 Final map sizes:');
    console.log('🔧 - recipeMap:', this.recipeMap.size);
    console.log('🔧 - tagMap:', this.tagMap.size);
    console.log('🔧 - tagRecipeMap:', this.tagRecipeMap.size);
    console.log('🔧 - recipeTagMap:', this.recipeTagMap.size);
    
    // Log some sample mappings
    console.log('🔧 Sample tagRecipeMap entries:');
    for (const [tagId, recipeIds] of this.tagRecipeMap) {
      console.log(`🔧   Tag ${tagId} -> Recipes [${Array.from(recipeIds).join(', ')}]`);
    }
  }

  /**
   * Build tree from search results
   */
  private buildSearchResultTree(
    searchResults: SearchResult[], 
    expandedNodes: Set<string>, 
    maxDepth: number
  ): TreeNode[] {
    console.log('🌿 TreeDataService: buildSearchResultTree with', searchResults.length, 'results');
    
    const relevantTagIds = new Set<number>();
    const relevantRecipeIds = new Set<number>();
    
    // Collect relevant tags and recipes from search results
    searchResults.forEach(result => {
      console.log('🌿 Processing search result:', result.type, result.id);
      
      if (result.type === 'recipe') {
        relevantRecipeIds.add(result.id);
        // Add all tags associated with this recipe
        const tagIds = this.recipeTagMap.get(result.id);
        console.log('🌿 Recipe', result.id, 'has tags:', tagIds);
        if (tagIds) {
          tagIds.forEach(tagId => relevantTagIds.add(tagId));
        }
      } else if (result.type === 'tag') {
        relevantTagIds.add(result.id);
        // Add all recipes under this tag
        const recipeIds = this.tagRecipeMap.get(result.id);
        console.log('🌿 Tag', result.id, 'has recipes:', recipeIds);
        if (recipeIds) {
          recipeIds.forEach(recipeId => relevantRecipeIds.add(recipeId));
        }
      }
    });

    console.log('🌿 Relevant tag IDs:', Array.from(relevantTagIds));
    console.log('🌿 Relevant recipe IDs:', Array.from(relevantRecipeIds));

    // FALLBACK: If no recipes found via normal mapping, include all search result recipes directly
    if (relevantRecipeIds.size === 0) {
      console.log('🌿 No recipes found via tag mapping, adding search result recipes directly');
      searchResults.forEach(result => {
        if (result.type === 'recipe') {
          relevantRecipeIds.add(result.id);
        }
      });
    }

    // Add parent tags to show complete hierarchy
    const allRelevantTagIds = this.expandTagHierarchy(relevantTagIds);
    console.log('🌿 All relevant tag IDs (with parents):', Array.from(allRelevantTagIds));

    // If we have recipes but no tags, create a simple flat structure
    if (relevantRecipeIds.size > 0 && allRelevantTagIds.size === 0) {
      console.log('🌿 Creating flat recipe structure (no tags found)');
      return this.buildFlatRecipeTree(Array.from(relevantRecipeIds), searchResults);
    }

    // Build hierarchy with only relevant items
    const tree = this.buildTagHierarchy(
      Array.from(allRelevantTagIds),
      relevantRecipeIds,
      expandedNodes,
      maxDepth,
      searchResults
    );
    
    console.log('🌿 Final search tree:', tree.length, 'root nodes');
    return tree;
  }

  /**
   * Build flat tree structure for recipes when no tags are found
   */
  private buildFlatRecipeTree(recipeIds: number[], searchResults?: SearchResult[]): TreeNode[] {
    console.log('🌿 TreeDataService: buildFlatRecipeTree with', recipeIds.length, 'recipes');
    
    const nodes: TreeNode[] = [];
    
    recipeIds.forEach(recipeId => {
      const recipe = this.recipeMap.get(recipeId);
      if (!recipe || !recipe.id) return;

      // Calculate match score if this is a search result
      let matchScore = 0;
      if (searchResults) {
        const result = searchResults.find(r => r.type === 'recipe' && r.id === recipe.id);
        matchScore = result ? result.score : 0;
      }

      const recipeNode: TreeNode = {
        id: `recipe-${recipe.id}`,
        type: 'recipe',
        name: recipe.title,
        level: 0,
        expanded: false,
        visible: true,
        matchScore,
        children: [],
        recipeData: {
          id: recipe.id,
          title: recipe.title,
          description: recipe.description || '',
          ingredients: recipe.ingredients,
          instructions: recipe.instructions,
          prep_time: recipe.prep_time,
          cook_time: recipe.cook_time,
          servings: recipe.servings,
          tags: recipe.tags || [],
          thumbnail: undefined
        }
      };

      nodes.push(recipeNode);
    });

    // Sort by match score first, then alphabetically
    return nodes.sort((a, b) => {
      if (searchResults) {
        if (a.matchScore !== b.matchScore) {
          return b.matchScore - a.matchScore;
        }
      }
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Build full hierarchy without filtering
   */
  private buildFullHierarchy(
    expandedNodes: Set<string>, 
    maxDepth: number, 
    showEmptyTags: boolean
  ): TreeNode[] {
    console.log('🔧 buildFullHierarchy: tagMap size:', this.tagMap.size, 'recipeMap size:', this.recipeMap.size);
    
    // CRITICAL FIX: If maps are empty, this TreeDataService instance wasn't initialized
    if (this.tagMap.size === 0 || this.recipeMap.size === 0) {
      console.log('🔧 buildFullHierarchy: ❌ Maps are empty! TreeDataService not initialized');
      console.log('🔧 buildFullHierarchy: This instance needs data - returning empty tree');
      return [];
    }
    
    const allTagIds = Array.from(this.tagMap.keys());
    const allRecipeIds = new Set(this.recipeMap.keys());
    
    console.log('🔧 buildFullHierarchy: Building with', allTagIds.length, 'tags and', allRecipeIds.size, 'recipes');
    
    return this.buildTagHierarchy(
      allTagIds,
      allRecipeIds,
      expandedNodes,
      maxDepth,
      undefined,
      showEmptyTags
    );
  }

  /**
   * Build tag hierarchy recursively
   */
  private buildTagHierarchy(
    tagIds: number[],
    relevantRecipeIds: Set<number>,
    expandedNodes: Set<string>,
    maxDepth: number,
    searchResults?: SearchResult[],
    showEmptyTags: boolean = false,
    parentId: number | null = null,
    currentDepth: number = 0
  ): TreeNode[] {
    if (currentDepth >= maxDepth) return [];

    const nodes: TreeNode[] = [];
    
    // Get tags at current level
    const currentLevelTags = tagIds.filter(tagId => {
      const tag = this.tagMap.get(tagId);
      return tag && tag.parent_tag_id === parentId;
    });

    currentLevelTags.forEach(tagId => {
      const tag = this.tagMap.get(tagId);
      if (!tag || !tag.id) return;

      const nodeId = `tag-${tag.id}`;
      const tagRecipes = this.tagRecipeMap.get(tag.id) || new Set();
      const hasRelevantRecipes = Array.from(tagRecipes).some(recipeId => 
        relevantRecipeIds.has(recipeId)
      );

      // Skip empty tags if not showing them
      if (!showEmptyTags && tagRecipes.size === 0 && !hasRelevantRecipes) {
        return;
      }

      // Calculate match score if this is a search result
      let matchScore = 0;
      if (searchResults) {
        const result = searchResults.find(r => r.type === 'tag' && r.id === tag.id);
        matchScore = result ? result.score : 0;
      }

      // Build child tags
      const childTags = this.buildTagHierarchy(
        tagIds,
        relevantRecipeIds,
        expandedNodes,
        maxDepth,
        searchResults,
        showEmptyTags,
        tag.id,
        currentDepth + 1
      );

      // Build recipes for this tag
      const recipeNodes = this.buildRecipeNodes(
        tag.id,
        relevantRecipeIds,
        searchResults,
        currentDepth + 1
      );

      const tagNode: TreeNode = {
        id: nodeId,
        type: 'tag',
        name: tag.name,
        level: currentDepth,
        expanded: expandedNodes.has(nodeId),
        visible: true,
        matchScore,
        children: [...childTags, ...recipeNodes],
        tagData: {
          id: tag.id,
          parent_tag_id: tag.parent_tag_id || null,
          recipeCount: tagRecipes.size,
          path: this.buildTagPath(tag.id)
        }
      };

      nodes.push(tagNode);
    });

    return nodes.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Build recipe nodes for a specific tag
   */
  private buildRecipeNodes(
    tagId: number,
    relevantRecipeIds: Set<number>,
    searchResults?: SearchResult[],
    level: number = 0
  ): TreeNode[] {
    const tagRecipes = this.tagRecipeMap.get(tagId) || new Set();
    const nodes: TreeNode[] = [];

    tagRecipes.forEach(recipeId => {
      if (!relevantRecipeIds.has(recipeId)) return;

      const recipe = this.recipeMap.get(recipeId);
      if (!recipe || !recipe.id) return;

      // Calculate match score if this is a search result
      let matchScore = 0;
      if (searchResults) {
        const result = searchResults.find(r => r.type === 'recipe' && r.id === recipe.id);
        matchScore = result ? result.score : 0;
      }

      const recipeNode: TreeNode = {
        id: `recipe-${recipe.id}`,
        type: 'recipe',
        name: recipe.title,
        level,
        expanded: false, // Recipes don't have children
        visible: true,
        matchScore,
        children: [],
        recipeData: {
          id: recipe.id,
          title: recipe.title,
          description: recipe.description || '',
          ingredients: recipe.ingredients,
          instructions: recipe.instructions,
          prep_time: recipe.prep_time,
          cook_time: recipe.cook_time,
          servings: recipe.servings,
          tags: recipe.tags || [],
          thumbnail: undefined // TODO: Add thumbnail support
        }
      };

      nodes.push(recipeNode);
    });

    return nodes.sort((a, b) => {
      // Sort by match score first, then alphabetically
      if (searchResults) {
        if (a.matchScore !== b.matchScore) {
          return b.matchScore - a.matchScore;
        }
      }
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Expand tag hierarchy to include all parent tags
   */
  private expandTagHierarchy(tagIds: Set<number>): Set<number> {
    const expanded = new Set(tagIds);
    
    tagIds.forEach(tagId => {
      let currentTag = this.tagMap.get(tagId);
      
      // Add all parent tags
      while (currentTag && currentTag.parent_tag_id) {
        expanded.add(currentTag.parent_tag_id);
        currentTag = this.tagMap.get(currentTag.parent_tag_id);
      }
    });
    
    return expanded;
  }

  /**
   * Build full path for a tag
   */
  private buildTagPath(tagId: number): string[] {
    const path: string[] = [];
    let currentTag = this.tagMap.get(tagId);
    
    while (currentTag) {
      path.unshift(currentTag.name);
      if (currentTag.parent_tag_id) {
        currentTag = this.tagMap.get(currentTag.parent_tag_id);
      } else {
        break;
      }
    }
    
    return path;
  }

  /**
   * Filter individual node based on query
   */
  private filterNode(node: TreeNode, queryLower: string): TreeNode | null {
    const matches = node.name.toLowerCase().includes(queryLower);
    
    // Recursively filter children
    const filteredChildren = node.children
      .map(child => this.filterNode(child, queryLower))
      .filter(child => child !== null) as TreeNode[];
    
    // Include node if it matches or has matching children
    if (matches || filteredChildren.length > 0) {
      return {
        ...node,
        visible: true,
        children: filteredChildren
      };
    }
    
    return null;
  }

  /**
   * Expand path to specific node
   */
  private expandNodePath(node: TreeNode, targetNodeId: string): TreeNode {
    if (node.id === targetNodeId) {
      return { ...node, expanded: true };
    }
    
    const updatedChildren = node.children.map(child => 
      this.expandNodePath(child, targetNodeId)
    );
    
    // Expand this node if any child contains the target
    const shouldExpand = updatedChildren.some(child => 
      child.expanded || this.containsNode(child, targetNodeId)
    );
    
    return {
      ...node,
      expanded: shouldExpand || node.expanded,
      children: updatedChildren
    };
  }

  /**
   * Check if node or its children contain target node
   */
  private containsNode(node: TreeNode, targetNodeId: string): boolean {
    if (node.id === targetNodeId) return true;
    return node.children.some(child => this.containsNode(child, targetNodeId));
  }

  /**
   * Update node expansion state recursively
   */
  private updateNodeExpansionRecursive(
    node: TreeNode, 
    nodeId: string, 
    expanded: boolean
  ): TreeNode {
    if (node.id === nodeId) {
      return { ...node, expanded };
    }
    
    return {
      ...node,
      children: node.children.map(child => 
        this.updateNodeExpansionRecursive(child, nodeId, expanded)
      )
    };
  }

  /**
   * Calculate dynamic height for virtualization
   */
  private calculateNodeHeight(node: TreeNode, baseHeight: number): number {
    if (node.type === 'recipe') {
      // Recipes might be taller, especially if expanded
      return baseHeight * 1.2;
    }
    
    // Tags use base height
    return baseHeight;
  }

  /**
   * Clear all data maps
   */
  private clearMaps(): void {
    this.tagMap.clear();
    this.recipeMap.clear();
    this.tagRecipeMap.clear();
    this.recipeTagMap.clear();
  }
}

export default TreeDataService;
export type { TreeNode, TreeBuildOptions, VirtualItem };