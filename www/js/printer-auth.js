import { auth } from "./firebase.js";

export async function obterCabecalhosPrinterService() {
    const usuario = auth.currentUser;
    if (!usuario) {
        throw new Error("Entre no Lotrix novamente para autorizar a impressão.");
    }

    const token = await usuario.getIdToken();
    return {
        "Content-Type": "text/plain",
        "Authorization": `Bearer ${token}`
    };
}
