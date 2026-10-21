import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { throwError } from 'rxjs';
import { vi } from 'vitest';

import { Login } from './login';
import { LoginService } from './login.service';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let loginService: { login: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    loginService = { login: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([]),
        { provide: LoginService, useValue: loginService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the toast immediately after a failed login response', async () => {
    loginService.login.mockReturnValue(
      throwError(() => ({ error: { message: 'Credenciales incorrectas' } })),
    );
    component.loginForm.setValue({
      email: 'usuario@example.com',
      password: 'incorrecta',
    });

    component.login();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain(
      'Credenciales incorrectas',
    );
  });
});
