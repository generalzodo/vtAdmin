import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import states from '../locations/states.json';
import { HttpService } from 'src/services/http.service';
import { AuthService } from 'src/services/auth.service';
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
  
  constructor(private fb: FormBuilder, private httpService: HttpService, private authService: AuthService, private service: MessageService, private confirmationService: ConfirmationService, private messageService: MessageService) {
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
        // Add searchable fields for better filtering
        this.bookings = data.data.map((booking: any) => ({
          ...booking,
          searchableRescheduled: booking.isRescheduled ? 'rescheduled' : '',
          searchableUserType: booking.user?.type,
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

  updateBookingOnBoarded(booking: any, onBoarded: boolean) {
    this.httpService
      .updateData('booking/onboarded/' + booking._id, { onBoarded })
      .subscribe((data: any) => {
        if (data.success) {
          booking.onBoarded = onBoarded;
          this.messageService.add({ 
            severity: 'success', 
            summary: 'Success', 
            detail: `Passenger ${onBoarded ? 'marked as on-boarded' : 'marked as not on-boarded'}` 
          });
        }
      }, (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update on-boarded status' });
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
    // Define column order as specified
    // Define column order - first 15 fields as specified, then the rest
    const columnOrder = [
      'id',
      'Trip seats',
      'First Name',
      'Second name',
      'Last name',
      'Phone',
      'Emergency Phone',
      'From',
      'To',
      'Trip Amount',
      'Payment Status',
      'Trip Title',
      'Trip Time',
      'Trip Date',
      'Status',
      // Additional fields after the first 15
      'Trip Type',
      'Email',
      'Gender',
      'Emergency First Name',
      'Emergency Last Name',
      'Emergency Email',
      'Return Amount',
      'Amount',
      'Discount',
      'Trip ID',
      'Trip bus',
      'Trip Status',
      'Trip Created At',
      'Mode of Payment',
      'Verification Attempts',
      'Tickets Sent',
      'is Rescheduled',
      'Created At',
      'Updated At',
      'paystack Reference',
      'uniqueBooking ID',
      'User ID',
      'User Type',
      'Searchable User Type',
      'Searchable Name',
      'Searchable Route'
    ];

    // Process bookings and split return trips into separate rows
    const processedRows: any[] = [];
    
    for (const booking of jsonData) {
      // Calculate total amount and discount
      const totalAmount = (booking.tripAmount || 0) + (booking.returnAmount || 0);
      const discountedFare = booking.discountedFare || 0;
      
      // For outbound trip, calculate discount portion
      // If there's a return trip, discount is split in half
      // If no return trip, full discount applies to the trip
      const outboundDiscount = booking.returnTrip && booking.returnSeat 
        ? (discountedFare / 2) 
        : discountedFare;
      
      // Create outbound trip row
      const outboundRow: any = {
        'id': booking._id || booking.bookingId || '',
        'Trip Type': 'Outbound',
        'Trip seats': booking.tripSeat || '',
        'First Name': booking.firstName || '',
        'Second name': booking.middleName || '',
        'Last name': booking.lastName || '',
        'Email': booking.email || '',
        'Gender': booking.gender || '',
        'Phone': booking.phone || '',
        'Emergency First Name': booking.emergencyFirstName || '',
        'Emergency Last Name': booking.emergencyLastName || '',
        'Emergency Email': booking.emergencyEmail || '',
        'Emergency Phone': booking.emergencyPhone || '',
        'From': booking.from || '',
        'To': booking.to || '',
        'Trip Amount': booking.tripAmount || 0,
        'Return Amount': booking.returnAmount || 0,
        'Amount': booking.amount || totalAmount,
        'Discount': outboundDiscount,
        'Payment Status': booking.paymentStatus || '',
        'Trip Title': booking.trip?.title || '',
        'Trip Time': booking.trip?.time || '',
        'Trip Date': booking.trip?.tripDate || '',
        'Trip ID': booking.trip?._id || '',
        'Trip bus': booking.trip?.bus || '',
        'Trip Status': booking.trip?.status || '',
        'Trip Created At': booking.trip?.createdAt ? new Date(booking.trip.createdAt).toLocaleString() : '',
        'Status': booking.status || '',
        'Mode of Payment': booking.mode || '',
        'Verification Attempts': booking.verificationAttempts || 0,
        'Tickets Sent': booking.ticketSent ? 'Yes' : 'No',
        'is Rescheduled': booking.isRescheduled ? 'Yes' : 'No',
        'Created At': booking.createdAt ? new Date(booking.createdAt).toLocaleString() : '',
        'Updated At': booking.updatedAt ? new Date(booking.updatedAt).toLocaleString() : '',
        'paystack Reference': booking.paystack_ref || booking.paystack_reference || '',
        'uniqueBooking ID': booking.uniqueBookingId || '',
        'User ID': booking.user?._id || booking.user || '',
        'User Type': booking.user?.type || '',
        'Searchable User Type': booking.user?.type ? booking.user.type.charAt(0).toUpperCase() + booking.user.type.slice(1) : '',
        'Searchable Name': `${booking.firstName || ''} ${booking.middleName || ''} ${booking.lastName || ''}`.trim(),
        'Searchable Route': `${booking.from || ''} - ${booking.to || ''}`.trim()
      };
      processedRows.push(outboundRow);

      // If booking has return trip, create return trip row
      if (booking.returnTrip && booking.returnSeat) {
        // For return trip, discount is the other half
        const returnDiscount = discountedFare / 2;
        
        const returnRow: any = {
          'id': booking._id || booking.bookingId || '',
          'Trip Type': 'Return',
          'Trip seats': booking.returnSeat || '',
          'First Name': booking.firstName || '',
          'Second name': booking.middleName || '',
          'Last name': booking.lastName || '',
          'Email': booking.email || '',
          'Gender': booking.gender || '',
          'Phone': booking.phone || '',
          'Emergency First Name': booking.emergencyFirstName || '',
          'Emergency Last Name': booking.emergencyLastName || '',
          'Emergency Email': booking.emergencyEmail || '',
          'Emergency Phone': booking.emergencyPhone || '',
          'From': booking.to || '', // Return trip: from becomes to
          'To': booking.from || '', // Return trip: to becomes from
          'Trip Amount': booking.returnAmount || 0,
          'Return Amount': booking.returnAmount || 0,
          'Amount': booking.amount || totalAmount,
          'Discount': returnDiscount,
          'Payment Status': booking.paymentStatus || '',
          'Trip Title': booking.returnTrip?.title || '',
          'Trip Time': booking.returnTrip?.time || '',
          'Trip Date': booking.returnTrip?.tripDate || '',
          'Trip ID': booking.returnTrip?._id || '',
          'Trip bus': booking.returnTrip?.bus || '',
          'Trip Status': booking.returnTrip?.status || '',
          'Trip Created At': booking.returnTrip?.createdAt ? new Date(booking.returnTrip.createdAt).toLocaleString() : '',
          'Status': booking.status || '',
          'Mode of Payment': booking.mode || '',
          'Verification Attempts': booking.verificationAttempts || 0,
          'Tickets Sent': booking.ticketSent ? 'Yes' : 'No',
          'is Rescheduled': booking.isRescheduled ? 'Yes' : 'No',
          'Created At': booking.createdAt ? new Date(booking.createdAt).toLocaleString() : '',
          'Updated At': booking.updatedAt ? new Date(booking.updatedAt).toLocaleString() : '',
          'paystack Reference': booking.paystack_ref || booking.paystack_reference || '',
          'uniqueBooking ID': booking.uniqueBookingId || '',
          'User ID': booking.user?._id || booking.user || '',
          'User Type': booking.user?.type || '',
          'Searchable User Type': booking.user?.type ? booking.user.type.charAt(0).toUpperCase() + booking.user.type.slice(1) : '',
          'Searchable Name': `${booking.firstName || ''} ${booking.middleName || ''} ${booking.lastName || ''}`.trim(),
          'Searchable Route': `${booking.to || ''} - ${booking.from || ''}`.trim() // Reversed for return trip
        };
        processedRows.push(returnRow);
      }
    }

    // Create worksheet with ordered columns
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(processedRows, { 
      header: columnOrder 
    });
    
    // Set column widths for better readability (matching the column order)
    const colWidths = [
      { wch: 20 }, // id
      { wch: 12 }, // Trip seats
      { wch: 15 }, // First Name
      { wch: 15 }, // Second name
      { wch: 15 }, // Last name
      { wch: 15 }, // Phone
      { wch: 15 }, // Emergency Phone
      { wch: 15 }, // From
      { wch: 15 }, // To
      { wch: 12 }, // Trip Amount
      { wch: 15 }, // Payment Status
      { wch: 20 }, // Trip Title
      { wch: 12 }, // Trip Time
      { wch: 12 }, // Trip Date
      { wch: 15 }, // Status
      // Additional fields
      { wch: 12 }, // Trip Type
      { wch: 20 }, // Email
      { wch: 10 }, // Gender
      { wch: 18 }, // Emergency First Name
      { wch: 18 }, // Emergency Last Name
      { wch: 20 }, // Emergency Email
      { wch: 12 }, // Return Amount
      { wch: 12 }, // Amount
      { wch: 12 }, // Discount
      { wch: 20 }, // Trip ID
      { wch: 15 }, // Trip bus
      { wch: 12 }, // Trip Status
      { wch: 20 }, // Trip Created At
      { wch: 15 }, // Mode of Payment
      { wch: 18 }, // Verification Attempts
      { wch: 12 }, // Tickets Sent
      { wch: 12 }, // is Rescheduled
      { wch: 20 }, // Created At
      { wch: 20 }, // Updated At
      { wch: 20 }, // paystack Reference
      { wch: 20 }, // uniqueBooking ID
      { wch: 20 }, // User ID
      { wch: 12 }, // User Type
      { wch: 18 }, // Searchable User Type
      { wch: 25 }, // Searchable Name
      { wch: 25 }  // Searchable Route
    ];
    ws['!cols'] = colWidths;

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet 1');
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  }
}

