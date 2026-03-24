# Backend application

## Description
The backend application is a REST API that will manage copy usage for the members of a coworking space.

## Features
- monthly summary of user copys by category (A4_COLOR, A4_BW, A3_COLOR, A3_BW, SRA3_COLOR, SRA3_BW)
- Store in a db monthly summary of user copys by category (A4_COLOR, A4_BW, A3_COLOR, A3_BW, SRA3_COLOR, SRA3_BW)
- map printer user with nexudus user
- Push copy monthly billings to nexudus

## Architecture
### Key Technologies
- NPM
- Node + TypeScript
- Fastify + OpenAPI
- Drizzle + SQLite
- Nexudus API client
- Playwright
- JWT for authentication

### Authentication strategy
- Users authenticate via `username` and `password`. Passwords must be hashed using a strong algorithm (e.g. `argon2` or `bcrypt`) before persisting.
- The authentication generates a 5-minute bounded JWT Bearer session token.
- Roles (`admin`, `customer`) govern permissions and route access.


### Folder Structure
    root:
    - core/: Root foldew for backend application
        - db/: Database schema and migrations
        - nexudus/: Nexudus API client
        - playwright/: Playwright scripts
        - routes/: API routes
        - services/: Business logic
        - config/: Configuration
        - middleware/: Middleware


### Layering
- routes: API routes
- services: Business logic
- repositories: Data access layer

### Domain model
- User
    - id: string, format: uuid
    - printUser: string
    - nexudusUser: string
    - copies: Copies[]
    - invoices: Invoice[]

- Copies
    - id: string, format: uuid
    - userId: string, format: uuid
    - datetime: string, format: date
    - count: object
        - a4-color: number
        - a4-bw: number
        - a3-color: number
        - a3-bw: number
        - sra3-color: number
        - sra3-bw: number
    - total: object
        - a4-color: number
        - a4-bw: number
        - a3-color: number
        - a3-bw: number
        - sra3-color: number
        - sra3-bw: number
    - total: number
    - from: string, format: date
    - to: string, format: date

- Invoice
    - id: string, format: uuid
    - userId: string, format: uuid
    - from: string, format: date
    - to: string, format: date
    - total: number
    - items: InvoiceItems[]

- InvoiceItems
    - id: string, format: uuid
    - invoiceId: string, format: uuid
    - concept: string
    - quantity: number
    - unitPrice: number
    - total: number 


