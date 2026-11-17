"""Builds the PARANOIA "DOOMSDAY" sales commercial as a HyperFrames composition.

    python3 gen.py 9x16   -> index.html      (1080x1920, primary)
    python3 gen.py 16x9   -> ../film-16x9/index.html  (1920x1080, recomposed)

One script, two layouts: every position/size is computed from the canvas.
Fonts: ONLY the DOOMSDAY faces (assets/fonts): CS Modula Stamp (letters) and
Aveinatortia (digits, punctuation, and the accent marks the demo fonts lack).
"""
import json
import os
import sys

FMT = sys.argv[1] if len(sys.argv) > 1 else '9x16'
W, H = (1080, 1920) if FMT == '9x16' else (1920, 1080)
V = FMT == '9x16'
DUR = 30
BASE = 1080                      # type scale reference (same in both formats)
CY = int(H * 0.40) if V else H // 2   # text centre: inside the 9:16 safe band (168-1330)

# Tarantino grade written by `hyperframes media-treatment --grading grading.json --apply`
GRADE = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'grade_attr.txt')).read()

C = dict(yellow='#FFD21F', blood='#B3120F', black='#0A0807', bone='#F1E6CF')

clips = []      # html strings
tl = []         # js lines
z = [10]


def zi():
    z[0] += 1
    return z[0]


def clip(tag_id, start, dur, inner, style='', cls='', extra=''):
    clips.append(
        f'<div id="{tag_id}" class="clip {cls}" data-start="{start:.3f}" data-duration="{dur:.3f}" '
        f'data-track-index="1" style="z-index:{zi()};{style}" {extra}>{inner}</div>')


def photo(img_id, src, focus=(50, 50)):
    return (f'<div class="ph-wrap" id="{img_id}-w"><img data-color-grading="{GRADE}" id="{img_id}" class="ph" src="assets/img/{src}" alt="" '
            f'style="object-position:{focus[0]}% {focus[1]}%"></div>')


# ----------------------------------------------------------------- text with built accent marks
def word(text):
    """Turn PT text into spans: letters in Modula; accents/punctuation built from Aveinatortia."""
    out = []
    for ch in text:
        if ch in 'ÍÉÁÓÚ':
            out.append(f'<span class="acc acute">{"IEAOU"["ÍÉÁÓÚ".index(ch)]}</span>')
        elif ch in 'ÃÕ':
            out.append(f'<span class="acc tilde">{"AO"["ÃÕ".index(ch)]}</span>')
        elif ch == 'Ç':
            out.append('<span class="acc ced">C</span>')
        elif ch in '0123456789.:,!+-':
            out.append(f'<span class="av">{ch}</span>')
        elif ch == ' ':
            out.append(' ')
        else:
            out.append(ch)
    return ''.join(out)


def title(text, size, color, extra_cls=''):
    return f'<div class="t {extra_cls}" style="font-size:{size}px;color:{color}">{word(text)}</div>'


# ----------------------------------------------------------------- scenes
T = {}
# 0.00 HOOK: the shirt, punch-in on the first beat
clip('hook-ph', 0, 0.6, photo('hookimg', 'doomsday-stories-1.png', (50, 52)))
tl.append("tl.fromTo('#hookimg',{scale:1.08},{scale:1.08,duration:0.01},0);")
tl.append("tl.set('#hookimg',{scale:1.42,transformOrigin:'52% 53%'},0.43);")
tl.append("tl.fromTo('#hookimg',{x:0},{x:0,duration:0.17,ease:'none'},0.43);")
# 0.60 "PARANOIA" giant, running away into the black
clip('hook-t', 0.6, 1.4, title('PARANOIA', int(BASE * 0.42), C['yellow'], 'hook-title'),
     style=f'background:{C["black"]}')
tl.append("tl.fromTo('#hook-t .t',{scale:3.4},{scale:0.06,duration:1.4,ease:'power3.in'},0.6);")

