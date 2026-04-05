import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = this.resolveApiUrl();

  private tokenKey = 'auth_token';
  private refreshTokenKey = 'refresh_token';

  constructor(private http: HttpClient) {}

  private resolveApiUrl(): string {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:3000/auth';
    }
    return '/auth';
  }

  // ────────────────────────────────────────────────
  // Connexion
  // ────────────────────────────────────────────────
  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(response => {
        if (response?.success && response?.data?.access_token) {
          this.storeTokens(response.data.access_token, response.data.refresh_token);
        }
      }),
      catchError(this.handleError('login'))
    );
  }

  // ────────────────────────────────────────────────
  // Déconnexion
  // ────────────────────────────────────────────────
  logout(): Observable<any> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      this.clearTokens();
      return of({ success: true, message: 'Déconnexion réussie (aucun token trouvé)' });
    }

    return this.http.post<any>(`${this.apiUrl}/logout`, { refresh_token: refreshToken }).pipe(
      tap(() => this.clearTokens()),
      catchError(err => {
        this.clearTokens();
        return of({ success: true, message: 'Déconnexion locale effectuée' });
      })
    );
  }

  // ────────────────────────────────────────────────
  // Rafraîchissement du token
  // ────────────────────────────────────────────────
  refreshToken(): Observable<any> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('Aucun refresh token disponible'));
    }

    return this.http.post<any>(`${this.apiUrl}/refresh`, { refresh_token: refreshToken }).pipe(
      tap(response => {
        if (response?.access_token) {
          this.storeTokens(response.access_token, response.refresh_token || refreshToken);
        }
      }),
      catchError(this.handleError('refreshToken'))
    );
  }

  // ────────────────────────────────────────────────
  // Vérification token
  // ────────────────────────────────────────────────
  verifyToken(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/verify`).pipe(
      catchError(this.handleError('verifyToken'))
    );
  }

  // ────────────────────────────────────────────────
  // Statut du mot de passe
  // ────────────────────────────────────────────────
   // ====================== FRONTEND - auth.service.ts ======================
  getPasswordStatus(): Observable<{ needsPasswordChange: boolean; blocked: boolean }> {
    return this.http.get<any>(`${this.apiUrl}/password-status`).pipe(
      map(response => {
        const data = response?.data || response || {};
        return {
          needsPasswordChange: !!data.needsPasswordChange,
          blocked: !!data.blocked,
        };
      }),
      catchError((err: HttpErrorResponse) => {
        console.warn('getPasswordStatus failed', err);

        // IMPORTANT : En cas d'erreur 401 (token non valide ou pas encore connecté)
        // On retourne false pour NE PAS afficher le popup, surtout pour l'admin
        if (err.status === 401) {
          return of({
            needsPasswordChange: false,
            blocked: false,
          });
        }

        // Pour les autres erreurs, on considère par sécurité qu'il faut changer
        return of({
          needsPasswordChange: true,
          blocked: false,
        });
      })
    );
  }

  // ────────────────────────────────────────────────
  // Changement de mot de passe (classique + forcé)
  // ────────────────────────────────────────────────
  changePassword(payload: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
    captchaAnswer: string;
    isNotRobot: boolean;
    updateKeycloak?: boolean;
    updateDatabase?: boolean;
    disableTemporaryPasswordBlock?: boolean;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/change-password`, payload).pipe(
      catchError(this.handleError('changePassword'))
    );
  }

  validateCurrentPassword(payload: {
    currentPassword: string;
  }): Observable<{
    valid: boolean;
    canUseAsCurrentPassword: boolean;
    unlockNewPasswordFields: boolean;
    message?: string;
  }> {
    return this.http.post<any>(`${this.apiUrl}/validate-current-password`, payload).pipe(
      map((response) => {
        const data = response?.data || response || {};
        return {
          valid: !!data.valid,
          canUseAsCurrentPassword: !!data.canUseAsCurrentPassword,
          unlockNewPasswordFields: !!data.unlockNewPasswordFields,
          message: data.message,
        };
      }),
      catchError(this.handleError('validateCurrentPassword'))
    );
  }

  requestPasswordReset(payload: {
    email: string;
    role: 'teacher' | 'student';
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/forgot-password`, payload).pipe(
      catchError(this.handleError('requestPasswordReset'))
    );
  }

  validatePasswordResetToken(token: string): Observable<{
    valid: boolean;
    role: 'teacher' | 'student';
    email: string;
    name: string;
  }> {
    return this.http.get<any>(`${this.apiUrl}/reset-password/validate`, {
      params: { token }
    }).pipe(
      map((response) => {
        const data = response?.data || response || {};
        return {
          valid: !!data.valid,
          role: data.role,
          email: data.email,
          name: data.name,
        };
      }),
      catchError(this.handleError('validatePasswordResetToken'))
    );
  }

  resetForgottenPassword(payload: {
    token: string;
    newPassword: string;
    confirmPassword: string;
    captchaAnswer: string;
    isNotRobot: boolean;
    updateKeycloak?: boolean;
    updateDatabase?: boolean;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/reset-password`, payload).pipe(
      catchError(this.handleError('resetForgottenPassword'))
    );
  }

  // ────────────────────────────────────────────────
  // Profil utilisateur
  // ────────────────────────────────────────────────
  getProfile(): Observable<any> {
    if (!this.getToken()) {
      return of({ data: {} });
    }

    return this.http.get<any>(`${this.apiUrl}/profile`).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401) {
          return of({ data: {} });
        }

        return this.handleError('getProfile')(err);
      })
    );
  }

  updateProfile(profileData: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/profile`, profileData).pipe(
      catchError(this.handleError('updateProfile'))
    );
  }

  // ────────────────────────────────────────────────
  // Gestion des utilisateurs (Admin)
  // ────────────────────────────────────────────────
  getUsers(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/users`).pipe(
      catchError(this.handleError('getUsers'))
    );
  }

  createUser(userData: {
    name?: string;
    email: string;
    role: 'teacher' | 'student';
    password?: string;
    username: string;
    firstName?: string;
    lastName?: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/users`, userData).pipe(
      catchError(this.handleError('createUser'))
    );
  }

  updateUser(
    userId: number | string,
    userData: {
      name?: string;
      email: string;
      role: 'teacher' | 'student';
      username?: string;
      firstName?: string;
      lastName?: string;
    }
  ): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/users/${userId}`, userData).pipe(
      catchError(this.handleError('updateUser'))
    );
  }

  deleteUser(userId: number | string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/users/${userId}`).pipe(
      catchError(this.handleError('deleteUser'))
    );
  }

  // ────────────────────────────────────────────────
  // Gestion des tokens
  // ────────────────────────────────────────────────
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  private storeTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(this.tokenKey, accessToken);
    localStorage.setItem(this.refreshTokenKey, refreshToken);
  }

  clearTokens(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
  }

  // ────────────────────────────────────────────────
  // Gestion des erreurs
  // ────────────────────────────────────────────────
  private handleError(operation = 'operation') {
    return (error: HttpErrorResponse): Observable<never> => {
      const isExpectedLoginFailure = operation === 'login' && error.status === 401;
      const isExpectedVerifyFailure = operation === 'verifyToken' && error.status === 401;

      if (!isExpectedLoginFailure && !isExpectedVerifyFailure) {
        console.error(`${operation} failed:`, error);
      }

      return throwError(() => error);
    };
  }
} 
