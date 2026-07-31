// =======================================
// FOODSYNC AI API - OLLAMA + FIREBASE
// =======================================

require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const app = express();

app.use(cors());
app.use(express.json());


// =======================================
// FIREBASE ADMIN
// =======================================

const serviceAccount = require("./serviceAccountKey.json");


initializeApp({
  credential: cert(serviceAccount)
});


const db = getFirestore();


console.log("Firebase conectado!");


// =======================================
// BUSCAR DADOS DO FOODSYNC
// =======================================

async function buscarDadosFoodSync(){


  const produtos = await db
    .collection("produtos")
    .get();


  const estoque = await db
    .collection("estoque")
    .get();


  const producoes = await db
    .collection("producoes")
    .get();


  const movimentacoes = await db
    .collection("movimentacoes")
    .get();



  return {


    produtos:
      produtos.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })),


    estoque:
      estoque.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })),


    producoes:
      producoes.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })),


    movimentacoes:
      movimentacoes.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

  };


}



// =======================================
// IA FOODSYNC
// =======================================

app.post("/ia", async (req,res)=>{


try{


const mensagem = req.body.mensagem || "Olá";


// Busca informações reais

const dadosFoodSync =
await buscarDadosFoodSync();



const resposta = await fetch(
"http://localhost:11434/api/chat",
{

method:"POST",

headers:{
"Content-Type":"application/json"
},


body:JSON.stringify({

model:"llama3.1",

stream:false,


messages:[

{
role:"system",

content:

`Você é a IA oficial do sistema FoodSync.

Você deve responder usando os dados reais do restaurante.

Dados atuais do sistema:

${JSON.stringify(dadosFoodSync)}

Ajude com:
- estoque
- produção
- validade
- movimentações
- operação de cozinha.

Nunca invente dados.
Se não encontrar informação, diga que não existe registro.`

},


{
role:"user",
content:mensagem
}


]


})


});


const dados = await resposta.json();



res.json({

sucesso:true,

resposta:
dados.message.content

});



}catch(erro){


console.error(erro);


res.status(500).json({

sucesso:false,

erro:erro.message

});


}


});



// =======================================
// SERVIDOR
// =======================================

const PORT=3000;


app.listen(PORT,()=>{

console.log(
"FoodSync AI rodando na porta 3000"
);

});