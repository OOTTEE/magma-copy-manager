# Backend application

## Description
The backend application is a REST API that will manage copy usage for the members of a coworking space.

## Features
- monthly summary of user copys by category (A4, A3, SRA3, Color, B&W)
- Store in a db monthly summary of user copys by category (A4, A3, SRA3, Color, B&W)
- map printer user with nexudus user
- Push copy monthly billings to nexudus

## Stack
- NPM
- Node + TypeScript
- Fastify + OpenAPI
- Drizzle + SQLite
- Nexudus API client
- Playwright


## Architecture

    root:
    - core/: Root foldew for backend application
        - db/: Database schema and migrations
        - nexudus/: Nexudus API client
        - playwright/: Playwright scripts
        - routes/: API routes
        - services/: Business logic
        - utils/: Utility functions
