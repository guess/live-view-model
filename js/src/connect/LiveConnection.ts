import { BehaviorSubject, filter, map, Observable } from 'rxjs';
import { LiveChannel } from '../channel/LiveChannel.js';
import { LiveSocket } from '../socket/LiveSocket.js';
import { isNotNull } from '../utils/rxjs.js';

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
}
