import { LiveChannel } from '../channel/LiveChannel.js';
import { LiveConnection } from '../connect/LiveConnection.js';
import { BehaviorSubject, Subscription } from 'rxjs';
import { LiveSocketError } from '../socket/LiveSocketError.js';

export type LiveViewModel = {
  topic: string;
  join: (params?: object) => void;
  leave: () => void;
  channel: LiveChannel;
  connection: LiveConnection;
};

export function liveViewModel(topic: string) {
  // eslint-disable-next-line
  return function <T extends { new (...args: any[]): object }>(constructor: T) {
    return class extends constructor {
      topic = topic;
      connection: LiveConnection;
      _channel$ = new BehaviorSubject<LiveChannel | null>(null);
      _subscription: Subscription | null = null;
      _errorSubscription: Subscription | null = null;

      // eslint-disable-next-line
      constructor(...args: any[]) {
        super(...args);

        // Find the LiveConnection argument
        const connection = args.find((arg) => arg instanceof LiveConnection);

        if (!connection) {
          throw new Error('LiveConnection not provided to the constructor');
        }

        this.connection = connection!;

        // Set up the error subscription
        this._errorSubscription = this.connection
          .getErrorStream$(topic)
          .subscribe({
            next: (error: LiveSocketError) => {
              if (this.constructor.prototype.__liveErrorHandler) {
                this.constructor.prototype.__liveErrorHandler.call(this, error);
              }
            },
          });
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
        if (this._errorSubscription) {
          this._errorSubscription.unsubscribe();
        }
      }

      get channel(): LiveChannel | null {
        return this._channel$.getValue();
      }
    };
  };
}
