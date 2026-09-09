/**
 * ============================================================
 * LOTRIX - NOTIFICAÇÕES DE ETIQUETAS
 * ============================================================
 *
 * Verifica diariamente etiquetas próximas do vencimento.
 *
 * Regras:
 *   3 dias antes  -> "Etiqueta vence em 3 dias"
 *   1 dia antes   -> "Etiqueta vence amanhã"
 *   no dia        -> "Etiqueta vence hoje"
 *
 * Estrutura esperada:
 *
 * etiquetas/
 *   └── documento
 *       ├── idEmpresa
 *       ├── produto
 *       ├── lote
 *       ├── validade
 *       └── ...
 *
 * tokens/
 *   └── documento
 *       ├── uid
 *       ├── idEmpresa
 *       ├── token
 *       ├── plataforma
 *       ├── ativo
 *       └── atualizadoEm
 *
 * ============================================================
 */

const { setGlobalOptions } = require("firebase-functions");
const { onRequest } = require("firebase-functions/https");
const { onSchedule } = require("firebase-functions/scheduler");
const logger = require("firebase-functions/logger");

const admin = require("firebase-admin");


// ============================================================
// FIREBASE ADMIN
// ============================================================

admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();


// ============================================================
// CONFIGURAÇÕES GLOBAIS
// ============================================================

setGlobalOptions({
  maxInstances: 10
});


// ============================================================
// FUNÇÃO AUXILIAR
// CONVERTE DATA YYYY-MM-DD PARA OBJETO DATE
// ============================================================

function criarDataLocal(dataString) {

  if (!dataString) {
    return null;
  }

  const partes = String(dataString).split("-");

  if (partes.length !== 3) {
    return null;
  }

  const ano = Number(partes[0]);
  const mes = Number(partes[1]);
  const dia = Number(partes[2]);

  if (
    !Number.isInteger(ano) ||
    !Number.isInteger(mes) ||
    !Number.isInteger(dia)
  ) {
    return null;
  }

  return new Date(
    ano,
    mes - 1,
    dia,
    0,
    0,
    0,
    0
  );
}


// ============================================================
// FUNÇÃO AUXILIAR
// DATA DE HOJE SEM HORÁRIO
// ============================================================

function hojeSemHorario() {

  const agora = new Date();

  return new Date(
    agora.getFullYear(),
    agora.getMonth(),
    agora.getDate(),
    0,
    0,
    0,
    0
  );
}


// ============================================================
// FUNÇÃO AUXILIAR
// DIFERENÇA ENTRE DATAS
// ============================================================

function diferencaDias(dataFutura, dataAtual) {

  const diferenca =
    dataFutura.getTime() -
    dataAtual.getTime();

  return Math.round(
    diferenca / (1000 * 60 * 60 * 24)
  );
}


// ============================================================
// DEFINIR TIPO DE NOTIFICAÇÃO
// ============================================================

function obterTipoNotificacao(dias) {

  if (dias === 3) {
    return {
      tipo: "3_dias",
      titulo: "Etiqueta próxima do vencimento",
      mensagem: "Uma etiqueta vence em 3 dias."
    };
  }

  if (dias === 1) {
    return {
      tipo: "1_dia",
      titulo: "Etiqueta vence amanhã",
      mensagem: "Uma etiqueta vence amanhã."
    };
  }

  if (dias === 0) {
    return {
      tipo: "hoje",
      titulo: "Etiqueta vence hoje",
      mensagem: "Uma etiqueta vence hoje."
    };
  }

  return null;
}


// ============================================================
// CRIAR CHAVE ÚNICA DA NOTIFICAÇÃO
// ============================================================
//
// Essa chave impede que a mesma etiqueta gere a mesma
// notificação várias vezes.
//
// Exemplo:
//
// etiquetaABC_3_dias_2026-09-11
//
// ============================================================

function criarIdNotificacao(
  idEtiqueta,
  tipo,
  validade
) {

  return [
    idEtiqueta,
    tipo,
    validade
  ]
    .join("_")
    .replace(/[^a-zA-Z0-9_-]/g, "_");
}


// ============================================================
// BUSCAR TOKENS DE UMA EMPRESA
// ============================================================

async function buscarTokensEmpresa(idEmpresa) {

  if (!idEmpresa) {
    return [];
  }

  const snapshot = await db
    .collection("tokens")
    .where("idEmpresa", "==", idEmpresa)
    .where("ativo", "==", true)
    .get();

  const tokens = [];

  snapshot.forEach((doc) => {

    const dados = doc.data();

    if (
      dados.token &&
      typeof dados.token === "string"
    ) {

      tokens.push({
        id: doc.id,
        token: dados.token,
        uid: dados.uid || null
      });

    }

  });

  return tokens;
}


