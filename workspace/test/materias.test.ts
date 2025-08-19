import { describe, it, expect, beforeEach } from "vitest";
import {
	Materia,
	Dia,
	Clase,
	FORMATO_GRUPO_REGEX,
	materiaFromDiccionario,
	materiasFromDiccionario,
	materiaFromJSON,
	materiasFromJSON,
} from "../../src/Materias";
import {
	BaseDatosMaterias,
	crearBaseDatosMaterias,
} from "../../src/MateriaUtil";

describe("Clase Materia", () => {
	let materia: Materia;

	beforeEach(() => {
		materia = new Materia();
	});

	describe("Constructor y propiedades básicas", () => {
		it("debería crear una materia vacía por defecto", () => {
			expect(materia.nombre).toBe("");
			expect(materia.profesor).toBe("");
			expect(materia.grupo).toBe("");
			expect(materia.horario).toEqual([]);
		});

		it("debería crear una materia con opciones", () => {
			const horario: Clase[] = [
				{
					dia: Dia.Lunes,
					horaInicio: "08:00",
					horaFin: "10:00",
					minutoInicio: undefined,
					minutoFin: undefined,
				},
			];

			const materiaConOpciones = new Materia({
				nombre: "Matemáticas",
				grupo: "1CV1",
				profesor: "Juan Pérez",
				horario,
			});

			expect(materiaConOpciones.nombre).toBe("Matemáticas");
			expect(materiaConOpciones.profesor).toBe("Juan Pérez");
			expect(materiaConOpciones.grupo).toBe("1CV1");
			expect(materiaConOpciones.horario).toEqual(horario);
		});
	});

	describe("Propiedades computadas", () => {
		beforeEach(() => {
			materia.nombre = "Matemáticas Avanzadas";
			materia.grupo = "1CV1";
			materia.profesor = "Juan Pérez";
		});

		it("debería generar ID correctamente", () => {
			const expectedId = "1CV1-Matemáticas Avanzadas";
			expect(materia.id).toBe(expectedId);
		});

		it("debería generar ID con profesor correctamente", () => {
			const expectedId = "1CV1-Matemáticas Avanzadas-Juan Pérez";
			expect(materia.idConProfesor).toBe(expectedId);
		});

		it("debería extraer turno del grupo correctamente", () => {
			// El regex \d+[a-z]([a-z])\d+ busca: dígito(s) + letra + letra_capturada + dígito(s)
			// En '1CV11' captura la 'V' (segunda letra)
			materia.grupo = "1CV11"; // Este formato funciona y captura 'V'
			expect(materia.turno).toBe("V");

			materia.grupo = "2IM12"; // Formato alternativo que captura 'M'
			expect(materia.turno).toBe("M");

			// Los grupos válidos siempre extraen la segunda letra como turno
			materia.grupo = "1AB11"; // Formato válido, extrae 'B'
			expect(materia.turno).toBe("B");
		});

		it("debería generar abreviación del nombre correctamente", () => {
			expect(materia.abreviacionNombre).toBe("MA");

			materia.nombre = "Física de Partículas";
			expect(materia.abreviacionNombre).toBe("FP");
		});

		it("debería filtrar palabras comunes en abreviación", () => {
			materia.nombre = "Análisis de Datos y Estadística";
			expect(materia.abreviacionNombre).toBe("ADE");
		});
	});

	describe("Validación de materia vacía", () => {
		it("debería identificar materia vacía correctamente", () => {
			expect(materia.estaVacia).toBe(true);
		});

		it("debería identificar materia completa correctamente", () => {
			materia.nombre = "Matemáticas";
			materia.grupo = "1CV1";
			materia.profesor = "Juan Pérez";
			materia.horario = [
				{
					dia: Dia.Lunes,
					horaInicio: "08:00",
					horaFin: "10:00",
					minutoInicio: undefined,
					minutoFin: undefined,
				},
			];

			expect(materia.estaVacia).toBe(false);
		});
	});

	describe("Hash del nombre", () => {
		it("debería generar hash consistente para el mismo nombre", () => {
			materia.nombre = "Matemáticas";
			const hash1 = materia.hashNombre;
			const hash2 = materia.hashNombre;

			expect(hash1).toBe(hash2);
			expect(typeof hash1).toBe("number");
		});

		it("debería generar hashes diferentes para nombres diferentes", () => {
			materia.nombre = "Matemáticas";
			const hash1 = materia.hashNombre;

			materia.nombre = "Física";
			const hash2 = materia.hashNombre;

			expect(hash1).not.toBe(hash2);
		});
	});

	describe("Validación de formato de grupo", () => {
		const formatoGrupoRegex = FORMATO_GRUPO_REGEX;

		it("debería identificar grupos con formato válido", () => {
			const gruposValidos = [
				"1CV11",
				"2IM12",
				"3IS13",
				"4AM14",
				"5QM25",
				"1CV21",
				"10CV11",
				"123AB456",
			];

			gruposValidos.forEach((grupo) => {
				materia.grupo = grupo;
				expect(formatoGrupoRegex.test(materia.grupo)).toBe(true);
				// Nota: no todos los formatos válidos del regex necesariamente extraen turno
				// porque el regex de turno es diferente: /\d+[a-z]([a-z])\d+/i
			});
		});

		it("debería identificar grupos con formato inválido", () => {
			const gruposInvalidos = [
				"1C", // Muy corto
				"CV11", // No empieza con dígito
				"1C1", // Solo una letra y un dígito
				"1C11", // Solo una letra en el medio (necesita dos letras)
				"1CVV11", // Muchas letras en el medio
				"1CV", // No termina con dígitos
				"1CVM", // Termina con letra
				"1-CV-11", // Con guiones
				"1CV 11", // Con espacios
				"A1CV11", // Empieza con letra
				"1CV11A", // Termina con letra después de dígitos
				"1CV1M1", // Formato de 6 caracteres (no cumple \d+[a-zA-Z][a-zA-Z]\d+)
			];

			gruposInvalidos.forEach((grupo) => {
				// Verificar que el regex los identifica como inválidos
				expect(formatoGrupoRegex.test(grupo)).toBe(false);

				// Verificar que la clase lanza error al intentar asignarlos
				expect(() => {
					materia.grupo = grupo;
				}).toThrow(/El formato del grupo .* no es válido/);
			});
		});

		it("debería extraer turno solo de grupos con formato válido", () => {
			// Formato válido según \d+[a-zA-Z][a-zA-Z]\d+
			materia.grupo = "1CV11";
			expect(formatoGrupoRegex.test(materia.grupo)).toBe(true);
			// Este extrae turno 'V' correctamente
			expect(materia.turno).toBe("V");

			// Grupos válidos que no extraen turno específico
			materia.grupo = "1AB11"; // Formato válido pero turno no común
			expect(formatoGrupoRegex.test(materia.grupo)).toBe(true);
			expect(materia.turno).toBe("B"); // Extrae la segunda letra

			materia.grupo = "2XY12"; // Formato válido con letras no comunes
			expect(formatoGrupoRegex.test(materia.grupo)).toBe(true);
			expect(materia.turno).toBe("Y");
		});

		it("debería manejar casos edge de validación", () => {
			// Números largos al inicio
			materia.grupo = "123CV11";
			expect(formatoGrupoRegex.test(materia.grupo)).toBe(true);

			// Números largos al final
			materia.grupo = "1CV456";
			expect(formatoGrupoRegex.test(materia.grupo)).toBe(true);

			// Letras en mayúsculas y minúsculas mezcladas (ambas son \w)
			materia.grupo = "1Cv11";
			expect(formatoGrupoRegex.test(materia.grupo)).toBe(true);

			// Exactamente el mínimo de caracteres válido
			materia.grupo = "1AB1";
			expect(formatoGrupoRegex.test(materia.grupo)).toBe(true);

			// Con más dígitos al inicio y final
			materia.grupo = "123AB456";
			expect(formatoGrupoRegex.test(materia.grupo)).toBe(true);
		});

		it("debería validar que materias completas tengan grupo con formato correcto", () => {
			// Crear materia con grupo válido según \d+[a-zA-Z][a-zA-Z]\d+
			const materiaValida = new Materia({
				nombre: "Matemáticas",
				grupo: "1CV11", // Formato válido para \d+[a-zA-Z][a-zA-Z]\d+
				profesor: "Juan Pérez",
				horario: [
					{
						dia: Dia.Lunes,
						horaInicio: "08:00",
						horaFin: "10:00",
						minutoInicio: undefined,
						minutoFin: undefined,
					},
				],
			});

			expect(formatoGrupoRegex.test(materiaValida.grupo)).toBe(true);
			expect(materiaValida.estaVacia).toBe(false);

			// Intentar crear materia con grupo inválido debe lanzar error
			expect(() => {
				new Materia({
					nombre: "Matemáticas",
					grupo: "1CV", // Formato inválido para \d+[a-zA-Z][a-zA-Z]\d+
					profesor: "Juan Pérez",
					horario: [
						{
							dia: Dia.Lunes,
							horaInicio: "08:00",
							horaFin: "10:00",
							minutoInicio: undefined,
							minutoFin: undefined,
						},
					],
				});
			}).toThrow(/El formato del grupo .* no es válido/);
		});
	});

	describe("Validación de entrada de datos", () => {
		it("debería rechazar grupos con formato inválido en el constructor", () => {
			const gruposInvalidos = [
				"1C", // Muy corto
				"CV11", // No empieza con dígito
				"1C1", // Solo una letra y un dígito
				"1C11", // Solo una letra en el medio (necesita dos letras)
				"1CVV11", // Muchas letras en el medio
				"1CV", // No termina con dígitos
				"1CVM", // Termina con letra
				"1-CV-11", // Con guiones
				"1CV 11", // Con espacios
				"A1CV11", // Empieza con letra
				"1CV11A", // Termina con letra después de dígitos
				"1CV1M1", // Formato de 6 caracteres (no cumple \\d+[a-zA-Z][a-zA-Z]\\d+)
			];

			gruposInvalidos.forEach((grupoInvalido) => {
				expect(() => {
					new Materia({
						nombre: "Matemáticas",
						grupo: grupoInvalido,
						profesor: "Juan Pérez",
						horario: [],
					});
				}).toThrow(/El formato del grupo .* no es válido/);
			});
		});

		it("debería rechazar grupos con formato inválido usando el setter", () => {
			const materia = new Materia();
			const gruposInvalidos = [
				"1C11", // Solo una letra en el medio
				"1CV", // No termina con dígitos
				"CV11", // No empieza con dígito
				"1A2B3", // Números mezclados con letras
			];

			gruposInvalidos.forEach((grupoInvalido) => {
				expect(() => {
					materia.grupo = grupoInvalido;
				}).toThrow(/El formato del grupo .* no es válido/);
			});
		});

		it("debería permitir grupos con formato válido", () => {
			const gruposValidos = ["1CV11", "2IM12", "123AB456", "1AB1"];

			gruposValidos.forEach((grupoValido) => {
				expect(() => {
					const materia = new Materia({
						nombre: "Matemáticas",
						grupo: grupoValido,
						profesor: "Juan Pérez",
						horario: [],
					});
					expect(materia.grupo).toBe(grupoValido);
				}).not.toThrow();
			});
		});

		it("debería permitir grupo vacío (sin validación)", () => {
			expect(() => {
				const materia = new Materia({
					nombre: "Matemáticas",
					grupo: "", // Grupo vacío debe permitirse
					profesor: "Juan Pérez",
					horario: [],
				});
				expect(materia.grupo).toBe("");
			}).not.toThrow();
		});
	});

	describe("Serialización y deserialización", () => {
		it("debería serializar y deserializar una materia individual correctamente", () => {
			// Crear una materia con datos completos
			const materiaOriginal = new Materia({
				nombre: "Programación Orientada a Objetos",
				grupo: "1CV11",
				profesor: "Dr. Juan Pérez González",
				horario: [
					{
						dia: Dia.Lunes,
						horaInicio: "08:00",
						horaFin: "10:00",
						minutoInicio: 480,
						minutoFin: 600,
					},
					{
						dia: Dia.Miércoles,
						horaInicio: "14:00",
						horaFin: "16:00",
						minutoInicio: 840,
						minutoFin: 960,
					},
				],
			});

			// Serializar a JSON string
			const materiaSerializada = JSON.stringify(materiaOriginal);
			expect(typeof materiaSerializada).toBe("string");

			// Parsear de vuelta a objeto
			const materiaParseada = JSON.parse(materiaSerializada);

			// Deserializar usando materiaFromDiccionario
			const materiaDeserializada = materiaFromDiccionario(materiaParseada);

			// Verificar que todas las propiedades se mantuvieron
			expect(materiaDeserializada.nombre).toBe(materiaOriginal.nombre);
			expect(materiaDeserializada.grupo).toBe(materiaOriginal.grupo);
			expect(materiaDeserializada.profesor).toBe(materiaOriginal.profesor);
			expect(materiaDeserializada.horario).toEqual(materiaOriginal.horario);

			// Verificar propiedades computadas
			expect(materiaDeserializada.id).toBe(materiaOriginal.id);
			expect(materiaDeserializada.turno).toBe(materiaOriginal.turno);
			expect(materiaDeserializada.abreviacionNombre).toBe(
				materiaOriginal.abreviacionNombre
			);
			expect(materiaDeserializada.estaVacia).toBe(materiaOriginal.estaVacia);
			expect(materiaDeserializada.hashNombre).toBe(materiaOriginal.hashNombre);
		});

		it("debería serializar y deserializar múltiples materias correctamente", () => {
			// Crear un array de materias con diferentes características
			const materiasOriginales = [
				new Materia({
					nombre: "Matemáticas Discretas",
					grupo: "1CV11",
					profesor: "Dra. Ana López",
					horario: [
						{
							dia: Dia.Martes,
							horaInicio: "10:00",
							horaFin: "12:00",
							minutoInicio: 600,
							minutoFin: 720,
						},
					],
				}),
				new Materia({
					nombre: "Base de Datos",
					grupo: "2IM12",
					profesor: "Ing. Carlos Mendoza",
					horario: [
						{
							dia: Dia.Jueves,
							horaInicio: "16:00",
							horaFin: "18:00",
							minutoInicio: 960,
							minutoFin: 1080,
						},
						{
							dia: Dia.Viernes,
							horaInicio: "08:00",
							horaFin: "10:00",
							minutoInicio: 480,
							minutoFin: 600,
						},
					],
				}),
				new Materia({
					nombre: "Algoritmos y Estructuras de Datos",
					grupo: "3IS13",
					profesor: "Dr. Roberto Silva",
					horario: [],
				}),
			];

			// Serializar a JSON string
			const materiasSerializadas = JSON.stringify(materiasOriginales);
			expect(typeof materiasSerializadas).toBe("string");

			// Parsear de vuelta a objeto
			const materiasParseadas = JSON.parse(materiasSerializadas);
			expect(Array.isArray(materiasParseadas)).toBe(true);
			expect(materiasParseadas).toHaveLength(3);

			// Deserializar usando materiasFromDiccionario
			const materiasDeserializadas = materiasFromDiccionario(materiasParseadas);

			// Verificar que el array tiene la misma longitud
			expect(materiasDeserializadas).toHaveLength(materiasOriginales.length);

			// Verificar cada materia individualmente
			materiasDeserializadas.forEach((materiaDeserializada, index) => {
				const materiaOriginal = materiasOriginales[index];

				expect(materiaDeserializada.nombre).toBe(materiaOriginal.nombre);
				expect(materiaDeserializada.grupo).toBe(materiaOriginal.grupo);
				expect(materiaDeserializada.profesor).toBe(materiaOriginal.profesor);
				expect(materiaDeserializada.horario).toEqual(materiaOriginal.horario);

				// Verificar propiedades computadas
				expect(materiaDeserializada.id).toBe(materiaOriginal.id);
				expect(materiaDeserializada.turno).toBe(materiaOriginal.turno);
				expect(materiaDeserializada.abreviacionNombre).toBe(
					materiaOriginal.abreviacionNombre
				);
				expect(materiaDeserializada.estaVacia).toBe(materiaOriginal.estaVacia);
			});
		});

		it("debería manejar materia vacía en serialización/deserialización", () => {
			// Crear una materia vacía
			const materiaVacia = new Materia();

			// Serializar
			const materiaSerializada = JSON.stringify(materiaVacia);
			const materiaParseada = JSON.parse(materiaSerializada);

			// Deserializar
			const materiaDeserializada = materiaFromDiccionario(materiaParseada);

			// Verificar que sigue siendo una materia vacía
			expect(materiaDeserializada.estaVacia).toBe(true);
			expect(materiaDeserializada.nombre).toBe("");
			expect(materiaDeserializada.grupo).toBe("");
			expect(materiaDeserializada.profesor).toBe("");
			expect(materiaDeserializada.horario).toEqual([]);
		});

		it("debería preservar validación de grupo en deserialización", () => {
			// Crear una materia válida
			const materiaValida = new Materia({
				nombre: "Test",
				grupo: "1CV11",
				profesor: "Profesor Test",
				horario: [],
			});

			// Serializar y deserializar
			const serializada = JSON.stringify(materiaValida);
			const parseada = JSON.parse(serializada);
			const deserializada = materiaFromDiccionario(parseada);

			// Debería funcionar sin problemas
			expect(deserializada.grupo).toBe("1CV11");

			// Intentar modificar a un grupo inválido después de deserializar
			expect(() => {
				deserializada.grupo = "1CV"; // Grupo inválido
			}).toThrow(/El formato del grupo .* no es válido/);
		});

		it("debería manejar casos edge en la serialización", () => {
			// Materia con caracteres especiales
			const materiaEspecial = new Materia({
				nombre: "Matemáticas Aplicadas á la Ingeniería",
				grupo: "1MX11",
				profesor: "Dr. José María Rodríguez-Hernández",
				horario: [
					{
						dia: Dia.Sábado,
						horaInicio: "07:30",
						horaFin: "09:30",
						minutoInicio: 450,
						minutoFin: 570,
					},
				],
			});

			// Serializar y deserializar
			const serializada = JSON.stringify(materiaEspecial);
			const parseada = JSON.parse(serializada);
			const deserializada = materiaFromDiccionario(parseada);

			// Verificar que los caracteres especiales se preservaron
			expect(deserializada.nombre).toBe(
				"Matemáticas Aplicadas á la Ingeniería"
			);
			expect(deserializada.profesor).toBe("Dr. José María Rodríguez-Hernández");
			expect(deserializada.abreviacionNombre).toBe(
				materiaEspecial.abreviacionNombre
			);
		});

		it("debería usar materiaFromJSON para deserializar una materia individual directamente desde JSON string", () => {
			// Crear una materia original
			const materiaOriginal = new Materia({
				nombre: "Programación Web",
				grupo: "2CV12",
				profesor: "Ing. María González",
				horario: [
					{
						dia: Dia.Martes,
						horaInicio: "14:00",
						horaFin: "16:00",
						minutoInicio: 840,
						minutoFin: 960,
					},
				],
			});

			// Serializar a JSON string
			const materiaJSON = JSON.stringify(materiaOriginal);

			// Deserializar directamente con materiaFromJSON
			const materiaDeserializada = materiaFromJSON(materiaJSON);

			// Verificar que todas las propiedades se mantuvieron
			expect(materiaDeserializada.nombre).toBe(materiaOriginal.nombre);
			expect(materiaDeserializada.grupo).toBe(materiaOriginal.grupo);
			expect(materiaDeserializada.profesor).toBe(materiaOriginal.profesor);
			expect(materiaDeserializada.horario).toEqual(materiaOriginal.horario);

			// Verificar propiedades computadas
			expect(materiaDeserializada.id).toBe(materiaOriginal.id);
			expect(materiaDeserializada.turno).toBe(materiaOriginal.turno);
			expect(materiaDeserializada.abreviacionNombre).toBe(
				materiaOriginal.abreviacionNombre
			);
		});

		it("debería usar materiasFromJSON para deserializar múltiples materias directamente desde JSON string", () => {
			// Crear un array de materias
			const materiasOriginales = [
				new Materia({
					nombre: "Redes de Computadoras",
					grupo: "1CV11",
					profesor: "Dr. Carlos López",
					horario: [
						{
							dia: Dia.Lunes,
							horaInicio: "08:00",
							horaFin: "10:00",
							minutoInicio: 480,
							minutoFin: 600,
						},
					],
				}),
				new Materia({
					nombre: "Ingeniería de Software",
					grupo: "2IM12",
					profesor: "Dra. Ana Martínez",
					horario: [
						{
							dia: Dia.Miércoles,
							horaInicio: "10:00",
							horaFin: "12:00",
							minutoInicio: 600,
							minutoFin: 720,
						},
						{
							dia: Dia.Viernes,
							horaInicio: "14:00",
							horaFin: "16:00",
							minutoInicio: 840,
							minutoFin: 960,
						},
					],
				}),
			];

			// Serializar el array completo
			const materiasJSON = JSON.stringify(materiasOriginales);

			// Deserializar directamente con materiasFromJSON
			const materiasDeserializadas = materiasFromJSON(materiasJSON);

			// Verificar que el array tiene la misma longitud
			expect(materiasDeserializadas).toHaveLength(materiasOriginales.length);

			// Verificar cada materia individualmente
			materiasDeserializadas.forEach((materiaDeserializada, index) => {
				const materiaOriginal = materiasOriginales[index];

				expect(materiaDeserializada.nombre).toBe(materiaOriginal.nombre);
				expect(materiaDeserializada.grupo).toBe(materiaOriginal.grupo);
				expect(materiaDeserializada.profesor).toBe(materiaOriginal.profesor);
				expect(materiaDeserializada.horario).toEqual(materiaOriginal.horario);

				// Verificar propiedades computadas
				expect(materiaDeserializada.id).toBe(materiaOriginal.id);
				expect(materiaDeserializada.turno).toBe(materiaOriginal.turno);
				expect(materiaDeserializada.abreviacionNombre).toBe(
					materiaOriginal.abreviacionNombre
				);
			});
		});

		it("debería manejar errores de JSON malformado en materiaFromJSON", () => {
			const jsonMalformado = '{"nombre": "Test", "grupo": "1CV11", invalid}';

			expect(() => {
				materiaFromJSON(jsonMalformado);
			}).toThrow();
		});

		it("debería manejar errores de JSON malformado en materiasFromJSON", () => {
			const jsonMalformado = '[{"nombre": "Test", "grupo": "1CV11"}, invalid]';

			expect(() => {
				materiasFromJSON(jsonMalformado);
			}).toThrow();
		});

		it("debería validar formato de grupo al usar materiaFromJSON", () => {
			// JSON con grupo válido
			const jsonValido = JSON.stringify({
				_nombre: "Test",
				_grupo: "1CV11",
				profesor: "Test Prof",
				horario: [],
			});

			expect(() => {
				const materia = materiaFromJSON(jsonValido);
				expect(materia.grupo).toBe("1CV11");
			}).not.toThrow();

			// JSON con grupo inválido
			const jsonInvalido = JSON.stringify({
				_nombre: "Test",
				_grupo: "1CV", // Grupo inválido
				profesor: "Test Prof",
				horario: [],
			});

			expect(() => {
				materiaFromJSON(jsonInvalido);
			}).toThrow(/El formato del grupo .* no es válido/);
		});

		it("debería combinar perfectamente stringify con materiaFromJSON y materiasFromJSON", () => {
			// Test del ciclo completo: Materia -> JSON string -> Materia
			const materiaOriginal = new Materia({
				nombre: "Sistemas Operativos",
				grupo: "3IS13",
				profesor: "Dr. Roberto Silva",
				horario: [
					{
						dia: Dia.Jueves,
						horaInicio: "16:00",
						horaFin: "18:00",
						minutoInicio: 960,
						minutoFin: 1080,
					},
				],
			});

			// Ciclo completo individual
			const materiaJSON = JSON.stringify(materiaOriginal);
			const materiaRecuperada = materiaFromJSON(materiaJSON);

			expect(materiaRecuperada.nombre).toBe(materiaOriginal.nombre);
			expect(materiaRecuperada.grupo).toBe(materiaOriginal.grupo);
			expect(materiaRecuperada.profesor).toBe(materiaOriginal.profesor);
			expect(materiaRecuperada.horario).toEqual(materiaOriginal.horario);

			// Test del ciclo completo: Materia[] -> JSON string -> Materia[]
			const materiasOriginales = [materiaOriginal, new Materia()];
			const materiasJSON = JSON.stringify(materiasOriginales);
			const materiasRecuperadas = materiasFromJSON(materiasJSON);

			expect(materiasRecuperadas).toHaveLength(2);
			expect(materiasRecuperadas[0].nombre).toBe(materiaOriginal.nombre);
			expect(materiasRecuperadas[1].estaVacia).toBe(true);
		});
	});
});