# chapter cards + shirt shots
CH = [
    # start, card bg, card fg, small label, big title, photo, focus, close point, close zoom, freeze text
    (2.0, C['yellow'], C['black'], 'CAPÍTULO 1:', 'DOOMSDAY', 'doomsday-stories-1.png', (50, 52), (52, 53), 2.3, ['DOOMSDAY']),
    (10.0, C['black'], C['yellow'], 'CAPÍTULO 3:', 'VISTA.', 'doomsday-stories-2.png', (50, 40), (64, 36), 2.6, ['DOOMSDAY', 'FRENTE + COSTAS']),
]
for n, (t0, bg, fg, small, big, img, focus, cp, cz, frz) in enumerate(CH):
    k = f'c{n}'
    card = (f'<div class="card" style="background:{bg}">'
            f'{title(small, int(BASE * 0.075), fg, "small")}{title(big, int(BASE * 0.2), fg)}</div>')
    clip(f'{k}-card', t0, 0.9, card)
    clip(f'{k}-full', t0 + 0.9, 1.3, photo(f'{k}img', img, focus))
    tl.append(f"tl.fromTo('#{k}img',{{scale:1.0}},{{scale:1.08,duration:1.3,ease:'none'}},{t0 + 0.9});")
    clip(f'{k}-close', t0 + 2.2, 1.8, photo(f'{k}cl', img, focus))
    tl.append(f"tl.fromTo('#{k}cl',{{scale:{cz},transformOrigin:'{cp[0]}% {cp[1]}%'}},"
              f"{{scale:{cz * 1.06:.3f},duration:0.9,ease:'none'}},{t0 + 2.2});")
    # FREEZE at t0+3.1: hold the frame (no more movement), punch the name in
    tl.append(f"tl.set('#{k}cl',{{scale:{cz * 1.06:.3f}}},{t0 + 3.1});")
    frz_html = ''.join(title(s, int(BASE * (0.21 if i == 0 else 0.07)), C['yellow'] if i == 0 else C['bone'], 'frz')
                       for i, s in enumerate(frz))
    clip(f'{k}-frz', t0 + 3.1, 0.9, f'<div class="frzbox">{frz_html}</div>')
    tl.append(f"tl.fromTo('#{k}-frz .frzbox',{{scale:1.7,rotation:-4}},{{scale:1,rotation:-2,duration:0.18,ease:'power4.out'}},{t0 + 3.1});")
    tl.append(f"tl.fromTo('#{k}-frz .frzbox',{{x:0}},{{x:14,duration:0.5,ease:'shake'}},{t0 + 3.16});")
    tl.append(f"tl.fromTo('#{k}-flash',{{opacity:0.95}},{{opacity:0,duration:0.12,ease:'none'}},{t0 + 3.1});")
    clips.append(f'<div id="{k}-flash" class="clip flash" data-start="{t0 + 3.1:.3f}" data-duration="0.2" data-track-index="2" style="z-index:900"></div>')

# CHAPTER 2: the print as a xerox collage (6.0-10.0)
card2 = (f'<div class="card" style="background:{C["blood"]}">'
         f'{title("CAPÍTULO 2:", int(BASE * 0.075), C["bone"], "small")}{title("A ESTAMPA", int(BASE * 0.17), C["bone"])}</div>')
