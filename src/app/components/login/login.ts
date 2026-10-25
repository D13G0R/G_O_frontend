import { ChangeDetectorRef, Component } from '@angular/core';
import { FormControl, FormGroup, ɵInternalFormsSharedModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { LoginPayload } from '../../model/interfaces';
import { LoginService } from './login.service';
import { ToastMessage } from '../toast-message/toast-message';
import { AuthService } from '../../service/Auth/auth.service';

@Component({
  selector: 'app-login',
  imports: [RouterLink, ɵInternalFormsSharedModule, ReactiveFormsModule, ToastMessage],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {

  errorLogin = false;
  errorLoginMessage = "";

  loginForm: FormGroup;

  email: FormControl;
  password: FormControl;

  constructor(
    private loginService: LoginService,
    private router: Router,
    private changeDetectorRef: ChangeDetectorRef,
    private authService: AuthService,
  ) {

    
    this.email = new FormControl("");
    this.password = new FormControl("");

    this.loginForm = new FormGroup({
      email: this.email,
      password: this.password
    })
  }
  showPassword = false;

  login() {

    const payload: LoginPayload = {
      email: this.loginForm.get("email")?.value,
      password: this.loginForm.get("password")?.value
    }

    this.loginService.login(payload).subscribe({
      next:(data) => {
        localStorage.setItem('token', data.token);
        this.router.navigate([
          this.authService.isTechnician() ? '/technician-mobile' : '/appointments',
        ]);
      },
      error:(error) => {

        this.errorLogin = true;
        this.errorLoginMessage =
          error?.error?.message ||
          'No se pudo iniciar sesión. Verifica tus credenciales e inténtalo nuevamente.';
        this.changeDetectorRef.markForCheck();

      }
    })

  }

}
