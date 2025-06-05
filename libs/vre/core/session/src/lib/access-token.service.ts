import { Injectable } from '@angular/core';
import { Auth } from '@dasch-swiss/vre/core/config';
import jwt_decode, { JwtPayload } from 'jwt-decode';

@Injectable({ providedIn: 'root' })
export class AccessTokenService {
  getAccessToken(): string | null {
    return localStorage.getItem(Auth.AccessToken);
  }

  storeToken(token: string): void {
    localStorage.setItem(Auth.AccessToken, token);
    this.startTokenRefresh();
  }

  removeTokens(): void {
    localStorage.removeItem(Auth.AccessToken);
    localStorage.removeItem(Auth.Refresh_token);
  }

  private isTokenExpired(token: JwtPayload): boolean {
    const date = this.getTokenExpirationDate(token);
    if (date == null) {
      return false;
    }

    return date.setSeconds(date.getSeconds() - 30).valueOf() <= new Date().valueOf();
  }

  private getTokenExpirationDate(decoded: JwtPayload): Date | null {
    if (decoded.exp === undefined) {
      return null;
    }

    const date = new Date(0);
    date.setUTCSeconds(decoded.exp);

    return date;
  }

  private getTokenExp(token: string): number {
    const decoded = jwt_decode<JwtPayload>(token);

    if (decoded.exp === undefined) {
      return 0;
    }

    return decoded.exp;
  }

  private startTokenRefresh() {
    const token = this.getAccessToken();

    if (!token) {
      return;
    }

    const exp = this.getTokenExp(token);
    const date = new Date(0);
    date.setUTCSeconds(exp);
  }

  getTokenUser(): string | null {
    const token = this.getAccessToken();
    if (!token) {
      return null;
    }

    const decodedToken = this.decodedAccessToken(token);
    if (!decodedToken || !decodedToken.sub) {
      return null;
    }

    return decodedToken.sub;
  }

  decodedAccessToken(token: string): JwtPayload | null {
    try {
      return jwt_decode<JwtPayload>(token);
    } catch (e) {
      return null;
    }
  }

  isValidToken(decoded: JwtPayload): boolean {
    if (decoded === null) {
      return false;
    }
    return this.isTokenExpired(decoded) && decoded.sub !== undefined;
  }
}
