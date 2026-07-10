import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { VisitaService } from '../../../core/services/visita.service';
import { MercadoService } from '../../../core/services/mercado.service';
import { Visita } from '../../../core/models/visita.model';

@Component({
  selector: 'app-perfil',
  standalone: true,
  templateUrl: './perfil.html',
})
export class Perfil implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly visitaService = inject(VisitaService);
  private readonly mercadoService = inject(MercadoService);
  private readonly router = inject(Router);

  readonly usuario = this.authService.usuarioActual;
  readonly visitas = signal<Visita[]>([]);
  readonly hallazgosReportados = signal(0);

  readonly visitasCompletadas = computed(() => this.visitas().filter((v) => v.estado === 'COMPLETADA').length);
  readonly fotosCapturadas = computed(() => this.visitas().reduce((total, v) => total + v.cantidadFotos, 0));

  ngOnInit(): void {
    const usuario = this.usuario();
    if (!usuario) return;
    this.visitaService.listar(usuario.id).subscribe((visitas) => this.visitas.set(visitas));
    this.mercadoService.listar({ usuarioId: usuario.id }).subscribe((hallazgos) => this.hallazgosReportados.set(hallazgos.length));
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }
}
