const https = require("https");
const fs = require("fs");
const {
    execFile
} = require("child_process");

const PORT = 9100;

const PRINTER = "ZDesigner ZD220-203dpi ZPL";
const USB_PORT = "USB005";

// =======================================
// CERTIFICADOS HTTPS
// =======================================

const SSL_KEY = fs.readFileSync(
    "./192.168.0.109+2-key.pem"
);

const SSL_CERT = fs.readFileSync(
    "./192.168.0.109+2.pem"
);

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
            "https://foodsync-43a7e.web.app",
            "http://localhost",
            "http://localhost:3000",
            "http://127.0.0.1:5500",
            "https://localhost",
            "https://localhost:3000",
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

        console.log(
            "https://192.168.0.109:9100"
        );

        console.log(
            "Endpoint:"
        );

        console.log(
            "https://192.168.0.109:9100/print"
        );

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

