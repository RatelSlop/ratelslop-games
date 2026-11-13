# BjommelHommel

Een 3D endless runner voor RatelSlop Games. Wissel tussen drie banen op het fietspad, ontwijk fietsers, fatbikes, bakfietsen, takken, wegversperringen, hooibalen, fietspaaltjes en slagbomen en verzamel stuifmeel. De snelheid neemt toe en je afstandsrecord blijft lokaal bewaard.

- Links/rechts of A/D wisselt van baan.
- Omhoog, W of spatie klimt. Omlaag of S duikt.
- Op een touchscreen kun je vegen of de vier knoppen gebruiken.
- Escape pauzeert of hervat.

Voor een lokale ontwikkelversie: `npm ci` en `npm run dev`. Voor een statische productieversie: `npm run build`. Serveer `dist/` via HTTP. De build gebruikt relatieve paden, zodat dezelfde versie in een iframe en onder een subpad kan draaien. WebGL 2 is vereist.

Het parcours loopt via een polderdijk, een bloesemgaard, een dorp aan de vaart en een houten brug. De 3D-wereld gebruikt Poly Haven-modellen voor bomen, gras en boomstronken, fototexturen en dynamische schaduwen. De hommel, rijders en fietsen zijn voor de game gemodelleerd. Bronnen en licenties staan in `public/credits.html`.

De achtergrondmuziek speelt tijdens de vlucht. Aan/uit en volume staan in het start- en pauzemenu. De browser bewaart beide instellingen lokaal.
