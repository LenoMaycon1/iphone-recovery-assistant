# Ferramentas externas (libimobiledevice)

O aplicativo usa tres programas de linha de comando para ler informacoes do iPhone por USB:

| Programa | Para que serve | Usado quando |
| --- | --- | --- |
| `idevice_id.exe` | Lista os iPhones conectados em modo normal | Aparelho desbloqueado e confiado |
| `ideviceinfo.exe` | Le modelo, versao do iOS e numero de serie | Aparelho desbloqueado e confiado |
| `irecovery.exe` | Le informacoes em modo Recovery ou DFU | Aparelho em Recovery ou DFU |

O aplicativo procura esses arquivos somente nesta pasta (`tools/`). Ele nao usa programas instalados em outros lugares do computador.

## Origem oficial

- Projeto: libimobiledevice, https://libimobiledevice.org
- Codigo e releases: https://github.com/libimobiledevice/libimobiledevice
- libirecovery (para `irecovery`): https://github.com/libimobiledevice/libirecovery
- Compilacao no Windows: o projeto recomenda MSYS2 (MinGW 64-bit), com o script de build da propria documentacao oficial.

Versoes de referencia verificadas no momento desta configuracao:

- libirecovery 1.3.1 (lancada em 2025-10-17), segundo a pagina oficial do projeto.
- libimobiledevice: use a versao mais recente publicada no repositorio oficial e anote a versao usada no campo abaixo.

Versao usada neste projeto: ____________ (preencher ao copiar os arquivos)
Data da obtencao: ____________
Origem exata (URL da release ou comando de compilacao): ____________

## Como obter os arquivos

1. Prefira compilar a partir do codigo oficial seguindo a documentacao do projeto (MSYS2).
2. Se usar um pacote pronto, use apenas uma fonte que voce consiga conferir (o projeto oficial ou uma build publicada por um mantenedor conhecido).
3. Nao baixe executaveis de sites desconhecidos, de anuncios ou de compartilhamentos de terceiros.

## Verificacao antes de copiar

Calcule o SHA-256 de cada arquivo no Windows e compare com o valor publicado pela origem:

```
certutil -hashfile tools\idevice_id.exe SHA256
```

Repita para `ideviceinfo.exe` e `irecovery.exe`. Se a origem nao publicar hash, registre o valor calculado no campo abaixo para futuras conferencias.

| Arquivo | SHA-256 |
| --- | --- |
| idevice_id.exe | |
| ideviceinfo.exe | |
| irecovery.exe | |

## Dependencias de DLL

Os executaveis precisam das DLLs que acompanham a build (por exemplo libimobiledevice, libplist, libusbmuxd, libimobiledevice-glue, libirecovery, libusb e OpenSSL). Copie todas as DLLs para esta pasta, junto dos executaveis.

## Drivers da Apple

O Windows precisa do driver USB da Apple para que os programas enxerguem o iPhone. Instale um destes:

- Apple Devices (Microsoft Store), ou
- iTunes para Windows (versao de desktop, com os drivers Apple Mobile Device).

Sem esse driver, o aplicativo mostra o aviso de driver ausente.

## Seguranca

- Esta pasta nao deve receber programas de origem desconhecida.
- Os arquivos `.exe` e `.dll` estao no `.gitignore` e nao sao enviados ao repositorio.
- O instalador inclui esta pasta como recurso extra. Remova daqui qualquer arquivo que nao tenha sido conferido antes de gerar o instalador.
