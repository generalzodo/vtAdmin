import { Validators, FormBuilder } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import states from '../locations/states.json';
import { HttpService } from 'src/services/http.service';
import { ConfirmationService, MessageService, ConfirmEventType } from 'primeng/api';
import * as html2pdf from 'html2pdf.js';

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
  bookingInfoShow: boolean =  false;
  bookingInfo: any;

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
  }
  get f() { return this.bookingForm.controls; }

  showDialog() {

    this.displayBooking = true;
  }

  showBookingDialog(data:any) {
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
        'booking'
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
markAsUsed(booking:any, status: String){
this.currentID = booking._id
this.updateBooking({status: status})
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
}
