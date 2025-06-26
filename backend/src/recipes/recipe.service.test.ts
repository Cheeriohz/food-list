import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { Database } from 'sqlite3';
import { recipeRouter } from './recipe.routes';

// Mock the database module to use isolated test database
jest.mock('../database', () => {
  const testDb = new Database(':memory:');
  return {
    db: testDb,
    initializeDatabase: () => {
      return new Promise<void>((resolve) => {
        testDb.serialize(() => {
          testDb.run(`CREATE TABLE IF NOT EXISTS recipes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            ingredients TEXT NOT NULL,
            instructions TEXT NOT NULL,
            prep_time INTEGER,
            cook_time INTEGER,
            servings INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )`);

          testDb.run(`CREATE TABLE IF NOT EXISTS tags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            parent_tag_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (parent_tag_id) REFERENCES tags (id)
          )`);

          testDb.run(`CREATE TABLE IF NOT EXISTS recipe_tags (
            recipe_id INTEGER,
            tag_id INTEGER,
            PRIMARY KEY (recipe_id, tag_id),
            FOREIGN KEY (recipe_id) REFERENCES recipes (id) ON DELETE CASCADE,
            FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE
          )`, resolve);
        });
      });
    }
  };
});

describe('Recipe API behavior', () => {
  let app: express.Application;

  beforeEach(async () => {
    const { initializeDatabase } = await import('../database');
    await initializeDatabase();
    
    // Setup test app
    app = express();
    app.use(express.json());
    app.use('/api/recipes', recipeRouter);
  });

  afterEach(async () => {
    const { db } = await import('../database');
    // Clear all data for next test
    await new Promise<void>((resolve) => {
      db.serialize(() => {
        db.run('DELETE FROM recipe_tags');
        db.run('DELETE FROM recipes');
        db.run('DELETE FROM tags', resolve);
      });
    });
  });

  it('should return empty array when no recipes exist', async () => {
    const response = await request(app)
      .get('/api/recipes')
      .expect(200);

    expect(response.body).toEqual([]);
  });

  it('should create a new recipe with valid data', async () => {
    const newRecipe = {
      title: 'Test Recipe',
      ingredients: 'Test ingredients',
      instructions: 'Test instructions',
      description: 'A test recipe',
      prep_time: 15,
      cook_time: 30,
      servings: 4
    };

    const response = await request(app)
      .post('/api/recipes')
      .send(newRecipe)
      .expect(201);

    expect(response.body).toMatchObject({
      id: expect.any(Number),
      message: 'Recipe created successfully'
    });
  });

  it('should reject recipe creation with missing required fields', async () => {
    const invalidRecipe = {
      description: 'Missing required fields'
    };

    const response = await request(app)
      .post('/api/recipes')
      .send(invalidRecipe)
      .expect(400);

    expect(response.body).toMatchObject({
      error: 'Validation failed',
      details: expect.any(Array)
    });
  });

  it('should retrieve a recipe by ID', async () => {
    // First create a recipe
    const newRecipe = {
      title: 'Test Recipe for Retrieval',
      ingredients: 'Test ingredients',
      instructions: 'Test instructions'
    };

    const createResponse = await request(app)
      .post('/api/recipes')
      .send(newRecipe)
      .expect(201);

    const recipeId = createResponse.body.id;

    // Then retrieve it
    const getResponse = await request(app)
      .get(`/api/recipes/${recipeId}`)
      .expect(200);

    expect(getResponse.body).toMatchObject({
      id: recipeId,
      title: 'Test Recipe for Retrieval',
      ingredients: 'Test ingredients',
      instructions: 'Test instructions'
    });
  });

  it('should return 404 for non-existent recipe', async () => {
    const response = await request(app)
      .get('/api/recipes/999')
      .expect(404);

    expect(response.body).toMatchObject({
      error: 'Recipe not found'
    });
  });

  it('should update an existing recipe', async () => {
    // First create a recipe
    const newRecipe = {
      title: 'Original Recipe',
      ingredients: 'Original ingredients',
      instructions: 'Original instructions'
    };

    const createResponse = await request(app)
      .post('/api/recipes')
      .send(newRecipe)
      .expect(201);

    const recipeId = createResponse.body.id;

    // Update the recipe
    const updatedRecipe = {
      title: 'Updated Recipe',
      ingredients: 'Updated ingredients',
      instructions: 'Updated instructions',
      description: 'Added description'
    };

    const updateResponse = await request(app)
      .put(`/api/recipes/${recipeId}`)
      .send(updatedRecipe)
      .expect(200);

    expect(updateResponse.body).toMatchObject({
      message: 'Recipe updated successfully'
    });

    // Verify the update
    const getResponse = await request(app)
      .get(`/api/recipes/${recipeId}`)
      .expect(200);

    expect(getResponse.body).toMatchObject({
      id: recipeId,
      title: 'Updated Recipe',
      ingredients: 'Updated ingredients',
      instructions: 'Updated instructions',
      description: 'Added description'
    });
  });

  it('should return 404 when updating non-existent recipe', async () => {
    const updateData = {
      title: 'Updated Recipe',
      ingredients: 'Updated ingredients',
      instructions: 'Updated instructions'
    };

    const response = await request(app)
      .put('/api/recipes/999')
      .send(updateData)
      .expect(404);

    expect(response.body).toMatchObject({
      error: 'Recipe not found'
    });
  });

  it('should delete an existing recipe', async () => {
    // First create a recipe
    const newRecipe = {
      title: 'Recipe to Delete',
      ingredients: 'Test ingredients',
      instructions: 'Test instructions'
    };

    const createResponse = await request(app)
      .post('/api/recipes')
      .send(newRecipe)
      .expect(201);

    const recipeId = createResponse.body.id;

    // Delete the recipe
    const deleteResponse = await request(app)
      .delete(`/api/recipes/${recipeId}`)
      .expect(200);

    expect(deleteResponse.body).toMatchObject({
      message: 'Recipe deleted successfully'
    });

    // Verify it's gone
    await request(app)
      .get(`/api/recipes/${recipeId}`)
      .expect(404);
  });

  it('should return 404 when deleting non-existent recipe', async () => {
    const response = await request(app)
      .delete('/api/recipes/999')
      .expect(404);

    expect(response.body).toMatchObject({
      error: 'Recipe not found'
    });
  });

  describe('Validation', () => {
    it('should reject recipe creation with invalid data types', async () => {
      const invalidRecipe = {
        title: 123, // Should be string
        ingredients: 'Valid ingredients',
        instructions: 'Valid instructions',
        prep_time: 'invalid' // Should be number
      };

      const response = await request(app)
        .post('/api/recipes')
        .send(invalidRecipe)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Validation failed',
        details: expect.any(Array)
      });
    });

    it('should reject recipe creation with empty required fields', async () => {
      const invalidRecipe = {
        title: '',
        ingredients: '',
        instructions: ''
      };

      const response = await request(app)
        .post('/api/recipes')
        .send(invalidRecipe)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Validation failed',
        details: expect.any(Array)
      });
    });

    it('should reject invalid recipe ID in params', async () => {
      const response = await request(app)
        .get('/api/recipes/invalid-id')
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Invalid parameters'
      });
    });

    it('should reject negative numbers for optional numeric fields', async () => {
      const invalidRecipe = {
        title: 'Valid Title',
        ingredients: 'Valid ingredients',
        instructions: 'Valid instructions',
        prep_time: -5, // Should be positive
        servings: 0 // Should be positive
      };

      const response = await request(app)
        .post('/api/recipes')
        .send(invalidRecipe)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Validation failed',
        details: expect.any(Array)
      });
    });
  });
});