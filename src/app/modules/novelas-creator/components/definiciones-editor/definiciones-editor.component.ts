import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import {
  ICondicion,
  IDefiniciones,
  IEfecto,
  IMetaDef,
  IObjetoDef,
  IUbicacionDef,
  IUsoObjeto,
  IVariableDef,
  VariableHud,
  VariableTipo,
  VariableValor,
} from '@models/motor.interfaces';
import { IBackground } from '@models/background.interfaces';
import { IEscena } from '@models/escena.interfaces';
import { NovelasVersionesService } from '@services/novelas-versiones.service';
import { UploadsService } from '@services/uploads.service';
import { SpinnerComponent } from 'src/app/shared/components/spinner/spinner.component';
import { valorInicial } from 'src/app/shared/engine/estado';
import { TarjetaPlegableComponent } from 'src/app/shared/components/tarjeta-plegable/tarjeta-plegable.component';
import { SeleccionUnica } from 'src/app/shared/utils/seleccion-unica.util';
import { extraerErrores } from 'src/app/shared/utils/http-errors.util';
import { nombreTipoRecurso, resumenRecurso } from 'src/app/shared/utils/recurso-etiqueta.util';
import { slugId } from 'src/app/shared/utils/slug.util';
import { CondicionBuilderComponent } from '../condicion-builder/condicion-builder.component';
import { EfectosEditorComponent } from '../efectos-editor/efectos-editor.component';
import { VariableValorInputComponent } from '../variable-valor-input/variable-valor-input.component';
import {
  resumirMeta, resumirObjeto, resumirUbicacion, resumirVariable, tituloMeta, tituloObjeto, tituloUbicacion, tituloVariable,
} from './resumen-definiciones';

/** Una variable en edición. Clave y tipo solo se pueden cambiar mientras la variable es nueva: condiciones y efectos ya guardados las citan. */
interface IFilaVariable extends IVariableDef {
  nueva: boolean;
  valoresTexto: string;
}

/** Un objeto en edición. Su id solo se puede cambiar mientras es nuevo: condiciones y efectos ya guardados lo citan. */
interface IFilaObjeto extends IObjetoDef {
  nueva: boolean;
  /** El autor escribió el id a mano: deja de sugerirse a partir del nombre. */
  idManual: boolean;
  subiendo: boolean;
}

interface IFilaUbicacion extends IUbicacionDef {
  nueva: boolean;
  idManual: boolean;
}

/** Un logro o un final en edición. */
interface IFilaMeta extends IMetaDef {
  nueva: boolean;
  idManual: boolean;
}

type Pestana = 'variables' | 'objetos' | 'ubicaciones' | 'metas';
type CatalogoMeta = 'logros' | 'finales';

/** Catálogo del motor de un borrador: variables (salud, afecto...), objetos del inventario y ubicaciones del mundo. */
@Component({
  selector: 'app-definiciones-editor',
  templateUrl: './definiciones-editor.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [FaIconComponent, SpinnerComponent, VariableValorInputComponent, CondicionBuilderComponent, EfectosEditorComponent, TarjetaPlegableComponent],
})
export class DefinicionesEditorComponent implements OnChanges {
  @Input() novelaVersionId = '';
  @Input() definiciones: IDefiniciones | null | undefined;
  /** Fondos de la novela: cada ubicación puede usar uno de sus sprites como escenario por defecto. */
  @Input() backgrounds: IBackground[] = [];
  /** Escenas de la versión con sus recursos: un objeto puede llevar al jugador a cualquiera de sus nodos. */
  @Input() escenas: IEscena[] = [];

  @Output() guardado = new EventEmitter<IDefiniciones>();

  faPlus = faPlus;
  faTrash = faTrash;

  pestana: Pestana = 'variables';
  filas: IFilaVariable[] = [];
  objetos: IFilaObjeto[] = [];
  ubicaciones: IFilaUbicacion[] = [];
  ubicacionInicial = '';
  logros: IFilaMeta[] = [];
  finales: IFilaMeta[] = [];
  errores: string[] = [];
  guardando = false;
  /** Nodos a los que puede llevar el uso de un objeto (se recalcula solo cuando cambian las escenas). */
  destinosUso: { id: string; etiqueta: string }[] = [];

