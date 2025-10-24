import { CommonModule } from '@angular/common';
import { Component, Injectable } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Observable, of } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { InvoiceTemplatePreviewRendererComponent } from './invoice-template-preview-renderer.component';

interface TemplateItem {
  id: number;
  name: string;
  thumbnail: string;
  description?: string;
}

@Component({
  selector: 'app-invoice-template-gallery',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatDialogModule, TranslateModule, RouterModule],
  templateUrl: './invoice-template-gallery.component.html',
  styleUrls: ['./invoice-template-gallery.component.css']
})
export class InvoiceTemplateGalleryComponent {
  templates: TemplateItem[] = [
    { id: 1, name: 'Classic', thumbnail: 'assets/invoice-templates/template1.svg', description: 'Clean, classic layout' },
    { id: 2, name: 'Modern', thumbnail: 'assets/invoice-templates/template2.svg', description: 'Bold header, compact lines' },
    { id: 3, name: 'Minimal', thumbnail: 'assets/invoice-templates/template3.svg', description: 'Whitespace-forward, minimalist' }
  ];

  isDownloading = false;

  constructor(private readonly templatesService: InvoiceTemplateService, private readonly dialog: MatDialog) {}

  preview(template: TemplateItem): void {
    this.dialog.open(PreviewDialogComponent, {
      width: '95vw',
      maxWidth: '1100px',
      data: { template }
    });
  }

  downloadPdf(template: TemplateItem): void {
    this.isDownloading = true;
    this.templatesService.generateTemplatePdf(template.id)
      .subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `invoice-template-${template.id}.pdf`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
          this.isDownloading = false;
        },
        error: () => {
          // TODO: better error handling/snackbar
          this.isDownloading = false;
        }
      });
  }
}

@Injectable({ providedIn: 'root' })
export class InvoiceTemplateService {
  generateTemplatePdf(id: number): Observable<Blob> {
    // minimal stub implementation for compile-time correctness;
    // replace with a real HttpClient implementation that returns the PDF blob.
    return of(new Blob());
  }
}

// Preview dialog component (kept local to the feature)
import { Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-invoice-template-preview',
  standalone: true,
  imports: [CommonModule, InvoiceTemplatePreviewRendererComponent],
  template: `
    <div class="preview-root">
      <h3>{{data.template.name}}</h3>
      <div class="preview-frame">
        <app-invoice-template-preview-renderer [template]="data.template"></app-invoice-template-preview-renderer>
      </div>
      <p class="desc">{{data.template.description}}</p>
      <div class="actions">
        <button mat-stroked-button mat-dialog-close>Close</button>
      </div>
    </div>
  `,
  styles: [
    `
    .preview-root { padding: 16px; text-align: center; }
  .preview-frame { border: 1px solid var(--divider); padding: 12px; background: var(--surface-card); display:flex; justify-content:center; }
    .preview-frame app-invoice-template-preview-renderer { width: 100%; }
    .desc { color: #666; margin-top: 8px }
    .actions { margin-top: 12px }
    `
  ]
})
export class PreviewDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { template: TemplateItem }) {}
}
