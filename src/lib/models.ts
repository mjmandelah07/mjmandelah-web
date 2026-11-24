export type Role = "SUPER_ADMIN" | "ADMIN" | "CASHIER";
export type SaleChannel = "RETAIL" | "WHOLESALE";
export type SaleStatus = "COMPLETED" | "PARTIAL_RETURN" | "RETURNED" | "VOID";
export type PaymentMethod = "CASH" | "CARD" | "TRANSFER" | "CREDIT";
export type StockMovementType = "INTAKE" | "SALE" | "RETURN" | "DAMAGE" | "ADJUSTMENT" | "VOID";
export type ReceiptStatus = "PENDING" | "READY" | "FAILED";
export type JobStatus = "PENDING" | "PROCESSING" | "DONE" | "FAILED";

export type PageMeta = {
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
};

export type Page<T> = {
  data: T[];
  meta: PageMeta;
};

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
};

export type LoginResponse = {
  accessToken: string;
  user: AuthUser;
};

export type StaffUser = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type StoreProfile = {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  currency: string;
  receiptFooter: string | null;
  updatedAt: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  children: Category[];
};

export type Supplier = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CustomerPayment = {
  id: string;
  customerId: string;
  amount: number;
  note: string | null;
  receivedById: string;
  createdAt: string;
  receivedBy?: { id: string; fullName: string };
};

export type Customer = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  balance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  payments?: CustomerPayment[];
};

export type ProductImage = {
  id: string;
  url: string;
  createdAt: string;
};

export type Product = {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  description: string | null;
  unit: string;
  category: { id: string; name: string; slug: string; parentId: string | null };
  retailPrice: number;
  wholesalePrice: number;
  wholesaleMinQty: number;
  quantityOnHand: number;
  reorderLevel: number;
  isLowStock: boolean;
  isActive: boolean;
  images: ProductImage[];
  createdAt: string;
  updatedAt: string;
  costPrice?: number;
};

export type StoredFile = {
  id: string;
  kind: string;
  url: string;
  publicId: string;
  mimeType: string | null;
  bytes: number | null;
  productId: string | null;
  intakeId: string | null;
  damageId: string | null;
  createdAt: string;
};

export type StockIntake = {
  id: string;
  reference: string | null;
  supplierId: string | null;
  notes: string | null;
  receivedById: string;
  createdAt: string;
  supplier: Supplier | null;
  receivedBy: { id: string; fullName: string };
  items: Array<{
    id: string;
    intakeId: string;
    productId: string;
    quantity: number;
    unitCost: number;
    product: { id: string; name: string; sku: string };
  }>;
  files: StoredFile[];
};

export type StockMovement = {
  id: string;
  productId: string;
  type: StockMovementType;
  quantity: number;
  balanceAfter: number;
  note: string | null;
  referenceId: string | null;
  createdById: string | null;
  createdAt: string;
  product: { id: string; name: string; sku: string };
  createdBy: { id: string; fullName: string } | null;
};

export type SaleItem = {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  returnedQty: number;
  remainingQty: number;
  unitPrice: number;
  lineTotal: number;
};

export type SaleReturn = {
  id: string;
  reason: string;
  refundAmount: number;
  createdAt: string;
  processedBy: { id: string; fullName: string };
  items: Array<{
    id: string;
    saleItemId: string;
    productId: string;
    quantity: number;
    refundAmount: number;
  }>;
};

export type Sale = {
  id: string;
  receiptNumber: string;
  channel: SaleChannel;
  status: SaleStatus;
  paymentMethod: PaymentMethod;
  customerId: string | null;
  customerName: string | null;
  customer: { id: string; name: string; phone: string | null } | null;
  cashier: { id: string; fullName: string };
  subtotal: number;
  discount: number;
  taxRate: number;
  tax: number;
  total: number;
  amountPaid: number;
  changeDue: number;
  balanceDue: number;
  notes: string | null;
  receiptPdfUrl: string | null;
  receiptStatus: ReceiptStatus;
  createdAt: string;
  items: SaleItem[];
  returns: SaleReturn[];
};

export type SaleCreated = {
  sale: Sale;
  receipt: {
    number: string;
    printUrl: string;
    pdfUrl: string;
    jsonUrl: string;
  };
};

export type ReturnRecord = {
  id: string;
  saleId: string;
  reason: string;
  refundAmount: number;
  processedById: string;
  createdAt: string;
  sale: { id: string; receiptNumber: string; channel: SaleChannel };
  processedBy: { id: string; fullName: string };
  items: Array<{
    id: string;
    returnId: string;
    saleItemId: string;
    productId: string;
    quantity: number;
    refundAmount: number;
  }>;
};

export type DamageReport = {
  id: string;
  productId: string;
  quantity: number;
  reason: string;
  notes: string | null;
  reportedById: string;
  createdAt: string;
  product: { id: string; name: string; sku: string };
  reportedBy: { id: string; fullName: string };
  images: StoredFile[];
};

export type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  productId: string | null;
  isRead: boolean;
  createdAt: string;
};

export type OverviewReport = {
  from: string;
  to: string;
  salesCount: number;
  retailTotal: number;
  wholesaleTotal: number;
  returnsCount: number;
  returnsTotal: number;
  damageCount: number;
  damagedUnits: number;
  stockCostValue: number;
  stockRetailValue: number;
  lowStock: Array<{
    id: string;
    name: string;
    sku: string;
    quantityOnHand: number;
    reorderLevel: number;
  }>;
  recentSales: Array<{
    id: string;
    receiptNumber: string;
    channel: SaleChannel;
    total: number;
    createdAt: string;
    cashier: { fullName: string };
  }>;
};

export type MyReport = {
  from: string;
  to: string;
  salesCount: number;
  total: number;
};

export type JobRow = {
  id: string;
  type: string;
  payload: unknown;
  status: JobStatus;
  attempts: number;
  runAt: string;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
};

export function isManager(role: Role) {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

export function flattenCategories(nodes: Category[], depth = 0): Array<{ id: string; label: string; depth: number }> {
  const rows: Array<{ id: string; label: string; depth: number }> = [];
  for (const node of nodes) {
    rows.push({ id: node.id, label: `${depth ? "— ".repeat(depth) : ""}${node.name}`, depth });
    rows.push(...flattenCategories(node.children, depth + 1));
  }
  return rows;
}
