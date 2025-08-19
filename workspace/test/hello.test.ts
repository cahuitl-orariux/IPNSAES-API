import { describe, it, expect } from "vitest";
import { eliminarDiacriticos } from "../../src/Materias";

describe("Funciones de utilidad", () => {
	describe("eliminarDiacriticos", () => {
		it("debería eliminar acentos de las vocales", () => {
			expect(eliminarDiacriticos("áéíóú")).toBe("aeiou");
			expect(eliminarDiacriticos("ÁÉÍÓÚ")).toBe("AEIOU");
		});

		it("debería eliminar la ñ y otros diacríticos", () => {
			expect(eliminarDiacriticos("niño")).toBe("nino");
			expect(eliminarDiacriticos("NIÑO")).toBe("NINO");
		});

		it("debería mantener caracteres sin diacríticos", () => {
			expect(eliminarDiacriticos("hola mundo")).toBe("hola mundo");
			expect(eliminarDiacriticos("123abc")).toBe("123abc");
		});

		it("debería manejar cadenas vacías", () => {
			expect(eliminarDiacriticos("")).toBe("");
		});

		it("debería procesar nombres de materias correctamente", () => {
			expect(eliminarDiacriticos("Matemáticas Avanzadas")).toBe(
				"Matematicas Avanzadas"
			);
			expect(eliminarDiacriticos("Física Cuántica")).toBe("Fisica Cuantica");
			expect(eliminarDiacriticos("Diseño de Algoritmos")).toBe(
				"Diseno de Algoritmos"
			);
		});
	});
});
