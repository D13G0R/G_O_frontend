import { Routes } from '@angular/router';
import { Register } from './components/register/register';
import { Login } from './components/login/login';
import { Appointments } from './components/appointments/appointments';
import { BusinessConfiguration } from './components/business-configuration/business-configuration'
import { TechnicianMobile } from './components/technician-mobile/technician-mobile';
import { PaymentValidation } from './components/payment-validation/payment-validation';
import { RegisterTechnician } from './components/register-technician/register-technician';
import { authGuard } from './guards/auth-guard';
import { ownerGuard, technicianViewGuard } from './guards/role-guard';


export const routes: Routes = [
    {
        path: 'register',
        component: Register
    },
    {
        path: 'login',
        component : Login
    },
    {
        path: 'appointments',
        component : Appointments,
        canActivate: [authGuard, ownerGuard]
    },
    {
        path: "business-configuration",
        component: BusinessConfiguration,
        canActivate: [authGuard, ownerGuard]
    },
    {
        path: "payment-validation",
        component: PaymentValidation,
        canActivate: [authGuard, ownerGuard]
    },
    {
        path: "register-technician",
        component: RegisterTechnician,
        canActivate: [authGuard, ownerGuard]
    },
    {
        path: "technician-mobile",
        component: TechnicianMobile,
        canActivate: [authGuard, technicianViewGuard]
    },
    {
        path: '',
        redirectTo : 'login',
        pathMatch: 'full'
    }

];
