## DB Schema

Table: Users
- id: string, format: uuid
- username: string, unique
- password: string, format: hash
- role: string, value: admin | customer
- printUser: string
- nexudusUser: string

Table: Copies
- id: string, format: uuid
- userId: string, FK<Users.id>
- datetime: datetime
- a4Color: number
- a4Bw: number
- a3Color: number
- a3Bw: number
- a4ColorTotal: number
- a4BwTotal: number
- a3ColorTotal: number
- a3BwTotal: number

Table: Invoices
- id: string, format: uuid
- userId: string, FK<Users.id>
- from: date
- to: date
- total: number

Table: InvoiceItems
- id: string, format: uuid
- invoiceId: string, FK<Invoices.id>
- concept: string
- quantity: number
- unitPrice: number
- total: number
