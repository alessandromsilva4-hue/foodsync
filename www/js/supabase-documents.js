// Read adapters for the temporary JSONB document store. This keeps Firebase
// document IDs and restores the Firestore date markers emitted by the exporter.
import { supabase } from "./supabase.js";

function decodificarValorFirestore(valor) {
    if (Array.isArray(valor)) return valor.map(decodificarValorFirestore);
    if (!valor || typeof valor !== "object") return valor;

    if ((valor.__type === "date" || valor.__type === "timestamp") && typeof valor.value === "string") {
        const data = new Date(valor.value);
        return Number.isNaN(data.getTime()) ? null : data;
    }

    if (valor.__type === "bytes" && typeof valor.base64 === "string") {
        const binario = atob(valor.base64);
        return Uint8Array.from(binario, caractere => caractere.charCodeAt(0));
    }

    if (valor.__type === "reference" && typeof valor.path === "string") {
        return { path: valor.path };
    }

    return Object.fromEntries(
        Object.entries(valor).map(([chave, item]) => [chave, decodificarValorFirestore(item)])
    );
}

export async function obterDocumentoSupabase(colecao, id) {
    const { data, error } = await supabase
        .from("app_documents")
        .select("payload")
        .eq("collection_path", colecao)
        .eq("document_id", id)
        .maybeSingle();

    if (error) throw error;
    return data?.payload ? decodificarValorFirestore(data.payload) : null;
}

export async function listarDocumentosSupabase(colecao, tamanhoPagina = 500) {
    if (!Number.isInteger(tamanhoPagina) || tamanhoPagina < 1 || tamanhoPagina > 1000) {
        throw new Error("O tamanho da página deve estar entre 1 e 1000.");
    }

    const documentos = [];
    let ultimoId = null;

    while (true) {
        let consulta = supabase
            .from("app_documents")
            .select("document_id,payload")
            .eq("collection_path", colecao)
            .order("document_id", { ascending: true })
            .limit(tamanhoPagina);

        if (ultimoId !== null) consulta = consulta.gt("document_id", ultimoId);

        const { data, error } = await consulta;
        if (error) throw error;

        for (const linha of data || []) {
            documentos.push({
                id: linha.document_id,
                data: decodificarValorFirestore(linha.payload)
            });
        }

        if (!data || data.length < tamanhoPagina) break;
        ultimoId = data[data.length - 1].document_id;
    }

    return documentos;
}
