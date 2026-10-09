const https = require("https");
const fs = require("fs");
const {
    execFile,
    execFileSync
} = require("child_process");
const os = require("os");
const dgram = require("dgram");
const crypto = require("crypto");
const path = require("path");

const PORT = 9100;
const DISCOVERY_PORT = 9101;
const DISCOVERY_MESSAGE = "LOTRIX_PRINTER_DISCOVER_V1";
const FIRESTORE_COMMIT_URL = "https://firestore.googleapis.com/v1/projects/foodsync-43a7e/databases/(default)/documents:commit";
const FIREBASE_API_KEY = "AIzaSyBT-DwnbqUYmnkL-u0QK6FO4-RLJC0fXA4";
const REGISTRATION_FILE = path.join(__dirname, "registration.json");
const CERTIFICADO_RAIZ_LOTRIX = path.join(
    __dirname,
    "..",
    "android",
    "app",
    "src",
    "main",
    "res",
    "raw",
    "mkcert_root_ca.pem"
);
const CERTIFICADO_CA_LOTRIX = new crypto.X509Certificate(
    fs.readFileSync(CERTIFICADO_RAIZ_LOTRIX)
);
let ultimaDescobertaTabletEm = 0;

const PRINTER = "ZDesigner ZD220-203dpi ZPL";
const USB_PORT = "USB005";

function obterIpsLocais() {
    return Object.values(os.networkInterfaces())
        .flat()
        .filter(interfaceRede =>
            interfaceRede &&
            interfaceRede.family === "IPv4" &&
            !interfaceRede.internal
        )
        .map(interfaceRede => interfaceRede.address);
}

// Let the OS choose the interface for its IPv4 default route. Picking the
// first adapter is unreliable on Windows machines with VPN/Hyper-V adapters.
function obterIpDaRotaPrincipal() {
    return new Promise(resolve => {
        const socket = dgram.createSocket("udp4");
        const finalizar = ip => {
            try { socket.close(); } catch (_) {}
            resolve(ip || null);
        };

        socket.once("error", () => finalizar(null));
        socket.connect(53, "8.8.8.8", () => {
            try {
                const ip = socket.address().address;
                if (!ip || ip === "0.0.0.0" || ip === "127.0.0.1" || ip.startsWith("169.254.")) {
                    finalizar(null);
                    return;
                }
                finalizar(ip);
            } catch (_) {
                finalizar(null);
            }
        });
    });
}

function obterIpParaTablet(ipTablet) {
    const interfaces = Object.values(os.networkInterfaces())
        .flat()
        .filter(item => item && item.family === "IPv4" && !item.internal);
    const paraNumero = endereco => {
        const octetos = String(endereco).split(".").map(Number);
        if (octetos.length !== 4 || octetos.some(octeto =>
            !Number.isInteger(octeto) || octeto < 0 || octeto > 255
        )) return null;
        return octetos.reduce((valor, octeto) => ((valor << 8) | octeto) >>> 0, 0);
    };

    const ipRemoto = paraNumero(ipTablet);
    const mesmaSubrede = interfaces.find(item => {
        const ipLocal = paraNumero(item.address);
        const mascara = paraNumero(item.netmask);
        return ipRemoto !== null && ipLocal !== null && mascara !== null &&
            (ipLocal & mascara) === (ipRemoto & mascara);
    });
    const alternativa = interfaces.find(item => !item.address.startsWith("169.254."));
    return (mesmaSubrede || alternativa || interfaces[0])?.address || "127.0.0.1";
}

function lerConfiguracaoRegistro() {
    try {
        const dados = JSON.parse(fs.readFileSync(REGISTRATION_FILE, "utf8"));
        if (
            typeof dados.idEmpresa !== "string" ||
            !/^[A-Za-z0-9_-]{1,128}$/.test(dados.idEmpresa) ||
            typeof dados.token !== "string" || !/^[a-f0-9]{64}$/.test(dados.token)
        ) return null;
        return { idEmpresa: dados.idEmpresa, token: dados.token };
    } catch (_) {
        return null;
    }
}

