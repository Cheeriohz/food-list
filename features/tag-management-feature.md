# Tag Management Feature Plan

## Problem Statement

The current recipe management application has basic tag functionality (display, filter, create) but lacks comprehensive tag management capabilities. Users need the ability to:

- Create new tags with hierarchical relationships
- Delete tags that are no longer needed
- Understand the impact of tag deletion on existing recipes
- Manage tag hierarchy and relationships

Currently, users can only create tags and use them for filtering, but cannot remove outdated or incorrect tags, leading to tag bloat and reduced system usability.

## Prerequisites

### Database Migration Required
Before implementing tag management, the application must be migrated from the dual database system (memory + SQLite) to use **only SQLite**. This migration is necessary because:

- **Data Persistence**: Tag management requires persistent storage
- **Referential Integrity**: SQLite foreign keys ensure data consistency during complex operations
- **Transaction Support**: Tag deletion involves multiple table updates that need atomic operations
- **Production Readiness**: Memory database is development-only, SQLite is production-ready

### Migration Tasks
1. **Remove memory database implementation** (`memory-database.ts`)
2. **Update default server** to use SQLite (`server.ts`) instead of simple-server (`simple-server.ts`)
3. **Update startup scripts** in package.json to use SQLite by default
4. **Migrate sample data** from memory database to SQLite seed script
5. **Update CLAUDE.md documentation** to reflect SQLite-only setup

## Current State Analysis

### Backend API Status
- ✅ `GET /api/tags` - Fetch hierarchical tag structure (SQLite only after migration)
- ✅ `POST /api/tags` - Create new tags with parent relationships (SQLite only)
- ❌ `DELETE /api/tags/:id` - Delete tags (MISSING)
- ❌ `GET /api/tags/:id/recipes` - Get recipe impact (MISSING)

### Frontend Capabilities
- ✅ TagTree component for hierarchical display
- ✅ Tag selection/filtering functionality
- ✅ Tag creation through TagContext
- ❌ Tag deletion interface (MISSING)
- ❌ Tag management interface (MISSING)
- ❌ Impact warning system (MISSING)

### Database Architecture (Post-Migration)
- **SQLite Database**: Proper foreign keys, junction table with CASCADE support
- **Referential Integrity**: Foreign key constraints ensure data consistency
- **Transaction Support**: ACID properties for complex operations

## Solution Approach

### Core Features
1. **Tag Deletion with Impact Assessment**
   - Show which recipes will be affected before deletion
   - Handle hierarchical relationships (promote children to grandparent level)
   - Remove deleted tag from all affected recipes

2. **Comprehensive Tag Management Interface**
   - Dedicated tag management view
   - Create/delete operations in one place
   - Visual hierarchy with management controls

3. **User Safety Features**
   - Confirmation dialogs with detailed impact information
   - Clear warnings about cascading effects
   - Non-destructive operations (recipes preserved, only tag removed)

### Technical Strategy

#### Hierarchical Tag Deletion Strategy
When deleting a parent tag:
- **Promote children** to the deleted tag's parent level
- **Preserve recipe assignments** on child tags
- **Remove only the deleted tag** from affected recipes

#### Database Architecture (SQLite Only)
- **Transaction-based Operations**: Wrap complex tag operations in database transactions
- **CASCADE Deletes**: Leverage foreign key constraints for automatic cleanup
- **Optimized Queries**: Use SQL JOINs for efficient impact assessment

## Implementation Plan

### Phase 0: Database Migration (Prerequisite)

#### 0.1 Remove Memory Database Implementation
- Delete `memory-database.ts` file
- Remove references to memory database from `simple-server.ts`
- Update imports and dependencies

#### 0.2 Update Default Server Configuration
- Make SQLite server (`server.ts`) the default
- Update `package.json` scripts to use SQLite by default
- Remove `simple-server.ts` or keep as documentation

#### 0.3 Migrate Sample Data
- Extract sample data from `memory-database.ts`
- Update `seed.ts` to include all sample recipes and tags
- Ensure hierarchical tag relationships are preserved

#### 0.4 Update Documentation
- Update `CLAUDE.md` to reflect SQLite-only setup
- Update startup instructions
- Document database initialization process

### Phase 1: Backend API Extension (SQLite Only)

#### 1.1 Add Recipe Impact Endpoint
```
GET /api/tags/:id/recipes
- Returns: List of recipes using the specified tag
- Purpose: Pre-deletion impact assessment
- Implementation: SQL JOIN between recipes, recipe_tags, and tags tables
```

#### 1.2 Add Tag Deletion Endpoint
```
DELETE /api/tags/:id
- Functionality:
  - Begin database transaction
  - Get all affected recipes
  - Remove tag from recipe_tags junction table
  - Promote child tags to parent's parent
  - Delete the tag from tags table
  - Commit transaction
- Returns: Summary of changes made
```

#### 1.3 SQLite Database Implementation
- **Transaction Management**: Wrap operations in BEGIN/COMMIT blocks
- **Cascade Handling**: Use foreign key constraints for automatic cleanup
- **Child Tag Promotion**: UPDATE tags SET parent_tag_id = ? WHERE parent_tag_id = ?
- **Impact Assessment**: Efficient SQL queries with JOINs

