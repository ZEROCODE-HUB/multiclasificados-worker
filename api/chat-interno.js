// Funcion serverless de Vercel (Node.js) para el chat interno del equipo.
// Consulta GitHub en vivo (commits, issues, PRs y documentos de reports/) y
// responde usando DeepSeek.
//
// Variables de entorno (Vercel -> Settings -> Environment Variables):
//   DEEPSEEK_API_KEY  (requerida)
//   GITHUB_TOKEN       (requerida — para leer el repo via API)
//   GITHUB_REPO        (opcional — formato "usuario/repo". Por defecto se auto-detecta
//                       de VERCEL_GIT_REPO_OWNER + VERCEL_GIT_REPO_SLUG en Vercel)
//
// Ver README.md para los pasos exactos de como generar cada credencial.

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { messages } = req.body || {};
  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: "Falta 'messages'" });
    return;
  }
  const trimmedMessages = messages.slice(-20);

  const [githubText, docsText] = await Promise.all([
    fetchGitHubContext().catch((e) => "(No se pudo leer GitHub: " + e.message + ")"),
    fetchRepoFiles().catch((e) => "(No se pudieron leer los documentos: " + e.message + ")"),
  ]);

  const repo = getRepo();
  const system =
    "Eres un asistente interno para el equipo del proyecto **Multiclasificados Effe**. Tienes acceso en vivo al repositorio de GitHub del proyecto. Responde preguntas sobre alcance, avance, commits, issues y pull requests usando SOLO la informacion de abajo. Si algo no esta cubierto, dilo honestamente. Se claro y directo, este chat es para el equipo, no para el cliente final.\n\n" +
    "=== PROYECTO: Multiclasificados Effe ===\n\n" +
    "=== GITHUB (" + (repo || "repo no configurado") + ") ===\n" + githubText +
    "\n\n=== DOCUMENTOS DEL PROYECTO (reports/) ===\n" + docsText;

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
        max_tokens: 1200,
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
  if (process.env.GITHUB_REPO) return process.env.GITHUB_REPO;
  const owner = process.env.VERCEL_GIT_REPO_OWNER;
  const slug = process.env.VERCEL_GIT_REPO_SLUG;
  if (owner && slug) return owner + "/" + slug;
  return null;
}

// ---------- GitHub (commits, issues, PRs) ----------

async function fetchGitHubContext() {
  const token = process.env.GITHUB_TOKEN;
  const repo = getRepo();
  if (!token || !repo) return "(GitHub no configurado)";

  const headers = {
    Authorization: "Bearer " + token,
    Accept: "application/vnd.github+json",
    "User-Agent": "chat-interno-zerocode",
  };

  const [commitsRes, issuesRes, prsRes] = await Promise.all([
    fetch("https://api.github.com/repos/" + repo + "/commits?per_page=10", { headers }),
    fetch("https://api.github.com/repos/" + repo + "/issues?state=all&per_page=30&sort=updated&direction=desc", { headers }),
    fetch("https://api.github.com/repos/" + repo + "/pulls?state=all&per_page=10", { headers }),
  ]);

  const commits = commitsRes.ok ? await commitsRes.json() : [];
  const issuesRaw = issuesRes.ok ? await issuesRes.json() : [];
  const prs = prsRes.ok ? await prsRes.json() : [];
  const issues = Array.isArray(issuesRaw) ? issuesRaw.filter((i) => !i.pull_request) : [];

  let text = "Commits recientes:\n";
  if (Array.isArray(commits)) {
    commits.forEach((c) => {
      const msg = c.commit && c.commit.message ? c.commit.message.split("\n")[0] : "(sin mensaje)";
      const date = c.commit && c.commit.author ? c.commit.author.date : "";
      text += "- " + msg + " (" + date + ")\n";
    });
  }

  text += "\nIssues (abiertos y cerrados, mas recientes):\n";
  issues.forEach((i) => {
    const labels = i.labels && i.labels.length ? " {" + i.labels.map(l => l.name).join(", ") + "}" : "";
    text += "- [" + i.state + "]" + labels + " " + i.title + "\n";
  });

  text += "\nPull requests (mas recientes):\n";
  prs.forEach((p) => {
    const estado = p.merged_at ? "merged" : p.state;
    text += "- [" + estado + "] " + p.title + "\n";
  });

  return text;
}

// ---------- Documentos de reports/ (alcance, avance, etc.) ----------

async function fetchRepoFiles() {
  const token = process.env.GITHUB_TOKEN;
  const repo = getRepo();
  if (!token || !repo) return "(repositorio no configurado)";

  const headers = {
    Authorization: "Bearer " + token,
    Accept: "application/vnd.github+json",
    "User-Agent": "chat-interno-zerocode",
  };

  const listRes = await fetch(
    "https://api.github.com/repos/" + repo + "/contents/reports",
    { headers }
  );
  if (!listRes.ok) return "(no se pudo leer la carpeta reports/)";

  const files = await listRes.json();
  if (!Array.isArray(files)) return "(reports/ no es un directorio)";

  const mdFiles = files.filter((f) => f.name === "alcance.md" && f.type === "file");

  if (mdFiles.length === 0) return "(no hay archivos .md en reports/)";

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

  return parts.length ? parts.join("\n\n") : "(no hay archivos .md en reports/)";
}
