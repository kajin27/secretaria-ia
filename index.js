import express from "express";

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

// Webhook que recebe mensagens
app.post("/webhook", (req, res) => {
  console.log("Mensagem recebida:");
  console.log(JSON.stringify(req.body, null, 2));

  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor rodando na porta", PORT);
});
