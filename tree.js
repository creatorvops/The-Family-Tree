const canvas = document.getElementById("tree-canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight - 80;

let view = { x: 0, y: 0, scale: 1 };
let dragging = false;
let dragStart = { x: 0, y: 0 };

let leaves = [];

async function loadTree() {
  const data = await fetch("family.json").then(r => r.json());
  drawTree(data);
  animate();
}

function worldToScreen(x, y) {
  return {
    x: (x - view.x) * view.scale,
    y: (y - view.y) * view.scale
  };
}

function screenToWorld(x, y) {
  return {
    x: x / view.scale + view.x,
    y: y / view.scale + view.y
  };
}

function drawTree(data) {
  leaves = [];

  const trunkX = canvas.width / 2;
  const trunkY = canvas.height - 100;

  drawTrunk(trunkX, trunkY);

  const branches = data.branches || [];
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

  ctx.strokeStyle = "#4e342e";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(...Object.values(worldToScreen(x, y)));
  ctx.lineTo(...Object.values(worldToScreen(endX, endY)));
  ctx.stroke();

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

  ctx.strokeStyle = "#6d4c41";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(...Object.values(worldToScreen(x, y)));
  ctx.lineTo(...Object.values(worldToScreen(endX, endY)));
  ctx.stroke();

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

function drawLabel(text, x, y) {
  const pos = worldToScreen(x, y);
  ctx.fillStyle = "#000";
  ctx.font = `${14 * view.scale}px Arial`;
  ctx.textAlign = "center";
  ctx.fillText(text, pos.x, pos.y);
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  leaves.forEach(leaf => {
    leaf.x += Math.sin(Date.now() * leaf.sway) * 0.3;
  });

  loadTree();
  requestAnimationFrame(animate);
}

/* Zoom */
canvas.addEventListener("wheel", (e) => {
  e.preventDefault();
  const zoom = e.deltaY < 0 ? 1.1 : 0.9;

  const mouse = screenToWorld(e.offsetX, e.offsetY);

  view.scale *= zoom;
  view.x = mouse.x - (e.offsetX / view.scale);
  view.y = mouse.y - (e.offsetY / view.scale);
});

/* Pan */
canvas.addEventListener("mousedown", (e) => {
  dragging = true;
  dragStart = screenToWorld(e.clientX, e.clientY);
});

canvas.addEventListener("mousemove", (e) => {
  if (!dragging) return;
  const pos = screenToWorld(e.clientX, e.clientY);
  view.x -= pos.x - dragStart.x;
  view.y -= pos.y - dragStart.y;
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
