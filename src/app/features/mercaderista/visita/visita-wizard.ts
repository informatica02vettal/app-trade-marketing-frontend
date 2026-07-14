import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { VisitaService } from '../../../core/services/visita.service';
import { CatalogoService } from '../../../core/services/catalogo.service';
import { VisitaSessionService } from '../../../core/session/visita-session.service';
import { VisitaReconstruccionService } from '../../../core/session/visita-reconstruccion.service';
import { Marca } from '../../../core/models/catalogo.model';
import { PhotoPicker } from '../../../shared/ui/photo-picker/photo-picker';
import { MarcaDetalle } from './marca-detalle/marca-detalle';
import { EventoVisita } from './evento-visita/evento-visita';

type Paso = 'evidencia' | 'prospecto' | 'evento' | 'marcas' | 'marca-detalle';

@Component({
  selector: 'app-visita-wizard',
  standalone: true,
  imports: [FormsModule, PhotoPicker, MarcaDetalle, EventoVisita],
  templateUrl: './visita-wizard.html',
})
export class VisitaWizard implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly visitaService = inject(VisitaService);
  private readonly catalogoService = inject(CatalogoService);
  private readonly visitaReconstruccion = inject(VisitaReconstruccionService);
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
    this.catalogoService.listarMarcas().subscribe((marcas) => this.marcas.set(marcas));

    if (this.sesion.hayVisitaActiva && this.sesion.visitaId() === visitaId) {
      this.prefillEvidenciaSiFalta(visitaId);
      this.decidirPasoInicial();
      return;
    }

    // El estado en memoria no tiene esta visita (recarga de página, la app
    // se cerró, otro teléfono, etc.) — se reconstruye consultando lo que
    // ya quedó guardado en el backend para esta visita puntual.
    this.visitaService.obtener(visitaId).subscribe({
      next: (visita) => {
        if (visita.estado !== 'EN_CURSO') {
          this.router.navigateByUrl('/app/ruta');
          return;
        }
        this.visitaReconstruccion.reconstruir(visita).subscribe(({ fotos }) => {
          if (!this.sesion.evidenciaGeneralCompleta()) {
            const fachada = fotos.filter((f) => f.categoria === 'FACHADA').at(-1);
            const piso = fotos.filter((f) => f.categoria === 'PISO_VENTAS').at(-1);
            if (fachada) this.fotoFachada.set(fachada.url);
            if (piso) this.fotoPisoVentas.set(piso.url);
          }
          this.decidirPasoInicial();
        });
      },
      error: () => this.router.navigateByUrl('/app/ruta'),
    });
  }

  private prefillEvidenciaSiFalta(visitaId: number): void {
    if (this.sesion.evidenciaGeneralCompleta()) return;
    this.visitaService.listarFotos(visitaId).subscribe((fotos) => {
      const fachada = fotos.filter((f) => f.categoria === 'FACHADA').at(-1);
      const piso = fotos.filter((f) => f.categoria === 'PISO_VENTAS').at(-1);
      if (fachada) this.fotoFachada.set(fachada.url);
      if (piso) this.fotoPisoVentas.set(piso.url);
    });
  }

  // El motivo del evento se pregunta al entrar en la visita, antes que
  // cualquier otro paso — no se espera a que termine la evidencia general.
  // Una visita de evento nunca continúa a evidencia/auditoría de marca: si
  // el evento ya quedó registrado (p. ej. se cerró la app justo después de
  // guardarlo, antes del checkout), retoma finalizando la visita.
  private decidirPasoInicial(): void {
    if (this.sesion.esProspecto()) {
      this.paso.set('prospecto');
    } else if (this.sesion.objetivoTipoNombre() === 'Evento') {
      if (this.sesion.eventoRegistrado()) {
        this.finalizarVisita();
      } else {
        this.paso.set('evento');
      }
    } else if (this.sesion.evidenciaGeneralCompleta()) {
      this.paso.set('marcas');
    } else {
      this.paso.set('evidencia');
    }
  }

  // Cada foto se sube al backend apenas se elige (no se espera al botón
  // "Siguiente"), asociada a la visita — así queda guardada de inmediato.
  setFotoFachada(url: string | null): void {
    this.fotoFachada.set(url);
    if (url) {
      this.visitaService.agregarFoto(this.sesion.visitaId()!, { categoria: 'FACHADA', url }).subscribe();
    }
  }

  setFotoPisoVentas(url: string | null): void {
    this.fotoPisoVentas.set(url);
    if (url) {
      this.visitaService.agregarFoto(this.sesion.visitaId()!, { categoria: 'PISO_VENTAS', url }).subscribe();
    }
  }

  setProspectoFotoFachada(url: string | null): void {
    this.prospectoFotoFachada.set(url);
  }

  setProspectoFotoInterior(url: string | null): void {
    this.prospectoFotoInterior.set(url);
  }

  // En una visita de evento el recorrido termina con el registro del evento
  // (leads incluidos, y análisis de competencia si es feria/congreso) — no
  // continúa con evidencia general ni auditoría de marca.
  onEventoCompletado(): void {
    this.sesion.marcarEventoRegistrado();
    this.finalizarVisita();
  }

  continuarEvidencia(): void {
    const fachada = this.fotoFachada();
    const piso = this.fotoPisoVentas();
    if (!fachada || !piso) return;

    // Las fotos ya se subieron al backend en cuanto se seleccionaron; aquí
    // solo se marca el paso como completo y se avanza. El evento (si aplica)
    // ya se preguntó antes de llegar aquí.
    this.sesion.marcarEvidenciaGeneralCompleta();
    this.paso.set('marcas');
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
        // Las fotos de fachada/interior del prospecto cuentan como la evidencia
        // general de la visita, para no volver a pedirlas — luego continúa el
        // mismo flujo de auditoría por marca que sigue cualquier otra visita.
        this.visitaService.agregarFoto(visitaId, { categoria: 'FACHADA', url: fachada }).subscribe(() => {
          this.visitaService.agregarFoto(visitaId, { categoria: 'PISO_VENTAS', url: interior }).subscribe(() => {
            this.guardando.set(false);
            this.sesion.marcarEvidenciaGeneralCompleta();
            this.paso.set('marcas');
          });
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
    const puedeFinalizar = this.sesion.tieneAlMenosUnaMarcaCompletada() || this.sesion.eventoRegistrado();
    if (!visitaId || !puedeFinalizar) return;

    this.guardando.set(true);
    this.visitaService.checkout(visitaId, {}).subscribe(() => {
      this.guardando.set(false);
      this.sesion.finalizar();
      this.router.navigateByUrl('/app/ruta');
    });
  }
}
