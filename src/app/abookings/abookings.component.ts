import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import states from '../locations/states.json';
import { HttpService } from 'src/services/http.service';
import { ConfirmationService, MessageService, ConfirmEventType } from 'primeng/api';
import * as html2pdf from 'html2pdf.js';
import * as XLSX from 'xlsx';
import { __values } from 'tslib';

@Component({
  selector: 'app-bookings',
  templateUrl: './abookings.component.html',
  styleUrls: ['./abookings.component.scss'],
  providers: [MessageService, ConfirmationService]
})
export class AbookingsComponent implements OnInit {
  bookings: any = []
  visible: boolean = false;
  bookingForm: any;
  states: any = states;
  submitted: any
  loading: any
  submitType: string = '';
  displayBooking: boolean = false;
  currentID: any;
  bookingInfoShow: boolean = false;1
  bookingInfo: any;
  passengerForm: FormGroup;
  locations: any;
  minDate: Date;
  maxDate: Date;
  currentPage = 'one';
  results: any;
  constructor(private fb: FormBuilder, private httpService: HttpService, private service: MessageService, private confirmationService: ConfirmationService, private messageService: MessageService) {
    this.bookingForm = this.fb.group({
      firstName: [undefined, Validators.required],
      lastName: [undefined, Validators.required],
      phone: [undefined, Validators.required],
      address: [undefined, Validators.required],
      state: [undefined, Validators.required],

    })
  }
  ngOnInit(): void {
    this.pullBookings()
    this.pullLocations()
    this.minDate = new Date();
    const daysUntilSaturday = 6 - this.minDate.getDay(); // 6 corresponds to Saturday

    // Create a new date for the next Saturday
    this.maxDate = new Date();
    this.maxDate.setDate(this.minDate.getDate() + 6);
    console.log(this.minDate);
    console.log(this.maxDate);
    this.passengerForm = this.fb.group({
      agreedTerms: [''],
      from: ['', Validators.required],
      to: ['', Validators.required],
      date: ['', Validators.required],
      return: [''],
      trip: ['', Validators.required],
      returnTrip: ['', Validators.required],
      
      passengers: this.fb.array([]), // Use FormArray for dynamic passenger inputs

    });
    this.addPassenger()
  }
  get f() { return this.passengerForm.controls; }
  // get b() { return this.passengerForm.controls; }

  fetchTrips(){
    this.findTripResults()
    if (this.currentPage == 'round') {
      this.findReturnResults()
    }
  }
  findTripResults() {
    let datas: any = {}
    datas.to = this.passengerForm.value.to
    datas.from = this.passengerForm.value.from
    let date = new Date(this.passengerForm.value.date)
    datas.date = this.formatDate(date)
    this.httpService
      .postAuthData(
        'routes/findRoutes', datas
      )
      .subscribe((data: any) => {
        this.results = data.data

      });
  }
  findReturnResults() {
    let datas: any = {}
    datas.to = this.passengerForm.value.from
    datas.from = this.passengerForm.value.to
    let date = new Date(this.passengerForm.value.return)
    datas.date = this.formatDate(date)

    this.httpService
      .postAuthData(
        'routes/findRoutes', datas
      )
      .subscribe((data: any) => {
        this.findReturnResults = data.data

      });
  }
  formatDate(date) {
    // Function to add leading zeros to single-digit numbers
    function addLeadingZero(number) {
      return number < 10 ? "0" + number : number;
    }

    // Format the date as dd-mm-yyyy
    var formattedDate =
      addLeadingZero(date.getDate()) + "-" +
      addLeadingZero(date.getMonth() + 1) + "-" +
      date.getFullYear();

    return formattedDate;
  }
  
  addPassenger(): void {
    const passengerFormGroup = this.fb.group({
      firstName: ['', Validators.required],
      middleName: [''],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      dob: [''],
      gender: ['', [Validators.required]],
      category: ['', [Validators.required]],
      tripSeat: ['', [Validators.required]],
      // returnSeat: ['', this.params.type == 'round' ? Validators.required : null],
      // tripAmount: [this.params.tripPrice, []],
      // returnAmount: [this.params.returnPrice],
      emergencyContact: this.fb.group({
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        email: ['', Validators.email],
        phone: ['', Validators.required]
        // Add more emergency contact fields and validations as needed
      })

      // Add more fields and validations as needed
    });

    (this.passengerForm.get('passengers') as any).push(passengerFormGroup);
  }

