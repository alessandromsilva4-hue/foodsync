import { db } from "./firebase.js";
import {
    collection,
    getDocs,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const tabela =
document.getElementById("tabelaHistorico");

const totalEtiquetas =
document.getElementById("totalEtiquetas");

const totalValidas =
document.getElementById("totalValidas");

const totalHoje =
document.getElementById("totalHoje");

const totalVencidas =
document.getElementById("totalVencidas");


// ===============================
// VERIFICAR STATUS
// ===============================

function verificarStatus(dataValidade){

    const hoje = new Date();

    hoje.setHours(0,0,0,0);

    const validade = new Date(dataValidade);

    validade.setHours(0,0,0,0);

    const dias =
    (validade-hoje)/(1000*60*60*24);

    if(dias < 0){

        return{

            texto:"Vencido",

            classe:"vencido"

        };

    }

    if(dias === 0){

        return{

            texto:"Vence Hoje",

            classe:"alerta"

        };

    }

    return{

        texto:"Válido",

        classe:"valido"

    };

}


// ===============================
// CARREGAR HISTÓRICO
// ===============================

async function carregarHistorico(){

    try{

   const snapshot = await getDocs(
    collection(db,"etiquetas")
);

        tabela.innerHTML = "";

        let validas = 0;
        let hoje = 0;
        let vencidas = 0;
        let total = 0;

        snapshot.forEach((doc)=>{

    const dados = doc.data();

   


    // ===============================
    // VALIDAR CAMPOS OBRIGATÓRIOS
    // ===============================

if(!dados.validade){

    return;

}


if(!dados.produto && !dados.Produto){

    return;

}

    const dataValidade =
dados.validade?.toDate
    ? dados.validade.toDate()
    : new Date(dados.validade);


if(isNaN(dataValidade)){

    return;

}


total++;




const dataProducao =
dados.dataProducao
    ? (
        dados.dataProducao.toDate
        ? dados.dataProducao.toDate()
        : new Date(dados.dataProducao)
      )
    : null;




const status =
verificarStatus(dataValidade);

            if(status.classe==="valido") validas++;

            if(status.classe==="alerta") hoje++;

            if(status.classe==="vencido") vencidas++;

            tabela.innerHTML += `

            <tr>

                <td>${dados.produto || dados.Produto || "-"}</td>

                <td>${dados.lote || "-"}</td>

                
<td>

${dataProducao 
? dataProducao.toLocaleDateString("pt-BR")
: "-"
}

</td>

                <td>
${dataValidade.toLocaleDateString("pt-BR")}

                </td>

                <td>

                    <span class="status ${status.classe}">

                        ${status.texto}

                    </span>

                </td>

                <td>

                    <div class="acoes">

                        <button
                        class="btn btn-ver"
                        onclick="window.open('consulta.html?codigo=${dados.codigo}')">

                        👁️

                        </button>

                        <button
                        class="btn btn-print"
                        onclick="window.open('consulta.html?codigo=${dados.codigo}')">

                        🖨️

                        </button>

                    </div>

                </td>

            </tr>

            `;

        });

        totalEtiquetas.textContent = total;

        totalValidas.textContent = validas;

        totalHoje.textContent = hoje;

        totalVencidas.textContent = vencidas;

    }catch(erro){

        console.error(
            "Erro ao carregar histórico:",
            erro
        );

    }

}
   



carregarHistorico();
