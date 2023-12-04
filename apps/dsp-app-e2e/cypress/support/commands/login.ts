import { User } from "../../models/user-profiles";

Cypress.Commands.add('login', (user: User) => {
    cy.session(user, () => {

        cy.request({
            method: 'POST',
            url: `${Cypress.env("apiUrl")}/v2/authentication`,
            body: {
                username: user.username,
                password: user.password
            }
        }).then((response) => {
            const session = {
                id: 123456789,
                user: {
                    name: "root",
                    jwt: response.body.token,
                    lang: "de",
                    sysAdmin: true,
                    projectAdmin: []
                }

            };

            localStorage.setItem('session', JSON.stringify(session));
            localStorage.setItem('cookieBanner', 'false');
            cy.visit('/');
            cy.get('rn-banner').shadow().find('.rn-close-btn').click();

            cy.get('button.login-button').click();
            cy.get("[formcontrolname='username']").type(user.username);
            cy.get("[formcontrolname='password']").type(user.password);
            cy.get('.login-form button[type="submit"]').click().wait(3000);
        });
    },
    {
        validate: () => {
            const session = localStorage.getItem('session');
            expect(session).to.exist;
        }
    });
});
