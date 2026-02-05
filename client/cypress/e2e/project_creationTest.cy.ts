/*
beforeEach(() => {
    cy.request('POST', 'http://localhost:5173/login', {
      email: 'test@fau.edu',
      password: 'TestPassword123',
    }).then((response) => {
      window.localStorage.setItem('token', response.body.token);
    });
  });
  */

 
  describe('Project Admin End-to-End Test', () => {
    beforeEach(() => {
      cy.intercept('GET', '/semesters').as('loadSemesters');
      cy.visit('/project-admin');
      cy.wait('@loadSemesters');
    });
  
    it('should create a new project group', () => {
      // Ensure the "Create" button is visible and clickable
      cy.intercept('POST', '/course').as('createProjectGroup');
      cy.get('[data-cy="add-project-group-button"]').should('be.visible').click();
  
      cy.get('input[placeholder="Please follow this format: SS24 / WS2425"]').type('SS24');
      cy.get('input[placeholder="Please Enter Project Group Name"]').type('New Project Group');
      cy.contains('Create').click();
  
      cy.wait('@createProjectGroup', { timeout: 2000 }).then((interception) => {
        expect(interception.response?.statusCode).to.eq(201); 
      });
  
      cy.get('[data-testid="message-banner"]').should('contain.text', 'Success');
    });
  
    it('should create a new project', () => {
      cy.intercept('POST', '/projects').as('createProject');
      cy.get('[data-cy="add-project-button"]').should('be.visible').click();
      cy.get('input[placeholder="Please Enter Project Group Name"]').type('New Project Group');
      cy.get('input[placeholder="Please Enter Project Name"]').type('New Project');
      cy.contains('Create').click();
  
      cy.wait('@createProject', { timeout: 2000 }).then((interception) => {
        expect(interception.response?.statusCode).to.eq(201); 
      });
  
      cy.get('[data-testid="message-banner"]').should('contain.text', 'Success');
    });
  });
  