import { csv2json } from "../src/csv2json";

const csvString = `
Asignatura,Profesor,Grupo,Edificio,Salón,Lun,Mar,Mie,Jue,Vie,Sab
"Matemáticas III","José Luis López","1","2","3",9:00-10:00,10:00-11:00,11:00-12:00,12:00-13:00,13:00-14:00,14:00-15:00
"Matemáticas IV","José Luis López","1","2","3",9:00-10:00,10:00-11:00,11:00-12:00,12:00-13:00,13:00-14:00,14:00-15:00
"Matemáticas I","José Luis López","1","2","3",9:00-10:00,10:00-11:00,11:00-12:00,12:00-13:00,13:00-14:00,14:00-15:00
`;

const result = csv2json(csvString);