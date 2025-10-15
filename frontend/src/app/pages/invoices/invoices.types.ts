export enum InvoiceStatus {
  Draft = 'Draft',
  Sent = 'Sent',
  Paid = 'Paid',
  Overdue = 'Overdue'
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
