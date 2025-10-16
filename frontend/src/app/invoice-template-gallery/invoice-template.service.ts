import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class InvoiceTemplateService {
  constructor(private readonly http: HttpClient) {}

  // Calls backend endpoint which should return application/pdf
  generateTemplatePdf(templateId: number): Observable<Blob> {
    const url = `/api/invoices/generate-template/${templateId}`;
    return this.http.get(url, { responseType: 'blob' });
  }
}
