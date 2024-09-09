import 'reflect-metadata';
import { runInAction } from 'mobx';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { LiveChannel } from './channel.js';
import { LiveConnection } from './connect.js';
import {
  errorStream$,
  eventStream$,
  LiveError,
  LiveEventType,
} from './events.js';
import { LiveState } from './state.js';
import {
  getLiveObservableProperties,
  initializeLiveObservables,
} from './decorators/observable.js';
import { logger } from './utils/logger.js';

export type LiveViewModel = {
  topic: string;
  join: (params?: object) => void;
  leave: () => void;
  get channel(): LiveChannel | null;
  connection: LiveConnection;
  liveState: LiveState;
  events$(event: LiveEventType): Observable<object>;
  get errors$(): Observable<LiveError>;
  _subscriptions: Subscription[];
  _errorSubscription: Subscription | null;
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
        this.liveState = new LiveState(this.connection.stream, topic);
        maybeSubscribeToErrors(this);
        initializeLiveObservables(this);
      }

      events$(event: LiveEventType): Observable<object> {
        return eventStream$(this.connection.stream, topic, event);
      }

      get errors$(): Observable<LiveError> {
        return errorStream$(this.connection.stream, topic);
      }

      get subscriptions() {
        return this._subscriptions || [];
      }

      public join(params?: object) {
        this.liveState.start();

        subscribeToLiveObservableChanges(this).forEach((subscription) =>
          addSubscription(this, subscription)
        );

        // Refresh if we get out of sync
        subscribeToRefresh(this).forEach((subscription) =>
          addSubscription(this, subscription)
        );

        // Error subscription
        maybeSubscribeToErrors(this);

        addSubscription(
          this,
          this.connection.createChannel$(topic, params).subscribe({
            next: (channel) => {
              this._channel$.next(channel);
              channel.join();
            },
          })
        );
      }

      public leave() {
        this.channel?.leave();
        this.liveState.dispose();
        diposeSubscriptions(this);
      }

      get channel(): LiveChannel | null {
        return this._channel$.getValue();
      }
    };
  };
}

const addSubscription = (vm: LiveViewModel, subscription: Subscription) => {
  vm._subscriptions.push(subscription);
};

const diposeSubscriptions = (vm: LiveViewModel) => {
  vm._errorSubscription?.unsubscribe();
  vm._subscriptions.forEach((subscription) => subscription.unsubscribe());

  vm._errorSubscription = null;
  vm._subscriptions = [];
};

const maybeSubscribeToErrors = (vm: LiveViewModel) => {
  if (!vm._errorSubscription) {
    vm._errorSubscription = subscribeToErrors(vm);
  }
};

const subscribeToLiveObservableChanges = (
  vm: LiveViewModel
): Subscription[] => {
  const liveObservableProps = getLiveObservableProperties(vm);

  const subscription = vm.liveState.state$.subscribe((payload) => {
    runInAction(() => {
      for (const prop of liveObservableProps) {
        const serverKey = prop.serverKey || prop.propertyKey;
        if (serverKey in payload) {
          logger.log(
            `updating ${prop.propertyKey.toString()} to:`,
            payload[serverKey.toString()]
          );
          // eslint-disable-next-line
          (vm as any)[prop.propertyKey] = payload[serverKey.toString()];
        }
      }
    });
  });

  return [subscription];
};

const subscribeToRefresh = (vm: LiveViewModel): Subscription[] => {
  const subscription = vm.events$('lvm-refresh').subscribe(() => {
    vm.channel?.pushEvent('lvm_refresh');
  });

  return [subscription];
};

const subscribeToErrors = (vm: LiveViewModel): Subscription => {
  return vm.errors$.subscribe({
    next: (error: LiveError) => {
      if (vm.constructor.prototype.__liveErrorHandler) {
        vm.constructor.prototype.__liveErrorHandler.call(this, error);
      }
    },
  });
};

export const join = (vm: unknown, params?: object) =>
  (vm as LiveViewModel).join(params);

export const leave = (vm: unknown) => (vm as LiveViewModel).leave();

export { liveError } from './decorators/error.js';
export { liveEvent } from './decorators/event.js';
export { action } from './decorators/action.js';
export { computed } from './decorators/computed.js';
export { liveObservable, localObservable } from './decorators/observable.js';
