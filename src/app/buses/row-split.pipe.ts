import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'rowSplit' })
export class RowSplitPipe implements PipeTransform {
  transform(arr: string[], marker: string = 'ROW'): string[][] {
    if (!arr) return [];
    const rows: string[][] = [];
    let current: string[] = [];
    arr.forEach(item => {
      if (item === marker) {
        rows.push(current);
        current = [];
      } else {
        current.push(item);
      }
    });
    if (current.length) rows.push(current);
    return rows;
  }
}
