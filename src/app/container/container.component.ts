import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/services/auth.service';

@Component({
  selector: 'app-container',
  templateUrl: './container.component.html',
  styleUrls: ['./container.component.scss']
})
export class ContainerComponent implements OnInit {
  menus: any = [
    { title: 'Dashboard', url: '' },
    { title: 'Users', url: 'users' },
    { title: 'Agents', url: 'agents' },
    { title: 'Agent Reports', url: 'agent-reports' },
    { title: 'Reviews', url: 'reviews' },
    { title: 'Withdrawals', url: 'withdrawals' },
    { title: 'Bookings', url: 'bookings' },
    { title: 'Altered Bookings', url: 'altered' },
    { title: 'Cancelled Bookings', url: 'duplicates' },
    { title: 'Trips', url: 'trips' },
    { title: 'Buses', url: 'buses' },
    { title: 'Transport Officers', url: 'drivers' },
    { title: 'Routes', url: 'routes' },
    { title: 'Sub Routes', url: 'subroutes' },
    { title: 'Settings', url: 'settings' },
  ]
  currentRoute: string;

  constructor(private router: Router, public auth: AuthService) {

  }

  ngOnInit() {
    // this.view()
  }

  view() {
    setTimeout(() => {
      
      this.currentRoute = this.router.url.substring(1);
      console.log(this.currentRoute)
    }, 500);
  }
}

