import { Injectable, signal } from '@angular/core';

export type ToastTipo = 'error' | 'success' | 'info';

export interface Toast {
  id: number;
  mensaje: string;
  tipo: ToastTipo;
}

let siguienteId = 1;

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);

  mostrar(mensaje: string, tipo: ToastTipo = 'info', duracionMs = 5000): void {
    const id = siguienteId++;
    this.toasts.update((actuales) => [...actuales, { id, mensaje, tipo }]);
    setTimeout(() => this.cerrar(id), duracionMs);
  }

  mostrarError(mensaje: string): void {
    this.mostrar(mensaje, 'error', 6000);
  }

  cerrar(id: number): void {
    this.toasts.update((actuales) => actuales.filter((t) => t.id !== id));
  }
}
