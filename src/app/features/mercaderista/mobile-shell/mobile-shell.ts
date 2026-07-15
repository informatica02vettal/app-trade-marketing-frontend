import { Component, OnInit, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { obtenerGpsConDiagnostico } from '../../../core/utils/gps.util';

@Component({
  selector: 'app-mobile-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './mobile-shell.html',
})
export class MobileShell implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);

  readonly usuario = this.authService.usuarioActual;

  readonly esAdminOSupervisor = computed(() => {
    const rol = this.usuario()?.rol;
    return rol === 'ADMIN' || rol === 'SUPERVISOR';
  });

  ngOnInit(): void {
    // Se pide el permiso de ubicación directamente al navegador apenas se
    // entra a la app de mercaderistas (sin ningún banner/modal propio de
    // por medio) — es el diálogo nativo del navegador el que le pregunta al
    // usuario, no una pantalla de la app.
    obtenerGpsConDiagnostico().then(({ error }) => {
      if (error === 'PERMISO_DENEGADO') {
        this.toastService.mostrarError(
          'No se concedió el permiso de ubicación. Actívalo en los ajustes de ubicación del navegador/teléfono para poder registrar el GPS de tus visitas.',
        );
      } else if (error) {
        this.toastService.mostrarError('No se pudo obtener la ubicación GPS del dispositivo.');
      }
    });
  }
}
