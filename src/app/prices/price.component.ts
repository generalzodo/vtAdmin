import { Validators, FormBuilder } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import states from './states.json';
import { HttpService } from 'src/services/http.service';
import { ConfirmationService, MessageService, ConfirmEventType } from 'primeng/api';

@Component({
  selector: 'app-price',
  templateUrl: './price.component.html',
  styleUrls: ['./price.component.scss'],
  providers: [MessageService, ConfirmationService]
})
export class PricesComponent implements OnInit {
  prices: any = []
  visible: boolean = false;
  priceForm: any;
  states: any = states;
  submitted: any
  loading: any
  submitType: string = '';
  displayPrice: boolean = false;
  currentID: any;

  constructor(private fb: FormBuilder, private httpService: HttpService, private service: MessageService, private confirmationService: ConfirmationService, private messageService: MessageService) {
    this.priceForm = this.fb.group({
      price: [undefined, Validators.required],

    })
  }
  ngOnInit(): void {
    this.pullPrices()
  }
  get f() { return this.priceForm.controls; }

  showDialog() {

    this.displayPrice = true;
  }

  pullPrices() {
    this.httpService
      .getAuthData(
        'price'
      )
      .subscribe((data: any) => {
        this.prices = data.data
      });
  }
  confirmDelete(id: any) {
    this.confirmationService.confirm({
      message: 'Do you want to delete this record?',
      header: 'Delete Confirmation',
      icon: 'pi pi-info-circle',
      accept: () => {
        this.deletePrices(id)
      },
      reject: () => {

      }
    });
  }

deletePrices(id: any) {
  this.httpService
    .deleteData(
      'price/', id
    )
    .subscribe((data: any) => {
      this.messageService.add({ severity: 'success', summary: 'Confirmed', detail: 'Record deleted' });

      this.pullPrices()
    });
}
populatePrice(price: any) {
  this.submitType = 'Edit';
  this.currentID = price._id
  this.priceForm.setValue({ title: price.title, address: price.address, state: price.state })
}

submitPrice() {

  this.submitted = true
  if (this.priceForm.invalid) {
    this.priceForm.markAllAsTouched();

    return;
  }
  this.loading = true;
  let data: any = { ...this.priceForm.value }
  if (this.submitType == 'Edit') this.updatePrice(data)
  if (this.submitType == 'Add') this.createPrice(data)
}

createPrice(data: any) {
  console.log('====================================');
  console.log(data);
  console.log('====================================');
  this.httpService
    .postAuthData(
      'price/', data
    )
    .subscribe((data: any) => {
      // this.listing = data.data
      this.loading = false
      this.displayPrice = false
      this.service.add({  severity: 'success', summary: 'Successful', detail: 'Price created successfully' });

      this.pullPrices();
      this.priceForm.reset()
    }, (err) => {
      this.loading = false

      console.log('====================================');
      console.log(err);
      console.log('====================================');
    });
}

updatePrice(data: any) {

  this.httpService
    .updateData(
      'price/' + this.currentID, data
    )
    .subscribe((data: any) => {
      // this.listing = data.data
      this.loading = false
      this.displayPrice = false
      this.service.add({  severity: 'success', summary: 'Successful', detail: 'Price updated successfully' });

      this.pullPrices()
      this.currentID = ''
    }, (err) => {
      this.loading = false

      console.log('====================================');
      console.log(err);
      console.log('====================================');
    });
}
}