### Phase 2: Frontend Tag Management

#### 2.1 Create TagManagement Component
- **Features**:
  - Hierarchical tag display with management controls
  - Create new tag form
  - Delete buttons with confirmation flow
  - Tag usage statistics

- **UI Elements**:
  - Tree view similar to TagTree but with edit controls
  - "Add Tag" form with parent selection
  - Delete icons on hover
  - Tag usage counts

#### 2.2 Delete Confirmation System
- **Confirmation Modal**:
  - List affected recipes by name
  - Show child tags that will be promoted
  - Clear "Cancel" and "Delete" options
  - Impact summary (e.g., "This will affect 5 recipes and promote 2 child tags")

#### 2.3 Navigation Integration
- Add "Manage Tags" option to main navigation
- New view mode in App.tsx: 'manage-tags'
- Consistent styling with existing components

### Phase 3: Context and State Management

#### 3.1 TagContext Extensions
- `deleteTag(id: number): Promise<void>`
- `getTagRecipes(id: number): Promise<Recipe[]>`
- `tagStats: { [tagId: number]: number }` - recipe counts per tag

#### 3.2 Error Handling
- Network error handling for delete operations
- Rollback strategy if operations fail partway
- User-friendly error messages

### Phase 4: Integration and Testing

#### 4.1 App Navigation Updates
- Add 'manage-tags' to ViewMode type
- Update App.tsx routing logic
- Add navigation button to header

#### 4.2 Testing Strategy
- **Unit Tests**: Tag deletion logic, hierarchy promotion
- **Integration Tests**: End-to-end delete flow
- **User Testing**: Confirmation dialog clarity

## Technical Considerations

### Performance Optimization
- **Batch Operations**: Update multiple recipes efficiently
- **Optimistic Updates**: Update UI immediately, rollback on error
- **Efficient Queries**: Minimize database calls for impact assessment

### Data Integrity
- **Referential Integrity**: Ensure no orphaned references
- **Transaction Safety**: Wrap complex operations in transactions (SQLite)
- **Validation**: Prevent deletion of system-critical tags if needed

### Error Recovery
- **Graceful Degradation**: Handle partial failures
- **User Feedback**: Clear error messages with suggested actions
- **Logging**: Track deletion operations for debugging

### Scalability Considerations
- **Large Tag Trees**: Efficient rendering for many tags
- **High Recipe Counts**: Paginated impact displays if needed
- **Memory Usage**: Efficient data structures for tag hierarchy

## User Experience Flow

### Tag Deletion Flow
1. **User navigates** to Tag Management
2. **User clicks delete** on a tag
3. **System fetches** impact data (affected recipes, child tags)
4. **System shows** confirmation modal with detailed impact
5. **User reviews** and confirms or cancels
6. **System processes** deletion with progress indication
7. **System shows** success message with summary
8. **UI updates** to reflect changes

### Error Scenarios
- **Network failures**: Retry options with clear error messages
- **Concurrent modifications**: Refresh and retry prompts
- **Insufficient permissions**: Clear access denied messages

## Future Enhancements (Out of Scope)

- **Tag Editing**: Rename tags, change parent relationships
- **Drag & Drop**: Visual hierarchy reorganization
- **Bulk Operations**: Multi-select tag management
- **Tag Analytics**: Usage trends and recommendations
- **Tag Templates**: Pre-defined tag structures for new users
- **Undo Functionality**: Rollback recent tag deletions

## Success Criteria

### Functional Requirements
- ✅ Users can delete unwanted tags
- ✅ Users see clear impact warnings before deletion
- ✅ Child tags are properly promoted in hierarchy
- ✅ Affected recipes are updated automatically
- ✅ Tag management interface is intuitive

### Technical Requirements
- ✅ No data loss during tag operations
- ✅ Consistent behavior between memory and SQLite databases
- ✅ Proper error handling and user feedback
- ✅ Performance remains acceptable with realistic data volumes

### User Experience Requirements
- ✅ Clear confirmation process prevents accidental deletions
- ✅ Impact information helps users make informed decisions
- ✅ Operations complete in reasonable time with progress feedback

## Implementation Timeline

- **Database Migration (Phase 0)**: 2-3 hours
- **Backend API (Phase 1)**: 2-3 hours
- **Frontend Components (Phase 2-3)**: 3-4 hours  
- **Integration & Testing (Phase 4)**: 1-2 hours
- **Total Estimated Effort**: 8-12 hours

## Risk Assessment

### Technical Risks
- **Database Migration Complexity**: Medium - requires careful data migration and testing
- **Transaction Management**: Low - SQLite provides robust transaction support
- **Hierarchical Operations**: Medium - well-defined promotion rules
- **Performance with Large Datasets**: Low - reasonable data volumes expected with SQLite optimization

### User Experience Risks
- **Accidental deletions**: Mitigated by confirmation flow
- **Confusion about impacts**: Mitigated by clear impact messaging
- **Learning curve**: Low - familiar management interface patterns

This plan provides a comprehensive approach to tag management while maintaining data integrity and providing excellent user experience through clear impact communication and safe deletion processes.