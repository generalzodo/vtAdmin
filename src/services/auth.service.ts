import { HttpClient } from '@angular/common/http';
import { EventEmitter, Injectable, Output } from '@angular/core';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Observable, of } from 'rxjs';
import { catchError, mapTo, tap } from 'rxjs/operators';

const baseUrl = {
  jwt_token: 'TP_TOKEN',
  refresh_token: 'TP_REFRESH',
  // server: 'http://localhost:4000/',
  server: 'https://required-malinde-zodostech-e7405a15.koyeb.app/api/',

  refresh: 'token/refresh/',

};

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  @Output() public sidenavToggle2 = new EventEmitter();
  private readonly JWT_TOKEN = baseUrl.jwt_token;
  private readonly REFRESH_TOKEN = baseUrl.refresh_token;
  private helper = new JwtHelperService();
  
  private base_url = baseUrl.server;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  login(user: any): Observable<boolean> {
    return this.http.post<any>(this.base_url + 'api/users/alogin', user).pipe(
      tap((res: any) => {
        this.storeTokens({ token: res?.token });
        localStorage.setItem('user', JSON.stringify(res.user))
        localStorage.setItem('userId', res.user._id)
        
      }),
      mapTo(true),
      catchError((error: any) => {
        return of(false);
      })
    );
  }

  register(user: any): Observable<boolean> {
    return this.http.post<any>(this.base_url + 'api/auth/sign-up', user).pipe(
      tap((tokens: any) => {
        // this.storeTokens({ token: tokens?.data?.token });
        console.log(tokens);
        
      }),
      mapTo(true),
      catchError((error: any) => {
        return of(false);
      })
    );
  }

  // check if user is login
  isLoggedIn() {
    this.checkExpired()
    return !!this.getJwtToken();
  }

  checkExpired() {
    const isExpired = this.helper.isTokenExpired(this.getJwtToken());
    if (isExpired) {
      this.logout();
    }
  }

  // refresh token
  refreshToken() {
    const data = {
      refresh: this.getRefreshToken(),
    };
    return this.http.post<any>(this.base_url + baseUrl.refresh, data).subscribe(
      (tokens: any) => {
        this.storeJwtToken(tokens.access);
        return true;
      },
      () => {
        return false;
      }
    );
  }

  getJwtToken(): any {
    return localStorage.getItem(this.JWT_TOKEN);
  }

  // logout user
  public logout() {
    console.log('sss');
    
    this.removeTokens();
    this.router.navigate(['/auth/login/']);
  }

  getRefreshToken(): any {
    return localStorage.getItem(this.REFRESH_TOKEN);
  }

  private storeJwtToken(jwt: string) {
    localStorage.setItem(this.JWT_TOKEN, jwt);
  }

  public storeTokens(tokens: any) {
    localStorage.setItem(this.JWT_TOKEN, tokens?.token);
  }

  private removeTokens() {
    localStorage.removeItem(this.JWT_TOKEN);
    localStorage.removeItem(this.REFRESH_TOKEN);
  }
}