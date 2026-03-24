
# API Endpoints summary
## Endpoint list

### Users
#### Get all users 
    - Path: GET '/api/v1/users'
    - Description: Get all user.
    - Response: 
        - 200: OK
            - payload: #User[]
        - 401: Unauthorized
            - payload: Error (error_type: 'unauthorized')
        - 500: Internal Server Error
            - payload: Error (error_type: 'internal_server_error')

#### Get a user
    - Path: GET '/api/v1/users/{user-id}'
    - Description: Get a user.
    - Response:
        - 200: OK
            - payload: #User
        - 401: Unauthorized
            - payload: Error (error_type: 'unauthorized')
        - 500: Internal Server Error
            - payload: Error (error_type: 'internal_server_error')

#### Add user
    - Path: POST '/api/v1/users'
    - Description: Add a new user, All fields are mandatory.
    - Request body
        - username: string
        - password: string
        - role: string
        - printUser: string
        - nexudusUser: string
    - Response:
        - 200: OK
            - payload: #User
        - 401: Unauthorized
            - payload: Error (error_type: 'unauthorized')
        - 500: Internal Server Error
            - payload: Error (error_type: 'internal_server_error')

#### Delete user
    - Path: DELETE '/api/v1/users/{user-id}'
    - Description: Delete a user
    - Response:
        - 202: Accepted
        - 401: Unauthorized
            - payload: Error (error_type: 'unauthorized')
        - 500: Internal Server Error
            - payload: Error (error_type: 'internal_server_error')

#### Update a user
    - Path: PATCH '/api/v1/users/{user-id}'
    - Description: Update a user. The fields are optional and if not provided will not be updated.
    - Request body
        - printUser: string
        - nexudusUser: string
        - role: string
        - password: string
    - Response:
        - 200: OK
            - payload: #User
        - 401: Unauthorized
            - payload: Error (error_type: 'unauthorized')
        - 500: Internal Server Error
            - payload: Error (error_type: 'internal_server_error')  

## Rest Objects
### User
    - printUser
    - nexudusUser
    - _links
        - self: string
        - copies: string
