(function () {
  const cfg = window.BEA_CONCEPT;
  const products = ["Industrial", "Office", "Retail"];
  const series = {
    Industrial: [6.1, 6.0, 5.8, 5.9, 5.7, 5.6],
    Office: [14.8, 15.1, 15.0, 15.4, 15.6, 15.5],
    Retail: [5.4, 5.3, 5.2, 5.1, 5.2, 5.0]
  };
  const rents = {
    Industrial: [6.4, 6.5, 6.7, 6.8, 6.9, 7.1],
    Office: [22.1, 22.0, 21.8, 21.9, 22.2, 22.4],
    Retail: [18.4, 18.6, 18.7, 18.9, 19.0, 19.2]
  };
  const labels = ["Q1 2025", "Q2 2025", "Q3 2025", "Q4 2025", "Q1 2026", "Q2 2026"];
  const snapshots = [
    { title: "Availability rate", industrial: "5.6%", office: "15.5%", retail: "5.0%" },
    { title: "Asking rent", industrial: "$7.10", office: "$22.40", retail: "$19.20" },
    { title: "Trailing absorption", industrial: "410k sf", office: "18k sf down", retail: "62k sf" },
    { title: "Under construction", industrial: "1.2M sf", office: "90k sf", retail: "140k sf" }
  ];
  const reports = [
    { name: "Monthly Louisville industrial brief", status: "Ready to refresh", when: "November 2026" },
    { name: "Quarterly office overview", status: "Needs new lease comps", when: "Q3 2026" },
    { name: "Client packet: warehouse demand", status: "Draft in review", when: "November 2026" },
    { name: "Retail corridor snapshot", status: "Scheduled", when: "December 2026" }
  ];

  let product = "Industrial";
  let vacChart, rentChart;
  const $ = (id) => document.getElementById(id);

  function chart(id, label, data, color) {
    const existing = id === "vacancy" ? vacChart : rentChart;
    if (existing) existing.destroy();
    const ch = new Chart($(id), {
      type: "line",
      data: {
        labels,
        datasets: [{
          label,
          data,
          borderColor: color,
          backgroundColor: color + "22",
          fill: true,
          tension: 0.3,
          pointRadius: 3
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: false } }
      }
    });
    if (id === "vacancy") vacChart = ch; else rentChart = ch;
  }

  function render() {
    $("kpi-avail").textContent = snapshots[0][product.toLowerCase()];
    $("kpi-rent").textContent = snapshots[1][product.toLowerCase()];
    $("kpi-abs").textContent = snapshots[2][product.toLowerCase()];
    $("kpi-uc").textContent = snapshots[3][product.toLowerCase()];
    $("product-label").textContent = product;
    chart("vacancy", "Availability rate", series[product], "#14867e");
    chart("rents", "Asking rent", rents[product], "#183456");
    $("reports").innerHTML = reports.map((r) =>
      "<tr><td>" + r.name + "</td><td>" + r.status + "</td><td>" + r.when + "</td></tr>"
    ).join("");
  }

  $("office").addEventListener("change", (e) => { product = e.target.value; render(); });
  render();
})();
