import { filter, map, Observable, Subject } from 'rxjs';
import { PhoenixSocketError, phoenixSocketErrorKeys } from './phoenix.js';

export type LiveEvent = {
  topic: string;
  event: LiveEventType;
  payload?: object;
};

export type LiveEventType =
  | 'lvm-connect'
  | 'lvm-error'
  | 'lvm-patch'
  | 'lvm-change'
  | 'lvm-event';

// externally exposed errors
export type LiveError = {
  type: string;
  message: string;
  code?: string;
  error?: object;
};

export type LiveErrorType = 'socket' | 'channel' | 'server';

export class LiveEventStream {
  private subject = new Subject<LiveEvent>();

  push(topic: string, event: LiveEventType, payload?: object): void {
    if (event !== 'lvm-error') {
      console.log(`event: ${event} from topic: ${topic}`, payload);
    }
    this.subject.next({ topic, event, payload });
  }

  pushError(
    topic: string,
    type: LiveErrorType,
    error?: Partial<PhoenixSocketError>
  ): void {
    const event: LiveError = {
      type,
      message: error?.message || error?.reason || 'Unknown error',
    };
    if (error?.code) {
      event.code = error.code;
    }
    if (hasExtraData(error)) {
      event.error = error;
    }
    console.error(`error: ${type} error from topic: ${topic}`, event.message);
    this.push(topic, 'lvm-error', event);
  }

  get events(): Observable<LiveEvent> {
    return this.subject.asObservable();
  }
}

/* return true if the error includes other keys outside of PhoenixSocketError */
const hasExtraData = (error?: Partial<PhoenixSocketError>) => {
  return (
    error &&
    Object.keys(error).some((key) => !phoenixSocketErrorKeys.includes(key))
  );
};

export const eventStream$ = (
  stream: LiveEventStream,
  topic: string,
  event: LiveEventType
): Observable<object> => {
  return stream.events.pipe(
    filter((e: LiveEvent) => e.topic === topic),
    filter((e: LiveEvent) => e.event === event),
    map((e: LiveEvent) => e.payload || {})
  );
};

export const errorStream$ = (
  stream: LiveEventStream,
  topic: string
): Observable<LiveError> => {
  return stream.events.pipe(
    filter((e: LiveEvent) => e.topic === topic || e.topic === 'socket'),
    filter((e: LiveEvent) => e.event === 'lvm-error'),
    map((e: LiveEvent) => e.payload as LiveError)
  );
};
