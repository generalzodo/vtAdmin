import { Component, OnInit } from '@angular/core';
import { HttpService } from 'src/services/http.service';
import { MessageService, ConfirmationService } from 'primeng/api';

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
}

