import { isNotNull } from '../utils/rxjs';
import { snakeToCamelCase } from '../utils/strings';
import type { AnnotationsMap } from 'mobx';
import {
  makeObservable as mobxMakeObservable,
  observable,
  runInAction,
} from 'mobx';
import { set } from 'lodash';
import { BehaviorSubject, filter, Subscription, switchMap } from 'rxjs';
import LiveChannel from './LiveChannel';
import type { LiveStateChange, LiveStatePatch } from './LiveChannel';
import type { PhoenixConnection } from './PhoenixConnection';
import { CustomEvent } from './LiveSocket';

export class LiveViewModel {
  [key: string]: unknown;
  protected repo: PhoenixConnection;
  protected _channel$ = new BehaviorSubject<LiveChannel | null>(null);
  private _subscriptions: Subscription[] = [];
  protected observableProps: Set<string> = new Set();
  protected topic: string;
  private subscriptions: Subscription[] = [];

  constructor(repo: PhoenixConnection, topic: string) {
    this.repo = repo;
    this.topic = topic;
    this.setupAutoUpdate();
    this.doOnConnect(() => this.onConnect());
    this.doOnChange((resp) => this.onChange(resp));
    this.doOnPatch((resp) => this.onPatch(resp));
  }

  makeObservable<T extends object, AdditionalKeys extends PropertyKey = never>(
    target: T,
    annotations?: AnnotationsMap<T, NoInfer<AdditionalKeys>>
  ) {
    if (annotations) {
      Object.entries(annotations).forEach(([key, value]) => {
        if (
          value === observable ||
          value === observable.deep ||
          value === observable.ref ||
          value === observable.shallow ||
          value === observable.struct
        ) {
          console.debug(`Tracking observable: ${key}`);
          this.observableProps.add(key);
        }
      });
    }

    mobxMakeObservable(target, annotations);
  }

  get channel() {
    return this._channel$.value!;
  }

  get channel$() {
    return this._channel$.asObservable().pipe(filter(isNotNull));
  }

  connect() {
    this.join();

    return () => {
      this.leave();
      this.onDisconnect();
    };
  }

  join() {
    this._subscriptions.push(
      this.repo.createChannel$(this.topic).subscribe((channel: LiveChannel) => {
        this._channel$.next(channel);
        console.debug('joining channel: ', this.channel.topic);
        this.channel.join();
      })
    );
  }

  leave() {
    if (this.channel) {
      console.debug('leaving channel: ', this.channel?.topic);
      this.channel?.leave();
    }
    this._subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }

  pushEvent(eventType: string, payload: object) {
    this.channel?.pushEvent(eventType, payload);
  }

  setValueFromPath<T = unknown>(path: string[], value: T): T | null {
    const topLevelProp = path[0];
    const restOfPath = path.slice(1);
    let finalValue;

    if (!topLevelProp) return null;

    runInAction(() => {
      if (restOfPath.length === 0) {
        // If it's a top-level property, just set it directly
        (this as Record<string, unknown>)[topLevelProp] = value;
        finalValue = value;
      } else {
        // For nested properties, create a new object
        const currentValue = (this as Record<string, unknown>)[topLevelProp];
        if (typeof currentValue === 'object') {
          const newValue = { ...currentValue };
          set(newValue, restOfPath, value);
          (this as Record<string, unknown>)[topLevelProp] = newValue;
          finalValue = newValue;
        }
      }
    });

    return finalValue || null;
  }

  subscribeToChannelEvent(
    eventType: string,
    callback: (resp: CustomEvent) => void
  ) {
    this._subscriptions.push(
      this.channel$
        .pipe(switchMap((channel) => channel.getEventsForType$(eventType)))
        .subscribe(callback)
    );
  }

  onConnect() {}
  onDisconnect() {}
  // eslint-disable-next-line
  onChange(change: LiveStateChange) {}
  // eslint-disable-next-line
  onPatch(patch: LiveStatePatch) {}

  doOnConnect(callback: () => void) {
    this.subscribeToChannelEvent('livestate-connect', callback);
  }

  doOnPatch(callback: (resp: LiveStatePatch) => void) {
    this.subscribeToChannelEvent('livestate-patch', (resp) =>
      callback(resp.detail as LiveStatePatch)
    );
  }

  doOnChange(callback: (resp: LiveStateChange) => void) {
    this.subscribeToChannelEvent('livestate-change', (resp) =>
      callback(resp.detail as LiveStateChange)
    );
  }

  addSubscription(subscription: Subscription) {
    this.subscriptions.push(subscription);
  }

  private setupAutoUpdate() {
    this.doOnChange((resp: LiveStateChange) => {
      this.updateObservableProps(this, resp.state);
    });
  }

  private updateObservableProps(
    target: Record<string, unknown>,
    source: Record<string, unknown>
  ) {
    Object.keys(source).forEach((serverKey) => {
      const key = snakeToCamelCase(serverKey);
      if (this.observableProps.has(key)) {
        const value = source[serverKey];
        console.debug(`Updating ${key} to`, value);

        runInAction(() => {
          target[key] = value;
        });
      }
    });
  }
}
