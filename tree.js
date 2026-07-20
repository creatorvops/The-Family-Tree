const canvas = document.getElementById("tree-canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight - 80;

let view = { x: 0, y: 0, scale: 1 };
let dragging = false;
let dragStart = { x: 0, y: 0 };

let leaves = [];
let treeData = null;

async function loadTree() {
  treeData = await fetch("family.json").then(r => r.json());
  draw();
  requestAnimationFrame(animate);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const trunkX = canvas.width / 2;
  const trunkY = canvas.height - 100;

  drawTrunk(trunkX, trunkY);

  const branches = treeData.branches || [];
  const angleStep = Math.PI / (branches.length + 1);

  branches.forEach((branch, i) => {
    const angle = -Math.PI / 2 + angleStep * (i + 1);
    drawBranch(branch, trunkX, trunkY - 200, angle, 200);
  });
}

function drawTrunk(x, y) {
  ctx.fillStyle = "#5d4037";
  ctx.fillRect(x - 40, y - 200, 80, 200);
}

function drawBranch(branch, x, y, angle, length) {
  const endX = x + Math.cos(angle) * length;
  const endY = y + Math.sin(angle) * length;

  drawLine(x, y, endX, endY, 8);

  drawLabel(branch.name, endX, endY);

  let marriages = branch.marriages || [];
  marriages.forEach((marriage, i) => {
    const childAngle = angle - 0.4 + (i * 0.4);
    drawMarriage(marriage, endX, endY, childAngle, 150);
  });
}

function drawMarriage(marriage, x, y, angle, length) {
  const endX = x + Math.cos(angle) * length;
  const endY = y + Math.sin(angle) * length;

  drawLine(x, y, endX, endY, 4);

  const children = marriage.children || [];
  children.forEach((child, i) => {
    const leafAngle = angle - 0.3 + (i * 0.3);
    drawLeaf(child, endX, endY, leafAngle, 80);
  });
}

function drawLeaf(name, x, y, angle, length) {
  const lx = x + Math.cos(angle) * length;
  const ly = y + Math.sin(angle) * length;

  leaves.push({ name, x: lx, y: ly, sway: Math.random() * 0.02 });

  drawLabel(name, lx, ly);
}

function drawLine(x1, y1, x2, y2, width) {
  ctx.strokeStyle = "#4e342e";
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo((x1 - view.x) * view.scale, (y1 - view.y) * view.scale);
  ctx.lineTo((x2 - view.x) * view.scale, (y2 - view.y) * view.scale);
  ctx.stroke();
}

function drawLabel(text, x, y) {
  ctx.fillStyle = "#000";
  ctx.font = `${14 * view.scale}px Arial`;
  ctx.textAlign = "center";
  ctx.fillText(text, (x - view.x) * view.scale, (y - view.y) * view.scale);
}

function animate() {
  leaves.forEach(leaf => {
    leaf.x += Math.sin(Date.now() * leaf.sway) * 0.3;
  });

  draw();
  requestAnimationFrame(animate);
}

/* Zoom */
canvas.addEventListener("wheel", (e) => {
  e.preventDefault();
  const zoom = e.deltaY < 0 ? 1.1 : 0.9;

  const mouseX = e.offsetX / view.scale + view.x;
  const mouseY = e.offsetY / view.scale + view.y;

  view.scale *= zoom;

  view.x = mouseX - e.offsetX / view.scale;
  view.y = mouseY - e.offsetY / view.scale;
});

/* Pan */
canvas.addEventListener("mousedown", (e) => {
  dragging = true;
  dragStart = { x: e.clientX, y: e.clientY };
});

canvas.addEventListener("mousemove", (e) => {
  if (!dragging) return;

  const dx = (e.clientX - dragStart.x) / view.scale;
  const dy = (e.clientY - dragStart.y) / view.scale;

  view.x -= dx;
  view.y -= dy;

  dragStart = { x: e.clientX, y: e.clientY };
});

canvas.addEventListener("mouseup", () => dragging = false);

/* Search */
document.getElementById("search-button").addEventListener("click", () => {
  const query = document.getElementById("search-input").value.toLowerCase();
  const match = leaves.find(l => l.name.toLowerCase().includes(query));

  if (match) {
    view.x = match.x - canvas.width / (2 * view.scale);
    view.y = match.y - canvas.height / (2 * view.scale);
  }
});

/* Reset */
document.getElementById("reset-view").addEventListener("click", () => {
  view = { x: 0, y: 0, scale: 1 };
});

loadTree();