async function registrarIpNaNuvem(host) {
    const credencial = lerConfiguracaoRegistro();
    if (!credencial || !host || host === "127.0.0.1") return;

    const lastSeenAt = new Date().toISOString();
    const campos = {
        idEmpresa: { stringValue: credencial.idEmpresa },
        host: { stringValue: host },
        port: { integerValue: String(PORT) },
        lastSeenAt: { timestampValue: lastSeenAt }
    };

    try {
        const baseDocumento = `projects/foodsync-43a7e/databases/(default)/documents`;
        const documentoPrivado = `${baseDocumento}/printerServiceUpdates/${credencial.idEmpresa}/services/${credencial.token}`;
        const documentoPublico = `${baseDocumento}/printerServiceStatus/${credencial.idEmpresa}`;
        const resposta = await fetch(`${FIRESTORE_COMMIT_URL}?key=${FIREBASE_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ writes: [
                { update: { name: documentoPrivado, fields: campos } },
                { update: { name: documentoPublico, fields: campos } }
            ] }),
            signal: AbortSignal.timeout(10000)
        });
        if (!resposta.ok) {
            console.warn(`Registro automático de IP no Firestore recusado (${resposta.status}).`);
        }
    } catch (erro) {
        console.warn("Não foi possível publicar o IP do Printer Service no Firestore:", erro.message);
    }
}

// =======================================
// CERTIFICADOS HTTPS
// =======================================

function encontrarCertificadoCompativel(ipsLocais) {
    return fs.readdirSync(__dirname)
        .filter(nome => nome.endsWith(".pem") && !nome.endsWith("-key.pem"))
        .map(nome => {
            const caminhoCert = `${__dirname}/${nome}`;
            const caminhoChave = `${__dirname}/${nome.replace(/\.pem$/, "-key.pem")}`;

            if (!fs.existsSync(caminhoChave)) return null;

            try {
                const certificado = new crypto.X509Certificate(
                    fs.readFileSync(caminhoCert)
                );
                if (certificado.issuer !== CERTIFICADO_CA_LOTRIX.subject ||
                    !certificado.verify(CERTIFICADO_CA_LOTRIX.publicKey)) {
                    return null;
                }

                const ip = ipsLocais.find(endereco =>
                    certificado.subjectAltName.includes(`IP Address:${endereco}`)
                );

                return ip ? { caminhoCert, caminhoChave, ip } : null;
            } catch (_) {
                return null;
            }
        })
        .find(Boolean);
}

function encontrarMkcert() {
    const pastaPacotes = path.join(
        process.env.LOCALAPPDATA || "",
        "Microsoft",
        "WinGet",
        "Packages"
    );

    try {
        const pastaMkcert = fs.readdirSync(pastaPacotes)
            .find(nome => nome.startsWith("FiloSottile.mkcert_"));
        const executavel = pastaMkcert && path.join(
            pastaPacotes,
            pastaMkcert,
            "mkcert.exe"
        );

        if (executavel && fs.existsSync(executavel)) return executavel;
    } catch (_) {
        // O mkcert também pode estar disponível no PATH.
    }

    return process.env.MKCERT_PATH || "mkcert";
}

function configurarMkcertDoLotrix() {
    const diretorios = [
        process.env.LOTRIX_MKCERT_CAROOT,
        process.env.CAROOT,
        path.join(os.homedir(), "AppData", "Local", "mkcert"),
        path.join(process.env.LOCALAPPDATA || "", "mkcert")
    ].filter(Boolean);

    for (const diretorio of [...new Set(diretorios)]) {
        const arquivoRaiz = path.join(diretorio, "rootCA.pem");
        const chaveRaiz = path.join(diretorio, "rootCA-key.pem");
        if (!fs.existsSync(arquivoRaiz) || !fs.existsSync(chaveRaiz)) continue;

        try {
            const raizEncontrada = new crypto.X509Certificate(fs.readFileSync(arquivoRaiz));
            if (raizEncontrada.fingerprint256 !== CERTIFICADO_CA_LOTRIX.fingerprint256) continue;

            process.env.CAROOT = diretorio;
            console.log("CA HTTPS Lotrix configurada para os certificados dinâmicos.");
            return;
        } catch (_) {
            // Tente a próxima pasta candidata.
        }
    }

    throw new Error(
        "A chave privada da CA HTTPS do Lotrix não foi encontrada. " +
        "Configure LOTRIX_MKCERT_CAROOT para a pasta que contém rootCA.pem e rootCA-key.pem."
    );
}

function gerarCertificado(ips, caminhoCert, caminhoChave) {
    try {
        execFileSync(
            encontrarMkcert(),
            ["-cert-file", caminhoCert, "-key-file", caminhoChave, "localhost", ...ips],
            { cwd: __dirname, stdio: "pipe", windowsHide: true }
        );
    } catch (erro) {
        const detalhe = [erro.stderr, erro.stdout]
            .map(saida => Buffer.isBuffer(saida) ? saida.toString("utf8").trim() : String(saida || "").trim())
            .filter(Boolean)
            .join(" ");
        throw new Error(`mkcert não conseguiu emitir o certificado para ${ips.join(", ")}. ` +
            `${detalhe || erro.message}. Confirme que o mkcert e a CA usada pelo aplicativo estão instalados para esta conta do Windows.`);
    }
}

function obterCertificadoLocal() {
    const ipsLocais = obterIpsLocais();
    let certificadoCompativel = encontrarCertificadoCompativel(ipsLocais);

    // Quando o roteador atribui outro IP, gere um certificado para os novos
    // endereços antes de abrir o HTTPS. O mesmo CA já embarcado no APK assina
    // esse certificado, portanto o tablet continua confiando na conexão.
    if (!certificadoCompativel && ipsLocais.length) {
        try {
            gerarCertificado(ipsLocais, "lotrix-local.pem", "lotrix-local-key.pem");

            certificadoCompativel = encontrarCertificadoCompativel(ipsLocais);
        } catch (erro) {
            throw new Error(`Não foi possível iniciar o HTTPS com o IP atual (${ipsLocais.join(", ")}): ${erro.message}`);
        }
    }

    if (ipsLocais.length && !certificadoCompativel) {
        throw new Error(`Nenhum certificado HTTPS válido cobre os IPs locais: ${ipsLocais.join(", ")}.`);
    }

    return certificadoCompativel || {
        caminhoCert: `${__dirname}/localhost.pem`,
        caminhoChave: `${__dirname}/localhost-key.pem`,
        ip: "localhost"
    };
}

function obterCertificadoParaIp(ip) {
    const octetos = String(ip).split(".");
    const ipValido = octetos.length === 4 && octetos.every(octeto =>
        /^\d{1,3}$/.test(octeto) && Number(octeto) >= 0 && Number(octeto) <= 255
    );

    if (!ipValido) {
        throw new Error(`IP inválido para o certificado HTTPS: ${ip}`);
    }

    let certificado = encontrarCertificadoCompativel([ip]);

    if (!certificado) {
        const sufixo = ip.replace(/\./g, "-");
        const caminhoCert = path.join(__dirname, `lotrix-${sufixo}.pem`);
        const caminhoChave = path.join(__dirname, `lotrix-${sufixo}-key.pem`);

        gerarCertificado([ip], caminhoCert, caminhoChave);

        certificado = encontrarCertificadoCompativel([ip]);
    }

    if (!certificado) {
        throw new Error(`Não foi possível gerar um certificado HTTPS para ${ip}.`);
    }

    return certificado;
}

configurarMkcertDoLotrix();

const certificadoLocal = obterCertificadoLocal();
const SSL_KEY = fs.readFileSync(certificadoLocal.caminhoChave);
const SSL_CERT = fs.readFileSync(certificadoLocal.caminhoCert);

// =======================================
// LOTRIX PRINTER SERVICE
// IMPRESSAO RAW ZPL - WINDOWS SPOOLER
// HTTPS
// =======================================

console.log("=======================================");
console.log("LOTRIX PRINTER SERVICE");
console.log("Modo: IMPRESSAO RAW");
console.log("HTTPS: ATIVO");
console.log("Porta:", PORT);
console.log("Impressora:", PRINTER);
console.log("USB:", USB_PORT);
console.log("Certificado HTTPS:", certificadoLocal.ip);
console.log("=======================================");

// =======================================
// ENVIAR ZPL PARA A IMPRESSORA
// =======================================

function enviarParaImpressora(zpl, callback) {

    // ^CI28 informa à Zebra que o conteúdo está em UTF-8. Não converta o
    // texto para ASCII aqui: isso substitui acentos e demais caracteres.
    const zplBase64 = Buffer
        .from(zpl, "utf8")
        .toString("base64");

    const psScript = `
$ErrorActionPreference = "Stop"

$printerName = '${PRINTER}'
$zplBase64 = '${zplBase64}'

Write-Host "Verificando impressora..."

$printer = Get-Printer -Name $printerName -ErrorAction SilentlyContinue

if (-not $printer) {
    throw "Impressora nao encontrada: $printerName"
}

Write-Host "Impressora encontrada:"
Write-Host $printer.Name

Write-Host "Porta:"
Write-Host $printer.PortName

# =======================================
# CONVERTER BASE64 PARA BYTES
# =======================================

$zplBytes = [System.Convert]::FromBase64String($zplBase64)

# =======================================
# CLASSE PARA ENVIO RAW
# =======================================

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;

public class LotrixRawPrinter
{
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public class DOCINFO
    {
        [MarshalAs(UnmanagedType.LPWStr)]
        public string pDocName;

        [MarshalAs(UnmanagedType.LPWStr)]
        public string pOutputFile;

        [MarshalAs(UnmanagedType.LPWStr)]
        public string pDataType;
    }

    [DllImport(
        "winspool.drv",
        CharSet = CharSet.Unicode,
        SetLastError = true
    )]
    public static extern bool OpenPrinter(
        string pPrinterName,
        out IntPtr phPrinter,
        IntPtr pDefault
    );

    [DllImport(
        "winspool.drv",
        SetLastError = true
    )]
    public static extern bool ClosePrinter(
        IntPtr hPrinter
    );

    [DllImport(
        "winspool.drv",
        CharSet = CharSet.Unicode,
        SetLastError = true
    )]
    public static extern int StartDocPrinter(
        IntPtr hPrinter,
        int level,
        DOCINFO di
    );

    [DllImport(
        "winspool.drv",
        SetLastError = true
    )]
    public static extern bool EndDocPrinter(
        IntPtr hPrinter
    );

    [DllImport(
        "winspool.drv",
        SetLastError = true
    )]
    public static extern bool StartPagePrinter(
        IntPtr hPrinter
    );

    [DllImport(
        "winspool.drv",
        SetLastError = true
    )]
    public static extern bool EndPagePrinter(
        IntPtr hPrinter
    );

    [DllImport(
        "winspool.drv",
        SetLastError = true
    )]
    public static extern bool WritePrinter(
        IntPtr hPrinter,
        IntPtr pBytes,
        int dwCount,
        out int dwWritten
    );

    public static bool Send(
        string printerName,
        byte[] data
    )
    {
        IntPtr hPrinter;

        if (!OpenPrinter(
            printerName,
            out hPrinter,
            IntPtr.Zero
        ))
        {
            return false;
        }

        try
        {
            DOCINFO docInfo = new DOCINFO();

            docInfo.pDocName = "LOTRIX ZPL";
            docInfo.pDataType = "RAW";

            int document = StartDocPrinter(
                hPrinter,
                1,
                docInfo
            );

            if (document == 0)
            {
                return false;
            }

            if (!StartPagePrinter(hPrinter))
            {
                EndDocPrinter(hPrinter);
                return false;
            }

            IntPtr unmanaged = Marshal.AllocHGlobal(
                data.Length
            );

            try
            {
                Marshal.Copy(
                    data,
                    0,
                    unmanaged,
                    data.Length
                );

                int written;

                bool resultado = WritePrinter(
                    hPrinter,
                    unmanaged,
                    data.Length,
                    out written
                );

                EndPagePrinter(
                    hPrinter
                );

                EndDocPrinter(
                    hPrinter
                );

                return resultado &&
                       written == data.Length;
            }
            finally
            {
                Marshal.FreeHGlobal(
                    unmanaged
                );
            }
        }
        finally
        {
            ClosePrinter(
                hPrinter
            );
        }
    }
}
"@

# =======================================
# ENVIAR PARA O SPOOLER DO WINDOWS
# =======================================

Write-Host "Enviando ZPL para o spooler..."

$resultado = [LotrixRawPrinter]::Send(
    $printerName,
    $zplBytes
)

if (-not $resultado)
{
    throw "Falha ao enviar ZPL para a impressora."
}

Write-Host "ZPL enviado com sucesso."

Write-Host "Bytes enviados:"
Write-Host $zplBytes.Length

Write-Host "IMPRESSAO CONCLUIDA"
`;

    execFile(
        "powershell.exe",
        [
            "-NoProfile",
            "-ExecutionPolicy",
            "Bypass",
            "-Command",
            psScript
        ],
        {
            windowsHide: true,
            maxBuffer: 1024 * 1024
        },
        (error, stdout, stderr) => {

            if (stdout) {
                console.log(
                    stdout.trim()
                );
            }

            if (error) {

                console.error(
                    "======================================="
                );

                console.error(
                    "ERRO AO IMPRIMIR"
                );

                console.error(
                    stderr || error.message
                );

                console.error(
                    "======================================="
                );

                callback(error);

                return;
            }

            console.log(
                "======================================="
            );

            console.log(
                "ETIQUETA ENVIADA PARA:"
            );

            console.log(
                PRINTER
            );

            console.log(
                "USB:",
                USB_PORT
            );

            console.log(
                "======================================="
            );

            callback(null);
        }
    );
}

// =======================================
// SERVIDOR HTTPS
// =======================================

const server = https.createServer(
    {
        key: SSL_KEY,
        cert: SSL_CERT
    },
    (req, res) => {

        // =======================================
        // CORS
        // =======================================

        const origem = req.headers.origin;

       const origensPermitidas = [
    "https://lotrix.web.app",
    "https://foodsync-43a7e.web.app",

    "http://localhost",
    "http://localhost:3000",
    "http://127.0.0.1",
    "http://127.0.0.1:5500",

    "https://localhost",
    "https://localhost:3000",
    "https://127.0.0.1",
    "https://127.0.0.1:5500"
];

        if (origensPermitidas.includes(origem)) {

            res.setHeader(
                "Access-Control-Allow-Origin",
                origem
            );

            res.setHeader(
                "Access-Control-Allow-Methods",
                "GET, POST, OPTIONS"
            );

            res.setHeader(
                "Access-Control-Allow-Headers",
                "Content-Type"
            );
        }

        // =======================================
        // CORS PREFLIGHT
        // =======================================

        if (req.method === "OPTIONS") {

            res.writeHead(204);

            res.end();

            return;
        }

        // Permite ao Lotrix validar a conexão sem enviar uma etiqueta.
        if (
            req.method === "GET" &&
            req.url === "/health"
        ) {

            res.writeHead(
                200,
                {
                    "Content-Type":
                        "application/json; charset=utf-8"
                }
            );

            res.end(
                JSON.stringify(
                    {
                        status: "ok",
                        printer: PRINTER,
                        port: PORT
                    }
                )
            );

            return;
        }

        // =======================================
        // SOMENTE POST /print
        // =======================================

        if (
            req.method !== "POST" ||
            req.url !== "/print"
        ) {

            res.writeHead(
                404,
                {
                    "Content-Type":
                        "text/plain; charset=utf-8"
                }
            );

            res.end(
                "Not Found"
            );

            return;
        }

        const bodyChunks = [];

        // =======================================
        // RECEBER ZPL
        // =======================================

        req.on(
            "data",
            chunk => {

                // Mantenha os bytes até o fim da requisição. Converter cada
                // chunk separadamente pode corromper um caractere UTF-8 que
                // tenha sido dividido entre dois chunks.
                bodyChunks.push(chunk);

            }
        );

        // =======================================
        // FINALIZAR RECEBIMENTO
        // =======================================

        req.on(
            "end",
            () => {

                const body = Buffer
                    .concat(bodyChunks)
                    .toString("utf8");

                console.log(
                    "======================================="
                );

                console.log(
                    "ZPL RECEBIDO PELO LOTRIX"
                );

                console.log(
                    "Tamanho:",
                    Buffer.byteLength(
                        body,
                        "utf8"
                    ),
                    "bytes"
                );

                // =======================================
                // VALIDAR ZPL
                // =======================================

                if (
                    !body.includes("^XA") ||
                    !body.includes("^XZ")
                ) {

                    console.error(
                        "ZPL INVALIDO"
                    );

                    res.writeHead(
                        400,
                        {
                            "Content-Type":
                                "text/plain; charset=utf-8"
                        }
                    );

                    res.end(
                        "ZPL invalido"
                    );

                    return;
                }

                // =======================================
                // IMPRIMIR
                // =======================================

                enviarParaImpressora(
                    body,
                    error => {

                        if (error) {

                            res.writeHead(
                                500,
                                {
                                    "Content-Type":
                                        "text/plain; charset=utf-8"
                                }
                            );

                            res.end(
                                "Erro ao enviar ZPL para a impressora"
                            );

                            return;
                        }

                        res.writeHead(
                            200,
                            {
                                "Content-Type":
                                    "text/plain; charset=utf-8"
                            }
                        );

                        res.end(
                            "Etiqueta enviada para a impressora"
                        );

                    }
                );

            }
        );

    }
);

let ipCertificadoHttpsAtivo = certificadoLocal.ip;

function ativarCertificadoHttps(ip, forcarRecarga = false) {
    const certificado = obterCertificadoParaIp(ip);
    if (!forcarRecarga && ipCertificadoHttpsAtivo === ip) return certificado;

    server.setSecureContext({
        key: fs.readFileSync(certificado.caminhoChave),
        cert: fs.readFileSync(certificado.caminhoCert)
    });
    ipCertificadoHttpsAtivo = ip;
    console.log(`Certificado HTTPS ativo para ${ip}.`);
    return certificado;
}

// =======================================
// ERROS DO SERVIDOR
// =======================================

server.on(
    "error",
    error => {

        if (
            error.code === "EADDRINUSE"
        ) {

            console.error(
                `A porta ${PORT} ja esta em uso.`
            );

            console.error(
                "Existe outro LOTRIX PRINTER SERVICE executando."
            );

            process.exit(1);
        }

        console.error(
            "Erro no servidor:",
            error
        );

    }
);

// =======================================
// INICIAR SERVIDOR
// =======================================

server.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            "======================================="
        );

        console.log(
            "LOTRIX PRINTER SERVICE"
        );

        console.log(
            "Modo: IMPRESSAO RAW"
        );

        console.log(
            "HTTPS: ATIVO"
        );

        console.log(
            "Porta:",
            PORT
        );

        console.log(
            "Endereco:"
        );

        console.log("https://localhost:9100");

        console.log(
            "Endpoint:"
        );

        console.log("https://localhost:9100/print");

        const ipsLocais = obterIpsLocais();

        if (ipsLocais.length) {
            console.log("IP(s) local(is) detectado(s):", ipsLocais.join(", "));
        }

        console.log(
            "Impressora:",
            PRINTER
        );

        console.log(
            "USB:",
            USB_PORT
        );

        console.log(
            "Status: ONLINE"
        );

        console.log(
            "======================================="

        );

    }
);

// Responde à busca feita pelo aplicativo no tablet. O IP enviado é obtido
// na hora, portanto acompanha qualquer alteração feita pelo roteador.
const discoveryServer = dgram.createSocket("udp4");

discoveryServer.on("message", (mensagem, remoto) => {
    if (mensagem.toString("utf8") !== DISCOVERY_MESSAGE) return;

    const host = obterIpParaTablet(remoto.address);
    ultimaDescobertaTabletEm = Date.now();

    try {
        ativarCertificadoHttps(host, true);
        void registrarIpNaNuvem(host);
    } catch (erro) {
        console.error("Não foi possível atualizar o certificado HTTPS para a descoberta:", erro);
        return;
    }

    const resposta = Buffer.from(JSON.stringify({
        service: "lotrix-printer",
        host,
        port: PORT
    }));

    discoveryServer.send(resposta, remoto.port, remoto.address);
});

discoveryServer.on("error", erro => {
    console.error("Erro na descoberta do Printer Service:", erro);
});

discoveryServer.bind(DISCOVERY_PORT, "0.0.0.0", () => {
    discoveryServer.setBroadcast(true);
    console.log(`Descoberta automática ativa na porta UDP ${DISCOVERY_PORT}.`);
    const atualizarIpPublico = async () => {
        // A descoberta do tablet usa a sub-rede exata. Dê prioridade a esse
        // resultado por um curto período para o heartbeat não sobrescrevê-lo
        // com a interface de VPN/Hyper-V/default route logo em seguida.
        if (Date.now() - ultimaDescobertaTabletEm < 90000) return;
        const ipAtual = await obterIpDaRotaPrincipal();
        if (!ipAtual) return;

        try {
            ativarCertificadoHttps(ipAtual);
            void registrarIpNaNuvem(ipAtual);
        } catch (erro) {
            console.error(`Não foi possível atualizar HTTPS para o novo IP ${ipAtual}:`, erro.message);
        }
    };

    void atualizarIpPublico();
    setInterval(atualizarIpPublico, 60000).unref();
});

