import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { IconDefinition, faCircleInfo } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-empty-state',
  templateUrl: './empty-state.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [FaIconComponent],
})
export class EmptyStateComponent {
  @Input() icon: IconDefinition = faCircleInfo;
  @Input() title = '';
  @Input() description = '';
}
