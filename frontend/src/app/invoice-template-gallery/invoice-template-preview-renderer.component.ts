import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

interface TemplateItem {
  id: number;
  name: string;
  thumbnail: string;
  description?: string;
}

@Component({
  selector: 'app-invoice-template-preview-renderer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="inv-root" [ngClass]="{ modern: template?.id === 2, minimal: template?.id === 3 }">
      <header class="inv-header">
        <div class="brand">
          <div class="brand-name">Acme Co.</div>
          <div class="brand-sub">Invoice</div>
        </div>
        <div class="meta">
          <div>Invoice #: <strong>INV-2025-{{template?.id}}</strong></div>
          <div>Date: <strong>{{ today }}</strong></div>
        </div>
      </header>

      <section class="inv-parties">
        <div class="from">
          <div class="label">From</div>
          <div class="name">Acme Company Ltd.</div>
          <div>123 Business Rd.</div>
          <div>City, Country</div>
        </div>
        <div class="to">
          <div class="label">Bill To</div>
          <div class="name">John Customer</div>
          <div>Client Company</div>
          <div>client&#64;company.com</div>
        </div>
      </section>

      <table class="inv-table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty</th>
            <th>Unit</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Design & Development</td>
            <td class="center">10</td>
            <td class="right">₺500</td>
            <td class="right">₺5.000</td>
          </tr>
          <tr>
            <td>Consulting</td>
            <td class="center">5</td>
            <td class="right">₺300</td>
            <td class="right">₺1.500</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3">Subtotal</td>
            <td class="right">₺6.500</td>
          </tr>
          <tr>
            <td colspan="3">Tax (18%)</td>
            <td class="right">₺1.170</td>
          </tr>
          <tr class="grand">
            <td colspan="3">Total</td>
            <td class="right">₺7.670</td>
          </tr>
        </tfoot>
      </table>

      <footer class="inv-footer">Thank you for your business. Payment due within 30 days.</footer>
    </div>
  `,
  styles: [
    `
    .inv-root { font-family: 'Helvetica Neue', Arial; color:#222; background:#fff; padding:18px; max-width:900px; margin:0 auto }
    .inv-header { display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e6e6e6; padding-bottom:12px }
    .brand-name { font-size:20px; font-weight:700 }
    .brand-sub { color:#666 }
    .inv-parties { display:flex; justify-content:space-between; gap:20px; padding:14px 0 }
    .label { font-size:12px; color:#777 }
    .inv-table { width:100%; border-collapse:collapse; margin-top:8px }
    .inv-table th, .inv-table td { padding:10px 8px; border-bottom:1px solid #f0f0f0 }
    .inv-table thead th { background:#fafafa; color:#333; text-align:left }
    .center { text-align:center }
    .right { text-align:right }
    tfoot tr td { border-top: none }
    tfoot .grand td { font-weight:700; font-size:15px; border-top:1px solid #ddd }
    .inv-footer { margin-top:20px; color:#666; font-size:13px }

    /* Modern (id = 2) styles: bold header, accent color, compact table */
    .inv-root.modern { font-family: 'Inter', 'Helvetica Neue', Arial; color:#111 }
    .inv-root.modern .inv-header { background: linear-gradient(90deg,#1976d2,#42a5f5); color:#fff; padding:18px; border-radius:6px }
    .inv-root.modern .brand-name { font-size:22px; font-weight:800 }
    .inv-root.modern .brand-sub { color: rgba(255,255,255,0.85) }
    .inv-root.modern .inv-parties { padding:18px 0 }
    .inv-root.modern .inv-table thead th { background: transparent; color:#1976d2; font-weight:700 }
    .inv-root.modern .inv-table th, .inv-root.modern .inv-table td { padding:8px 6px; }
    .inv-root.modern .inv-table tbody tr td { border-bottom: 1px dashed #e6f0fb }
    .inv-root.modern .inv-footer { color:#444 }

    /* Minimal (id = 3) styles: lots of whitespace, thin fonts, subtle lines */
    .inv-root.minimal { font-family: 'Georgia', 'Times New Roman', serif; color:#111; background: #fbfbfb }
    .inv-root.minimal .inv-header { border-bottom: none; padding-bottom:6px }
    .inv-root.minimal .brand-name { font-size:18px; font-weight:600; color:#222 }
    .inv-root.minimal .brand-sub { color:#999; font-style:italic }
    .inv-root.minimal .inv-parties { gap:40px; padding:8px 0 }
    .inv-root.minimal .inv-table { background: #fff; border: 1px solid #efefef; }
    .inv-root.minimal .inv-table thead th { background: transparent; color:#666; font-weight:500 }
    .inv-root.minimal .inv-table th, .inv-root.minimal .inv-table td { padding:14px 10px; border-bottom:1px solid #f6f6f6 }
    .inv-root.minimal tfoot .grand td { font-size:16px; }
    `
  ]
})
export class InvoiceTemplatePreviewRendererComponent {
  @Input() template?: TemplateItem;

  today = new Date().toLocaleDateString('tr-TR');
}
