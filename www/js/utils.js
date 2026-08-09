// =======================================
// FOODSYNC - UTILITÁRIOS
// =======================================

export function mostrarToast(
mensagem,
tipo="sucesso"
){

let container =
document.querySelector(".toast-container");

if(!container){

container =
document.createElement("div");

container.className =
"toast-container";

document.body.appendChild(container);

}

const toast =
document.createElement("div");

toast.className =
`toast ${tipo}`;

toast.innerHTML =
mensagem;

container.appendChild(toast);

setTimeout(()=>{

toast.remove();

},3000);

}