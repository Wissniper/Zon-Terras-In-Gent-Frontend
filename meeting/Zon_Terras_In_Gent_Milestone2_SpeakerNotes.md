# Zon Terras In Gent – Milestone 2
## Speaker Notes per Slide

---

### Slide 1 – Titel

Welkom. Dit is onze tweede milestone-presentatie voor het Webdevelopment-project. Sinds de eerste presentatie in maart hebben we het volledige testlandschap opgezet, semantic web geïntegreerd, data seeding scripts geschreven, en een volledig werkende React-frontend gebouwd. Vandaag laten we zien wat er concreet veranderd is en waarom we bepaalde architecturale keuzes hebben gemaakt om van een proof-of-concept naar een robuuste applicatie te gaan.

---

### Slide 2 – Agenda

We overlopen acht onderwerpen. We starten met een terugblik op Milestone 1, geven een kwantitatief overzicht van de voortgang, en duiken dan dieper in het backend- en frontend-werk. We besteden extra aandacht aan de 'waarom' achter onze keuzes voor RDF en de complexe 3D hosting strategie. We sluiten af met integratie-uitdagingen en de stappen naar de finale milestone.

---

### Slide 3 – Vertrekpunt na Milestone 1

Links staan de zaken die we al hadden: een functionele REST API met HATEOAS en Pug views. Rechts staat de scope voor Milestone 2. Het belangrijkste pijnpunt was dat de frontend nog een lege shell was en we overgeleverd waren aan handmatige tests door een gebrek aan testdekking. We moesten de architectuur professionaliseren voor we konden opschalen.

---

### Slide 4 – Voortgang in Cijfers

Zes kerncijfers die de intensiteit van de afgelopen 36 dagen tonen: 126 commits totaal, 229 test cases verdeeld over 27 bestanden, en vijf volledig werkende frontend-pagina's. Elk cijfer staat voor een afgeronde user story of bugfix die de stabiliteit van het systeem heeft verhoogd.

---

### Slide 5 – Backend: Test Suite & Betrouwbaarheid

Aan het begin van Milestone 2 hadden we geen tests. We hebben dit aangepakt met een "in-memory MongoDB" strategie. 

**Waarom?** Omdat we willen dat onze CI/CD pipeline (GitHub Actions) tests kan draaien zonder afhankelijk te zijn van een externe database die offline kan zijn of vervuilde data bevat. Dit garandeert dat elke commit de bestaande logica niet breekt en dat de database-status voor elke testrun identiek is.

```typescript
// database.helper.ts
export const connect = async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
  await mongoose.syncIndexes();
};
// Elke test draait tegen een verse, geïsoleerde database-instantie
```

---

### Slide 6 – Backend: Semantic Web & RDF

Dit was de grootste technische uitbreiding. We zijn overgestapt naar Linked Data. 

**Waarom gebruiken we RDF triples?** 
1. **Interoperabiliteit:** Onze data is nu niet langer een "blinde" JSON-blob die alleen wij begrijpen. Door triples te gebruiken, kan elke machine de relaties tussen entiteiten begrijpen via wereldwijde standaarden.
2. **Betekenis (Semantiek):** Velden zijn gekoppeld aan unieke URIs (zoals `zt:sunIntensity`). Hierdoor is er geen verwarring mogelijk over wat data precies representeert.

