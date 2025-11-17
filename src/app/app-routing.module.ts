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
import { SubRoutesComponent } from './subroutes/subroutes.component';
import { SignInComponent } from './sign-in/sign-in.component';
import { AuthGuard } from './auth.guard';
import { ContainerComponent } from './container/container.component';
import { WithdrawalsComponent } from './withdrawals/withdrawals.component';
import { AbookingsComponent } from './abookings/abookings.component';
import { DuplicatesComponent } from './duplicates/duplicates.component';
import { AgentsComponent } from './agents/agents.component';
import { AgentReportsComponent } from './agent-reports/agent-reports.component';
import { ReviewsComponent } from './reviews/reviews.component';

const routes: Routes = [
  { path: '', redirectTo: '/container/bookings', pathMatch: 'full' },
  {
    path: 'auth/login', component: SignInComponent,
  },
  {
    path: 'container', component: ContainerComponent,
    canActivate: [AuthGuard],
    children: [
  { path: '', redirectTo: '/container/bookings', pathMatch: 'full' },

      {
        path: 'bookings', component: BookingsComponent,
      },
      {
        path: 'altered', component: AbookingsComponent,
      },
      {
        path: 'duplicates', component: DuplicatesComponent,
      },

      { path: 'users', component: UsersComponent },
      { path: 'buses', component: BusesComponent },
      { path: 'drivers', component: DriversComponent },
      { path: 'bookings', component: BookingsComponent },
      { path: 'withdrawals', component: WithdrawalsComponent },
      { path: 'trips', component: TripsComponent },
      { path: 'routes', component: RoutesComponent },
      { path: 'subroutes', component: SubRoutesComponent },
      { path: 'settings', component: SettingsComponent },
      { path: 'agents', component: AgentsComponent },
      { path: 'agent-reports', component: AgentReportsComponent },
      { path: 'reviews', component: ReviewsComponent },
    ]
  }
]

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
