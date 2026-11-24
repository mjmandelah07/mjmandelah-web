# API contract

Base URL: `http://localhost:3000/api`

Swagger UI: `http://localhost:3000/docs`

Send `Authorization: Bearer <accessToken>` on every route except login, health, and receipt routes that already include `?token=`.

Money fields are numbers with two decimal places. Dates are ISO-8601. `from` and `to` query dates may be `YYYY-MM-DD` and are interpreted as UTC days. `to` is inclusive of that calendar day.

List routes return:

```json
{
  "data": [],
  "meta": { "page": 1, "pageSize": 20, "total": 0, "pageCount": 1 }
}
```

The GET examples below show one record. Paged routes wrap that record in `data` and add `meta`.

Errors use Nest's shape:

```json
{ "statusCode": 400, "message": "Not enough stock for Milo. On hand: 1", "error": "Bad Request" }
```

`message` may be a string or an array of validation messages.

## Auth

### POST /auth/login

Public.

```json
{ "email": "admin@mjmandelah.store", "password": "ChangeMe123!" }
```

```json
{
  "accessToken": "<jwt>",
  "user": { "id": "", "email": "", "fullName": "", "role": "SUPER_ADMIN" }
}
```

Roles: `SUPER_ADMIN`, `ADMIN`, `CASHIER`.

### GET /auth/me

Current user. Same shape as `user` on login. Phone, active flag, and timestamps are not included.

```json
{
  "id": "7c2a1e40-1b3d-4f8a-9c11-0a6e5d2b8f44",
  "email": "admin@mjmandelah.store",
  "fullName": "Super Admin",
  "role": "SUPER_ADMIN"
}
```

### PATCH /auth/password

```json
{ "currentPassword": "ChangeMe123!", "newPassword": "a-new-password" }
```

```json
{ "updated": true }
```

## Users

Manager only. An admin cannot create, edit, or disable a super admin.

### POST /users

```json
{
  "email": "cashier@mjmandelah.store",
  "password": "ChangeMe123!",
  "fullName": "Ada Cashier",
  "phone": "08000000000",
  "role": "CASHIER"
}
```

Response is one user, same shape as `GET /users/:id`.

### GET /users?page=1&pageSize=20&search=ada&role=CASHIER

Paged. Each item:

```json
{
  "id": "9b1c0d22-4e5f-4a6b-8c7d-1e2f3a4b5c6d",
  "email": "cashier@mjmandelah.store",
  "fullName": "Ada Cashier",
  "phone": "08000000000",
  "role": "CASHIER",
  "isActive": true,
  "createdAt": "2026-11-24T08:00:00.000Z",
  "updatedAt": "2026-11-24T08:00:00.000Z"
}
```

### GET /users/:id

Same object as a list item.

### PATCH /users/:id

Any of `email`, `password`, `fullName`, `phone`, `role`, `isActive`. Response is the updated user.

## Settings

### GET /settings

Store name, address, phone, email, currency, receipt footer.

```json
{
  "id": 1,
  "name": "Mjmandelah Store",
  "address": "12 Market Road",
  "phone": "08030000000",
  "email": "hello@mjmandelah.store",
  "currency": "NGN",
  "receiptFooter": "Goods sold in good condition. Thank you.",
  "updatedAt": "2026-11-24T08:00:00.000Z"
}
```

`address`, `phone`, `email`, and `receiptFooter` may be `null`.

### PATCH /settings

Super admin only. Same fields, all optional. `currency` is a 3-letter code. Response is the updated profile, same shape as `GET /settings`.

## Categories

### GET /categories

Tree. Not paged. Each node includes `children`. A sub-category's `children` array is empty.

```json
[
  {
    "id": "c1a2b3d4-e5f6-4789-a012-b3c4d5e6f708",
    "name": "Drinks",
    "slug": "drinks",
    "description": "Water, soda, juice, and other drinks",
    "parentId": null,
    "createdAt": "2026-11-24T08:00:00.000Z",
    "updatedAt": "2026-11-24T08:00:00.000Z",
    "children": [
      {
        "id": "d2b3c4e5-f6a7-4890-b123-c4d5e6f70819",
        "name": "Soft drinks",
        "slug": "soft-drinks",
        "description": null,
        "parentId": "c1a2b3d4-e5f6-4789-a012-b3c4d5e6f708",
        "createdAt": "2026-11-24T08:10:00.000Z",
        "updatedAt": "2026-11-24T08:10:00.000Z",
        "children": []
      }
    ]
  }
]
```

