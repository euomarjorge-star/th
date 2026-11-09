/**
 * Build de produção (Vercel/local): compila o painel /admin com o Vite
 * (saída em dist/) e depois copia o funil estático (index.html, assets/,
 * favicon, fontes, imagens etc.) para dentro da mesma pasta dist/.
 *
 * Por quê: o Vercel serve o outputDirectory como estático e só cai no
 * rewrite da função serverless para caminhos que NÃO existem fisicamente
 * ali — por isso tudo que o funil precisa tem que estar dentro de dist/,
 * não só o que o Vite gera para o admin.
 */
const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const DIST = path.join(ROOT, "dist");

execSync("npx vite build", { cwd: ROOT, stdio: "inherit" });

const FUNIL_FILES = ["index.html", "favicon.png", "cnh-brasil-logo.png"];
const FUNIL_DIRS = ["assets", "fonts", "img", "comp", "contrato-oferta", "cdn.jsdelivr.net"];

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

for (const file of FUNIL_FILES) {
  const src = path.join(ROOT, file);
  if (fs.existsSync(src)) copyRecursive(src, path.join(DIST, file));
}

for (const dir of FUNIL_DIRS) {
  const src = path.join(ROOT, dir);
  if (fs.existsSync(src)) copyRecursive(src, path.join(DIST, dir));
}

console.log("✓ Funil copiado para dist/ junto com o painel /admin");
