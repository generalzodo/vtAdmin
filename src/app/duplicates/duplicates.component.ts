import { Component, OnInit } from '@angular/core';
import { HttpService } from 'src/services/http.service';
import { ConfirmationService, MessageService } from 'primeng/api';

@Component({
  selector: 'app-duplicates',
  templateUrl: './duplicates.component.html',
  styleUrls: ['./duplicates.component.scss'],
  providers: [MessageService, ConfirmationService]
})
export class DuplicatesComponent implements OnInit {
  loading: boolean = false;
  fromDate: Date;
  toDate: Date;
  minDate: Date;
  maxDate: Date;
  
  tripConflicts: any[] = [];
  returnTripConflicts: any[] = [];
  verificationSummary: any = {};
  totalConflicts: number = 0;

  constructor(
    private httpService: HttpService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {
    this.minDate = new Date();
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    this.fromDate = today;
    this.toDate = nextWeek;
    this.maxDate = new Date('2030-12-31');
  }

  ngOnInit(): void {
    this.checkDuplicates();
  }

  checkDuplicates() {
    this.loading = true;
    const from = this.formatDate(this.fromDate);
    const to = this.formatDate(this.toDate);
    
    this.httpService.getAuthData(`booking/duplicates?from=${from}&to=${to}`)
      .subscribe(
        (data: any) => {
          this.tripConflicts = data.tripConflicts || [];
          this.returnTripConflicts = data.returnTripConflicts || [];
          this.verificationSummary = data.verificationSummary || {};
          this.totalConflicts = data.totalConflicts || 0;
          
          this.loading = false;
          
          if (this.totalConflicts === 0) {
            this.messageService.add({
              severity: 'success',
              summary: 'No Conflicts',
              detail: 'No duplicate bookings found in the selected date range.'
            });
          }
        },
        (error) => {
          console.error('Error checking duplicates:', error);
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to check for duplicate bookings.'
          });
        }
      );
  }

  confirmPayment(booking: any) {
    this.confirmationService.confirm({
      message: `Confirm payment for booking ${booking.bookingId}? This will mark the payment as successful and send the ticket email.`,
      header: 'Confirm Payment',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.httpService.updateData(`booking/confirmPayment/${booking._id}`, {})
          .subscribe(
            (data: any) => {
              this.messageService.add({
                severity: 'success',
                summary: 'Payment Confirmed',
                detail: `Booking ${booking.bookingId} confirmed and ticket sent.`
              });
              // Refresh the list
              this.checkDuplicates();
            },
            (error) => {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to confirm payment.'
              });
            }
          );
      }
    });
  }

  cancelBooking(booking: any) {
    this.confirmationService.confirm({
      message: `Cancel booking ${booking.bookingId} for ${booking.passenger.firstName} ${booking.passenger.lastName}? This will free the seat and refund according to cancellation policy.`,
      header: 'Cancel Booking',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.httpService.getAuthData(`booking/cancel/${booking._id}`)
          .subscribe(
            (data: any) => {
              this.messageService.add({
                severity: 'success',
                summary: 'Booking Cancelled',
                detail: `Booking ${booking.bookingId} has been cancelled and seat freed.`
              });
              // Refresh the list
              this.checkDuplicates();
            },
            (error) => {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: error.error?.error || 'Failed to cancel booking.'
              });
            }
          );
      }
    });
  }

  markAsHandled(booking: any) {
    this.httpService.updateData(`booking/${booking._id}`, { handled: true })
      .subscribe(
        (data: any) => {
          this.messageService.add({
            severity: 'info',
            summary: 'Marked as Handled',
            detail: 'Booking has been marked as handled.'
          });
          this.checkDuplicates();
        },
        (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to mark booking as handled.'
          });
        }
      );
  }

  getPaymentBadgeClass(booking: any): string {
    if (booking.paymentStatus === 'success' || booking.paymentStatus === 'admin paid') {
      return 'badge-success';
    }
    if (booking.paystackVerification?.paystackStatus === 'success') {
      return 'badge-needs-confirmation';
    }
    if (booking.paystackVerification?.checked && booking.paystackVerification?.paystackStatus === 'not_found') {
      return 'badge-failed';
    }
    return 'badge-unknown';
  }

  getPaymentBadgeText(booking: any): string {
    if (booking.paymentStatus === 'success' || booking.paymentStatus === 'admin paid') {
      return '✓ Paid';
    }
    if (booking.paystackVerification?.paystackStatus === 'success') {
      return '⚠ Needs Confirmation';
    }
    if (booking.paystackVerification?.checked && booking.paystackVerification?.paystackStatus === 'not_found') {
      return '✗ Payment Failed';
    }
    return '? Unknown';
  }

  needsConfirmation(booking: any): boolean {
    return booking.paystackVerification?.paystackStatus === 'success' && 
           booking.paymentStatus !== 'success' && 
           booking.paymentStatus !== 'admin paid';
  }

  formatDate(date: Date): string {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${year}-${month}-${day}`;
  }

  formatDisplayDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }
}

