const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {initializeApp} = require("firebase-admin/app");
const {getAuth} = require("firebase-admin/auth");
const {
  getFirestore,
  FieldValue,
} = require("firebase-admin/firestore");

initializeApp();

const adminAuth = getAuth();
const db = getFirestore();


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
