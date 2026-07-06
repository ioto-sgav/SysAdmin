import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const http = axios.create({ baseURL: API });

export const api = {
  // Generic
  list: (resource) => http.get(`/${resource}`).then(r => r.data),
  get: (resource, id) => http.get(`/${resource}/${id}`).then(r => r.data),
  create: (resource, data) => http.post(`/${resource}`, data).then(r => r.data),
  update: (resource, id, data) => http.put(`/${resource}/${id}`, data).then(r => r.data),
  remove: (resource, id) => http.delete(`/${resource}/${id}`).then(r => r.data),

  // Specific
  dashboard: () => http.get("/dashboard").then(r => r.data),
  systemContacts: (systemId) => http.get(`/systems/${systemId}/contacts`).then(r => r.data),
  systemTasks: (systemId) => http.get(`/systems/${systemId}/tasks`).then(r => r.data),
  systemLog: (systemId) => http.get(`/systems/${systemId}/log_entries`).then(r => r.data),
  orgSystems: (orgId) => http.get(`/organizations/${orgId}/systems`).then(r => r.data),
  orgContacts: (orgId) => http.get(`/organizations/${orgId}/contacts`).then(r => r.data),
};

// Constants shared across UI
export const SYSTEM_STATUSES = ["Aktiv", "Under udfasning", "Lukket", "På vej ind"];
export const KRITIKALITET = ["Lav", "Middel", "Høj", "Kritisk"];
export const ORG_TYPES = [
  "Intern fagkontor",
  "Intern it-enhed",
  "Ekstern leverandør",
  "Driftsleverandør",
  "Konsulenthus",
  "Anden myndighed",
  "Intern projektorganisation",
  "Ukendt/andet",
];
export const KONTAKTTYPER = [
  "Leverandørkontakt",
  "Intern interessent",
  "Intern vidensperson",
  "Anden kontakt",
];
export const ROLLER = [
  "Teknisk kontakt",
  "Projektleder",
  "Tidligere projektleder",
  "Projektdeltager",
  "Faglig superbruger",
  "Supportkontakt",
  "Kontraktkontakt",
  "Sikkerhedskontakt",
  "GDPR-/databeskyttelseskontakt",
  "Driftskontakt",
  "Historisk vidensperson",
  "Chef/ejer",
  "Andet",
];
export const SC_STATUS = ["Aktiv", "Historisk", "Usikker"];
export const TASK_STATUS = ["Ikke startet", "I gang", "Afventer", "Færdig"];
export const TASK_PRIORITET = ["Lav", "Normal", "Høj", "Kritisk"];
export const LOG_TYPER = ["Møde", "Beslutning", "Observation", "Status", "Leverandørdialog", "Risiko", "Andet"];
export const LOG_EMNER = ["Drift", "Leverandør", "Arkitektur", "Sikkerhed", "Data/GDPR", "Økonomi", "Brugere/fagområde", "Kontrakt/aftale", "Andet"];
