import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { InstalacionService } from '../../../core/services/instalacion.service';
import { Instalacion } from '../../../core/models/instalacion.model';

interface FilaPop {
  marcaNombre: string;
  materialNombre: string;
  usuarioNombre: string;
  fechaInstalacion: string | null;
  fotos: number;
  estado: string;
}

@Component({
  selector: 'app-pop',
  standalone: true,
  templateUrl: './pop.html',
})
export class Pop implements OnInit {
  private readonly instalacionService = inject(InstalacionService);

  readonly instalaciones = signal<Instalacion[]>([]);

  readonly filas = computed<FilaPop[]>(() =>
    this.instalaciones().flatMap((i) =>
      i.items.map((item) => ({
        marcaNombre: i.marcaNombre,
        materialNombre: item.materialNombre,
        usuarioNombre: i.usuarioNombre,
        fechaInstalacion: i.fechaInstalacion,
        fotos: item.fotos.length,
        estado: i.estado,
      })),
    ),
  );

  ngOnInit(): void {
    this.instalacionService.listar().subscribe((instalaciones) => this.instalaciones.set(instalaciones));
  }
}
