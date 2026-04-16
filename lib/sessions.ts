import type { Session } from "./types"

export const SESSIONS: Session[] = [
  // ── MIDNIGHT ──────────────────────────────────────────────────
  { id: "x1", type: "break", title: "🌙 Late Night Hacking", start: "00:00", end: "01:00", speaker: null, track: "main" },
  { id: "x2", type: "lightning", title: "Debugging at 1am: a love story", start: "01:00", end: "01:10", speaker: { name: "Night Owl Dev", role: "Senior Insomniac" }, track: "main" },
  { id: "x3", type: "break", title: "😴 Sleep (recommended)", start: "01:10", end: "07:00", speaker: null, track: "main" },

  // ── EARLY MORNING ─────────────────────────────────────────────
  { id: "x4", type: "break", title: "☀️ Buenos días, Madrid", start: "07:00", end: "07:30", speaker: null, track: "main" },
  { id: "x5", type: "lightning", title: "Why I wake up at 6am to write TypeScript", start: "07:30", end: "07:40", speaker: { name: "Early Bird", role: "Morning Dev" }, track: "main" },
  { id: "x6", type: "talk", title: "The perfect dev environment setup in 2026", start: "07:40", end: "08:10", speaker: { name: "Dot Files Guy", role: "Config Artisan" }, track: "main" },
  { id: "x7", type: "break", title: "🚶 Walk to La Nave", start: "08:10", end: "08:45", speaker: null, track: "main" },

  // ── OFFICIAL PROGRAM (real sessions) ──────────────────────────
  { id: "s1", type: "break", title: "☕ Café y Churros de Bienvenida", start: "08:45", end: "09:30", speaker: null, track: "main" },
  { id: "s2", type: "talk", title: "Inicio Evento", start: "09:30", end: "09:40", speaker: { name: "Miguel Ángel Durán", role: "Presentador" }, track: "main" },
  { id: "s3", type: "talk", title: "Retro JavaScript: rehaciendo el pasado con código moderno", start: "09:40", end: "10:20", speaker: { name: "Carmen Ansio", role: "Designer Engineer @ Stripe" }, track: "main" },
  { id: "s4", type: "talk", title: "Programando como Rambo: del Vietnam de los frameworks a la web nativa", start: "10:20", end: "11:00", speaker: { name: "Jaime Gómez-Obregón", role: "Ingeniero y activista" }, track: "main" },
  { id: "s5", type: "lightning", title: "Pair Programming con un Agente: Cómo construí un RPG complejo sin perder la cabeza", start: "11:00", end: "11:10", speaker: { name: "Jorge del Casar", role: "Head of Tech @ ActioGlobal" }, track: "main" },
  { id: "s6", type: "break", title: "☕ Pausa de Café", start: "11:10", end: "11:40", speaker: null, track: "main" },
  { id: "s7", type: "talk", title: "Inicio Bloque + Sorteos", start: "11:40", end: "11:45", speaker: { name: "Miguel Ángel Durán", role: "Presentador" }, track: "main" },
  { id: "s8", type: "talk", title: "Programar en 2026: the human-in-the-loop", start: "11:45", end: "12:30", speaker: { name: "Javi Velasco", role: "Staff Software Engineer @ Vercel" }, track: "main" },
  { id: "s9", type: "talk", title: "Code Mode: let the code do the talking", start: "12:30", end: "13:00", speaker: { name: "Sunil Pai", role: "Principal Systems Engineer @ Cloudflare" }, track: "main", lang: "EN" },
  { id: "s10", type: "talk", title: "JavaScript en la era de los agentes: del código al Agentic DevOps", start: "13:00", end: "13:35", speaker: { name: "Gisela Torres", role: "Sr. Global Blackbelt @ Microsoft" }, track: "main" },
  { id: "s11", type: "break", title: "🎉 Sorteos y avisos", start: "13:35", end: "13:45", speaker: null, track: "main" },
  { id: "s12", type: "break", title: "🌮 ¡A comer!", start: "13:45", end: "15:00", speaker: null, track: "main" },
  { id: "s13", type: "talk", title: "Node.js por dentro: entendiendo el runtime en producción", start: "15:05", end: "15:30", speaker: { name: "Estefany Aguilar", role: "Developer Relations @ NodeSource" }, track: "main" },
  { id: "s14", type: "lightning", title: "React Compiler: el fin de los renders innecesarios", start: "15:30", end: "15:40", speaker: { name: "Ilda Neta", role: "Mobile Software Engineer @ RockTheSport" }, track: "main" },
  { id: "s15", type: "lightning", title: "Accesibilidad web: Guía para un apocalipsis zombie", start: "15:40", end: "15:50", speaker: { name: "Mia Salazar", role: "Front-end Developer @ Service Club" }, track: "main" },
  { id: "s16", type: "lightning", title: "Soluciones de IA: Lecciones y aprendizajes", start: "15:50", end: "16:00", speaker: { name: "Anna Vía", role: "Head of AI @ InfoJobs" }, track: "main" },
  { id: "s17", type: "break", title: "☕ Pausa de Café", start: "16:00", end: "16:30", speaker: null, track: "main" },
  { id: "s18", type: "talk", title: "Framework Fatigue: ¿cómo elegir (y abandonar) un framework?", start: "16:40", end: "17:20", speaker: { name: "Fernando Herrera", role: "Full Stack Educator @ DevTalles" }, track: "main" },
  { id: "s19", type: "talk", title: "Web AI Más Allá del Chat: Algoritmos Genéticos, RL y Transformers.js en el Edge", start: "17:20", end: "18:00", speaker: { name: "Erick Wendel", role: "Creador de Contenido y Emprendedor" }, track: "main" },
  { id: "s20", type: "break", title: "👋 Despedida + 🍹 Cóctel de Networking", start: "18:00", end: "20:00", speaker: null, track: "main" },

  // ── WORKSHOPS (parallel, real sessions) ───────────────────────
  { id: "w1", type: "workshop", title: "De Vibe Coding a Software Engineering con IA: Arquitectura de Agentes", start: "09:00", end: "13:00", speaker: { name: "Alan Buscaglia", role: "Software Architect @ Prowler" }, track: "workshop" },
  { id: "w2", type: "workshop", title: "Astro y Headless CMS: La combinación perfecta", start: "09:00", end: "13:00", speaker: { name: "Braulio Díez", role: "Technical Lead @ Lemoncode" }, track: "workshop" },
  { id: "w3", type: "workshop", title: "Live coding: app full stack sin salir del editor con Windsurf AI", start: "09:00", end: "13:00", speaker: { name: "Erasmo Hernandez", role: "Tech Lead @ Globant" }, track: "workshop" },
  { id: "w4", type: "workshop", title: "Refactoring & Testing", start: "09:00", end: "13:00", speaker: { name: "Carlos Blé & Jorge Aguiar", role: "Lean Mind" }, track: "workshop" },
  { id: "w5", type: "workshop", title: "Construyendo el Futuro con Cloudflare Workers & AI", start: "09:00", end: "13:00", speaker: { name: "Confidence Okoghenun", role: "Senior Developer Advocate @ Cloudflare" }, track: "workshop", lang: "EN" },

  // ── AFTERNOON BONUS ───────────────────────────────────────────
  { id: "a1", type: "workshop", title: "Hackathon: Build something with v0 + PartyKit", start: "14:00", end: "18:00", speaker: { name: "Tú", role: "Hackathon Participant" }, track: "workshop" },
  { id: "a2", type: "talk", title: "Open Source: cómo contribuir sin morir en el intento", start: "15:00", end: "15:45", speaker: { name: "Contributor Max", role: "OSS Maintainer" }, track: "workshop" },
  { id: "a3", type: "lightning", title: "CSS Grid vs Flexbox: la guerra que nunca termina", start: "15:45", end: "15:55", speaker: { name: "Layout Wars", role: "CSS Philosopher" }, track: "workshop" },

  // ── EVENING / NETWORKING ──────────────────────────────────────
  { id: "e1", type: "talk", title: "How I got my first job in tech", start: "20:00", end: "20:30", speaker: { name: "Junior Dev", role: "First Job Survivor" }, track: "main" },
  { id: "e2", type: "break", title: "🍕 Networking Dinner", start: "20:30", end: "22:00", speaker: null, track: "main" },
  { id: "e3", type: "lightning", title: "Hot takes: unpopular JS opinions", start: "22:00", end: "22:15", speaker: { name: "Spicy Dev", role: "Professional Contrarian" }, track: "main" },
  { id: "e4", type: "talk", title: "Building side projects that actually ship", start: "22:15", end: "23:00", speaker: { name: "Ship It Steve", role: "Indie Hacker" }, track: "main" },
  { id: "e5", type: "break", title: "🎸 After Party @ La Nave", start: "23:00", end: "23:59", speaker: null, track: "main" },
]