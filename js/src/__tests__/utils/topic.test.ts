import { parseTopicWithParams } from '../../utils/topic.js';

describe('parseTopicWithParams', () => {
  it('returns the topic if it contains no vars', () => {
    expect(parseTopicWithParams('room:lobby', {})).toBe('room:lobby');
    expect(parseTopicWithParams('room:lobby', { foo: 'bar' })).toBe(
      'room:lobby'
    );
  });

  it('returns the topic with vars replaced', () => {
    expect(parseTopicWithParams('room:{roomId}', { roomId: 123 })).toBe(
      'room:123'
    );
  });

  it('returns the topic with vars replaced in multiple places', () => {
    expect(
      parseTopicWithParams('room:{roomId}:{subRoomId}', {
        roomId: 123,
        subRoomId: 456,
      })
    ).toBe('room:123:456');
  });

  it('raises if params are missing for vars in the topic', () => {
    expect(() => parseTopicWithParams('room:{roomId}', {})).toThrow(
      "Missing required parameter 'roomId' for topic pattern 'room:{roomId}'"
    );
  });
});