### POST /categories

Admin. `name`, optional `description`, optional `parentId`. A sub-category cannot have its own children. Response is the category row without `children`.

### PATCH /categories/:id

Admin. Send `parentId: null` to make it a top-level category. Response is the updated row without `children`.

### DELETE /categories/:id

Admin. Refused when products or sub-categories still use it.

```json
{ "deleted": true }
```

## Suppliers

Admin.

### POST /suppliers

`name`, optional `phone`, `email`, `address`, `notes`. Response matches `GET` item shape.

### GET /suppliers?search=&includeInactive=true

Paged. Each item:

```json
{
  "id": "a11b22c3-d4e5-46f7-8901-23456789abcd",
  "name": "Ade Foods",
  "phone": "08020000000",
  "email": "ade@example.com",
  "address": "Oshodi",
  "notes": null,
  "isActive": true,
  "createdAt": "2026-11-24T08:00:00.000Z",
  "updatedAt": "2026-11-24T08:00:00.000Z"
}
```

### PATCH /suppliers/:id

Includes `isActive`. Response is the updated supplier.

## Customers

Any staff member can create, list, read, and take payment. Only a manager can edit.

### POST /customers

`name`, optional `phone`, `email`, `address`, `notes`. Response is the customer without `payments`. `balance` starts at `0`.

### GET /customers?search=

Paged. Each item:

```json
{
  "id": "b22c33d4-e5f6-4701-8123-456789abcdef",
  "name": "Ade Wholesale",
  "phone": "08011111111",
  "email": null,
  "address": null,
  "notes": null,
  "balance": 5000,
  "isActive": true,
  "createdAt": "2026-11-24T08:00:00.000Z",
  "updatedAt": "2026-11-24T09:00:00.000Z"
}
```

Inactive customers are omitted.

### GET /customers/:id

Includes the latest payments (up to 20) and `balance`.

```json
{
  "id": "b22c33d4-e5f6-4701-8123-456789abcdef",
  "name": "Ade Wholesale",
  "phone": "08011111111",
  "email": null,
  "address": null,
  "notes": null,
  "balance": 5000,
  "isActive": true,
  "createdAt": "2026-11-24T08:00:00.000Z",
  "updatedAt": "2026-11-24T09:00:00.000Z",
  "payments": [
    {
      "id": "c33d44e5-f6a7-4812-9234-56789abcdef0",
      "customerId": "b22c33d4-e5f6-4701-8123-456789abcdef",
      "amount": 5000,
      "note": "Transfer from Ade",
      "receivedById": "7c2a1e40-1b3d-4f8a-9c11-0a6e5d2b8f44",
      "createdAt": "2026-11-24T10:00:00.000Z",
      "receivedBy": { "id": "7c2a1e40-1b3d-4f8a-9c11-0a6e5d2b8f44", "fullName": "Super Admin" }
    }
  ]
}
```

### PATCH /customers/:id

Response is the customer without `payments`.

### POST /customers/:id/payments

```json
{ "amount": 5000, "note": "Transfer from Ade" }
```

Amount cannot exceed the balance.

```json
{
  "customer": {
    "id": "b22c33d4-e5f6-4701-8123-456789abcdef",
    "name": "Ade Wholesale",
    "phone": "08011111111",
    "email": null,
    "address": null,
    "notes": null,
    "balance": 0,
    "isActive": true,
    "createdAt": "2026-11-24T08:00:00.000Z",
    "updatedAt": "2026-11-24T10:00:00.000Z"
  },
  "payment": {
    "id": "c33d44e5-f6a7-4812-9234-56789abcdef0",
    "customerId": "b22c33d4-e5f6-4701-8123-456789abcdef",
    "amount": 5000,
    "note": "Transfer from Ade",
    "receivedById": "7c2a1e40-1b3d-4f8a-9c11-0a6e5d2b8f44",
    "createdAt": "2026-11-24T10:00:00.000Z"
  }
}
```

