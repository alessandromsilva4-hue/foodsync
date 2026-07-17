console.log("ARQUIVO CONSULTA NOVO CARREGADO");
import { db } from "./firebase.js";

import {
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


const resultado = document.getElementById("resultadoEtiqueta");

const parametros = new URLSearchParams(window.location.search);
const codigo = parametros.get("codigo");

// =======================================
// CONVERTER DATA
// =======================================

function converterData(data) {

    if (!data) return null;

    if (typeof data?.toDate === "function") {
        return data.toDate();
    }

    if (data instanceof Date) {
        return data;
    }

    return new Date(data);
}

// =======================================
// FORMATAR DATA
// =======================================

function formatarData(data) {

    const d = converterData(data);

    if (!d || isNaN(d)) {
        return "-";
    }

    return d.toLocaleDateString("pt-BR");
}

// =======================================
// STATUS DA VALIDADE
// =======================================

function verificarValidade(dataValidade) {

    const hoje = new Date();
    hoje.setHours(0,0,0,0);

    const validade = converterData(dataValidade);

    validade.setHours(0,0,0,0);

    const diferenca =
        Math.floor(
            (validade-hoje)/(1000*60*60*24)
        );

    if(diferenca < 0){

        return{
            texto:"🔴 PRODUTO VENCIDO",
            classe:"vencido"
        };

    }

    if(diferenca===0){

        return{
            texto:"🟡 VENCE HOJE",
            classe:"alerta"
        };

    }

    return{

        texto:`🟢 DENTRO DA VALIDADE - ${diferenca} dia(s) restante(s)`,

        classe:"valido"

    };

}

// =======================================
// CONSULTAR ETIQUETA
// =======================================

async function buscarEtiqueta(){

    try{

        if(!codigo){

            resultado.innerHTML =
            "<div class='status vencido'>Etiqueta não encontrada.</div>";

            return;

        }

        const consulta = query(

            collection(db,"etiquetas"),

            where("codigo","==",codigo)

        );

        const snapshot = await getDocs(consulta);

        if(snapshot.empty){

            resultado.innerHTML =
            "<div class='status vencido'>Etiqueta inválida.</div>";

            return;

        }

        const dados = snapshot.docs[0].data();

        const validade = converterData(dados.validade);

        const status =
        verificarValidade(validade);

        resultado.innerHTML = `

<div class="cabecalho-etiqueta">

<h2>🥗 FoodSync</h2>

<span>Controle Inteligente de Validade</span>

</div>

<div class="linha"></div>

<div class="campo">

<strong>Produto:</strong>

${dados.produto || "-"}

</div>

<div class="campo">

<strong>Temperatura:</strong>

${dados.temperatura || "-"}

</div>

<div class="campo">

<strong>Manipulação:</strong>

${formatarData(dados.dataProducao)}

</div>

<div class="campo">

<strong>Validade:</strong>

${formatarData(dados.validade)}

</div>



${dados.unidade || ""}

</div>

<div class="campo">

<strong>Responsável:</strong>

${dados.responsavel || dados.usuario || "-"}

</div>

<div class="campo">

<strong>Observação:</strong>

${dados.observacao || "-"}

</div>

<div class="status ${status.classe}">

${status.texto}

</div>

<div class="linha"></div>

<div id="qrcodeConsulta"></div>

<div class="codigo-etiqueta">

${dados.codigo}

</div>

`;

        const qrDiv =
        document.getElementById("qrcodeConsulta");

        if(qrDiv){

            new QRCode(qrDiv,{

                text:window.location.href,

                width:100,

                height:100,

                correctLevel:QRCode.CorrectLevel.H

            });

        }

    }

    catch(erro){

        console.error("Erro ao consultar:",erro);

        resultado.innerHTML=`

<div class="status vencido">

Erro ao consultar etiqueta

</div>

`;

    }

}

buscarEtiqueta();