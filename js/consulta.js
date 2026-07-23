console.log("ARQUIVO CONSULTA NOVO CARREGADO");
console.log("TESTE VERSÃO CONSULTA 23/07");
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

console.log("Código recebido pelo QR:", codigo);





// =======================================
// CONVERTER DATA
// =======================================

function formatarData(data){

    if(!data){
        return "-";
    }


    if(typeof data.toDate === "function"){

        return data.toDate()
        .toLocaleDateString("pt-BR");

    }


    if(typeof data === "string"){

        const dataLimpa = data.split("T")[0];

        const partes = dataLimpa.split("-");

        if(partes.length === 3){

            return `${partes[2]}/${partes[1]}/${partes[0]}`;

        }

    }


    return "-";

}
// =======================================
// CONVERTER DATA PARA CÁLCULO
// =======================================

function converterData(data){

    if(!data){
        return null;
    }


    if(typeof data.toDate === "function"){

        return data.toDate();

    }


    if(typeof data === "string"){

        const somenteData = data.substring(0,10);

        const partes = somenteData.split("-");


        if(partes.length === 3){

            return new Date(
                partes[0],
                partes[1] - 1,
                partes[2]
            );

        }

    }


    return new Date(data);

}

// =======================================
// STATUS VALIDADE
// =======================================

function verificarValidade(dataValidade){


    const validade = converterData(dataValidade);


    if(!validade){

        return {

            texto:"",

            classe:""

        };

    }


    const hoje = new Date();

    hoje.setHours(0,0,0,0);

    validade.setHours(0,0,0,0);



    const diferenca = Math.floor(

        (validade - hoje) /

        (1000*60*60*24)

    );



    if(diferenca < 0){

        return {

            texto:"🔴 PRODUTO VENCIDO",

            classe:"vencido"

        };

    }


    if(diferenca === 0){

        return {

            texto:"🟡 VENCE HOJE",

            classe:"alerta"

        };

    }


    return {

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


            resultado.innerHTML = `

            <div class="status vencido">

            Etiqueta não encontrada.

            </div>

            `;


            return;


        }



        const consulta = query(

            collection(db,"etiquetas"),

            where(
                "codigo",
                "==",
                codigo.trim()
            )

        );



        const snapshot = await getDocs(consulta);



        console.log(
            "Quantidade encontrada:",
            snapshot.size
        );



        if(snapshot.empty){


            resultado.innerHTML = `

            <div class="status vencido">

            Etiqueta inválida.

            </div>

            `;


            return;


        }




       const documento = snapshot.docs[0];

console.log("ID DO DOCUMENTO:", documento.id);

const dados = documento.data();

console.log("DADOS LIDOS NO FIRESTORE:", dados);

console.log(
    "DATA PRODUCAO LIDA:",
    dados.dataProducao
);



        const validade = dados.validade;



        const status = verificarValidade(validade);




        resultado.innerHTML = `


<div class="cabecalho-etiqueta">


<h2>🥗 FoodSync</h2>


<span>

Controle Inteligente de Validade

</span>


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

${dados.dataProducao ? formatarData(dados.dataProducao) : "-"}

</div>




<div class="campo">

<strong>Validade:</strong>

${formatarData(
    dados.validade
)}

</div>





<div class="campo">

<strong>Quantidade:</strong>

${dados.quantidade || "-"}
${dados.unidade || ""}

</div>





<div class="campo">

<strong>Lote:</strong>

${dados.lote || dados.codigo || "-"}

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

${dados.codigo || "-"}

</div>



`;






        const qrDiv =
        document.getElementById(
            "qrcodeConsulta"
        );



        if(qrDiv){


            qrDiv.innerHTML = "";


            new QRCode(
                qrDiv,
                {

                    text:
                    window.location.href,


                    width:90,


                    height:90,


                    correctLevel:
                    QRCode.CorrectLevel.H

                }

            );


        }




    }
    catch(erro){


        console.error(
            "Erro ao consultar etiqueta:",
            erro
        );



        resultado.innerHTML = `


        <div class="status vencido">

        Erro ao consultar etiqueta

        </div>


        `;


    }


}



// =======================================
// INICIAR
// =======================================

buscarEtiqueta();