  /** Qué tarjeta está abierta en cada lista: plegadas por defecto, solo se abre la que se edita. */
  readonly acordeon = new SeleccionUnica();

  readonly tituloVariable = tituloVariable;
  readonly resumirVariable = resumirVariable;
  readonly tituloObjeto = tituloObjeto;
  readonly resumirObjeto = resumirObjeto;
  readonly tituloUbicacion = tituloUbicacion;
  readonly resumirUbicacion = resumirUbicacion;
  readonly tituloMeta = tituloMeta;
  readonly resumirMeta = resumirMeta;

  private cacheDefiniciones?: { claves: unknown[]; definiciones: IDefiniciones };

  readonly tipos: { valor: VariableTipo; etiqueta: string }[] = [
    { valor: 'numero', etiqueta: 'Número' },
    { valor: 'booleano', etiqueta: 'Sí / No' },
    { valor: 'texto', etiqueta: 'Texto' },
  ];
  readonly huds: { valor: VariableHud; etiqueta: string }[] = [
    { valor: 'oculto', etiqueta: 'Oculta' },
    { valor: 'numero', etiqueta: 'Mostrar valor' },
    { valor: 'barra', etiqueta: 'Mostrar barra' },
  ];

  constructor(
    private novelasVersionesService: NovelasVersionesService,
    private uploadsService: UploadsService
  ) {}

  get fondosDisponibles(): { id: string; etiqueta: string }[] {
    return this.backgrounds.flatMap(b =>
      (b.sprites ?? []).map(s => ({
        id: s.backgroundSpriteId,
        etiqueta: `${b.descripcion} - ${s.nombre}`,
      }))
    );
  }

  /**
   * Lo que se está editando ahora mismo (aunque no se haya guardado), para que el uso de un objeto pueda citar una variable
   * recién creada. Mientras no cambie ninguna lista devuelve el mismo objeto: uno nuevo en cada ciclo dispararía NG0100.
   */
  get definicionesEnEdicion(): IDefiniciones {
    const claves = [this.filas, this.objetos, this.ubicaciones, this.logros, this.finales];

    if (!this.cacheDefiniciones || this.cacheDefiniciones.claves.some((c, i) => c !== claves[i])) {
      this.cacheDefiniciones = {
        claves,
        definiciones: {
          variables: this.filas.filter(v => v.clave),
          objetos: this.objetos.filter(o => o.id),
          ubicaciones: this.ubicaciones.filter(u => u.id),
          logros: this.logros.filter(l => l.id),
          finales: this.finales.filter(f => f.id),
        },
      };
    }

    return this.cacheDefiniciones.definiciones;
  }

  resolverUrl(url: string): string {
    return this.uploadsService.resolveUrl(url);
  }

  cambiarPestana(pestana: Pestana): void {
    this.pestana = pestana;
  }

  ngOnChanges(): void {
    this.destinosUso = this.escenas.flatMap(escena =>
      (escena.recursos ?? []).map(recurso => ({
        id: recurso.recursoId,
        etiqueta: `${escena.identificador} — ${nombreTipoRecurso(recurso)}: ${resumenRecurso(recurso).slice(0, 30)}`,
      }))
    );
    this.filas = (this.definiciones?.variables ?? []).map(v => ({
      ...v,
      valores: v.valores ?? [],
      nueva: false,
      valoresTexto: (v.valores ?? []).join(', '),
    }));
    this.objetos = (this.definiciones?.objetos ?? []).map(o => ({
      ...o,
      descripcion: o.descripcion ?? '',
      nueva: false,
      idManual: true,
      subiendo: false,
    }));
    this.ubicaciones = (this.definiciones?.ubicaciones ?? []).map(u => ({
      ...u,
      nueva: false,
      idManual: true,
    }));
    this.ubicacionInicial = this.definiciones?.ubicacionInicial ?? '';
    const aFilas = (metas?: IMetaDef[]): IFilaMeta[] =>
      (metas ?? []).map(m => ({ ...m, descripcion: m.descripcion ?? '', nueva: false, idManual: true }));
    this.logros = aFilas(this.definiciones?.logros);
    this.finales = aFilas(this.definiciones?.finales);
    this.errores = [];
    ['variables', 'objetos', 'ubicaciones', 'logros', 'finales'].forEach(lista => this.acordeon.cerrar(lista));
  }

