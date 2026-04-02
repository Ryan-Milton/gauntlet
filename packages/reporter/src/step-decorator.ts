export function step(name?: string) {
  return function (_target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value as (...args: unknown[]) => Promise<unknown>;
    const stepName = name ?? propertyKey;

    descriptor.value = async function (this: unknown, ...args: unknown[]) {
      console.log(`[Step] ${stepName}`);
      try {
        const result = await originalMethod.apply(this, args);
        console.log(`[Step] ${stepName} — passed`);
        return result;
      } catch (error) {
        console.error(`[Step] ${stepName} — failed`);
        throw error;
      }
    };

    return descriptor;
  };
}
