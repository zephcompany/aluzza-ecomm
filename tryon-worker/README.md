# Aluzza · Provador virtual (Veja em você)

Worker que recebe a foto do pé da cliente + a imagem do calçado e devolve a foto dela calçando o modelo.
A chave da API fica só aqui, nunca no site.

## Subir em 3 passos

1. **Chave do modelo de imagem** — crie uma chave em https://aistudio.google.com/apikey (Gemini, modelo `gemini-2.5-flash-image`, ~US$ 0,04 por foto).
2. **Deploy** — clique em
   [Deploy to Cloudflare](https://deploy.workers.cloudflare.com/?url=https://github.com/zephcompany/aluzza-ecomm/tree/main/tryon-worker)
   (conta gratuita da Cloudflare basta). Ou localmente: `npm i && npx wrangler deploy`.
3. **Segredo** — no painel do Worker: Settings → Variables and Secrets → adicione `GEMINI_API_KEY`.
   Ou no terminal: `npx wrangler secret put GEMINI_API_KEY`.

Depois, cole a URL do worker (ex.: `https://aluzza-tryon.SEU-USUARIO.workers.dev`) em:
- site estático: `assets/js/app.js` → `CFG.TRYON_ENDPOINT`
- tema Shopify: Personalizar → Configurações do tema → Provador virtual → URL do provador

## Opcional
- `ALLOWED_ORIGINS` = `https://zephcompany.github.io,https://1qrrh6-t0.myshopify.com,https://aluzzacalcados.com.br` para travar quem pode chamar.
- `PROVIDER=fal` + segredo `FAL_KEY` para usar o fal.ai (`fal-ai/nano-banana/edit`) no lugar do Gemini.

## Teste rápido
```
curl -s https://SEU-WORKER.workers.dev/            # {"ok":true,...}
```
