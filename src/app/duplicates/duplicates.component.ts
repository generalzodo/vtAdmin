import { Component, OnInit } from '@angular/core';
import { HttpService } from 'src/services/http.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { HelperService } from 'src/services/helper.service';

@Component({
  selector: 'app-duplicates',
  templateUrl: './duplicates.component.html',
  styleUrls: ['./duplicates.component.scss'],
  providers: [MessageService, ConfirmationService]
})
export class DuplicatesComponent implements OnInit {
  loading: boolean = false;
  selectedFilter: any = { title: 'Today', value: 'today' };
  dateFilter = [
    { title: 'Today', value: 'today' },
    { title: 'Last 7 days', value: 7 },
    { title: 'Last 30 days', value: 30 },
    { title: 'Last 60 days', value: 60 },
    { title: 'Last 3 months', value: 90 },
    { title: 'Last 6 months', value: 180 },
  ];
  
  autoCancelledBookings: any[] = [];
  needsReviewBookings: any[] = [];
  activeTab: 'cancelled' | 'needsReview' = 'cancelled';
  summary: any = {};
  totalCancelled: number = 0;
  showPaymentModal: boolean = false;
  selectedBooking: any = null;
  verifyingPayment: boolean = false;

  constructor(
    private httpService: HttpService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private helper: HelperService
  ) {}

  ngOnInit(): void {
    this.loadAutoCancelledBookings();
  }

  loadAutoCancelledBookings() {
    this.loading = true;
    let filter = '';
    
    if (this.selectedFilter.value === 'today') {
      const today = new Date().toISOString().split('T')[0];
      filter = `?from=${today}&to=${today}`;
    } else if (this.selectedFilter.value) {
      const dateRange = this.helper.getDateRange(this.selectedFilter.value);
      filter = `?from=${dateRange.from}&to=${dateRange.to}`;
    }
    
    this.httpService.getAuthData(`booking/auto-cancelled${filter}`)
      .subscribe(
        (data: any) => {
          // Separate cancelled and needs review bookings
          this.autoCancelledBookings = (data.bookings || []).filter((b: any) => b.status !== 'Needs Review');
          this.needsReviewBookings = (data.bookings || []).filter((b: any) => b.status === 'Needs Review');
          this.summary = data.summary || {};
          this.totalCancelled = data.summary?.total || 0;
          this.loading = false;
          
          if (this.totalCancelled === 0) {
            this.messageService.add({
              severity: 'success',
              summary: 'No Cancelled Bookings',
              detail: 'No cancelled bookings found in the selected date range.'
            });
          }
        },
            (error) => {
              console.error('Error loading cancelled bookings:', error);
              this.loading = false;
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to load cancelled bookings.'
              });
            }
      );
  }

  onFilterChange() {
    this.loadAutoCancelledBookings();
  }

  restoreBooking(booking: any) {
    this.confirmationService.confirm({
      message: `Restore booking ${booking.bookingId} for ${booking.firstName} ${booking.lastName}? This will re-confirm the booking and send ticket email if payment was successful.`,
      header: 'Restore Booking',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        const restoreData = {
          restorePaymentStatus: booking.paystack_ref || booking.flutterwave_ref || booking.paystack_reference ? 'success' : 'pending'
        };
        
        this.httpService.updateData(`booking/restore/${booking._id}`, restoreData)
          .subscribe(
            (data: any) => {
              this.messageService.add({
                severity: 'success',
                summary: 'Booking Restored',
                detail: `Booking ${booking.bookingId} has been restored and seat re-assigned.`
              });
              this.loadAutoCancelledBookings();
            },
            (error) => {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: error.error?.error || 'Failed to restore booking.'
              });
            }
          );
      }
    });
  }

  viewBookingDetails(booking: any) {
    this.messageService.add({
      severity: 'info',
      summary: 'Booking Details',
      detail: `Cancellation Reason: ${booking.cancellationReason || 'No reason provided'}`
    });
  }

  hasPaymentReference(booking: any): boolean {
    return !!(booking.paystack_ref || booking.paystack_reference || booking.flutterwave_ref);
  }

  getRiskLevel(booking: any): string {
    if (this.hasPaymentReference(booking)) {
      return 'high'; // High risk - had payment reference but was cancelled
    }
    if (booking.verificationAttempts >= 2) {
      return 'medium'; // Medium risk - multiple verification attempts
    }
    return 'low'; // Low risk - normal cancellation
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  verifyPayment(booking: any) {
    this.selectedBooking = booking;
    this.verifyingPayment = true;
    this.showPaymentModal = true;
    
    // Determine payment mode from booking
    const paymentMode = booking.mode || (booking.flutterwave_ref ? 'Flutterwave' : 'Paystack');
    
    // Verify based on payment mode
    if (paymentMode === 'Flutterwave') {
      const refs = [
        booking.flutterwave_ref,
        booking.bookingId
      ].filter(ref => ref);
      
      let verified = false;
      const promises = refs.map(ref => {
        return this.httpService.getAuthData(`payments/flutterwave/verify?tx_ref=${ref}`)
          .toPromise()
          .then((data: any) => {
            if ((data.status === 'success' || data.data?.status === 'successful') && !verified) {
              verified = true;
              this.selectedBooking.paymentVerified = true;
              this.selectedBooking.verificationData = data;
            }
          })
          .catch(() => {});
      });
      
      Promise.all(promises).then(() => {
        this.verifyingPayment = false;
      });
    } else {
      // Paystack verification
      const refs = [
        booking.paystack_ref,
        booking.paystack_reference,
        booking.bookingId
      ].filter(ref => ref);
      
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
        this.verifyingPayment = false;
      });
    }
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
              this.loadAutoCancelledBookings();
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

  cancelNeedsReviewBooking(booking: any) {
    this.confirmationService.confirm({
      message: `Cancel booking ${booking.bookingId} and free the seat? This will permanently cancel the booking and make the seat available again.`,
      header: 'Cancel Needs Review Booking',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.httpService.postData(`booking/cancelNeedsReview/${booking._id}`, {})
          .subscribe(
            (data: any) => {
              this.messageService.add({
                severity: 'success',
                summary: 'Booking Cancelled',
                detail: `Booking ${booking.bookingId} has been cancelled and seat freed.`
              });
              this.loadAutoCancelledBookings();
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
}
