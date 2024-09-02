import { Routes } from '@angular/router';
import { SignupComponent } from './signup/signup.component';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { authGuard } from './auth.guard';

export const routes: Routes = [
    {
        path: '', redirectTo: 'dashboard', pathMatch: 'full'
    },
    {
        path: 'dashboard', 
        component: DashboardComponent, canActivate:[authGuard]
    },
    {
        path: 'login', 
        component: LoginComponent
    },
    {
        path: 'signup', 
        component: SignupComponent
    },
    {
        path: '**', 
        redirectTo: 'dashboard'
    },
];
