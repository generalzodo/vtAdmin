import { Validators, FormBuilder } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import states from '../locations/states.json';
import { HttpService } from 'src/services/http.service';
import { ConfirmationService, MessageService, ConfirmEventType } from 'primeng/api';

@Component({
  selector: 'app-buses',
  templateUrl: './buses.component.html',
  styleUrls: ['./buses.component.scss'],
  providers: [MessageService, ConfirmationService]
})
export class BusesComponent implements OnInit {
  buses: any = []
  types: any  = [
    {title: 'Toyota Hiace Bus'},
    {title: 'Toyota Sienna'},
    {title: 'JAC'},
    {title: 'Cargo 1'}
  ]
  visible: boolean = false;
  busForm: any;
  states: any = states;
  submitted: any
  loading: any
  submitType: string = '';
  displayBus: boolean = false;
  currentID: any;
  seatLayout: string[] = [];
  lastAddedIndex: number | null = null;

  constructor(private fb: FormBuilder, private httpService: HttpService, private service: MessageService, private confirmationService: ConfirmationService, private messageService: MessageService) {
    this.busForm = this.fb.group({
      title: [undefined, Validators.required],
      type: [undefined, Validators.required],
      seats: [undefined, Validators.required],
      photo: [],
      seatLayout: [[]]
    })
  }
  ngOnInit(): void {
    this.pullBuses()
  }
  get f() { return this.busForm.controls; }

  showDialogForAdd() {
    this.submitType = 'Add';
    this.displayBus = true;
    this.seatLayout = ['STEERING'];
    this.busForm.reset();
    this.busForm.get('seatLayout').setValue(['STEERING']);
  }

  showDialogForEdit(bus: any) {
    this.populateBus(bus);
    this.displayBus = true;
  }

