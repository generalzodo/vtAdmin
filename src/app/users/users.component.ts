import { Validators, FormBuilder } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import states from '../locations/states.json';
import { HttpService } from 'src/services/http.service';
import { ConfirmationService, MessageService, ConfirmEventType } from 'primeng/api';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
  providers: [MessageService, ConfirmationService]
})
export class UsersComponent implements OnInit {
  users: any = []
  visible: boolean = false;
  userForm: any;
  states: any = states;
  submitted: any
  loading: any
  submitType: string = '';
  displayUser: boolean = false;
  currentID: any;
  userTypes: any = [
    { title: 'User', value: 'user' },
    { title: 'Agent', value: 'agent' },
    { title: 'Admin', value: 'admin' }
  ]
  constructor(private fb: FormBuilder, private httpService: HttpService, private service: MessageService, private confirmationService: ConfirmationService, private messageService: MessageService) {
    this.userForm = this.fb.group({
      userType: [undefined, Validators.required],
      firstName: [undefined, Validators.required],
      lastName: [undefined, Validators.required],
      phone: [undefined, Validators.required],
      address: [undefined, Validators.required],
      state: [undefined, Validators.required],
      dob: [undefined, Validators.required],
      email: [undefined, Validators.required],
      password: [undefined, Validators.required],
      confirmPassword: [undefined, Validators.required],

    })
  }
  ngOnInit(): void {
    this.pullUsers()
  }
  get f() { return this.userForm.controls; }

  showDialog() {

    this.displayUser = true;
  }

  pullUsers() {
    this.httpService
      .getAuthData(
        'users'
      )
      .subscribe((data: any) => {
        this.users = data.data
      });
  }
  confirmDelete(id: any) {
    this.confirmationService.confirm({
      message: 'Do you want to delete this record?',
      header: 'Delete Confirmation',
      icon: 'pi pi-info-circle',
      accept: () => {
        this.deleteUsers(id)
      },
      reject: () => {

      }
    });
  }

  deleteUsers(id: any) {
    this.httpService
      .deleteData(
        'users/', id
      )
      .subscribe((data: any) => {
        this.messageService.add({ severity: 'success', summary: 'Confirmed', detail: 'Record deleted' });

        this.pullUsers()
      });
  }
  populateUser(user: any) {
    console.log(user);
    
    this.submitType = 'Edit';
    this.currentID = user._id
    this.userForm.patchValue({
      userType: user.userType,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      address: user.address,
      state: user.state,
      dob: user.dob,
      email: user.email,
      password: user.password,
      confirmPassword: user.password
    })

  }

  submitUser() {

    this.submitted = true
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();

      return;
    }
    this.loading = true;
    let data: any = { ...this.userForm.value }
    if (this.submitType == 'Edit') this.updateUser(data)
    if (this.submitType == 'Add') this.createUser(data)
  }

  createUser(data: any) {
    console.log('====================================');
    console.log(data);
    console.log('====================================');
    this.httpService
      .postAuthData(
        'users/', data
      )
      .subscribe((data: any) => {
        // this.listing = data.data
        this.loading = false
        this.displayUser = false
        this.service.add({ key: 'tst', severity: 'success', summary: 'Successful', detail: 'User created successfully' });

        this.pullUsers();
        this.userForm.reset()
      }, (err) => {
        this.loading = false

        console.log('====================================');
        console.log(err);
        console.log('====================================');
      });
  }

  updateUser(data: any) {
    this.userForm.value.type = this.userForm.value.userType
    this.httpService
      .updateData(
        'users/' + this.currentID, data
      )
      .subscribe((data: any) => {
        // this.listing = data.data
        this.loading = false
        this.displayUser = false
        this.service.add({ key: 'tst', severity: 'success', summary: 'Successful', detail: 'User updated successfully' });

        this.pullUsers()
        this.currentID = ''
      }, (err) => {
        this.loading = false

        console.log('====================================');
        console.log(err);
        console.log('====================================');
      });
  }
}