clip('e-card', 6.0, 0.9, card2)
pw = int(min(W * 0.86, H * 0.62 * 3438 / 4063))
collage = f'''<div class="xerox"></div>
<div class="spray" style="left:12%;top:18%;width:46%;height:24%"></div>
<div class="spray" style="left:52%;top:58%;width:40%;height:26%"></div>
<div class="sheet" id="e-sheet" style="width:{pw}px;height:{int(pw * 4063 / 3438)}px"><img src="assets/img/print_full.png" alt=""></div>
<div class="tape" style="left:{50 - pw / W * 50 - 3:.1f}%;top:{50 - pw * 4063 / 3438 / H * 50 - 1:.1f}%;transform:rotate(-24deg)"></div>
<div class="tape" style="left:{50 + pw / W * 50 - 14:.1f}%;top:{50 + pw * 4063 / 3438 / H * 50 - 4:.1f}%;transform:rotate(-18deg)"></div>
<svg class="marker" viewBox="0 0 {W} {H}"><ellipse id="e-ring" cx="{W * 0.66:.0f}" cy="{H * 0.36:.0f}" rx="{W * 0.17:.0f}" ry="{H * 0.085:.0f}" pathLength="1"/></svg>'''
clip('e-collage', 6.9, 1.3, collage, style=f'background:{C["bone"]}')
tl.append("tl.fromTo('#e-sheet',{scale:1.25,rotation:-9,y:-80},{scale:1,rotation:-3,y:0,duration:0.22,ease:'power4.out'},6.9);")
tl.append("tl.fromTo('#e-ring',{strokeDashoffset:1},{strokeDashoffset:0,duration:0.45,ease:'power2.out'},7.35);")
DET = [(70, 37, 2.6), (55, 52, 2.2), (22, 30, 2.8)]
for i, (fx, fy, zz) in enumerate(DET):
    t0 = 8.2 + i * 0.3
    clip(f'e-det{i}', t0, 0.3 if i < 2 else 1.8, photo(f'edet{i}', 'doomsday-stories-3.png', (50, 50)))
    tl.append(f"tl.fromTo('#edet{i}',{{scale:{zz},transformOrigin:'{fx}% {fy}%'}},{{scale:{zz * 1.05:.3f},duration:0.3,ease:'none'}},{t0});")
clip('e-frz', 9.1, 0.9, '<div class="frzbox">' + title('MAKE A DEAL', int(BASE * 0.17), C['yellow'], 'frz')
     + title('WITH THE DEVIL', int(BASE * 0.12), C['bone'], 'frz') + '</div>')
tl.append("tl.fromTo('#e-frz .frzbox',{scale:1.7,rotation:3},{scale:1,rotation:1.5,duration:0.18,ease:'power4.out'},9.1);")
tl.append("tl.fromTo('#e-frz .frzbox',{x:0},{x:14,duration:0.5,ease:'shake'},9.16);")
clips.append('<div id="e-flash" class="clip flash" data-start="9.100" data-duration="0.2" data-track-index="2" style="z-index:900"></div>')
tl.append("tl.fromTo('#e-flash',{opacity:0.95},{opacity:0,duration:0.12,ease:'none'},9.1);")

# WHY BUY (14-18): one line per beat, the shirt behind, type snaps into place
WHY = [('EDIÇÃO LIMITADA.', 'doomsday-stories-1.png', (50, 52)), ('ESTAMPA EXCLUSIVA.', 'doomsday-stories-3.png', (50, 45)),
       ('SEM REPOSIÇÃO.', 'doomsday-stories-2.png', (50, 40)), ('PEGA A SUA.', 'doomsday-stories-1.png', (50, 52))]
for i, (txt, img, focus) in enumerate(WHY):
    t0 = 14.0 + i
    clip(f'w{i}', t0, 1.0, photo(f'wimg{i}', img, focus) + '<div class="dim"></div>'
         + f'<div class="whybox">{title(txt, int(BASE * (0.15 if len(txt) < 13 else 0.12)), C["yellow"] if i % 2 == 0 else C["bone"], "why")}</div>')
    tl.append(f"tl.fromTo('#wimg{i}',{{scale:1.12}},{{scale:1.2,duration:1,ease:'none'}},{t0});")
    tl.append(f"tl.fromTo('#w{i} .why',{{scaleY:2.2,scaleX:0.8}},{{scaleY:1,scaleX:1,duration:0.16,ease:'power4.out'}},{t0});")
    tl.append(f"tl.fromTo('#w{i} .whybox',{{x:0,rotation:0}},{{x:10,rotation:1.2,duration:0.6,ease:'wig'}},{t0 + 0.12});")

