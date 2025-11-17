import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import states from '../locations/states.json';
import { HttpService } from 'src/services/http.service';
import { AuthService } from 'src/services/auth.service';
import { ConfirmationService, MessageService, ConfirmEventType } from 'primeng/api';
import * as html2pdf from 'html2pdf.js';
import * as XLSX from 'xlsx';
import { __values } from 'tslib';
import { HelperService } from 'src/services/helper.service';

@Component({
  selector: 'app-bookings',
  templateUrl: './bookings.component.html',
  styleUrls: ['./bookings.component.scss'],
  providers: [MessageService, ConfirmationService]
})
export class BookingsComponent implements OnInit {
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
  selectedFilter:any = {title: 'Last 7 Days', value: 7 }
  dateFilter = [
    {title: 'Last 7 days', value: 7},
    {title: 'Last 30 days', value: 30},
    {title: 'Last 60 days', value: 60},
    {title: 'Last 3 months', value: 90},
    {title: 'Last 6 months', value: 180},
    {title: 'Last Year', value: 365},
    // {title: 'All Time', value: ''}
  ]
  showPaymentModal: boolean = false;
  selectedBooking: any = null;
  verifyingPayment: boolean = false;
  
  getUserTypeDisplay(type?: string): string {
    if (!type || type === 'user') return 'User';
    return type.charAt(0).toUpperCase() + type.slice(1);
  }

  getUserTypeColor(type?: string): string {
    switch (type) {
      case 'agent':
        return 'bg-blue-100 text-blue-800';
      case 'partner':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  }
  
  constructor(private fb: FormBuilder, private httpService: HttpService, private authService: AuthService, private helper: HelperService, private service: MessageService, private confirmationService: ConfirmationService, private messageService: MessageService) {
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

  downloadTicket(booking: any) {
    if (!booking || !booking.bookingId) {
      this.messageService.add({ 
        severity: 'error', 
        summary: 'Error', 
        detail: 'Invalid booking data' 
      });
      return;
    }

    // Show loading message
    this.messageService.add({ 
      severity: 'info', 
      summary: 'Downloading', 
      detail: 'Preparing ticket download...' 
    });

    // Call backend endpoint to download ticket
    const bookingId = booking.bookingId;
    const baseUrl = 'https://vtserver-okhz.onrender.com/api/'; // Match the baseUrl from HttpService
    const downloadUrl = `${baseUrl}/booking/download/${bookingId}`;
    
    // Get token from AuthService
    const token = this.authService.getJwtToken();
    
    // Add authorization header via fetch
    fetch(downloadUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(err => {
          throw new Error(err.message || 'Failed to download ticket');
        });
      }
      return response.blob();
    })
    .then(blob => {
      // Create object URL and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ticket_${bookingId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      this.messageService.add({ 
        severity: 'success', 
        summary: 'Success', 
        detail: 'Ticket downloaded successfully' 
      });
    })
    .catch(error => {
      console.error('Error downloading ticket:', error);
      this.messageService.add({ 
        severity: 'error', 
        summary: 'Error', 
        detail: error.message || 'Failed to download ticket. Please try again.' 
      });
    });
  }
  pullBookings() {
    let filter = ''
    if(this.selectedFilter.value != ''){
      console.log(this.selectedFilter.value );
      
      let dateRange = this.helper.getDateRange(this.selectedFilter.value)
      filter = `?from=${dateRange.from}&to=${dateRange.to}`

    }
    this.httpService
      .getAuthData(
        'booking'+filter
      )
      .subscribe((data: any) => {
        // Add searchable fields for better filtering
        this.bookings = data.data.map((booking: any) => ({
          ...booking,
          searchableRescheduled: booking.isRescheduled ? 'rescheduled' : '',
          searchableUserType: booking.user?.type ,
          searchableName: `${booking.firstName} ${booking.lastName}`.toLowerCase(),
          searchableRoute: `${booking.from}-${booking.to}`.toLowerCase()
        }));
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

  verifyPayment(booking: any) {
    this.selectedBooking = booking;
    this.verifyingPayment = true;
    this.showPaymentModal = true;
    
    // Call payment verification API
    const refs = [
      booking.paystack_ref,
      booking.paystack_reference,
      booking.flutterwave_ref,
      booking.bookingId
    ].filter(ref => ref);
    
    // Try each reference
    let verified = false;
    const promises = refs.map(ref => {
      return this.httpService.getAuthData(`payments/paystack/verify?reference=${ref}`)
        .toPromise()
        .then((data: any) => {
          if (data.status === 'success' && !verified) {
            verified = true;
            this.selectedBooking.paymentVerified = true;
            this.selectedBooking.verificationData = data;
          }
        })
        .catch(() => {});
    });
    
    Promise.all(promises).then(() => {
      // Also try Flutterwave if Paystack didn't work
      if (!verified && (booking.flutterwave_ref || booking.bookingId)) {
        const flutterwaveRef = booking.flutterwave_ref || booking.bookingId;
        this.httpService.getAuthData(`payments/flutterwave/verify?tx_ref=${flutterwaveRef}`)
          .subscribe(
            (data: any) => {
              if (data.status === 'success' || data.data?.status === 'successful') {
                this.selectedBooking.paymentVerified = true;
                this.selectedBooking.verificationData = data;
              }
            },
            () => {}
          );
      }
      this.verifyingPayment = false;
    });
  }

  confirmPaymentFromModal() {
    if (!this.selectedBooking) return;
    
    this.confirmationService.confirm({
      message: `Mark booking ${this.selectedBooking.bookingId} as paid and send ticket email?`,
      header: 'Confirm Payment',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.httpService.updateData(`booking/confirmPayment/${this.selectedBooking._id}`, {})
          .subscribe(
            (data: any) => {
              this.messageService.add({
                severity: 'success',
                summary: 'Payment Confirmed',
                detail: `Booking ${this.selectedBooking.bookingId} confirmed and ticket sent.`
              });
              this.showPaymentModal = false;
              this.selectedBooking = null;
              this.pullBookings();
            },
            (error) => {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: error.error?.error || 'Failed to confirm payment.'
              });
            }
          );
      }
    });
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

