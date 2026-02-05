
describe('User Authentication Test', () => {
    const email = 'test@fau.edu';
    const password = 'TestPassword123';
    const name = 'Test_User';
  

    it('should register a new account', () => {
      cy.visit('/login'); 
  
      // Switch to Registration form
      cy.contains('Sign Up').click();
  

      cy.get('input[placeholder="Please enter your name"]').type(name);
      cy.get('input[placeholder="Please enter your email address"]').type(email);
      cy.get('input[placeholder="Please enter your password"]').type(password);
  

      cy.contains('Sign Up').click();
  

      cy.get('[data-testid="message-banner"]').should('contain', 'Success!'); 
  
      // Verify that the user is redirected to the dashboard or the login page
      cy.url().should('include', '/dashboard'); 
    });
  

    it('should log in with the newly registered account', () => {
      cy.visit('/login'); 
  

      cy.get('input[placeholder="Please enter your email address"]').type(email);
      cy.get('input[placeholder="Please enter your password"]').type(password);
  

      cy.get('.submit').contains('Login').click();

  
      cy.url().should('include', '/dashboard');
    });
  });
  