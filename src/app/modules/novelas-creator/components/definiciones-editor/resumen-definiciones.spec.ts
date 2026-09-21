import { IObjetoDef, IVariableDef } from '@models/motor.interfaces';
import {
  resumirMeta, resumirObjeto, resumirUbicacion, resumirVariable, tituloMeta, tituloObjeto, tituloUbicacion, tituloVariable,
} from './resumen-definiciones';

describe('resumen-definiciones', () => {
  const variable = (parcial: Partial<IVariableDef>): IVariableDef =>
    ({ clave: 'salud', etiqueta: 'Salud', tipo: 'numero', inicial: 90, min: 0, max: 100, valores: [], hud: 'oculto', ...parcial });
  const objeto = (parcial: Partial<IObjetoDef>): IObjetoDef =>
    ({ id: 'pocion', nombre: 'Poción', descripcion: '', apilable: false, inicial: 0, ...parcial });

  describe('variables', () => {
    it('el título es el nombre visible, o la clave, o "nueva" si aún no hay nada', () => {
      expect(tituloVariable(variable({}))).toBe('Salud');
      expect(tituloVariable(variable({ etiqueta: '  ' }))).toBe('salud');
      expect(tituloVariable(variable({ etiqueta: '', clave: '' }))).toBe('Variable nueva');
    });

    it('un número dice su clave, tipo, rango y valor inicial', () => {
      expect(resumirVariable(variable({}))).toBe('salud · número · 0–100 · inicial 90');
    });

    it('un rango abierto por un lado se ve con puntos suspensivos y sin rango no aparece', () => {
      expect(resumirVariable(variable({ min: 0, max: null }))).toBe('salud · número · 0–… · inicial 90');
      expect(resumirVariable(variable({ min: null, max: null }))).toBe('salud · número · inicial 90');
    });

    it('no repite la clave cuando el nombre visible es igual', () => {
      expect(resumirVariable(variable({ etiqueta: 'salud' }))).toBe('número · 0–100 · inicial 90');
    });

    it('indica cómo se ve en pantalla', () => {
      expect(resumirVariable(variable({ hud: 'barra' }))).toContain('con barra');
      expect(resumirVariable(variable({ hud: 'numero' }))).toContain('visible');
      expect(resumirVariable(variable({ hud: 'oculto' }))).not.toMatch(/barra|visible/);
    });

    it('un sí / no y un texto', () => {
      expect(resumirVariable(variable({ clave: 'pareja', etiqueta: 'Pareja', tipo: 'booleano', inicial: true }))).toBe('pareja · sí / no · empieza en sí');
      expect(resumirVariable(variable({ tipo: 'booleano', inicial: false }))).toContain('empieza en no');
      expect(resumirVariable(variable({ clave: 'hora', etiqueta: 'Hora', tipo: 'texto', inicial: 'mañana', valores: ['mañana', 'tarde'] })))
        .toBe('hora · texto · 2 valores · inicial «mañana»');
    });
  });

  describe('objetos', () => {
    it('título y resumen básicos', () => {
      expect(tituloObjeto(objeto({}))).toBe('Poción');
      expect(tituloObjeto(objeto({ nombre: '', id: '' }))).toBe('Objeto nuevo');
      expect(resumirObjeto(objeto({}))).toBe('pocion · único');
    });

    it('apilable con o sin máximo, cantidad inicial y uso', () => {
      expect(resumirObjeto(objeto({ apilable: true, max: 99, inicial: 3 }))).toBe('pocion · apilable (máx. 99) · 3 al empezar');
      expect(resumirObjeto(objeto({ apilable: true, max: null }))).toContain('apilable');
      expect(resumirObjeto(objeto({ uso: { etiqueta: 'Beber', consumir: true } }))).toContain('se usa: Beber');
      expect(resumirObjeto(objeto({ uso: { etiqueta: '', consumir: true } }))).toContain('se usa: Usar');
    });
  });

  describe('ubicaciones y metas', () => {
    it('ubicación: dónde empieza y si tiene fondo', () => {
      expect(tituloUbicacion({ id: 'patio', nombre: 'Patio' })).toBe('Patio');
      expect(tituloUbicacion({ id: '', nombre: '' })).toBe('Ubicación nueva');
      expect(resumirUbicacion({ id: 'patio', nombre: 'Patio', backgroundSpriteId: 'x' }, true)).toBe('patio · empieza aquí · con fondo');
      expect(resumirUbicacion({ id: 'patio', nombre: 'Patio' }, false)).toBe('patio');
    });

    it('logro y final: id y descripción acortada', () => {
      expect(tituloMeta({ id: 'valiente', nombre: 'Valiente', descripcion: '' }, 'logro')).toBe('Valiente');
      expect(tituloMeta({ id: '', nombre: '', descripcion: '' }, 'logro')).toBe('Logro nuevo');
      expect(tituloMeta({ id: '', nombre: '', descripcion: '' }, 'final')).toBe('Final nuevo');
      expect(resumirMeta({ id: 'valiente', nombre: 'Valiente', descripcion: 'Retaste al dragón' })).toBe('valiente · Retaste al dragón');
      const largo = resumirMeta({ id: 'a', nombre: 'A', descripcion: 'x'.repeat(80) });
      expect(largo.endsWith('…')).toBeTrue();
      expect(largo.length).toBeLessThan(60);
    });
  });
});
