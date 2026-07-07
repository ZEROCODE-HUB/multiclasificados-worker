// Funcion serverless de Vercel (Node.js) para el chat publico del cliente.
// Lee los documentos del proyecto, la actividad del repositorio y el codigo
// fuente desde GitHub API en vivo, y responde usando DeepSeek.
//
// Variables de entorno (Vercel -> Settings -> Environment Variables):
//   DEEPSEEK_API_KEY  (requerida)
//   GITHUB_TOKEN       (opcional — permite leer reports/, commits y codigo en vivo)
//
// El repo se obtiene automaticamente de VERCEL_GIT_REPO_OWNER + VERCEL_GIT_REPO_SLUG
// (inyectadas por Vercel al desplegar desde GitHub).

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { messages, project } = req.body || {};
  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: "Falta 'messages'" });
    return;
  }
  const trimmedMessages = messages.slice(-20);

  const token = process.env.GITHUB_TOKEN;
  const repo = getRepo();

  let docsText = "";
  let githubText = "";
  let sourceText = "";

  if (token && repo) {
    [docsText, githubText, sourceText] = await Promise.all([
      fetchRepoFiles(token, repo).catch(() => ""),
      fetchGitHubContext(token, repo).catch(() => ""),
      fetchSourceCode(token, repo).catch(() => ""),
    ]);
  }

  const system = buildSystemPrompt(project, docsText, githubText, sourceText);

  const deepseekMessages = [{ role: "system", content: system }, ...trimmedMessages];

  try {
    const deepseekResponse = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + process.env.DEEPSEEK_API_KEY,
      },
      body: JSON.stringify({
        model: "deepseek-v4-flash",
        max_tokens: 1000,
        messages: deepseekMessages,
      }),
    });
    const data = await deepseekResponse.json();

    let translated;
    if (data.choices && data.choices[0] && data.choices[0].message) {
      translated = { content: [{ type: "text", text: data.choices[0].message.content }] };
    } else {
      translated = { content: [], error: data.error || "Respuesta inesperada de DeepSeek" };
    }
    res.status(deepseekResponse.status).json(translated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ---------- Repo ----------

function getRepo() {
  const owner = process.env.VERCEL_GIT_REPO_OWNER;
  const slug = process.env.VERCEL_GIT_REPO_SLUG;
  if (owner && slug) return owner + "/" + slug;
  return process.env.GITHUB_REPO;
}

// ---------- System prompt ----------

function buildSystemPrompt(project, docsText, githubText, sourceText) {
  let system =
    "Eres un asistente amable que informa a un cliente externo sobre el estado de su proyecto. " +
    "Responde SOLO con base en la informacion que se muestra abajo. " +
    "Tu tarea principal es COMPARAR lo acordado en los documentos de alcance con lo que realmente " +
    "se ha desarrollado en el codigo. " +
    "Tambien puedes analizar el codigo fuente para detectar posibles errores, inconsistencias o " +
    "funcionalidades faltantes respecto al alcance. " +
    "Se breve, claro y profesional. Si te preguntan algo que no esta cubierto, dilo honestamente " +
    "y ofrece que el equipo lo confirmara. " +
    "Nunca inventes fechas, porcentajes ni detalles que no esten aqui.\n\n";

  if (project) {
    system += "Nombre del proyecto: " + (project.name || "Proyecto") + "\n";
    system += "Estado general: " + (project.health || "En curso") + "\n";
    if (project.updatedAt) system += "Ultima actualizacion: " + project.updatedAt + "\n";
    system += "\n";
  }

  if (docsText) system += "=== DOCUMENTOS DEL PROYECTO ===\n" + docsText + "\n\n";
  if (githubText) system += "=== ACTIVIDAD RECIENTE DEL REPOSITORIO ===\n" + githubText + "\n\n";
  if (sourceText) system += "=== CODIGO FUENTE DEL REPOSITORIO ===\n" + sourceText;

  if (!docsText && !githubText && !sourceText) {
    system += "(No hay informacion del proyecto disponible en este momento. Responde indicando que los datos no estan disponibles.)";
  }

  return system;
}

// ---------- Documentos de reports/ ----------

async function fetchRepoFiles(token, repo) {
  const headers = {
    Authorization: "Bearer " + token,
    Accept: "application/vnd.github+json",
    "User-Agent": "chat-publico-zerocode",
  };

  const listRes = await fetch(
    "https://api.github.com/repos/" + repo + "/contents/reports",
    { headers }
  );
  if (!listRes.ok) return "";

  const files = await listRes.json();
  if (!Array.isArray(files)) return "";

  const mdFiles = files.filter((f) => f.name.endsWith(".md") && f.type === "file");
  if (mdFiles.length === 0) return "";

  const parts = [];
  for (const f of mdFiles) {
    const contentRes = await fetch(
      "https://api.github.com/repos/" + repo + "/contents/reports/" + f.name,
      { headers }
    );
    if (!contentRes.ok) continue;
    const data = await contentRes.json();
    const content = Buffer.from(data.content, "base64").toString("utf-8");
    const label = f.name.replace(/\.md$/i, "");
    parts.push("## " + label + "\n" + content);
  }

  return parts.join("\n\n");
}

// ---------- Commits recientes ----------

async function fetchGitHubContext(token, repo) {
  const headers = {
    Authorization: "Bearer " + token,
    Accept: "application/vnd.github+json",
    "User-Agent": "chat-publico-zerocode",
  };

  const commitsRes = await fetch(
    "https://api.github.com/repos/" + repo + "/commits?per_page=10",
    { headers }
  );

  if (!commitsRes.ok) return "";

  const commits = await commitsRes.json();
  if (!Array.isArray(commits)) return "";

  let text = "Commits recientes:\n";
  commits.forEach((c) => {
    const msg = c.commit && c.commit.message ? c.commit.message.split("\n")[0] : "(sin mensaje)";
    const date = c.commit && c.commit.author ? c.commit.author.date : "";
    text += "- " + msg + " (" + date + ")\n";
  });

  return text;
}

// ---------- Codigo fuente del repositorio ----------

const SOURCE_EXTENSIONS = new Set([".js", ".html", ".css", ".json", ".md", ".mjs", ".cjs", ".ts", ".jsx", ".tsx"]);

async function fetchSourceCode(token, repo) {
  const headers = {
    Authorization: "Bearer " + token,
    Accept: "application/vnd.github+json",
    "User-Agent": "chat-publico-zerocode",
  };

  const treeRes = await fetch(
    "https://api.github.com/repos/" + repo + "/git/trees/main?recursive=1",
    { headers }
  );
  if (!treeRes.ok) return "";

  const treeData = await treeRes.json();
  if (!treeData.tree) return "";

  const blobs = treeData.tree.filter(
    (f) => f.type === "blob" && !f.path.startsWith(".")
  );

  let treeText = "Estructura del repositorio:\n";
  for (const f of blobs) {
    treeText += "  " + f.path + "\n";
  }

  const sourceBlobs = blobs.filter((f) => {
    const dot = f.path.lastIndexOf(".");
    if (dot === -1) return false;
    return SOURCE_EXTENSIONS.has(f.path.slice(dot));
  });

  const MAX_FILES = 30;
  const MAX_LINES_PER_FILE = 300;

  const parts = [];
  for (const f of sourceBlobs.slice(0, MAX_FILES)) {
    const contentRes = await fetch(
      "https://api.github.com/repos/" + repo + "/contents/" + f.path,
      { headers }
    );
    if (!contentRes.ok) continue;
    const data = await contentRes.json();
    if (data.encoding !== "base64" || !data.content) continue;
    const content = Buffer.from(data.content, "base64").toString("utf-8");
    const lines = content.split("\n");
    const truncated = lines.length > MAX_LINES_PER_FILE
      ? lines.slice(0, MAX_LINES_PER_FILE).join("\n") + "\n... (" + (lines.length - MAX_LINES_PER_FILE) + " lineas mas)"
      : content;
    parts.push("### " + f.path + "\n```\n" + truncated + "\n```");
  }

  if (parts.length === 0) return treeText;

  return treeText + "\n\n" + parts.join("\n\n");
}
