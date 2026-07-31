const db = require("./firebase");


async function teste() {

  const produtos = await db
    .collection("produtos")
    .limit(5)
    .get();


  console.log("Produtos encontrados:");

  produtos.forEach((doc) => {

    console.log(doc.id, doc.data());

  });

}


teste();