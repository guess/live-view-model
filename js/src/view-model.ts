import 'reflect-metadata';
import { makeObservable, observable, runInAction } from 'mobx';
import { BehaviorSubject, Subscription } from 'rxjs';
import { LiveChannel } from './channel.js';
import { LiveConnection } from './connect.js';
import { LiveSocketError } from './socket.js';
import { PhoenixSocketError } from './phoenix.js';

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

export const join = (vm: unknown, params?: object) =>
  (vm as LiveViewModel).join(params);

export const leave = (vm: unknown) => (vm as LiveViewModel).leave();

export function liveEvent(eventName: string) {
  return function (
    _target: object,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = function (this: LiveViewModel, ...args: any[]) {
      const payload = originalMethod.apply(this, args);
      if (this.channel) {
        console.debug(`pushEvent: ${eventName}`, payload);
        this.channel.pushEvent(eventName, payload);
      } else {
        this.connection.emitError(this.topic, 'channel', {
          message: `Cannot send event "${eventName}": channel not initialized`,
        });
      }
      return payload;
    };
    return descriptor;
  };
}

const LIVE_OBSERVABLE_METADATA_KEY = Symbol('liveObservable');

interface LiveObservableMetadata {
  propertyKey: string | symbol;
  serverKey: string;
}

export function liveObservable(serverKey?: string) {
  return function (target: object, propertyKey: string | symbol) {
    // Store metadata for synchronization
    const metadata: LiveObservableMetadata = {
      propertyKey,
      serverKey: serverKey || propertyKey.toString(),
    };

    const existingMetadata: LiveObservableMetadata[] =
      Reflect.getMetadata(LIVE_OBSERVABLE_METADATA_KEY, target.constructor) ||
      [];
    existingMetadata.push(metadata);
    Reflect.defineMetadata(
      LIVE_OBSERVABLE_METADATA_KEY,
      existingMetadata,
      target.constructor
    );

    // Define a getter/setter for the property
    let value: any;
    Object.defineProperty(target, propertyKey, {
      get() {
        return value;
      },
      set(newValue) {
        value = newValue;
      },
      enumerable: true,
      configurable: true,
    });
  };
}

export function initializeLiveObservables(instance: any) {
  const observables: Record<string | symbol, any> = {};
  const metadata: LiveObservableMetadata[] =
    getLiveObservableProperties(instance);

  metadata.forEach(({ propertyKey }) => {
    observables[propertyKey] = observable;
  });

  makeObservable(instance, observables);
}

// Utility function to get all live observable properties for a class
export function getLiveObservableProperties(
  target: object
): LiveObservableMetadata[] {
  return (
    Reflect.getMetadata(LIVE_OBSERVABLE_METADATA_KEY, target.constructor) || []
  );
}

export function liveError() {
  return function (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    // Store the error handler on the prototype
    target.constructor.prototype.__liveErrorHandler = function (
      error: PhoenixSocketError
    ) {
      originalMethod.call(this, error);
    };

    return descriptor;
  };
}

export function action() {
  return function (
    _target: object,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: any[]) {
      return runInAction(() => originalMethod.apply(this, args));
    };

    return descriptor;
  };
}