# THE FULL PIECE (18-22): three bands, back / front / print
BANDS = [('doomsday-stories-1.png', (50, 50)), ('doomsday-stories-2.png', (50, 38)), ('print_full.png', (50, 50))]
bands_html = ''
for i, (img, focus) in enumerate(BANDS):
    if V:
        pos = f'left:0;top:{i * 33.333:.3f}%;width:100%;height:33.4%'
    else:
        pos = f'top:0;left:{i * 33.333:.3f}%;height:100%;width:33.4%'
    fit = 'contain' if img == 'print_full.png' else 'cover'
    bands_html += (f'<div class="band" id="b{i}" style="{pos}"><img src="assets/img/{img}" alt="" '
                   f'style="object-fit:{fit};object-position:{focus[0]}% {focus[1]}%"></div>')
bands_html += f'<div class="bandlabel">{title("DOOMSDAY", int(BASE * 0.13), C["yellow"])}</div>'
clip('full', 18.0, 4.0, bands_html, style=f'background:{C["black"]}')
for i in range(3):
    a = 'x' if V else 'y'
    d = (W if V else H) * (1 if i % 2 else -1)
    tl.append(f"tl.fromTo('#b{i}',{{{a}:{d}}},{{{a}:0,duration:0.22,ease:'power4.out'}},{18.0 + i * 0.43:.2f});")
tl.append("tl.fromTo('#full .bandlabel',{scale:2,opacity:0},{scale:1,opacity:1,duration:0.16,ease:'power4.out'},19.4);")

# LOGO in liquid glass (22-26.4), then gone; LINK NA BIO holds to the end
clip('glass', 22.0, 4.4, f'<canvas id="glasscv" width="{W}" height="{H}"></canvas>', style=f'background:{C["black"]}')
clip('cta', 26.4, 3.6, f'<div class="ctabox">{title("LINK NA BIO", int(BASE * 0.16), C["yellow"])}</div>',
     style=f'background:{C["black"]}')
tl.append("tl.fromTo('#cta .ctabox',{scale:1.25},{scale:1,duration:0.14,ease:'power4.out'},26.4);")

# film burn / light leak on every chapter cut
for i, t0 in enumerate([0.6, 2.0, 6.0, 10.0, 14.0, 18.0, 22.0]):
    clips.append(f'<div id="leak{i}" class="clip leak" data-start="{t0 - 0.05:.3f}" data-duration="0.35" data-track-index="2" style="z-index:880"></div>')
    tl.append(f"tl.fromTo('#leak{i}',{{opacity:0.9,scale:1}},{{opacity:0,scale:1.3,duration:0.3,ease:'power2.out'}},{t0 - 0.05:.3f});")

# whole-frame shake on the cuts (stage wrapper)
for t0 in [0.43, 2.9, 5.1, 6.9, 9.1, 10.9, 13.1, 14, 15, 16, 17, 18, 22.0]:
    tl.append(f"tl.to('#stage',{{x:12,y:-6,duration:0.25,ease:'shake'}},{t0});")

# ----------------------------------------------------------------- sound (no music: the user asked for none)
SFX = [('impact', t) for t in (5.1, 9.1, 13.1, 22.15, 26.4)] + \
      [('whoosh', t) for t in (0.55, 2.85, 6.85, 10.85, 17.9)] + \
      [('snap', t) for t in (0.43, 2.0, 6.0, 10.0, 14.0, 15.0, 16.0, 17.0, 18.0, 18.43, 18.86)]
audio = '<audio id="projector" class="clip" data-start="0" data-duration="30" data-track-index="5" data-volume="0.6" src="assets/fx/projector.wav"></audio>\n'
for i, (name, t0) in enumerate(SFX):
    audio += (f'<audio id="sfx{i}" class="clip" data-start="{t0:.2f}" data-duration="{ {"impact": 0.9, "whoosh": 0.45, "snap": 0.06}[name] }" data-track-index="{ {"impact": 6, "whoosh": 7, "snap": 8}[name] }" '
              f'data-volume="{0.9 if name == "impact" else 0.5}" src="assets/fx/{name}.wav"></audio>\n')

