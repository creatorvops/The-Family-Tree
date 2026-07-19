async function loadTree() {
  const data = await fetch("family.json").then(r => r.json());
  const svg = document.getElementById("tree-svg");

  const startX = 1000;
  const startY = 100;

  drawBranchGroup(data.branches, startX, startY);
}

function drawBranchGroup(branches, x, y) {
  const spacing = 300;

  branches.forEach((branch, i) => {
    const bx = x + (i - branches.length / 2) * spacing;
    const by = y + 200;

    drawBranch(branch, bx, by);

    // Draw trunk connection
    drawLine(x, y, bx, by);
  });
}

function drawBranch(branch, x, y) {
  addText(branch.name, x, y - 20, "branch-label");

  let expanded = false;
  let group = [];

  const toggle = () => {
    expanded = !expanded;
    group.forEach(el => el.style.display = expanded ? "block" : "none");
  };

  // Click to expand/collapse
  svg.addEventListener("click", (e) => {
    if (e.target.textContent === branch.name) toggle();
  });

  branch.marriages.forEach((marriage, i) => {
    const mx = x;
    const my = y + (i + 1) * 150;

    drawLine(x, y, mx, my);

    marriage.children.forEach((child, j) => {
      const cx = mx + (j - marriage.children.length / 2) * 120;
      const cy = my + 100;

      const leaf = drawLeaf(child, cx, cy);
      const line = drawLine(mx, my, cx, cy);

      group.push(leaf, line);
    });
  });

  // Hide children initially
  group.forEach(el => el.style.display = "none");
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
loadTree();