// ============================================================
// ENVIAR NOTIFICAÇÃO
// ============================================================

async function enviarNotificacao({
  tokens,
  titulo,
  mensagem,
  dados
}) {

  if (!tokens || tokens.length === 0) {

    logger.info(
      "Nenhum dispositivo ativo encontrado."
    );

    return;
  }


  // O FCM aceita no máximo 500 destinos por
  // chamada multicast.

  const limite = 500;

  for (
    let inicio = 0;
    inicio < tokens.length;
    inicio += limite
  ) {

    const grupo = tokens.slice(
      inicio,
      inicio + limite
    );

    const registrationTokens =
      grupo.map(item => item.token);


    const message = {

      notification: {
        title: titulo,
        body: mensagem
      },

      data: {

        tipo: String(dados.tipo || ""),
        idEtiqueta: String(dados.idEtiqueta || ""),
        idEmpresa: String(dados.idEmpresa || ""),
        produto: String(dados.produto || ""),
        lote: String(dados.lote || ""),
        validade: String(dados.validade || ""),
        dias: String(dados.dias ?? "")
      },

      tokens: registrationTokens
    };


    try {

      const response =
        await messaging.sendEachForMulticast(
          message
        );


      logger.info(
        "Resultado do envio FCM",
        {
          sucesso: response.successCount,
          falhas: response.failureCount,
          total: registrationTokens.length
        }
      );


      // ======================================================
      // DESATIVAR TOKENS INVÁLIDOS
      // ======================================================

      if (response.failureCount > 0) {

        const batch = db.batch();

        let quantidadeDesativada = 0;

        response.responses.forEach(
          (resultado, indice) => {

            if (resultado.success) {
              return;
            }

            const erro =
              resultado.error;

            if (!erro) {
              return;
            }


            const codigo =
              erro.code || "";


            const tokenInvalido =
              codigo.includes(
                "registration-token-not-registered"
              ) ||
              codigo.includes(
                "invalid-registration-token"
              );


            if (tokenInvalido) {

              const tokenInfo =
                grupo[indice];

              if (!tokenInfo) {
                return;
              }


              const referencia =
                db
                  .collection("tokens")
                  .doc(tokenInfo.id);


              batch.update(
                referencia,
                {
                  ativo: false,
                  atualizadoEm:
                    admin.firestore.FieldValue.serverTimestamp()
                }
              );


              quantidadeDesativada++;
            }

          }
        );


        if (quantidadeDesativada > 0) {

          await batch.commit();

          logger.info(
            "Tokens inválidos desativados",
            {
              quantidade:
                quantidadeDesativada
            }
          );

        }

      }

    } catch (erro) {

      logger.error(
        "Erro ao enviar notificação FCM",
        erro
      );

    }

  }

}


// ============================================================
// FUNÇÃO PRINCIPAL
// VERIFICA ETIQUETAS
// ============================================================
//
// Executada todos os dias às 08:00.
//
// Horário de Brasília.
// ============================================================

