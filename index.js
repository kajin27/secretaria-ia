import express from "express";
import { registerConversation } from "./conversationLimiter.js";

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Secretária IA online 🚀");
});

// Webhook de verificação do WhatsApp
app.get("/webhook", (req, res) => {
  const verifyToken = "meu_token_secreto";

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === verifyToken) {
    console.log("Webhook verificado");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Webhook que recebe mensagens (COM LIMITE DE CONVERSAS)
app.post("/webhook", async (req, res) => {
  try {
    // 👉 ajuste este campo se o ID vier com outro nome no WhatsApp
    const companyId = req.body.company_id;

    // registra e valida limite de conversas
    await registerConversation(companyId);

    console.log("Mensagem recebida:");
    console.log(JSON.stringify(req.body, null, 2));

    res.sendStatus(200);
  } catch (err) {
    console.error("Limite de conversas atingido:", err.message);

    res.status(402).json({
      error: "Limite de conversas do plano atingido",
      details: err.message,
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor rodando na porta", PORT);
});
