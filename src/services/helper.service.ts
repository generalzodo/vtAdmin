import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class HelperService {

  constructor() { }
   getDateRange(daysAgo: number) {
    const today = new Date();
    const fromDate = new Date();
    
    // Set the 'fromDate' to the same day 'daysAgo' and time to 00:00:00
    fromDate.setDate(today.getDate() - daysAgo);
    fromDate.setHours(0, 0, 0, 0); // set hours, minutes, seconds, and milliseconds to 00:00:00
    
    // Set the 'toDate' to today and time to 23:59:59
    const toDate = new Date(today);
    toDate.setHours(23, 59, 59, 999); // set hours, minutes, seconds, and milliseconds to 23:59:59
  
    // Format the dates as YYYY-MM-DDTHH:MM:SS
    const formatDateTime = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    };
  
    return {
      from: formatDateTime(fromDate),
      to: formatDateTime(toDate)
    };
  }
  
}
