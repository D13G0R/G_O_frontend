import { Routes } from '@angular/router';
import {Register} from './components/register/register';
import { Login } from './components/login/login';
import { Appointments } from './components/appointments/appointments';


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
        component : Appointments
    },
    {
        path: '',
        redirectTo : 'login',
        pathMatch: 'full'
    }

];
