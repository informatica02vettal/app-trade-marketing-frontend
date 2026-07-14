import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-mobile-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './mobile-shell.html',
})
export class MobileShell {
  private readonly authService = inject(AuthService);

  readonly usuario = this.authService.usuarioActual;

  readonly esAdminOSupervisor = computed(() => {
    const rol = this.usuario()?.rol;
    return rol === 'ADMIN' || rol === 'SUPERVISOR';
  });
}
