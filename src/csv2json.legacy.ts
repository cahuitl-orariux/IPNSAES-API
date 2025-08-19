import Papa from "papaparse";
import fs from "fs";
import { Clase, Dia, Materia } from "./Materias";

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

const csvColumnHandler: Record<
	string,
	(materia: Materia, element: string) => void
> = {
	Grupo: (materia: Materia, element: string) => {
		materia.grupo = element;
	},
	Materia: (materia: Materia, element: string) => {
		materia.nombre = element;
	},
	Profesor: (materia: Materia, element: string) => {
		materia.profesor = element;
	},
	Lun: (materia: Materia, element: string) => {
		let clase = claseHandler(element, Dia.Lunes);
		if (clase === null) return;
		materia.horario.push(clase);
	},
	Mar: (materia: Materia, element: string) => {
		let clase = claseHandler(element, Dia.Martes);
		if (clase === null) return;
		materia.horario.push(clase);
	},
	Mié: (materia: Materia, element: string) => {
		let clase = claseHandler(element, Dia.Miércoles);
		if (clase === null) return;
		materia.horario.push(clase);
	},
	Jue: (materia: Materia, element: string) => {
		let clase = claseHandler(element, Dia.Jueves);
		if (clase === null) return;
		materia.horario.push(clase);
	},
	Vie: (materia: Materia, element: string) => {
		let clase = claseHandler(element, Dia.Viernes);
		if (clase === null) return;
		materia.horario.push(clase);
	},
};

const main = () => {
	// Argumentos de entrada
	if (process.argv.length < 3) {
		console.log("Uso: pnpm run csv2json ciclo_escolar");
		console.log("Ejemplo: pnpm run csv2json 2019-1");
		process.exit(1);
	}
	const ciclo_escolar = process.argv[2];

	const inputFileName = "src/data/csv/" + ciclo_escolar + ".csv";
	const outputFileName = "static/data/json/" + ciclo_escolar + ".json";

	// Preparación de datos
	const todasLasMaterias: Materia[] = [];
	const inputFileString = fs.readFileSync(inputFileName, "utf8");
	let csvData = Papa.parse(inputFileString, {
		header: true,
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

	// Guardar datos
	fs.mkdirSync(outputFileName.substring(0, outputFileName.lastIndexOf("/")), {
		recursive: true,
	});
	fs.writeFileSync(outputFileName, JSON.stringify(todasLasMaterias));
};

main();
