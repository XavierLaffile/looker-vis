// Écouter les données de Looker Studio
function getData() {
  dscc.subscribeToData(function(data) {
    renderChart(data);
  }, {transform: dscc.objectTransform});
}

// Rendu du graphique
function renderChart(data) {
  const parsedData = data.rows.map(row => ({
    date: row[0], // Dimension : Date
    competitor: row[1], // Dimension : Compétiteur
    metric: parseFloat(row[2]), // Métrique choisie par l'utilisateur
    logo: row[3] // Dimension : Logo URL
  }));

  // Récupérer les paramètres de style
  const style = data.style || {};
  const mainCompetitor = style.mainCompetitor ? style.mainCompetitor.value : "Concurrent A"; // Par défaut : Concurrent A
  const mainColor = style.mainColor ? style.mainColor.value : "#1f77b4"; // Couleur par défaut
  const mainStrokeWidth = style.mainStrokeWidth ? style.mainStrokeWidth.value : 4; // Épaisseur par défaut
  const otherColor = style.otherColor ? style.otherColor.value : "#2ca02c"; // Couleur par défaut
  const otherStrokeWidth = style.otherStrokeWidth ? style.otherStrokeWidth.value : 2; // Épaisseur par défaut

  // Dimensions
  const margin = { top: 20, right: 80, bottom: 50, left: 50 };
  const width = 600 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  // Nettoyer le conteneur
  d3.select("#chart").selectAll("*").remove();
  const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Échelles
  const x = d3.scaleTime()
    .domain(d3.extent(parsedData, d => new Date(d.date)))
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([d3.min(parsedData, d => d.metric) - 100, d3.max(parsedData, d => d.metric) + 100])
    .range([height, 0]);

  // Ligne lissée
  const line = d3.line()
    .x(d => x(new Date(d.date)))
    .y(d => y(d.metric))
    .curve(d3.curveCatmullRom);

  // Dessiner les lignes
  const competitors = [...new Set(parsedData.map(d => d.competitor))];
  competitors.forEach(competitor => {
    const competitorData = parsedData.filter(d => d.competitor === competitor);
    const isMain = competitor === mainCompetitor;
    svg.append("path")
      .datum(competitorData)
      .attr("class", isMain ? "line main-competitor" : "line other-competitor")
      .attr("d", line)
      .style("stroke", isMain ? mainColor : otherColor)
      .style("stroke-width", isMain ? mainStrokeWidth : otherStrokeWidth);

    // Ajouter le logo
    const lastPoint = competitorData[competitorData.length - 1];
    svg.append("image")
      .attr("xlink:href", lastPoint.logo)
      .attr("x", x(new Date(lastPoint.date)) + 5)
      .attr("y", y(lastPoint.metric) - (isMain ? 20 : 15))
      .attr("width", isMain ? 40 : 20)
      .attr("height", isMain ? 40 : 20)
      .on("error", () => console.error(`Erreur pour ${lastPoint.logo}`));
  });

  // Axes
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .append("text")
    .attr("x", width / 2)
    .attr("y", 40)
    .attr("fill", "#000")
    .text("Date");

  svg.append("g")
    .call(d3.axisLeft(y))
    .append("text")
    .attr("x", -height / 2)
    .attr("y", -40)
    .attr("fill", "#000")
    .attr("transform", "rotate(-90)")
    .text("Métrique");
}

// Charger la bibliothèque dscc pour Looker Studio
(function() {
  const script = document.createElement('script');
  script.src = 'https://datastudio.google.com/static/reporting/vis/dscc.min.js';
  script.async = true;
  script.onload = () => getData();
  document.head.appendChild(script);
})();
