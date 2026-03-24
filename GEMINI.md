# Project: Magma copy counter

## Depscription
**Magma** is a project to deploy a web application (API + Web app) that will help manage the internal operations of a coworking space.

## Features description
- Show a monthly summary of user copys by category (A4, A3, SRA3, Color, B&W)
- Automaticly charge users for their copys at the end of the month in to `Nexudus`


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


## Building and Running
As this project is in its initial setup phase, no build or execution commands are currently defined.
- [ ] TODO: Define Build system NPM
- [ ] TODO: Create project structure
- [ ] TODO: Create backend structure
- [ ] TODO: Create frontend structure


## Development Conventions
- Follow standard conventions for the language and framework chosen.
- Maintain a clean Git history.
- For backend use `endpoint-developer` role.

## Domain / Business Logic 
- Only will existe a single admin user, this user will be created automatically when the application is deployed.
- The admin user will have access to all the features of the application.
- The admin user will be able to create, update, delete and list all the users.
- The system will have two types of users: "admin" and "coworker"
- each coworker will have a "printUser" and a "nexudusUser" as properties. "printUser" is the user that will be used to authenticate with the print server. "nexudusUser" is the user that will be used to authenticate with the nexudus API.
- each coworker will store a row per month of copys made by him. 


## Domain model

- The system has 'users' and 'copies' 
- A 'user' can have multiple 'copies'
- A 'copy' is a record of a user's copy activity.
- A 'copy' has a 'from' and 'to' date, a 'userId', and a 'copies' property.
- A 'copy' can have multiple 'copies' of different types (A4, A3, SRA3, Color, B&W)
