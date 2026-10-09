const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {onSchedule} = require("firebase-functions/v2/scheduler");
const {initializeApp} = require("firebase-admin/app");
const {getAuth} = require("firebase-admin/auth");
const {
  getFirestore,
  FieldValue,
} = require("firebase-admin/firestore");
const {getMessaging} = require("firebase-admin/messaging");

initializeApp();

const adminAuth = getAuth();
const db = getFirestore();

// =======================================
// LOTRIX - NOTIFICAÇÕES DE VALIDADE
// FIREBASE CLOUD MESSAGING
// MULTIEMPRESA
// =======================================

const messaging = getMessaging();

const DIAS_NOTIFICACAO_ETIQUETA = [
  3,
  1,
  0,
];

/**
 * Retorna a data atual no fuso de São Paulo.
 *
 * @return {string} AAAA-MM-DD
 */
function dataAtualSaoPaulo() {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const valores = Object.fromEntries(
      partes
          .filter((parte) => parte.type !== "literal")
          .map((parte) => [parte.type, parte.value]),
  );

  return `${valores.year}-${valores.month}-${valores.day}`;
}


/**
 * Calcula quantos dias faltam para a validade.
 *
 * @param {string} validade AAAA-MM-DD
 * @param {string} hoje AAAA-MM-DD
 * @return {number|null}
 */
function calcularDiasParaVencimento(validade, hoje) {
  if (
    !validade ||
    typeof validade !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(validade)
  ) {
    return null;
  }

  const dataValidade =
      new Date(`${validade}T00:00:00Z`);

  const dataHoje =
      new Date(`${hoje}T00:00:00Z`);

  if (
    Number.isNaN(dataValidade.getTime()) ||
    Number.isNaN(dataHoje.getTime())
  ) {
    return null;
  }

  return Math.round(
      (dataValidade.getTime() - dataHoje.getTime()) /
      (1000 * 60 * 60 * 24),
  );
}


/**
 * Configura título e mensagem.
 *
 * @param {number} dias
 * @param {Object} etiqueta
 * @param {string} etiquetaId
 * @return {Object}
 */
function montarMensagemValidade(dias, etiqueta, etiquetaId) {
  let titulo = "";
  let corpo = "";

  if (dias === 3) {
    titulo = "Etiqueta próxima do vencimento";

    corpo =
        `A etiqueta ${etiqueta.codigo || etiquetaId} ` +
        `vence em 3 dias. ` +
        `Produto: ${etiqueta.produto || "Não informado"}.`;
  }

  if (dias === 1) {
    titulo = "Etiqueta vence amanhã";

    corpo =
        `A etiqueta ${etiqueta.codigo || etiquetaId} ` +
        `vence amanhã. ` +
        `Produto: ${etiqueta.produto || "Não informado"}.`;
  }

  if (dias === 0) {
    titulo = "Etiqueta vence hoje";

    corpo =
        `A etiqueta ${etiqueta.codigo || etiquetaId} ` +
        `vence hoje. ` +
        `Produto: ${etiqueta.produto || "Não informado"}.`;
  }

  return {
    titulo,
    corpo,
  };
}


/**
 * Envia notificações para os tokens de uma empresa.
 *
 * @param {string} idEmpresa
 * @param {Array<Object>} notificacoes
 * @return {Promise<Object>}
 */