  agregar(): void {
    this.filas = [
      ...this.filas,
      {
        clave: '',
        etiqueta: '',
        tipo: 'numero',
        inicial: 0,
        min: null,
        max: null,
        valores: [],
        hud: 'oculto',
        nueva: true,
        valoresTexto: '',
      },
    ];
    this.acordeon.fijar('variables', this.filas.length - 1, true);
  }

  quitar(indice: number): void {
    this.filas = this.filas.filter((_, i) => i !== indice);
    this.acordeon.alQuitar('variables', indice);
  }

  cambiar(indice: number, cambio: Partial<IFilaVariable>): void {
    this.filas = this.filas.map((f, i) => {
      if (i !== indice) {
        return f;
      }
      const fila = { ...f, ...cambio };
      // Al cambiar el tipo, el valor inicial y los límites anteriores no aplican.
      return cambio.tipo ? { ...fila, inicial: valorInicial({ ...fila, inicial: null }), min: null, max: null, valoresTexto: '', valores: [] } : fila;
    });
  }

  cambiarNumero(indice: number, campo: 'min' | 'max', texto: string): void {
    const numero = Number(texto);
    this.cambiar(indice, { [campo]: texto.trim() === '' || !Number.isFinite(numero) ? null : numero });
  }

  cambiarValores(indice: number, texto: string): void {
    const valores = texto
      .split(',')
      .map(v => v.trim())
      .filter(v => v !== '');
    this.cambiar(indice, { valoresTexto: texto, valores });
  }

  cambiarInicial(indice: number, valor: VariableValor): void {
    this.cambiar(indice, { inicial: valor });
  }

  // ---- Objetos

  agregarObjeto(): void {
    this.objetos = [
      ...this.objetos,
      { id: '', nombre: '', descripcion: '', imagenUrl: null, apilable: false, max: null, inicial: 0, nueva: true, idManual: false, subiendo: false },
    ];
    this.acordeon.fijar('objetos', this.objetos.length - 1, true);
  }

  quitarObjeto(indice: number): void {
    this.objetos = this.objetos.filter((_, i) => i !== indice);
    this.acordeon.alQuitar('objetos', indice);
  }

  cambiarObjeto(indice: number, cambio: Partial<IFilaObjeto>): void {
    this.objetos = this.objetos.map((o, i) => {
      if (i !== indice) return o;
      const fila = { ...o, ...cambio };
      // El id se sugiere a partir del nombre hasta que el autor lo escribe a mano.
      return fila.nueva && !fila.idManual && 'nombre' in cambio ? { ...fila, id: slugId(fila.nombre, 'o') } : fila;
    });
  }

  cambiarIdObjeto(indice: number, id: string): void {
    this.cambiarObjeto(indice, { id, idManual: true });
  }

  cambiarEnteroObjeto(indice: number, campo: 'max' | 'inicial', texto: string): void {
    const numero = Number(texto);
    const valor = texto.trim() === '' || !Number.isInteger(numero) ? null : numero;
    this.cambiarObjeto(indice, campo === 'max' ? { max: valor } : { inicial: valor ?? 0 });
  }

  /** Activa o quita el uso del objeto desde la mochila. */
  alternarUso(indice: number, activo: boolean): void {
    this.cambiarObjeto(indice, {
      uso: activo ? { etiqueta: '', condicion: null, efectos: null, consumir: false, destinoRecursoId: null } : null,
    });
  }

  cambiarUso(indice: number, cambio: Partial<IUsoObjeto>): void {
    const actual = this.objetos[indice]?.uso;
    if (actual) {
      this.cambiarObjeto(indice, { uso: { ...actual, ...cambio } });
    }
  }

  cambiarCondicionUso(indice: number, condicion: ICondicion | null): void {
    this.cambiarUso(indice, { condicion });
  }

  cambiarEfectosUso(indice: number, efectos: IEfecto[]): void {
    this.cambiarUso(indice, { efectos });
  }

  cambiarDestinoUso(indice: number, destino: string): void {
    this.cambiarUso(indice, { destinoRecursoId: destino || null });
  }

