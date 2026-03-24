
# API Endpoints summary

## User Endpoints
### Get all copies for a user
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

### Add copies for a user
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

### Update copies for a user
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

### Delete copies for a user
    - Path: DELETE '/api/v1/users/{user-id}/copies/{copy-id}'
    - Description: Delete copies for a user, Required 'admin' role. 
    - Response:
        - 202: Accepted
        - 401: Unauthorized
            - payload: Error (error_type: 'unauthorized')
        - 500: Internal Server Error
            - payload: Error (error_type: 'internal_server_error')  

## Rest Objects
### Copies
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
