import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface DataTableColumn<T = any> {
  key: keyof T | string;
  label: string;
  type?: 'text' | 'date';
  format?: (value: any, item?: T) => string;
}

export interface DataTableAction<T = any> {
  label: string;
  icon: string;
  action: (item: T) => void;
  disabled?: (item: T) => boolean;
  ariaLabel?: (item: T) => string;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.css']
})
export class DataTableComponent<T = any> {
  @Input() data: T[] = [];
  @Input() columns: DataTableColumn<T>[] = [];
  @Input() actions: DataTableAction<T>[] = [];
  @Input() trackByFn: (index: number, item: T) => any = (index, item) => index;
  @Input() rowClassFn?: (item: T) => string;
  @Input() isItemBusyFn?: (item: T) => boolean;
  @Input() isLoading = false;

  @Output() rowClick = new EventEmitter<T>();

  onRowClick(item: T): void {
    this.rowClick.emit(item);
  }

  getCellValue(item: T, column: DataTableColumn<T>): string {
    const value = (item as any)[column.key];

    if (column.format) {
      return column.format(value, item);
    }

    if (column.type === 'date' && value) {
      return new Date(value).toLocaleDateString();
    }

    return value || '—';
  }

  isActionDisabled(action: DataTableAction<T>, item: T): boolean {
    return action.disabled ? action.disabled(item) : false;
  }

  getActionAriaLabel(action: DataTableAction<T>, item: T): string {
    return action.ariaLabel ? action.ariaLabel(item) : action.label;
  }
}