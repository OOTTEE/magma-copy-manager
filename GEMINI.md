# Project: Magma copy counter

## Depscription
**Magma** is a project to deploy a web application (API + Web app) that will help manage the internal operations of a coworking space.

## Features description
- Scrap the copies count for print users from the print server
- Store in a db a copy history in records (A4_BW, A4_COLOR, A3_BW, A3_COLOR)
- Create a monthly summary of user copys by category (A4_BW, A4_COLOR, A3_BW, A3_COLOR, SRA3_BW, SRA3_COLOR)
- Create a monthly invoice preview for each user with the total cost of their copies
- Push the monthly invoice to nexudus & persist

## Tech stack
The aplication will be built using the following technologies:

### Backend
- NPM
- Node + TypeScript
- Fastify + OpenAPI
- Drizzle + SQLite
- Nexudus API client

### Frontend
- NPM
- React + TypeScript
- Vite
- TailwindCSS

## Development Conventions
- Follow standard conventions for the language and framework chosen.
- Maintain a clean Git history.
- For backend use `endpoint-developer` role.

## Domain / Business Logic 
- Only will existe a single admin user, this user will be created automatically when the application is deployed.
- The admin user will have access to all the features of the application.
- The admin user will be able to create, update, delete and list all the users.
- The system will have two types of users: "admin" and "customer"
- each customer will have a "printUser" and a "nexudusUser" as properties. "printUser" is the user that will be used to authenticate with the print server. "nexudusUser" is the user that will be used to authenticate with the nexudus API.
