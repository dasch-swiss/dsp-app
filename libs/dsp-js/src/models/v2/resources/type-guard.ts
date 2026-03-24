/**
 * @category Internal
 */
export namespace TypeGuard {
  // https://dev.to/krumpet/generic-type-guard-in-typescript-258l
  export type Constructor<T> = { new (...args: any[]): T };

  /**
   * Checks if the given object is an instance of the indicated class.
   *
   * @param o the object to be checked.
   * @param className the name of the class to check for.
   */
  export const typeGuard = <T>(o: any, className: Constructor<T>): o is T => {
    return o instanceof className;
  };
}
