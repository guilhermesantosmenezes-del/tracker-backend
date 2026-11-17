# PARANOIA — BAD VIBES · Promo Stories 30s

Vídeo promocional vertical (1080 × 1920, 30 s) feito só com **HTML5 + CSS3 + JavaScript + GSAP 3.12.5 (Timeline)**.
Não usa nenhum vídeo pré-renderizado: tudo é animado ao vivo no navegador.

## Como rodar

Recomendado servir a pasta (as fontes carregam melhor via http):

```bash
cd paranoia-promo
python3 -m http.server 8080
# abrir http://localhost:8080
```

Abrir o `index.html` direto (`file://`) também funciona na maioria dos navegadores.

Controles: **espaço** play/pause · **R** reinicia · **← / →** ±1 s · clique no vídeo = play/pause ·
`index.html?t=12.5` abre pausado em 12,5 s.

## Exportar MP4 (opcional, para postar no Instagram)

```bash
npm i playwright && npx playwright install chromium   # se ainda não tiver
node tools/render.mjs                    # -> out/paranoia-bad-vibes.mp4 (30 fps, H.264)
node tools/render.mjs --frames 0,300,800 # stills PNG em out/frames/
```

O render captura quadro a quadro a mesma GSAP Timeline (`window.PARANOIA.seek(t)`), então o MP4 sai idêntico ao que roda no navegador.

## Roteiro (GSAP Timeline)

| tempo | cena | transição |
|---|---|---|
| 0.00 | montagem relâmpago: 8 cortes em 1 s (detalhes, whip-pan, card central), logo fixo | cortes secos a cada 3–4 quadros |
| 1.00 | 01 Fears Grow Old with the Heart | recorte de papel rasgado entra por baixo, é "colado" com fita e assume a tela |
| 3.95 | 02 Cold Alone Alive | recorte entra pela direita, sobre a cena 01 |
| 7.15 | **BAD VIBEEEES** #1 | corte seco |
| 8.80 | 03 Evil Walks Beside Me | faixa de papel horizontal colada sobre o cartaz |
| 11.90 | 04 Blinding Faith | colagem: 2 fragmentos + recorte principal |
| 15.25 | **BAD VIBEEEES** #2 | corte seco |
| 16.95 | 05 Reign in Hell | recorte de canto sobre o cartaz |
| 20.05 | 06 NMA (Negative Mental Attitude) | faixa vertical caindo de cima |
| 23.45 | **BAD VIBES** — 5 estilos | cortes secos: Anton → máquina de escrever → carta-resgate → contorno empilhado → Blackletter CS Modula + logo |
| 30.00 | fim no logo | — |

Dentro de cada camiseta, seguindo o vídeo de referência: cortes secos de zoom no detalhe da estampa e do adesivo, um quadro de whip-pan (borrão de movimento) e um último punch-in antes da próxima entrada. O logo não se mexe em nenhum desses momentos. Os pontos de foco ficam em `SHIRTS[].focus`, no `js/main.js`.

## Estrutura

```
index.html          camadas: cenas · logo fixo · grão · flash; filtros SVG de "xerox"
css/style.css       estética P&B, fontes, papel, tipografia
js/fx.js            utilitários determinísticos: polígonos de papel rasgado, texturas grunge, grão
js/main.js          conteúdo, coreografia e a Timeline GSAP de 30 s
tools/render.mjs    exportação opcional para MP4
assets/stories/     imagens Stories originais (do Drive, sem alterações)
assets/logo/        paranoia logo branca 2.png (pasta adesivos do Drive)
assets/fonts/       fontes (veja abaixo)
vendor/gsap.min.js  GSAP 3.12.5
```

## Observações

- **Logotipo** — `#logo` fica numa camada própria, centralizado, fora do contêiner que treme; ele nunca é animado, apenas aparece ou some com corte seco (ele some nos cartazes BAD VIBEEEES e no encerramento, onde reaparece no 5º estilo).
- **Imagens** — são os arquivos Stories originais, sem nenhuma alteração. O preto e branco é um filtro CSS aplicado só na exibição (`.piece .photo img` em `style.css`); para ver as cores originais, basta remover o `grayscale(1)`.
- **Fonte Blackletter CS Modula** — é uma fonte licenciada e não estava no Drive. O CSS já a utiliza automaticamente quando ela estiver instalada no computador ou quando o arquivo for colocado em `assets/fonts/` como `BlackletterCSModula.woff2`, `.otf` ou `.ttf`. Até lá, entra a fonte reserva UnifrakturCook. Os títulos se ajustam sozinhos à largura, seja qual for a fonte.
- **Estampas usadas** — foi usada a "stories 1" de cada ensaio: Cold Alone Alive *roxa* e Reign in Hell *amarela*. Para trocar, basta substituir o arquivo em `assets/stories/`.
