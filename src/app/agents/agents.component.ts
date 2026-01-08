import { Component, OnInit } from '@angular/core';
import { HttpService } from 'src/services/http.service';
import { ConfirmationService, MessageService } from 'primeng/api';

@Component({
  selector: 'app-agents',
  templateUrl: './agents.component.html',
  styleUrls: ['./agents.component.scss'],
  providers: [MessageService, ConfirmationService]
})
export class AgentsComponent implements OnInit {
  pendingAgents: any = [];
  allAgents: any = [];
  loading: boolean = false;
  processingId: string | null = null;
  selectedAgent: any = null;
  displayApprovalDialog: boolean = false;
  displayRejectionDialog: boolean = false;
  displayIdCardDialog: boolean = false;
  commissionRate: number = 0;
  rejectionReason: string = '';
  activeTabIndex: number = 0; // Track active tab: 0 = Pending, 1 = All Agents

  constructor(
    private httpService: HttpService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.pullPendingAgents();
    this.pullAllAgents();
  }

  onTabChange(event: any) {
    this.activeTabIndex = event.index;
    console.log('Active tab:', this.activeTabIndex === 0 ? 'Pending Approval' : 'All Agents');
  }

  pullPendingAgents() {
    this.loading = true;
    this.httpService
      .getAuthData('users/agents/pending')
      .subscribe((data: any) => {
        if (data.success) {
          this.pendingAgents = data.data || [];
        }
        this.loading = false;
      }, (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch pending agents' });
        this.loading = false;
      });
  }

  pullAllAgents() {
    this.httpService
      .getAuthData('users/agents/all')
      .subscribe((data: any) => {
        if (data.success) {
          this.allAgents = data.data || [];
        }
      }, (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch all agents' });
      });
  }

  showApprovalDialog(agent: any) {
    this.selectedAgent = agent;
    this.commissionRate = 0;
    this.displayApprovalDialog = true;
  }

  showIdCardDialog(agent: any) {
    this.selectedAgent = agent;
    this.displayIdCardDialog = true;
  }

  approveAgent() {
    this.processingId = this.selectedAgent._id;
    const payload = {
      status: 'approved'
    };

    this.httpService
      .updateData(`users/agents/${this.selectedAgent._id}/status`, payload)
      .subscribe((data: any) => {
        if (data.success) {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Agent approved successfully' });
          this.displayApprovalDialog = false;
          this.selectedAgent = null;
          this.commissionRate = 0;
          this.pullPendingAgents();
          this.pullAllAgents();
        }
        this.processingId = null;
      }, (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.error || 'Failed to approve agent' });
        this.processingId = null;
      });
  }

  showRejectionDialog(agent: any) {
    this.selectedAgent = agent;
    this.rejectionReason = '';
    this.displayRejectionDialog = true;
  }

  rejectAgent() {
    if (!this.rejectionReason || this.rejectionReason.trim().length === 0) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Please provide a reason for rejection' });
      return;
    }

    this.processingId = this.selectedAgent._id;
    const payload = {
      status: 'rejected',
      rejectionReason: this.rejectionReason.trim()
    };

    this.httpService
      .updateData(`users/agents/${this.selectedAgent._id}/status`, payload)
      .subscribe((data: any) => {
        if (data.success) {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Agent rejected successfully. Rejection email sent.' });
          this.displayRejectionDialog = false;
          this.selectedAgent = null;
          this.rejectionReason = '';
          this.pullPendingAgents();
          this.pullAllAgents();
        }
        this.processingId = null;
      }, (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.error || 'Failed to reject agent' });
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

  formatIdCardType(type: string) {
    if (!type) return 'N/A';
    const types: any = {
      'voters_card': "Voter's Card",
      'nin': 'NIN',
      'drivers_licence': "Driver's Licence",
      'international_passport': 'International Passport'
    };
    return types[type] || type;
  }

  formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  hasIdCardFile(agent: any): boolean {
    if (!agent?.idCardFile) return false;
    const fileData = agent.idCardFile;
    if (typeof fileData === 'string') {
      return fileData.trim().length > 0;
    }
    return !!fileData;
  }

  isImageFile(fileData: string): boolean {
    if (!fileData) return false;
    return fileData.startsWith('data:image/') || 
           fileData.startsWith('http') && /\.(jpg|jpeg|png|gif|webp)$/i.test(fileData);
  }

  isPdfFile(fileData: string): boolean {
    if (!fileData) return false;
    return fileData.startsWith('data:application/pdf') || 
           fileData.startsWith('http') && /\.pdf$/i.test(fileData);
  }

  downloadIdCard(agent: any) {
    if (!agent?.idCardFile) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No ID card file available' });
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = agent.idCardFile;
      link.download = `${agent.firstName}_${agent.lastName}_ID_Card.${this.isPdfFile(agent.idCardFile) ? 'pdf' : 'jpg'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      this.messageService.add({ severity: 'success', summary: 'Success', detail: 'ID card download started' });
    } catch (err) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to download ID card' });
    }
  }
}
