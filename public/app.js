const API = "/api/g-arrivals";

const els = {
  updated: document.getElementById("updated"),
  filter: document.getElementById("stopFilter"),
  refreshBtn: document.getElementById("refreshBtn"),
  tbody: document.getElementById("arrivalsBody"),
  summary: document.getElementById("summary")
};

function rowHTML(a) {
  return `
    <tr>
      <td>${a.routeId}</td>
      <td><strong>${a.stationName || "Unknown"}</strong></td>
      <td><code>${a.stopId}</code></td>
      <td>${a.direction || ""}</td>
      <td><em>${a.destination || "Unknown"}</em></td>
      <td>${a.arrivalTime || ""}</td>
      <td>${a.departureTime || ""}</td>
      <td><code>${a.tripId || ""}</code></td>
    </tr>
  `;
}

function render(data, filter) {
  els.updated.textContent = data?.updated ? `Updated: ${data.updated}` : "";
  const all = data?.arrivals || [];
  const filtered = filter
    ? all.filter(a => 
        a.stopId.toLowerCase().includes(filter.toLowerCase()) ||
        (a.stationName && a.stationName.toLowerCase().includes(filter.toLowerCase())) ||
        (a.destination && a.destination.toLowerCase().includes(filter.toLowerCase()))
      )
    : all;

  els.summary.textContent = `Showing ${filtered.length} of ${all.length} arrivals`;
  els.tbody.innerHTML = filtered.map(rowHTML).join("");
  window.__lastData = data;
}

async function load() {
  try {
    const r = await fetch(API, { cache: "no-store" });
    const json = await r.json();
    render(json, els.filter.value.trim());
  } catch (e) {
    els.summary.textContent = "Failed to load arrivals.";
    console.error(e);
  }
}

els.refreshBtn.addEventListener("click", load);
els.filter.addEventListener("input", () => render(window.__lastData || { arrivals: [] }, els.filter.value.trim()));

(async function init() {
  await load();
  setInterval(load, 30000);
})();
