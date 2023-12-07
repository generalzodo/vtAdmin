import { Validators, FormBuilder } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import states from '../locations/states.json';
import { HttpService } from 'src/services/http.service';
import { ConfirmationService, MessageService, ConfirmEventType } from 'primeng/api';

@Component({
  selector: 'app-drivers',
  templateUrl: './drivers.component.html',
  styleUrls: ['./drivers.component.scss'],
  providers: [MessageService, ConfirmationService]
})
export class DriversComponent implements OnInit {
  drivers: any = []
  visible: boolean = false;
  driverForm: any;
  states: any = states;
  submitted: any
  loading: any
  submitType: string = '';
  displayDriver: boolean = false;
  currentID: any;

  constructor(private fb: FormBuilder, private httpService: HttpService, private service: MessageService, private confirmationService: ConfirmationService, private messageService: MessageService) {
    this.driverForm = this.fb.group({
      firstName: [undefined, Validators.required],
      lastName: [undefined, Validators.required],
      phone: [undefined, Validators.required],
      address: [undefined, Validators.required],
      state: [undefined, Validators.required],
     
    })
  }
  ngOnInit(): void {
    this.pullDrivers()
  }
  get f() { return this.driverForm.controls; }

  showDialog() {

    this.displayDriver = true;
  }

  pullDrivers() {
    this.httpService
      .getAuthData(
        'drivers'
      )
      .subscribe((data: any) => {
        this.drivers = data.data
      });
  }
  confirmDelete(id: any) {
    this.confirmationService.confirm({
      message: 'Do you want to delete this record?',
      header: 'Delete Confirmation',
      icon: 'pi pi-info-circle',
      accept: () => {
        this.deleteDrivers(id)
      },
      reject: () => {

      }
    });
  }

deleteDrivers(id: any) {
  this.httpService
    .deleteData(
      'drivers/', id
    )
    .subscribe((data: any) => {
      this.messageService.add({ severity: 'success', summary: 'Confirmed', detail: 'Record deleted' });

      this.pullDrivers()
    });
}
populateDriver(driver: any) {
  this.submitType = 'Edit';
  this.currentID = driver._id
  // this.driverForm.setValue({ p, address: driver.address, state: driver.state })
}

submitDriver() {

  this.submitted = true
  if (this.driverForm.invalid) {
    this.driverForm.markAllAsTouched();

    return;
  }
  this.loading = true;
  let data: any = { ...this.driverForm.value }
  if (this.submitType == 'Edit') this.updateDriver(data)
  if (this.submitType == 'Add') this.createDriver(data)
}

createDriver(data: any) {
  console.log('====================================');
  console.log(data);
  console.log('====================================');
  this.httpService
    .postAuthData(
      'drivers/', data
    )
    .subscribe((data: any) => {
      // this.listing = data.data
      this.loading = false
      this.displayDriver = false
      this.service.add({ key: 'tst', severity: 'success', summary: 'Successful', detail: 'Driver created successfully' });

      this.pullDrivers();
      this.driverForm.reset()
    }, (err) => {
      this.loading = false

      console.log('====================================');
      console.log(err);
      console.log('====================================');
    });
}

updateDriver(data: any) {

  this.httpService
    .updateData(
      'drivers/' + this.currentID, data
    )
    .subscribe((data: any) => {
      // this.listing = data.data
      this.loading = false
      this.displayDriver = false
      this.service.add({ key: 'tst', severity: 'success', summary: 'Successful', detail: 'Driver updated successfully' });

      this.pullDrivers()
      this.currentID = ''
    }, (err) => {
      this.loading = false

      console.log('====================================');
      console.log(err);
      console.log('====================================');
    });
}
}
