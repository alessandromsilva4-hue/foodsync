Option Explicit

' Inicia o Lotrix Printer Service sem abrir uma janela de terminal.
Dim shell, pastaServico, node, servidor, comando

pastaServico = "C:\FoodSync\printer-service"
node = "C:\Program Files\nodejs\node.exe"
servidor = pastaServico & "\server.js"

Set shell = CreateObject("WScript.Shell")
shell.CurrentDirectory = pastaServico
comando = Chr(34) & node & Chr(34) & " " & Chr(34) & servidor & Chr(34)
shell.Run comando, 0, False
