import { db, initializeDatabase } from './database';
import { Recipe } from './types';

interface SeedRecipe extends Omit<Recipe, 'id' | 'created_at' | 'updated_at'> {
  tags: string[];
}

const seedData = async (): Promise<void> => {
  try {
    await initializeDatabase();
    
    const tags = [
      'Meal Time',
      'Breakfast',
      'Lunch',
      'Dinner',
      'Snack',
      'Late Night',
      'Effort Level',
      'Quick & Easy',
      'Medium Effort',
      'High Effort',
      'Prep Ahead',
      'Occasion',
      'Weeknight',
      'Weekend',
      'Special Occasion',
      'Comfort Food',
      'Healthy',
      'Dietary',
      'Vegetarian',
      'Vegan',
      'Gluten-Free',
      'Low Carb'
    ];
    
    const tagHierarchy: Record<string, string> = {
      'Breakfast': 'Meal Time',
      'Lunch': 'Meal Time',
      'Dinner': 'Meal Time',
      'Snack': 'Meal Time',
      'Late Night': 'Meal Time',
      'Quick & Easy': 'Effort Level',
      'Medium Effort': 'Effort Level',
      'High Effort': 'Effort Level',
      'Prep Ahead': 'Effort Level',
      'Weeknight': 'Occasion',
      'Weekend': 'Occasion',
      'Special Occasion': 'Occasion',
      'Comfort Food': 'Occasion',
      'Healthy': 'Occasion',
      'Vegetarian': 'Dietary',
      'Vegan': 'Dietary',
      'Gluten-Free': 'Dietary',
      'Low Carb': 'Dietary'
    };
    
    const tagIds: Record<string, number> = {};
    
    for (const tagName of tags) {
      const parentId = tagHierarchy[tagName] ? tagIds[tagHierarchy[tagName]] : null;
      
      await new Promise<void>((resolve, reject) => {
        db.run('INSERT OR IGNORE INTO tags (name, parent_tag_id) VALUES (?, ?)', [tagName, parentId], function(this: any, err: Error | null) {
          if (err) reject(err);
          else {
            db.get('SELECT id FROM tags WHERE name = ?', [tagName], (err: Error | null, row: { id: number }) => {
              if (err) reject(err);
              else {
                tagIds[tagName] = row.id;
                resolve();
              }
            });
          }
        });
      });
    }
    
    const recipes: SeedRecipe[] = [
      {
        title: 'Classic Spaghetti Carbonara',
        description: 'A traditional Italian pasta dish with eggs, cheese, and pancetta',
        ingredients: '400g spaghetti\n200g pancetta or guanciale\n4 large eggs\n100g Pecorino Romano cheese\n100g Parmigiano-Reggiano cheese\nBlack pepper\nSalt',
        instructions: '1. Cook spaghetti in salted water until al dente\n2. Crisp pancetta in a large pan\n3. Whisk eggs with grated cheeses and black pepper\n4. Toss hot pasta with pancetta\n5. Remove from heat and quickly mix in egg mixture\n6. Serve immediately with extra cheese',
        prep_time: 15,
        cook_time: 20,
        servings: 4,
        tags: ['Dinner', 'Medium Effort', 'Comfort Food', 'Weeknight']
      },
      {
        title: 'Veggie Breakfast Bowl',
        description: 'A healthy breakfast bowl with quinoa, avocado, and vegetables',
        ingredients: '1 cup cooked quinoa\n1 avocado, sliced\n2 eggs\n1 cup spinach\n1/2 cup cherry tomatoes\n1/4 cup red onion\nOlive oil\nSalt and pepper\nLemon juice',
        instructions: '1. Cook eggs sunny-side up\n2. Sauté spinach with garlic\n3. Slice avocado and tomatoes\n4. Assemble bowl with quinoa as base\n5. Top with vegetables and egg\n6. Drizzle with olive oil and lemon juice',
        prep_time: 10,
        cook_time: 10,
        servings: 1,
        tags: ['Breakfast', 'Quick & Easy', 'Healthy', 'Vegetarian']
      },
      {
        title: 'Chicken Tacos',
        description: 'Flavorful chicken tacos with fresh toppings',
        ingredients: '1 lb chicken breast\n8 corn tortillas\n1 onion, diced\n2 tomatoes, diced\n1 avocado, sliced\n1/2 cup cilantro\n2 limes\nCumin, chili powder, paprika\nSalt and pepper',
        instructions: '1. Season chicken with spices\n2. Grill or pan-fry chicken until cooked through\n3. Slice chicken into strips\n4. Warm tortillas\n5. Assemble tacos with chicken and toppings\n6. Serve with lime wedges',
        prep_time: 20,
        cook_time: 15,
        servings: 4,
        tags: ['Dinner', 'Medium Effort', 'Weeknight']
      },
      {
        title: 'Tofu Stir Fry',
        description: 'Quick and healthy stir fry with tofu and vegetables',
        ingredients: '200g firm tofu\n2 cups mixed vegetables (broccoli, bell peppers, carrots)\n2 cloves garlic\n1 inch ginger\n3 tbsp soy sauce\n1 tbsp sesame oil\n1 tsp cornstarch\nGreen onions for garnish',
        instructions: '1. Press and cube tofu\n2. Heat oil in wok or large pan\n3. Fry tofu until golden\n4. Add vegetables and stir-fry\n5. Mix sauce ingredients\n6. Toss everything with sauce\n7. Garnish with green onions',
        prep_time: 15,
        cook_time: 10,
        servings: 2,
        tags: ['Dinner', 'Quick & Easy', 'Healthy', 'Vegetarian', 'Weeknight']
      },
      {
        title: 'Overnight Oats',
        description: 'Make-ahead breakfast with oats, milk, and toppings',
        ingredients: '1/2 cup rolled oats\n1/2 cup milk\n1 tbsp chia seeds\n1 tbsp maple syrup\n1/2 cup berries\n2 tbsp nuts\nVanilla extract',
        instructions: '1. Mix oats, milk, chia seeds, and maple syrup\n2. Add vanilla extract\n3. Refrigerate overnight\n4. Top with berries and nuts before serving',
        prep_time: 5,
        cook_time: 0,
        servings: 1,
        tags: ['Breakfast', 'Prep Ahead', 'Healthy', 'Quick & Easy']
      },
      {
        title: 'Beef Wellington',
        description: 'Elegant beef tenderloin wrapped in puff pastry',
        ingredients: '2 lb beef tenderloin\n1 lb puff pastry\n8 oz mushrooms\n4 oz pâté\n2 egg yolks\nFresh herbs\nSalt and pepper',
        instructions: '1. Sear beef on all sides\n2. Prepare mushroom duxelles\n3. Wrap beef with pâté and mushrooms in pastry\n4. Brush with egg wash\n5. Bake until pastry is golden\n6. Rest before slicing',
        prep_time: 45,
        cook_time: 35,
        servings: 6,
        tags: ['Dinner', 'High Effort', 'Special Occasion', 'Weekend']
      },
      {
        title: 'Microwave Mug Cake',
        description: 'Quick chocolate cake made in a mug',
        ingredients: '4 tbsp flour\n4 tbsp sugar\n2 tbsp cocoa powder\n1/4 tsp baking powder\n3 tbsp milk\n2 tbsp oil\nPinch of salt',
        instructions: '1. Mix dry ingredients in mug\n2. Add wet ingredients and stir\n3. Microwave for 90 seconds\n4. Let cool slightly before eating',
        prep_time: 2,
        cook_time: 2,
        servings: 1,
        tags: ['Snack', 'Quick & Easy', 'Late Night']
      }
    ];
    
    for (const recipe of recipes) {
      const { title, description, ingredients, instructions, prep_time, cook_time, servings, tags } = recipe;
      
      await new Promise<void>((resolve, reject) => {
        db.run(
          'INSERT INTO recipes (title, description, ingredients, instructions, prep_time, cook_time, servings) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [title, description, ingredients, instructions, prep_time, cook_time, servings],
          function(this: any, err: Error | null) {
            if (err) reject(err);
            else {
              const recipeId = this.lastID;
              
              const tagPromises = tags.map(tagName => {
                return new Promise<void>((resolve, reject) => {
                  const tagId = tagIds[tagName];
                  if (tagId) {
                    db.run('INSERT INTO recipe_tags (recipe_id, tag_id) VALUES (?, ?)', [recipeId, tagId], () => resolve());
                  } else {
                    resolve();
                  }
                });
              });
              
              Promise.all(tagPromises).then(() => resolve()).catch(reject);
            }
          }
        );
      });
    }
    
    console.log('Seed data inserted successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();