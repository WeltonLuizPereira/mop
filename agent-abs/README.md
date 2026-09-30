# Agente de importação ABS

Processo local que lê `BASE_ABS.xlsx` na rede e envia os apontamentos para o Supabase. Ele deve rodar em uma máquina Windows que tenha acesso ao compartilhamento da planilha.

## Instalação

Na pasta `agent-abs`:

```powershell
npm install
Copy-Item .env.example .env
```

Configure no ambiente do processo as variáveis descritas em `.env.example`. A chave `SUPABASE_SERVICE_ROLE_KEY` é secreta e nunca deve ser exposta no frontend ou commitada.

Em `SUPABASE_URL`, informe somente a origem do projeto, como `https://seu-projeto.supabase.co`. O agente também normaliza automaticamente valores que tenham recebido `/rest/v1` por engano.

## Validação

Antes de enviar dados, valide a leitura da planilha:

```powershell
$env:ABS_FILE_PATH='\\servidor\pasta\BASE_ABS.xlsx'
npm run dry-run
```

O comando informa a quantidade de linhas e de status desconhecidos, sem acessar o Supabase.

## Execução agendada

Depois do dry-run, execute `npm start`. No Agendador de Tarefas do Windows, use a pasta `agent-abs` como diretório inicial e disponibilize as três variáveis de ambiente para a conta que executará a tarefa.
