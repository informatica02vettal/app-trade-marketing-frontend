import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CatalogoService } from '../../../core/services/catalogo.service';
import { MercadoService } from '../../../core/services/mercado.service';
import { Marca } from '../../../core/models/catalogo.model';
import { HallazgoMercado, TipoHallazgo } from '../../../core/models/mercado.model';

const TIPOS: TipoHallazgo[] = [
  'PRECIO_COMPETENCIA',
  'NUEVO_PRODUCTO',
  'MATERIAL_PUBLICITARIO_COMPETENCIA',
  'OBSERVACION_MERCADO',
];

@Component({
  selector: 'app-mercado',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './mercado.html',
})
export class Mercado implements OnInit {
  private readonly mercadoService = inject(MercadoService);
  private readonly catalogoService = inject(CatalogoService);

  readonly tipos = TIPOS;
  readonly marcas = signal<Marca[]>([]);
  readonly hallazgos = signal<HallazgoMercado[]>([]);
  readonly filtroTipo = signal<TipoHallazgo | ''>('');
  readonly filtroMarcaId = signal<number | null>(null);

  ngOnInit(): void {
    this.catalogoService.listarMarcas().subscribe((marcas) => this.marcas.set(marcas));
    this.cargar();
  }

  cargar(): void {
    this.mercadoService
      .listar({ tipo: this.filtroTipo() || undefined, marcaId: this.filtroMarcaId() ?? undefined })
      .subscribe((hallazgos) => this.hallazgos.set(hallazgos));
  }
}
