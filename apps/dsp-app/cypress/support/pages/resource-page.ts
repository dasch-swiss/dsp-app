export class ResourcePage {
  visit(id: string) {
    cy.visit(`/project/00FF/ontology/00FF/images/${id}`);
  }
}
