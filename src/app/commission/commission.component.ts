import { Component, OnInit } from '@angular/core';
import { HttpService } from 'src/services/http.service';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-commission',
  templateUrl: './commission.component.html',
  styleUrls: ['./commission.component.scss'],
  providers: [MessageService]
})
export class CommissionComponent implements OnInit {
  settings: any = {};
  buses: any[] = [];
  loading = false;
  saving = false;
  commissionRates: { [key: string]: number } = {};

  constructor(
    private httpService: HttpService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    // Load settings first, then load buses (which will migrate old rates)
    this.loadSettings();
  }

  loadSettings() {
    this.loading = true;
    this.httpService.getAuthData('settings').subscribe({
      next: (response: any) => {
        this.settings = response.data || {};
        // Initialize commission rates from settings
        if (this.settings.busCommissionRates) {
          this.commissionRates = { ...this.settings.busCommissionRates };
        }
        // After settings are loaded, load buses (which will migrate old rates to IDs)
        this.loadBuses();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading settings:', error);
        this.loading = false;
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'Failed to load settings' 
        });
      }
    });
  }

  loadBuses() {
    this.httpService.getAuthData('buses').subscribe({
      next: (response: any) => {
        if (response.data) {
          this.buses = response.data;
          
          // Migrate old title-based rates to ID-based rates
          const migratedRates: { [key: string]: number } = {};
          const oldRatesCount = Object.keys(this.commissionRates).length;
          let migratedCount = 0;
          
          this.buses.forEach((bus: any) => {
            const busId = bus._id || bus.id;
            const busTitle = bus.title || bus.type;
            
            if (busId) {
              // Check if there's an existing rate by ID
              if (this.commissionRates[busId] !== undefined) {
                migratedRates[busId] = this.commissionRates[busId];
              }
              // Check if there's an old rate by title/type and migrate it
              else if (busTitle && this.commissionRates[busTitle] !== undefined) {
                migratedRates[busId] = this.commissionRates[busTitle];
                migratedCount++;
                console.log(`Migrated commission rate for "${busTitle}" (${busId}): ₦${this.commissionRates[busTitle]}`);
              }
              // Initialize to 0 if no rate exists
              else {
                migratedRates[busId] = 0;
              }
            }
          });
          
          // Update commission rates to use IDs
          this.commissionRates = migratedRates;
          
          if (migratedCount > 0) {
            console.log(`Migrated ${migratedCount} commission rate(s) from title-based to ID-based keys`);
            this.messageService.add({
              severity: 'info',
              summary: 'Migration Complete',
              detail: `Migrated ${migratedCount} commission rate(s) to use bus IDs. Please save to update the database.`,
              life: 5000
            });
          }
        }
      },
      error: (error) => {
        console.error('Error loading buses:', error);
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'Failed to load buses' 
        });
      }
    });
  }

  saveSettings() {
    this.saving = true;
    
    this.httpService.updatePutData('settings', {
      busCommissionRates: this.commissionRates
    }).subscribe({
      next: (response: any) => {
        this.saving = false;
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Success', 
          detail: 'Commission rates saved successfully!' 
        });
        this.loadSettings(); // Reload to get updated data
      },
      error: (error) => {
        console.error('Error saving settings:', error);
        this.saving = false;
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'Failed to save commission rates. Please try again.' 
        });
      }
    });
  }

  getBusKey(bus: any): string {
    // Use bus ID as the key for commission rates
    return bus._id || bus.id || '';
  }

  getBusDisplayName(bus: any): string {
    return bus.title || bus.type || 'Unknown Bus';
  }
}