async function enviarNotificacoesEmpresa(
    idEmpresa,
    notificacoes,
) {
  if (!idEmpresa || !notificacoes.length) {
    return {
      enviados: 0,
      erros: 0,
    };
  }

  // ===================================
  // BUSCAR TOKENS DA EMPRESA
  // ===================================

  const tokensSnapshot = await db
      .collection("tokens")
      .where("idEmpresa", "==", idEmpresa)
      .where("ativo", "==", true)
      .get();

  if (tokensSnapshot.empty) {
    console.log(
        "PUSH: nenhum dispositivo ativo para empresa:",
        idEmpresa,
    );

    return {
      enviados: 0,
      erros: 0,
    };
  }

  const tokens = tokensSnapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter((item) => item.token);

  if (!tokens.length) {
    return {
      enviados: 0,
      erros: 0,
    };
  }

  let enviados = 0;
  let erros = 0;

  // ===================================
  // CADA ETIQUETA = UMA NOTIFICAÇÃO
  // ===================================

  for (const notificacao of notificacoes) {
    const chave =
        `${notificacao.etiquetaId}_` +
        `${notificacao.tipo}_` +
        `${notificacao.validade}`;

    // =================================
    // EVITAR DUPLICIDADE
    // =================================

    const controleRef =
        db.collection("notificacoes").doc(chave);

    const controleSnapshot =
        await controleRef.get();

    if (controleSnapshot.exists) {
      console.log(
          "PUSH: notificação já enviada:",
          chave,
      );

      continue;
    }

    // =================================
    // DADOS DA NOTIFICAÇÃO
    // =================================

    const mensagem = {
      notification: {
        title: notificacao.titulo,
        body: notificacao.corpo,
      },

      data: {
        tipo: String(notificacao.tipo),
        etiquetaId: String(notificacao.etiquetaId),
        codigo: String(notificacao.codigo || ""),
        produto: String(notificacao.produto || ""),
        idEmpresa: String(idEmpresa),
        validade: String(notificacao.validade || ""),
        rota: "etiquetas",
      },

      tokens: tokens.map(
          (item) => item.token,
      ),
    };

    // =================================
    // ENVIO
    // =================================

    try {
      const resposta =
          await messaging.sendEachForMulticast(
              mensagem,
          );

      enviados += resposta.successCount;
      erros += resposta.failureCount;

      console.log(
          "PUSH ENVIADO:",
          {
            idEmpresa,
            etiquetaId:
                notificacao.etiquetaId,
            tipo:
                notificacao.tipo,
            sucesso:
                resposta.successCount,
            erros:
                resposta.failureCount,
          },
      );

      // =================================
      // DESATIVAR TOKENS INVÁLIDOS
      // =================================

      const batch =
          db.batch();

      let tokensInvalidos = 0;

      resposta.responses.forEach(
          (resultado, indice) => {
            if (
              resultado.success ||
              !resultado.error
            ) {
              return;
            }

            const codigoErro =
                resultado.error.code || "";

            if (
              codigoErro ===
                "messaging/registration-token-not-registered" ||
              codigoErro ===
                "messaging/invalid-registration-token"
            ) {
              const tokenInfo =
                  tokens[indice];

              if (!tokenInfo) {
                return;
              }

              batch.update(
                  db.collection("tokens")
                      .doc(tokenInfo.id),
                  {
                    ativo: false,
                    atualizadoEm:
                        FieldValue.serverTimestamp(),
                  },
              );

              tokensInvalidos++;
            }
          },
      );

      if (tokensInvalidos > 0) {
        await batch.commit();

        console.log(
            "PUSH: tokens inválidos desativados:",
            tokensInvalidos,
        );
      }

      // =================================
      // REGISTRAR CONTROLE DE ENVIO
      // =================================

      await controleRef.set({
        etiquetaId:
            notificacao.etiquetaId,

        codigo:
            notificacao.codigo || "",

        produto:
            notificacao.produto || "",

        idEmpresa,

        tipo:
            notificacao.tipo,

        validade:
            notificacao.validade,

        enviadoEm:
            FieldValue.serverTimestamp(),

        sucesso:
            resposta.successCount,

        erros:
            resposta.failureCount,
      });
    } catch (error) {
      console.error(
          "PUSH: erro ao enviar:",
          error,
      );
    }
  }

  return {
    enviados,
    erros,
  };
}


