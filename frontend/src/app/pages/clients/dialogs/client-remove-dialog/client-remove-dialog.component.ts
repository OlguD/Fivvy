import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ClientDto } from '../../clients.types';

export interface ClientRemoveDialogData {
  client: ClientDto;
}

@Component({
  selector: 'app-client-remove-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  templateUrl: './client-remove-dialog.component.html',
  styleUrls: ['./client-remove-dialog.component.css']
})
export class ClientRemoveDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<ClientRemoveDialogComponent, boolean>);
  private readonly data = inject<ClientRemoveDialogData>(MAT_DIALOG_DATA);

  readonly clientName = this.data.client.companyName;

  cancel(): void {
    this.dialogRef.close(false);
  }

  confirm(): void {
    this.dialogRef.close(true);
  }
}
