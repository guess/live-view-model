import { BehaviorSubject, filter, map, Observable } from 'rxjs';
import {
  LiveSocket,
  LiveSocketError,
  LiveSocketErrorType,
  LiveSocketEvent,
  LiveSocketEventType,
} from './socket.js';
import { LiveChannel } from './channel.js';
import { PhoenixSocketError } from './phoenix.js';
import { isNotNull } from './utils/rxjs.js';

export function connect(url: string, params: object = {}): LiveConnection {
  const connection = new LiveConnection(url, params);
  connection.connect();
  return connection;
}

export class LiveConnection {
  private url: string;
  private _socket$ = new BehaviorSubject<LiveSocket | null>(null);
  private params: object | null;

  constructor(url: string, params?: object) {
    this.url = url;
    this.params = params || null;
  }

  connect() {
    console.debug('connecting to socket...');
    const socket = new LiveSocket(this.url, {
      params: this.params || {},
      debugger: (kind: string, msg: string, data: unknown) => {
        console.debug(`${kind}: ${msg}`, data);
      },
    });
    socket.connect();
    this._socket$.next(socket);
  }

  disconnect() {
    console.debug('disconnecting from socket...');
    this.socket?.disconnect();
  }

  createChannel$(topic: string, params?: object): Observable<LiveChannel> {
    return this._socket$.pipe(
      filter(isNotNull),
      map((socket) => new LiveChannel(socket, { topic, params }))
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
    type: LiveSocketErrorType,
    error?: PhoenixSocketError
  ): void {
    this.socket?.emitError(topic, type, {
      type,
      message: error?.message || error?.reason || 'Unknown error',
      code: error?.code,
    });
  }

  emitEvent(topic: string, event: LiveSocketEventType, payload?: object) {
    return this.socket!.emitEvent(topic, event, payload);
  }

  getEventStream$(
    topic: string,
    event: LiveSocketEventType
  ): Observable<object> {
    return this.socket!.getEventStream$(topic, event);
  }

  getErrorStream$(topic: string): Observable<LiveSocketError> {
    return this.socket!.getErrorStream$(topic);
  }
}
