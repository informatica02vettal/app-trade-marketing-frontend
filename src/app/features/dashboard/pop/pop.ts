import { Component, OnInit, inject, signal } from '@angular/core';
import { InstalacionService } from '../../../core/services/instalacion.service';
import { Instalacion } from '../../../core/models/instalacion.model';

@Component({
  selector: 'app-pop',
  standalone: true,
  templateUrl: './pop.html',
})
export class Pop implements OnInit {
  private readonly instalacionService = inject(InstalacionService);

  readonly instalaciones = signal<Instalacion[]>([]);

  ngOnInit(): void {
    this.instalacionService.listar().subscribe((instalaciones) => this.instalaciones.set(instalaciones));
  }
}
