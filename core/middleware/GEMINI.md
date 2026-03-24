
# Middleware
Here is the list of middleware that will be used in the application:

## Pino pretty login
- Use Pino to make pretty login in dev run.
- Add request id for print lines that identify the request.
- Add request trace-id for error request trace. the trace-id will be the same as the trace_id in the error response.
- configurable via .env file the general log system level (INFO, DEBUG, ERROR, WARN, TRACE)

