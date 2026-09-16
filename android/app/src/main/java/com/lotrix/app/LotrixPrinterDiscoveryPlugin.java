package com.lotrix.app;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONObject;

import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;
import java.nio.charset.StandardCharsets;

@CapacitorPlugin(name = "LotrixPrinterDiscovery")
public class LotrixPrinterDiscoveryPlugin extends Plugin {

    private static final int DISCOVERY_PORT = 9101;
    private static final String DISCOVERY_MESSAGE = "LOTRIX_PRINTER_DISCOVER_V1";

    @PluginMethod
    public void discover(PluginCall call) {
        final int timeoutMs = Math.max(500, Math.min(call.getInt("timeoutMs", 2500), 5000));

        getBridge().execute(() -> {
            try (DatagramSocket socket = new DatagramSocket()) {
                socket.setBroadcast(true);
                socket.setSoTimeout(timeoutMs);

                byte[] message = DISCOVERY_MESSAGE.getBytes(StandardCharsets.UTF_8);
                DatagramPacket request = new DatagramPacket(
                        message,
                        message.length,
                        InetAddress.getByName("255.255.255.255"),
                        DISCOVERY_PORT
                );

                socket.send(request);

                byte[] buffer = new byte[1024];
                DatagramPacket response = new DatagramPacket(buffer, buffer.length);
                socket.receive(response);

                JSONObject service = new JSONObject(new String(
                        response.getData(),
                        0,
                        response.getLength(),
                        StandardCharsets.UTF_8
                ));

                if (!"lotrix-printer".equals(service.optString("service"))) {
                    call.reject("Resposta inválida do serviço de impressão.");
                    return;
                }

                String host = service.optString("host").trim();
                int port = service.optInt("port", 0);

                if (host.isEmpty() || port < 1 || port > 65535) {
                    call.reject("O serviço de impressão informou um endereço inválido.");
                    return;
                }

                JSObject result = new JSObject();
                result.put("host", host);
                result.put("port", port);
                call.resolve(result);
            } catch (Exception error) {
                call.reject("Não foi possível localizar o Printer Service na rede local.", error);
            }
        });
    }
}
