
# Middleware
Here is the list of middleware that will be used in the application:

## Application Logger
- Use Pino to make pretty login in dev run.
- Add request id for print lines that identify the request.
- Add request trace_id for error request trace. the trace_id will be the same as the trace_id in the error response.
- configurable via .env file the general log system level (INFO, DEBUG, ERROR, WARN, TRACE)


## Application Auth 
- Route protection implementing standard JWT Bearer validation (`Authorization: Bearer <token>`).
- Validates the 5-minute token expiration boundary.
- All endpoints under `/api/v1/*` are protected by default except the authentication routes (like `/api/v1/auth/login`).
- Role-based middleware verifying if `admin` or `customer` is allowed based on the route semantics.
- Rejects requests returning a standardized 401 Unauthorized ErrorResponse tracking the `trace_id`.
