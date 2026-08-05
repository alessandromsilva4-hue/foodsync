// =======================================
// FOODSYNC AI API - GROQ + FIREBASE
// =======================================

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const app = express();

app.use(cors());
app.use(express.json());

// =======================================
// GROQ
// =======================================

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
});

// =======================================
// FIREBASE ADMIN
// =======================================

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  serviceAccount = require("./serviceAccountKey.json");
}

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

console.log("Firebase conectado!");

// =======================================
// BUSCAR DADOS DO FOODSYNC
// =======================================

async function buscarDadosFoodSync() {

  const produtos = await db.collection("produtos").get();
  const estoque = await db.collection("estoque").get();
  const producoes = await db.collection("producoes").get();
  const movimentacoes = await db.collection("movimentacoes").get();

  return {

    produtos: produtos.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })),

    estoque: estoque.docs.map(doc => {
  const data = doc.data();

  return {
    id: doc.id,
    produto: data.produto,
    quantidade: data.quantidade,
    unidade: data.unidade,
    minimo: data.minimo,
    maximo: data.maximo
  };
}),

    producoes: producoes.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })),

    movimentacoes: movimentacoes.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

  };

}
// =======================================
// IA FOODSYNC
// =======================================

app.post("/ia", async (req, res) => {

  try {

    const mensagem = req.body.mensagem || "Olá";

    // Buscar dados reais do sistema
    const dadosFoodSync = await buscarDadosFoodSync();

    const prompt = `
Você é a inteligência artificial oficial do FoodSync.

Você trabalha como assistente de gestão de restaurantes.

Utilize SOMENTE os dados reais abaixo para responder.

Dados do sistema:

ESTOQUE ATUAL:
${JSON.stringify(dadosFoodSync.estoque, null, 2)}

PRODUTOS:
${JSON.stringify(dadosFoodSync.produtos, null, 2)}

PRODUÇÕES:
${JSON.stringify(dadosFoodSync.producoes, null, 2)}

MOVIMENTAÇÕES:
${JSON.stringify(dadosFoodSync.movimentacoes, null, 2)}

Você pode responder perguntas sobre:

- Produtos
- Estoque
- Produção
- Validade
- Movimentações
- Operação da cozinha
- Controle de alimentos

Para perguntas de estoque:
- Use obrigatoriamente os dados da seção "estoque".
- O campo quantidade representa o estoque atual.
- Mostre produto, quantidade e unidade.
- Compare com mínimo e máximo quando solicitado.

Regras:

- Nunca invente informações.
- Sempre responda diretamente a pergunta do usuário.
- Se uma coleção estiver vazia, informe que não existem registros naquela categoria.
- Nunca diga que não existe estoque se houver produtos dentro da seção estoque.
- Nunca responda apenas com cumprimentos quando o usuário fizer uma pergunta operacional.
- Responda sempre em português.
- Seja objetivo e organizado.
IMPORTANTE:
Quando o usuário perguntar sobre estoque, utilize somente a seção ESTOQUE ATUAL.
O campo "quantidade" representa a quantidade disponível.
Se existir qualquer registro em ESTOQUE ATUAL, nunca diga que não existem registros.

Pergunta do usuário:

${mensagem}
`;

    const completion = await client.chat.completions.create({

      model: "llama-3.3-70b-versatile",

      temperature: 0.2,

      messages: [
        {
          role: "system",
          content: "Você é a IA oficial do FoodSync."
        },
        {
          role: "user",
          content: prompt
        }
      ]

    });

    const resposta = completion.choices[0].message.content;

    res.json({
      sucesso: true,
      resposta
    });

  } catch (erro) {

    console.error("Erro na IA:", erro);

    res.status(500).json({
      sucesso: false,
      erro: erro.message
    });

  }

});
// =======================================
// ROTA DE TESTE
// =======================================

app.get("/", (req, res) => {

  res.json({
    sucesso: true,
    sistema: "Lotrix AI",
    ia: "Groq",
    modelo: "llama-3.3-70b-versatile",
    status: "online"
  });

});

// =======================================
// SERVIDOR
// =======================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log("==================================");
  console.log(" Lotrix AI iniciado");
  console.log("==================================");
  console.log(` Porta: ${PORT}`);
  console.log(" IA: Groq");
  console.log(" Modelo: llama-3.3-70b-versatile");
  console.log(" Firebase conectado");
  console.log("==================================");

});