# ----------------------------------------------------------------- liquid glass shader
GLASS_JS = r'''
(function(){
  const cv = document.getElementById('glasscv');
  const R = new THREE.WebGLRenderer({canvas: cv, antialias: true, preserveDrawingBuffer: true});
  R.setPixelRatio(1); R.setSize(%(W)d, %(H)d, false);
  const scene = new THREE.Scene(), cam = new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  const U = { uBg:{value:null}, uLogo:{value:null}, uForm:{value:0}, uTime:{value:0},
              uRes:{value:new THREE.Vector2(%(W)d,%(H)d)}, uLogoBox:{value:new THREE.Vector4(0,0,1,1)} };
  const mat = new THREE.ShaderMaterial({ uniforms: U, vertexShader:
    'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position,1.0); }',
    fragmentShader: `
    precision highp float; varying vec2 vUv;
    uniform sampler2D uBg, uLogo; uniform float uForm, uTime; uniform vec2 uRes; uniform vec4 uLogoBox;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
    float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
      return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
    float logoA(vec2 uv){ vec2 l=(uv-uLogoBox.xy)/uLogoBox.zw; if(l.x<0.0||l.y<0.0||l.x>1.0||l.y>1.0) return 0.0;
      return texture2D(uLogo, vec2(l.x, 1.0-l.y)).a; }
    float height(vec2 uv){ // soft height field = blurred logo, the liquid wobbles while it forms
      float wob=(1.0-uForm)*0.012; uv += wob*vec2(sin(uv.y*38.0+uTime*5.0), cos(uv.x*31.0+uTime*4.0));
      float h=0.0; float r=0.0035;
      for(int i=-2;i<=2;i++) for(int j=-2;j<=2;j++) h+=logoA(uv+vec2(float(i),float(j))*r);
      return h/25.0; }
    void main(){
      vec2 uv=vUv;
      float h=height(uv);
      vec2 e=vec2(1.5/uRes.x,1.5/uRes.y);
      vec2 n=vec2(height(uv+vec2(e.x,0.0))-height(uv-vec2(e.x,0.0)), height(uv+vec2(0.0,e.y))-height(uv-vec2(0.0,e.y)));
      float grow=smoothstep(0.0,0.25, h*1.3 - (1.0-uForm)*1.1 + (noise(uv*9.0+uTime*0.7)-0.5)*0.45);
      vec2 off=n*0.9*grow;
      // grimy background: the art, dark and warm, with grain
      vec3 bg = texture2D(uBg, uv + vec2(sin(uTime*0.6)*0.004,0.0)).rgb;
      bg = pow(bg*vec3(1.05,0.78,0.55),vec3(1.25))*0.55;
      vec3 refr = vec3(texture2D(uBg, uv-off*1.00).r, texture2D(uBg, uv-off*1.08).g, texture2D(uBg, uv-off*1.16).b);
      refr = pow(refr*vec3(1.1,0.9,0.7),vec3(1.1))*1.05 + 0.08;
      vec3 N=normalize(vec3(-n*40.0,1.0));
      float spec=pow(max(dot(N,normalize(vec3(-0.4,0.6,0.7))),0.0),60.0);
      float rim=clamp(length(n)*55.0,0.0,1.0);
      vec3 glass = refr + spec*1.6 + rim*vec3(1.0,0.86,0.45)*0.55;
      vec3 col = mix(bg, glass, grow);
      float g = hash(uv*uRes + fract(uTime*7.0)*91.0);
      col += (g-0.5)*0.10;
      col *= 1.0 - 0.45*pow(length(uv-0.5)*1.3,2.0);
      gl_FragColor = vec4(col,1.0);
    }` });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2), mat));
  const load = (src) => new Promise((res) => new THREE.TextureLoader().load(src, res));
  window.__hf = window.__hf || {}; window.__hf.buildReady = window.__hf.buildReady || {};
  window.__hf.buildReady['glass'] = Promise.all([load('assets/img/doomsday-stories-3.png'), load('assets/img/logo.png')]).then(([bg, lg]) => {
    U.uBg.value = bg; U.uLogo.value = lg;
    const lw = %(LW)f, lh = lw * (lg.image.height / lg.image.width) * (%(W)d / %(H)d);
    U.uLogoBox.value.set(0.5 - lw/2, %(LCY)f - lh/2, lw, lh);
    draw();
  });
  const S = { form: 0, t: 0 };
  function draw(){ U.uForm.value = S.form; U.uTime.value = S.t; if (U.uBg.value) R.render(scene, cam); }
  window.__glass = { S, draw };
})();
''' % dict(W=W, H=H, LW=0.72 if V else 0.42, LCY=0.58 if V else 0.5)
tl.append("tl.fromTo(window.__glass.S,{form:0},{form:1,duration:2.6,ease:'power2.out',onUpdate:window.__glass.draw},22.2);")
tl.append("tl.fromTo(window.__glass.S,{t:0},{t:4.4,duration:4.4,ease:'none',onUpdate:window.__glass.draw},22.0);")

