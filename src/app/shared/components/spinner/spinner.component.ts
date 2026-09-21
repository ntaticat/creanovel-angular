import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-spinner',
  templateUrl: './spinner.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [NgClass],
})
export class SpinnerComponent {
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  get sizeClass(): string {
    return { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' }[this.size];
  }
}
