
# API Endpoints summary

## Invoices endpoint list
### Get all invoices for a user
    - Path: GET '/api/v1/users/{user-id}/invoices'
    - Description: Get all invoices for a user, the from and to are optional and if not provided will get all invoices for the user. The from and to are in ISO 8601 format (YYYY-MM-DD).
    This endpoint won't return InvoicesItems.
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

### Get an invoice
    - Path: GET '/api/v1/users/{user-id}/invoices/{invoice-id}'
    - Description: Get an invoice for a user.
    - Response:
        - 200: OK
            - payload: #Invoice
        - 401: Unauthorized
            - payload: Error (error_type: 'unauthorized')
        - 500: Internal Server Error
            - payload: Error (error_type: 'internal_server_error')

### Create an invoice
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

### Update an invoice
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

### Delete an invoice
    - Path: DELETE '/api/v1/users/{user-id}/invoices/{invoice-id}'
    - Description: Delete an invoice for a user, Required 'admin' role. 
    - Response:
        - 202: Accepted
        - 401: Unauthorized
            - payload: Error (error_type: 'unauthorized')
        - 500: Internal Server Error
            - payload: Error (error_type: 'internal_server_error')

## Rest Objects
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

