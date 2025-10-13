import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, ValidatorFn, AbstractControl } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../../core/auth.service';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ThemeToggleComponent } from '../../../shared/ui/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    RouterLink,
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnDestroy {
  registerForm!: FormGroup;
  submitError: string | null = null;
  private readonly destroy$ = new Subject<void>();
  passwordVisible = false;
  confirmPasswordVisible = false;

  private readonly passwordMatchValidator: ValidatorFn = (group: AbstractControl) => {
    const passwordControl = group.get('password');
    const confirmControl = group.get('validatePassword');

    if (!passwordControl || !confirmControl) {
      return null;
    }

    const existingErrors = confirmControl.errors ?? {};

    if (passwordControl.value !== confirmControl.value) {
      confirmControl.setErrors({ ...existingErrors, mismatch: true });
    } else {
      if (existingErrors['mismatch']) {
        const { mismatch, ...rest } = existingErrors;
        const hasOtherErrors = Object.keys(rest).length > 0;
        confirmControl.setErrors(hasOtherErrors ? rest : null);
      }
    }
    return null;
  };

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router){}

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      username: ['', Validators.required],
      name: ['', Validators.required],
      surname: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      validatePassword: ['', Validators.required],
    }, { validators: this.passwordMatchValidator });

    this.resetDuplicateOnChange('username');
    this.resetDuplicateOnChange('email');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.submitError = null;

    const payload = {
      username: this.registerForm.value.username,
      name: this.registerForm.value.name,
      surname: this.registerForm.value.surname,
      email: this.registerForm.value.email,
      password: this.registerForm.value.password,
      validatePassword: this.registerForm.value.validatePassword,
    };

    this.auth.register(payload).subscribe({
      next: () => {
        this.router.navigate(['/auth/login']);
      },

      error: (err: HttpErrorResponse) => {
        console.error(err);
        const { message, field } = this.resolveError(err);

        if (err.status === 409 && field) {
          this.applyDuplicateError(field);
        }

        this.submitError = message;
      }
    });
  }

  private resolveError(error: HttpErrorResponse | null): { message: string; field?: string } {
    const fallbackMessage = 'Registration failed. Please try again.';

    if (!error) {
      return { message: fallbackMessage };
    }

    const errorBody = error.error;

    if (!errorBody) {
      return { message: fallbackMessage };
    }

    if (typeof errorBody === 'string') {
      return { message: errorBody };
    }

    if (Array.isArray(errorBody)) {
      return { message: errorBody.join(' ') };
    }

    if (typeof errorBody === 'object') {
      const field = 'field' in errorBody ? (errorBody.field as string | undefined) : undefined;
      const message = (errorBody.title as string) || (errorBody.message as string) || fallbackMessage;
      return { message, field };
    }

    return { message: fallbackMessage };
  }

  private applyDuplicateError(controlName: string): void {
    const control = this.registerForm.get(controlName);

    if (!control) {
      return;
    }

    const existingErrors = control.errors ?? {};

    control.setErrors({ ...existingErrors, duplicate: true });
    control.markAsTouched();
  }

  private resetDuplicateOnChange(controlName: string): void {
    const control = this.registerForm?.get(controlName);

    if (!control) {
      return;
    }

    control.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (!control.errors || !('duplicate' in control.errors)) {
        return;
      }

      const { duplicate, ...otherErrors } = control.errors as Record<string, any>;
      const hasOtherErrors = Object.keys(otherErrors).length > 0;
      control.setErrors(hasOtherErrors ? otherErrors : null);
      if (this.submitError && this.submitError.toLowerCase().includes('already')) {
        this.submitError = null;
      }
    });
  }

  togglePasswordVisibility(target: 'password' | 'confirm'): void {
    if (target === 'password') {
      this.passwordVisible = !this.passwordVisible;
      return;
    }

    this.confirmPasswordVisible = !this.confirmPasswordVisible;
  }
}
