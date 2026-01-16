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
  const verifyToken = process.env.VERIFY_TOKEN;

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
// ✅ Webhook que recebe mensagens (SEM TRAVAR O META)
// ======================================================
app.post("/webhook", async (req, res) => {
  try {
    console.log("📩 Evento recebido do WhatsApp:");
    console.log(JSON.stringify(req.body, null, 2));

    // ✅ Responde 200 rápido pro Meta (isso evita erro e re-tentativas)
    res.sendStatus(200);

    // ======================================================
    // 🔒 LIMITE DE CONVERSAS (OPCIONAL)
    // ======================================================
    // Se você ainda não criou empresa/tabela certinho no Supabase,
    // deixe isso desligado por enquanto.

    const ENABLE_LIMITER = false; // <-- troque pra true quando quiser ligar

    if (ENABLE_LIMITER) {
      const companyId = "3e12f0b7-a1f4-4742-bf08-a454029c0969";
      await registerConversation(companyId);
      console.log("✅ Limite OK: conversa registrada no Supabase");
    }

    // Aqui depois vamos colocar o código que responde a mensagem via WhatsApp API
  } catch (err) {
    console.error("❌ Erro no webhook:", err.message);

    // Mesmo com erro, sempre responde 200 pro Meta não ficar re-enviando
    return;
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Servidor rodando na porta", PORT);
});

