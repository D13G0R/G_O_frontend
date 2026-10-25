import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../service/Auth/auth.service';
import { TokenService } from '../service/token/token';

function requireSession(router: Router, tokenService: TokenService): boolean {
  if (tokenService.isTokenValid()) {
    return true;
  }

  tokenService.removeToken();
  return false;
}

export const ownerGuard: CanActivateFn = () => {
  const router = inject(Router);
  const tokenService = inject(TokenService);
  const authService = inject(AuthService);

  if (!requireSession(router, tokenService)) {
    return router.createUrlTree(['/login']);
  }

  if (authService.isOwner()) {
    return true;
  }

  return router.createUrlTree([
    authService.isTechnician() ? '/technician-mobile' : '/login',
  ]);
};

export const technicianViewGuard: CanActivateFn = () => {
  const router = inject(Router);
  const tokenService = inject(TokenService);
  const authService = inject(AuthService);

  if (!requireSession(router, tokenService)) {
    return router.createUrlTree(['/login']);
  }

  if (authService.isOwner() || authService.isTechnician()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
