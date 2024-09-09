import { IComputedValueOptions, computed as mobxComputed } from 'mobx';

export function computed<T>(options?: IComputedValueOptions<T>) {
  return function (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    if (descriptor.get) {
      const getter = descriptor.get;
      const computedValue = mobxComputed(getter, options);

      Object.defineProperty(target, propertyKey, {
        get() {
          return computedValue.get();
        },
        enumerable: true,
        configurable: true,
      });

      return;
    } else {
      throw new Error('computed decorator can only be used on getters');
    }
  };
}
