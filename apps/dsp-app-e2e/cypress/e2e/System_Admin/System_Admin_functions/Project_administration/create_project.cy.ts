describe('create new project', () => {
    it('should create a new project', () => {
        cy.visit('/');
        cy.get('.create-project-button button').click();
        cy.get("#mat-input-0").type("0123");
        cy.get("#mat-input-1").type("test");
        cy.get("#mat-input-2").type("Test Project");
        cy.get("#mat-input-3").type("this is a test project");
        cy.get("#mat-mdc-chip-list-input-0").type("project");
        cy.get("#mat-mdc-chip-list-input-0").type("{enter}");
        cy.get("#mat-mdc-chip-list-input-0").type("test");
        cy.get("#mat-mdc-chip-list-input-0").type("{enter}");
        cy.get("div.app-content span.mdc-button__label > span").click();
        cy.get('.project-longname').should('contain', 'Test Project');
    });
});
