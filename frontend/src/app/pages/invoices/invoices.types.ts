export enum InvoiceStatus {
  Unapproved = 'Unapproved',
  Approved = 'Approved'
}

export interface InvoiceLineItemDto {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceDto {
  id: number;
  invoiceNumber?: string;
  clientId: number;
  invoiceDate: string;
  dueDate: string;
  status: InvoiceStatus;
  subTotal: number;
  tax: number;
  total: number;
  notes?: string;
  lineItems: InvoiceLineItemDto[];
}

export interface SaveInvoicePayload {
  id?: number;
  invoiceNumber?: string;
  clientId: number;
  invoiceDate: string;
  dueDate: string;
  status: InvoiceStatus;
  subTotal: number;
  tax: number;
  total: number;
  notes?: string;
  lineItems: Array<{
    id?: number;
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
}

// Normalize different representations of invoice status (legacy strings or numeric enum values)
export function normalizeInvoiceStatus(value: unknown): InvoiceStatus {
  if (value === null || value === undefined) return InvoiceStatus.Unapproved;
  if (typeof value === 'string') {
    const v = value.trim();
    const lower = v.toLowerCase();
    if (lower === 'approved' || lower === 'paid') return InvoiceStatus.Approved;
    // treat all other legacy names as unapproved
    return InvoiceStatus.Unapproved;
  }
  if (typeof value === 'number') {
    // legacy numeric enum mapping: Draft=0, Sent=1, Paid=2, Overdue=3
      // numeric enum mapping: Unapproved=0, Approved=1
      // map 1 -> Approved, others -> Unapproved
      if (value === 1) return InvoiceStatus.Approved;
    return InvoiceStatus.Unapproved;
  }

  return InvoiceStatus.Unapproved;
}
