import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ClientsComponent } from './pages/clients/clients.component';
import { ProjectsComponent } from './pages/projects/projects.component';
import { InvoicesComponent } from './pages/invoices/invoices.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { LoginComponent } from './pages/auth/login/login.component';
import { RegisterComponent } from './pages/auth/register/register.component';
import { authGuard } from './core/auth.guard';
import { AppShellComponent } from './layout/app-shell/app-shell.component';
import { AdminUsersComponent } from './pages/admin/admin-users/admin-users.component';
import { adminGuard } from './core/admin.guard';

export const routes: Routes = [
    { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
    { path: 'auth/login', component: LoginComponent },
    { path: 'auth/register', component: RegisterComponent },
    {
        path: '',
        component: AppShellComponent,
        canActivateChild: [authGuard],
        children: [
            { path: 'dashboard', component: DashboardComponent },
            { path: 'clients', component: ClientsComponent },
            { path: 'projects', component: ProjectsComponent },
            { path: 'invoices', component: InvoicesComponent },
            { path: 'profile', component: ProfileComponent },
            { path: 'admin/users', component: AdminUsersComponent, canActivate: [adminGuard] }
        ]
    },
    { path: '**', redirectTo: 'dashboard' }
];
