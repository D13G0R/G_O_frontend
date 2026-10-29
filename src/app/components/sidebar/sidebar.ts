import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TokenService } from '../../service/token/token';
import { SidebarService } from '../../service/sidebar/sidebar.service';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  private readonly router = inject(Router);
  private readonly tokenService = inject(TokenService);
  private readonly sidebarService = inject(SidebarService);

  readonly isSidebarOpen = this.sidebarService.isOpen;

  toggleSidebar(): void {
    this.sidebarService.toggleSidebar();
  }

  logout(): void {
    this.tokenService.removeToken();
    this.router.navigate(['/login']);
    this.sidebarService.closeSidebar();
  }

  closeSidebarAndNavigate(): void {
    this.sidebarService.closeSidebar();
  }
}

