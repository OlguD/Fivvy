import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { finalize, take } from 'rxjs';
import { ProfileService, UpdatePasswordPayload, UpdateProfilePayload, UserProfile } from '../../core/profile.service';

interface ProfilePreference {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
}

const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const newPassword = control.get('newPassword')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  if (!newPassword || !confirmPassword) {
    return null;
  }

  return newPassword === confirmPassword ? null : { mismatch: true };
};

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatChipsModule,
    MatTooltipModule
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  readonly initials = signal<string>('--');
  readonly fullName = signal<string>('Loading user...');
  readonly planBadge = signal<string>('Member');
  readonly joinDate = signal<string>('--');

  readonly expertiseTags = ['Product Strategy', 'SaaS GTM', 'Team Ops'];

  readonly profileForm: FormGroup;
  readonly passwordForm: FormGroup;

  isSavingProfile = signal(false);
  isSavingPassword = signal(false);
  private initialProfileData: ProfileFormValue | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly profileService: ProfileService
  ) {
    this.profileForm = this.fb.group({
      username: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      surname: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
      bio: new FormControl('', { nonNullable: true })
    });

    this.passwordForm = this.fb.group({
      newPassword: new FormControl('', { nonNullable: true, validators: Validators.required }),
      confirmPassword: new FormControl('', { nonNullable: true, validators: Validators.required })
    }, { validators: passwordMatchValidator });
  }

  ngOnInit(): void {
    this.loadProfile();
  }


  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSavingProfile.set(true);
    const { username, name, surname, email } = this.profileForm.getRawValue();
    const payload: UpdateProfilePayload = { username, name, surname, email };

    this.profileService.updateProfile(payload)
      .pipe(
        take(1),
        finalize(() => this.isSavingProfile.set(false))
      )
      .subscribe({
        next: user => {
          this.applyProfile(user);
          this.initialProfileData = this.profileForm.getRawValue() as ProfileFormValue;
        },
        error: error => {
          console.error('Profile update failed', error);
        }
      });
  }

  savePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.isSavingPassword.set(true);
    const { newPassword, confirmPassword } = this.passwordForm.getRawValue();
    const payload: UpdatePasswordPayload = { newPassword, confirmPassword };

    this.profileService.updatePassword(payload)
      .pipe(
        take(1),
        finalize(() => this.isSavingPassword.set(false))
      )
      .subscribe({
        next: () => {
          this.passwordForm.reset({ newPassword: '', confirmPassword: '' });
          this.passwordForm.markAsPristine();
          this.passwordForm.markAsUntouched();
          this.passwordForm.updateValueAndValidity();
        },
        error: error => {
          console.error('Password update failed', error);
        }
      });
  }

  resetProfileForm(): void {
    if (this.initialProfileData) {
      this.profileForm.reset(this.initialProfileData);
    } else {
      this.profileForm.reset({ username: '', name: '', surname: '', email: '', bio: '' });
    }
    this.profileForm.markAsPristine();
    this.profileForm.markAsUntouched();
  }

  private loadProfile(): void {
    this.profileService.getProfile()
      .pipe(take(1))
      .subscribe({
        next: user => {
          this.applyProfile(user);
          this.initialProfileData = this.profileForm.getRawValue() as ProfileFormValue;
        },
        error: error => {
          console.error('Profile retrieval failed', error);
        }
      });
  }

  private applyProfile(user: UserProfile): void {
    this.profileForm.patchValue({
      username: user.username ?? '',
      name: user.name ?? '',
      surname: user.surname ?? '',
      email: user.email ?? ''
    });

    this.fullName.set(this.composeFullName(user));
    this.initials.set(this.composeInitials(user));
    this.planBadge.set(this.formatRole(user.role));
    this.joinDate.set(this.formatJoinDate(user.createdAt));
  }

  private composeFullName(user: UserProfile): string {
    const name = user.name?.trim() ?? '';
    const surname = user.surname?.trim() ?? '';
    const fullName = `${name} ${surname}`.trim();
    return fullName || user.username;
  }

  private composeInitials(user: UserProfile): string {
    const parts = [user.name, user.surname]
      .filter(Boolean)
      .map(value => value!.trim())
      .filter(value => value.length > 0)
      .map(value => value[0]?.toUpperCase() ?? '');

    if (parts.length === 0) {
      return user.username?.slice(0, 2).toUpperCase() ?? '--';
    }

    return parts.join('');
  }

  private formatRole(role: string): string {
    if (!role) {
      return 'Member';
    }

    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  }

  private formatJoinDate(createdAt: string): string {
    if (!createdAt) {
      return '--';
    }

    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) {
      return '--';
    }

    const formatted = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(date);
    return `Joined ${formatted}`;
  }
}

interface ProfileFormValue {
  username: string;
  name: string;
  surname: string;
  email: string;
  bio: string;
}
