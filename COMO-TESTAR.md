# Como testar o Genius Support OS no seu computador

> Feito para uso local de teste. Nao usar em producao.

## Jeito facil (1 clique)

1. Verifique que o **Docker Desktop** esta instalado e **aberto** (icone verde).
   - Se nao tiver: https://www.docker.com/products/docker-desktop/
2. Na pasta do projeto, de **dois cliques** em **`INICIAR-GENIUS.bat`**.
3. Espere. Na primeira vez demora (baixa e prepara tudo). Uma janela preta vai
   mostrando o progresso.
4. Quando terminar, o navegador abre em **http://localhost:4173**.
   Se abrir em branco, espere alguns segundos e aperte **F5**.
5. **Deixe a janela preta aberta** enquanto estiver testando. Para desligar,
   feche a janela.

## Login de administrador

- Usuario: `qa.local.platform-admin@genius.local`
- Senha: variável local ignorada `LOCAL_QA_ADMIN_PASSWORD`

### Outros usuarios de teste (opcional)

| Perfil | Usuario | Senha |
| --- | --- | --- |
| Admin da plataforma | qa.local.platform-admin@genius.local | `LOCAL_QA_ADMIN_PASSWORD` |
| Suporte (gestor) | qa.local.support-manager-a@genius.local | `LOCAL_QA_SUPPORT_MANAGER_PASSWORD` |
| Customer Success | qa.local.customer-success-a@genius.local | `LOCAL_QA_CUSTOMER_SUCCESS_PASSWORD` |
| Engenharia | qa.local.engineering-member-a@genius.local | `LOCAL_QA_ENGINEERING_PASSWORD` |

## Testar o tema claro/escuro

No canto inferior da barra lateral esquerda existe o seletor **Tema**:
**Claro / Escuro / Sistema**. Alterne para ver as telas nos dois modos.

## Se algo der errado

Copie a ultima mensagem da janela preta e me envie aqui — eu ajusto.
Erros comuns: Docker fechado, ou a porta 4173/54321 ja em uso.
