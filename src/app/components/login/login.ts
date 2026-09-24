import { Component } from '@angular/core';
import { FormControl, FormGroup, ɵInternalFormsSharedModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { LoginPayload } from '../../model/interfaces';
import { LoginService } from './login.service';

@Component({
  selector: 'app-login',
  imports: [RouterLink, ɵInternalFormsSharedModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {

  loginForm: FormGroup;

  phoneNumber: FormControl;
  password: FormControl;

  constructor(private loginService: LoginService, private router: Router) {

    this.phoneNumber = new FormControl("");
    this.password = new FormControl("");

    this.loginForm = new FormGroup({
      phoneNumber: this.phoneNumber,
      password: this.password
    })
  }
  showPassword = false;

  login() {

    const payload: LoginPayload = {
      phoneNumber: this.loginForm.get("phoneNumber")?.value,
      password: this.loginForm.get("password")?.value
    }

    this.loginService.login(payload).subscribe({
      next:(data) => {
        console.log(data);
        localStorage.setItem('token', data.token);
        this.router.navigate(["/appointments"]);
      },
      error:(error) => {
        alert("Hubo un problema al iniciar session: "+ error);
      }
    })

  }

}
