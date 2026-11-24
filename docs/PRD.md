# Product requirements: store inventory

## Summary

Mjmandelah needs one system for a shop that sells the same goods at retail and wholesale. Staff add products, receive stock with the supplier receipt, sell, print or download a receipt, take returns, and record damaged goods with photos. Three roles share the system: super admin, admin, and cashier.

## Users

- **Super admin** owns the business setup: store name on receipts, currency, and every user including other super admins.
- **Admin** runs the shop: categories, suppliers, products, stock intake, adjustments, voids, and the full sales report. An admin cannot create or edit a super admin.
- **Cashier** sells, looks up products, handles returns, records damage, and takes customer payments. A cashier does not see cost price, cannot change catalog data, and cannot void a sale.

Accounts are created by a manager. Customers do not log in.

## Catalog

Categories have one level of sub-categories. Examples already seeded: Drinks, Provisions, Groceries. Staff can add more, such as Drinks → Soft drinks.

Each product has a name, SKU, optional barcode, unit (pieces, carton, bottle, and so on), cost, retail price, wholesale price, wholesale minimum quantity, reorder level, and quantity on hand. Product photos are optional. Cost price is hidden from cashiers.

## Stock

Quantity on hand is a balance. Every change is also a ledger line:

| Movement | Effect |
| --- | --- |
| Intake | Stock in. Cost becomes a weighted average of the old stock and the new delivery. |
| Sale | Stock out. |
| Return | Stock in. |
| Damage | Stock out. |
| Adjustment | Stock in or out, with a reason. |
| Void | Stock in, reversing a sale that has no returns. |

Opening stock can be entered while creating the product. The supplier receipt image belongs to that intake. Later deliveries use stock intake and can attach another receipt. The receipt is the paper or photo from the supplier, not the customer sales receipt.

When quantity falls to the reorder level or below, the API creates one unread low-stock notification. The notification is marked read when stock rises above that level.

## Selling

A sale is either retail or wholesale.

- Retail uses the retail price for any quantity.
- Wholesale uses the wholesale price. Each line must be at least the product's wholesale minimum.
- Prices are calculated on the server. The client sends product ids and quantities.
- Discount is an amount, not a percent, and cannot exceed the subtotal.
- Tax is a percent of the subtotal after discount.
- Cash, card, and transfer must be paid in full. Change is returned when cash paid is higher than the total.
- Credit is allowed only for wholesale, only with a customer, and increases that customer's balance. A later payment reduces the balance and cannot exceed it.

The sale response includes links to print the receipt, download a PDF, or read it as JSON. Those links carry a 12-hour token so a new browser tab can open them. Staff who are already signed in can open the same routes with the bearer token.

A completed sale with no returns can be voided by an admin. Stock comes back. Any credit balance from that sale is reversed.

## Returns

A return points at a sale and one or more sale lines. Staff cannot return more than the quantity still available on that line. Stock goes back. The refund follows the share of the sale the customer actually paid, so a discounted sale is not refunded at the full shelf price.

The sale becomes partially returned or fully returned. A voided sale cannot be returned.

If the original sale was on credit, the refund reduces the remaining balance first.

## Damages

A damage report names the product, the quantity, the reason, and at least one photo. That quantity leaves stock. It is not a sale and it does not create a customer receipt.

## Files

The browser or POS sends the image file to this API. The API checks that it is JPEG, PNG, or WebP and at most 5MB, then uploads it to Cloudinary. The database stores the Cloudinary URL. The client never receives Cloudinary API secrets.

## Receipts and queue

Printable HTML is an 80mm layout with a print button. The PDF download is an A4 receipt generated on request.

After each sale the API queues `receipt.archive`. A worker in the same process claims jobs from PostgreSQL, builds the PDF, and stores it on Cloudinary. If Cloudinary is not configured, selling still works and the archive job is marked failed. Print and download do not wait for that job.

`GET /api/jobs` lets a manager see the last 50 jobs.

## Reporting

Managers can request an overview for a date range (default: the current UTC day): retail total, wholesale total, returns, damaged units, stock value at cost, stock value at retail, low-stock products, and recent sales.

A cashier can request their own total for the current UTC day.

## Store profile

Receipts use the store name, address, phone, email, currency, and footer saved in settings. Currency defaults to NGN. Only a super admin can change settings.

## Out of scope for this version

- Pack-size conversion, such as selling one bottle from a carton at a different unit.
- Customer logins, loyalty points, or a public shopfront.
- Accounting exports, purchase-order approval, or multi-branch stock.
- Card-machine integration. Card and transfer are recorded as payment methods only.
- A separate Redis queue. PostgreSQL already holds the jobs.

## Acceptance

- A super admin can create an admin and a cashier, and an admin cannot create a super admin.
- Staff can create a category, a sub-category, and a product with a photo and an opening-stock receipt.
- A cashier can sell the same product retail or wholesale, then print or download the receipt.
- A return restores stock and blocks a second return of the same units.
- A damage report with a photo reduces stock.
- A wholesale credit sale increases the customer balance, and a payment reduces it.
- Low stock creates a notification when the reorder level is crossed.
