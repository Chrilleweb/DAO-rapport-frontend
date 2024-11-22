Cypress.Commands.add("login", (email, password) => {
    cy.visit("http://localhost:5173/login");
    cy.get('input[type="email"]').type(email, { delay: 100 });
    cy.get('input[type="password"]').type(password);
    cy.get('button[type="submit"]').click();
    cy.contains("Samlet rapport"); // Tjek for en tekst, der bekræfter login
  });