```typescript
// rdfExporter.ts
export function docToTriples(entityType: string, doc: any): string[] {
    const baseUri = `${BASE_IRI}/${plural}/${doc.uuid}`;
    return [
        `<${baseUri}> a <http://api.sun-seeker.be/vocab#Terras> .`,
        `<${baseUri}> <https://schema.org/name> "${doc.name}" .`,
        `<${baseUri}> <http://api.sun-seeker.be/vocab#sunIntensity> "${doc.intensity}"^^xsd:integer .`
    ];
}
```

---

### Slide 7 – Semantic Web: Waarom stabiele UUIDs?

We zijn overgestapt van MongoDB `_id` naar `uuid` als primaire identifier.

**Waarom?** MongoDB IDs zijn database-specifiek. Als we morgen overstappen naar een andere database, veranderen alle links naar onze terrassen. Een UUID is universeel en stabiel. Dit is essentieel voor IRIs: een link naar een terras op `api.sun-seeker.be` moet over 10 jaar nog steeds naar hetzelfde terras wijzen, ongeacht de onderliggende techniek.

```typescript
// terrasModel.ts
const TerrasSchema = new Schema({
  uuid: { 
    type: String, 
    default: uuidv4, // Genereer stabiele identifier onafhankelijk van MongoDB
    required: true, 
    unique: true, 
    index: true 
  },
});
```

---

### Slide 8 – Semantic Web: JSON-LD & Context

Clients kunnen nu `application/ld+json` opvragen. 

**Waarom JSON-LD?** Het is de brug tussen de klassieke webontwikkelaar en het Semantic Web. Het mapt onze interne velden naar Schema.org en Dublin Core. Zo begrijpt Google bijvoorbeeld direct dat onze "name" de `schema:name` is van een restaurant, wat helpt bij SEO en automatische data-integratie.

```typescript
// jsonld.ts
const BASE_CONTEXT = {
  schema: "https://schema.org/",
  zt: "http://api.sun-seeker.be/vocab#",
  name: "schema:name",
  intensity: "zt:sunIntensity",
  location: "geojson:geometry"
};
// Mapt "intensity" naar een wereldwijd begrepen concept (zt:sunIntensity)
```

---

### Slide 9 – Semantic Web: Semantic Search Rationale

Onze `/api/search/semantic` endpoint gaat verder dan simpele tekst-zoekopdrachten.

**Waarom semantisch zoeken?** In een klassieke API moet je meerdere calls doen om relaties te leggen. Onze semantische laag begrijpt de *relatie* tussen verschillende entiteiten. We simuleren SPARQL-kracht binnen MongoDB om complexe vragen ("Zonnig Italiaans terras") in één enkele query te beantwoorden.

```typescript
// searchController.ts
pipeline.push({
  $lookup: {
    from: "restaurants",
    localField: "locationRef",
    foreignField: "uuid",
    as: "venue"
  }
});
pipeline.push({ 
  $match: { "venue.cuisine": "Italian", "venue.intensity": { $gt: 80 } } 
});
```

---

### Slide 10 – Semantic Web: RDF Export & Synchronisatie

We exporteren alles naar N-Triples en synchroniseren dit via Mongoose hooks.

**Waarom deze extra laag?** Het maakt onze data "future-proof". Door triples real-time bij te houden, kunnen we op elk moment een triplestore (zoals Apache Jena) inpluggen voor geavanceerde reasoning, zonder onze hoofd-API te belasten of te herbouwen.

```typescript
// terrasModel.ts
TerrasSchema.post('save', async function(doc) {
  const triples = docToTriples('terras', doc.toObject());
  await syncToTriplestore(triples); // Gegarandeerde real-time RDF sync
});
```

---

### Slide 11 – Backend: 3D Gebouwdata & Hosting

We hebben 3D data van Stad Gent geïntegreerd voor toekomstige schaduwberekeningen. 

**Waarom serves we deze files via onze eigen Oracle backend en niet via Vercel?**
Vercel heeft een 100MB deployment limiet. De Gent 3D dataset bestaat uit honderden ZIP-bestanden — in totaal gigabytes aan data. Onze Oracle server heeft de diskruimte en streamt deze files direct over HTTPS. Dit voorkomt dat we binaire data in onze Git repo moeten committen.

```typescript
// gent3dController.ts
export const getTileFile = async (req: Request, res: Response) => {
  const tile = await Gent3dTile.findOne({ vaknummer: req.params.vaknummer });
  if (tile.downloadStatus === "done" && tile.localPath) {
    return res.download(tile.localPath); // Stream direct van Oracle storage
  }
};
```

---

### Slide 12 – 3D Architectuur: Waarom Cloudflare R2?

Voor browser-rendering moeten we DWG ZIPs omzetten naar GLTF.

**Waarom Cloudflare R2 als CDN?**
In vergelijking met Supabase Storage biedt R2 een hogere gratis tier en — cruciaal — **geen egress fees**. Omdat 3D modellen groot zijn, zouden de kosten voor dataverkeer bij andere providers snel onhoudbaar worden. R2 is de meest schaalbare keuze voor zware binaire assets.

```typescript
// Conceptuele R2 architectuur
const r2Url = `https://cdn.sun-seeker.be/tiles/${vaknummer}.gltf`;
// Redirect naar R2 CDN om de backend server te ontlasten
```

---

### Slide 13 – 3D Architectuur: Lazy On-demand Conversion

We converteren files pas wanneer ze daadwerkelijk door een gebruiker worden opgevraagd.

**Waarom een 'lazy' pipeline?**
Het zou inefficiënt zijn om alle 400 tegels vooraf te converteren. Dat kost onnodig veel CPU-tijd en opslagruimte. Door alleen op aanvraag te converteren en de URL daarna te cachen in MongoDB, groeien we organisch mee met het gebruik van de app.

```typescript
// gent3dTileModel.ts
export interface Gent3dTileDocument extends Document {
  vaknummer: string;
  downloadStatus: "pending" | "done" | "error";
  gltfUrl?: string; // Cache de R2 URL na de eerste on-demand conversie
}
```

---

### Slide 14 – Sectie-divider: Frontend

We stappen over naar het frontend-werk. De app is gebouwd met React 19, Vite en Tailwind CSS. Hoewel een interactieve kaart met Leaflet gepland staat voor Milestone 3, ligt de focus nu op de integratie van real-time data en 3D tiles.

---

### Slide 15 – Frontend: Architectuur & State

De frontend gebruikt TanStack React Query voor data-fetching. 

**Waarom?** Het handelt caching, loading states en retries automatisch af. Voor real-time updates gebruiken we Socket.io, zodat de gebruiker direct ziet wanneer de zonintensiteit of het weer verandert, zonder handmatig de pagina te verversen.

```typescript
// useWeatherData.ts (Frontend Hook)
socket.on('weather_update', () => {
  queryClient.invalidateQueries({ queryKey: ['weather'] });
});
// Reageer direct op gepushte data van de backend
```

---

### Slide 16 – Frontend: Pagina's & Gebruikerservaring

Vijf pagina's zijn volledig geïmplementeerd. We extraheren UUIDs uit de Hydra `@id` velden van de API om naar detailpagina's te navigeren.

**Waarom?** Om de URL's clean te houden terwijl we toch de volledige semantische link naar de backend behouden. De gebruiker ziet een simpele URL, maar de app "begrijpt" de semantische context van de resource.

```typescript
// services/api.ts
const extractUuid = (id: string) => id.split('/').pop();
// Van "/api/terrasen/123-abc" naar "123-abc" voor React Router
```

---

### Slide 17 – Integratie: De Vite Proxy & Sockets

Onze architectuur gebruikt een Vite proxy in development, maar we praten direct met de backend voor Sockets.

**Waarom bypassen we de proxy voor Socket.io?**
Proxying van WebSockets voegt onnodige latency toe en vereist complexe configuratie. Door een directe verbinding naar `api.sun-seeker.be` te maken, garanderen we de snelste real-time ervaring.

```typescript
// services/socket.ts
const socket = io('https://api.sun-seeker.be', {
  transports: ['websocket'] // Forceer directe WebSocket verbinding voor snelheid
});
```

---

### Slide 18 – Uitdagingen & Oplossingen

We hebben vier grote hobbels genomen: de cache-bug, RDF-inconsistentie, CORS-problemen en de UUID-migratie. Elk van deze problemen heeft ons gedwongen onze architectuur te heroverwegen en fundamenteel te verbeteren.

---

### Slide 19 – Uitdaging: De 'Stagnant Intensity' Bug

Zonintensiteit werd gecachet, maar door een fout in de TTL-logica werden waarden nooit ververst.

**Waarom was dit kritiek?** De kernbelofte van onze app is "real-time zon". Als de data stilstaat, verliest de app zijn nut. We hebben dit opgelost door een strikte 15-minuten vergelijking met de `updatedAt` timestamp te forceren.

```typescript
// sunDataController.ts (Backend Fix)
const isStale = (Date.now() - new Date(cached.updatedAt).getTime()) > 15 * 60 * 1000;
if (isStale) {
  // Recalculate sun position and intensity
}
```

---

### Slide 20 – Uitdaging: RDF Inconsistentie

MongoDB en de RDF-triples raakten soms uit sync bij updates.

**Waarom centralisatie in hooks?** Eerst deden we de synchronisatie in de controllers, maar dat was foutgevoelig. Door het naar Mongoose `post-save` hooks te verplaatsen, is het technisch onmogelijk om de database te wijzigen zonder dat de semantische laag mee verandert.

```typescript
// terrasModel.ts
TerrasSchema.post('findOneAndUpdate', async function(doc) {
  // Deze hook garandeert sync, zelfs bij bulk updates
});
```

---

### Slide 21 – Uitdaging: CORS & Socket.io

Browser-beveiliging blokkeerde onze WebSocket-handshake.

**Waarom dubbele configuratie?** Veel ontwikkelaars vergeten dat Socket.io zijn eigen CORS-configuratie heeft, los van de Express-middleware. We moesten expliciete origins definiëren voor beide lagen om een veilige handshake mogelijk te maken.

```typescript
// app.ts
const io = new Server(server, {
  cors: { origin: allowedOrigins }, // Essentieel voor WebSocket handshake
});
app.use(cors({ origin: allowedOrigins })); // Voor standaard REST endpoints
```

---

### Slide 22 – Uitdaging: De UUID-Migratie

Halverwege de sprint overstappen op een ander ID-systeem was een enorme operatie.

**Waarom nu en niet later?** Hoe langer we wachtten, hoe meer code we moesten herschrijven. De overstap naar UUID was essentieel voor de stabiliteit van onze Semantic Web IRIs. Het was een korte pijn voor een lange-termijn fundament.

```typescript
// Impact op middleware en validatie
export const validateID = (req, res, next) => {
  if (!uuidValidate(req.params.id)) return res.status(400); // Check voor UUID format
  next();
};
```

---

### Slide 23 – Lessons Learned: Mid-project Refactoring

De grootste les van Milestone 2: **Plan je data-architectuur op dag één.**
We hebben geleerd dat tests je veiligheidsnet zijn bij grote refactors. Zonder onze 229 test cases was de UUID-migratie uitgelopen op een ramp; nu wisten we binnen seconden precies wat er brak.

---

### Slide 24 – Wat Nu Mogelijk Is

Vandaag kan een gebruiker: real-time zonnige terrassen vinden, tijdreizen met de zon-slider, en gedetailleerde zondata raadplegen. De backend draait live op Oracle Cloud, de frontend is klaar voor de 3D integratie.

---

### Slide 25 – Milestone 3: De Volgende Stappen

Drie hoge prioriteiten:
1. **3D Rendering:** De DWG-naar-GLTF pipeline activeren en renderen via R2 en Three.js.
2. **Interactieve Kaart:** Volledige implementatie van Leaflet markers.
3. **Framework Diversiteit:** Het bouwen van een tweede frontend in Angular of Vue, zoals vereist voor de opdracht.

---

### Slide 26 – Afsluiting

Samengevat: we hebben een robuust, semantisch fundament gelegd. De backend is volledig getest en "linked data ready". De frontend is functioneel en schaalbaar. We hebben geleerd dat de "waarom" achter de techniek (zoals R2 of UUIDs) bepalend is voor de lange-termijn kwaliteit van het project. Vragen?

---

*Wisdom Ononiba & Yoanna Oosterlinck — Universiteit Gent — April 2026*
