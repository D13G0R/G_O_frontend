import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from '@angular/core';

@Component({
  selector: 'app-toast-message',
  imports: [],
  templateUrl: './toast-message.html',
  styleUrl: './toast-message.css',
})
export class ToastMessage implements OnChanges, OnDestroy {
  @Input() error = false;
  @Input() errorMessage = '';

  @Output() errorChange = new EventEmitter<boolean>();
  @Output() errorMessageChange = new EventEmitter<string>();

  visible = false;
  private timeoutId: ReturnType<typeof setTimeout> | undefined;

  ngOnChanges(changes: SimpleChanges) {
    if (!this.error) {
      this.visible = false;
      this.clearTimeout();
      return;
    }

    this.visible = true;
    if (changes['error'] || changes['errorMessage']) {
      this.startTimeout();
    }
  }

  ngOnDestroy() {
    this.clearTimeout();
  }

  closeToast() {
    this.visible = false;
    this.clearTimeout();
    this.errorChange.emit(false);
    this.errorMessageChange.emit('');
  }

  private startTimeout() {
    this.clearTimeout();
    this.timeoutId = setTimeout(() => this.closeToast(), 3000);
  }

  private clearTimeout() {
    if (this.timeoutId !== undefined) {
      clearTimeout(this.timeoutId);
      this.timeoutId = undefined;
    }
  }
}