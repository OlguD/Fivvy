import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { InvoicesComponent } from './invoices.component';
import { InvoicesService } from './invoices.service';
import { ClientsService } from '../clients/clients.service';

describe('InvoicesComponent', () => {
  let component: InvoicesComponent;
  let fixture: ComponentFixture<InvoicesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvoicesComponent],
      providers: [
        {
          provide: InvoicesService,
          useValue: {
            getInvoices: () => of([]),
            createInvoice: () => of(void 0),
            updateInvoice: () => of(void 0),
            deleteInvoice: () => of(void 0)
          }
        },
        {
          provide: ClientsService,
          useValue: {
            getClients: () => of([])
          }
        },
        {
          provide: MatSnackBar,
          useValue: {
            open: () => void 0
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvoicesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
