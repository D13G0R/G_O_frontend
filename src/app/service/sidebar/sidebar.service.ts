import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SidebarService {
  readonly isOpen = signal(false);

  toggleSidebar(): void {
    this.isOpen.update((current) => !current);
  }

  closeSidebar(): void {
    this.isOpen.set(false);
  }
}
