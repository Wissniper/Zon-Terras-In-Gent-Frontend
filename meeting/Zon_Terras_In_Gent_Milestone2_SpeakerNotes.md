# Zon Terras In Gent – Milestone 2
## Speaker Notes per Slide

---

### Slide 1 – Titel

Welkom. Dit is onze tweede milestone-presentatie voor het Webdevelopment-project. Sinds de eerste presentatie in maart hebben we het volledige testlandschap opgezet, semantic web geïntegreerd, data seeding scripts geschreven, en een volledig werkende React-frontend gebouwd — van nul. Vandaag laten we zien wat er concreet veranderd is.

---

### Slide 2 – Agenda

We overlopen acht onderwerpen. We starten met een terugblik op wat er al was na Milestone 1, geven daarna een kwantitatief overzicht van de voortgang, en duiken dan dieper in het backend- en frontend-werk. We sluiten af met integratie, uitdagingen en volgende stappen.

---

### Slide 3 – Vertrekpunt na Milestone 1

Links staan de zaken die we al hadden aan het einde van Milestone 1: een volledig functionele REST API met 33 endpoints, content negotiation, HATEOAS, Pug views, en een deployment op Oracle Cloud. Rechts staat wat de scope was voor Milestone 2 — alles wat ontbrak. Belangrijkste punt: de frontend was volledig leeg, enkel scaffold. Testdekking was nul procent.

---

### Slide 4 – Voortgang in Cijfers

Zes kerncijfers. 96 backend-commits en 30 frontend-commits over 36 dagen. We zijn van nul naar 229 test cases gegaan, verdeeld over 27 testbestanden. Vijf volledig werkende frontend-pagina's gebouwd. En meer dan tien pull requests gemerged, met elk een duidelijk gedefinieerde scope.

---

### Slide 5 – Backend: Test Suite

We hadden aan het begin van Milestone 2 nog geen enkele test. We hebben dat systematisch aangepakt: eerst de modellen getest, dan de controllers, daarna de endpoints als integratietests, en uiteindelijk ook de geospatiale queries, data fetchers en de RDF-exporter. Elke test draait tegen een in-memory MongoDB, zodat er geen externe database nodig is. Een technisch detail: we moesten `setMaxListeners` verhogen omdat de DB-indexering asynchroon is en tests anders te vroeg zouden starten.

---

### Slide 6 – Backend: Semantic Web & RDF

Dit was een van de grotere technische uitbreidingen. We zijn overgestapt van MongoDB `_id` naar een `uuid` als primaire identifier — dat geeft stabiele IRIs die onafhankelijk zijn van de database. Alle endpoints kunnen nu `application/ld+json` teruggeven met een `@context` op basis van Schema.org. We hebben ook een SPARQL semantic search endpoint toegevoegd, en een exportscript dat de volledige database als N-Triples wegschrijft. De MongoDB en de triplestore worden gesynchroniseerd via Mongoose post-save hooks.

---

### Slide 7 – Backend: Data Seeding, 3D & API

Drie seeding scripts: voor terrassen en restaurants via Overpass API, voor evenementen via Visit Gent. Die scripts zijn uitvoerbaar via npm-commando's en vullen de database met actuele Gentse data.

Daarnaast hebben we een nieuw model en endpoints toegevoegd voor 3D gebouwdata van Stad Gent. De tiles worden gedownload via een Lambert 72-raster, opgeslagen met een status lifecycle, en later bruikbaar voor schaduwberekeningen.

Aan API-kant: sun cache van 15 naar 60 minuten verhoogd om rate limits te vermijden, Gent-coördinaten worden nu gevalideerd via guardrails, en de API is in read-only modus gezet voor de frontend.

---

### Slide 8 – Sectie-divider: Frontend

We stappen over naar het frontend-werk. Dit was de grootste nieuwe scope van Milestone 2: een volledige React-applicatie bouwen op basis van de bestaande backend-API.

---

### Slide 9 – Frontend: Stack & Architectuur

De frontend gebruikt React 19 met strikte TypeScript, Vite als build tool en dev server, Tailwind CSS voor styling, en React Router voor navigatie. Data wordt beheerd via TanStack React Query met Axios. Real-time updates lopen via Socket.io. De kaart is gebouwd met Leaflet en react-leaflet.

