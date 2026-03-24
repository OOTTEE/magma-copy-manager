
# API Endpoints summary for login endpoints
## Endpoint list
### Authentication

#### Login
    - Path: POST '/api/v1/auth/login'
    - Description: Authenticate user and issue a 5-minute session token.
    - Request body
        - username: string
        - password: string
    - Response:
        - 200: OK
            - payload: { token: string }
        - 401: Unauthorized
            - payload: Error (error_type: 'unauthorized')
        - 500: Internal Server Error
            - payload: Error (error_type: 'internal_server_error')

