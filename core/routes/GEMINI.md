
# API Endpoints summary
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

### Copies
#### Get all copies for a user
    - Path: GET '/api/v1/users/{user-id}/copies'
    - Description: Get all copies for a user, the from and to are optional and if not provided will get all copies for the user. The from and to are in ISO 8601 format (YYYY-MM-DD).
    - Query parameters
        - from: string, optional
        - to: string, optional
    - Response:
        - 200: OK
            - payload: #Copies[]
        - 401: Unauthorized
            - payload: Error (error_type: 'unauthorized')
        - 500: Internal Server Error
            - payload: Error (error_type: 'internal_server_error')

#### Add copies for a user
    - Path: PUT '/api/v1/users/{user-id}/copies'
    - Description: Add copies for a user, Required 'admin' role. All fields are mandatory.
    - Request body: #Copies
    - Response:
        - 200: OK
            - payload: #Copies
        - 401: Unauthorized
            - payload: Error (error_type: 'unauthorized')
        - 500: Internal Server Error
            - payload: Error (error_type: 'internal_server_error')

#### Update copies for a user
    - Path: PATCH '/api/v1/users/{user-id}/copies/{copy-id}'
    - Description: Update copies for a user, Required 'admin' role. The fields are optional and if not provided will not be updated.
    - Request body: #Copies
    - Response:
        - 200: OK
            - payload: #Copies
        - 401: Unauthorized
            - payload: Error (error_type: 'unauthorized')
        - 500: Internal Server Error
            - payload: Error (error_type: 'internal_server_error')

#### Delete copies for a user
    - Path: DELETE '/api/v1/users/{user-id}/copies/{copy-id}'
    - Description: Delete copies for a user, Required 'admin' role. 
    - Response:
        - 202: Accepted
        - 401: Unauthorized
            - payload: Error (error_type: 'unauthorized')
        - 500: Internal Server Error
            - payload: Error (error_type: 'internal_server_error')  

### Invoices

#### Get all invoices for a user
    - Path: GET '/api/v1/users/{user-id}/invoices'
    - Description: Get all invoices for a user, the from and to are optional and if not provided will get all invoices for the user. The from and to are in ISO 8601 format (YYYY-MM-DD).
    - Query parameters
        - from: string, optional
        - to: string, optional
    - Response:
        - 200: OK
            - payload: #Invoice[]
        - 401: Unauthorized
            - payload: Error (error_type: 'unauthorized')
        - 500: Internal Server Error
            - payload: Error (error_type: 'internal_server_error')

#### Get an invoice
    - Path: GET '/api/v1/users/{user-id}/invoices/{invoice-id}'
    - Description: Get an invoice for a user.
    - Response:
        - 200: OK
            - payload: #Invoice
        - 401: Unauthorized
            - payload: Error (error_type: 'unauthorized')
        - 500: Internal Server Error
            - payload: Error (error_type: 'internal_server_error')

#### Create an invoice
    - Path: POST '/api/v1/users/{user-id}/invoices'
    - Description: Create an invoice for a user, Required 'admin' role. All fields are mandatory.
    - Request body: #Invoice
    - Response:
        - 200: OK
            - payload: #Invoice
        - 401: Unauthorized
            - payload: Error (error_type: 'unauthorized')
        - 500: Internal Server Error
            - payload: Error (error_type: 'internal_server_error')

#### Update an invoice
    - Path: PATCH '/api/v1/users/{user-id}/invoices/{invoice-id}'
    - Description: Update an invoice for a user, Required 'admin' role. The fields are optional and if not provided will not be updated.
    - Request body: #Invoice
    - Response:
        - 200: OK
            - payload: #Invoice
        - 401: Unauthorized
            - payload: Error (error_type: 'unauthorized')
        - 500: Internal Server Error
            - payload: Error (error_type: 'internal_server_error')

#### Delete an invoice
    - Path: DELETE '/api/v1/users/{user-id}/invoices/{invoice-id}'
    - Description: Delete an invoice for a user, Required 'admin' role. 
    - Response:
        - 202: Accepted
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

### Copies
    - datetime: string, format: date
    - count: object
        - color_$3: number
        - bw_$3: number
        - color_$3: number
        - bw_$3: number
        - color_$3: number
        - bw_$3: number
    - total: object
        - color_$3: number
        - bw_$3: number
        - color_$3: number
        - bw_$3: number
        - color_$3: number
        - bw_$3: number
    - _links
        - self: string
        - user: string

### Invoice
    - from: string, format: date
    - to: string, format: date
    - total: number
    - items: InvoiceItem[]
    - _links: 
        - self: string
        - user: string
        - items: string

### InvoiceItem
    - concept: string
    - quantity: number
    - unitPrice: number
    - total: number
    - _links
        - self: string
        - invoice: string

### Error
    - trace_id: string
    - error_type: string
    - message: string
