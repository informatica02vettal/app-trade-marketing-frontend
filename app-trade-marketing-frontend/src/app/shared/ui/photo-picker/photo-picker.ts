import { Component, computed, inject, input, output, signal } from '@angular/core';
import { ArchivoUploadService } from '../../../core/services/archivo-upload.service';

@Component({
  selector: 'app-photo-picker',
  standalone: true,
  templateUrl: './photo-picker.html',
})
export class PhotoPicker {
  private readonly archivoUploadService = inject(ArchivoUploadService);

  readonly label = input('Foto');
  readonly url = input<string | null>(null);
  readonly urlChange = output<string | null>();

  readonly subiendo = signal(false);
  readonly error = signal<string | null>(null);

  readonly urlAbsoluta = computed(() => {
    const url = this.url();
    return url ? this.archivoUploadService.urlAbsoluta(url) : null;
  });

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    this.subiendo.set(true);
    this.error.set(null);
    this.archivoUploadService.subir(file).subscribe({
      next: (url) => {
        this.subiendo.set(false);
        this.urlChange.emit(url);
      },
      error: () => {
        this.subiendo.set(false);
        this.error.set('No se pudo subir la foto');
      },
    });
  }

  quitar(): void {
    this.urlChange.emit(null);
  }
}
