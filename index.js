import express from "express";
import { registerConversation } from "./conversationLimiter.js";

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Secretária IA online 🚀");
});

// ======================================================
// ✅ Webhook de verificação do WhatsApp (Meta)
// ======================================================
app.get("/webhook", (req, res) => {
  const verifyToken = process.env.VERIFY_TOKEN; // <- vem do Railway Variables

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  console.log("📩 Verificação recebida do Meta:", { mode, token });

  if (!verifyToken) {
    console.log("❌ ERRO: VERIFY_TOKEN não está configurado no Railway");
    return res.sendStatus(500);
  }

  if (mode === "subscribe" && token === verifyToken) {
    console.log("✅ Webhook verificado com sucesso!");
    return res.status(200).send(challenge);
  } else {
    console.log("❌ Falha na verificação do webhook (token incorreto)");
    return res.sendStatus(403);
  }
});

// ======================================================
// ✅ Webhook que recebe mensagens (COM LIMITE)
// ======================================================
app.post("/webhook", async (req, res) => {
  try {
    // 🔒 company_id FIXO para teste de limite
    const companyId = "3e12f0b7-a1f4-4742-bf08-a454029c0969";

    // registra e valida limite de conversas
    await registerConversation(companyId);

    console.log("📩 Mensagem recebida:");
    console.log(JSON.stringify(req.body, null, 2));

    return res.sendStatus(200);
  } catch (err) {
    console.error("🚫 Limite de conversas atingido:", err.message);

    return res.status(402).json({
      error: "Limite de conversas do plano atingido",
      details: err.message,
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Servidor rodando na porta", PORT);
});

