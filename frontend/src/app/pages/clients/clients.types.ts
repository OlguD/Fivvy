export interface ClientDto {
  id: number;
  companyName: string;
  contactName: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  createdAt?: string | null;
}

export interface ClientPayload {
  CompanyName: string;
  ContactName: string;
  Email?: string;
  Phone?: string;
  Address?: string;
}

export interface UpdateClientRequest {
  ClientId: number;
  ClientModel: ClientPayload;
}
