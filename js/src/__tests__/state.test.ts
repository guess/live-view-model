import { LiveStateData, LiveStatePatch, patch } from '../state.js';

describe('patch function', () => {
  const initialState: LiveStateData = {
    state: {
      count: 0,
      name: 'John',
      items: ['apple', 'banana'],
    },
    version: 1,
  };

  it('should apply a valid patch', () => {
    const patchData: LiveStatePatch = {
      version: 2,
      operations: [
        { op: 'replace', path: '/count', value: 1 },
        { op: 'replace', path: '/name', value: 'Jane' },
      ],
    };

    const result = patch(initialState, patchData);

    expect(result).toEqual({
      state: {
        count: 1,
        name: 'Jane',
        items: ['apple', 'banana'],
      },
      version: 2,
    });
  });

  it('should return null for an out-of-order patch', () => {
    const patchData: LiveStatePatch = {
      version: 3, // Should be 2 to be valid
      operations: [{ op: 'replace', path: '/count', value: 1 }],
    };

    const result = patch(initialState, patchData);

    expect(result).toBeNull();
  });

  it('should apply a patch with version 0', () => {
    const patchData: LiveStatePatch = {
      version: 0,
      operations: [{ op: 'replace', path: '/count', value: 10 }],
    };

    const result = patch(initialState, patchData);

    expect(result).toEqual({
      state: {
        count: 10,
        name: 'John',
        items: ['apple', 'banana'],
      },
      version: 0,
    });
  });

  it('should apply patch with no operations', () => {
    const patchData: LiveStatePatch = {
      version: 2,
      operations: [],
    };

    const result = patch(initialState, patchData);

    expect(result).toEqual({
      state: initialState.state,
      version: 2,
    });
  });

  it('should handle complex operations', () => {
    const patchData: LiveStatePatch = {
      version: 2,
      operations: [
        { op: 'add', path: '/items/-', value: 'cherry' },
        { op: 'remove', path: '/items/0' },
        { op: 'add', path: '/nested', value: { foo: 'bar' } },
      ],
    };

    const result = patch(initialState, patchData);

    expect(result).toEqual({
      state: {
        count: 0,
        name: 'John',
        items: ['banana', 'cherry'],
        nested: { foo: 'bar' },
      },
      version: 2,
    });
  });

  it('should not mutate the original state', () => {
    const patchData: LiveStatePatch = {
      version: 2,
      operations: [{ op: 'replace', path: '/count', value: 1 }],
    };

    const result = patch(initialState, patchData);

    expect(result).not.toBe(initialState);
    expect(initialState.state.count).toBe(0);
  });
});
