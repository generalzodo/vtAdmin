import { AuthService } from './../services/auth.service';
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})

// export const authGuard: CanActivateFn = (route, state) => {
//   return true;
// };

export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  canActivate() {
    if (this.authService.isLoggedIn()) {

      return this.authService.isLoggedIn()
    }
    this.router.navigate(['/login']);
    return !this.authService.isLoggedIn();
  }
}