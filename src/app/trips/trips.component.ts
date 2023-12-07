import { Validators, FormBuilder } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import states from '../locations/states.json';
import { HttpService } from 'src/services/http.service';
import { ConfirmationService, MessageService, ConfirmEventType } from 'primeng/api';

@Component({
  selector: 'app-trips',
  templateUrl: './trips.component.html',
  styleUrls: ['./trips.component.scss'],
  providers: [MessageService, ConfirmationService]
})
export class TripsComponent implements OnInit {
  trips: any = []
  visible: boolean = false;
  tripForm: any;
  states: any = states;
  submitted: any
  loading: any
  submitType: string = '';
  displayTrip: boolean = false;
  currentID: any;
  buses: any;
  routes: any;
  drivers: any;

  constructor(private fb: FormBuilder, private httpService: HttpService, private service: MessageService, private confirmationService: ConfirmationService, private messageService: MessageService) {
    this.tripForm = this.fb.group({
      title: [undefined, Validators.required],
      route: [undefined, Validators.required],
      driver: [undefined, Validators.required],
      tripDate: [undefined, Validators.required],

    })
  }
  ngOnInit(): void {
    this.pullTrips()
    this.pullRoutes()
    this.pullDrivers()
  }
  get f() { return this.tripForm.controls; }

  showDialog() {

    this.displayTrip = true;
  }

  pullTrips() {
    this.httpService
      .getAuthData(
        'trips'
      )
      .subscribe((data: any) => {
        this.trips = data.data
      });
  }

  pullRoutes() {
    this.httpService
      .getAuthData(
        'routes'
      )
      .subscribe((data: any) => {
        this.routes = data.data
      });
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
        this.deleteTrips(id)
      },
      reject: () => {

      }
    });
  }

  deleteTrips(id: any) {
    this.httpService
      .deleteData(
        'trips/', id
      )
      .subscribe((data: any) => {
        this.messageService.add({ severity: 'success', summary: 'Confirmed', detail: 'Record deleted' });

        this.pullTrips()
      });
  }
  populateTrip(trip: any) {
    this.submitType = 'Edit';
    this.currentID = trip._id
    // this.tripForm.setValue({ p, address: trip.address, state: trip.state })
  }

  submitTrip() {

    this.submitted = true
    if (this.tripForm.invalid) {
      this.tripForm.markAllAsTouched();

      return;
    }
    this.loading = true;
    let data: any = { ...this.tripForm.value }
    if (this.submitType == 'Edit') this.updateTrip(data)
    if (this.submitType == 'Add') this.createTrip(data)
  }

  createTrip(data: any) {
    console.log('====================================');
    console.log(data);
    console.log('====================================');
    this.httpService
      .postAuthData(
        'trips/', data
      )
      .subscribe((data: any) => {
        // this.listing = data.data
        this.loading = false
        this.displayTrip = false
        this.service.add({ key: 'tst', severity: 'success', summary: 'Successful', detail: 'Trip created successfully' });

        this.pullTrips();
        this.tripForm.reset()
      }, (err) => {
        this.loading = false

        console.log('====================================');
        console.log(err);
        console.log('====================================');
      });
  }

  updateTrip(data: any) {

    this.httpService
      .updateData(
        'trips/' + this.currentID, data
      )
      .subscribe((data: any) => {
        // this.listing = data.data
        this.loading = false
        this.displayTrip = false
        this.service.add({ key: 'tst', severity: 'success', summary: 'Successful', detail: 'Trip updated successfully' });

        this.pullTrips()
        this.currentID = ''
      }, (err) => {
        this.loading = false

        console.log('====================================');
        console.log(err);
        console.log('====================================');
      });
  }
}
