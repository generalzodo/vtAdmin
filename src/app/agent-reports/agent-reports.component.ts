import { Component, OnInit } from '@angular/core';
import { HttpService } from 'src/services/http.service';
import { MessageService } from 'primeng/api';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-agent-reports',
  templateUrl: './agent-reports.component.html',
  styleUrls: ['./agent-reports.component.scss'],
  providers: [MessageService]
})
export class AgentReportsComponent implements OnInit {
  agents: any = [];
  selectedAgentId: string = '';
  fromDate: Date | null = null;
  toDate: Date | null = null;
  loading: boolean = false;
  reportData: any = null;

  constructor(
    private httpService: HttpService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.pullAgents();
  }

  pullAgents() {
    this.httpService
      .getAuthData('users/agents/all')
      .subscribe((data: any) => {
        if (data.success) {
          // Filter only approved agents and add displayName
          this.agents = (data.data || []).filter((agent: any) => 
            agent.agentStatus === 'approved'
          ).map((agent: any) => ({
            ...agent,
            displayName: `${agent.firstName} ${agent.lastName} (${agent.email})`
          }));
        }
      }, (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch agents' });
      });
  }

  generateReport() {
    if (!this.selectedAgentId) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Please select an agent' });
      return;
    }

    this.loading = true;
    const params: any = { agentId: this.selectedAgentId };
    if (this.fromDate) {
      params.from = this.fromDate.toISOString().split('T')[0];
    }
    if (this.toDate) {
      params.to = this.toDate.toISOString().split('T')[0];
    }

    const queryString = new URLSearchParams(params).toString();
    
    this.httpService
      .getAuthData(`booking/agent/report?${queryString}`)
      .subscribe((data: any) => {
        if (data.success) {
          this.reportData = data;
        }
        this.loading = false;
      }, (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.error || 'Failed to fetch report' });
        this.loading = false;
      });
  }

  exportToExcel() {
    if (!this.reportData) return;

    const headers = ['Date', 'Route', 'Bus Type', 'Passenger Name', 'Seat No', 'Return Seat', 'Fare', 'Commission', 'Net'];
    const rows = this.reportData.bookings.map((booking: any) => [
      new Date(booking.date).toLocaleDateString(),
      booking.route,
      booking.busType,
      booking.passengerName,
      booking.seatNo,
      booking.returnSeatNo || 'N/A',
      booking.fare.toFixed(2),
      booking.commission.toFixed(2),
      booking.net.toFixed(2),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row: any) => row.join(',')),
      '',
      'Summary',
      `Total Bookings,${this.reportData.summary.totalBookings}`,
      `Total Fare,${this.reportData.summary.totalFare.toFixed(2)}`,
      `Total Commission,${this.reportData.summary.totalCommission.toFixed(2)}`,
      `Total Net,${this.reportData.summary.totalNet.toFixed(2)}`,
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-report-${this.selectedAgentId}-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}