// =======================================
// LOTRIX - VERIFICAR ETIQUETAS
// NOTIFICAÇÃO AUTOMÁTICA
// 3 DIAS / 1 DIA / HOJE
// =======================================

exports.notificarEtiquetasVencimento = onSchedule(
    {
      schedule: "0 8 * * *",
      timeZone: "America/Sao_Paulo",
      maxInstances: 1,
    },
    async () => {
      console.log(
          "=======================================",
      );

      console.log(
          "LOTRIX - VERIFICAÇÃO DE ETIQUETAS",
      );

      console.log(
          "=======================================",
      );

      const hoje =
          dataAtualSaoPaulo();

      console.log(
          "DATA ATUAL:",
          hoje,
      );

      // ===================================
      // BUSCAR ETIQUETAS
      // ===================================

      const etiquetasSnapshot =
          await db
              .collection("etiquetas")
              .get();

      console.log(
          "ETIQUETAS ENCONTRADAS:",
          etiquetasSnapshot.size,
      );

      if (etiquetasSnapshot.empty) {
        console.log(
            "Nenhuma etiqueta encontrada.",
        );

        return;
      }

      // ===================================
      // AGRUPAR POR EMPRESA
      // ===================================

      const notificacoesPorEmpresa =
          new Map();

      etiquetasSnapshot.forEach(
          (docSnapshot) => {
            const etiqueta =
                docSnapshot.data();

            const etiquetaId =
                docSnapshot.id;

            const idEmpresa =
                etiqueta.idEmpresa;

            const validade =
                etiqueta.validade;

            if (!idEmpresa || !validade) {
              return;
            }

            const dias =
                calcularDiasParaVencimento(
                    validade,
                    hoje,
                );

            if (
              !DIAS_NOTIFICACAO_ETIQUETA.includes(
                  dias,
              )
            ) {
              return;
            }

            const mensagem =
                montarMensagemValidade(
                    dias,
                    etiqueta,
                    etiquetaId,
                );

            const tipo =
                dias === 3 ?
                  "3_dias" :
                  dias === 1 ?
                    "1_dia" :
                    "hoje";

            const notificacao = {
              etiquetaId,
              codigo:
                  etiqueta.codigo || "",
              produto:
                  etiqueta.produto || "",
              validade,
              tipo,
              titulo:
                  mensagem.titulo,
              corpo:
                  mensagem.corpo,
            };

            if (
              !notificacoesPorEmpresa.has(
                  idEmpresa,
              )
            ) {
              notificacoesPorEmpresa.set(
                  idEmpresa,
                  [],
              );
            }

            notificacoesPorEmpresa
                .get(idEmpresa)
                .push(notificacao);
          },
      );

      // ===================================
      // ENVIAR POR EMPRESA
      // ===================================

      let totalEnviados = 0;
      let totalErros = 0;

      for (
        const [
          idEmpresa,
          notificacoes,
        ] of notificacoesPorEmpresa
      ) {
        console.log(
            "===================================",
        );

        console.log(
            "EMPRESA:",
            idEmpresa,
        );

        console.log(
            "NOTIFICAÇÕES:",
            notificacoes.length,
        );

        const resultado =
            await enviarNotificacoesEmpresa(
                idEmpresa,
                notificacoes,
            );

        totalEnviados +=
            resultado.enviados;

        totalErros +=
            resultado.erros;
      }

      console.log(
          "=======================================",
      );

      console.log(
          "LOTRIX - NOTIFICAÇÕES FINALIZADAS",
      );

      console.log(
          {
            hoje,
            empresas:
                notificacoesPorEmpresa.size,
            enviados:
                totalEnviados,
            erros:
                totalErros,
          },
      );

      console.log(
          "=======================================",
      );
    },
);
// =======================================
// LIMPEZA AUTOMÁTICA DE ETIQUETAS VENCIDAS
// =======================================

const DIAS_PARA_RETER_ETIQUETA_VENCIDA = 3;
const TAMANHO_LOTE_LIMPEZA = 200;

