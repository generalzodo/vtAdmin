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
  selectedFilter: any = { title: 'Last 7 Days', value: 7 };
  dateFilter = [
    { title: 'Last 7 days', value: 7 },
    { title: 'Last 30 days', value: 30 },
    { title: 'Last 60 days', value: 60 },
    { title: 'Last 3 months', value: 90 },
    { title: 'Last 6 months', value: 180 },
  ];
  
  autoCancelledBookings: any[] = [];
  summary: any = {};
  totalCancelled: number = 0;

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
    if (this.selectedFilter.value) {
      const dateRange = this.helper.getDateRange(this.selectedFilter.value);
      filter = `?from=${dateRange.from}&to=${dateRange.to}`;
    }
    
    this.httpService.getAuthData(`booking/auto-cancelled${filter}`)
      .subscribe(
        (data: any) => {
          this.autoCancelledBookings = data.bookings || [];
          this.summary = data.summary || {};
          this.totalCancelled = data.summary?.total || 0;
          this.loading = false;
          
          if (this.totalCancelled === 0) {
            this.messageService.add({
              severity: 'success',
              summary: 'No Auto-Cancelled Bookings',
              detail: 'No bookings were automatically cancelled in the selected date range.'
            });
          }
        },
        (error) => {
          console.error('Error loading auto-cancelled bookings:', error);
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load auto-cancelled bookings.'
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
}
