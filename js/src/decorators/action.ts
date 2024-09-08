import { runInAction } from 'mobx';

export function liveAction() {
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