## Products

Cashiers can read products. Cost price is omitted for them. Managers can create and edit.

### POST /products

JSON, or `multipart/form-data` when files are included.

Fields: `name`, `categoryId`, `retailPrice`, `wholesalePrice`. Optional: `sku` (generated when omitted), `barcode`, `description`, `unit` (default `pcs`), `costPrice`, `wholesaleMinQty` (default 1), `reorderLevel`, `openingQuantity`, `openingUnitCost`.

Files:

- `images`: up to 6 product photos
- `receipt`: one supplier receipt, only when `openingQuantity` is at least 1

Images must be JPEG, PNG, or WebP, 5MB max.

Response is one product, same shape as `GET /products/:id`.

### GET /products

`search`, `categoryId`, `lowStock=true`, `includeInactive=true`, `page`, `pageSize`.

Paged. Each item:

```json
{
  "id": "e44f55a6-b7c8-4923-a345-6789abcdef01",
  "name": "Milo 400g",
  "sku": "ML-400",
  "barcode": "6156000123456",
  "description": null,
  "unit": "pcs",
  "category": {
    "id": "c1a2b3d4-e5f6-4789-a012-b3c4d5e6f708",
    "name": "Drinks",
    "slug": "drinks",
    "parentId": null
  },
  "retailPrice": 1800,
  "wholesalePrice": 1600,
  "wholesaleMinQty": 6,
  "quantityOnHand": 24,
  "reorderLevel": 6,
  "isLowStock": false,
  "isActive": true,
  "images": [
    {
      "id": "f55a66b7-c8d9-4034-b456-789abcdef012",
      "url": "https://res.cloudinary.com/demo/image/upload/milo.jpg",
      "createdAt": "2026-11-24T08:00:00.000Z"
    }
  ],
  "createdAt": "2026-11-24T08:00:00.000Z",
  "updatedAt": "2026-11-24T08:00:00.000Z",
  "costPrice": 1200
}
```

`costPrice` is present for managers and omitted for cashiers. `barcode` and `description` may be `null`.

`barcode` or `sku` returns one product instead of a page. Unknown codes are 404. The single-product body matches `GET /products/:id`.

### GET /products/:id

Same object as a list item.

### PATCH /products/:id

Managers. Any catalog field, including `isActive`. This does not change quantity. Use stock intake or an adjustment for that. Response is the updated product.

### POST /products/:id/images

Managers. Multipart field `images`. Response is the updated product.

### DELETE /products/:id/images/:fileId

Response is the updated product.

### DELETE /products/:id

Deactivates the product when it already has stock history. Otherwise deletes it.

```json
{ "deactivated": true }
```

```json
{ "deleted": true }
```

## Stock

Managers only. `quantity` on a movement is signed: positive adds stock, negative removes it.

### POST /stock/intakes

JSON, or multipart when a receipt photo is attached. Multipart field `items` is a JSON string.

```json
{
  "supplierId": "optional-uuid",
  "reference": "INV-1044",
  "notes": "Morning delivery",
  "items": [{ "productId": "uuid", "quantity": 24, "unitCost": 350 }]
}
```

File field: `receipt`.

Cost price becomes the weighted average of stock already on hand and this delivery.

Response is the intake row with `items` and `files`. `unitCost` is a number. `supplier` may be `null`.

### GET /stock/intakes

Paged. Each item:

