import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EventoService } from '../../../../core/services/evento.service';
import { VisitaService } from '../../../../core/services/visita.service';
import { VisitaSessionService } from '../../../../core/session/visita-session.service';
import { EventoLead, MotivoEvento, ParticipacionVettal } from '../../../../core/models/evento.model';
import { GpsError, obtenerGpsConDiagnostico } from '../../../../core/utils/gps.util';
import { PhotoPicker } from '../../../../shared/ui/photo-picker/photo-picker';
import { VideoPicker } from '../../../../shared/ui/video-picker/video-picker';
import { CompetidoresLista } from '../competidores/competidores-lista';

type SubPasoEvento = 'motivo' | 'detalle' | 'competencia';

type CategoriaFotoEvento = 'MONTAJE' | 'DESARROLLO' | 'CIERRE';

@Component({
  selector: 'app-evento-visita',
  standalone: true,
  imports: [FormsModule, PhotoPicker, VideoPicker, CompetidoresLista],
  templateUrl: './evento-visita.html',
})
export class EventoVisita implements OnInit {
  private readonly eventoService = inject(EventoService);
  private readonly visitaService = inject(VisitaService);
  readonly sesion = inject(VisitaSessionService);

  readonly visitaId = input.required<number>();
  readonly completada = output<void>();

  readonly subPaso = signal<SubPasoEvento>('motivo');
  readonly guardando = signal(false);

  motivo: MotivoEvento | '' = '';
  motivoOtroDetalle = '';

  nombreEvento = '';
  ciudad = '';
  estado = '';
  lugarRealizacion = '';
  fechaEvento = '';
  horaInicio = '';
  horaFin = '';
  organizador = '';
  objetivoParticipacion = '';
  participacionVettal: ParticipacionVettal | '' = '';
  cantidadAsistentesEstimada: number | null = null;

  readonly motivos: { valor: MotivoEvento; label: string }[] = [
    { valor: 'ANIVERSARIO_CLIENTE', label: 'Aniversario del cliente' },
    { valor: 'IMPULSO_MARCA', label: 'Impulso de marca' },
    { valor: 'APERTURA_TIENDA', label: 'Apertura de tienda' },
    { valor: 'ROTACION_PRODUCTOS', label: 'Rotación de productos' },
    { valor: 'OTRO', label: 'Otro (especificar)' },
  ];

  readonly leads = signal<EventoLead[]>([]);
  readonly videosEntrevista = signal<(string | null)[]>([null]);
  readonly fotosPorCategoria = signal<Record<CategoriaFotoEvento, (string | null)[]>>({
    MONTAJE: [null],
    DESARROLLO: [null],
    CIERRE: [null],
  });

  // GPS propio del evento: se captura al entrar (no reutiliza el del
  // check-in de la visita) porque una feria/expo puede quedar en un lugar
  // distinto al del cliente registrado.
  readonly gpsLat = signal<number | null>(null);
  readonly gpsLng = signal<number | null>(null);
  readonly capturandoGps = signal(true);
  readonly gpsErrorMotivo = signal<GpsError | null>(null);

  get esEventoGrande(): boolean {
    return this.sesion.esEventoGrande();
  }

  ngOnInit(): void {
    this.capturarGps();

    // Las fotos/videos ya subidos quedan asociados a la visita en el backend;
    // se recuperan aquí para no perderlos si el componente se vuelve a crear.
    this.visitaService.listarFotos(this.visitaId()).subscribe((fotos) => {
      const porCategoria: Record<CategoriaFotoEvento, (string | null)[]> = { MONTAJE: [], DESARROLLO: [], CIERRE: [] };
      (Object.keys(porCategoria) as CategoriaFotoEvento[]).forEach((categoria) => {
        const urls = fotos.filter((f) => f.categoria === categoria).map((f) => f.url);
        porCategoria[categoria] = urls.length ? urls : [null];
      });
      this.fotosPorCategoria.set(porCategoria);

      const videos = fotos.filter((f) => f.categoria === 'ENTREVISTA').map((f) => f.url);
      this.videosEntrevista.set(videos.length ? videos : [null]);
    });
  }

