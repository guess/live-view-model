export function onJoin() {
  return function (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    target.constructor.prototype.__onJoinHandler = originalMethod;
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
    target.constructor.prototype.__onLeaveHandler = originalMethod;
    return descriptor;
  };
}
