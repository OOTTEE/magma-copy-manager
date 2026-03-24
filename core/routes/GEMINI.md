
# API Endpoints summary
## Endpoint list

### Users
#### Get all users 
    - Path: GET '/api/v1/users'
    - Description: Get all user
    - Response: 
        - 200: OK
            - payload: UserResponse[]
        - 401: Unauthorized
            - payload: ErrorResponse (error_type: 'unauthorized')
        - 500: Internal Server Error
            - payload: ErrorResponse (error_type: 'internal_server_error')

#### Get a user
    - Path: GET '/api/v1/users/{user-id}'
    - Description: Get a user
    - Response:
        - 200: OK
            - payload: UserResponse
        - 401: Unauthorized
            - payload: ErrorResponse (error_type: 'unauthorized')
        - 500: Internal Server Error
            - payload: ErrorResponse (error_type: 'internal_server_error')

#### Add user
    - Path: POST '/api/v1/users'
    - Description: Add a new user
    - Request body
        - printUser: string
        - nexudusUser: string
    - Response:
        - 200: OK
            - payload: UserResponse
        - 401: Unauthorized
            - payload: ErrorResponse (error_type: 'unauthorized')
        - 500: Internal Server Error
            - payload: ErrorResponse (error_type: 'internal_server_error')

#### Delete user
    - Path: DELETE '/api/v1/users/{user-id}'
    - Description: Delete a user
    - Response:
        - 200: OK
            - payload: UserResponse
        - 401: Unauthorized
            - payload: ErrorResponse (error_type: 'unauthorized')
        - 500: Internal Server Error
            - payload: ErrorResponse (error_type: 'internal_server_error')

#### Update a user
    - Path: PUT '/api/v1/users/{user-id}'
    - Description: Update a user
    - Request body
        - printUser: string
        - nexudusUser: string
    - Response:
        - 200: OK
            - payload: UserResponse
        - 401: Unauthorized
            - payload: ErrorResponse (error_type: 'unauthorized')
        - 500: Internal Server Error
            - payload: ErrorResponse (error_type: 'internal_server_error')  

### Copies
#### Get all copies for a user
    - Path: GET '/api/v1/users/{user-id}/copies'
    - Description: Get all copies for a user, the from and to are optional and if not provided will get all copies for the user. The from and to are in ISO 8601 format (YYYY-MM-DD).
    - Query parameters
        - from: string, optional
        - to: string, optional
    - Response:
        - 200: OK
            - payload: CopiesResponse[]
        - 401: Unauthorized
            - payload: ErrorResponse (error_type: 'unauthorized')
        - 500: Internal Server Error
            - payload: ErrorResponse (error_type: 'internal_server_error')

#### Update copies for a user
    - Path: PUT '/api/v1/users/{user-id}/copies'
    - Description: Update copies for a user
    - Request body
        - from: string
        - to: string
        - a4-copies: number
        - a3-copies: number
        - sra3-copies: number
        - color-copies: number
        - bw-copies: number
    - Response:
        - 200: OK
            - payload: CopiesResponse
        - 401: Unauthorized
            - payload: ErrorResponse (error_type: 'unauthorized')
        - 500: Internal Server Error
            - payload: ErrorResponse (error_type: 'internal_server_error')
#### Add copies for a user
    - Path: POST '/api/v1/users/{user-id}/copies'
    - Description: Add copies for a user
    - Request body
        - from: string
        - to: string
        - a4-copies: number
        - a3-copies: number
        - sra3-copies: number
        - color-copies: number
        - bw-copies: number
    - Response:
        - 200: OK
            - payload: CopiesResponse
        - 401: Unauthorized
            - payload: ErrorResponse (error_type: 'unauthorized')
        - 500: Internal Server Error
            - payload: ErrorResponse (error_type: 'internal_server_error')  

#### Delete copies for a user
    - Path: DELETE '/api/v1/users/{user-id}/copies'
    - Description: Delete copies for a user
    - Response:
        - 200: OK
            - payload: CopiesResponse
        - 401: Unauthorized
            - payload: ErrorResponse (error_type: 'unauthorized')
        - 500: Internal Server Error
            - payload: ErrorResponse (error_type: 'internal_server_error')  


## Rest Objects

### UserResponse
    - printUser
    - nexudusUser
    - _links
        - self: string
        - copies: string

### CopiesResponse
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
    - _links
        - self: string
        - user: string

### InvoiceResponse
    - from: string, format: date
    - to: string, format: date
    - total: number
    - items: InvoiceItemsResponse[]
    - _links
        - self: string
        - user: string
        - items: string

### InvoiceItemsResponse
    - concept: string
    - quantity: number
    - unitPrice: number
    - total: number
    - _links
        - self: string
        - invoice: string

### ErrorResponse
    - track_id: string
    - error_type: string
    - message: string
