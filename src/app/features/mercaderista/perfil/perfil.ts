import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { VisitaService } from '../../../core/services/visita.service';
import { MercadoService } from '../../../core/services/mercado.service';
import { PlanVisitaService } from '../../../core/services/plan-visita.service';
import { Visita } from '../../../core/models/visita.model';
import { PlanVisita } from '../../../core/models/plan-visita.model';

function formatearFecha(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

function semanaActual(): { desde: string; hasta: string } {
  const hoy = new Date();
  const dia = (hoy.getDay() + 6) % 7;
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - dia);
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  return { desde: formatearFecha(lunes), hasta: formatearFecha(domingo) };
}

@Component({
  selector: 'app-perfil',
  standalone: true,
  templateUrl: './perfil.html',
})
export class Perfil implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly visitaService = inject(VisitaService);
  private readonly mercadoService = inject(MercadoService);
  private readonly planVisitaService = inject(PlanVisitaService);
  private readonly router = inject(Router);

  readonly usuario = this.authService.usuarioActual;
  readonly visitas = signal<Visita[]>([]);
  readonly hallazgosReportados = signal(0);
  readonly planSemana = signal<PlanVisita[]>([]);
  readonly ultimaSincronizacion = signal('Hace un momento');
  readonly sincronizando = signal(false);

  readonly iniciales = computed(() => {
    const partes = (this.usuario()?.nombre ?? '').trim().split(/\s+/);
    return ((partes[0]?.[0] ?? '') + (partes[1]?.[0] ?? '')).toUpperCase();
  });

  readonly visitasCompletadas = computed(() => this.visitas().filter((v) => v.estado === 'COMPLETADA').length);
  readonly fotosCapturadas = computed(() => this.visitas().reduce((total, v) => total + v.cantidadFotos, 0));

  readonly visitasEjecutadasSemana = computed(() => this.planSemana().filter((p) => p.estado === 'EJECUTADA').length);
  readonly visitasPlanificadasSemana = computed(() => this.planSemana().length);
  readonly cumplimientoSemanalPct = computed(() => {
    const total = this.visitasPlanificadasSemana();
    return total > 0 ? Math.round((this.visitasEjecutadasSemana() / total) * 100) : 0;
  });
  readonly ringStyle = computed(
    () =>
      `conic-gradient(var(--color-brand) 0% ${this.cumplimientoSemanalPct()}%, var(--color-panel-alt) ${this.cumplimientoSemanalPct()}% 100%)`,
  );

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    const usuario = this.usuario();
    if (!usuario) return;
    this.visitaService.listar(usuario.id).subscribe((visitas) => this.visitas.set(visitas));
    this.mercadoService.listar({ usuarioId: usuario.id }).subscribe((hallazgos) => this.hallazgosReportados.set(hallazgos.length));
    const { desde, hasta } = semanaActual();
    this.planVisitaService.listar(usuario.id, desde, hasta).subscribe((plan) => this.planSemana.set(plan));
  }

  sincronizarAhora(): void {
    this.sincronizando.set(true);
    this.cargarDatos();
    this.ultimaSincronizacion.set('Justo ahora');
    this.sincronizando.set(false);
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }
}
