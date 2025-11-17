import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import states from '../locations/states.json';
import { HttpService } from 'src/services/http.service';
import { ConfirmationService, MessageService, ConfirmEventType } from 'primeng/api';
import * as html2pdf from 'html2pdf.js';
import * as XLSX from 'xlsx';
import { __values } from 'tslib';

@Component({
  selector: 'app-withdrawals',
  templateUrl: './withdrawals.component.html',
  styleUrls: ['./withdrawals.component.scss'],
  providers: [MessageService, ConfirmationService]
})
export class WithdrawalsComponent implements OnInit {
  withdrawals: any = []
  visible: boolean = false;
  bookingForm: any;
  states: any = states;
  submitted: any
  loading: any
  submitType: string = '';
  displayWithdrawal: boolean = false;
  currentID: any;
  bookingInfoShow: boolean = false;1
  bookingInfo: any;
  passengerForm: FormGroup;
  locations: any;
  minDate: Date;
  maxDate: Date;
  currentPage = 'one';
  results: any;
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
    this.pullWithdrawals()
  }
  showDialog() {

    this.displayWithdrawal = true;
  }

  // showWithdrawalDialog(data: any) {
  //   this.bookingInfoShow = true;
  //   this.bookingInfo = data
  // }

  pullWithdrawals() {
    this.httpService
      .getAuthData(
        'users/withdrawals'
      )
      .subscribe((data: any) => {
        this.withdrawals = data.data
      });
  }
  confirmDelete(id: any) {
    this.confirmationService.confirm({
      message: 'Do you want to delete this record?',
      header: 'Delete Confirmation',
      icon: 'pi pi-info-circle',
      accept: () => {
        this.deleteWithdrawals(id)
      },
      reject: () => {

      }
    });
  }

  deleteWithdrawals(id: any) {
    this.httpService
      .deleteData(
        'withdrawals/', id
      )
      .subscribe((data: any) => {
        this.messageService.add({ severity: 'success', summary: 'Confirmed', detail: 'Record deleted' });

        this.pullWithdrawals()
      });
  }
 
  approvalWithdrawal(data: any) {
    this.confirmationService.confirm({
      message: 'Do you want to approve this transaction?',
      header: 'Approve Confirmation',
      icon: 'pi pi-info-circle',
      accept: () => {
        this.loading = true;
        this.httpService
          .getAuthData(
            'users/approveTransaction/' + data._id
          )
          .subscribe((response: any) => {
            this.loading = false;
            this.displayWithdrawal = false;
            this.messageService.add({ 
              severity: 'success', 
              summary: 'Success', 
              detail: response.message || 'Withdrawal approved successfully' 
            });
            this.pullWithdrawals();
            this.currentID = '';
          }, (err) => {
            this.loading = false;
            const errorMessage = err?.error?.error || err?.error?.message || 'Failed to approve withdrawal';
            this.messageService.add({ 
              severity: 'error', 
              summary: 'Error', 
              detail: errorMessage 
            });
            console.error('Error approving withdrawal:', err);
          });
      },
      reject: () => {
        // User cancelled
      }
    });
  }
  rejectWithdrawal(data: any) {
    this.confirmationService.confirm({
      message: 'Do you want to reject this transaction?',
      header: 'Delete Confirmation',
      icon: 'pi pi-info-circle',
      accept: () => {
    this.httpService
      .getAuthData(
        'users/rejectTransaction/' + data._id
      )
      .subscribe((data: any) => {
        // this.listing = data.data
        this.loading = false
        this.displayWithdrawal = false
        this.service.add({ key: 'tst', severity: 'success', summary: 'Successful', detail: 'Withdrawal rejected successfully' });

        this.pullWithdrawals()
        this.currentID = ''
      }, (err) => {
        this.loading = false

        console.log('====================================');
        console.log(err);
        console.log('====================================');
      });
    },
    reject: () => {

    }
  });
  }
}

