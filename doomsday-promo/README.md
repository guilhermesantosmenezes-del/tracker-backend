# PARANOIA — DOOMSDAY · Promo Stories 30s

Vídeo vertical 1080 × 1920, 30 s, feito com **HTML5 + CSS3 + JavaScript + GSAP 3.12.5 (Timeline) + three.js r149**.
Usa as imagens do ensaio **Doomsday** (Drive › nova marca › gemini › ensaio - doomsdays), com a **Stories 3, a arte, como protagonista**.

## Rodar

```bash
cd doomsday-promo
python3 -m http.server 8080      # abrir http://localhost:8080
```
(É preciso servir por http: o three.js carrega as texturas por URL.)
Atalhos: espaço = play/pause · R = reiniciar · ← / → = ±1 s · `?t=12.5` abre o vídeo pausado nesse ponto.

Exportar MP4: `node tools/render.mjs` (precisa de Playwright e ffmpeg) → `out/paranoia-bad-vibes.mp4`, ou `--out nome.mp4` para escolher o nome.

## Roteiro

| tempo | cena | técnica |
|---|---|---|
| 0.00 | montagem relâmpago: detalhes do desenho, whip-pan, card | cortes a cada 3–4 quadros, logo fixo |
| 1.00 | Stories 1 (costas) | recorte de papel, punch-ins na estampa |
| 4.20 | **zoom-through** na estampa das costas | mergulho acelerado na foto → corte |
| 4.50 | **HERO A — Vertigo** | three.js: o desenho separado em camadas de profundidade (fundo-fantasma, túnel das chamas, bode, letreiros, brasas). Dolly zoom: a câmera recua enquanto a FOV fecha — o bode fica do mesmo tamanho e o mundo atrás dele colapsa |
| 7.85 | **zoom-through** no olho do bode | corte para a tela branca |
| 8.30 | tela branca "dooms / day" | batidas do vídeo de referência |
| 8.63 | Stories 2 (frente) | recorte de papel caindo sobre a tela branca |
| 12.00 | **zoom-through** na estampa do peito | |
| 12.30 | **HERO B — corredor** | a câmera atravessa 10 recortes rasgados do desenho (cabeça, asa, costelas, chamas, letreiro…), cada um é um zoom-through; no fim, Vertigo-snap no bode |
| 16.40 | tela branca #2 | |
| 16.73 | Stories 3 (a arte) | colagem: 2 fragmentos + recorte principal, punch-ins no olho, costelas, chamas e letreiro |
| 20.40 | **zoom-through** no olho | |
| 20.70 | **HERO C — abismo** | Vertigo reverso: a câmera avança enquanto a FOV abre, e o fundo é arrancado para trás |
| 25.30 | "doomsday" em 5 fontes, 0,2 s cada, sem logo | máquina de escrever → normal → slab (em brasa) → manuscrita → estendida |
| 26.37 | logo sozinho até o fim | |

## Design DNA — noir colorido (não P&B)

| token | cor | uso |
|---|---|---|
| ink | `#06070a` | o vazio, preto azulado |
| steel | `#5e6b73` | sombras frias |
| bone | `#e9dcc3` | o osso do desenho, papel, realces quentes |
| ember | `#e4532b` | o laranja das chamas da arte — a única cor quente |

O grade (em `tools/prep_assets.py`) dessatura parcialmente, esfria as sombras, aquece os realces, esmaga os pretos e **preserva o laranja da arte**. As imagens originais ficam intactas em `assets/stories/`; as versões tratadas ficam em `assets/graded/`, e os recortes do desenho (com alfa) em `assets/cutouts/`.

## Estrutura

```
index.html            camadas: fotos · cena 3D (canvas) · cartões · final · logo fixo · névoa · grão
css/style.css         Design DNA, tipografia
js/main.js            Timeline GSAP de 30 s; também controla a câmera 3D
js/three-scenes.js    cenas three.js: vertigo, corredor e abismo, montadas a partir da Stories 3
js/fx.js              utilitários: papel rasgado, texturas, grão
tools/prep_assets.py  grade noir + recortes do desenho
tools/render.mjs      exportação MP4 quadro a quadro
```
