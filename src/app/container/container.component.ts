import { Component } from '@angular/core';

@Component({
  selector: 'app-container',
  templateUrl: './container.component.html',
  styleUrls: ['./container.component.scss']
})
export class ContainerComponent {
  menus: any = [
    {title: 'Dashboard', url:''},
    {title: 'Users', url:'users'},
    {title: 'Bookings', url:'bookings'},
    {title: 'Trips', url:'trips'},
    {title: 'Buses', url:'buses'},
    {title: 'Drivers', url:'drivers'},
    {title: 'Routes', url:'routes'},
    {title: 'Settings', url:'settings'},
  ]
}
