describe('Settings Page End-to-End Test', () => {

    beforeEach(() => {
      cy.request({
        method: 'POST',
        url: 'http://localhost:3000/session', 
        body: {
          email: 'test@fau.edu',
          password: 'TestPassword123',
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        window.localStorage.setItem('token', response.body.token);
      });
    });      
  
    it('should navigate to /dashboard and then to /settings', () => {
      cy.visit('/dashboard');
      cy.visit('/settings');
    });
  
    it('should edit Email, Password, and add GitHub Username in Account Info', () => {
      
      cy.visit('/settings');
      cy.url().should('include', '/settings');
  
      cy.get('.DialogTrigger').eq(0).should('be.visible').click();
  
     
      cy.get('.NewEmail-inputBox').clear();
      cy.get('.NewEmail-inputBox').type('newtestemail@fau.edu');
      cy.get('.create').contains('Change').click();
      cy.get('[data-testid="message-banner"]').should('contain.text', 'Email changed successfully!');
  
      // Edit password
      cy.get('.DialogTrigger').eq(1).should('be.visible').click();
      cy.get('.NewEmail-inputBox').clear();
      cy.get('.NewEmail-inputBox').type('NewPassword123!');
      cy.get('.create').contains('Change').click();
      cy.get('[data-testid="message-banner"]').should('contain.text', 'Password changed successfully!');
  
      // Add GitHub Username
      cy.get('.DialogTrigger').eq(2).should('be.visible').click();
      cy.get('.NewGitHubUsername-inputBox').clear();
      cy.get('.NewGitHubUsername-inputBox').type('newGitHubUsername');
      cy.get('.create').contains('Save').click();
      cy.get('[data-testid="message-banner"]').should('contain.text', 'GitHub Username added successfully!');
    });
  
    it('should select a project group, choose a project, and join it', () => {
        cy.visit('/settings');
        cy.get('.SelectTrigger').should('exist').click();
        cy.get('.SelectItem', { timeout: 1000 }).should('exist'); 
        cy.get('.SelectItem').contains('AMOS24').click();      
        cy.get('.ProjectItem3').should('exist');      
        cy.get('.ProjectItem3 .Add').first().click();
        
        cy.get('.ProjAdmin-inputBox').clear();
        cy.get('.ProjAdmin-inputBox').type('Project Manager');
        cy.contains('Join').click();
        

        cy.get('[data-testid="message-banner"]').should('contain.text', 'Successfully joined the project!');
    });
  
  });
  