import { Component } from '@angular/core';
import { FormControl, FormControlName, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RegisterService } from './register.service';
import { RouterLink } from '@angular/router';
import { UserPayload } from '../../model/interfaces';
import { Router } from '@angular/router';
import { ToastMessage } from '../../toast-message/toast-message';
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, RouterLink, ToastMessage],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  userForm: FormGroup;

  phoneNumberId: FormControl;
  password: FormControl;
  businessName: FormControl;
  ownerName: FormControl;
  email: FormControl;
  confirmPassword: FormControl;
  terms: FormControl;

  error: boolean = false;
  errorMessage: string = "";


  constructor(private registerService: RegisterService, private router: Router) {
    this.businessName = new FormControl('', Validators.required);
    this.ownerName = new FormControl('', Validators.required);
    this.phoneNumberId = new FormControl('', Validators.required);
    this.email = new FormControl('', [
      Validators.required,
      Validators.email
    ]);
    this.password = new FormControl('', Validators.required);
    this.confirmPassword = new FormControl('', Validators.required);
    this.terms = new FormControl(false, Validators.requiredTrue);

    this.userForm = new FormGroup({
      businessName: this.businessName,
      ownerName: this.ownerName,
      phoneNumberId: this.phoneNumberId,
      email: this.email,
      password: this.password,
      confirmPassword: this.confirmPassword,
      terms: this.terms
    });
  }

  userRegister() {

    const passwordConfir = this.userForm.get("confirmPassword")?.value;
    const password = this.userForm.get("password")?.value;

    if (passwordConfir != password) {
      this.error = true;
      this.errorMessage = "Las contraseñas no coinciden";

      setTimeout(() => {
        this.error = false;
      }, 4000);

      return;
    }

    const payload: UserPayload = {
      businessName: this.userForm.get("businessName")?.value,
      ownerName: this.userForm.get("ownerName")?.value,
      phoneNumberId: this.userForm.get("phoneNumberId")?.value,
      email: this.userForm.get("email")?.value,
      password: this.userForm.get("password")?.value
    }

    this.registerService.register(payload).subscribe({
      next: (message) => {
        alert(message);
        this.router.navigate(['/login']);
      },
      error: () => {
        this.error = true;
        this.errorMessage = "Ocurrio un error insesperado, por favor contactate al numero 3111231234 para darle manejo";
        setTimeout(() => {
        this.error = false;
      }, 4000);

        return;
      }
    })
  }
}