# ----------------------------------------------------------------- page
FONT = '''
@font-face{font-family:"Modula";src:url("assets/fonts/CSModulaStamp-RegularDemo.otf") format("opentype");}
@font-face{font-family:"Avein";src:url("assets/fonts/Aveinatortia-PersonalUseOnly.ttf") format("truetype");}
'''
CSS = FONT + f'''
*{{margin:0;padding:0;box-sizing:border-box}}
html,body{{width:{W}px;height:{H}px;overflow:hidden;background:{C["black"]}}}
#root{{position:relative;width:{W}px;height:{H}px;overflow:hidden;background:{C["black"]}}}
#stage{{position:absolute;inset:0}}
.clip{{position:absolute;left:0;top:0;width:{W}px;height:{H}px;overflow:hidden}}
.ph-wrap{{position:absolute;inset:0;overflow:hidden}}
.ph{{position:absolute;left:0;top:0;width:100%;height:100%;object-fit:cover}}
.t{{font-family:"Modula";line-height:0.95;text-align:center;white-space:nowrap;letter-spacing:0.01em;display:block}}
.t .av{{font-family:"Avein";font-size:0.92em}}
.acc{{position:relative;display:inline-block}}
.acc::after{{position:absolute;left:50%;font-family:"Avein";transform:translateX(-50%);font-size:0.62em;line-height:1}}
.acute::after{{content:"\\2019";top:-0.42em;transform:translateX(-30%) rotate(-8deg)}}
.tilde::after{{content:"~";top:-0.40em}}
.ced::after{{content:",";bottom:-0.32em;font-size:0.55em}}
.card{{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:{int(BASE * 0.03)}px;padding-bottom:{H - 2 * CY}px}}
.small{{letter-spacing:0.06em}}
.hook-title{{position:absolute;left:0;right:0;top:{CY - int(BASE * 0.2)}px}}
.frzbox,.whybox,.ctabox{{position:absolute;left:0;right:0;top:{CY - int(BASE * 0.15)}px;display:flex;flex-direction:column;align-items:center;gap:{int(BASE * 0.02)}px}}
.frz{{-webkit-text-stroke:{int(BASE * 0.006)}px {C["black"]};text-shadow:0 {int(BASE * 0.012)}px 0 {C["black"]}}}
.why{{-webkit-text-stroke:{int(BASE * 0.005)}px {C["black"]};text-shadow:0 {int(BASE * 0.01)}px 0 {C["black"]}}}
.dim{{position:absolute;inset:0;background:linear-gradient(180deg,rgba(10,8,7,.15),rgba(10,8,7,.55) 45%,rgba(10,8,7,.15))}}
.flash{{background:#fff3d6;opacity:0}}
.leak{{background:radial-gradient(ellipse 70% 55% at 85% 20%,rgba(255,150,40,.95),rgba(220,40,10,.55) 45%,rgba(0,0,0,0) 75%);mix-blend-mode:screen;opacity:0}}
.xerox{{position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(0,0,0,.035) 0 2px,transparent 2px 5px),radial-gradient(ellipse at 30% 20%,rgba(0,0,0,.12),transparent 60%)}}
.spray{{position:absolute;border-radius:50%;background:radial-gradient(closest-side,rgba(10,8,7,.85),rgba(10,8,7,.4) 60%,rgba(10,8,7,0));filter:blur(6px)}}
.sheet{{position:absolute;left:50%;top:50%;margin-left:-{pw // 2}px;margin-top:-{int(pw * 4063 / 3438) // 2}px;background:{C["black"]};padding:{int(BASE * 0.02)}px;box-shadow:0 18px 30px rgba(0,0,0,.45)}}
.sheet img{{width:100%;height:100%;object-fit:contain}}
.tape{{position:absolute;width:{int(BASE * 0.26)}px;height:{int(BASE * 0.06)}px;background:rgba(241,230,207,.75);box-shadow:0 2px 3px rgba(0,0,0,.3)}}
.marker{{position:absolute;inset:0;width:100%;height:100%}}
.marker ellipse{{fill:none;stroke:{C["blood"]};stroke-width:{int(BASE * 0.012)};stroke-linecap:round;stroke-dasharray:1;stroke-dashoffset:1}}
.band{{position:absolute;overflow:hidden;border:{int(BASE * 0.006)}px solid {C["black"]}}}
.band img{{width:100%;height:100%;display:block;background:{C["black"]}}}
.bandlabel{{position:absolute;left:0;right:0;top:{(H // 2 - int(BASE * 0.07)) if V else int(H * 0.82)}px;opacity:0}}
.bandlabel .t{{-webkit-text-stroke:{int(BASE * 0.005)}px {C["black"]}}}
#glasscv{{position:absolute;left:0;top:0;width:{W}px;height:{H}px}}
#grain{{mix-blend-mode:overlay;opacity:.45;object-fit:cover}}
'''

