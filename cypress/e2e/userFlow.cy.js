describe('Brugerflow: Login og rapporthåndtering', () => {
    beforeEach(() => {
      // Inden hver test: Log ind
      cy.login('test@mail.com', 'testpassword!');
    });
  
    it('Opretter en rapport', () => {
      // Efter login bør vi være på siden, hvor vi kan oprette rapporter
  
      // Indtast i tekstområdet for rapportindhold
      cy.get('textarea[id="content"]').type('Dette er en test rapport', { delay: 100 });
  
      // Klik på 'Opret Rapport' knappen
      cy.contains('Opret Rapport').click();
  
      // Bekræft, at rapporten vises i rapportlisten
      cy.contains('Dette er en test rapport').should('exist');
    });
  
    it('Opdaterer en rapport', () => {
      // Find den rapport, vi lige har oprettet
      cy.contains('Dette er en test rapport')
        .parents('li') // Naviger op til <li> elementet
        .within(() => {
          // Klik på 'Rediger' knappen
          cy.get('button').contains('Rediger').click();
        });
  
      // Vent på, at modalen vises
      cy.contains('Rediger Rapport').should('be.visible');
  
      // I redigeringsmodalen, opdater indholdet
      cy.get('textarea[placeholder="Rediger rapportens indhold her..."]').clear().type('Dette er en opdateret rapport', { delay: 100 });
  
      // Klik på 'Gem' knappen
      cy.contains('Gem').click();
  
      // Bekræft, at rapportindholdet er opdateret
      cy.contains('Dette er en opdateret rapport').should('exist');
    });
  
    it('Opretter en kommentar til en rapport', () => {
      // Find den rapport, vi vil kommentere på
      cy.contains('Dette er en opdateret rapport')
        .parents('li')
        .within(() => {
          // Indtast i tekstområdet for ny kommentar
          cy.get('textarea[placeholder="Skriv en kommentar..."]').type('Dette er en test kommentar', { delay: 100 });
  
          // Klik på 'Tilføj kommentar' knappen
          cy.contains('Tilføj kommentar').click();
        });
  
      // Bekræft, at kommentaren vises under rapporten
      cy.contains('Dette er en test kommentar').should('exist');
    });
  
    it('Opdaterer en kommentar til en rapport', () => {
      // Find den kommentar, vi lige har oprettet
      cy.contains('Dette er en test kommentar')
        .parents('.comment') // Naviger op til kommentarens container
        .within(() => {
          // Klik på 'Rediger' knappen for kommentaren
          cy.get('button').contains('Rediger').click();
        });
  
      // Vent på, at modalen vises
      cy.contains('Rediger Kommentar').should('be.visible');
  
      // I redigeringsmodalen, opdater kommentaren
      cy.get('textarea[placeholder="Rediger kommentarens indhold her..."]').clear().type('Dette er en opdateret kommentar', { delay: 100 });
  
      // Klik på 'Gem' knappen
      cy.contains('Gem').click();
  
      // Bekræft, at kommentarindholdet er opdateret
      cy.contains('Dette er en opdateret kommentar').should('exist');
    });
  
    it('Opdaterer rapporttypen', () => {
        // Åbn redigeringsmodalen for rapporten
        cy.contains('Dette er en opdateret rapport')
          .parents('li')
          .within(() => {
            // Klik på 'Rediger' knappen for rapporten (brug en mere specifik selector)
            cy.get('button')
              .filter('.text-gray-600')
              .contains('Rediger')
              .click();
          });
      
        // Vent på, at modalen vises
        cy.contains('Rediger Rapport').should('be.visible');
      
        // I modalen, vælg en ny rapporttype
        cy.get('select').select('UBD'); // Erstat 'UBD' med den ønskede rapporttype
      
        // Klik på 'Gem' knappen
        cy.contains('Gem').click();
      
        // Bekræft, at rapporttypen er opdateret
        cy.contains('Dette er en opdateret rapport')
          .parents('li')
          .within(() => {
            cy.contains('UBD').should('exist');
          });
      });      
  });
  