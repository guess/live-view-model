import { LiveConnection } from '../connect/LiveConnection.js';
import { LiveChannel } from '../channel/LiveChannel.js';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';

export function liveViewModel(topic: string) {
  // eslint-disable-next-line
  return function <T extends { new (...args: any[]): object }>(constructor: T) {
    return class extends constructor {
      connection: LiveConnection;
      _channel$ = new BehaviorSubject<LiveChannel | null>(null);
      _subscription: Subscription | null = null;

      // eslint-disable-next-line
      constructor(...args: any[]) {
        super(...args);

        // Find the LiveConnection argument
        const connection = args.find((arg) => arg instanceof LiveConnection);

        if (!connection) {
          throw new Error('LiveConnection not provided to the constructor');
        }

        this.connection = connection!;
      }

      public join(params?: object) {
        this._subscription = this.connection
          .createChannel$(topic, params)
          .subscribe({
            next: (channel) => {
              this._channel$.next(channel);
              channel.join();
            },
          });
      }

      public leave() {
        if (this.channel) {
          this.channel.leave();
        }
        if (this._subscription) {
          this._subscription.unsubscribe();
        }
      }

      get channel(): LiveChannel | null {
        return this._channel$.getValue();
      }
    };
  };
}
