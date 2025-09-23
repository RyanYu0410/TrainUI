# MTA G Line — Live Arrivals (GTFS-rt)

Minimal site that reads the MTA GTFS-realtime feed for the **G** line,
decodes it on a Node/Express backend, and serves clean JSON to a browser UI.

## Setup

1) Install Node.js 18+
2) Put your MTA key in `.env`

```
MTA_API_KEY=YOUR_MTA_KEY_HERE
```

3) Install & run

```bash
npm i
npm start
# open http://localhost:3000
```

## Notes
- Endpoint exposed by the backend: `/api/g-arrivals`
- Update interval on the client: 30s
- To filter by station, type a stopId like `G24N` or `G24S` in the input.
