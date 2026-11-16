// jsonld ships no type declarations; this declares the one function dsp-js calls.
declare module 'jsonld/dist/jsonld.js' {
  const jsonld: {
    compact(input: unknown, context: object): Promise<object>;
  };
  export default jsonld;
}