  // Getter for easier access to form controls
  get passengerControls() {
    return (this.passengerForm.get('passengers') as any).controls;
  }

  selectPage(page: any) {
    this.currentPage = page;
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

  filterLocationsfromOrigin() {
    let val = this.passengerForm.value.from
    if (val) {

      return this.locations.filter((res: any) => {
        return res.title != val
      })
    }
    return []
  }
  showDialog() {

    this.displayBooking = true;
  }

  showBookingDialog(data: any) {
    this.bookingInfoShow = true;
    this.bookingInfo = data
  }
  convertToPDF() {
    const element = document.getElementById('pdfContnent').innerHTML;
    const options = {
      margin: 10,
      filename: 'vt_ticket.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf(element, options);
  }
  pullBookings() {
    this.httpService
      .getAuthData(
        'booking/altered'
      )
      .subscribe((data: any) => {
        this.bookings = data.data
      });
  }
  confirmDelete(id: any) {
    this.confirmationService.confirm({
      message: 'Do you want to delete this record?',
      header: 'Delete Confirmation',
      icon: 'pi pi-info-circle',
      accept: () => {
        this.deleteBookings(id)
      },
      reject: () => {

      }
    });
  }

  deleteBookings(id: any) {
    this.httpService
      .deleteData(
        'bookings/', id
      )
      .subscribe((data: any) => {
        this.messageService.add({ severity: 'success', summary: 'Confirmed', detail: 'Record deleted' });

        this.pullBookings()
      });
  }
  populateBooking(booking: any) {
    this.submitType = 'Edit';
    this.currentID = booking._id
    // this.bookingForm.setValue({ p, address: booking.address, state: booking.state })
  }

  submitBooking() {

    this.submitted = true
    if (this.bookingForm.invalid) {
      this.bookingForm.markAllAsTouched();

      return;
    }
    this.loading = true;
    let data: any = { ...this.bookingForm.value }
    if (this.submitType == 'Edit') this.updateBooking(data)
    if (this.submitType == 'Add') this.createBooking(data)
  }

  createBooking(data: any) {
    console.log('====================================');
    console.log(data);
    console.log('====================================');
    this.httpService
      .postAuthData(
        'bookings/', data
      )
      .subscribe((data: any) => {
        // this.listing = data.data
        this.loading = false
        this.displayBooking = false
        this.service.add({ key: 'tst', severity: 'success', summary: 'Successful', detail: 'Booking created successfully' });

        this.pullBookings();
        this.bookingForm.reset()
      }, (err) => {
        this.loading = false

        console.log('====================================');
        console.log(err);
        console.log('====================================');
      });
  }
  markAsUsed(booking: any, status: String) {
    this.currentID = booking._id
    this.updateBooking({ status: status })
  }

  updateBooking(data: any) {

    this.httpService
      .updateData(
        'booking/' + this.currentID, data
      )
      .subscribe((data: any) => {
        // this.listing = data.data
        this.loading = false
        this.displayBooking = false
        this.service.add({ key: 'tst', severity: 'success', summary: 'Successful', detail: 'Booking updated successfully' });

        this.pullBookings()
        this.currentID = ''
      }, (err) => {
        this.loading = false

        console.log('====================================');
        console.log(err);
        console.log('====================================');
      });
  }
  flattenObject(obj: any): any {
    const result = {};

    function recurse(current: any, property: string): void {
      if (typeof current === 'object' && !Array.isArray(current)) {
        for (const key in current) {
          if (current.hasOwnProperty(key)) {
            if (property === '') {
              recurse(current[key], key);
            } else {
              recurse(current[key], property + '.' + key);
            }
          }
        }
      } else {
        result[property] = current;
      }
    }

    recurse(obj, '');
    return result;
  }

  exportToExcel(jsonData: any[], fileName: string): void {
    const flattenedData = jsonData.map(item => this.flattenObject(item));
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(flattenedData);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet 1');
    XLSX.writeFile(wb, `${fileName}.xlsx`);

  }
}