describe("BaseDatosMaterias", () => {
	let bd: BaseDatosMaterias;
	let materias: Materia[];

	beforeEach(() => {
		materias = [
			new Materia({
				nombre: "Matemáticas",
				grupo: "1CV1",
				profesor: "Juan Pérez",
				horario: [
					{
						dia: Dia.Lunes,
						horaInicio: "08:00",
						horaFin: "10:00",
						minutoInicio: undefined,
						minutoFin: undefined,
					},
				],
			}),
			new Materia({
				nombre: "Física",
				grupo: "1CV2",
				profesor: "María García",
				horario: [
					{
						dia: Dia.Martes,
						horaInicio: "10:00",
						horaFin: "12:00",
						minutoInicio: undefined,
						minutoFin: undefined,
					},
				],
			}),
			new Materia({
				nombre: "Química",
				grupo: "1CV1",
				profesor: "Juan Pérez",
				horario: [
					{
						dia: Dia.Miércoles,
						horaInicio: "14:00",
						horaFin: "16:00",
						minutoInicio: undefined,
						minutoFin: undefined,
					},
				],
			}),
		];
		bd = new BaseDatosMaterias(materias);
	});

	describe("Operaciones básicas", () => {
		it("debería obtener todas las materias", () => {
			const todas = bd.obtenerTodas();
			expect(todas).toHaveLength(3);
			expect(todas).not.toBe(materias); // Debe ser una copia
		});

		it("debería agregar una materia", () => {
			const nuevaMateria = new Materia({
				nombre: "Biología",
				grupo: "1CV3",
				profesor: "Ana López",
				horario: [],
			});

			bd.agregar(nuevaMateria);
			expect(bd.contar()).toBe(4);
			expect(bd.buscarPorId(nuevaMateria.id)).toBe(nuevaMateria);
		});

		it("debería agregar múltiples materias", () => {
			const nuevasMaterias = [
				new Materia({
					nombre: "Historia",
					grupo: "1CV4",
					profesor: "Carlos Ruiz",
					horario: [],
				}),
				new Materia({
					nombre: "Literatura",
					grupo: "1CV5",
					profesor: "Elena Martín",
					horario: [],
				}),
			];

			bd.agregarVarias(nuevasMaterias);
			expect(bd.contar()).toBe(5);
		});

		it("debería eliminar materia por ID", () => {
			const materiaAEliminar = materias[0];
			const eliminada = bd.eliminarPorId(materiaAEliminar.id);

			expect(eliminada).toBe(true);
			expect(bd.contar()).toBe(2);
			expect(bd.buscarPorId(materiaAEliminar.id)).toBeUndefined();
		});

		it("debería retornar false al eliminar materia inexistente", () => {
			const eliminada = bd.eliminarPorId("id-inexistente");
			expect(eliminada).toBe(false);
			expect(bd.contar()).toBe(3);
		});

		it("debería limpiar todas las materias", () => {
			bd.limpiar();
			expect(bd.contar()).toBe(0);
			expect(bd.obtenerTodas()).toEqual([]);
		});
	});

	describe("Filtros", () => {
		it("debería filtrar por profesor", () => {
			const materiasJuan = bd.filtrarPorProfesor("Juan Pérez");
			expect(materiasJuan).toHaveLength(2);
			expect(materiasJuan.every((m) => m.profesor === "Juan Pérez")).toBe(true);
		});

		it("debería filtrar por profesor parcial", () => {
			const materiasJuan = bd.filtrarPorProfesorParcial("Juan");
			expect(materiasJuan).toHaveLength(2);
		});

		it("debería filtrar por nombre", () => {
			const matematicas = bd.filtrarPorNombre("Matemáticas");
			expect(matematicas).toHaveLength(1);
			expect(matematicas[0].nombre).toBe("Matemáticas");
		});

		it("debería filtrar por grupo", () => {
			const grupo1CV1 = bd.filtrarPorGrupo("1CV1");
			expect(grupo1CV1).toHaveLength(2);
			expect(grupo1CV1.every((m) => m.grupo === "1CV1")).toBe(true);
		});

		it("debería filtrar por día", () => {
			const lunes = bd.filtrarPorDia(Dia.Lunes);
			expect(lunes).toHaveLength(1);
			expect(lunes[0].nombre).toBe("Matemáticas");
		});
	});

	describe("Búsquedas", () => {
		it("debería buscar por ID", () => {
			const materia = materias[0];
			const encontrada = bd.buscarPorId(materia.id);
			expect(encontrada).toBe(materia);
		});

		it("debería buscar por nombre y grupo", () => {
			const encontrada = bd.buscarPorNombreYGrupo("Matemáticas", "1CV1");
			expect(encontrada?.nombre).toBe("Matemáticas");
			expect(encontrada?.grupo).toBe("1CV1");
		});

		it("debería verificar existencia", () => {
			const materia = materias[0];
			expect(bd.existe(materia.id)).toBe(true);
			expect(bd.existe("id-inexistente")).toBe(false);
		});
	});

	describe("Agrupaciones", () => {
		it("debería agrupar por profesor", () => {
			const grupos = bd.agruparPorProfesor();
			expect(grupos.size).toBe(2);
			expect(grupos.get("Juan Pérez")).toHaveLength(2);
			expect(grupos.get("María García")).toHaveLength(1);
		});

		it("debería agrupar por grupo", () => {
			const grupos = bd.agruparPorGrupo();
			expect(grupos.size).toBe(2);
			expect(grupos.get("1CV1")).toHaveLength(2);
			expect(grupos.get("1CV2")).toHaveLength(1);
		});
	});

	describe("Estadísticas", () => {
		it("debería obtener profesores únicos", () => {
			const profesores = bd.obtenerProfesoresUnicos();
			expect(profesores).toEqual(["Juan Pérez", "María García"]);
		});

		it("debería obtener nombres únicos", () => {
			const nombres = bd.obtenerNombresUnicos();
			expect(nombres).toEqual(["Física", "Matemáticas", "Química"]);
		});

		it("debería obtener grupos únicos", () => {
			const grupos = bd.obtenerGruposUnicos();
			expect(grupos).toEqual(["1CV1", "1CV2"]);
		});

		it("debería contar por profesor", () => {
			const conteos = bd.contarPorProfesor();
			expect(conteos.get("Juan Pérez")).toBe(2);
			expect(conteos.get("María García")).toBe(1);
		});
	});

	describe("Ordenamiento", () => {
		it("debería ordenar por nombre ascendente", () => {
			const ordenadas = bd.ordenarPorNombre();
			expect(ordenadas[0].nombre).toBe("Física");
			expect(ordenadas[1].nombre).toBe("Matemáticas");
			expect(ordenadas[2].nombre).toBe("Química");
		});

		it("debería ordenar por nombre descendente", () => {
			const ordenadas = bd.ordenarPorNombre(false);
			expect(ordenadas[0].nombre).toBe("Química");
			expect(ordenadas[1].nombre).toBe("Matemáticas");
			expect(ordenadas[2].nombre).toBe("Física");
		});
	});
});

describe("Funciones de utilidad", () => {
	it("debería crear base de datos de materias", () => {
		const materias = [new Materia()];
		const bd = crearBaseDatosMaterias(materias);
		expect(bd).toBeInstanceOf(BaseDatosMaterias);
		expect(bd.contar()).toBe(1);
	});
});