```json
{
  "id": "a66b77c8-d9e0-4145-c567-89abcdef0123",
  "reference": "INV-1044",
  "supplierId": "a11b22c3-d4e5-46f7-8901-23456789abcd",
  "notes": "Morning delivery",
  "receivedById": "7c2a1e40-1b3d-4f8a-9c11-0a6e5d2b8f44",
  "createdAt": "2026-11-24T09:00:00.000Z",
  "supplier": {
    "id": "a11b22c3-d4e5-46f7-8901-23456789abcd",
    "name": "Ade Foods",
    "phone": "08020000000",
    "email": null,
    "address": null,
    "notes": null,
    "isActive": true,
    "createdAt": "2026-11-24T08:00:00.000Z",
    "updatedAt": "2026-11-24T08:00:00.000Z"
  },
  "receivedBy": { "id": "7c2a1e40-1b3d-4f8a-9c11-0a6e5d2b8f44", "fullName": "Super Admin" },
  "items": [
    {
      "id": "b77c88d9-e0f1-4256-d678-9abcdef01234",
      "intakeId": "a66b77c8-d9e0-4145-c567-89abcdef0123",
      "productId": "e44f55a6-b7c8-4923-a345-6789abcdef01",
      "quantity": 24,
      "unitCost": 350,
      "product": { "id": "e44f55a6-b7c8-4923-a345-6789abcdef01", "name": "Milo 400g", "sku": "ML-400" }
    }
  ],
  "files": [
    {
      "id": "c88d99e0-f1a2-4367-e789-abcdef012345",
      "kind": "INTAKE_RECEIPT",
      "url": "https://res.cloudinary.com/demo/image/upload/receipt.jpg",
      "publicId": "mjmandelah/intake-receipts/receipt",
      "mimeType": "image/jpeg",
      "bytes": 120000,
      "productId": null,
      "intakeId": "a66b77c8-d9e0-4145-c567-89abcdef0123",
      "damageId": null,
      "createdAt": "2026-11-24T09:00:00.000Z"
    }
  ]
}
```

### GET /stock/movements?productId=

Paged. Each item:

```json
{
  "id": "d99e00f1-a2b3-4478-f890-bcdef0123456",
  "productId": "e44f55a6-b7c8-4923-a345-6789abcdef01",
  "type": "INTAKE",
  "quantity": 24,
  "balanceAfter": 24,
  "note": "INV-1044",
  "referenceId": "a66b77c8-d9e0-4145-c567-89abcdef0123",
  "createdById": "7c2a1e40-1b3d-4f8a-9c11-0a6e5d2b8f44",
  "createdAt": "2026-11-24T09:00:00.000Z",
  "product": { "id": "e44f55a6-b7c8-4923-a345-6789abcdef01", "name": "Milo 400g", "sku": "ML-400" },
  "createdBy": { "id": "7c2a1e40-1b3d-4f8a-9c11-0a6e5d2b8f44", "fullName": "Super Admin" }
}
```

`type`: `INTAKE`, `SALE`, `RETURN`, `DAMAGE`, `ADJUSTMENT`, `VOID`. `quantity` is signed.

### POST /stock/adjustments

```json
{
  "productId": "uuid",
  "quantity": 2,
  "direction": "DECREASE",
  "reason": "Count correction after shelf check"
}
```

`direction` is `INCREASE` or `DECREASE`.

```json
{
  "productId": "e44f55a6-b7c8-4923-a345-6789abcdef01",
  "quantityOnHand": 22,
  "direction": "DECREASE",
  "quantity": 2
}
```

## Sales

Any staff member.

### POST /sales

```json
{
  "channel": "RETAIL",
  "paymentMethod": "CASH",
  "customerName": "Walk-in",
  "discount": 0,
  "taxRate": 0,
  "amountPaid": 2000,
  "notes": "",
  "items": [{ "productId": "uuid", "quantity": 2 }]
}
```

`channel`: `RETAIL` or `WHOLESALE`.

`paymentMethod`: `CASH`, `CARD`, `TRANSFER`, `CREDIT`.

`CREDIT` requires `channel: WHOLESALE` and `customerId`. `amountPaid` may be less than the total. The difference is `balanceDue`.

Wholesale quantity must be at least the product's `wholesaleMinQty`.

Response:

```json
{
  "sale": {},
  "receipt": {
    "number": "RCP-20261124-0001",
    "printUrl": "/api/sales/<id>/receipt/print?token=<token>",
    "pdfUrl": "/api/sales/<id>/receipt.pdf?token=<token>",
    "jsonUrl": "/api/sales/<id>/receipt?token=<token>"
  }
}
```

`sale` matches `GET /sales/:id`. Open `printUrl` in a new tab. Add `&autoprint=1` to open the browser print dialog. `pdfUrl` downloads the PDF. The token lasts 12 hours. A signed-in request can omit it and send the bearer token instead.

