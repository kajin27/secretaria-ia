import express from "express";
import OpenAI from "openai";

const app = express();
app.use(express.json());

const {
  VERIFY_TOKEN,
  WHATSAPP_TOKEN,
  WHATSAPP_PHONE_NUMBER_ID,
  OPENAI_API_KEY,
} = process.env;

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

app.get("/", (req, res) => {
  res.send("Secretária IA online 🚀");
});

// ======================================================
// ✅ Webhook verificação Meta
// ======================================================
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (!VERIFY_TOKEN) {
    console.log("❌ VERIFY_TOKEN não configurado no Railway");
    return res.sendStatus(500);
  }

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verificado com sucesso!");
    return res.status(200).send(challenge);
  }

  console.log("❌ Falha na verificação do webhook");
  return res.sendStatus(403);
});

// ======================================================
// ✅ Função pra responder no WhatsApp
// ======================================================
async function sendWhatsAppMessage(to, text) {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    throw new Error("WHATSAPP_TOKEN ou WHATSAPP_PHONE_NUMBER_ID não configurados");
  }

  const url = `https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body: text },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    console.log("❌ Erro ao enviar WhatsApp:", data);
    throw new Error("Erro ao enviar mensagem no WhatsApp");
  }

  return data;
}

// ======================================================
// ✅ Webhook recebe mensagens
// ======================================================
app.post("/webhook", async (req, res) => {
  try {
    // Meta exige 200 rápido
    res.sendStatus(200);

    const entry = req.body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    const message = value?.messages?.[0];
    const contact = value?.contacts?.[0];

    if (!message) return;

    const from = message.from; // número do usuário
    const text = message?.text?.body;

    console.log("📩 Mensagem recebida:", { from, text });

    // se não for texto, ignora
    if (!text) {
      await sendWhatsAppMessage(from, "Recebi sua mensagem 🙂 (por enquanto só entendo texto)");
      return;
    }

    if (!OPENAI_API_KEY) {
      await sendWhatsAppMessage(from, "❌ OPENAI_API_KEY não configurada no servidor");
      return;
    }

    // chama OpenAI
    const aiResponse = await openai.responses.create({
      model: "gpt-5-mini",
      input: `Você é uma secretária virtual simpática e objetiva.
Responda de forma curta e clara.

Mensagem do cliente: "${text}"`,
    });

    const reply =
      aiResponse.output_text?.trim() ||
      "Desculpa, não consegui responder agora 😅";

    // responde no WhatsApp
    await sendWhatsAppMessage(from, reply);

    console.log("✅ Resposta enviada com sucesso!");
  } catch (err) {
    console.error("❌ Erro no webhook:", err.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Servidor rodando na porta", PORT);
});
