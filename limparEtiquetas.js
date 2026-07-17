import { db } from "./firebase.js";

import {
    collection,
    getDocs,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// CONVERTER DATA

function converterData(data){

    if(!data) return null;


    if(typeof data.toDate === "function"){

        return data.toDate();

    }


    return new Date(data);

}



// LIMPAR ETIQUETAS VENCIDAS

async function limparEtiquetas(){


    const confirmar = confirm(
        "Deseja apagar somente etiquetas vencidas?"
    );


    if(!confirmar){

        return;

    }



    try{


        const hoje = new Date();

        hoje.setHours(0,0,0,0);



        const snapshot =
        await getDocs(
            collection(db,"etiquetas")
        );



        let contador = 0;



        for(const item of snapshot.docs){


            const etiqueta =
            item.data();



            const validade =
            converterData(
                etiqueta.validade
            );



            if(validade && validade < hoje){



                await deleteDoc(

                    doc(
                        db,
                        "etiquetas",
                        item.id
                    )

                );


                contador++;


                console.log(
                    "Removida:",
                    etiqueta.produto,
                    etiqueta.codigo
                );


            }


        }



        alert(

            contador +
            " etiquetas vencidas removidas!"

        );



        console.log(
            "Limpeza concluída:",
            contador
        );



    }catch(error){


        console.error(
            "Erro ao limpar etiquetas:",
            error
        );


    }


}



limparEtiquetas();