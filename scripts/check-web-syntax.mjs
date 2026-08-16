import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const diretorio = "www/js";
const arquivos = readdirSync(diretorio, { recursive: true })
    .filter((arquivo) => arquivo.endsWith(".js"))
    .filter((arquivo) => !arquivo.toLowerCase().includes("backup"))
    .map((arquivo) => join(diretorio, arquivo));

let encontrouErro = false;

for (const arquivo of arquivos) {
    try {
        execFileSync(process.execPath, ["--input-type=module", "--check"], {
            input: readFileSync(arquivo, "utf8"),
            stdio: "pipe",
        });
    } catch (erro) {
        encontrouErro = true;
        console.error(`Erro de sintaxe em ${arquivo}:`);
        console.error(erro.stderr.toString());
    }
}

if (encontrouErro) {
    process.exitCode = 1;
} else {
    console.log(`Sintaxe validada em ${arquivos.length} módulos web.`);
}
