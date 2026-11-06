(function () {
  const cfg = window.BEA_CONCEPT;
  const docs = ["Deed", "Survey", "Commitment", "Payoff letter", "ID package", "HOA letter", "Tax cert", "Lender instructions"];
  const fileNames = [
    "Oak Street refinance",
    "Spring Street purchase file",
    "River Road new build",
    "Maple Avenue sale",
    "Cedar Lane cash purchase",
    "Hilltop condo refinance",
    "Orchard Way construction",
    "Market Street sale",
    "Lakeview refinance",
    "Garden Court purchase"
  ];
  const states = cfg.offices.slice();

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
  const rand = rng(seed(cfg.slug + "ttl"));
  const files = fileNames.map((name, i) => {
    const missing = docs.filter(() => rand() > 0.62);
    const have = docs.filter((d) => !missing.includes(d));
    const ready = Math.round(((docs.length - missing.length) / docs.length) * 100);
    let status = "Waiting on documents";
    if (ready === 100) status = "Cleared to close";
    else if (ready >= 75) status = "In examination";
    else if (ready >= 50) status = "Scheduled";
    return {
      id: "F" + String(3200 + i),
      name,
      state: states[i % states.length],
      closer: ["A. Lewis", "J. Brooks", "P. Nguyen"][i % 3],
      closeDate: ["November 12", "November 18", "November 21", "December 2", "December 8"][i % 5],
      missing,
      have,
      ready,
      status
    };
  });

  const inbox = [
    { file: "survey_final.pdf", type: "Survey", conf: "96%" },
    { file: "buyer_id_scan.jpg", type: "ID package", conf: "91%" },
    { file: "lender_instr_v3.pdf", type: "Lender instructions", conf: "88%" },
    { file: "hoa_estoppel.pdf", type: "HOA letter", conf: "93%" },
    { file: "payoff_letter.pdf", type: "Payoff letter", conf: "97%" },
    { file: "warranty_deed_draft.pdf", type: "Deed", conf: "90%" }
  ];

  let filterState = "All states";
  const $ = (id) => document.getElementById(id);

  function filtered() {
    return files.filter((f) => filterState === "All states" || f.state === filterState);
  }

  function renderKpis(rows) {
    $("kpi-open").textContent = String(rows.length);
    $("kpi-clear").textContent = String(rows.filter((f) => f.status === "Cleared to close").length);
    $("kpi-wait").textContent = String(rows.filter((f) => f.missing.length).length);
    const avg = rows.length ? Math.round(rows.reduce((s, f) => s + f.ready, 0) / rows.length) : 0;
    $("kpi-ready").textContent = avg + "%";
  }

  function renderBoard(rows) {
    const root = $("board");
    root.innerHTML = "";
    rows.forEach((f) => {
      const btn = document.createElement("button");
      btn.className = "item";
      btn.type = "button";
      const tag = f.ready === 100 ? "ok" : f.ready < 60 ? "over" : "soon";
      btn.innerHTML = "<div><strong>" + f.name + "</strong><div class='meta'>" + f.state + ", " + f.status + ", close " + f.closeDate + "</div><div class='progress' style='margin-top:8px'><div style='width:" + f.ready + "%'></div></div></div><span class='tag " + tag + "'>" + f.ready + "% ready</span>";
      btn.addEventListener("click", () => openFile(f));
      root.appendChild(btn);
    });
  }

  function renderClass() {
    $("classify").innerHTML = inbox.map((row) =>
      "<div class='class-row'><div>" + row.file + "</div><div>" + row.type + "</div><div class='conf'>" + row.conf + "</div></div>"
    ).join("");
  }

  function openFile(f) {
    $("d-title").textContent = f.name;
    $("drawer-kv").innerHTML = [
      ["File", f.id],
      ["State", f.state],
      ["Closer", f.closer],
      ["Status", f.status],
      ["Target close", f.closeDate],
      ["Readiness", f.ready + "%"]
    ].map((row) => "<span>" + row[0] + "</span><div>" + row[1] + "</div>").join("");
    const checks = docs.map((d) => {
      const ok = !f.missing.includes(d);
      return '<label class="check"><input type="checkbox" disabled ' + (ok ? "checked" : "") + "> " + d + (ok ? "" : " (missing)") + "</label>";
    }).join("");
    $("drawer-checks").innerHTML = checks;
    $("drawer-note").textContent = "This file is sample data for illustration. A live build would classify incoming documents and update readiness as packets arrive.";
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
    renderClass();
  }

  $("office").addEventListener("change", (e) => { filterState = e.target.value; render(); });
  $("drawer-back").addEventListener("click", closeDrawer);
  $("drawer-close").addEventListener("click", closeDrawer);
  render();
})();
