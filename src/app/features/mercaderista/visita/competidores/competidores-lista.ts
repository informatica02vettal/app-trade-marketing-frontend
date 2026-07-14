import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CompetidorService } from '../../../../core/services/competidor.service';
import { Competidor, CompetidorRequest } from '../../../../core/models/competidor.model';
import { PhotoPicker } from '../../../../shared/ui/photo-picker/photo-picker';
import { borrarBorrador, cargarBorrador, guardarBorrador } from '../../../../core/utils/borrador.util';

interface FotosCompetidor {
  fotosStand: (string | null)[];
  fotosMaterial: (string | null)[];
}

function fotosCompetidorVacias(): FotosCompetidor {
  return { fotosStand: [null], fotosMaterial: [null] };
}

type CampoAmenidad =
  | 'poseeInflables'
  | 'poseeToldos'
  | 'poseePantallaLed'
  | 'poseeExperienciasInteractivas'
  | 'realizaDemostraciones'
  | 'entregaMaterialPop'
  | 'entregaMuestras'
  | 'realizaRifasConcursos'
  | 'realizaPromocionesEspeciales'
  | 'cuentaActivaciones'
  | 'poseeExhibidoresDiferenciadores'
  | 'utilizaMascotasPublicitarias';

function formularioVacio(visitaId: number): CompetidorRequest {
  return {
    visitaId,
    nombreEmpresa: '',
    marcasRepresentadas: '',
    tipoProductosExhibidos: '',
    tamanoStand: '',
    cantidadPromotores: undefined,
    cantidadPersonalTecnico: undefined,
    poseeInflables: false,
    poseeToldos: false,
    poseePantallaLed: false,
    poseeExperienciasInteractivas: false,
    realizaDemostraciones: false,
    entregaMaterialPop: false,
    entregaMuestras: false,
    realizaRifasConcursos: false,
    realizaPromocionesEspeciales: false,
    cuentaActivaciones: false,
    poseeExhibidoresDiferenciadores: false,
    utilizaMascotasPublicitarias: false,
    observaciones: '',
    fotosStand: [],
    fotosMaterialPublicitario: [],
  };
}

@Component({
  selector: 'app-competidores-lista',
  standalone: true,
  imports: [FormsModule, PhotoPicker],
  templateUrl: './competidores-lista.html',
})
export class CompetidoresLista implements OnInit {
  private readonly competidorService = inject(CompetidorService);

  readonly visitaId = input.required<number>();

  readonly competidores = signal<Competidor[]>([]);
  readonly mostrarFormulario = signal(false);
  readonly guardando = signal(false);

  readonly fotosStandSlots = signal<(string | null)[]>([null]);
  readonly fotosMaterialSlots = signal<(string | null)[]>([null]);

  formulario: CompetidorRequest = formularioVacio(0);

  readonly amenidades: { campo: CampoAmenidad; label: string }[] = [
    { campo: 'poseeInflables', label: '¿Posee inflables?' },
    { campo: 'poseeToldos', label: '¿Posee toldos?' },
    { campo: 'poseePantallaLed', label: '¿Posee pantalla LED?' },
    { campo: 'poseeExperienciasInteractivas', label: '¿Posee experiencias interactivas?' },
    { campo: 'realizaDemostraciones', label: '¿Realiza demostraciones de producto?' },
    { campo: 'entregaMaterialPop', label: '¿Entrega material POP?' },
    { campo: 'entregaMuestras', label: '¿Entrega muestras?' },
    { campo: 'realizaRifasConcursos', label: '¿Realiza rifas o concursos?' },
    { campo: 'realizaPromocionesEspeciales', label: '¿Realiza promociones especiales?' },
    { campo: 'cuentaActivaciones', label: '¿Cuenta con activaciones para atraer visitantes?' },
    { campo: 'poseeExhibidoresDiferenciadores', label: '¿Posee exhibidores diferenciadores?' },
    { campo: 'utilizaMascotasPublicitarias', label: '¿Utiliza mascotas publicitarias?' },
  ];

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.competidorService.listarPorVisita(this.visitaId()).subscribe((competidores) => this.competidores.set(competidores));
  }

  private claveBorradorFotos(): string {
    return `tm_fotos_competidor_${this.visitaId()}`;
  }

  private persistirFotos(): void {
    guardarBorrador(this.claveBorradorFotos(), {
      fotosStand: this.fotosStandSlots(),
      fotosMaterial: this.fotosMaterialSlots(),
    });
  }

  abrirFormulario(): void {
    this.formulario = formularioVacio(this.visitaId());
    const borrador = cargarBorrador(this.claveBorradorFotos(), fotosCompetidorVacias());
    this.fotosStandSlots.set(borrador.fotosStand);
    this.fotosMaterialSlots.set(borrador.fotosMaterial);
    this.mostrarFormulario.set(true);
  }

  cerrarFormulario(): void {
    this.mostrarFormulario.set(false);
    borrarBorrador(this.claveBorradorFotos());
  }

  setAmenidad(campo: CampoAmenidad, valor: boolean): void {
    this.formulario[campo] = valor;
  }

  claseBotonSiNo(valorActual: boolean | undefined, esBotonSi: boolean): string {
    const base = 'rounded-lg border px-3 py-1.5 text-[12px] font-bold cursor-pointer';
    const activo = esBotonSi ? !!valorActual : !valorActual;
    if (!activo) return `${base} bg-panel-alt border-line text-muted`;
    return esBotonSi ? `${base} bg-success-tint border-success text-success` : `${base} bg-danger-tint border-danger text-danger`;
  }

  agregarSlotFotoStand(): void {
    this.fotosStandSlots.set([...this.fotosStandSlots(), null]);
  }

  setFotoStand(index: number, url: string | null): void {
    const fotos = [...this.fotosStandSlots()];
    fotos[index] = url;
    this.fotosStandSlots.set(fotos);
    this.persistirFotos();
  }

  agregarSlotFotoMaterial(): void {
    this.fotosMaterialSlots.set([...this.fotosMaterialSlots(), null]);
  }

  setFotoMaterial(index: number, url: string | null): void {
    const fotos = [...this.fotosMaterialSlots()];
    fotos[index] = url;
    this.fotosMaterialSlots.set(fotos);
    this.persistirFotos();
  }

  guardar(): void {
    if (!this.formulario.nombreEmpresa.trim() || this.guardando()) return;

    this.guardando.set(true);
    const payload: CompetidorRequest = {
      ...this.formulario,
      visitaId: this.visitaId(),
      fotosStand: this.fotosStandSlots().filter((f): f is string => !!f),
      fotosMaterialPublicitario: this.fotosMaterialSlots().filter((f): f is string => !!f),
    };

    this.competidorService.crear(payload).subscribe({
      next: () => {
        this.guardando.set(false);
        this.mostrarFormulario.set(false);
        borrarBorrador(this.claveBorradorFotos());
        this.cargar();
      },
      error: () => this.guardando.set(false),
    });
  }
}
