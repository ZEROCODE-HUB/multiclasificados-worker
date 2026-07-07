// Funcion serverless de Vercel (Node.js). Se despliega sola con solo tener
// este archivo en /api -- Vercel la detecta automaticamente.
//
// Variable de entorno necesaria (Vercel -> Settings -> Environment Variables):
//   DEEPSEEK_API_KEY

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { system, messages } = req.body || {};
  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: "Falta 'messages'" });
    return;
  }

  const trimmedMessages = messages.slice(-20);
  const deepseekMessages = [{ role: "system", content: system || "" }, ...trimmedMessages];

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
