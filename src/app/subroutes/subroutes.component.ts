import { Validators, FormBuilder } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
// import states from '.../locations/states.json';
import { HttpService } from 'src/services/http.service';
import { ConfirmationService, MessageService } from 'primeng/api';

@Component({
  selector: 'app-subroutes',
  templateUrl: './subroutes.component.html',
  styleUrls: ['./subroutes.component.scss'],
  providers: [MessageService, ConfirmationService]

})
export class SubRoutesComponent implements OnInit {

  subroutes: any = []
  visible: boolean = false;
  subrouteForm: any;
  // states: any = states;
  submitted: any
  loading: any
  submitType: string = '';
  displaySubRoute: boolean = false;
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
  times: any = [
    {"title": "06:00 AM"},
    {"title": "06:30 AM"},
    {"title": "07:00 AM"},
    {"title": "07:30 AM"},
    {"title": "08:00 AM"},
    {"title": "08:30 AM"},
    {"title": "09:00 AM"},
    {"title": "09:30 AM"},
    {"title": "10:00 AM"},
    {"title": "10:30 AM"},
    {"title": "11:00 AM"},
    {"title": "11:30 AM"},
    {"title": "12:00 PM"},
    {"title": "12:30 PM"},
    {"title": "01:00 PM"},
    {"title": "01:30 PM"},
    {"title": "02:00 PM"},
    {"title": "02:30 PM"},
    {"title": "03:00 PM"}
  ]
  selectedRecordIds: any = [];
  checkAllStatus: boolean;
  routes: any;
  
  constructor(private fb: FormBuilder, private httpService: HttpService, private service: MessageService, private confirmationService: ConfirmationService, private messageService: MessageService) {
    this.subrouteForm = this.fb.group({
      // title: [undefined, Validators.required],
      stop: [undefined, Validators.required],
      price: [undefined, Validators.required],
      premiumPrice: [undefined, Validators.required],
      times: [undefined, Validators.required],
      route: [undefined, Validators.required],
      discountedPrice: [undefined, Validators.required],
    })
  }
  ngOnInit(): void {
    this.pullSubRoutes()
    this.pullRoutes()

    this.pullLocations()

  }
  get f() { return this.subrouteForm.controls; }

  showDialog() {

    this.displaySubRoute = true;
  }

  pullSubRoutes() {
    this.httpService
      .getAuthData(
        'subroutes'
      )
      .subscribe((data: any) => {
        this.subroutes = data.data
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
        this.deleteSubRoutes(id)
      },
      reject: () => {

      }
    });
  }

  deleteSubRoutes(id: any) {
    this.httpService
      .deleteData(
        'subroutes/', id
      )
      .subscribe((data: any) => {
        this.messageService.add({ severity: 'success', summary: 'Confirmed', detail: 'Record deleted' });

        this.pullSubRoutes()
      });
  }

  confirmMultipleDelete() {
    if(this.selectedRecordIds.length == 0){
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Please select records to delete' });
      return
    }
    this.confirmationService.confirm({
      message: 'Do you want to delete '+this.selectedRecordIds.length +' records?',
      header: 'Delete Confirmation',
      icon: 'pi pi-info-circle',
      accept: () => {
        this.deleteSelectedTrips()
      },
      reject: () => {

      }
    });
  }

  async checkAll(){
    if(this.checkAllStatus == true){
      for await (const it of this.subroutes) {
        if(!this.selectedRecordIds.includes(it._id)){
          this.selectedRecordIds.push(it._id)
        }
      }
    }else{
      this.selectedRecordIds = []
    }
  }
  onRecordSelectionChange(record: any): void {
    const index = this.selectedRecordIds.indexOf(record._id);

    if (index < 0) {
      // Add to the array if selected
      this.selectedRecordIds.push(record._id);
      
    } else {
      // Remove from the array if deselected
        this.selectedRecordIds.splice(index, 1);
    }
    console.log(this.selectedRecordIds);
    
  }

  deleteSelectedTrips() {

    this.httpService
      .postAuthData(
        'subroutes/deleteSubRoutes/', {ids: this.selectedRecordIds}
      )
      .subscribe((data: any) => {
        this.messageService.add({ severity: 'success', summary: 'Confirmed', detail: 'Records deleted' });

        this.pullSubRoutes()
        this.selectedRecordIds = []
      });
  }

  populateSubRoute(subroute: any) {
    this.submitType = 'Edit';
    this.currentID = subroute._id
    this.subrouteForm.patchValue({ title: subroute.title,bus: subroute.bus, price: subroute.price, stops: subroute.stops, premiumPrice: subroute.premiumPrice, times:subroute.times,
      discountedPrice: subroute.discountedPrice, origin: subroute.origin, destination: subroute.destination, recurrentDays: subroute.recurrentDays, totalTrips: subroute.totalTrips })
  }

  submitSubRoute() {

    this.submitted = true
    if (this.subrouteForm.invalid) {
      this.subrouteForm.markAllAsTouched();

      return;
    }
    this.loading = true;
    let data: any = { ...this.subrouteForm.value }
    if (this.submitType == 'Edit') this.updateSubRoute(data)
    if (this.submitType == 'Add') this.createSubRoute(data)
  }

  createSubRoute(data: any) {
    console.log('====================================');
    console.log(data);
    console.log('====================================');
    this.httpService
      .postAuthData(
        'subroutes/', data
      )
      .subscribe((data: any) => {
        // this.listing = data.data
        this.loading = false
        this.displaySubRoute = false
        this.messageService.add({  severity: 'success', summary: 'Successful', detail: 'SubRoute created successfully' });

        this.pullSubRoutes();
        this.subrouteForm.reset()
      }, (err) => {
        this.loading = false

        console.log('====================================');
        console.log(err);
        console.log('====================================');
      });
  }

  updateSubRoute(data: any) {

    this.httpService
      .updateData(
        'subroutes/' + this.currentID, data
      )
      .subscribe((data: any) => {
        // this.listing = data.data
        this.loading = false
        this.displaySubRoute = false
        this.messageService.add({  severity: 'success', summary: 'Successful', detail: 'SubRoute updated successfully' });

        this.pullSubRoutes()
        this.currentID = ''
      }, (err) => {
        this.loading = false

        console.log('====================================');
        console.log(err);
        console.log('====================================');
      });
  }

  filterLocationsfromOrigin(){
    let val = this.subrouteForm.value.origin
    if(val){

      return this.locations.filter((res:any) =>{
        return res.title !=val
      })
    }
    return[]
  }
}

