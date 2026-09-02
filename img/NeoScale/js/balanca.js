/* ==========================================
   NeoScale
   BALANCA.JS
========================================== */


console.log("NEOSCALE BALANCA CARREGADA");





// ==========================================
// CONFIGURA??O
// ==========================================


const balanca = {


    conectado:false,


    porta:null,


    modo:"manual"


};






// ==========================================
// CONECTAR BALAN?A SERIAL
// ==========================================


async function conectarSerial(){


    try{


        if(!("serial" in navigator)){


            alert(
            "Navegador sem suporte ? balan?a."
            );


            return;


        }



        const porta =

        await navigator.serial
        .requestPort();



        await porta.open({

            baudRate:9600

        });



        balanca.porta = porta;

        balanca.conectado = true;



        console.log(
        "Balan?a conectada"
        );



        lerPeso();



    }


    catch(error){


        console.error(
            "Erro conex?o:",
            error
        );


    }


}







// ==========================================
// LER DADOS DA BALAN?A
// ==========================================


async function lerPeso(){



    const decoder =

    new TextDecoder();



    while(
        balanca.porta &&
        balanca.conectado
    ){



        const reader =

        balanca.porta
        .readable
        .getReader();




        try{



            while(true){


                const {

                    value,

                    done

                }

                =

                await reader.read();




                if(done)

                break;




                const dados =

                decoder.decode(
                    value
                );




                processarPeso(
                    dados
                );



            }



        }


        finally{


            reader.releaseLock();


        }



    }



}








// ==========================================
// TRATAR PESO RECEBIDO
// ==========================================


function processarPeso(valor){



    console.log(

        "Dados balan?a:",

        valor

    );



    /*
    
    Exemplos recebidos:

    0.428
    0428
    000428

    Cada fabricante muda o formato.

    */


    let peso =

    parseFloat(
        valor
    );





    if(
        isNaN(peso)
    )

    return;





    // ajuste se vier em gramas

    if(
        peso > 10
    ){


        peso =

        peso / 1000;


    }




    if(
        typeof atualizarPeso ===
        "function"
    ){


        atualizarPeso(
            peso
        );


    }



}






// ==========================================
// SIMULA??O
// ==========================================


function iniciarSimulacao(){


console.log(
"Modo simula??o ativo"
);



setInterval(()=>{


const peso =


Math.random()

*

(0.900-0.100)

+

0.100;



processarPeso(

peso.toFixed(3)

);



},5000);



}







// ==========================================
// IN?CIO
// ==========================================


document.addEventListener(

"DOMContentLoaded",

()=>{


    iniciarSimulacao();


});