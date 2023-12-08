
import { Validators, FormBuilder } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import states from '../locations/states.json';
import { HttpService } from 'src/services/http.service';
import { ConfirmationService, MessageService, ConfirmEventType } from 'primeng/api';

@Component({
  selector: 'app-buses',
  templateUrl: './buses.component.html',
  styleUrls: ['./buses.component.scss'],
  providers: [MessageService, ConfirmationService]
})
export class BusesComponent implements OnInit {
  buses: any = []
  types: any  = [
    {title: 'Toyota Hiace Bus'},
    {title: 'Toyota Sienna'},
    {title: 'JAC'},
    {title: 'Cargo 1'}
  ]
  visible: boolean = false;
  busForm: any;
  states: any = states;
  submitted: any
  loading: any
  submitType: string = '';
  displayBus: boolean = false;
  currentID: any;

  constructor(private fb: FormBuilder, private httpService: HttpService, private service: MessageService, private confirmationService: ConfirmationService, private messageService: MessageService) {
    this.busForm = this.fb.group({
      title: [undefined, Validators.required],
      type: [undefined, Validators.required],
      seats: [undefined, Validators.required],
      photo: [],
   
    })
  }
  ngOnInit(): void {
    this.pullBuses()
  }
  get f() { return this.busForm.controls; }

  showDialog() {

    this.displayBus = true;
  }

  pullBuses() {
    this.httpService
      .getAuthData(
        'buses'
      )
      .subscribe((data: any) => {
        this.buses = data.data
      });
  }
  confirmDelete(id: any) {
    this.confirmationService.confirm({
      message: 'Do you want to delete this record?',
      header: 'Delete Confirmation',
      icon: 'pi pi-info-circle',
      accept: () => {
        this.deleteBuss(id)
      },
      reject: () => {

      }
    });
  }

deleteBuss(id: any) {
  this.httpService
    .deleteData(
      'buses/', id
    )
    .subscribe((data: any) => {
      this.messageService.add({ severity: 'success', summary: 'Confirmed', detail: 'Record deleted' });

      this.pullBuses()
    });
}
populateBus(bus: any) {
  this.submitType = 'Edit';
  this.currentID = bus._id
  // this.busForm.setValue({ p, address: bus.address, state: bus.state })
}

submitBus() {

  this.submitted = true
  if (this.busForm.invalid) {
    this.busForm.markAllAsTouched();

    return;
  }
  this.loading = true;
  let data: any = { ...this.busForm.value }
  if (this.submitType == 'Edit') this.updateBus(data)
  if (this.submitType == 'Add') this.createBus(data)
}

createBus(data: any) {
  console.log('====================================');
  console.log(data);
  console.log('====================================');
  this.httpService
    .postAuthData(
      'buses/', data
    )
    .subscribe((data: any) => {
      // this.listing = data.data
      this.loading = false
      this.displayBus = false
      this.service.add({ key: 'tst', severity: 'success', summary: 'Successful', detail: 'Bus created successfully' });

      this.pullBuses();
      this.busForm.reset()
    }, (err) => {
      this.loading = false

      console.log('====================================');
      console.log(err);
      console.log('====================================');
    });
}

updateBus(data: any) {

  this.httpService
    .updateData(
      'buses/' + this.currentID, data
    )
    .subscribe((data: any) => {
      // this.listing = data.data
      this.loading = false
      this.displayBus = false
      this.service.add({ key: 'tst', severity: 'success', summary: 'Successful', detail: 'Bus updated successfully' });

      this.pullBuses()
      this.currentID = ''
    }, (err) => {
      this.loading = false

      console.log('====================================');
      console.log(err);
      console.log('====================================');
    });
}
}
