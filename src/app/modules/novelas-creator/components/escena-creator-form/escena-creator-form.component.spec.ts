import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { IEscena } from '@models/escena.interfaces';
import { EscenasService } from '@services/escenas.service';
import { EscenaCreatorFormComponent } from './escena-creator-form.component';

describe('EscenaCreatorFormComponent — etiquetas', () => {
  let fixture: ComponentFixture<EscenaCreatorFormComponent>;
  let form: EscenaCreatorFormComponent;
  let escenas: jasmine.SpyObj<EscenasService>;
  const el = () => fixture.nativeElement as HTMLElement;
  const escena = { escenaId: 'e1', identificador: 'intro', etiquetas: ['Acto 1'] } as unknown as IEscena;

  async function montar(existente?: IEscena) {
    escenas = jasmine.createSpyObj<EscenasService>('EscenasService', ['postEscena', 'patchEscena']);
    escenas.postEscena.and.returnValue(of({}));
    escenas.patchEscena.and.returnValue(of({}));
    await TestBed.configureTestingModule({
      imports: [EscenaCreatorFormComponent],
      providers: [{ provide: EscenasService, useValue: escenas }],
    }).compileComponents();
    fixture = TestBed.createComponent(EscenaCreatorFormComponent);
    form = fixture.componentInstance;
    fixture.componentRef.setInput('novelaVersionId', 'v1');
    fixture.componentRef.setInput('escena', existente);
    fixture.detectChanges();
  }

  const enviar = () => {
    form.onSubmitEscena();
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
  };

  describe('crear', () => {
    it('envía las etiquetas con la escena nueva y limpia el formulario', async () => {
      await montar();
      let creadas = 0;
      form.escenaCreada.subscribe(() => creadas++);
      form.escenaForm.patchValue({ identificador: 'intro' });
      form.onEtiquetasChange(['Acto 1', 'Flashback']);

      enviar();

      expect(escenas.postEscena).toHaveBeenCalledWith(
        jasmine.objectContaining({ identificador: 'intro', novelaVersionId: 'v1', etiquetas: ['Acto 1', 'Flashback'] })
      );
      expect(creadas).toBe(1);
      expect(form.escenaForm.value.etiquetas).toEqual([]);
    });

    it('sin etiquetas envía una lista vacía', async () => {
      await montar();
      form.escenaForm.patchValue({ identificador: 'intro' });

      enviar();

      expect(escenas.postEscena).toHaveBeenCalledWith(jasmine.objectContaining({ etiquetas: [] }));
    });

    it('sigue mostrando las casillas de primera y última escena', async () => {
      await montar();

      expect(el().textContent).toContain('Primera escena');
      expect(el().textContent).toContain('Registrar Escena');
    });

    it('si el servidor falla, el botón vuelve a estar disponible', async () => {
      await montar();
      escenas.postEscena.and.returnValue(throwError(() => new Error('400')));
      form.escenaForm.patchValue({ identificador: 'intro' });

      enviar();

      expect(form.guardando).toBeFalse();
    });
  });

  describe('editar', () => {
    it('parte del nombre y las etiquetas de la escena y no muestra primera/última', async () => {
      await montar(escena);

      expect(form.escenaForm.value.identificador).toBe('intro');
      expect(form.escenaForm.value.etiquetas).toEqual(['Acto 1']);
      expect(el().textContent).toContain('Editar Escena');
      expect(el().textContent).not.toContain('Primera escena');
    });

    it('guarda con PATCH solo el nombre y las etiquetas', async () => {
      await montar(escena);
      let editadas = 0;
      form.escenaEditada.subscribe(() => editadas++);
      form.onEtiquetasChange(['Acto 1', 'Flashback']);

      enviar();

      expect(escenas.patchEscena).toHaveBeenCalledOnceWith('e1', { identificador: 'intro', etiquetas: ['Acto 1', 'Flashback'] });
      expect(escenas.postEscena).not.toHaveBeenCalled();
      expect(editadas).toBe(1);
    });

    it('permite quitar todas las etiquetas (lista vacía, no ausente)', async () => {
      await montar(escena);
      form.onEtiquetasChange([]);

      enviar();

      expect(escenas.patchEscena).toHaveBeenCalledOnceWith('e1', { identificador: 'intro', etiquetas: [] });
    });

    it('sin cambios no llama al servidor (respondería error) y solo avisa de que terminó', async () => {
      await montar(escena);
      let editadas = 0;
      form.escenaEditada.subscribe(() => editadas++);

      enviar();

      expect(escenas.patchEscena).not.toHaveBeenCalled();
      expect(editadas).toBe(1);
    });

    it('no envía un nombre vacío', async () => {
      await montar(escena);
      form.escenaForm.patchValue({ identificador: '' });

      enviar();

      expect(escenas.patchEscena).not.toHaveBeenCalled();
    });
  });
});