Each sale item includes `remainingQty` for the returns screen.

### GET /sales

`channel`, `status`, `paymentMethod`, `cashierId`, `productId`, `search` (receipt number), `from`, `to`, `page`, `pageSize`.

`productId` keeps sales that include that product.

`status`: `COMPLETED`, `PARTIAL_RETURN`, `RETURNED`, `VOID`.

Paged. Each item matches `GET /sales/:id`.

### GET /sales/:id

```json
{
  "id": "e00f11a2-b3c4-4589-a901-cdef01234567",
  "receiptNumber": "RCP-20261124-0001",
  "channel": "RETAIL",
  "status": "COMPLETED",
  "paymentMethod": "CASH",
  "customerId": null,
  "customerName": "Walk-in",
  "customer": null,
  "cashier": { "id": "7c2a1e40-1b3d-4f8a-9c11-0a6e5d2b8f44", "fullName": "Super Admin" },
  "subtotal": 3600,
  "discount": 0,
  "taxRate": 0,
  "tax": 0,
  "total": 3600,
  "amountPaid": 4000,
  "changeDue": 400,
  "balanceDue": 0,
  "notes": null,
  "receiptPdfUrl": null,
  "receiptStatus": "PENDING",
  "createdAt": "2026-11-24T11:00:00.000Z",
  "items": [
    {
      "id": "f11a22b3-c4d5-4690-b012-def012345678",
      "productId": "e44f55a6-b7c8-4923-a345-6789abcdef01",
      "productName": "Milo 400g",
      "sku": "ML-400",
      "quantity": 2,
      "returnedQty": 0,
      "remainingQty": 2,
      "unitPrice": 1800,
      "lineTotal": 3600
    }
  ],
  "returns": []
}
```

When the sale was on credit, `customer` is `{ "id", "name", "phone" }`. `receiptStatus` is `PENDING`, `READY`, or `FAILED`. Each return on this sale matches the return object from `GET /returns/:id`.

### POST /sales/:id/void

Managers. Only a completed sale with no returns. Stock is restored. Response is the updated sale.

## Receipts

### GET /sales/:id/receipt

JSON receipt plus `links`. HTML and PDF routes are not JSON.

```json
{
  "id": "e00f11a2-b3c4-4589-a901-cdef01234567",
  "receiptNumber": "RCP-20261124-0001",
  "channel": "RETAIL",
  "status": "COMPLETED",
  "paymentMethod": "CASH",
  "customerName": "Walk-in",
  "cashierName": "Super Admin",
  "createdAt": "2026-11-24T11:00:00.000Z",
  "currency": "NGN",
  "store": {
    "name": "Mjmandelah Store",
    "address": "12 Market Road",
    "phone": "08030000000",
    "email": "hello@mjmandelah.store",
    "footer": "Goods sold in good condition. Thank you."
  },
  "items": [
    { "name": "Milo 400g", "sku": "ML-400", "quantity": 2, "unitPrice": 1800, "lineTotal": 3600 }
  ],
  "subtotal": 3600,
  "discount": 0,
  "taxRate": 0,
  "tax": 0,
  "total": 3600,
  "amountPaid": 4000,
  "changeDue": 400,
  "balanceDue": 0,
  "notes": null,
  "links": {
    "print": "/api/sales/<id>/receipt/print",
    "pdf": "/api/sales/<id>/receipt.pdf"
  }
}
```

When the request used `?token=`, those links include the same token.

### GET /sales/:id/receipt/print

HTML page, 80mm layout. `Content-Type: text/html`.

### GET /sales/:id/receipt.pdf

`application/pdf` download. This is generated immediately.

`sale.receiptPdfUrl` is the archived Cloudinary copy, filled in after the queue job. `receiptStatus` is `PENDING`, `READY`, or `FAILED`. A failed archive does not block print or download.

## Returns

Any staff member.

### POST /returns

```json
{
  "saleId": "uuid",
  "reason": "Customer changed their mind",
  "items": [{ "saleItemId": "uuid", "quantity": 1 }]
}
```

Stock is restored. Refund amount is the paid share of those units. Response matches `GET /returns/:id`, without the nested `sale` and `processedBy` summaries that the read routes add. `items` include `refundAmount` as a number.

