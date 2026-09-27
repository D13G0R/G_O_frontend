import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { AuthInformation } from '../../model/interfaces';

@Injectable({
  providedIn: 'root',
})

export class AuthService {

  getToken(): string | null {
    return localStorage.getItem("token")
  }

  // 2. Decodificar el token completo
  getUserData(): AuthInformation | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      return jwtDecode<AuthInformation>(token);
    } catch (error) {
      console.error('Error al decodificar el token', error);
      return null;
    }
  }

  // 3. Método auxiliar para sacar directamente el negocioId
  getBusinessId(): number | null {
    const userData = this.getUserData();
    return userData ? userData.businessId : null;
  }
}
