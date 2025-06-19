import { Recipe, Tag } from './types';

let recipes: Recipe[] = [
  {
    id: 1,
    title: 'Classic Spaghetti Carbonara',
    description: 'A traditional Italian pasta dish with eggs, cheese, and pancetta',
    ingredients: '400g spaghetti\n200g pancetta or guanciale\n4 large eggs\n100g Pecorino Romano cheese\n100g Parmigiano-Reggiano cheese\nBlack pepper\nSalt',
    instructions: '1. Cook spaghetti in salted water until al dente\n2. Crisp pancetta in a large pan\n3. Whisk eggs with grated cheeses and black pepper\n4. Toss hot pasta with pancetta\n5. Remove from heat and quickly mix in egg mixture\n6. Serve immediately with extra cheese',
    prep_time: 15,
    cook_time: 20,
    servings: 4,
    tags: ['Italian', 'Dinner'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    title: 'Veggie Breakfast Bowl',
    description: 'A healthy breakfast bowl with quinoa, avocado, and vegetables',
    ingredients: '1 cup cooked quinoa\n1 avocado, sliced\n2 eggs\n1 cup spinach\n1/2 cup cherry tomatoes\n1/4 cup red onion\nOlive oil\nSalt and pepper\nLemon juice',
    instructions: '1. Cook eggs sunny-side up\n2. Sauté spinach with garlic\n3. Slice avocado and tomatoes\n4. Assemble bowl with quinoa as base\n5. Top with vegetables and egg\n6. Drizzle with olive oil and lemon juice',
    prep_time: 10,
    cook_time: 10,
    servings: 1,
    tags: ['Breakfast', 'Vegetarian'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 3,
    title: 'Chicken Tacos',
    description: 'Flavorful Mexican-style chicken tacos with fresh toppings',
    ingredients: '1 lb chicken breast\n8 corn tortillas\n1 onion, diced\n2 tomatoes, diced\n1 avocado, sliced\n1/2 cup cilantro\n2 limes\nCumin, chili powder, paprika\nSalt and pepper',
    instructions: '1. Season chicken with spices\n2. Grill or pan-fry chicken until cooked through\n3. Slice chicken into strips\n4. Warm tortillas\n5. Assemble tacos with chicken and toppings\n6. Serve with lime wedges',
    prep_time: 20,
    cook_time: 15,
    servings: 4,
    tags: ['Mexican', 'Dinner'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 4,
    title: 'Tofu Stir Fry',
    description: 'Quick and healthy Asian-inspired stir fry with tofu and vegetables',
    ingredients: '200g firm tofu\n2 cups mixed vegetables (broccoli, bell peppers, carrots)\n2 cloves garlic\n1 inch ginger\n3 tbsp soy sauce\n1 tbsp sesame oil\n1 tsp cornstarch\nGreen onions for garnish',
    instructions: '1. Press and cube tofu\n2. Heat oil in wok or large pan\n3. Fry tofu until golden\n4. Add vegetables and stir-fry\n5. Mix sauce ingredients\n6. Toss everything with sauce\n7. Garnish with green onions',
    prep_time: 15,
    cook_time: 10,
    servings: 2,
    tags: ['Asian', 'Vegetarian', 'Dinner'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const tags: Tag[] = [
  { id: 1, name: 'Cuisine', parent_tag_id: null },
  { id: 2, name: 'Italian', parent_tag_id: 1 },
  { id: 3, name: 'Mexican', parent_tag_id: 1 },
  { id: 4, name: 'Asian', parent_tag_id: 1 },
  { id: 5, name: 'Meal Type', parent_tag_id: null },
  { id: 6, name: 'Breakfast', parent_tag_id: 5 },
  { id: 7, name: 'Lunch', parent_tag_id: 5 },
  { id: 8, name: 'Dinner', parent_tag_id: 5 },
  { id: 9, name: 'Dietary', parent_tag_id: null },
  { id: 10, name: 'Vegetarian', parent_tag_id: 9 },
  { id: 11, name: 'Vegan', parent_tag_id: 9 },
  { id: 12, name: 'Gluten-Free', parent_tag_id: 9 }
];

const buildTagTree = (tags: Tag[], parentId: number | null = null): Tag[] => {
  return tags
    .filter(tag => tag.parent_tag_id === parentId)
    .map(tag => ({
      ...tag,
      children: buildTagTree(tags, tag.id!)
    }));
};

let nextRecipeId = 5;
let nextTagId = 13;

export const getAllRecipes = (): Recipe[] => recipes;

export const getRecipeById = (id: string): Recipe | undefined => 
  recipes.find(r => r.id === parseInt(id));

export const createRecipe = (recipeData: Omit<Recipe, 'id' | 'created_at' | 'updated_at'>): Recipe => {
  const recipe: Recipe = {
    id: nextRecipeId++,
    ...recipeData,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  recipes.unshift(recipe);
  return recipe;
};

export const updateRecipe = (id: string, recipeData: Omit<Recipe, 'id' | 'created_at' | 'updated_at'>): Recipe | null => {
  const index = recipes.findIndex(r => r.id === parseInt(id));
  if (index === -1) return null;
  recipes[index] = {
    ...recipes[index],
    ...recipeData,
    updated_at: new Date().toISOString()
  };
  return recipes[index];
};

export const deleteRecipe = (id: string): boolean => {
  const index = recipes.findIndex(r => r.id === parseInt(id));
  if (index === -1) return false;
  recipes.splice(index, 1);
  return true;
};

export const searchRecipes = (query?: string, tagNames?: string[]): Recipe[] => {
  let results = recipes;
  
  if (query) {
    const q = query.toLowerCase();
    results = results.filter(recipe => 
      recipe.title.toLowerCase().includes(q) ||
      (recipe.description && recipe.description.toLowerCase().includes(q)) ||
      recipe.ingredients.toLowerCase().includes(q) ||
      recipe.instructions.toLowerCase().includes(q)
    );
  }
  
  if (tagNames && tagNames.length > 0) {
    results = results.filter(recipe => 
      tagNames.every(tagName => 
        recipe.tags?.includes(tagName)
      )
    );
  }
  
  return results;
};

export const getAllTags = (): Tag[] => buildTagTree(tags);

export const createTag = (tagData: Omit<Tag, 'id' | 'created_at'>): Tag => {
  const tag: Tag = {
    id: nextTagId++,
    ...tagData,
    created_at: new Date().toISOString()
  };
  tags.push(tag);
  return tag;
};