import { db } from "./firebase.js";

import {
    collection,
    getDocs,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


async function limparEtiquetas(){

    const confirmar = confirm(
        "Deseja apagar TODAS as etiquetas?"
    );

    if(!confirmar){
        return;
    }


    try{

        const snapshot =
        await getDocs(
            collection(db,"etiquetas")
        );


        let contador = 0;


        for(const item of snapshot.docs){

            await deleteDoc(
                doc(
                    db,
                    "etiquetas",
                    item.id
                )
            );

            contador++;

        }


        alert(
            contador + " etiquetas removidas com sucesso!"
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