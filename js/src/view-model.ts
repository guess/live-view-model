import 'reflect-metadata';
import { makeObservable, observable, runInAction } from 'mobx';
import { BehaviorSubject, map, Subscription } from 'rxjs';
import { LiveChannel } from './channel.js';
import { LiveConnection } from './connect.js';
import { LiveError } from './events.js';
import { PhoenixSocketError } from './phoenix.js';
import {
  LiveState,
  LiveStateChange,
  LiveStateData,
  LiveStatePatch,
  patch,
} from './state.js';

export type LiveViewModel = {
  topic: string;
  join: (params?: object) => void;
  leave: () => void;
  get channel(): LiveChannel | null;
  connection: LiveConnection;
  liveState: LiveState;
};

export function liveViewModel(topic: string) {
  // eslint-disable-next-line
  return function <T extends { new (...args: any[]): object }>(constructor: T) {
    return class extends constructor {
      topic = topic;
      connection: LiveConnection;
      liveState: LiveState;

      _channel$ = new BehaviorSubject<LiveChannel | null>(null);
      _subscriptions: Subscription[] = [];

      // eslint-disable-next-line
      constructor(...args: any[]) {
        super(...args);

        // Find the LiveConnection argument
        const connection = args.find((arg) => arg instanceof LiveConnection);

        if (!connection) {
          throw new Error('LiveConnection not provided to the constructor');
        }

        this.connection = connection!;
        this.liveState = new LiveState();

        // State patches
        subscribeToPatchState(this).forEach((subscription) =>
          this.addSubscription(subscription)
        );

        // Error subscription
        subscribeToErrors(this).forEach((subscription) =>
          this.addSubscription(subscription)
        );
      }

      get subscriptions() {
        return this._subscriptions || [];
      }

      public join(params?: object) {
        this.addSubscription(
          this.connection.createChannel$(topic, params).subscribe({
            next: (channel) => {
              this._channel$.next(channel);
              channel.join();
            },
          })
        );
      }

      public leave() {
        if (this.channel) {
          this.channel.leave();
        }
        this._subscriptions.forEach((subscription) =>
          subscription.unsubscribe()
        );
        this._subscriptions = [];
      }

      get channel(): LiveChannel | null {
        return this._channel$.getValue();
      }

      addSubscription(subscription: Subscription) {
        this._subscriptions.push(subscription);
      }
    };
  };
}

const subscribeToErrors = (vm: LiveViewModel): Subscription[] => {
  const subscription = vm.connection.getErrorStream$(vm.topic).subscribe({
    next: (error: LiveError) => {
      if (vm.constructor.prototype.__liveErrorHandler) {
        vm.constructor.prototype.__liveErrorHandler.call(this, error);
      }
    },
  });

  return [subscription];
};

const subscribeToPatchState = (vm: LiveViewModel): Subscription[] => {
  const subscriptions = [];

  const emitOrRefresh = (state: LiveStateData | null) => {
    if (state) {
      vm.connection.emitEvent(vm.topic, 'lvm-change', state);
    } else {
      vm.channel?.pushEvent('lvm_refresh');
    }
  };

  subscriptions.push(
    vm.connection
      .getEventStream$(vm.topic, 'lvm-patch')
      .pipe(
        map((event) => event as LiveStatePatch),
        map((event) => patch(vm.liveState.data, event))
      )
      .subscribe((state) => emitOrRefresh(state))
  );

  // State changes
  subscriptions.push(
    vm.connection
      .getEventStream$(vm.topic, 'lvm-change')
      .pipe(map((event) => event as LiveStateChange))
      .subscribe((event) => vm.liveState.change(event))
  );

  return subscriptions;
};

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
