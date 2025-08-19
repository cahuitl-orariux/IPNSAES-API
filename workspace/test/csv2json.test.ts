import { describe, it, expect } from 'vitest';
import { csv2json } from '../../src/csv2json';
import { Materia, Dia } from '../../src/Materias';

describe('CSV to JSON conversion', () => {
    it('debería procesar encabezados SAES cuando preprocesarHorarios es true', () => {
        const csv = `Asignatura,Grupo,Profesor,Lun,Mar
Matemáticas,1CV1,Juan Pérez,08:00-10:00,`;
        
        const resultado = csv2json(csv, { preprocesarHorarios: true, delimiter: ',' });
        
        expect(resultado).toHaveLength(1);
        expect(resultado[0].nombre).toBe('Matemáticas');
        expect(resultado[0].grupo).toBe('1CV1');
        expect(resultado[0].profesor).toBe('Juan Pérez');
        expect(resultado[0].horario).toHaveLength(1);
        expect(resultado[0].horario[0].dia).toBe(Dia.Lunes);
    });

    it('debería convertir CSV con horarios usando encabezados normalizados', () => {
        const csv = `nombre,grupo,profesor,lunes,martes
Matemáticas,1CV1,Juan Pérez,08:00-10:00,
Física,1CV2,María García,,10:00-12:00`;
        
        const resultado = csv2json(csv, { preprocesarHorarios: false, delimiter: ',' });
        
        expect(resultado).toHaveLength(2);
        
        // Verificar primera materia
        expect(resultado[0].nombre).toBe('Matemáticas');
        expect(resultado[0].grupo).toBe('1CV1');
        expect(resultado[0].profesor).toBe('Juan Pérez');
        expect(resultado[0].horario).toHaveLength(1);
        expect(resultado[0].horario[0].dia).toBe(Dia.Lunes);
        expect(resultado[0].horario[0].horaInicio).toBe('08:00');
        expect(resultado[0].horario[0].horaFin).toBe('10:00');
        
        // Verificar segunda materia
        expect(resultado[1].nombre).toBe('Física');
        expect(resultado[1].horario).toHaveLength(1);
        expect(resultado[1].horario[0].dia).toBe(Dia.Martes);
    });

    it('debería usar parámetros por defecto con formato SAES', () => {
        const csv = `Asignatura,Grupo,Profesor,Lun
Matemáticas,1CV1,Juan Pérez,08:00-10:00`;
        
        const resultado = csv2json(csv); // Sin parámetros, usa valores por defecto (preprocesarHorarios: true)
        
        expect(resultado).toHaveLength(1);
        expect(resultado[0].nombre).toBe('Matemáticas');
        expect(resultado[0].grupo).toBe('1CV1');
        expect(resultado[0].profesor).toBe('Juan Pérez');
        expect(resultado[0].horario).toHaveLength(1);
    });

    it('debería procesar múltiples materias con diferentes horarios', () => {
        const csv = `Asignatura,Grupo,Profesor,Lun,Mar,Mie
Matemáticas,1CV1,Juan Pérez,08:00-10:00,,
Física,1CV2,María García,,10:00-12:00,
Química,1CV3,Carlos López,,,14:00-16:00`;
        
        const resultado = csv2json(csv, { preprocesarHorarios: true, delimiter: ',' });
        
        expect(resultado).toHaveLength(3);
        
        // Matemáticas - Lunes
        expect(resultado[0].nombre).toBe('Matemáticas');
        expect(resultado[0].horario).toHaveLength(1);
        expect(resultado[0].horario[0].dia).toBe(Dia.Lunes);
        
        // Física - Martes
        expect(resultado[1].nombre).toBe('Física');
        expect(resultado[1].horario).toHaveLength(1);
        expect(resultado[1].horario[0].dia).toBe(Dia.Martes);
        
        // Química - Miércoles
        expect(resultado[2].nombre).toBe('Química');
        expect(resultado[2].horario).toHaveLength(1);
        expect(resultado[2].horario[0].dia).toBe(Dia.Miércoles);
    });
});