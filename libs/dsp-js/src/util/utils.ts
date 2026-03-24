/**
 * @category Internal
 */
export namespace CustomConverterUtils {
  export const isString = (maybeString: any): boolean => {
    return typeof maybeString === 'string';
  };
}