### GET /returns

Paged. Each item matches `GET /returns/:id`.

### GET /returns/:id

```json
{
  "id": "a22b33c4-d5e6-4701-8123-ef0123456789",
  "saleId": "e00f11a2-b3c4-4589-a901-cdef01234567",
  "reason": "Customer changed their mind",
  "refundAmount": 1800,
  "processedById": "7c2a1e40-1b3d-4f8a-9c11-0a6e5d2b8f44",
  "createdAt": "2026-11-24T12:00:00.000Z",
  "sale": {
    "id": "e00f11a2-b3c4-4589-a901-cdef01234567",
    "receiptNumber": "RCP-20261124-0001",
    "channel": "RETAIL"
  },
  "processedBy": { "id": "7c2a1e40-1b3d-4f8a-9c11-0a6e5d2b8f44", "fullName": "Super Admin" },
  "items": [
    {
      "id": "b33c44d5-e6f7-4812-9234-f01234567890",
      "returnId": "a22b33c4-d5e6-4701-8123-ef0123456789",
      "saleItemId": "f11a22b3-c4d5-4690-b012-def012345678",
      "productId": "e44f55a6-b7c8-4923-a345-6789abcdef01",
      "quantity": 1,
      "refundAmount": 1800
    }
  ]
}
```

## Damages

Any staff member. Multipart only.

### POST /damages

Fields: `productId`, `quantity`, `reason`, optional `notes`.

File field: `images` (1 to 6). At least one photo is required. Stock decreases by `quantity`. Response matches `GET /damages/:id`.

### GET /damages

Paged. Each item matches `GET /damages/:id`.

### GET /damages/:id

Includes image URLs.

```json
{
  "id": "c44d55e6-f7a8-4923-a345-012345678901",
  "productId": "e44f55a6-b7c8-4923-a345-6789abcdef01",
  "quantity": 1,
  "reason": "Crushed tin",
  "notes": null,
  "reportedById": "7c2a1e40-1b3d-4f8a-9c11-0a6e5d2b8f44",
  "createdAt": "2026-11-24T13:00:00.000Z",
  "product": { "id": "e44f55a6-b7c8-4923-a345-6789abcdef01", "name": "Milo 400g", "sku": "ML-400" },
  "reportedBy": { "id": "7c2a1e40-1b3d-4f8a-9c11-0a6e5d2b8f44", "fullName": "Super Admin" },
  "images": [
    {
      "id": "d55e66f7-a8b9-4034-b456-123456789012",
      "kind": "DAMAGE_PHOTO",
      "url": "https://res.cloudinary.com/demo/image/upload/damage.jpg",
      "publicId": "mjmandelah/damages/damage",
      "mimeType": "image/jpeg",
      "bytes": 98000,
      "productId": null,
      "intakeId": null,
      "damageId": "c44d55e6-f7a8-4923-a345-012345678901",
      "createdAt": "2026-11-24T13:00:00.000Z"
    }
  ]
}
```

## Notifications

### GET /notifications?unreadOnly=true

Paged. Each item:

```json
{
  "id": "e66f77a8-b9c0-4145-c567-234567890123",
  "type": "LOW_STOCK",
  "title": "Low stock",
  "message": "Milo 400g (ML-400) has 4 left. Reorder level is 6.",
  "productId": "e44f55a6-b7c8-4923-a345-6789abcdef01",
  "isRead": false,
  "createdAt": "2026-11-24T14:00:00.000Z"
}
```

Low-stock notifications use `type: "LOW_STOCK"`. `productId` may be `null` for other types.

### PATCH /notifications/:id/read

```json
{ "updated": true }
```

### PATCH /notifications/read-all

```json
{ "updated": true }
```

## Reports

### GET /reports/analytics?from=2026-11-01&to=2026-11-24&bucket=day

Managers. Defaults to the current UTC day. `bucket` is `hour`, `day`, or `month`. A long range is widened automatically so the chart stays readable: more than 3 days of hours becomes days, and more than 120 days becomes months.