PHOTO_IDS = (['hookimg'] + [f'c{n}{s}' for n in (0, 1) for s in ('img', 'cl')] + [f'edet{i}' for i in range(3)]
             + [f'wimg{i}' for i in range(4)])

html = f'''<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width={W}, height={H}" />
<script src="assets/gsap.min.js"></script>
<script src="assets/CustomEase.min.js"></script>
<script src="assets/CustomWiggle.min.js"></script>
<script src="assets/SplitText.min.js"></script>
<script src="assets/three.min.js"></script>
<style>{CSS}</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="{DUR}" data-width="{W}" data-height="{H}" data-fps="30">
<div id="stage">
{chr(10).join(clips)}
</div>
<video id="grain" class="clip" data-start="0" data-duration="30" data-track-index="3" muted playsinline src="assets/fx/grain.mp4" style="z-index:950"></video>
{audio}
</div>
<script>
{GLASS_JS}
gsap.registerPlugin(CustomEase, CustomWiggle, SplitText);
CustomWiggle.create('shake', {{wiggles: 7, type: 'easeOut'}});
CustomWiggle.create('wig', {{wiggles: 5, type: 'uniform'}});
window.__timelines = window.__timelines || {{}};
document.fonts.ready.then(() => {{
  const tl = gsap.timeline({{ paused: true }});
  {chr(10) + '  '.join(l + chr(10) for l in tl)}
  window.__timelines["main"] = tl;
}});
</script>
</body>
</html>
'''
out = 'index.html' if V else os.path.join('..', 'film-16x9', 'index.html')
os.makedirs(os.path.dirname(out) or '.', exist_ok=True)
open(out, 'w').write(html)
json.dump(PHOTO_IDS, open(os.path.join(os.path.dirname(out) or '.', 'photo_ids.json'), 'w'))
print('wrote', out, W, H, len(clips), 'clips')
