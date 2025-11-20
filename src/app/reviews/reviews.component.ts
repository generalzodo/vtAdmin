import { Component, OnInit } from '@angular/core';
import { HttpService } from 'src/services/http.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-reviews',
  templateUrl: './reviews.component.html',
  styleUrls: ['./reviews.component.scss'],
  providers: [MessageService, ConfirmationService]
})
export class ReviewsComponent implements OnInit {
  reviews: any = [];
  loading: boolean = false;
  processingId: string | null = null;
  statusFilter: string = 'all';
  ratingFilter: string = 'all';
  fromDate: Date | null = null;
  toDate: Date | null = null;

  constructor(
    private httpService: HttpService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.pullReviews();
  }

  pullReviews() {
    this.loading = true;
    const params: any = {};
    if (this.statusFilter !== 'all') params.status = this.statusFilter;
    if (this.ratingFilter !== 'all') params.rating = this.ratingFilter;
    if (this.fromDate) {
      params.from = this.fromDate.toISOString().split('T')[0];
    }
    if (this.toDate) {
      params.to = this.toDate.toISOString().split('T')[0];
    }

    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `reviews?${queryString}` : 'reviews';

    this.httpService
      .getAuthData(endpoint)
      .subscribe((data: any) => {
        if (data.success) {
          this.reviews = data.data || [];
        }
        this.loading = false;
      }, (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch reviews' });
        this.loading = false;
      });
  }

  updateReviewStatus(reviewId: string, status: string) {
    this.processingId = reviewId;
    const payload = { status };

    this.httpService
      .updateData(`reviews/${reviewId}/status`, payload)
      .subscribe((data: any) => {
        if (data.success) {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: `Review ${status} successfully` });
          this.pullReviews();
        }
        this.processingId = null;
      }, (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.error || 'Failed to update review status' });
        this.processingId = null;
      });
  }

  getStatusBadge(status: string) {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'danger';
      case 'pending':
        return 'warning';
      default:
        return 'secondary';
    }
  }

  formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  renderStars(rating: number) {
    return Array(rating).fill('⭐').join('') + Array(5 - rating).fill('☆').join('');
  }

  exportToExcel() {
    if (!this.reviews || this.reviews.length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'No reviews to export' });
      return;
    }

    // Define column order
    const columnOrder = [
      'Date',
      'Passenger Name',
      'Passenger Email',
      'Passenger Phone',
      'Booking ID',
      'Trip Date',
      'Route',
      'Rating',
      'Comment',
      'Status'
    ];

    // Process reviews for export
    const processedRows = this.reviews.map((review: any) => ({
      'Date': this.formatDate(review.createdAt),
      'Passenger Name': `${review.userId?.firstName || ''} ${review.userId?.lastName || ''}`.trim(),
      'Passenger Email': review.userId?.email || '',
      'Passenger Phone': review.userId?.phone || '',
      'Booking ID': review.bookingId?.bookingId || '',
      'Trip Date': review.bookingId?.tripDate || '',
      'Route': `${review.bookingId?.from || ''} → ${review.bookingId?.to || ''}`,
      'Rating': review.rating || 0,
      'Comment': review.comment || 'No comment',
      'Status': review.status || ''
    }));

    // Create worksheet with ordered columns
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(processedRows, { 
      header: columnOrder 
    });
    
    // Set column widths for better readability
    const colWidths = [
      { wch: 20 }, // Date
      { wch: 20 }, // Passenger Name
      { wch: 25 }, // Passenger Email
      { wch: 15 }, // Passenger Phone
      { wch: 15 }, // Booking ID
      { wch: 12 }, // Trip Date
      { wch: 20 }, // Route
      { wch: 8 },  // Rating
      { wch: 40 }, // Comment
      { wch: 12 }  // Status
    ];
    ws['!cols'] = colWidths;

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reviews');
    XLSX.writeFile(wb, `reviews_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Reviews exported successfully' });
  }
}

