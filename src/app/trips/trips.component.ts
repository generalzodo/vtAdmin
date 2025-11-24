import { Validators, FormBuilder } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import states from '../locations/states.json';
import { HttpService } from 'src/services/http.service';
import { ConfirmationService, MessageService, ConfirmEventType } from 'primeng/api';
import * as XLSX from 'xlsx';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-trips',
  templateUrl: './trips.component.html',
  styleUrls: ['./trips.component.scss'],
  providers: [MessageService, ConfirmationService]
})
export class TripsComponent implements OnInit {
  trips: any = []
  visible: boolean = false;
  tripForm: any;
  states: any = states;
  submitted: any
  loading: any
  submitType: string = '';
  displayTrip: boolean = false;
  currentID: any;
  buses: any;
  routes: any;
  drivers: any;
  selectedRecordIds: any = [];
  checkAllStatus:boolean = false
  currentTrip: any = {
    transportOfficerName: '',
    vehicleNo: '',
    bookings: [],
    selectedDriverId: null
  };
  displayTripManifest:any;
  lastRouteTitle: string = '';
  onboardingAll: boolean = false;
  constructor(private fb: FormBuilder, private httpService: HttpService, private service: MessageService, private confirmationService: ConfirmationService, private messageService: MessageService) {
    this.tripForm = this.fb.group({
      title: [undefined],
      route: [undefined],
      time: [undefined, ],
      busNo: [undefined],
      driver: [undefined,],
      tripDate: [undefined, ],
      isWalkIn: [false],
      walkInTimeSlot: [undefined],
      capacity: [undefined]

    })
  }
  ngOnInit(): void {
    this.pullTrips()
    this.pullRoutes()
    this.pullDrivers()
    
    // Auto-fill title when route is selected (after routes are loaded)
    this.tripForm.get('route')?.valueChanges.subscribe((routeId) => {
      if (routeId && this.routes) {
        const selectedRoute = this.routes.find((r: any) => r._id === routeId);
        if (selectedRoute && selectedRoute.title) {
          // Only auto-fill if title is empty or if it matches a previous route title
          const currentTitle = this.tripForm.get('title')?.value;
          if (!currentTitle || currentTitle === this.lastRouteTitle) {
            this.tripForm.patchValue({ title: selectedRoute.title });
            this.lastRouteTitle = selectedRoute.title;
          }
        }
      }
    });
  }
  get f() { return this.tripForm.controls; }

  showDialog() {
    // Reset form when opening dialog for new trip
    this.tripForm.reset({
      title: undefined,
      isWalkIn: false,
      route: undefined,
      time: undefined,
      busNo: undefined,
      driver: undefined,
      tripDate: undefined,
      walkInTimeSlot: undefined,
      capacity: undefined
    });
    this.lastRouteTitle = '';
    this.submitType = 'Add';
    this.displayTrip = true;
  }

  pullTrips() {
    this.httpService
      .getAuthData(
        'trips'
      )
      .subscribe((data: any) => {
        // Add a searchable field for walk-in trips
        this.trips = data.data.map((trip: any) => ({
          ...trip,
          searchableType: trip.isWalkIn ? 'walk-in walk in' : 'scheduled',
          searchableTime: trip.isWalkIn ? (trip.walkInTimeSlot || 'walk-in walk in') : (trip.time || '')
        }));
      });
  }
  
