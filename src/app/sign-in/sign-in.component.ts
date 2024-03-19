import { AuthService } from './../../services/auth.service';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';

@Component({
	templateUrl: './sign-in.component.html',
	providers: [MessageService]
})
export class SignInComponent {

	rememberMe: boolean = false;
	loginForm: any;
	loading: boolean =  false;
	submitted: boolean = false;

	constructor(private service: MessageService, private auth: AuthService, private router: Router, private fb: FormBuilder) {
		this.loginForm = this.fb.group({
			email: [undefined, Validators.required],
			password: [undefined, Validators.required],
		  })
	}

	get f() { return this.loginForm.controls; }

	login(){

		this.submitted = true
		if (this.loginForm.invalid) {
		  return;
		}
		this.loading = true;
		this.auth.login(this.loginForm.value).subscribe(
		  (res: any)=>{
				if(res){

					this.service.add({ key: 'tst', severity: 'success', summary: 'Successful', detail: 'Logging in....' });
					this.router.navigateByUrl("/")
					this.loading = false;
					this.submitted =  false;

				}else{
					console.log('====================================');
					console.log(res);
					console.log('====================================');
					this.loading = false;
					this.service.add({ key: 'tst', severity: 'error', summary: 'Error Message', detail: 'Your email/password is incorrect' });
				}
			
		  },
		  (err: any)=>{
			this.loading = false;
	
		  }
		)
	  }
}
