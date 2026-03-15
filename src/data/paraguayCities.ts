/**
 * Paraguay cities organized by department
 * Used for city autocomplete in manual address entry
 */

export const PARAGUAY_CITIES: string[] = [
  // Central
  "Asunción",
  "San Lorenzo",
  "Luque",
  "Fernando de la Mora",
  "Lambaré",
  "Capiatá",
  "Limpio",
  "Ñemby",
  "Mariano Roque Alonso",
  "San Antonio",
  "Villa Elisa",
  "Itauguá",
  "Areguá",
  "Ypacaraí",
  "Ypané",
  "Guarambaré",
  "J. Augusto Saldívar",
  "Villeta",
  "Itá",
  "Yaguarón",
  "Nueva Italia",

  // Alto Paraná
  "Ciudad del Este",
  "Hernandarias",
  "Presidente Franco",
  "Minga Guazú",
  "Santa Rita",
  "San Alberto",
  "Itakyry",
  "Juan León Mallorquín",

  // Itapúa
  "Encarnación",
  "Hohenau",
  "Obligado",
  "Bella Vista",
  "Capitán Miranda",
  "Cambyretá",
  "Fram",
  "Trinidad",
  "Jesús",
  "Pirapó",
  "Natalio",

  // Caaguazú
  "Coronel Oviedo",
  "Caaguazú",
  "Dr. Juan Manuel Frutos",
  "Carayaó",
  "San José de los Arroyos",

  // San Pedro
  "San Pedro del Ycuamandyyú",
  "San Estanislao",
  "Santa Rosa del Aguaray",
  "Choré",
  "25 de Diciembre",

  // Concepción
  "Concepción",
  "Horqueta",
  "Belén",
  "Loreto",

  // Amambay
  "Pedro Juan Caballero",
  "Capitán Bado",
  "Bella Vista Norte",

  // Guairá
  "Villarrica",
  "Iturbe",
  "Independencia",
  "Paso Yobái",

  // Cordillera
  "Caacupé",
  "Tobatí",
  "Piribebuy",
  "Eusebio Ayala",
  "Atyrá",
  "Altos",
  "Emboscada",
  "Arroyos y Esteros",
  "San Bernardino",
  "Isla Pucú",

  // Paraguarí
  "Paraguarí",
  "Carapeguá",
  "Quiindy",
  "Yaguarón",
  "La Colmena",
  "Acahay",
  "Ybycuí",

  // Misiones
  "San Juan Bautista",
  "Ayolas",
  "San Ignacio",
  "Santiago",
  "Santa Rosa",
  "San Patricio",

  // Ñeembucú
  "Pilar",
  "Alberdi",
  "Humaitá",

  // Canindeyú
  "Salto del Guairá",
  "Curuguaty",
  "Katueté",
  "La Paloma",

  // Presidente Hayes (Chaco)
  "Villa Hayes",
  "Benjamín Aceval",
  "Pozo Colorado",

  // Boquerón (Chaco)
  "Filadelfia",
  "Loma Plata",
  "Neuland",

  // Alto Paraguay
  "Fuerte Olimpo",
  "Puerto Casado",
];

/**
 * Cities in the Gran Asunción metropolitan area.
 * Delivery is free for these cities.
 */
export const GRAN_ASUNCION_CITIES: string[] = [
  "Asunción",
  "San Lorenzo",
  "Luque",
  "Fernando de la Mora",
  "Lambaré",
  "Capiatá",
  "Limpio",
  "Ñemby",
  "Mariano Roque Alonso",
  "San Antonio",
  "Villa Elisa",
  "Itauguá",
  "Areguá",
  "Ypané",
  "Guarambaré",
  "J. Augusto Saldívar",
  "Nueva Italia",
  "Villeta",
];

const normalizeStr = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

/** Returns true if the given city/location string belongs to Gran Asunción. */
export const isGranAsuncion = (cityOrLocation: string): boolean => {
  const n = normalizeStr(cityOrLocation);
  return GRAN_ASUNCION_CITIES.some((c) => normalizeStr(c) === n || n.includes(normalizeStr(c)));
};
