/* ==========================================
   NeoScale
   ASSISTENTE DE VOZ
========================================== */


console.log("NEOSCALE VOZ CARREGADO");




// ==========================================
// CONFIGURA??O DA VOZ
// ==========================================


const configuracaoVoz = {

    ativo: true,

    idioma: "pt-BR",

    // Ritmo levemente mais calmo para uma locu??o natural e acolhedora.
    velocidade: 1,

    // Evita o tom agudo e rob?tico da configura??o anterior.
    tom: 1

};



// ==========================================
// SELE??O DA VOZ
// ==========================================


let vozSelecionada = null;



function escolherVoz(){


    const vozes = window.speechSynthesis?.getVoices() || [];



    const vozesPortugues = vozes.filter((voz) =>

        voz.lang.toLowerCase().startsWith("pt")

    );



    const vozesBrasil = vozesPortugues.filter((voz) =>

        voz.lang.toLowerCase() === "pt-br"

    );



    const nomesPreferidos = [

        "francisca",
        "google portugu\u00eas do brasil",
        "microsoft francisca",
        "microsoft antonio",
        "google portugu\u00eas"

    ];



    vozSelecionada = nomesPreferidos

        .map((nome) => vozesBrasil.find((voz) =>

            voz.name.toLowerCase().includes(nome)

        ))

        .find(Boolean)

        || vozesBrasil[0]

        || vozesPortugues[0]

        || null;


}



if(window.speechSynthesis){


    escolherVoz();



    // Alguns navegadores disponibilizam as vozes de forma ass?ncrona.
    window.speechSynthesis.onvoiceschanged = escolherVoz;


}




// ==========================================
// FUN??O PRINCIPAL DE FALA
// ==========================================


function falar(texto){


    if(!configuracaoVoz.ativo){

        return;

    }



    if(!window.speechSynthesis){


        console.log(
            "Voz não disponível neste navegador"
        );


        return;


    }



    // evita acumular mensagens

    window.speechSynthesis.cancel();




    const mensagem =

    new SpeechSynthesisUtterance(
        texto
    );



    mensagem.lang =

    configuracaoVoz.idioma;



    mensagem.rate =

    configuracaoVoz.velocidade;



    mensagem.pitch =

    configuracaoVoz.tom;




    if(vozSelecionada){

        mensagem.voice = vozSelecionada;

        mensagem.lang = vozSelecionada.lang;

    }



    // Pequena pausa deixa as respostas menos abruptas, no estilo de uma
    // assistente virtual, sem imitar uma voz propriet?ria.
    mensagem.volume = 1;




    window.speechSynthesis.speak(
        mensagem
    );


}









// ==========================================
// MENSAGEM INICIAL
// ==========================================


function iniciarAtendimento(){


    falar(

        "Bem vindo ao NeoScale. Coloque seu prato na balança."

    );


}









// ==========================================
// AGUARDANDO PESO
// ==========================================


function vozAguardandoPeso(){


    falar(

        "Coloque seu prato na balança."

    );


}









// ==========================================
// PESO IDENTIFICADO
// ==========================================


function vozPesoIdentificado(
    peso,
    valor
){


    falar(

`Peso identificado.
${peso} quilogramas.
O valor da sua refeição ? ${valor}.`

    );


}









// ==========================================
// COMANDA IMPRESSA
// ==========================================


function vozComanda(){


    falar(

        "Sua comanda foi impressa. Obrigado pela prefer?ncia. Tenha uma excelente refeição."

    );


}






// ==========================================
// ERRO
// ==========================================


function vozErro(){


    falar(

        "Não foi possível realizar a pesagem. Por favor tente novamente."

    );


}








// ==========================================
// CONTROLE DE VOZ
// ==========================================


function ativarVoz(){


    configuracaoVoz.ativo = true;


}




function desativarVoz(){


    configuracaoVoz.ativo = false;


}









// ==========================================
// EXPORTAR PARA O SISTEMA
// ==========================================


window.NeoVoice = {


    falar,

    iniciarAtendimento,

    vozAguardandoPeso,

    vozPesoIdentificado,

    vozComanda,

    vozErro,

    ativarVoz,

    desativarVoz


};
