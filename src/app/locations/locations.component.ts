import { Validators, FormBuilder } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import states from './states.json';
import { HttpService } from 'src/services/http.service';
import { ConfirmationService, MessageService, ConfirmEventType } from 'primeng/api';

@Component({
  selector: 'app-locations',
  templateUrl: './locations.component.html',
  styleUrls: ['./locations.component.scss'],
  providers: [MessageService, ConfirmationService]
})
export class LocationsComponent implements OnInit {
  locations: any = []
  visible: boolean = false;
  locationForm: any;
  states: any = states;
  submitted: any
  loading: any
  submitType: string = '';
  displayLocation: boolean = false;
  currentID: any;

  constructor(private fb: FormBuilder, private httpService: HttpService, private service: MessageService, private confirmationService: ConfirmationService, private messageService: MessageService) {
    this.locationForm = this.fb.group({
      title: [undefined, Validators.required],
      address: [undefined, Validators.required],
      state: [undefined, Validators.required],
    })
  }
  ngOnInit(): void {
    this.pullLocations()
  }
  get f() { return this.locationForm.controls; }

  showDialog() {

    this.displayLocation = true;
  }

  pullLocations() {
    this.httpService
      .getAuthData(
        'locations'
      )
      .subscribe((data: any) => {
        this.locations = data.data
      });
  }
  confirmDelete(id: any) {
    this.confirmationService.confirm({
      message: 'Do you want to delete this record?',
      header: 'Delete Confirmation',
      icon: 'pi pi-info-circle',
      accept: () => {
        this.deleteLocations(id)
      },
      reject: () => {

      }
    });
  }

deleteLocations(id: any) {
  this.httpService
    .deleteData(
      'locations/', id
    )
    .subscribe((data: any) => {
      this.messageService.add({ severity: 'success', summary: 'Confirmed', detail: 'Record deleted' });

      this.pullLocations()
    });
}
populateLocation(location: any) {
  this.submitType = 'Edit';
  this.currentID = location._id
  this.locationForm.setValue({ title: location.title, address: location.address, state: location.state })
}

submitLocation() {

  this.submitted = true
  if (this.locationForm.invalid) {
    this.locationForm.markAllAsTouched();

    return;
  }
  this.loading = true;
  let data: any = { ...this.locationForm.value }
  if (this.submitType == 'Edit') this.updateLocation(data)
  if (this.submitType == 'Add') this.createLocation(data)
}

createLocation(data: any) {
  console.log('====================================');
  console.log(data);
  console.log('====================================');
  this.httpService
    .postAuthData(
      'locations/', data
    )
    .subscribe((data: any) => {
      // this.listing = data.data
      this.loading = false
      this.displayLocation = false
      this.service.add({ key: 'tst', severity: 'success', summary: 'Successful', detail: 'Location created successfully' });

      this.pullLocations();
      this.locationForm.reset()
    }, (err) => {
      this.loading = false

      console.log('====================================');
      console.log(err);
      console.log('====================================');
    });
}

updateLocation(data: any) {

  this.httpService
    .updateData(
      'locations/' + this.currentID, data
    )
    .subscribe((data: any) => {
      // this.listing = data.data
      this.loading = false
      this.displayLocation = false
      this.service.add({ key: 'tst', severity: 'success', summary: 'Successful', detail: 'Location updated successfully' });

      this.pullLocations()
      this.currentID = ''
    }, (err) => {
      this.loading = false

      console.log('====================================');
      console.log(err);
      console.log('====================================');
    });
}
}
