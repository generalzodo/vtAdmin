import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BusesComponent } from './buses/buses.component';
import { TripsComponent } from './trips/trips.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { UsersComponent } from './users/users.component';
import { RoutesComponent } from './routes/routes.component';
import { SettingsComponent } from './settings/settings.component';
import { DriversComponent } from './drivers/drivers.component';
import { BookingsComponent } from './bookings/bookings.component';

const routes: Routes = [
  {
    path: '', component: BookingsComponent,

  },
  { path: 'users', component: UsersComponent },
  { path: 'buses', component: BusesComponent },
  { path: 'drivers', component: DriversComponent },
  { path: 'bookings', component: BookingsComponent },
  { path: 'trips', component: TripsComponent },
  { path: 'routes', component: RoutesComponent },
  { path: 'settings', component: SettingsComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
