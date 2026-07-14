// =======================================
// FOODSYNCH - USUÁRIOS
// =======================================


import { db } from "./firebase.js";


import {

    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    serverTimestamp

}

from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";







const usuarioForm =
document.getElementById("usuarioForm");


const listaUsuarios =
document.getElementById("listaUsuarios");







// =======================================
// CADASTRAR USUÁRIO
// =======================================


if(usuarioForm){



usuarioForm.addEventListener(

"submit",

async(e)=>{


e.preventDefault();





const usuario = {



nome:
document.getElementById(
"nomeUsuario"
).value,



email:
document.getElementById(
"emailUsuario"
).value,



perfil:
document.getElementById(
"perfilUsuario"
).value,



status:
document.getElementById(
"statusUsuario"
).value,



criadoEm:
serverTimestamp()



};







try{


await addDoc(

collection(db,"usuarios"),

usuario

);





alert(
"Usuário cadastrado!"
);



usuarioForm.reset();



carregarUsuarios();




}catch(error){



console.error(
"Erro usuário:",
error
);



}



});


}









// =======================================
// LISTAR USUÁRIOS
// =======================================


async function carregarUsuarios(){



if(!listaUsuarios)
return;





listaUsuarios.innerHTML="";



const dados =
await getDocs(
collection(db,"usuarios")
);






if(dados.empty){


listaUsuarios.innerHTML = `


<tr>

<td colspan="5">

Nenhum usuário cadastrado

</td>

</tr>


`;

return;


}







dados.forEach(item=>{


const u =
item.data();




listaUsuarios.innerHTML += `


<tr>



<td>

${u.nome || "-"}

</td>



<td>

${u.email || "-"}

</td>



<td>

${u.perfil || "-"}

</td>



<td>

${u.status || "-"}

</td>



<td>


<button

onclick="excluirUsuario('${item.id}')">

🗑️

</button>


</td>



</tr>


`;



});



}









// =======================================
// EXCLUIR USUÁRIO
// =======================================


window.excluirUsuario =
async function(id){



if(!confirm(
"Deseja excluir este usuário?"
))

return;






try{


await deleteDoc(

doc(

db,

"usuarios",

id

)

);



carregarUsuarios();




}catch(error){


console.error(
"Erro excluir usuário:",
error
);



}



};








// =======================================
// INICIAR
// =======================================


document.addEventListener(

"DOMContentLoaded",

()=>{


carregarUsuarios();


}

);