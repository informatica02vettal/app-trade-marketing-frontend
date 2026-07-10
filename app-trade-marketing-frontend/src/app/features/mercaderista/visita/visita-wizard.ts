import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { VisitaService } from '../../../core/services/visita.service';
import { CatalogoService } from '../../../core/services/catalogo.service';
import { VisitaSessionService } from '../../../core/session/visita-session.service';
import { Marca } from '../../../core/models/catalogo.model';
import { PhotoPicker } from '../../../shared/ui/photo-picker/photo-picker';
import { MarcaDetalle } from './marca-detalle/marca-detalle';

type Paso = 'evidencia' | 'prospecto' | 'marcas' | 'marca-detalle';

@Component({
  selector: 'app-visita-wizard',
  standalone: true,
  imports: [FormsModule, PhotoPicker, MarcaDetalle],
  templateUrl: './visita-wizard.html',
})
export class VisitaWizard implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly visitaService = inject(VisitaService);
  private readonly catalogoService = inject(CatalogoService);
  readonly sesion = inject(VisitaSessionService);

  readonly paso = signal<Paso>('evidencia');
  readonly marcas = signal<Marca[]>([]);
  readonly marcaSeleccionada = signal<Marca | null>(null);
  readonly guardando = signal(false);

  // Evidencia general
  readonly fotoFachada = signal<string | null>(null);
  readonly fotoPisoVentas = signal<string | null>(null);

  // Cliente prospecto
  readonly prospecto = {
    nombre: '',
    rif: '',
    whatsapp: '',
    telefono: '',
    marcasCompetencia: '',
  };
  readonly prospectoFotoFachada = signal<string | null>(null);
  readonly prospectoFotoInterior = signal<string | null>(null);

  ngOnInit(): void {
    const visitaId = Number(this.route.snapshot.paramMap.get('visitaId'));
    if (!this.sesion.hayVisitaActiva || this.sesion.visitaId() !== visitaId) {
      this.router.navigateByUrl('/app/ruta');
      return;
    }

    this.catalogoService.listarMarcas().subscribe((marcas) => this.marcas.set(marcas));

    if (this.sesion.esProspecto()) {
      this.paso.set('prospecto');
    } else if (this.sesion.evidenciaGeneralCompleta()) {
      this.paso.set('marcas');
    } else {
      this.paso.set('evidencia');
    }
  }

  continuarEvidencia(): void {
    const visitaId = this.sesion.visitaId();
    const fachada = this.fotoFachada();
    const piso = this.fotoPisoVentas();
    if (!visitaId || !fachada || !piso) return;

    this.guardando.set(true);
    this.visitaService.agregarFoto(visitaId, { categoria: 'FACHADA', url: fachada }).subscribe(() => {
      this.visitaService.agregarFoto(visitaId, { categoria: 'PISO_VENTAS', url: piso }).subscribe(() => {
        this.guardando.set(false);
        this.sesion.marcarEvidenciaGeneralCompleta();
        this.paso.set('marcas');
      });
    });
  }

  guardarProspecto(): void {
    const visitaId = this.sesion.visitaId();
    const fachada = this.prospectoFotoFachada();
    const interior = this.prospectoFotoInterior();
    if (!visitaId || !fachada || !interior || !this.prospecto.nombre || !this.prospecto.rif || !this.prospecto.whatsapp) {
      return;
    }

    this.guardando.set(true);
    this.visitaService
      .crearClienteProspecto({
        visitaId,
        nombre: this.prospecto.nombre,
        rif: this.prospecto.rif,
        whatsapp: this.prospecto.whatsapp,
        telefono: this.prospecto.telefono || undefined,
        fotoFachadaUrl: fachada,
        fotoInteriorUrl: interior,
        marcasCompetencia: this.prospecto.marcasCompetencia || undefined,
      })
      .subscribe(() => {
        this.visitaService.checkout(visitaId, {}).subscribe(() => {
          this.guardando.set(false);
          this.sesion.finalizar();
          this.router.navigateByUrl('/app/ruta');
        });
      });
  }

  abrirMarca(marca: Marca): void {
    this.marcaSeleccionada.set(marca);
    this.paso.set('marca-detalle');
  }

  onMarcaCompletada(): void {
    const marca = this.marcaSeleccionada();
    if (marca) {
      this.sesion.marcarMarcaCompletada(marca.id, marca.nombre);
    }
    this.marcaSeleccionada.set(null);
    this.paso.set('marcas');
  }

  onMarcaCancelada(): void {
    this.marcaSeleccionada.set(null);
    this.paso.set('marcas');
  }

  finalizarVisita(): void {
    const visitaId = this.sesion.visitaId();
    if (!visitaId || !this.sesion.tieneAlMenosUnaMarcaCompletada()) return;

    this.guardando.set(true);
    this.visitaService.checkout(visitaId, {}).subscribe(() => {
      this.guardando.set(false);
      this.sesion.finalizar();
      this.router.navigateByUrl('/app/ruta');
    });
  }
}