  pullBuses() {
    this.httpService
      .getAuthData(
        'buses'
      )
      .subscribe((data: any) => {
        this.buses = data.data
      });
  }
  confirmDelete(id: any) {
    this.confirmationService.confirm({
      message: 'Do you want to delete this record?',
      header: 'Delete Confirmation',
      icon: 'pi pi-info-circle',
      accept: () => {
        this.deleteBuss(id)
      },
      reject: () => {

      }
    });
  }

deleteBuss(id: any) {
  this.httpService
    .deleteData(
      'buses/', id
    )
    .subscribe((data: any) => {
      this.messageService.add({ severity: 'success', summary: 'Confirmed', detail: 'Record deleted' });

      this.pullBuses()
    });
}
populateBus(bus: any) {
  this.submitType = 'Edit';
  this.currentID = bus._id;
  this.busForm.patchValue({
    title: bus.title,
    type: bus.type,
    seats: bus.seats,
    photo: bus.photo,
    seatLayout: bus.seatLayout || []
  });
  this.seatLayout = bus.seatLayout ? [...bus.seatLayout] : [];
}

submitBus() {
  this.submitted = true
  if (this.busForm.invalid) {
    this.busForm.markAllAsTouched();

    return;
  }
  this.loading = true;
  let data: any = { ...this.busForm.value, seatLayout: this.seatLayout };
  if (this.submitType == 'Edit') this.updateBus(data)
  if (this.submitType == 'Add') this.createBus(data)
}

// Drag-and-drop handlers
addSeat(label: string) {
  if (label === 'STEERING') {
    if (!this.seatLayout.includes('STEERING')) {
      this.seatLayout.unshift('STEERING');
      this.busForm.get('seatLayout').setValue(this.seatLayout);
      this.lastAddedIndex = 0;
      setTimeout(() => this.lastAddedIndex = null, 1000);
    }
    return;
  }
  if (!this.seatLayout.includes(label)) {
    this.seatLayout.push(label);
    this.busForm.get('seatLayout').setValue(this.seatLayout);
    this.lastAddedIndex = this.seatLayout.length - 1;
    setTimeout(() => this.lastAddedIndex = null, 1000);
  }
}
addSpace() {
  this.seatLayout.push('SPACE');
  this.busForm.get('seatLayout').setValue(this.seatLayout);
  this.lastAddedIndex = this.seatLayout.length - 1;
  setTimeout(() => this.lastAddedIndex = null, 1000);
}
addRow() {
  // Only add 'ROW' if the last item isn't already a row marker
  if (this.seatLayout.length === 0 || this.seatLayout[this.seatLayout.length - 1] === 'ROW') {
    return;
  }
  this.seatLayout.push('ROW');
  this.busForm.get('seatLayout').setValue(this.seatLayout);
  this.lastAddedIndex = this.seatLayout.length - 1;
  setTimeout(() => this.lastAddedIndex = null, 1000);
}
removeSeat(index: number) {
  // Prevent removing steering if it's the only item
  if (this.seatLayout[index] === 'STEERING' && this.seatLayout.length === 1) {
    return;
  }
  this.seatLayout.splice(index, 1);
  this.busForm.get('seatLayout').setValue(this.seatLayout);
}

createBus(data: any) {
  console.log('====================================');
  console.log(data);
  console.log('====================================');
  this.httpService
    .postAuthData(
      'buses/', data
    )
    .subscribe((data: any) => {
      // this.listing = data.data
      this.loading = false
      this.displayBus = false
      this.service.add({  severity: 'success', summary: 'Successful', detail: 'Bus created successfully' });

      this.pullBuses();
      this.busForm.reset()
    }, (err) => {
      this.loading = false

      console.log('====================================');
      console.log(err);
      console.log('====================================');
    });
}

updateBus(data: any) {

  this.httpService
    .updateData(
      'buses/' + this.currentID, data
    )
    .subscribe((data: any) => {
      // this.listing = data.data
      this.loading = false
      this.displayBus = false
      this.service.add({  severity: 'success', summary: 'Successful', detail: 'Bus updated successfully' });

      this.pullBuses()
      this.currentID = ''
    }, (err) => {
      this.loading = false

      console.log('====================================');
      console.log(err);
      console.log('====================================');
    });
}

getSeatLayoutIndex(rowIdx: number, seatIdx: number): number {
  // Split the seatLayout into rows using 'ROW' as marker
  let idx = 0, rowCount = 0;
  for (let i = 0; i < this.seatLayout.length; i++) {
    if (this.seatLayout[i] === 'ROW') {
      rowCount++;
      if (rowCount > rowIdx) break;
      continue;
    }
    if (rowCount === rowIdx && seatIdx-- === 0) return i;
    if (rowCount === rowIdx) idx = i;
  }
  // fallback
  return idx;
}

getRowsWithIndices(): { value: string, index: number }[][] {
  const rows: { value: string, index: number }[][] = [];
  let current: { value: string, index: number }[] = [];
  this.seatLayout.forEach((item, idx) => {
    if (item === 'ROW') {
      rows.push(current);
      current = [];
    } else {
      current.push({ value: item, index: idx });
    }
  });
  if (current.length) rows.push(current);
  return rows;
}
clearAllSeats() {
  this.seatLayout = ['STEERING'];
  this.busForm.get('seatLayout').setValue(['STEERING']);
}
sortablejsOptions = {
  animation: 150,
  onMove: (evt: any) => {
    // Prevent dragging steering from index 0
    if (evt.dragged && evt.dragged.innerText.trim() === '🛞' && evt.oldIndex === 0) {
      return false;
    }
    // Prevent dropping before steering
    if (evt.related && evt.related.innerText.trim() === '🛞' && evt.newIndex === 0) {
      return false;
    }
    return true;
  },
  onEnd: (evt: any) => {
    // Always force steering to index 0 after drag
    const steeringIdx = this.seatLayout.indexOf('STEERING');
    if (steeringIdx > 0) {
      this.seatLayout.splice(steeringIdx, 1);
      this.seatLayout.unshift('STEERING');
      this.busForm.get('seatLayout').setValue(this.seatLayout);
    }
  }
};
}
