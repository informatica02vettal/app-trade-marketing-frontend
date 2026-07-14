import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { EventoService } from '../../../../core/services/evento.service';
import { VisitaService } from '../../../../core/services/visita.service';
import { VisitaSessionService } from '../../../../core/session/visita-session.service';
import { EventoLead, MotivoEvento, ParticipacionVettal } from '../../../../core/models/evento.model';
import { EvidenciaFoto } from '../../../../core/models/visita.model';
import { PhotoPicker } from '../../../../shared/ui/photo-picker/photo-picker';
import { VideoPicker } from '../../../../shared/ui/video-picker/video-picker';
import { CompetidoresLista } from '../competidores/competidores-lista';
import { borrarBorrador, cargarBorrador, guardarBorrador } from '../../../../core/utils/borrador.util';

type SubPasoEvento = 'motivo' | 'detalle' | 'competencia';

type CategoriaFotoEvento = 'MONTAJE' | 'DESARROLLO' | 'CIERRE';

interface FotosEvento {
  fotosPorCategoria: Record<CategoriaFotoEvento, (string | null)[]>;
  videosEntrevista: (string | null)[];
}

function fotosEventoVacias(): FotosEvento {
  return {
    fotosPorCategoria: { MONTAJE: [null], DESARROLLO: [null], CIERRE: [null] },
    videosEntrevista: [null],
  };
}

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

  get esEventoGrande(): boolean {
    return this.sesion.esEventoGrande();
  }

  private claveBorradorFotos(): string {
    return `tm_fotos_evento_${this.visitaId()}`;
  }

  ngOnInit(): void {
    const borrador = cargarBorrador(this.claveBorradorFotos(), fotosEventoVacias());
    this.fotosPorCategoria.set(borrador.fotosPorCategoria);
    this.videosEntrevista.set(borrador.videosEntrevista);
  }

  private persistirFotos(): void {
    guardarBorrador(this.claveBorradorFotos(), {
      fotosPorCategoria: this.fotosPorCategoria(),
      videosEntrevista: this.videosEntrevista(),
    });
  }

  confirmarMotivo(): void {
    if (!this.motivo) return;
    if (this.esEventoGrande) {
      this.subPaso.set('detalle');
      return;
    }
    this.guardarEventoSimple();
  }

  anteriorDetalle(): void {
    this.subPaso.set('motivo');
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
    this.persistirFotos();
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
    this.persistirFotos();
  }

  private guardarEventoSimple(): void {
    if (!this.motivo || this.guardando()) return;
    this.guardando.set(true);
    this.eventoService
      .crear({
        visitaId: this.visitaId(),
        motivo: this.motivo,
        motivoOtroDetalle: this.motivo === 'OTRO' ? this.motivoOtroDetalle || undefined : undefined,
      })
      .subscribe({
        next: () => {
          this.guardando.set(false);
          this.completada.emit();
        },
        error: () => this.guardando.set(false),
      });
  }

  guardarDetalleEvento(): void {
    if (!this.motivo || this.guardando()) return;
    this.guardando.set(true);

    const leads = this.leads().filter((l) => l.nombre.trim());
    const videos = this.videosEntrevista().filter((v): v is string => !!v);

    this.eventoService
      .crear({
        visitaId: this.visitaId(),
        motivo: this.motivo,
        motivoOtroDetalle: this.motivo === 'OTRO' ? this.motivoOtroDetalle || undefined : undefined,
        nombreEvento: this.nombreEvento || undefined,
        ciudad: this.ciudad || undefined,
        estado: this.estado || undefined,
        lugarRealizacion: this.lugarRealizacion || undefined,
        fechaEvento: this.fechaEvento || undefined,
        horaInicio: this.horaInicio || undefined,
        horaFin: this.horaFin || undefined,
        organizador: this.organizador || undefined,
        objetivoParticipacion: this.objetivoParticipacion || undefined,
        participacionVettal: this.participacionVettal || undefined,
        cantidadAsistentesEstimada: this.cantidadAsistentesEstimada ?? undefined,
        leads: leads.length ? leads : undefined,
        videosEntrevistaUrls: videos.length ? videos : undefined,
      })
      .subscribe({
        next: () => {
          const fotos = this.fotosPorCategoria();
          const subidas: Observable<EvidenciaFoto>[] = [];
          (Object.keys(fotos) as CategoriaFotoEvento[]).forEach((categoria) => {
            fotos[categoria]
              .filter((url): url is string => !!url)
              .forEach((url) => subidas.push(this.visitaService.agregarFoto(this.visitaId(), { categoria, url })));
          });

          if (!subidas.length) {
            this.guardando.set(false);
            borrarBorrador(this.claveBorradorFotos());
            this.subPaso.set('competencia');
            return;
          }

          let restantes = subidas.length;
          subidas.forEach((obs) =>
            obs.subscribe(() => {
              restantes -= 1;
              if (restantes === 0) {
                this.guardando.set(false);
                borrarBorrador(this.claveBorradorFotos());
                this.subPaso.set('competencia');
              }
            }),
          );
        },
        error: () => this.guardando.set(false),
      });
  }

  finalizarCompetencia(): void {
    this.completada.emit();
  }
}
