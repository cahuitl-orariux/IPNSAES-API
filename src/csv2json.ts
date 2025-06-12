import { Clase, Dia, Materia } from "./Materias";
import Papa from "papaparse";

/**
 *
 * @param horario string de la forma HH:mm-HH:mm
 * @returns [HH:mm, HH:mm]
 */
const deestructurarHora = (horario: string) => {
	if (!horario) return [null, null];
	let match = horario.match(/^(\d{2}:\d{2})-(\d{2}:\d{2})$/);
	if (match === null) {
		return [null, null];
	}

	let horaInicio = match[1];
	let horaFin = match[2];

	return [horaInicio, horaFin];
};

const claseHandler = (element: string, dia: Dia) => {
	let clase = {} as Clase;
	clase.dia = dia;

	let [horaInicio, horaFin] = deestructurarHora(element);
	if (horaInicio === null || horaFin === null) return null;

	clase.horaInicio = horaInicio;
	clase.horaFin = horaFin;

	return clase;
};

const mapeoEncabezadosSaesMateria: Record<string, string> = {
	Asignatura: "nombre",
	Profesor: "profesor",
	Grupo: "grupo",
	Edificio: "edificio",
	Salón: "salon",
	Lun: "lunes",
	Mar: "martes",
	Mie: "miercoles",
	Jue: "jueves",
	Vie: "viernes",
	Sab: "sabado",
};

const csvColumnHandler: Record<
	string,
	(materia: Materia, element: string) => void
> = {
	grupo: (materia: Materia, element: string) => {
		materia.grupo = element;
	},
	nombre: (materia: Materia, element: string) => {
		materia.nombre = element;
	},
	profesor: (materia: Materia, element: string) => {
		materia.profesor = element;
	},
	lunes: (materia: Materia, element: string) => {
		let clase = claseHandler(element, Dia.Lunes);
		if (clase === null) return;
		materia.horario.push(clase);
	},
	martes: (materia: Materia, element: string) => {
		let clase = claseHandler(element, Dia.Martes);
		if (clase === null) return;
		materia.horario.push(clase);
	},
	miercoles: (materia: Materia, element: string) => {
		let clase = claseHandler(element, Dia.Miércoles);
		if (clase === null) return;
		materia.horario.push(clase);
	},
	jueves: (materia: Materia, element: string) => {
		let clase = claseHandler(element, Dia.Jueves);
		if (clase === null) return;
		materia.horario.push(clase);
	},
	viernes: (materia: Materia, element: string) => {
		let clase = claseHandler(element, Dia.Viernes);
		if (clase === null) return;
		materia.horario.push(clase);
	},
};

export const csv2json = (
	csvString: string,
	{ preprocesarHorarios, delimiter } = {
		preprocesarHorarios: true,
		delimiter: ",",
	}
) => {
	// Preparación de datos
	const todasLasMaterias: Materia[] = [];

	if (preprocesarHorarios) {
		const filasCsv = csvString.split("\n");
		const encabezados = filasCsv[0].split(delimiter);
		const encabezadosProcesados = encabezados.map((encabezado) => {
			return mapeoEncabezadosSaesMateria[encabezado];
		});
		let horariosCsv = filasCsv.slice(1).join("\n");
		csvString = encabezadosProcesados.join(delimiter) + "\n" + horariosCsv;
	}

	let csvData = Papa.parse(csvString, {
		header: true,
		delimiter,
	});

	if (csvData.data.length === 0) {
		console.log("No hay datos");
		process.exit(1);
	}
	if (!csvData.meta.fields) {
		console.log("No hay campos");
		process.exit(1);
	}

	for (let i = 0; i < csvData.data.length; i++) {
		const element = csvData.data[i] as Record<string, string>;
		let materia = new Materia();
		materia.horario = [];

		csvData.meta.fields.forEach((column) => {
			let columnHandler = csvColumnHandler[column];
			if (columnHandler === undefined) return;
			if (element[column] === undefined) return;

			columnHandler(materia, element[column] as string);
		});

		if (materia.estaVacia) continue;

		todasLasMaterias.push(materia);
	}

	return todasLasMaterias;
};
