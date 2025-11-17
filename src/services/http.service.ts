import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, of, retry, shareReplay } from 'rxjs';
import { AuthService } from './auth.service';

const baseUrl = {
  jwt_token: 'TP_TOKEN',
  refresh_token: 'TP_REFRESH',
  server: 'http://localhost:4000/api/',

  // server: 'https://vtserver-okhz.onrender.com/api/',

  refresh: 'token/refreshs/',

};

@Injectable({
  providedIn: 'root'
})

// Don’t reply this message.
export class HttpService {
  private base_url = baseUrl.server;
  private httpOptions = {
    headers: {
      Authorization: `Bearer ${this.authService.getJwtToken()}`,
    },
  };
  constructor(private http: HttpClient, private authService: AuthService) {}

  getToken(){
    this.httpOptions = {
      headers: {
        Authorization: `Bearer ${this.authService.getJwtToken()}`,
      },
    };
  }

  getSingleNoAuth(endpoint: any) {
    return this.http.get(this.base_url + endpoint).pipe(retry(1), shareReplay());
  }

 

  getSingleNoAuthID(endpoint: any, id: any) {
    return this.http.get(this.base_url + endpoint + id).pipe(retry(1));
  }

  postData(endpoint: any, data: any): Observable<any[]> {
    return this.http
      .post<any[]>(this.base_url + endpoint, data)
  }

  postAuthData(endpoint: any, data: any): Observable<any[]> {
    this.getToken()
    return this.http
      .post<any[]>(this.base_url + endpoint, data, this.httpOptions)
  }

  getData(endpoint: any): Observable<any[]> {
    return this.http
      .get<any[]>(this.base_url + endpoint)
      .pipe(retry(1), shareReplay());
  }

  getAuthData(endpoint: any): Observable<any[]> {
    this.getToken()
    return this.http
      .get<any[]>(this.base_url + endpoint, this.httpOptions)
      .pipe(retry(1), shareReplay());
  }

  getAuthSingleID(endpoint: any, id: any): Observable<any[]> {
    this.getToken()
    return this.http
      .get<any[]>(this.base_url + endpoint + id, this.httpOptions)
      .pipe(retry(1), shareReplay());
  }

  updateData(endpoint: any, data: any): Observable<any[]> {
    this.getToken()
    return this.http
      .patch<any[]>(this.base_url + endpoint, data, this.httpOptions)
      .pipe(retry(1));
  }

  updatePutData(endpoint: any, data: any): Observable<any[]> {
    this.getToken()
    return this.http
      .put<any[]>(this.base_url + endpoint, data, this.httpOptions)
      .pipe(retry(1));
  }

  deleteData(endpoint: any, id: any): Observable<any[]> {
    this.getToken()
    return this.http.delete<any[]>(
      this.base_url + endpoint + id,
      this.httpOptions
    );
  }
}
