# Fleet Inspection And Maintenance — UI

Angular 18 + Ionic 8 standalone components. Talks to the API over REST; never queries the database directly.

`npm start` runs the dev server, `npm run build` produces `dist/`.

## Screens

- 1
- 2
- 3
- 4
- Guided Vehicle Inspection
- Interaction Details

## API base URL

`index.html` declares `window.__API_BASE_URL__`. The deploy pipeline rewrites the placeholder with the published API URL, so the UI and API can live on separate App Services.
