import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SolicitudService } from '../../../core/services/solicitud.service';
import { EstadoSolicitud, Solicitud } from '../../../core/models/solicitud.model';

const ESTADOS: EstadoSolicitud[] = ['PENDIENTE_APROBACION', 'APROBADO', 'EN_PRODUCCION', 'INSTALADO', 'RECHAZADO'];

@Component({
  selector: 'app-solicitudes',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './solicitudes.html',
})
export class Solicitudes implements OnInit {
  private readonly solicitudService = inject(SolicitudService);

  readonly estados = ESTADOS;
  readonly solicitudes = signal<Solicitud[]>([]);
  readonly filtroEstado = signal<EstadoSolicitud | ''>('');
  readonly actualizando = signal<number | null>(null);

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.solicitudService.listar(this.filtroEstado() || undefined).subscribe((solicitudes) => this.solicitudes.set(solicitudes));
  }

  cambiarEstado(solicitud: Solicitud, estado: EstadoSolicitud): void {
    this.actualizando.set(solicitud.id);
    this.solicitudService.cambiarEstado(solicitud.id, estado).subscribe({
      next: () => {
        this.actualizando.set(null);
        this.cargar();
      },
      error: () => this.actualizando.set(null),
    });
  }
}
