---
name: auth-developer
description: Expert in JWT authentication implementation for Fastify backends.
---
# Authentication Standards for Magma Backend

## Roles and Access
- Implement standard JWT authentication utilizing Fastify plugins (e.g. `@fastify/jwt`).
- Routes under `/api/v1/` are restricted based on user roles (`admin` vs `customer`). 
- User identity strings are placed inside the JWT payload `payload = { id: string, role: string }`.

## Password Hashing
- Under no circumstances should passwords be stored in plaintext. Use secure cryptographic hashing methods like `argon2` or `bcrypt` when inserting or matching credentials to the `Users` table.
- Verification of credentials must run entirely server-side validating against the hashed stored token.

## Token Expiration and Session
- Bearer tokens enforce a strict expiration of exactly **5 minutes**.
- Define explicitly standard Bearer string extraction from the `Authorization: Bearer <token>` headers.

## Route Protection Middleware
- Fastify custom middleware logic must validate the token layout, its expiration, and extract the payload injecting it into `request.user`.
- On validation failure, or missing headers, intercept the system flow and return an isolated Fastify Unauthorized error matching `ErrorResponse` standards (with a unique `trace_id`, `error_type: 'unauthorized'`, and `message`).
## Database Operations
- **Drizzle Sync Rule**: In this project, database transactions (`db.transaction`) must be synchronous due to `better-sqlite3`. Do not use `async` callbacks for transactions.
