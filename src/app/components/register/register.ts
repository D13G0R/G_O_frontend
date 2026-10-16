import { Component } from '@angular/core';
import {
  FormControl,
  FormControlName,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RegisterService } from './register.service';
import { RouterLink } from '@angular/router';
import { RegisterRequest } from '../../model/interfaces';
import { Router } from '@angular/router';
import { ToastMessage } from '../toast-message/toast-message';
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, RouterLink, ToastMessage],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  userForm: FormGroup;

  fullName: FormControl;
  phoneNumber: FormControl;
  email: FormControl;
  idCard: FormControl;
  password: FormControl;
  businessName: FormControl;
  confirmPassword: FormControl;
  businessPhoneNumber: FormControl;
  terms: FormControl;

  error: boolean = false;
  errorMessage: string = '';

  constructor(
    private registerService: RegisterService,
    private router: Router,
  ) {
    this.fullName = new FormControl('');
    this.phoneNumber = new FormControl('', Validators.required);
    this.email = new FormControl('', [Validators.required, Validators.email]);
    this.idCard = new FormControl('', Validators.required);
    this.password = new FormControl('', Validators.required);
    this.businessName = new FormControl('', Validators.required);
    this.businessPhoneNumber = new FormControl('', Validators.required);
    this.confirmPassword = new FormControl('', Validators.required);
    this.terms = new FormControl(false, Validators.requiredTrue);

    this.userForm = new FormGroup({
      fullName: this.fullName,
      phoneNumber: this.phoneNumber,
      email: this.email,
      idCard: this.idCard,
      password: this.password,
      businessName: this.businessName,
      businessPhoneNumber: this.businessPhoneNumber,
      confirmPassword: this.confirmPassword,
      terms: this.terms,
    });
  }

  userRegister() {
    const passwordConfir = this.userForm.get('confirmPassword')?.value;
    const password = this.userForm.get('password')?.value;

    if (passwordConfir != password) {
      this.errorMessage = 'Las contraseñas no coinciden';
      this.error = true;

      return;
    }

    const payload: RegisterRequest = {
      fullName: this.userForm.get('fullName')?.value,
      phoneNumber: this.userForm.get('phoneNumber')?.value,
      email: this.userForm.get('email')?.value,
      idCard: this.userForm.get('idCard')?.value,
      password: this.userForm.get('password')?.value,
      businessName: this.userForm.get('businessName')?.value,
      businessPhoneNumber: this.userForm.get('businessPhoneNumber')?.value,
    };

    this.registerService.register(payload).subscribe({
      next: (message) => {
        alert(message.value);
        this.router.navigate(['/login']);
      },
      error: (err) => {
        const backendError = err.error;
        let mensajeFinal = '';

        if (backendError && typeof backendError === 'object') {
          const keys = Object.keys(backendError);
          mensajeFinal = keys.length > 0 ? backendError[keys[0]] : 'Error de validación';
        } else if (typeof backendError === 'string') {
          mensajeFinal = backendError;
        }

        this.errorMessage = mensajeFinal;
        this.error = true;
      }
    });
  }
}