  subirImagen(indice: number, evento: Event): void {
    const archivo = (evento.target as HTMLInputElement).files?.[0];
    if (!archivo) {
      return;
    }

    this.cambiarObjeto(indice, { subiendo: true });
    this.uploadsService.postUpload(archivo, 'objetos').subscribe({
      next: ({ url }) => this.cambiarObjeto(indice, { imagenUrl: url, subiendo: false }),
      error: error => {
        this.cambiarObjeto(indice, { subiendo: false });
        this.errores = extraerErrores(error, 'No se pudo subir la imagen.');
      },
    });
  }

  // ---- Logros y finales

  agregarMeta(catalogo: CatalogoMeta): void {
    this[catalogo] = [...this[catalogo], { id: '', nombre: '', descripcion: '', nueva: true, idManual: false }];
    this.acordeon.fijar(catalogo, this[catalogo].length - 1, true);
  }

  quitarMeta(catalogo: CatalogoMeta, indice: number): void {
    this[catalogo] = this[catalogo].filter((_, i) => i !== indice);
    this.acordeon.alQuitar(catalogo, indice);
  }

  cambiarMeta(catalogo: CatalogoMeta, indice: number, cambio: Partial<IFilaMeta>): void {
    this[catalogo] = this[catalogo].map((m, i) => {
      if (i !== indice) return m;
      const fila = { ...m, ...cambio };
      return fila.nueva && !fila.idManual && 'nombre' in cambio ? { ...fila, id: slugId(fila.nombre, catalogo === 'logros' ? 'l' : 'f') } : fila;
    });
  }

  cambiarIdMeta(catalogo: CatalogoMeta, indice: number, id: string): void {
    this.cambiarMeta(catalogo, indice, { id, idManual: true });
  }

  // ---- Ubicaciones

  agregarUbicacion(): void {
    this.ubicaciones = [
      ...this.ubicaciones,
      { id: '', nombre: '', backgroundSpriteId: null, nueva: true, idManual: false },
    ];
    this.acordeon.fijar('ubicaciones', this.ubicaciones.length - 1, true);
  }

  quitarUbicacion(indice: number): void {
    const quitada = this.ubicaciones[indice];
    this.ubicaciones = this.ubicaciones.filter((_, i) => i !== indice);
    this.acordeon.alQuitar('ubicaciones', indice);
    if (quitada && this.ubicacionInicial === quitada.id) {
      this.ubicacionInicial = '';
    }
  }

  cambiarUbicacion(indice: number, cambio: Partial<IFilaUbicacion>): void {
    this.ubicaciones = this.ubicaciones.map((u, i) => {
      if (i !== indice) return u;
      const fila = { ...u, ...cambio };
      return fila.nueva && !fila.idManual && 'nombre' in cambio ? { ...fila, id: slugId(fila.nombre, 'u') } : fila;
    });
  }

  cambiarIdUbicacion(indice: number, id: string): void {
    this.cambiarUbicacion(indice, { id, idManual: true });
  }

  guardar(): void {
    if (this.guardando) {
      return;
    }

    this.guardando = true;
    this.errores = [];

    const variables: IVariableDef[] = this.filas.map(
      ({ nueva: _nueva, valoresTexto: _valoresTexto, ...variable }) => variable
    );

    const objetos: IObjetoDef[] = this.objetos.map(
      ({ nueva: _n, idManual: _m, subiendo: _s, ...objeto }) => objeto
    );
    const ubicaciones: IUbicacionDef[] = this.ubicaciones.map(
      ({ nueva: _n, idManual: _m, ...ubicacion }) => ubicacion
    );

    this.novelasVersionesService
      .putDefiniciones(this.novelaVersionId, {
        variables,
        objetos,
        ubicaciones,
        ubicacionInicial: this.ubicacionInicial || null,
        logros: this.logros.map(({ nueva: _n, idManual: _m, ...meta }) => meta),
        finales: this.finales.map(({ nueva: _n, idManual: _m, ...meta }) => meta),
      })
      .subscribe({
        next: definiciones => {
          this.guardando = false;
          this.guardado.emit(definiciones);
        },
        error: error => {
          this.guardando = false;
          this.errores = extraerErrores(error, 'No se pudieron guardar las variables.');
        },
      });
  }
}