De provider-boom toont hoe de contexts genest zijn: van QueryClientProvider aan de buitenkant tot MapProvider en App binnenin. Elke provider heeft een specifieke verantwoordelijkheid en is aanroepbaar via een custom hook.

---

### Slide 10 – Frontend: Interactieve Kaart & Zon-Timeline

De MapPage is het hart van de applicatie. De belangrijkste feature is de 48-uur zon-timeline slider: de gebruiker kan scrollen van vandaag tot morgen, en de app berekent de zonintensiteit per uur. De kleurgradiënt past zich aan op basis van bewolkingsdata uit de weer-API — bij helder weer is de slider goud-amber, bij bewolkt wordt het grijzer.

De collapsible sidebar aan de linkerkant bevat een WeatherCard met actuele weerdata, een lijst van de zonnigste terrassen, en navigatielinks. Op mobiel kan de sidebar worden opengeklapt via een hamburger-knop.

---

### Slide 11 – Frontend: Pagina's & Zoekfunctie

Alle vijf pagina's zijn volledig geïmplementeerd. De SearchPage heeft drie tabs voor terrassen, restaurants en evenementen, met paginering van 20 items per pagina en een intensiteitsfilter. De detailpagina's tonen respectievelijk zondata met een OSM-kaartinbed, restaurantinfo met openingsuren, en evenementdetails met een link naar het bijhorende terras of restaurant.

UUID-extractie uit het Hydra `@id`-veld is een technisch detail dat we afhandelen in de services — de gebruiker ziet nooit een raw ID.

---

### Slide 12 – Integratie & Architectuur

De architectuur is eenvoudig: de browser praat via de Vite-proxy met de backend. In productie draait de frontend als een statische build, rechtstreeks naar NGINX. Socket.io maakt een directe verbinding naar de API — het bypasses de Vite-proxy opzettelijk, omdat proxied WebSocket-connecties extra configuratie vereisen.

CORS is op twee plaatsen geconfigureerd: in de Express REST-middleware én in de socket.io-opties. Beide accepteren `localhost:5173` en de deployed origin.

---

### Slide 13 – Uitdagingen & Oplossingen

Vier concrete problemen. Ten eerste de stagnant intensity-bug: gecachede waarden werden nooit herberekend, ook niet na de TTL. Opgelost door de cache-logica te herschrijven met correcte TTL-controle.

Ten tweede de RDF-inconsistentie: triplestore en MongoDB raakten uit sync. Opgelost door alles te centraliseren in Mongoose hooks.

Ten derde CORS en socket.io typing: die conflicteerden en gaven TypeScript-fouten. Opgelost door expliciete configuratie voor beide te schrijven.

Ten vierde de UUID-migratie: we zijn halverwege overgestapt van `_id` naar `uuid`, wat refactoring vereiste in routes, tests en de RDF-exporter. Een les voor de volgende keer: dit soort beslissingen neem je best aan het begin.

---

### Slide 14 – Wat Nu Mogelijk Is

Dit zijn de zes dingen die een gebruiker vandaag al kan doen. Meest markant: real-time zonnige terrassen zien, tijdreizen met de slider, en detailpagina's raadplegen met zondata. Alles draait op de live backend op `api.sun-seeker.be`. De frontend is lokaal demonstreerbaar.

---

### Slide 15 – Lessons Learned & Volgende Stappen

Zes lessen, waarbij de rode draad is: start vroeg met tests, plan grote refactors aan het begin, en configureer integratiepunten expliciet.

Drie hoge prioriteiten voor Milestone 3: 3D schaduwberekeningen voor nauwkeurigere zonintensiteit, een Leaflet-kaart met markers in de MapPage, en de tweede frontend-app in een ander framework — wat een vereiste is van de WEBDEV2-opdracht.

---

### Slide 16 – Afsluiting

Samengevat: de backend is volledig getest met 229 test cases en ondersteunt nu Linked Data. De frontend is volledig geïmplementeerd met vijf pagina's en real-time data. We staan open voor vragen.

---

*Wisdom Ononiba & Yoanna Oosterlinck — Universiteit Gent — April 2026*
