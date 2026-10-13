Set WshShell = CreateObject("WScript.Shell")
Dim fso: Set fso = CreateObject("Scripting.FileSystemObject")
Dim scriptDir: scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
Dim projectDir: projectDir = fso.GetParentFolderName(scriptDir)

WshShell.CurrentDirectory = projectDir
WshShell.Run "pythonw.exe -m agent_abs.cli --once", 0, True
