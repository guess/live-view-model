export function onJoin() {
  return function (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    target.constructor.prototype.__onJoinHandler = function () {
      originalMethod.call(this);
    };
    return descriptor;
  };
}

export function onLeave() {
  return function (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    target.constructor.prototype.__onLeaveHandler = function () {
      originalMethod.call(this);
    };
    return descriptor;
  };
}
