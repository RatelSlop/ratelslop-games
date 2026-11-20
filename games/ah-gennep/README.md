# Albert Heijn Gennep simulator

Nederlandstalige 3D-browsergame met de blauwe AH-huisstijl, echt verpakkingsbeeld van 24 producten en een winkel geïnspireerd op het filiaal aan Wilhelminaplein 4. Onafhankelijk fanspel. De winkel is een benadering; zie [RESEARCH.md](RESEARCH.md).

Start `npm run dev` in deze map en open http://127.0.0.1:4176. Geen installatie nodig: Three.js 0.186.1 is lokaal meegeleverd met MIT-licentie. `npm test` controleert de economie en voorraad, `npm run build` kopieert de game naar de bestaande GitHub Pages-hub. De hub bouwt deze game automatisch bij de volgende normale publicatie. Er is voor deze toevoeging geen nieuwe hosting aangemaakt.

WASD lopen, muis of slepen kijken, Shift sneller, E interactie, M kaart, B bestellen, Spatie scannen, Enter pinnen, Esc pauze. Touchpijlen en zichtbare interactieknoppen op touchapparaten. Optioneel snel verplaatsen via de kaart.

Een werkdag duurt acht minuten en beeldt 08:00–21:00 uit. Vul voorraad aan, bestel dozen, reken klanten af en voer zelfscancontroles uit. Dozen arriveren na 25 seconden. De drie dagdoelen geven richting; je kunt ook vrij spelen. Klanten pakken artikelen uit de schappen. Een deel rekent automatisch af via zelfscan; de rest vormt de bandkassawachtrij. Wachters vertrekken na 110 seconden. Spelersvoortgang wordt lokaal opgeslagen. De tweede bandkassa is decor. De zelfscancontrole is een vereenvoudigde interactie. Magazijnposities, tijdverloop en inkoopprijzen zijn spelontwerp.

`assets/catalog.json` bevat bronlinks, prijzen in eurocenten, ophaaldatum en lokale verpakkingsbeelden. Runtime maakt geen AH-verzoeken. De importeur gebruikt de openbare HTML van `https://www.ah.nl/shop/prijsfavorieten`; geen API-sleutels, private endpoints of proxy. Om bewust te actualiseren: sla de openbare HTML op als `assets/catalog-source.html` en voer `node scripts/import-catalog.mjs` uit met netwerktoegang. Controleer daarna categorieën en prijzen. Gewijzigde AH-markup veroorzaakt een fout; de bestaande catalogus blijft bruikbaar.

Productfoto’s en AH-merkbeeld komen van ah.nl; Three.js is MIT. Fotoreportages dienen als onderzoeksreferentie en worden niet meegebundeld in de speelbare game. De webfont heeft een Arial-fallback bij offline gebruik.

De gebouwcontour en afdelingsvolgorde volgen nu de gelabelde satellietschets van de gebruiker. Je begint in de noordelijke entree en loopt rechts langs de fruitkoeling het versplein in. Koel- en vriesmeubels staan langs afdelingswanden. De kaart, loopgrenzen, afdelingen en verplaatsingspunten komen uit `layout.js`. De oostelijke magazijnen, het kantoor en de laad-/losruimte zijn bereikbaar door deuropeningen. `test/layout.test.mjs` controleert de bereikbaarheid en plaatsing van koude meubels.
