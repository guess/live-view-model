import { BehaviorSubject, filter, map, Observable } from 'rxjs';
import {
  errorStream$,
  eventStream$,
  LiveError,
  LiveErrorType,
  LiveEventStream,
  LiveEventType,
} from './events.js';
import { LiveSocket } from './socket.js';
import { LiveChannel } from './channel.js';
import { PhoenixSocketError } from './phoenix.js';
import { isNotNull } from './utils/rxjs.js';
import { logger } from './utils/logger.js';

export function connect(
  url: string,
  params: object = {},
  autoConnect = true
): LiveConnection {
  const connection = new LiveConnection(url, params);
  if (autoConnect) connection.connect();
  return connection;
}

export class LiveConnection {
  private url: string;
  private _socket$ = new BehaviorSubject<LiveSocket | null>(null);
  private params: object | null;
  stream: LiveEventStream;

  constructor(url: string, params?: object) {
    this.url = url;
    this.params = params || null;
    this.stream = new LiveEventStream();
  }

  connect() {
    logger.debug('connecting to socket...');
    const socket = new LiveSocket(this.url, this.stream, {
      params: this.params || {},
      debugger: (kind: string, msg: string, data: unknown) => {
        logger.debug(`${kind}: ${msg}`, data);
      },
    });
    socket.connect();
    this._socket$.next(socket);
  }

  disconnect() {
    logger.debug('disconnecting from socket...');
    this.socket?.disconnect();
  }

  createChannel$(topic: string, params?: object): Observable<LiveChannel> {
    return this._socket$.pipe(
      filter(isNotNull),
      map((socket) => new LiveChannel(socket, this.stream, { topic, params }))
    );
  }

  get socket(): LiveSocket | null {
    return this._socket$.getValue();
  }

  get socket$(): Observable<LiveSocket> {
    return this._socket$.asObservable().pipe(filter(isNotNull));
  }

  emitError(
    topic: string,
    type: LiveErrorType,
    error?: PhoenixSocketError
  ): void {
    this.stream.pushError(topic, type, error);
  }

  emitEvent(topic: string, event: LiveEventType, payload?: object) {
    return this.stream.push(topic, event, payload);
  }

  getEventStream$(topic: string, event: LiveEventType): Observable<object> {
    return eventStream$(this.stream, topic, event);
  }

  getErrorStream$(topic: string): Observable<LiveError> {
    return errorStream$(this.stream, topic);
  }
}
