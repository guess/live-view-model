import { LiveEventStream } from '../events.js';
import {
  LiveState,
  LiveStateChange,
  LiveStateData,
  LiveStatePatch,
  patch,
} from '../state.js';
import { firstValueFrom, timeout } from 'rxjs';

describe('patch function', () => {
  const initialState: LiveStateData = {
    data: {
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
      data: {
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
      data: {
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
      data: initialState.data,
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
      data: {
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
    expect(initialState.data.count).toBe(0);
  });
});

describe('LiveState', () => {
  let liveState: LiveState;

  const initialState = {
    count: 0,
    name: 'John',
    items: ['apple', 'banana'],
  };
  const initialVersion = 1;
  const stream = new LiveEventStream();
  const topic = 'foobar';

  beforeEach(() => {
    liveState = new LiveState(stream, topic, initialState, initialVersion);
  });

  it('should set initial state', () => {
    expect(liveState.data).toEqual(initialState);
    expect(liveState.version).toEqual(initialVersion);
  });

  it('should use defaults if initial state is not provided', () => {
    liveState = new LiveState(stream, topic);
    expect(liveState.data).toEqual({});
    expect(liveState.version).toEqual(0);
  });

  it('should change state when receiving lvm-change event', () => {
    const event: LiveStateChange = {
      data: {
        count: 5,
        name: 'Jill',
        items: ['apple', 'strawberry'],
      },
      version: 10,
    };
    stream.push(topic, 'lvm-change', event);
    expect(liveState.data).toEqual(event.data);
    expect(liveState.version).toEqual(event.version);
  });

  it('should change state when receiving lvm-patch event', async () => {
    const event: LiveStatePatch = {
      operations: [
        { op: 'replace', path: '/count', value: 1 },
        { op: 'replace', path: '/name', value: 'Jane' },
      ],
      version: 2,
    };

    stream.push(topic, 'lvm-patch', event);
    await firstValueFrom(liveState.state$.pipe(timeout(1000)));

    expect(liveState.state).toEqual({
      data: {
        count: 1,
        name: 'Jane',
        items: ['apple', 'banana'],
      },
      version: 2,
    });
  });
});
