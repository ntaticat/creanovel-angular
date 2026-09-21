import { slugId } from './slug.util';

describe('slugId', () => {
  it('pasa a minúsculas, quita acentos y une con guion bajo', () => {
    expect(slugId('Llave de la Biblioteca')).toBe('llave_de_la_biblioteca');
    expect(slugId('Poción mágica')).toBe('pocion_magica');
    expect(slugId('  Patio  trasero!! ')).toBe('patio_trasero');
  });

  it('un nombre que empieza con número recibe un prefijo', () => {
    expect(slugId('3 monedas', 'o')).toBe('o_3_monedas');
  });

  it('un nombre sin letras ni números da vacío', () => {
    expect(slugId('¡¿?!')).toBe('');
    expect(slugId('')).toBe('');
  });

  it('se acota a 40 caracteres sin dejar guion bajo al final', () => {
    const id = slugId('a'.repeat(38) + ' b c d');
    expect(id.length).toBeLessThanOrEqual(40);
    expect(id.endsWith('_')).toBeFalse();
  });

  it('el resultado cumple la regla del backend cuando no es vacío', () => {
    for (const nombre of ['Ñandú', 'Café con leche', '7 mares', 'Zona ★ secreta']) {
      expect(slugId(nombre)).toMatch(/^[a-z][a-z0-9_]{0,39}$/);
    }
  });
});
