// =======================================
// FOODSYNC - AI FUNCTION
// =======================================

require("dotenv").config();

const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

setGlobalOptions({
  maxInstances: 10,
});


// =======================================
// FOODSYNC AI - TESTE OPENAI
// =======================================

exports.foodsyncAI = onRequest(async (req, res) => {
  try {
    logger.info("FoodSync AI chamada");

    const mensagem = req.body.mensagem || "Olá";

    const resposta = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "Você é a inteligência artificial do sistema FoodSync. " +
            "Ajude com produção, estoque, validade e operação de restaurante.",
        },
        {
          role: "user",
          content: mensagem,
        },
      ],
    });

    res.json({
      sucesso: true,
      mensagemRecebida: mensagem,
      resposta: resposta.choices[0].message.content,
    });
  } catch (error) {
    logger.error("Erro FoodSync AI:", error);

    res.status(500).json({
      sucesso: false,
      erro: error.message,
    });
  }
});
