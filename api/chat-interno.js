// Funcion serverless de Vercel (Node.js) para el chat interno del equipo.
// Consulta GitHub y una carpeta especifica de Google Drive en vivo, y
// responde usando DeepSeek.
//
// Variables de entorno necesarias (Vercel -> Settings -> Environment Variables):
//   DEEPSEEK_API_KEY
//   GITHUB_TOKEN               (Personal Access Token, solo lectura, limitado a 1 repo)
//   GITHUB_REPO                (formato "usuario/repositorio")
//   GOOGLE_SERVICE_ACCOUNT_KEY (el JSON completo de la cuenta de servicio, en una sola linea)
//   GOOGLE_DRIVE_FOLDER_ID     (el ID de la carpeta de Drive a leer)
//
// Ver README.md para los pasos exactos de como generar cada credencial.

const crypto = require("crypto");

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

  const [githubText, driveText] = await Promise.all([
    fetchGitHubContext().catch((e) => "(No se pudo leer GitHub: " + e.message + ")"),
    fetchDriveContext().catch((e) => "(No se pudo leer Google Drive: " + e.message + ")"),
  ]);

  const system =
    "Eres un asistente interno para el equipo del proyecto. Tienes acceso en vivo al repositorio de GitHub y a la carpeta de Google Drive del proyecto. Responde preguntas sobre alcance, avance, commits, issues y pull requests usando SOLO la informacion de abajo. Si algo no esta cubierto, dilo honestamente. Se claro y directo, este chat es para el equipo, no para el cliente final.\n\n" +
    "=== GITHUB (" + (process.env.GITHUB_REPO || "repo no configurado") + ") ===\n" + githubText +
    "\n\n=== GOOGLE DRIVE (carpeta del proyecto) ===\n" + driveText;

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

// ---------- GitHub ----------

async function fetchGitHubContext() {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  if (!token || !repo) return "(GitHub no configurado)";

  const headers = {
    Authorization: "Bearer " + token,
    Accept: "application/vnd.github+json",
    "User-Agent": "chat-interno-zerocode",
  };

  const [commitsRes, issuesRes, prsRes] = await Promise.all([
    fetch("https://api.github.com/repos/" + repo + "/commits?per_page=10", { headers }),
    fetch("https://api.github.com/repos/" + repo + "/issues?state=all&per_page=15", { headers }),
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
    text += "- [" + i.state + "] " + i.title + "\n";
  });

  text += "\nPull requests (mas recientes):\n";
  prs.forEach((p) => {
    const estado = p.merged_at ? "merged" : p.state;
    text += "- [" + estado + "] " + p.title + "\n";
  });

  return text;
}

// ---------- Google Drive ----------

async function fetchDriveContext() {
  const saKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!saKey || !folderId) return "(Google Drive no configurado)";

  const accessToken = await getGoogleAccessToken(saKey);
  const query = "'" + folderId + "' in parents and trashed = false";
  const listUrl =
    "https://www.googleapis.com/drive/v3/files?q=" + encodeURIComponent(query) +
    "&fields=" + encodeURIComponent("files(id,name,mimeType)") + "&pageSize=50";

  const listRes = await fetch(listUrl, { headers: { Authorization: "Bearer " + accessToken } });
  const listData = await listRes.json();

  if (!listData.files || listData.files.length === 0) {
    return "(La carpeta esta vacia o la cuenta de servicio no tiene acceso a ella)";
  }

  const parts = [];
  for (const f of listData.files) {
    let content = "";
    try {
      if (f.mimeType === "application/vnd.google-apps.document") {
        const exportRes = await fetch(
          "https://www.googleapis.com/drive/v3/files/" + f.id + "/export?mimeType=text/plain",
          { headers: { Authorization: "Bearer " + accessToken } }
        );
        content = await exportRes.text();
      } else if (f.mimeType === "text/plain" || f.mimeType === "text/markdown" || /\.(md|txt)$/i.test(f.name)) {
        const mediaRes = await fetch(
          "https://www.googleapis.com/drive/v3/files/" + f.id + "?alt=media",
          { headers: { Authorization: "Bearer " + accessToken } }
        );
        content = await mediaRes.text();
      } else {
        content = "(tipo de archivo no soportado para lectura automatica: " + f.mimeType + ")";
      }
    } catch (e) {
      content = "(no se pudo leer este archivo)";
    }
    parts.push("## " + f.name + "\n" + content);
  }
  return parts.join("\n\n");
}

async function getGoogleAccessToken(serviceAccountJson) {
  const key = JSON.parse(serviceAccountJson);
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claimSet = {
    iss: key.client_email,
    scope: "https://www.googleapis.com/auth/drive.readonly",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const encHeader = base64url(JSON.stringify(header));
  const encClaim = base64url(JSON.stringify(claimSet));
  const signInput = encHeader + "." + encClaim;

  const signer = crypto.createSign("RSA-SHA256");
  signer.update(signInput);
  signer.end();
  const signature = signer.sign(key.private_key); // Buffer

  const jwt = signInput + "." + base64url(signature);

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body:
      "grant_type=" + encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer") +
      "&assertion=" + encodeURIComponent(jwt),
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    throw new Error("No se pudo autenticar con Google (" + JSON.stringify(tokenData) + ")");
  }
  return tokenData.access_token;
}

function base64url(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input, "utf8");
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
