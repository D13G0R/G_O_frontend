import { Component, EventEmitter, Input, Output, SimpleChanges} from '@angular/core';

@Component({
  selector: 'app-toast-message',
  imports: [],
  templateUrl: './toast-message.html',
  styleUrl: './toast-message.css',
})
export class ToastMessage {

  @Input()
  error: boolean = false;
  @Input()
  errorMessage: string = "";

  @Output()
  errorChange = new EventEmitter<boolean>();
  @Output()
  errorMessageChange = new EventEmitter<string>();

  // Se ejecuta automáticamente cada vez que 'error' pasa a true 
  ngOnChanges(changes: SimpleChanges) {
    if (changes['error'] && this.error) {
      // Espera 3 segundos y oculta el toast
      setTimeout(() => {
        this.closeToast();
      }, 3000);
    }
  }

  closeToast(){
    this.errorChange.emit(false);
    this.errorMessageChange.emit("");
  }
}