Voided sales are excluded. `series` has one point per bucket, including empty ones. `popularProducts` is the top 8 by quantity. `bestSales` is the 5 highest totals.

```json
{
  "from": "2026-11-24T00:00:00.000Z",
  "to": "2026-11-25T00:00:00.000Z",
  "bucket": "hour",
  "salesCount": 12,
  "retailTotal": 84000,
  "wholesaleTotal": 150000,
  "total": 234000,
  "averageSale": 19500,
  "unitsSold": 40,
  "series": [{ "bucket": "2026-11-24T08:00:00.000Z", "retail": 3600, "wholesale": 0, "count": 1 }],
  "payments": [{ "method": "CASH", "count": 8, "total": 84000 }],
  "popularProducts": [
    { "productId": "e44f55a6-b7c8-4923-a345-6789abcdef01", "name": "Milo 400g", "sku": "ML-400", "quantity": 14, "total": 25200 }
  ],
  "bestSales": [
    {
      "id": "e00f11a2-b3c4-4589-a901-cdef01234567",
      "receiptNumber": "RCP-20261124-0001",
      "channel": "WHOLESALE",
      "paymentMethod": "TRANSFER",
      "total": 48000,
      "createdAt": "2026-11-24T11:00:00.000Z",
      "cashier": { "fullName": "Super Admin" }
    }
  ],
  "cashiers": [{ "id": "7c2a1e40-1b3d-4f8a-9c11-0a6e5d2b8f44", "fullName": "Super Admin", "count": 12, "total": 234000 }]
}
```

### GET /reports/overview?from=2026-11-01&to=2026-11-24

Managers. Defaults to the current UTC day.

Returns sales count, `retailTotal`, `wholesaleTotal`, returns, damaged units, `stockCostValue`, `stockRetailValue`, `lowStock`, and `recentSales`.

`from` in the response is the inclusive start. `to` is the exclusive end of the range, so a request for `2026-11-24` comes back with `to` at `2026-11-25T00:00:00.000Z`.

```json
{
  "from": "2026-11-24T00:00:00.000Z",
  "to": "2026-11-25T00:00:00.000Z",
  "salesCount": 12,
  "retailTotal": 84000,
  "wholesaleTotal": 150000,
  "returnsCount": 1,
  "returnsTotal": 1800,
  "damageCount": 1,
  "damagedUnits": 1,
  "stockCostValue": 240000,
  "stockRetailValue": 360000,
  "lowStock": [
    {
      "id": "e44f55a6-b7c8-4923-a345-6789abcdef01",
      "name": "Milo 400g",
      "sku": "ML-400",
      "quantityOnHand": 4,
      "reorderLevel": 6
    }
  ],
  "recentSales": [
    {
      "id": "e00f11a2-b3c4-4589-a901-cdef01234567",
      "receiptNumber": "RCP-20261124-0001",
      "channel": "RETAIL",
      "total": 3600,
      "createdAt": "2026-11-24T11:00:00.000Z",
      "cashier": { "fullName": "Super Admin" }
    }
  ]
}
```

### GET /reports/me

The signed-in user's completed sales for the current UTC day. Voided sales are excluded.

```json
{
  "from": "2026-11-24T00:00:00.000Z",
  "to": "2026-11-25T00:00:00.000Z",
  "salesCount": 4,
  "total": 18200
}
```

## Jobs

### GET /jobs

Managers. The latest 50 queue rows. Not paged. Receipt archival uses type `receipt.archive`.

```json
[
  {
    "id": "f77a88b9-c0d1-4256-d678-345678901234",
    "type": "receipt.archive",
    "payload": { "saleId": "e00f11a2-b3c4-4589-a901-cdef01234567" },
    "status": "DONE",
    "attempts": 0,
    "runAt": "2026-11-24T11:00:05.000Z",
    "lastError": null,
    "createdAt": "2026-11-24T11:00:00.000Z",
    "updatedAt": "2026-11-24T11:00:06.000Z"
  }
]
```

`status`: `PENDING`, `PROCESSING`, `DONE`, `FAILED`.

## Health

### GET /health

Public.

```json
{ "status": "ok", "database": "up" }
```

`status` is `degraded` and `database` is `down` when Postgres cannot be reached.
