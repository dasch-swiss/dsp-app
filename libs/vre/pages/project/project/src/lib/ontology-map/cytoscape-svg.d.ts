/** The cytoscape-svg extension: registers `cy.svg()`, the graph drawn as SVG markup. */
declare module 'cytoscape-svg' {
  const register: (cytoscape: unknown) => void;
  export default register;
}
