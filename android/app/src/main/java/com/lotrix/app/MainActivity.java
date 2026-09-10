package com.lotrix.app;

import android.app.AlertDialog;
import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.provider.Settings;

import com.getcapacitor.BridgeActivity;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MainActivity extends BridgeActivity {

    private static final String VERSION_URL =
            "https://lotrix-app.alessandromsilva4.workers.dev/version.json";

    private static final String APK_FILE_NAME = "lotrix-update.apk";

    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        verificarAtualizacao();
    }

    private void verificarAtualizacao() {
        executor.execute(() -> {
            try {
                URL url = new URL(VERSION_URL);
                HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                connection.setRequestMethod("GET");
                connection.setConnectTimeout(10000);
                connection.setReadTimeout(10000);
                connection.setRequestProperty("Cache-Control", "no-cache");

                if (connection.getResponseCode() != HttpURLConnection.HTTP_OK) {
                    connection.disconnect();
                    return;
                }

                BufferedReader reader = new BufferedReader(
                        new InputStreamReader(connection.getInputStream())
                );

                StringBuilder response = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    response.append(line);
                }

                reader.close();
                connection.disconnect();

                JSONObject json = new JSONObject(response.toString());
                String versaoDisponivel = json.getString("versao");
                String urlApk = json.getString("urlApk");

                String versaoInstalada = getPackageManager()
                        .getPackageInfo(getPackageName(), 0).versionName;

                if (versaoInstalada == null) {
                    versaoInstalada = "0.0.0";
                }

                if (compararVersoes(versaoDisponivel, versaoInstalada) > 0) {
                    String finalVersaoDisponivel = versaoDisponivel;
                    String finalUrlApk = urlApk;

                    runOnUiThread(() -> mostrarDialogAtualizacao(
                            finalVersaoDisponivel,
                            finalUrlApk
                    ));
                }
            } catch (Exception ignored) {
                // Sem internet/servidor indisponível: o Lotrix continua normalmente.
            }
        });
    }

    private int compararVersoes(String nova, String atual) {
        try {
            String[] novaPartes = nova.replace("v", "").split("\\.");
            String[] atualPartes = atual.replace("v", "").split("\\.");

            int tamanho = Math.max(novaPartes.length, atualPartes.length);

            for (int i = 0; i < tamanho; i++) {
                int novaNumero = i < novaPartes.length
                        ? Integer.parseInt(novaPartes[i]) : 0;
                int atualNumero = i < atualPartes.length
                        ? Integer.parseInt(atualPartes[i]) : 0;

                if (novaNumero > atualNumero) return 1;
                if (novaNumero < atualNumero) return -1;
            }
        } catch (Exception ignored) {
        }

        return 0;
    }

    private void mostrarDialogAtualizacao(String novaVersao, String urlApk) {
        new AlertDialog.Builder(this)
                .setTitle("Nova versão disponível")
                .setMessage(
                        "Uma nova versão do Lotrix está disponível.\n\n" +
                        "Nova versão: " + novaVersao +
                        "\n\nDeseja atualizar agora?"
                )
                .setPositiveButton(
                        "Atualizar agora",
                        (dialog, which) -> baixarAtualizacao(urlApk)
                )
                .setNegativeButton("Depois", null)
                .setCancelable(false)
                .show();
    }

    private void baixarAtualizacao(String urlApk) {
        try {
            DownloadManager downloadManager =
                    (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);

            DownloadManager.Request request =
                    new DownloadManager.Request(Uri.parse(urlApk));

            request.setTitle("Atualização do Lotrix");
            request.setDescription("Baixando nova versão...");
            request.setMimeType("application/vnd.android.package-archive");
            request.setNotificationVisibility(
                    DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED
            );
            request.setDestinationInExternalFilesDir(
                    this,
                    Environment.DIRECTORY_DOWNLOADS,
                    APK_FILE_NAME
            );

            long downloadId = downloadManager.enqueue(request);
            registrarDownloadConcluido(downloadId);

            new AlertDialog.Builder(this)
                    .setTitle("Baixando atualização")
                    .setMessage(
                            "A atualização está sendo baixada. " +
                            "Quando terminar, a instalação será iniciada."
                    )
                    .setPositiveButton("OK", null)
                    .show();

        } catch (Exception e) {
            new AlertDialog.Builder(this)
                    .setTitle("Erro na atualização")
                    .setMessage("Não foi possível iniciar o download da atualização.")
                    .setPositiveButton("OK", null)
                    .show();
        }
    }

    private void registrarDownloadConcluido(long downloadId) {
        BroadcastReceiver receiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                long id = intent.getLongExtra(
                        DownloadManager.EXTRA_DOWNLOAD_ID, -1
                );

                if (id != downloadId) return;

                DownloadManager manager =
                        (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);

                Uri apkUri = manager.getUriForDownloadedFile(downloadId);

                if (apkUri != null) {
                    instalarApk(apkUri);
                } else {
                    new AlertDialog.Builder(MainActivity.this)
                            .setTitle("Erro")
                            .setMessage("O download da atualização não foi concluído.")
                            .setPositiveButton("OK", null)
                            .show();
                }

                try {
                    unregisterReceiver(this);
                } catch (Exception ignored) {
                }
            }
        };

        registerReceiver(
                receiver,
                new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE),
                Context.RECEIVER_EXPORTED
        );
    }

    private void instalarApk(Uri apkUri) {
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(
                    apkUri,
                    "application/vnd.android.package-archive"
            );
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(intent);
        } catch (Exception e) {
            try {
                Intent settingsIntent = new Intent(
                        Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES
                );
                settingsIntent.setData(
                        Uri.parse("package:" + getPackageName())
                );
                startActivity(settingsIntent);
            } catch (Exception ignored) {
            }
        }
    }

    @Override
public void onDestroy() {
        super.onDestroy();
        executor.shutdownNow();
    }
}
