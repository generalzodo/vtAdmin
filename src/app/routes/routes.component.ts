import { Validators, FormBuilder } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
// import states from '.../locations/states.json';
import { HttpService } from 'src/services/http.service';
import { ConfirmationService, MessageService } from 'primeng/api';

@Component({
  selector: 'app-routes',
  templateUrl: './routes.component.html',
  styleUrls: ['./routes.component.scss'],
  providers: [MessageService, ConfirmationService]

})
export class RoutesComponent implements OnInit {

  routes: any = []
  visible: boolean = false;
  routeForm: any;
  // states: any = states;
  submitted: any
  loading: any
  submitType: string = '';
  displayRoute: boolean = false;
  daysWithTitles = [
    { title: 'Day', day: 'Sunday' },
    { title: 'Day', day: 'Monday' },
    { title: 'Day', day: 'Tuesday' },
    { title: 'Day', day: 'Wednesday' },
    { title: 'Day', day: 'Thursday' },
    { title: 'Day', day: 'Friday' },
    { title: 'Day', day: 'Saturday' }
  ];
  currentID: any;
  locations: any;
  buses: any = [];
  times: any = ["06:00 AM", "06:30 AM", "07:00 AM", "07:30 AM", "08:00 AM", "08:30 AM", "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM", "03:00 PM"]

  constructor(private fb: FormBuilder, private httpService: HttpService, private service: MessageService, private confirmationService: ConfirmationService, private messageService: MessageService) {
    this.routeForm = this.fb.group({
      title: [undefined, Validators.required],
      destination: [undefined, Validators.required],
      origin: [undefined, Validators.required],
      price: [undefined, Validators.required],
      premiumPrice: [undefined, Validators.required],
      times: [undefined, Validators.required],
      discountedPrice: [undefined, Validators.required],
      bus: [undefined, Validators.required],
      recurrentDays: [undefined, Validators.required],
      totalTrips: [undefined, Validators.required],
      
    })
  }
  ngOnInit(): void {
    this.pullRoutes()
    this.pullLocations()
    this.pullBuses()

  }
  get f() { return this.routeForm.controls; }

  showDialog() {

    this.displayRoute = true;
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
  pullBuses() {
    this.httpService
      .getAuthData(
        'buses'
      )
      .subscribe((data: any) => {
        this.buses = data.data
      });
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
        this.deleteRoutes(id)
      },
      reject: () => {

      }
    });
  }

  deleteRoutes(id: any) {
    this.httpService
      .deleteData(
        'routes/', id
      )
      .subscribe((data: any) => {
        this.messageService.add({ severity: 'success', summary: 'Confirmed', detail: 'Record deleted' });

        this.pullRoutes()
      });
  }
  populateRoute(route: any) {
    this.submitType = 'Edit';
    this.currentID = route._id
    this.routeForm.patchValue({ title: route.title,bus: route.bus, price: route.price, premiumPrice: route.premiumPrice, times:route.times,
      discountedPrice: route.discountedPrice, origin: route.origin, destination: route.destination, recurrentDays: route.recurrentDays, totalTrips: route.totalTrips })
  }

  submitRoute() {

    this.submitted = true
    if (this.routeForm.invalid) {
      this.routeForm.markAllAsTouched();

      return;
    }
    this.loading = true;
    let data: any = { ...this.routeForm.value }
    if (this.submitType == 'Edit') this.updateRoute(data)
    if (this.submitType == 'Add') this.createRoute(data)
  }

  createRoute(data: any) {
    console.log('====================================');
    console.log(data);
    console.log('====================================');
    this.httpService
      .postAuthData(
        'routes/', data
      )
      .subscribe((data: any) => {
        // this.listing = data.data
        this.loading = false
        this.displayRoute = false
        this.messageService.add({  severity: 'success', summary: 'Successful', detail: 'Route created successfully' });

        this.pullRoutes();
        this.routeForm.reset()
      }, (err) => {
        this.loading = false

        console.log('====================================');
        console.log(err);
        console.log('====================================');
      });
  }

  updateRoute(data: any) {

    this.httpService
      .updateData(
        'routes/' + this.currentID, data
      )
      .subscribe((data: any) => {
        // this.listing = data.data
        this.loading = false
        this.displayRoute = false
        this.messageService.add({  severity: 'success', summary: 'Successful', detail: 'Route updated successfully' });

        this.pullRoutes()
        this.currentID = ''
      }, (err) => {
        this.loading = false

        console.log('====================================');
        console.log(err);
        console.log('====================================');
      });
  }

  filterLocationsfromOrigin(){
    let val = this.routeForm.value.origin
    if(val){

      return this.locations.filter((res:any) =>{
        return res.title !=val
      })
    }
    return[]
  }
}

