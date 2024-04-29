import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { UsersComponent } from './users/users.component';
import { TripsComponent } from './trips/trips.component';
import { DriversComponent } from './drivers/drivers.component';
import { AgentsComponent } from './agents/agents.component';
import { SettingsComponent } from './settings/settings.component';
import { BusesComponent } from './buses/buses.component';
import { ContainerComponent } from './container/container.component';
import { TicketsComponent } from './tickets/tickets.component';
import { RoutesComponent } from './routes/routes.component';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { LocationsComponent } from './locations/locations.component';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { MessagesModule } from 'primeng/messages';
import { MultiSelectModule } from 'primeng/multiselect';
import { BookingsComponent } from './bookings/bookings.component';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { SubRoutesComponent } from './subroutes/subroutes.component';
import { SignInComponent } from './sign-in/sign-in.component';
import { WithdrawalsComponent } from './withdrawals/withdrawals.component';
import { AbookingsComponent } from './abookings/abookings.component';
@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    DashboardComponent,
    UsersComponent,
    TripsComponent,
    DriversComponent,
    AgentsComponent,
    SettingsComponent,
    BusesComponent,
    ContainerComponent,
    TicketsComponent,
    RoutesComponent,
    LocationsComponent,
    BookingsComponent, SubRoutesComponent,
    SignInComponent,
    WithdrawalsComponent,
    AbookingsComponent
  ],
  imports: [
    BrowserModule,
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    TableModule,
    PaginatorModule,
    ConfirmDialogModule,
    ToastModule,
    MessagesModule,
    MultiSelectModule, 
    CalendarModule,
    OverlayPanelModule,
    ConfirmPopupModule,
    DropdownModule],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
