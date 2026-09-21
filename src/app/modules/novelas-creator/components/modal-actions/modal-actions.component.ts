import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostListener,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-modal-actions',
  templateUrl: './modal-actions.component.html',
  styleUrl: './modal-actions.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [FaIconComponent],
})
export class ModalActionsComponent {
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Output() closeModal = new EventEmitter<void>();

  faXmark = faXmark;

  get sizeClass(): string {
    return { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl' }[this.size];
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeModal.emit();
  }
}
