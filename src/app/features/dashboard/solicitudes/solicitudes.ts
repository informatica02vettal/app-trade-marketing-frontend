import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SolicitudService } from '../../../core/services/solicitud.service';
import { EstadoSolicitud, Solicitud } from '../../../core/models/solicitud.model';

const ESTADOS: EstadoSolicitud[] = ['PENDIENTE_APROBACION', 'APROBADO', 'EN_PRODUCCION', 'INSTALADO', 'RECHAZADO'];

const BADGE_CLASE: Record<EstadoSolicitud, string> = {
  PENDIENTE_APROBACION: 'warn',
  APROBADO: 'info',
  EN_PRODUCCION: 'neutral',
  INSTALADO: 'ok',
  RECHAZADO: 'bad',
};

const SIGUIENTE_ESTADO: Partial<Record<EstadoSolicitud, { estado: EstadoSolicitud; etiqueta: string }>> = {
  PENDIENTE_APROBACION: { estado: 'APROBADO', etiqueta: 'Aprobar' },
  APROBADO: { estado: 'EN_PRODUCCION', etiqueta: 'Enviar a producción' },
  EN_PRODUCCION: { estado: 'INSTALADO', etiqueta: 'Marcar instalado' },
};

@Component({
  selector: 'app-solicitudes',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './solicitudes.html',
})
export class Solicitudes implements OnInit {
  private readonly solicitudService = inject(SolicitudService);

  readonly estados = ESTADOS;
  readonly badgeClase = BADGE_CLASE;
  readonly siguienteEstado = SIGUIENTE_ESTADO;
  readonly solicitudes = signal<Solicitud[]>([]);
  readonly filtroEstado = signal<EstadoSolicitud | ''>('');
  readonly actualizando = signal<number | null>(null);

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.solicitudService.listar(this.filtroEstado() || undefined).subscribe((solicitudes) => this.solicitudes.set(solicitudes));
  }

  materiales(solicitud: Solicitud): string {
    return solicitud.items.map((item) => item.materialNombre).join(', ');
  }

  avanzarEstado(solicitud: Solicitud): void {
    const siguiente = SIGUIENTE_ESTADO[solicitud.estado];
    if (!siguiente) return;
    this.actualizando.set(solicitud.id);
    this.solicitudService.cambiarEstado(solicitud.id, siguiente.estado).subscribe({
      next: () => {
        this.actualizando.set(null);
        this.cargar();
      },
      error: () => this.actualizando.set(null),
    });
  }
}
