let svg;
let viewBox = { x: 0, y: 0, w: 2000, h: 2000 };
let isPanning = false;
let startPan = { x: 0, y: 0 };
let startViewBox = { x: 0, y: 0 };

async function loadTree() {
  const data = await fetch("family.json").then(r => r.json());
  svg = document.getElementById("tree-svg");

  svg.setAttribute("viewBox", `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`);

  drawTrunk();
  drawMainBranches(data.branches);

  setupPanZoom();
  setupSearch();
  setupReset();
}

function drawTrunk() {
  const trunk = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  trunk.setAttribute("x", 950);
  trunk.setAttribute("y", 900);
  trunk.setAttribute("width", 100);
  trunk.setAttribute("height", 300);
  trunk.setAttribute("class", "trunk");
  svg.appendChild(trunk);
}

function drawMainBranches(branches) {
  const centerX = 1000;
  const centerY = 900;

  const angleStep = Math.PI / (branches.length + 1);
  const radius = 450;

  branches.forEach((branch, i) => {
    const angle = -Math.PI / 2 + angleStep * (i + 1);
    const bx = centerX + Math.cos(angle) * radius;
    const by = centerY + Math.sin(angle) * radius;

    drawLine(centerX, centerY, bx, by);
    drawBranch(branch, bx, by);
  });
}

function drawBranch(branch, x, y) {
  addText(branch.name, x, y - 30, "branch-label");

  let expanded = false;
  const group = [];

  const marriages = branch.marriages || [];
  const marriageSpacing = 140;

  marriages.forEach((marriage, i) => {
    const mx = x;
    const my = y + (i + 1) * marriageSpacing;

    const line = drawLine(x, y, mx, my);
    group.push(line);

    const children = marriage.children || [];
    const childSpacing = 110;

    children.forEach((child, j) => {
      const cx = mx + (j - (children.length - 1) / 2) * childSpacing;
      const cy = my + 90;

      const leaf = drawLeaf(child, cx, cy);
      const cline = drawLine(mx, my, cx, cy);

      group.push(leaf, cline);
    });
  });

  group.forEach(el => el.style.display = "none");

  svg.addEventListener("click", (e) => {
    if (e.target.textContent === branch.name) {
      expanded = !expanded;
      group.forEach(el => el.style.display = expanded ? "block" : "none");
    }
  });
}

function drawLeaf(name, x, y) {
  const leaf = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  leaf.setAttribute("cx", x);
  leaf.setAttribute("cy", y);
  leaf.setAttribute("r", 25);
  leaf.setAttribute("class", "leaf");
  svg.appendChild(leaf);

  addText(name, x, y + 5, "label");
  return leaf;
}

function drawLine(x1, y1, x2, y2) {
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", x1);
  line.setAttribute("y1", y1);
  line.setAttribute("x2", x2);
  line.setAttribute("y2", y2);
  line.setAttribute("class", "branch-line");
  svg.appendChild(line);
  return line;
}

function addText(text, x, y, cls) {
  const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
  t.setAttribute("x", x);
  t.setAttribute("y", y);
  t.setAttribute("text-anchor", "middle");
  t.setAttribute("class", cls);
  t.textContent = text;
  svg.appendChild(t);
}

/* Zoom & Pan */

function setupPanZoom() {
  svg.addEventListener("mousedown", (e) => {
    isPanning = true;
    svg.style.cursor = "grabbing";
    startPan = { x: e.clientX, y: e.clientY };
    startViewBox = { x: viewBox.x, y: viewBox.y };
  });

  window.addEventListener("mousemove", (e) => {
    if (!isPanning) return;
    const dx = (startPan.x - e.clientX) * (viewBox.w / svg.clientWidth);
    const dy = (startPan.y - e.clientY) * (viewBox.h / svg.clientHeight);
    viewBox.x = startViewBox.x + dx;
    viewBox.y = startViewBox.y + dy;
    updateViewBox();
  });

  window.addEventListener("mouseup", () => {
    isPanning = false;
    svg.style.cursor = "grab";
  });

  svg.addEventListener("wheel", (e) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    const direction = e.deltaY > 0 ? 1 : -1;
    const factor = direction > 0 ? zoomFactor : 1 / zoomFactor;

    const mx = viewBox.x + (e.offsetX / svg.clientWidth) * viewBox.w;
    const my = viewBox.y + (e.offsetY / svg.clientHeight) * viewBox.h;

    viewBox.w *= factor;
    viewBox.h *= factor;
    viewBox.x = mx - (e.offsetX / svg.clientWidth) * viewBox.w;
    viewBox.y = my - (e.offsetY / svg.clientHeight) * viewBox.h;

    updateViewBox();
  });
}

function updateViewBox() {
  svg.setAttribute("viewBox", `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`);
}

/* Search */

function setupSearch() {
  const input = document.getElementById("search-input");
  const button = document.getElementById("search-button");

  button.addEventListener("click", () => {
    const query = input.value.trim().toLowerCase();
    if (!query) return;

    Array.from(svg.querySelectorAll(".leaf")).forEach(l => l.classList.remove("highlight"));

    const labels = Array.from(svg.querySelectorAll(".label"));
    let firstMatch = null;

    labels.forEach(label => {
      if (label.textContent.toLowerCase().includes(query)) {
        const cx = parseFloat(label.getAttribute("x"));
        const cy = parseFloat(label.getAttribute("y")) - 5;

        const leaf = findLeafAt(cx, cy);
        if (leaf) {
          leaf.classList.add("highlight");
          if (!firstMatch) firstMatch = { x: cx, y: cy };
        }
      }
    });

    if (firstMatch) {
      viewBox.x = firstMatch.x - viewBox.w / 2;
      viewBox.y = firstMatch.y - viewBox.h / 2;
      updateViewBox();
    }
  });
}

function findLeafAt(x, y) {
  const leaves = Array.from(svg.querySelectorAll(".leaf"));
  return leaves.find(leaf => {
    const cx = parseFloat(leaf.getAttribute("cx"));
    const cy = parseFloat(leaf.getAttribute("cy"));
    const r = parseFloat(leaf.getAttribute("r"));
    return Math.hypot(cx - x, cy - y) <= r + 2;
  });
}

/* Reset */

function setupReset() {
  const btn = document.getElementById("reset-view");
  btn.addEventListener("click", () => {
    viewBox = { x: 0, y: 0, w: 2000, h: 2000 };
    updateViewBox();
    Array.from(svg.querySelectorAll(".leaf")).forEach(l => l.classList.remove("highlight"));
  });
}

loadTree();
