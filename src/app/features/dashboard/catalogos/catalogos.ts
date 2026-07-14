import { Component, OnInit, inject, signal } from '@angular/core';
import { CatalogoService } from '../../../core/services/catalogo.service';
import { Marca, MarcaCompetencia, Material } from '../../../core/models/catalogo.model';
import { PILL, PILL_SELECTED } from '../../../shared/ui/dash/field-classes';

@Component({
  selector: 'app-catalogos',
  standalone: true,
  templateUrl: './catalogos.html',
})
export class Catalogos implements OnInit {
  private readonly catalogoService = inject(CatalogoService);

  readonly pill = PILL;
  readonly marcas = signal<Marca[]>([]);
  readonly marcaSeleccionada = signal<Marca | null>(null);
  readonly competencia = signal<MarcaCompetencia[]>([]);
  readonly materiales = signal<Material[]>([]);

  claseMarca(m: Marca): string {
    return this.marcaSeleccionada()?.id === m.id ? `${PILL} ${PILL_SELECTED}` : PILL;
  }

  ngOnInit(): void {
    this.catalogoService.listarMarcas().subscribe((marcas) => {
      this.marcas.set(marcas);
      if (marcas.length) {
        this.seleccionar(marcas[0]);
      }
    });
  }

  seleccionar(marca: Marca): void {
    this.marcaSeleccionada.set(marca);
    this.catalogoService.listarCompetenciaDeMarca(marca.id).subscribe((c) => this.competencia.set(c.filter((x) => x.activo)));
    this.catalogoService.listarMateriales(marca.id).subscribe((m) => this.materiales.set(m));
  }
}
