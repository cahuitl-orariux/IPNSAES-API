export enum Dia {
	Lunes,
	Martes,
	Miércoles,
	Jueves,
	Viernes,
	Sábado,
}

export const HORA_REGEX = /(\d{2}):(\d{2})/;

export type Clase = {
	dia: Dia;
	/**
	 * Formato: HH:mm
	 */
	horaInicio: string;
	/**
	 * Formato: HH:mm
	 */
	horaFin: string;
	/**
	 * Hora inicio del evento en minutos desde el inicio del día.
	 * Para fines de comparación.
	 *
	 */
	minutoInicio: number | undefined;
	/**
	 * Hora fin del evento en minutos desde el inicio del día.
	 * Para fines de comparación.
	 *
	 */
	minutoFin: number | undefined;
};

export function eliminarDiacriticos(texto: string) {
	return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export type MateriaOptions = {
	nombre: string;
	grupo: string;
	profesor: string;
	horario: Clase[];
};

export class Materia {
	private _abreviacionNombre: string = '';
	private _nombre: string = '';
	grupo: string = '';
	profesor: string = '';
	horario: Clase[] = [];

	constructor(options?: MateriaOptions) {
		if (options) {
			this.nombre = options.nombre ?? '';
			this.grupo = options.grupo ?? '';
			this.profesor = options.profesor ?? '';
			this.horario = options.horario ?? [];
		}
	}

	get id() {
		return `${this.grupo}-${this.nombre}-${this.profesor}`;
	}

	get nombre() {
		return this._nombre;
	}

	set nombre(nombre: string) {
		this._nombre = nombre;
		this._abreviacionNombre = '';
	}

	get abreviacionNombre() {
		if (this._abreviacionNombre !== '') {
			return this._abreviacionNombre;
		}

		if (!this._nombre) {
			return '';
		}
		let abreviacion = '';
		let palabras = this._nombre.split(' ');

		const filtro = [
			'de',
			'los',
			'las',
			'la',
			'el',
			'y',
			'a',
			'con',
			'en',
			'del',
			'para',
			'por',
			'al',
			'lo',
			'un',
			'una',
			'unos',
			'unas',
			'o',
			'e',
			'ante',
			'bajo',
			'cabe',
			'contra',
			'de',
			'desde',
			'durante',
			'en',
			'entre',
			'hacia',
			'hasta',
			'mediante',
			'para',
			'por',
			'según',
			'sin',
			'so',
			'sobre',
			'tras',
			'versus',
			'vía',
		];

		palabras = palabras.filter(
			(palabra) => !filtro.includes(palabra.toLowerCase())
		);

		for (const element of palabras) {
			abreviacion += element[0];
		}

		this._abreviacionNombre = abreviacion.toUpperCase();

		this._abreviacionNombre = eliminarDiacriticos(this._abreviacionNombre);

		return this._abreviacionNombre;
	}

	get estaVacia() {
		if (this.abreviacionNombre === '') return true;
		if (this.horario.length === 0) return true;
		if (this.grupo === '') return true;
		if (this.nombre === '') return true;
		if (this.profesor === '') return true;
		return false;
	}

	get hashNombre() {
		return Math.abs(
			(this.nombre as string).split('').reduce((hash, char) => {
				return char.charCodeAt(0) + (hash << 6) + (hash << 16) - hash;
			}, 0)
		);
	}

	toString() {
		return JSON.stringify(this);
	}
}

export const materiaFromJSON = (json: string) => {
	let materiaJson = JSON.parse(json);
	return new Materia({
		nombre: materiaJson._nombre,
		grupo: materiaJson.grupo,
		profesor: materiaJson.profesor,
		horario: materiaJson.horario,
	});
};

export const materiasFromJSON = (json: string) => {
	let materiaJson = JSON.parse(json);
	let materias: Materia[] = [];
	for (const materia of materiaJson) {
		materias.push(
			new Materia({
				nombre: materia._nombre,
				grupo: materia.grupo,
				profesor: materia.profesor,
				horario: materia.horario,
			})
		);
	}
	return materias;
};

export const materiaFromDiccionario = (materia: any) => {
	return new Materia({
		nombre: materia._nombre,
		grupo: materia.grupo,
		profesor: materia.profesor,
		horario: materia.horario,
	});
};

export const materiasFromDiccionario = (materiasRaw: any[]) => {
	let materias: Materia[] = [];
	for (const materia of materiasRaw) {
		materias.push(
			new Materia({
				nombre: materia._nombre,
				grupo: materia.grupo,
				profesor: materia.profesor,
				horario: materia.horario,
			})
		);
	}
	return materias;
};
