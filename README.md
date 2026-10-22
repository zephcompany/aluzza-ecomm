# Aluzza Calçados — front-end do e-commerce

Site estático (HTML + CSS + JS puro), sem dependências de build. Abra `index.html`
em um servidor local (ex.: `python3 -m http.server`) ou publique a pasta inteira.

## Estrutura
- `index.html` — home (preloader, hero com vídeo + 2 banners, categorias, novidades, compre por cor, mais vendidos, Semana Aluzza com contador, história, promoção, UGC, avaliações, alz-clube)
- `categoria.html?c=saltos|sapatilhas|rasteiras|tenis|promocao|novidades|todos[&s=sub][&q=busca][&h=altura][&sort=]` — listagem com filtros, ordenação e "ver mais"
- `produto.html?p=slug` — página de produto (galeria com zoom, cores da família, tamanhos com estoque, Veja em você, frete, avaliações, cross-sell, vistos recentemente)
- `carrinho.html`, `checkout.html` (3 etapas), `pedido.html?n=` (confirmação com Pix)
- `login.html`, `conta.html` (pedidos, dados, endereços, favoritos, Clube Aluzza), `favoritos.html`
- `sobre.html`, `contato.html`, `ajuda.html` (rastreio, trocas, frete, pagamento, cupons, tamanhos, confiança, privacidade)
- `assets/css/style.css` — design system (tokens em `:root`)
- `assets/js/app.js` — header/footer, busca, sacola, favoritos, cupons, checkout e a lógica de cada página (`data-page` no `<body>`)
- `assets/js/catalog.js` — catálogo de demonstração: 32 produtos do site atual que já têm **foto padrão** (`pack`, fundo off-white gerado por IA). As fotos originais ficam em `images` (1ª aparece no hover do card). Substituir pela API.
- `assets/catalog-full.json` — os 75 produtos extraídos do site atual (inclusive os 43 ainda sem foto padrão). O menu e as listagens se adaptam sozinhos às categorias que existirem no catálogo.
- `assets/img/products` — fotos reais dos produtos (720×960 WebP), `assets/img/banners` — banners, `assets/video/hero.mp4` — vídeo do hero (montagem de clipes do Pexels, uso livre, 31 s)

## Integração com o back-end
Tudo que é regra de negócio está em `CFG` no topo de `app.js` (frete grátis, parcelas, desconto Pix, cupons, WhatsApp).
Os pontos de integração estão marcados com `// API:` (catálogo, CEP, pagamento, login).
Estado do front (sacola, favoritos, usuário, pedidos) fica em `localStorage` com prefixo `aluzza_`.

## Fotos padrão (packshots)
Geradas a partir da 1ª foto de cada produto (Gemini / ChatGPT) e normalizadas para 720×960 com fundo `#F7F4EF`.
Para adicionar um produto novo: gere a foto, salve como `assets/img/products/pk{id}.webp` e informe `pack` no catálogo.

## Observações
- O "Veja em você" é apenas a interface (alz-dialog explicativo + aviso), conforme combinado.
- Avaliações, pontos do clube e pedidos de exemplo são dados de demonstração.
- Fontes: Marcellus + Jost (Google Fonts).
