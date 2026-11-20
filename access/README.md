# Gamehub met toegangscode

Resend verstuurt vanaf toegang@games.ratelslop.studio. Gebruik in Resend uitsluitend uitgaande mail en voeg alleen de drie getoonde DNS-records onder games.ratelslop.studio toe. Cloudflare Email Routing gebruikt de MX-records op ratelslop.studio voor de bestaande doorstuuradressen.

Voor de huidige Resend-registratie staan de DNS-waarden op de [Resend-configuratiepagina](https://resend.com/domains/add/fe417a2b-fc71-421a-b101-0acbe9bdb211). Voeg in Floris’ zone het TXT-record `resend._domainkey.games` toe met de daar getoonde DKIM-waarde. Voeg ook twee DNS-only CNAME-records toe: `rsend.games` naar `rsend-euw1.forge.rmta.net` en `send.games` naar `send.forge.rmta.net`. Controleer de waarden opnieuw in Resend als de domeinregistratie opnieuw wordt aangemaakt.

Beide beheerders krijgen per aanvraag hetzelfde beoordelingsbericht. Een klik opent een bevestigingspagina zodat een e-mailscanner geen aanvraag verwerkt. De eerste bevestigde beslissing telt. Na goedkeuring is de code één kalendermaand bruikbaar. De browser krijgt een sessie met dezelfde vervaldatum.

## Publicatie

1. Verifieer games.ratelslop.studio in Resend. Gebruik een sleutel met verzendrechten voor alleen dat domein.
2. De Worker en de D1-database ratelslop-games-access staan in het Cloudflare-account van dhooijmaijers. Het database-ID staat in wrangler.jsonc. Voer bij een nieuwe database vanuit access `npx wrangler d1 execute ratelslop-games-access --remote --file schema.sql` uit.
3. Bouw de hub vanuit de hoofdmap met `node scripts/refresh-games.mjs`, `python ports/numworks/build.py` en `node scripts/verify-site.mjs`.
4. Publiceer de Worker vanuit access met `npx wrangler deploy`. Stel in Cloudflare de geheimen RESEND_API_KEY en ACCESS_SECRET in. Gebruik voor ACCESS_SECRET een willekeurig geheim van minstens 32 bytes. Voeg secrets uitsluitend via Cloudflare toe.
5. De DNS-zone blijft in Floris’ account. Gebruik daar de bestaande Worker als doorstuurroute met `wrangler.floris.jsonc`. Geef beide Workers hetzelfde willekeurige `BRIDGE_SECRET` van minstens 32 tekens als Cloudflare-secret. De Worker op dhooijmaijers weigert directe verzoeken via workers.dev zonder dit geheim.
6. De route `games.ratelslop.studio/*` is op de DNS-zone in Floris’ account gekoppeld aan de doorstuurworker. Het bestaande CNAME-record voor de website loopt via Cloudflare Proxy. Het wijzigen van de route vereist rechten op de zone. Installeer de route desgewenst via de zone-instellingen als Wrangler met alleen Worker Editor-rechten de wijziging afwijst. Schakel de oude GitHub Pages-publicatie en bijbehorende workflow uit zodra de afgeschermde versie werkt. Publieke GitHub-repositories kunnen hun eigen exemplaren van spellen aanbieden.

D1 bewaart aanvragers en beslissingen. De cron probeert mislukte berichten binnen 23 uur opnieuw te verzenden. Gebruik de bezorgstatus in Resend om te controleren of een bericht is aangekomen.

Voor automatische builds stel je in GitHub de secret CLOUDFLARE_API_TOKEN en de repositoryvariabele D1_DATABASE_ID in. Zet PROTECTED_HUB_ENABLED op true na de overstap. Pushes naar main en game-updated publiceren dan via de Worker. Gebruik voor de eerste test een handmatige deployment. Bewaar de runtimegeheimen in Cloudflare.
