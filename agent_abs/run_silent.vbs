Set WshShell = CreateObject("WScript.Shell")
Dim fso: Set fso = CreateObject("Scripting.FileSystemObject")
Dim scriptDir: scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
Dim projectDir: projectDir = fso.GetParentFolderName(scriptDir)

WshShell.CurrentDirectory = projectDir

' Usa o pythonw do .venv (sem janela); se nao existir, cai para o pythonw do PATH.
Dim pyw: pyw = projectDir & "\.venv\Scripts\pythonw.exe"
If Not fso.FileExists(pyw) Then pyw = "pythonw.exe"

WshShell.Run """" & pyw & """ -m agent_abs.cli --once", 0, True
