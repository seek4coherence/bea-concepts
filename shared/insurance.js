(function () {
  const cfg = window.BEA_CONCEPT;
  const stages = ["New request", "In quoting", "Follow up", "Bound", "Closed lost"];
  const sampleNames = [
    "Harbor View Clinic", "Elm Street Household", "Oakridge Warehouse",
    "Riverbend Cafe", "West End Dental", "Summit Logistics",
    "Maple Grove Household", "Cedar Park Properties", "Northside Garage",
    "Brighton Veterinary", "Lakeshore Bakery", "Highland Machine Shop",
    "Parkside Pharmacy", "Blue Heron Inn", "Stone Mill Farm"
  ];
  const producers = ["A. Chen", "R. Patel", "J. Hale", "M. Ortiz", "S. Brooks"];
  const lines = ["Business package", "Personal auto", "Home", "Benefits", "Commercial auto", "Farm"];

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

  const rand = rng(seed(cfg.slug + "ins"));
  const offices = cfg.offices.slice();
  const openStages = ["New request", "In quoting", "Follow up"];
  const quotes = sampleNames.map((name, i) => {
    const created = 2 + Math.floor(rand() * 18);
    const stage = stages[i % stages.length];
    const canBeOverdue = openStages.indexOf(stage) !== -1;
    const overdueDays = canBeOverdue && rand() > 0.45 ? 1 + Math.floor(rand() * 9) : 0;
    return {
      id: "Q" + String(1000 + i),
      name,
      office: offices[Math.floor(rand() * offices.length)],
      producer: producers[Math.floor(rand() * producers.length)],
      stage,
      line: lines[Math.floor(rand() * lines.length)],
      premium: 1200 + Math.floor(rand() * 28000),
      ageDays: created,
      overdueDays,
      nextStep: overdueDays ? "Call back is overdue" : "Send proposal recap"
    };
  });

  const renewals = sampleNames.slice(0, 8).map((name, i) => ({
    name,
    office: offices[i % offices.length],
    producer: producers[i % producers.length],
    dueIn: [12, 19, 27, 34, 41, 48, 55, 68][i],
    line: lines[i % lines.length]
  }));

  let filterOffice = "All offices";
  let query = "";
  let workloadChart;

  const $ = (id) => document.getElementById(id);

  function money(n) {
    return "$" + n.toLocaleString("en-US");
  }

  function filtered() {
    return quotes.filter((q) => {
      const officeOk = filterOffice === "All offices" || q.office === filterOffice;
      const hay = (q.name + " " + q.producer + " " + q.line).toLowerCase();
      return officeOk && hay.includes(query);
    });
  }

  function renderKpis(rows) {
    const overdue = rows.filter((q) => q.overdueDays > 0);
    const open = rows.filter((q) => q.stage !== "Bound" && q.stage !== "Closed lost");
    const bound = rows.filter((q) => q.stage === "Bound");
    const due30 = renewals.filter((r) => (filterOffice === "All offices" || r.office === filterOffice) && r.dueIn <= 30);
    $("kpi-open").textContent = String(open.length);
    $("kpi-overdue").textContent = String(overdue.length);
    $("kpi-bound").textContent = money(bound.reduce((s, q) => s + q.premium, 0));
    $("kpi-renew").textContent = String(due30.length);
  }

  function renderKanban(rows) {
    const root = $("kanban");
    root.innerHTML = "";
    stages.forEach((stage) => {
      const items = rows.filter((q) => q.stage === stage);
      const col = document.createElement("div");
      col.className = "col";
      col.innerHTML = '<div class="col-h"><span>' + stage + '</span><span class="count">' + items.length + "</span></div>";
      items.forEach((q) => {
        const btn = document.createElement("button");
        btn.className = "card";
        btn.type = "button";
        const tag = q.overdueDays > 0
          ? '<span class="tag over">' + q.overdueDays + " days overdue</span>"
          : '<span class="tag ok">' + q.office + "</span>";
        btn.innerHTML = '<div class="name">' + q.name + '</div><div class="meta">' + q.producer + ", " + q.line + "</div>" + tag;
        btn.addEventListener("click", () => openQuote(q));
        col.appendChild(btn);
      });
      root.appendChild(col);
    });
  }

  function renderOverdue(rows) {
    const list = $("overdue");
    const items = rows.filter((q) => q.overdueDays > 0).sort((a, b) => b.overdueDays - a.overdueDays);
    if (!items.length) {
      list.innerHTML = '<p class="hint">No overdue follow ups in this view.</p>';
      return;
    }
    list.innerHTML = "";
    items.forEach((q) => {
      const btn = document.createElement("button");
      btn.className = "item";
      btn.type = "button";
      btn.innerHTML = "<div><strong>" + q.name + "</strong><div class='meta'>" + q.producer + ", " + q.office + "</div></div><span class='tag over'>" + q.overdueDays + " days</span>";
      btn.addEventListener("click", () => openQuote(q));
      list.appendChild(btn);
    });
  }

  function renderWorkload(rows) {
    const counts = {};
    producers.forEach((p) => { counts[p] = 0; });
    rows.forEach((q) => {
      if (q.stage !== "Bound" && q.stage !== "Closed lost") counts[q.producer] += 1;
    });
    const ctx = $("workload");
    if (workloadChart) workloadChart.destroy();
    workloadChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: producers,
        datasets: [{
          label: "Open items",
          data: producers.map((p) => counts[p]),
          backgroundColor: "#14867e"
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 } },
          x: { ticks: { maxRotation: 0 } }
        }
      }
    });
  }

  function renderRenewals() {
    const rows = renewals.filter((r) => filterOffice === "All offices" || r.office === filterOffice);
    const tb = $("renewals");
    tb.innerHTML = rows.map((r) => {
      const tag = r.dueIn <= 30 ? "over" : r.dueIn <= 60 ? "soon" : "ok";
      return "<tr class='rowlink'><td>" + r.name + "</td><td>" + r.line + "</td><td>" + r.office + "</td><td>" + r.producer + "</td><td><span class='tag " + tag + "'>Due in " + r.dueIn + " days</span></td></tr>";
    }).join("");
  }

  function openQuote(q) {
    $("d-title").textContent = q.name;
    $("drawer-kv").innerHTML = [
      ["Account", q.name],
      ["Office", q.office],
      ["Producer", q.producer],
      ["Stage", q.stage],
      ["Coverage", q.line],
      ["Quoted premium", money(q.premium)],
      ["Days open", String(q.ageDays)],
      ["Next step", q.nextStep]
    ].map((row) => "<span>" + row[0] + "</span><div>" + row[1] + "</div>").join("");
    $("drawer-note").textContent = "This record is sample data for illustration. A live build would read from the agency management system and inboxes the team already uses.";
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
    renderKanban(rows);
    renderOverdue(rows);
    renderWorkload(rows);
    renderRenewals();
  }

  $("office").addEventListener("change", (e) => { filterOffice = e.target.value; render(); });
  $("search").addEventListener("input", (e) => { query = e.target.value.toLowerCase(); render(); });
  $("drawer-back").addEventListener("click", closeDrawer);
  $("drawer-close").addEventListener("click", closeDrawer);
  render();
})();
