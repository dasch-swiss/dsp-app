// eslint-disable-next-line import/no-extraneous-dependencies
import { defineConfig } from 'cypress';

export default defineConfig({
  projectId: 'n5b5id',
  e2e: {
    specPattern: 'cypress/**/**/**/*.cy.ts',
    excludeSpecPattern: ['*.spec.js', '*.spec.ts'],
    viewportHeight: 768,
    viewportWidth: 1024,
    supportFile: 'cypress/support/e2e.ts',
    baseUrl: 'http://localhost:4200',
    experimentalStudio: true,
    env: {
      apiUrl: 'http://0.0.0.0:3333',
      authToken:
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIwLjAuMC4wOjMzMzMiLCJzdWIiOiJodHRwOi8vcmRmaC5jaC91c2Vycy9yb290IiwiYXVkIjpbIktub3JhIiwiU2lwaSIsImh0dHA6Ly9sb2NhbGhvc3Q6MzM0MCJdLCJleHAiOjE3MzE1NzAwNzcsImlhdCI6MTcyODk3ODA3NywianRpIjoiX09hYm15ZWFSSTZ0NlpzczNRQ0djUSIsInNjb3BlIjoiYWRtaW4ifQ.xZKAXIKfVk2F35CO1luzi1fZnZgyWUM65m0FZ7h67RA',
    },
  },
});