exports.verificarEtiquetasVencimento =
  onSchedule(
    {
      schedule: "0 8 * * *",
      timeZone: "America/Sao_Paulo"
    },

    async () => {

      logger.info(
        "================================================"
      );

      logger.info(
        "LOTRIX - VERIFICAÇÃO DE ETIQUETAS"
      );

      logger.info(
        "================================================"
      );


      const hoje =
        hojeSemHorario();


      logger.info(
        "Data atual",
        {
          data:
            hoje.toISOString()
        }
      );


      // ======================================================
      // BUSCAR ETIQUETAS
      // ======================================================

      const snapshot =
        await db
          .collection("etiquetas")
          .get();


      logger.info(
        "Etiquetas encontradas",
        {
          quantidade:
            snapshot.size
        }
      );


      if (snapshot.empty) {

        logger.info(
          "Nenhuma etiqueta encontrada."
        );

        return;
      }


      // ======================================================
      // PROCESSAR ETIQUETAS
      // ======================================================

      for (
        const documento of snapshot.docs
      ) {

        const etiqueta =
          documento.data();


        const idEtiqueta =
          documento.id;


        const idEmpresa =
          etiqueta.idEmpresa;


        const validade =
          etiqueta.validade;


        // ----------------------------------------------------
        // VALIDAR CAMPOS
        // ----------------------------------------------------

        if (
          !idEmpresa ||
          !validade
        ) {

          logger.warn(
            "Etiqueta ignorada por falta de dados.",
            {
              idEtiqueta
            }
          );

          continue;
        }


        // ----------------------------------------------------
        // CONVERTER VALIDADE
        // ----------------------------------------------------

        const dataValidade =
          criarDataLocal(validade);


        if (!dataValidade) {

          logger.warn(
            "Data de validade inválida.",
            {
              idEtiqueta,
              validade
            }
          );

          continue;
        }


        // ----------------------------------------------------
        // CALCULAR DIAS
        // ----------------------------------------------------

        const dias =
          diferencaDias(
            dataValidade,
            hoje
          );


        // ----------------------------------------------------
        // SÓ INTERESSAM:
        //
        // 3 dias
        // 1 dia
        // hoje
        // ----------------------------------------------------

        const notificacao =
          obterTipoNotificacao(dias);


        if (!notificacao) {
          continue;
        }


        logger.info(
          "Etiqueta encontrada para notificação",
          {
            idEtiqueta,
            idEmpresa,
            produto:
              etiqueta.produto || "",
            lote:
              etiqueta.lote || "",
            validade,
            dias
          }
        );


        // ====================================================
        // ID ÚNICO DA NOTIFICAÇÃO
        // ====================================================

        const idNotificacao =
          criarIdNotificacao(
            idEtiqueta,
            notificacao.tipo,
            validade
          );


        const referenciaNotificacao =
          db
            .collection("notificacoes")
            .doc(idNotificacao);


        // ====================================================
        // VERIFICAR SE JÁ FOI ENVIADA
        // ====================================================

        const notificacaoExistente =
          await referenciaNotificacao.get();


        if (notificacaoExistente.exists) {

          logger.info(
            "Notificação já enviada anteriormente.",
            {
              idNotificacao
            }
          );

          continue;
        }


        // ====================================================
        // BUSCAR TOKENS DA EMPRESA
        // ====================================================

        const tokens =
          await buscarTokensEmpresa(
            idEmpresa
          );


        if (tokens.length === 0) {

          logger.info(
            "Nenhum dispositivo cadastrado para a empresa.",
            {
              idEmpresa
            }
          );

          continue;
        }


        // ====================================================
        // MONTAR MENSAGEM
        // ====================================================

        let mensagem =
          notificacao.mensagem;


        const produto =
          etiqueta.produto ||
          "Produto";


        const lote =
          etiqueta.lote ||
          "";


        if (dias === 3) {

          mensagem =
            `${produto} vence em 3 dias.`;

        } else if (dias === 1) {

          mensagem =
            `${produto} vence amanhã.`;

        } else if (dias === 0) {

          mensagem =
            `${produto} vence hoje.`;

        }


        if (lote) {

          mensagem +=
            ` Lote: ${lote}.`;

        }


        // ====================================================
        // ENVIAR
        // ====================================================

        await enviarNotificacao({

          tokens,

          titulo:
            notificacao.titulo,

          mensagem,

          dados: {

            tipo:
              notificacao.tipo,

            idEtiqueta,

            idEmpresa,

            produto,

            lote,

            validade,

            dias
          }

        });


        // ====================================================
        // REGISTRAR NOTIFICAÇÃO
        // ====================================================
        //
        // Só registramos depois da tentativa de envio.
        //
        // Isso evita que a função fique reenviando
        // indefinidamente a mesma notificação.
        //
        // ====================================================

        await referenciaNotificacao.set({

          idEtiqueta,

          idEmpresa,

          produto,

          lote,

          validade,

          tipo:
            notificacao.tipo,

          dias,

          enviadaEm:
            admin.firestore.FieldValue.serverTimestamp(),

          quantidadeDispositivos:
            tokens.length

        });


        logger.info(
          "Notificação registrada.",
          {
            idNotificacao
          }
        );

      }


      logger.info(
        "================================================"
      );

      logger.info(
        "VERIFICAÇÃO FINALIZADA"
      );

      logger.info(
        "================================================"
      );

    }
  );


// ============================================================
// FUNÇÃO HTTP DE TESTE
// ============================================================
//
// Pode ser usada posteriormente para testar manualmente.
//
// NÃO envia notificações.
// Apenas confirma que o serviço está funcionando.
// ============================================================

exports.statusLotrix =
  onRequest(
    async (req, res) => {

      logger.info(
        "Status Lotrix solicitado."
      );

      res.status(200).json({

        sucesso: true,

        servico:
          "Lotrix Cloud Functions",

        notificacoes:
          "habilitadas",

        funcao:
          "verificarEtiquetasVencimento"

      });

    }
  );