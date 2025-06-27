// Pure functions for immutable Set operations

export const toggleSetItem = <T>(set: Set<T>, item: T): Set<T> => {
  const newSet = new Set(set);
  if (newSet.has(item)) {
    newSet.delete(item);
  } else {
    newSet.add(item);
  }
  return newSet;
};

export const addToSet = <T>(set: Set<T>, item: T): Set<T> => {
  const newSet = new Set(set);
  newSet.add(item);
  return newSet;
};

export const removeFromSet = <T>(set: Set<T>, item: T): Set<T> => {
  const newSet = new Set(set);
  newSet.delete(item);
  return newSet;
};

export const unionSets = <T>(...sets: Set<T>[]): Set<T> => {
  const result = new Set<T>();
  for (const set of sets) {
    for (const item of set) {
      result.add(item);
    }
  }
  return result;
};

export const intersectionSets = <T>(setA: Set<T>, setB: Set<T>): Set<T> => {
  const result = new Set<T>();
  for (const item of setA) {
    if (setB.has(item)) {
      result.add(item);
    }
  }
  return result;
};