/**
 * Retorna a data atual no fuso horário usado pela operação.
 * @return {string} Data no formato AAAA-MM-DD.
 */
function dataNoFusoDeSaoPaulo() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
      parts
          .filter((part) => part.type !== "literal")
          .map((part) => [part.type, part.value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
}

/**
 * Calcula a primeira data que ainda deve ser mantida.
 * @return {string} Data limite no formato AAAA-MM-DD.
 */
function dataLimiteParaLimpeza() {
  const hoje = new Date(`${dataNoFusoDeSaoPaulo()}T00:00:00Z`);

  hoje.setUTCDate(
      hoje.getUTCDate() - DIAS_PARA_RETER_ETIQUETA_VENCIDA,
  );

  return hoje.toISOString().slice(0, 10);
}

exports.limparEtiquetasVencidas = onSchedule(
    {
      schedule: "20 0 * * *",
      timeZone: "America/Sao_Paulo",
      maxInstances: 1,
    },
    async () => {
      const dataLimite = dataLimiteParaLimpeza();
      let quantidadeRemovida = 0;
      let continuar = true;

      while (continuar) {
        const etiquetas = await db
            .collection("etiquetas")
            .where("validade", "<", dataLimite)
            .limit(TAMANHO_LOTE_LIMPEZA)
            .get();

        if (etiquetas.empty) {
          break;
        }

        const batch = db.batch();

        etiquetas.docs.forEach((etiqueta) => {
          const dados = etiqueta.data();

          batch.delete(etiqueta.ref);

          if (dados.codigo) {
            batch.delete(
                db.collection("consultasPublicas").doc(dados.codigo),
            );
          }
        });

        await batch.commit();

        quantidadeRemovida += etiquetas.size;
        continuar = etiquetas.size === TAMANHO_LOTE_LIMPEZA;
      }

      console.log(
          "Limpeza de etiquetas concluída.",
          {
            dataLimite,
            quantidadeRemovida,
          },
      );
    },
);


// =======================================
// LOTRIX - CRIAR USUÁRIO
// CLOUD FUNCTION ADMIN
// MULTIEMPRESA
// =======================================

exports.criarUsuario = onCall(async (request) => {
  // ===================================
  // USUÁRIO AUTENTICADO
  // ===================================

  if (!request.auth) {
    throw new HttpsError(
        "unauthenticated",
        "Usuário não autenticado.",
    );
  }


  const uidAdmin =
        request.auth.uid;


  // ===================================
  // BUSCAR ADMIN NO FIRESTORE
  // ===================================

  const adminRef =
        db.collection("usuarios").doc(uidAdmin);

  const adminSnap =
        await adminRef.get();


  if (!adminSnap.exists) {
    throw new HttpsError(
        "permission-denied",
        "Perfil do administrador não encontrado.",
    );
  }


  const adminData =
        adminSnap.data();


  // ===================================
  // VALIDAR ADMIN
  // ===================================

  const perfilAdmin =
        String(adminData.perfil || "")
            .toLowerCase()
            .trim();

  const statusAdmin =
        String(adminData.status || "")
            .toLowerCase()
            .trim();


  if (
    perfilAdmin !== "administrador" ||
        statusAdmin !== "ativo"
  ) {
    throw new HttpsError(
        "permission-denied",
        "Somente administradores ativos podem criar usuários.",
    );
  }


  // ===================================
  // EMPRESA DO ADMIN
  // ===================================

  const idEmpresa =
        adminData.idEmpresa;


  if (!idEmpresa) {
    throw new HttpsError(
        "failed-precondition",
        "Administrador não possui empresa vinculada.",
    );
  }


  // ===================================
  // DADOS RECEBIDOS
  // ===================================

  const dados =
        request.data || {};


  const nome =
        String(dados.nome || "").trim();

  const email =
        String(dados.email || "")
            .trim()
            .toLowerCase();

  const senha =
        String(dados.senha || "");

  const perfilSolicitado =
        String(dados.perfil || "operador")
            .toLowerCase()
            .trim();

  const statusSolicitado =
        String(dados.status || "ativo")
            .toLowerCase()
            .trim();

  const permissoes =
        dados.permissoes || {};


  // ===================================
  // VALIDAÇÕES
  // ===================================

  if (!nome) {
    throw new HttpsError(
        "invalid-argument",
        "Informe o nome do usuário.",
    );
  }


  if (!email) {
    throw new HttpsError(
        "invalid-argument",
        "Informe o email do usuário.",
    );
  }


  if (!senha) {
    throw new HttpsError(
        "invalid-argument",
        "Informe uma senha.",
    );
  }


  if (senha.length < 6) {
    throw new HttpsError(
        "invalid-argument",
        "A senha deve ter pelo menos 6 caracteres.",
    );
  }


  // ===================================
  // PERFIL
  // ===================================

  const perfisPermitidos = [
    "operador",
    "colaborador",
  ];


  if (
    !perfisPermitidos.includes(
        perfilSolicitado,
    )
  ) {
    throw new HttpsError(
        "permission-denied",
        "Não é permitido criar esse perfil.",
    );
  }


  // ===================================
  // STATUS
  // ===================================

  const statusPermitidos = [
    "ativo",
    "inativo",
    "pendente",
  ];


  if (
    !statusPermitidos.includes(
        statusSolicitado,
    )
  ) {
    throw new HttpsError(
        "invalid-argument",
        "Status de usuário inválido.",
    );
  }


  // ===================================
  // CRIAR AUTH
  // ===================================

  let novoUsuario;


  try {
    novoUsuario =
            await adminAuth.createUser({

              email,

              password:
                    senha,

              displayName:
                    nome,

            });
  } catch (error) {
    console.error(
        "ERRO AO CRIAR AUTH:",
        error,
    );


    if (
      error.code ===
            "auth/email-already-exists"
    ) {
      throw new HttpsError(
          "already-exists",
          "Este email já está cadastrado.",
      );
    }


    if (
      error.code ===
            "auth/invalid-email"
    ) {
      throw new HttpsError(
          "invalid-argument",
          "Email inválido.",
      );
    }


    if (
      error.code ===
            "auth/invalid-password"
    ) {
      throw new HttpsError(
          "invalid-argument",
          "Senha inválida.",
      );
    }


    throw new HttpsError(
        "internal",
        "Não foi possível criar o usuário.",
    );
  }


  const uid =
        novoUsuario.uid;


  // ===================================
  // CRIAR PERFIL FIRESTORE
  // ===================================

  try {
    await db
        .collection("usuarios")
        .doc(uid)
        .set({

          id:
                    uid,

          nome,

          email,

          perfil:
                    perfilSolicitado,

          status:
                    statusSolicitado,

          permissoes,

          // SEMPRE A EMPRESA DO ADMIN
          idEmpresa,

          nomeEmpresa:
                    adminData.nomeEmpresa || "",

          nomeFantasia:
                    adminData.nomeFantasia || "",

          criadoPor:
                    uidAdmin,

          criadoEm:
                    FieldValue.serverTimestamp(),

        });
  } catch (error) {
    console.error(
        "ERRO AO CRIAR PERFIL:",
        error,
    );


    // ===================================
    // ROLLBACK
    // ===================================

    try {
      await adminAuth.deleteUser(
          uid,
      );
    } catch (rollbackError) {
      console.error(
          "ERRO NO ROLLBACK:",
          rollbackError,
      );
    }


    throw new HttpsError(
        "internal",
        "Não foi possível criar o perfil do usuário.",
    );
  }


  // ===================================
  // RETORNO
  // ===================================

  return {

    sucesso: true,

    uid,

    idEmpresa,

    mensagem:
            "Usuário criado com sucesso.",

  };
});