  capturarGps(): void {
    this.capturandoGps.set(true);
    this.gpsErrorMotivo.set(null);
    obtenerGpsConDiagnostico().then(({ coords, error }) => {
      this.gpsLat.set(coords?.lat ?? null);
      this.gpsLng.set(coords?.lng ?? null);
      this.gpsErrorMotivo.set(error);
      this.capturandoGps.set(false);
    });
  }

  confirmarMotivo(): void {
    if (!this.motivo) return;
    this.subPaso.set('detalle');
  }

  anteriorDetalle(): void {
    this.subPaso.set('motivo');
  }

  anteriorCompetencia(): void {
    this.subPaso.set('detalle');
  }

  agregarLead(): void {
    this.leads.set([...this.leads(), { nombre: '', empresa: '', cargo: '', telefono: '', correo: '' }]);
  }

  quitarLead(index: number): void {
    this.leads.set(this.leads().filter((_, i) => i !== index));
  }

  actualizarLead(index: number, campo: keyof EventoLead, valor: string): void {
    const lista = [...this.leads()];
    lista[index] = { ...lista[index], [campo]: valor };
    this.leads.set(lista);
  }

  agregarSlotVideo(): void {
    this.videosEntrevista.set([...this.videosEntrevista(), null]);
  }

  setVideoEntrevista(index: number, url: string | null): void {
    const videos = [...this.videosEntrevista()];
    videos[index] = url;
    this.videosEntrevista.set(videos);
    if (url) {
      this.visitaService.agregarFoto(this.visitaId(), { categoria: 'ENTREVISTA', url }).subscribe();
    }
  }

  agregarSlotFoto(categoria: CategoriaFotoEvento): void {
    const actual = this.fotosPorCategoria();
    this.fotosPorCategoria.set({ ...actual, [categoria]: [...actual[categoria], null] });
  }

  setFotoCategoria(categoria: CategoriaFotoEvento, index: number, url: string | null): void {
    const actual = this.fotosPorCategoria();
    const fotos = [...actual[categoria]];
    fotos[index] = url;
    this.fotosPorCategoria.set({ ...actual, [categoria]: fotos });
    if (url) {
      this.visitaService.agregarFoto(this.visitaId(), { categoria, url }).subscribe();
    }
  }

  guardarDetalleEvento(): void {
    if (!this.motivo || this.guardando()) return;
    this.guardando.set(true);

    const leads = this.leads().filter((l) => l.nombre.trim());
    const videos = this.videosEntrevista().filter((v): v is string => !!v);
    const esGrande = this.esEventoGrande;

    // Las fotos y videos ya se subieron al backend apenas se seleccionaron;
    // aquí solo se guarda la metadata del evento. Los campos propios de
    // feria/exposición/congreso/rueda de negocios solo se envían cuando
    // aplica ese tipo de evento.
    this.eventoService
      .crear({
        visitaId: this.visitaId(),
        motivo: this.motivo,
        motivoOtroDetalle: this.motivo === 'OTRO' ? this.motivoOtroDetalle || undefined : undefined,
        nombreEvento: esGrande ? this.nombreEvento || undefined : undefined,
        ciudad: esGrande ? this.ciudad || undefined : undefined,
        estado: esGrande ? this.estado || undefined : undefined,
        lugarRealizacion: esGrande ? this.lugarRealizacion || undefined : undefined,
        fechaEvento: esGrande ? this.fechaEvento || undefined : undefined,
        organizador: esGrande ? this.organizador || undefined : undefined,
        objetivoParticipacion: esGrande ? this.objetivoParticipacion || undefined : undefined,
        participacionVettal: esGrande ? this.participacionVettal || undefined : undefined,
        horaInicio: this.horaInicio || undefined,
        horaFin: this.horaFin || undefined,
        cantidadAsistentesEstimada: this.cantidadAsistentesEstimada ?? undefined,
        gpsLat: this.gpsLat() ?? undefined,
        gpsLng: this.gpsLng() ?? undefined,
        leads: leads.length ? leads : undefined,
        videosEntrevistaUrls: videos.length ? videos : undefined,
      })
      .subscribe({
        next: () => {
          this.guardando.set(false);
          if (esGrande) {
            this.subPaso.set('competencia');
          } else {
            this.completada.emit();
          }
        },
        error: () => this.guardando.set(false),
      });
  }

  finalizarCompetencia(): void {
    this.completada.emit();
  }
}
