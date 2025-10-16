import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpService } from 'src/services/http.service';

@Component({
  selector: 'app-terms',
  templateUrl: './terms.component.html',
  styleUrls: ['./terms.component.scss']
})
export class TermsComponent implements OnInit {
  settings: any = {};
  loading = false;
  saving = false;
  activeTab = 'terms';

  // Quill editor configurations
  quillConfig = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['link'],
      ['clean']
    ]
  };

  constructor(private httpService: HttpService) {}

  ngOnInit() {
    this.loadSettings();
  }

  loadSettings() {
    this.loading = true;
    this.httpService.getAuthData('settings').subscribe({
      next: (response: any) => {
        this.settings = response.data || {};
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading settings:', error);
        this.loading = false;
        // Initialize with default values if API fails
        this.settings = {
          termsAndConditions: '',
          ticketTerms: ''
        };
      }
    });
  }

  saveSettings() {
    this.saving = true;
    
    this.httpService.updatePutData('settings', {
      termsAndConditions: this.settings.termsAndConditions,
      ticketTerms: this.settings.ticketTerms
    }).subscribe({
      next: (response: any) => {
        this.saving = false;
        alert('Settings saved successfully!');
      },
      error: (error) => {
        console.error('Error saving settings:', error);
        this.saving = false;
        alert('Error saving settings. Please try again.');
      }
    });
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  getPreviewContent(): string {
    const content = this.activeTab === 'terms' 
      ? this.settings.termsAndConditions 
      : this.settings.ticketTerms;
    
    if (!content) return '<p class="text-gray-500 italic">No content to preview</p>';
    
    return content;
  }
}
