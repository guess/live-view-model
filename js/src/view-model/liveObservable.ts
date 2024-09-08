import { makeObservable, observable } from 'mobx';
import 'reflect-metadata';

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
