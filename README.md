# LeesApp frontend

LeesApp is een SvelteKit-frontend voor studenten, cursisten en docenten. Gebruikers kunnen boeken zoeken, aanbevelingen bekijken, boeken opslaan in een leeslijst en hun leesvoortgang bijhouden. Docenten kunnen daarnaast studenten en hun leeslijsten beheren.

De frontend praat met een aparte backend-API. Die API moet lokaal draaien op `http://localhost:3000`.

## Technologie

- [SvelteKit](https://svelte.dev/docs/kit) met Svelte 5 runes
- TypeScript met strict typechecking
- [Tailwind CSS](https://tailwindcss.com/) voor styling
- Vite als development server en build tool
- `@sveltejs/adapter-auto` voor deployment-detectie

## Vereisten

Installeer voordat je begint:

- Node.js en npm
- De backend van LeesApp, draaiend op `http://localhost:3000`

De backend verzorgt authenticatie, boeken, leeslijsten en gebruikersrollen. De backend staat niet in deze repository.

## Lokaal starten

Open een terminal in de projectmap en voer uit:

```bash
npm install
npm run dev
```

Open daarna [http://localhost:5173](http://localhost:5173) in de browser. De poort kan veranderen als `5173` al in gebruik is. Met onderstaand commando opent Vite de browser automatisch:

```bash
npm run dev -- --open
```

### Beschikbare scripts

| Commando | Doel |
| --- | --- |
| `npm run dev` | Start de lokale development server |
| `npm run check` | Controleert Svelte-, TypeScript- en toegankelijkheidsdiagnostics |
| `npm run check:watch` | Voert de check opnieuw uit na iedere wijziging |
| `npm run build` | Maakt een production build |
| `npm run preview` | Serveert de production build lokaal |

Voer na een wijziging minimaal `npm run check` uit. Gebruik voor een volledige controle ook `npm run build`.

## Mappenstructuur

```text
book_app/
├── src/
│   ├── app.css                 # Globale Tailwind- en basisstijlen
│   ├── app.html                # HTML-shell van de applicatie
│   ├── lib/
│   │   ├── components/         # Herbruikbare Svelte-componenten
│   │   ├── types/              # Gedeelde TypeScript-types
│   │   └── assets/             # Lokale assets
│   └── routes/                 # Pagina's en URL's van SvelteKit
├── static/                     # Bestanden die rechtstreeks publiek worden geserveerd
├── package.json                # Scripts en dependencies
├── tsconfig.json               # TypeScript-configuratie
└── vite.config.ts              # Vite, Tailwind en SvelteKit plugins
```

### Belangrijkste routes

| Route | Functie |
| --- | --- |
| `/` | Persoonlijk dashboard en leeslijst |
| `/boeken` | Boeken zoeken en filteren |
| `/boeken/[id]` | Detailpagina van een boek |
| `/aanbevelingen` | Leesprofiel en persoonlijke aanbevelingen |
| `/leeslijst` | Eigen opgeslagen boeken en leesstatus |
| `/login` | Inloggen |
| `/register` | Account aanmaken |
| `/profiel` | Profiel en accountinformatie |
| `/mijnstudenten` | Studenten beheren voor docenten |
| `/leeslijsten` | Leeslijsten van studenten voor docenten |

### Belangrijkste componenten

- `BookCard.svelte`: toont een boek, opslaan en boek toewijzen aan een student.
- `ReadingList.svelte`: laadt de eigen leeslijst en verwerkt verwijderen en gelezen/ongelezen markeren.
- `SaveButton.svelte`: voegt een boek toe aan of verwijdert het uit de leeslijst.
- `Pagination.svelte`: paginering voor boekresultaten.
- `FormField.svelte` en `SelectField.svelte`: gedeelde formuliervelden.
- `Button.svelte`: gedeelde knop met varianten voor acties.
- `+layout.svelte`: globale navigatie, authenticatiecontrole en mobiel menu.

## Werking van authenticatie

Na succesvol inloggen geeft de backend een `access_token` terug. De frontend bewaart deze token in `localStorage` onder de sleutel `access_token` en stuurt hem mee als Bearer-token:

```text
Authorization: Bearer <access_token>
```

De globale layout controleert het profiel bij het laden. De rol `DOCENT` krijgt docentfunctionaliteit; studenten en cursisten krijgen leeslijst- en aanbevelingsfunctionaliteit. De backend blijft verantwoordelijk voor de daadwerkelijke autorisatie.

## API-aanname

De frontend verwacht onder andere deze endpoints op `http://localhost:3000`:

- `POST /auth/login`
- `POST /auth/register`
- `GET /auth/profile`
- `GET /books`
- `GET /reading-list`
- `POST` en `DELETE /reading-list`
- `PATCH /reading-list/:bookId/read`
- `GET /reading-list/ids`
- `GET /reading-list/all`
- `POST /reading-list/students/:studentId`
- `GET` en `PUT /reading-profile/me`
- `GET /users/teachers`
- `GET /users/me/teacher`
- `PUT /users/me/teacher/:teacherId`
- `DELETE /users/me/teacher`

Krijg je netwerk- of CORS-fouten, controleer dan eerst of de backend draait op poort `3000` en requests vanaf `http://localhost:5173` toestaat.

## Een eenvoudige wijziging doen

1. Start de app met `npm run dev`.
2. Zoek de bijbehorende route in `src/routes/` of het herbruikbare component in `src/lib/components/`.
3. Pas de markup of logica aan. Gebruik bestaande Tailwind-klassen en componenten waar mogelijk.
4. Controleer tussendoor met `npm run check`.
5. Test de wijziging in de browser op desktop en mobiel.
6. Voer voor het committen `npm run build` uit.

Voorbeeld: een tekst op de boekenpagina aanpassen doe je in `src/routes/boeken/+page.svelte`. Een wijziging aan alle boekkaarten doe je in `src/lib/components/BookCard.svelte`.

## Coding style guide

Dit project volgt de [Svelte style guide](https://svelte.dev/docs/svelte/style-guide) en de gangbare [TypeScript-richtlijnen](https://typescript-eslint.io/). De praktische afspraken in deze codebase zijn:

- Gebruik TypeScript voor nieuwe logica en houd `strict` typechecking actief.
- Gebruik Svelte 5 runes (`$state`, `$derived` en `$props`) in componenten.
- Gebruik PascalCase voor componentbestanden en camelCase voor variabelen en functies.
- Houd routes en bestanden beschrijvend en in lowercase; dynamische routes gebruiken `[id]`.
- Gebruik kleine, herbruikbare componenten in plaats van dezelfde markup op meerdere pagina's te kopiëren.
- Gebruik Tailwind utility classes voor styling en sluit aan bij de bestaande responsive breakpoints.
- Gebruik duidelijke Nederlandse teksten voor de gebruikersinterface en Engelse namen voor technische identifiers.
- Gebruik `async`/`await`, controleer responses en toon een begrijpelijke foutmelding aan de gebruiker.
- Voer `npm run lint` uit om JavaScript, TypeScript, Svelte en Playwright-tests te controleren; gebruik `npm run lint:fix` voor automatische fixes.
- Voeg geen secrets of `.env`-bestanden toe aan Git. Lokale environment-bestanden staan in `.gitignore`.

De linting is ingericht in `eslint.config.js` met ESLint, `typescript-eslint` en `eslint-plugin-svelte`. Gegenereerde mappen zoals `.svelte-kit`, `playwright-report` en `test-results` worden niet gelint.

Er is momenteel geen aparte formatterconfiguratie in de repository. Houd daarom de bestaande formatting aan: duidelijke inspringing, dubbele quotes in Svelte/TypeScript, puntkomma's en zo weinig mogelijk ongerelateerde wijzigingen in een commit.

## Frontend onderbouwing

- De route-structuur staat in `src/routes/`; dynamische boekdetails gebruiken `src/routes/boeken/[id]/`.
- Herbruikbare UI staat in `src/lib/components/`, waaronder boekkaarten, leeslijsten, paginering, formulieren en laad-skeletons.
- Lokale UI-state staat bij de route of component die deze beheert met Svelte 5-runes; afgeleide filters en paginering gebruiken `$derived`.
- Directe toegang tot beschermde pagina's wordt gecontroleerd in de betreffende route, met login-, forbidden-, loading-, lege- en foutstates.
- Frontendflows staan in `tests/`; Playwright test Chromium, Firefox, WebKit en mobiel Chromium. Run alle tests met `npm run test:e2e`.
- De belangrijkste kwaliteitschecks zijn `npm run lint`, `npm run check`, `npm run build` en `npm run test:e2e`.

## Deployment

`npm run build` maakt een production build. Omdat dit project `adapter-auto` gebruikt, kan voor een specifiek hostingplatform nog een passende SvelteKit-adapter nodig zijn. Zie de [SvelteKit adapter-documentatie](https://svelte.dev/docs/kit/adapter-auto) voor deploymentopties.
