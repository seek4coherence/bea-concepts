(function () {
  const cfg = window.BEA_CONCEPT;
  const stages = ["Executed", "Diligence", "Financing", "Closing"];
  const types = ["Residential", "Commercial", "Development"];
  const names = [
    "Walnut Street residence",
    "Portland Avenue mixed use",
    "Third Street office recap",
    "Lakeside lot assembly",
    "Market Square retail",
    "Highland residence resale",
    "Riverfront development parcel",
    "Baxter Avenue duplex"
  ];
  const checksFor = {
    Residential: ["Executed contract", "Disclosures", "Inspection report", "Appraisal", "Clear to close"],
    Commercial: ["Executed contract", "Rent roll", "Environmental report", "Financing letter", "Title commitment"],
    Development: ["Purchase agreement", "Entitlement notes", "Survey", "Partner approvals", "Closing statement draft"]
  };

  function seed(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
    return Math.abs(h);
  }
  function rng(start) {
    let x = start || 1234567;
    return function () {
      x = (x * 1664525 + 1013904223) >>> 0;
      return x / 4294967296;
    };
  }
  const rand = rng(seed(cfg.slug + "deal"));
  const states = cfg.offices.slice();
  const deals = names.map((name, i) => {
    const type = types[i % types.length];
    const items = checksFor[type];
    const done = items.filter(() => rand() > 0.4);
    const alertDays = rand() > 0.55 ? 1 + Math.floor(rand() * 8) : 0;
    return {
      id: "D" + String(500 + i),
      name,
      type,
      state: states[i % states.length],
      stage: stages[Math.floor(rand() * stages.length)],
      owner: ["B. Sample", "L. Sample", "C. Sample"][i % 3],
      close: ["November 20", "December 4", "December 15", "January 8"][i % 4],
      items,
      done,
      alertDays,
      nextDate: alertDays ? "Document date passed" : "Next date in " + (4 + i) + " days"
    };
  });

  let filterState = "All states";
  let filterType = "All types";
  const $ = (id) => document.getElementById(id);

  function filtered() {
    return deals.filter((d) => {
      const s = filterState === "All states" || d.state === filterState;
      const t = filterType === "All types" || d.type === filterType;
      return s && t;
    });
  }

  function renderKpis(rows) {
    $("kpi-open").textContent = String(rows.length);
    $("kpi-alert").textContent = String(rows.filter((d) => d.alertDays > 0).length);
    $("kpi-close").textContent = String(rows.filter((d) => d.stage === "Closing").length);
    const pct = rows.length ? Math.round(rows.reduce((s, d) => s + d.done.length / d.items.length, 0) / rows.length * 100) : 0;
    $("kpi-docs").textContent = pct + "%";
  }

  function renderBoard(rows) {
    const root = $("kanban");
    root.innerHTML = "";
    stages.forEach((stage) => {
      const items = rows.filter((d) => d.stage === stage);
      const col = document.createElement("div");
      col.className = "col";
      col.innerHTML = '<div class="col-h"><span>' + stage + '</span><span class="count">' + items.length + "</span></div>";
      items.forEach((d) => {
        const btn = document.createElement("button");
        btn.className = "card";
        btn.type = "button";
        const tag = d.alertDays > 0
          ? '<span class="tag over">' + d.alertDays + " day date alert</span>"
          : '<span class="tag info">' + d.type + "</span>";
        btn.innerHTML = '<div class="name">' + d.name + '</div><div class="meta">' + d.state + ", close " + d.close + "</div>" + tag;
        btn.addEventListener("click", () => openDeal(d));
        col.appendChild(btn);
      });
      root.appendChild(col);
    });
  }

  function renderAlerts(rows) {
    const list = $("alerts");
    const items = rows.filter((d) => d.alertDays > 0);
    if (!items.length) {
      list.innerHTML = '<p class="hint">No date alerts in this view.</p>';
      return;
    }
    list.innerHTML = "";
    items.forEach((d) => {
      const btn = document.createElement("button");
      btn.className = "item";
      btn.type = "button";
      btn.innerHTML = "<div><strong>" + d.name + "</strong><div class='meta'>" + d.nextDate + ", " + d.state + "</div></div><span class='tag over'>" + d.alertDays + " days</span>";
      btn.addEventListener("click", () => openDeal(d));
      list.appendChild(btn);
    });
  }

  function openDeal(d) {
    $("d-title").textContent = d.name;
    $("drawer-kv").innerHTML = [
      ["Deal", d.id],
      ["Type", d.type],
      ["State", d.state],
      ["Stage", d.stage],
      ["Target close", d.close],
      ["Next date", d.nextDate]
    ].map((row) => "<span>" + row[0] + "</span><div>" + row[1] + "</div>").join("");
    $("drawer-checks").innerHTML = d.items.map((item) => {
      const ok = d.done.includes(item);
      return '<label class="check"><input type="checkbox" disabled ' + (ok ? "checked" : "") + "> " + item + "</label>";
    }).join("");
    $("drawer-note").textContent = "This deal is sample data for illustration. A live transaction room would track contracts, dates, and party emails in one shared board.";
    $("drawer-back").classList.add("open");
    $("drawer").classList.add("open");
  }

  function closeDrawer() {
    $("drawer-back").classList.remove("open");
    $("drawer").classList.remove("open");
  }

  function render() {
    const rows = filtered();
    renderKpis(rows);
    renderBoard(rows);
    renderAlerts(rows);
  }

  $("office").addEventListener("change", (e) => { filterState = e.target.value; render(); });
  $("search").addEventListener("change", (e) => { filterType = e.target.value; render(); });
  $("drawer-back").addEventListener("click", closeDrawer);
  $("drawer-close").addEventListener("click", closeDrawer);
  render();
})();
