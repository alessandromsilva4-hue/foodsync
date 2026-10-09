# Lotrix

Sistema de etiquetas de validade para alimentos. Este repositório também contém o aplicativo Android e o serviço local de impressão.

## Estrutura

- `www/` — aplicação web publicada pelo Firebase Hosting e usada como `webDir` do Capacitor.
  - `www/css/`, `www/js/`, `www/img/` e `www/assets/` — estilos, código, imagens e recursos do site.
  - `www/downloads/` — instaladores oferecidos pelo próprio site.
- `functions/` — Cloud Functions do Firebase. A configuração oficial fica no `firebase.json` da raiz.
- `firestore.rules` — regras do Firestore.
- `android/` — projeto Android nativo gerado e mantido pelo Capacitor.
- `assets/` — recursos-fonte usados na geração de ícones do aplicativo.
- `printer-service/` — serviço local que conversa com as impressoras. Certificados e dados de pareamento são locais e não devem ser enviados ao Git.
- `scripts/` — verificações e ferramentas de manutenção do projeto.
- `private/` — credenciais locais. Esta pasta é ignorada pelo Git e fica fora da pasta publicada.
- `www-backup-multiempresa/` — cópia de segurança antiga; não é usada pelo aplicativo atual.

## Fluxo de trabalho

Edite o site dentro de `www/`. Para verificar a sintaxe web, execute `npm run check:web` na raiz.

Os deploys devem ser iniciados na raiz do repositório:

```powershell
firebase deploy --only hosting:default,hosting:lotrix
firebase deploy --only functions
```

Para sincronizar o site com o projeto Android depois de alterar `www/`:

```powershell
npx cap sync android
```

Não coloque chaves, certificados ou arquivos de pareamento dentro de `www/`: tudo que fica nessa pasta pode ser publicado pelo Hosting.