  pullTripsManifest(trip) {
    // Initialize currentTrip with default values
    this.currentTrip = {
      transportOfficerName: '',
      vehicleNo: '',
      bookings: [],
      selectedDriverId: null
    };
    
    this.httpService
      .getAuthData(
        'trips/manifest/'+trip._id
      )
      .subscribe((data: any) => {
        if (data.success) {
          // Find matching driver if transportOfficerName exists
          let selectedDriverId = null;
          if (data.trip?.transportOfficerName && this.drivers) {
            const matchingDriver = this.drivers.find((d: any) => {
              const fullName = `${d.firstName} ${d.lastName}`.trim();
              return fullName === data.trip.transportOfficerName ||
                     d.firstName === data.trip.transportOfficerName ||
                     d.lastName === data.trip.transportOfficerName;
            });
            if (matchingDriver) {
              selectedDriverId = matchingDriver._id;
            }
          }
          
          // Update trip with manifest data
          this.currentTrip = {
            ...trip,
            ...data.trip,
            transportOfficerName: data.trip?.transportOfficerName || '',
            vehicleNo: data.trip?.vehicleNo || '',
            bookings: data.bookings || [],
            selectedDriverId: selectedDriverId
          };
          
          console.log('Manifest data loaded:', {
            trip: this.currentTrip,
            bookingsCount: this.currentTrip.bookings?.length || 0,
            bookings: this.currentTrip.bookings
          });
        }
      }, (err) => {
        console.error('Error fetching trip manifest:', err);
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'Failed to load trip manifest' 
        });
      });
  }

  updateTripManifest() {
    if (!this.currentTrip || !this.currentTrip._id) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Trip information not loaded' });
      return;
    }
    
    // Get transport officer name from selected driver
    let transportOfficerName = '';
    if (this.currentTrip.selectedDriverId && this.drivers) {
      const selectedDriver = this.drivers.find((d: any) => d._id === this.currentTrip.selectedDriverId);
      if (selectedDriver) {
        transportOfficerName = `${selectedDriver.firstName} ${selectedDriver.lastName}`.trim();
      }
    } else if (this.currentTrip.transportOfficerName) {
      // Fallback to existing name if no driver selected
      transportOfficerName = this.currentTrip.transportOfficerName;
    }
    
    const manifestData = {
      transportOfficerName: transportOfficerName,
      vehicleNo: this.currentTrip.vehicleNo || ''
    };
    
    this.httpService
      .updateData('trips/manifest/' + this.currentTrip._id, manifestData)
      .subscribe((data: any) => {
        if (data.success) {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Manifest updated successfully' });
          this.pullTripsManifest(this.currentTrip);
        }
      }, (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update manifest' });
      });
  }

  updateBookingOnBoarded(booking: any, onBoarded: boolean) {
    this.httpService
      .updateData('booking/onboarded/' + booking._id, { onBoarded })
      .subscribe((data: any) => {
        if (data.success) {
          booking.onBoarded = onBoarded;
          this.messageService.add({ 
            severity: 'success', 
            summary: 'Success', 
            detail: `Passenger ${onBoarded ? 'marked as on-boarded' : 'marked as not on-boarded'}` 
          });
        }
      }, (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update on-boarded status' });
      });
  }

  onboardAllPassengers() {
    if (!this.currentTrip?.bookings || this.currentTrip.bookings.length === 0) {
      this.messageService.add({ 
        severity: 'warn', 
        summary: 'No Passengers', 
        detail: 'No passengers found for this trip' 
      });
      return;
    }

    // Filter out passengers that are already onboarded
    const passengersToOnboard = this.currentTrip.bookings.filter((booking: any) => !booking.onBoarded);
    
    if (passengersToOnboard.length === 0) {
      this.messageService.add({ 
        severity: 'info', 
        summary: 'Already Onboarded', 
        detail: 'All passengers are already onboarded' 
      });
      return;
    }

    // Confirm action
    this.confirmationService.confirm({
      message: `Are you sure you want to onboard all ${passengersToOnboard.length} passenger(s)?`,
      header: 'Onboard All Passengers',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.onboardingAll = true;
        let successCount = 0;
        let errorCount = 0;

        // Process all passengers using forkJoin with error handling
        const updateObservables = passengersToOnboard.map((booking: any, index: number) => {
          return this.httpService.updateData('booking/onboarded/' + booking._id, { onBoarded: true })
            .pipe(
              catchError((err) => {
                // Return a failed result object instead of throwing
                return of({ success: false, error: err });
              })
            );
        });

        // Wait for all updates to complete
        forkJoin(updateObservables).subscribe({
          next: (results: any[]) => {
            results.forEach((data: any, index: number) => {
              if (data && data.success) {
                passengersToOnboard[index].onBoarded = true;
                successCount++;
              } else {
                errorCount++;
              }
            });

            this.onboardingAll = false;
            
            if (errorCount === 0) {
              this.messageService.add({ 
                severity: 'success', 
                summary: 'Success', 
                detail: `Successfully onboarded all ${successCount} passenger(s)` 
              });
            } else if (successCount > 0) {
              this.messageService.add({ 
                severity: 'warn', 
                summary: 'Partial Success', 
                detail: `Onboarded ${successCount} passenger(s), ${errorCount} failed` 
              });
            } else {
              this.messageService.add({ 
                severity: 'error', 
                summary: 'Error', 
                detail: 'Failed to onboard passengers. Please try again.' 
              });
            }

            // Refresh manifest to ensure UI is up to date
            if (this.currentTrip?._id) {
              this.pullTripsManifest(this.currentTrip);
            }
          },
          error: (err) => {
            this.onboardingAll = false;
            this.messageService.add({ 
              severity: 'error', 
              summary: 'Error', 
              detail: 'Failed to onboard passengers. Please try again.' 
            });
          }
        });
      },
      reject: () => {
        // User cancelled
      }
    });
  }
  
  pullRoutes() {
    this.httpService
      .getAuthData(
        'routes'
      )
      .subscribe((data: any) => {
        this.routes = data.data
      });
  }

  pullDrivers() {
    this.httpService
      .getAuthData(
        'drivers'
      )
      .subscribe((data: any) => {
        this.drivers = data.data
      });
  }

  confirmDelete(id: any) {
    this.confirmationService.confirm({
      message: 'Do you want to delete this record?',
      header: 'Delete Confirmation',
      icon: 'pi pi-info-circle',
      accept: () => {
        this.deleteTrips(id)
      },
      reject: () => {

      }
    });
  }

  confirmMultipleDelete() {
    if(this.selectedRecordIds.length == 0){
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Please select records to delete' });
      return
    }
    this.confirmationService.confirm({
      message: 'Do you want to delete '+this.selectedRecordIds.length +' records?',
      header: 'Delete Confirmation',
      icon: 'pi pi-info-circle',
      accept: () => {
        this.deleteSelectedTrips()
      },
      reject: () => {

      }
    });
  }

  async checkAll(){
    if(this.checkAllStatus == true){
      for await (const it of this.trips) {
        if(!this.selectedRecordIds.includes(it._id)){
          this.selectedRecordIds.push(it._id)
        }
      }
    }else{
      this.selectedRecordIds = []
    }
  }
  onRecordSelectionChange(record: any): void {
    const index = this.selectedRecordIds.indexOf(record._id);

    if (index < 0) {
      // Add to the array if selected
      this.selectedRecordIds.push(record._id);
      
    } else {
      // Remove from the array if deselected
        this.selectedRecordIds.splice(index, 1);
    }
    console.log(this.selectedRecordIds);
    
  }
  deleteTrips(id: any) {
    this.httpService
      .deleteData(
        'trips/', id
      )
      .subscribe((data: any) => {
        this.messageService.add({ severity: 'success', summary: 'Confirmed', detail: 'Record deleted' });

        this.pullTrips()
      });
  }
  deleteSelectedTrips() {

    this.httpService
      .postAuthData(
        'trips/deleteTrips/', {ids: this.selectedRecordIds}
      )
      .subscribe((data: any) => {
        this.messageService.add({ severity: 'success', summary: 'Confirmed', detail: 'Records deleted' });

        this.pullTrips()
        this.selectedRecordIds = []
      });
  }
  populateTrip(trip: any) {
    this.submitType = 'Edit';
    this.currentID = trip._id
    
    // Parse tripDate from DD-MM-YYYY to Date object for the calendar
    let tripDateValue: Date | null = null;
    if (trip.tripDate) {
      tripDateValue = this.parseDate(trip.tripDate);
    }
    
    this.tripForm.patchValue({ 
      title: trip.title || '',
      route: trip.route?._id || trip.route,
      time: trip.time, 
      tripDate: tripDateValue, 
      driver: trip.driver?._id || trip.driver, 
      busNo: trip.busNo,
      isWalkIn: trip.isWalkIn || false,
      walkInTimeSlot: trip.walkInTimeSlot || '',
      capacity: trip.availableSeats || undefined
    })
    
    // Store the route title for auto-fill logic
    if (trip.route?.title) {
      this.lastRouteTitle = trip.route.title;
    }
  }

  formatDate(date: Date): string {
    if (!date) return '';
    // Function to add leading zeros to single-digit numbers
    function addLeadingZero(number: number): string {
      return number < 10 ? "0" + number : String(number);
    }
    // Format the date as dd-mm-yyyy
    return addLeadingZero(date.getDate()) + "-" +
           addLeadingZero(date.getMonth() + 1) + "-" +
           date.getFullYear();
  }

  parseDate(dateString: string): Date | null {
    if (!dateString) return null;
    // Parse DD-MM-YYYY format
    const parts = dateString.split('-');
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }

  submitTrip() {

    this.submitted = true
    if (this.tripForm.invalid) {
      this.tripForm.markAllAsTouched();

      return;
    }
    this.loading = true;
    let formValue = { ...this.tripForm.value };
    let data: any = {};
    
    // Only include fields that have values (skip undefined/null/empty strings for optional fields)
    // Required fields
    if (formValue.route) data.route = formValue.route;
    if (formValue.tripDate) {
      // Format tripDate to DD-MM-YYYY if it's a Date object
      data.tripDate = formValue.tripDate instanceof Date 
        ? this.formatDate(formValue.tripDate) 
        : formValue.tripDate;
    }
    if (formValue.driver) data.driver = formValue.driver;
    if (formValue.busNo) data.busNo = formValue.busNo;
    
    // Optional fields - only include if they have values
    if (formValue.title) data.title = formValue.title;
    if (formValue.isWalkIn !== undefined) data.isWalkIn = formValue.isWalkIn;
    
    // For walk-in buses: time should be null, walkInTimeSlot and capacity are optional
    if (formValue.isWalkIn) {
      data.time = null; // Walk-in buses don't have time slots
      if (formValue.walkInTimeSlot) data.walkInTimeSlot = formValue.walkInTimeSlot;
      if (formValue.capacity) data.capacity = formValue.capacity;
    } else {
      // For regular buses: time is required, walkInTimeSlot and capacity should not be sent
      if (formValue.time) data.time = formValue.time;
      // Remove walk-in specific fields for regular buses
      delete data.walkInTimeSlot;
      delete data.capacity;
    }
    
    if (this.submitType == 'Edit') this.updateTrip(data)
    if (this.submitType == 'Add') this.createTrip(data)
  }

  createTrip(data: any) {
    console.log('====================================');
    console.log(data);
    console.log('====================================');
    this.httpService
      .postAuthData(
        'trips/', data
      )
      .subscribe((data: any) => {
        // this.listing = data.data
        this.loading = false
        this.displayTrip = false
        this.service.add({ severity: 'success', summary: 'Successful', detail: 'Trip created successfully' });

        this.pullTrips();
        this.tripForm.reset()
      }, (err) => {
        this.loading = false

        console.log('====================================');
        console.log(err);
        console.log('====================================');
      });
  }

  markAsCompleted(trip){
    this.currentID = trip._id
    this.updateTrip({status: 'completed'})
  }

  markAsPending(trip){
    this.currentID = trip._id
    this.updateTrip({status: 'pending'})
  }

  updateTrip(data: any) {

    this.httpService
      .updateData(
        'trips/' + this.currentID, data
      )
      .subscribe((data: any) => {
        // this.listing = data.data
        this.loading = false
        this.displayTrip = false
        this.service.add({  severity: 'success', summary: 'Successful', detail: 'Trip updated successfully' });

        this.pullTrips()
        this.currentID = ''
      }, (err) => {
        this.loading = false

        console.log('====================================');
        console.log(err);
        console.log('====================================');
      });
  }

  flattenObject(obj: any): any {
    const result = {};

    function recurse(current: any, property: string): void {
      if (typeof current === 'object' && !Array.isArray(current)) {
        for (const key in current) {
          if (current.hasOwnProperty(key)) {
            if (property === '') {
              recurse(current[key], key);
            } else {
              recurse(current[key], property + '.' + key);
            }
          }
        }
      } else {
        result[property] = current;
      }
    }

    recurse(obj, '');
    return result;
  }

  exportToExcel(jsonData: any[], fileName: string): void {
    const flattenedData = jsonData.map(item => this.flattenObject(item));
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(flattenedData);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet 1');
    XLSX.writeFile(wb, `${fileName}.xlsx`);

  }
}
