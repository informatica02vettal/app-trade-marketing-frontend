import { Component, OnInit, inject, signal } from '@angular/core';
import { BancoImagenesService } from '../../../core/services/banco-imagenes.service';
import { ArteMarca, Planograma } from '../../../core/models/banco-imagenes.model';

@Component({
  selector: 'app-banco-imagenes',
  standalone: true,
  templateUrl: './banco-imagenes.html',
})
export class BancoImagenes implements OnInit {
  private readonly bancoImagenesService = inject(BancoImagenesService);

  readonly artesMarca = signal<ArteMarca[]>([]);
  readonly planogramas = signal<Planograma[]>([]);

  ngOnInit(): void {
    this.bancoImagenesService.listarArtesMarca().subscribe((artes) => this.artesMarca.set(artes));
    this.bancoImagenesService.listarPlanogramas().subscribe((planogramas) => this.planogramas.set(planogramas));
  }
}
