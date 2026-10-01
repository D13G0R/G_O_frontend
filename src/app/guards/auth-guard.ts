import { inject } from '@angular/core';
import { Token } from '@angular/compiler';
import { CanActivateFn, Router } from '@angular/router';
import { TokenService } from '../service/token/token';


export const authGuard: CanActivateFn = () => {

  const router = inject(Router);
  const tokenService = inject(TokenService);

  if (tokenService.isTokenValid()) {
    return true;
  }

  tokenService.removeToken();

  return router.createUrlTree(['/login']);
};
