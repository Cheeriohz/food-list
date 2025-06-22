import { useState, useEffect } from 'react';
import { Tag } from '../types';

interface StagedChange {
  tagId: number;
  action: 'add' | 'remove';
  tag: Tag;
}

interface ValidationResult {
  hasConflicts: boolean;
  conflictingTags: Tag[];
  duplicateAdditions: Tag[];
  unnecessaryRemovals: Tag[];
  isValid: boolean;
}

export const useTagValidation = (
  stagedChanges: StagedChange[],
  currentTagIds: number[]
): ValidationResult => {
  const [validation, setValidation] = useState<ValidationResult>({
    hasConflicts: false,
    conflictingTags: [],
    duplicateAdditions: [],
    unnecessaryRemovals: [],
    isValid: true
  });

  useEffect(() => {
    const conflicts: Tag[] = [];
    const duplicates: Tag[] = [];
    const unnecessary: Tag[] = [];

    // Check for conflicts (same tag being added and removed)
    const addedTagIds = stagedChanges
      .filter(change => change.action === 'add')
      .map(change => change.tagId);
    
    const removedTagIds = stagedChanges
      .filter(change => change.action === 'remove')
      .map(change => change.tagId);

    // Find conflicting tags
    const conflictingIds = addedTagIds.filter(id => removedTagIds.includes(id));
    conflictingIds.forEach(id => {
      const change = stagedChanges.find(c => c.tagId === id);
      if (change) conflicts.push(change.tag);
    });

    // Check for duplicate additions (trying to add a tag that's already on the recipe)
    stagedChanges
      .filter(change => change.action === 'add' && currentTagIds.includes(change.tagId))
      .forEach(change => duplicates.push(change.tag));

    // Check for unnecessary removals (trying to remove a tag that's not on the recipe)
    stagedChanges
      .filter(change => change.action === 'remove' && !currentTagIds.includes(change.tagId))
      .forEach(change => unnecessary.push(change.tag));

    const hasConflicts = conflicts.length > 0 || duplicates.length > 0 || unnecessary.length > 0;
    const isValid = !hasConflicts;

    setValidation({
      hasConflicts,
      conflictingTags: conflicts,
      duplicateAdditions: duplicates,
      unnecessaryRemovals: unnecessary,
      isValid
    });
  }, [stagedChanges, currentTagIds]);

  return validation;
};

export default useTagValidation;