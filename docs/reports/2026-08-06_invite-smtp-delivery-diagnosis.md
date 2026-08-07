# Diagnóstico de entrega de convites e SMTP — 2026-08-06

## Resumo

O fluxo de convite foi corrigido no backend e a migration de hardening foi aplicada no Supabase remoto. A configuração SMTP customizada aparece habilitada no projeto remoto, mas a entrega real ainda depende da senha SMTP válida e da política do Google.

## Evidências remotas

- Supabase Auth SMTP: custom SMTP habilitado.
- Host: `smtp.gmail.com`; porta: `587`.
- Remetente e usuário exibidos: `ede.oliveira@confi.com.vc`.
- A senha não é legível depois de salva; sua validade não pode ser comprovada por inspeção.
- O teste registrado em `2026-08-06T00:29:41Z` gerou `mail.send`, mas o log indicou o remetente padrão `noreply@mail.app.supabase.io`.
- A chamada seguinte da Edge Function `internal-access-invite` terminou em HTTP 500. Esse teste ocorreu antes da aplicação final da correção de claim do `service_role`.
- Os últimos convites remotos desse ciclo permaneceram `pending`, com `delivery_attempts = 0`; não houve remoção, reset ou alteração destrutiva.

## Estado entregue

- Commit: `de859df fix(access): aceitar claim de service role na entrega`.
- Migration `20260806005940_access_01_3_invitation_delivery_claim_hardening.sql` aplicada local e remotamente.
- Edge Function `internal-access-invite` redeployada e ativa.
- Teste local completo: HTTP 200, status `sent` e mensagem capturada pelo Mailpit.
- Preflight CORS remoto: HTTP 200.

## Limitação e confirmação final

O painel não permite validar a senha SMTP sem substituí-la. Para Gmail, deve ser usada uma App Password com 2FA habilitado, não a senha normal da conta. O teste final de produção deve ser feito após salvar novamente essa App Password e criar um novo convite.

Critérios de sucesso: POST da Edge Function em HTTP 200, convite `sent`, `delivery_attempts = 1`, ausência de erro Auth/SMTP nos logs e mensagem presente na caixa de entrada ou spam.

Nenhum e-mail real adicional foi disparado automaticamente durante esta verificação.
