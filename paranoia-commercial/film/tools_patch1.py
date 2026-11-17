"""Round-1 fixes: measured text fitting, chapter-3 card overlap, Tarantino name strips, glass shader."""
import os
p = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'gen.py')
s = open(p).read()


def rep(a, b):
    global s
    if a not in s:
        raise SystemExit('missing: ' + a[:80])
    s = s.replace(a, b)


rep("""def title(text, size, color, extra_cls=''):
    return f'<div class="t {extra_cls}" style="font-size:{size}px;color:{color}">{word(text)}</div>'""",
    """FM = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'font_metrics.json')))


def text_em(text):
    w = 0.0
    for ch in text:
        base = {'Í': 'I', 'É': 'E', 'Á': 'A', 'Ó': 'O', 'Ú': 'U', 'Ã': 'A', 'Õ': 'O', 'Ç': 'C'}.get(ch, ch)
        if base in FM['Modula']:
            w += FM['Modula'][base] * 1.01
        else:
            w += FM['Avein'].get(base, 0.3) * 0.92
    return w


def title(text, size, color, extra_cls='', maxw=None):
    maxw = maxw or W * 0.88
    size = int(min(size, maxw / text_em(text)))
    return f'<div class="t {extra_cls}" style="font-size:{size}px;color:{color}">{word(text)}</div>'""")
rep("clip(f'e-det{i}', t0, 0.3 if i < 2 else 1.8,", "clip(f'e-det{i}', t0, 0.3 if i < 2 else 1.4,")
rep(""".frz{{-webkit-text-stroke""", """.frzbox,.whybox{{background:{C["black"]};padding:{int(BASE * 0.03)}px 0 {int(BASE * 0.04)}px;box-shadow:0 0 0 {int(BASE * 0.004)}px {C["yellow"]}}}
.frz{{-webkit-text-stroke""")
rep("return texture2D(uLogo, vec2(l.x, 1.0-l.y)).a; }", "return texture2D(uLogo, l).a; }")
rep("float wob=(1.0-uForm)*0.012;", "float wob=(1.0-uForm)*(1.0-uForm)*0.006;")
rep("float h=0.0; float r=0.0035;", "float h=0.0; float r=0.0016;")
rep("vec3 glass = refr + spec*1.6 + rim*vec3(1.0,0.86,0.45)*0.55;",
    "vec3 glass = refr*0.55 + vec3(0.30,0.27,0.22)*h + spec*1.4 + rim*vec3(1.0,0.86,0.45)*0.75;")
rep("float rim=clamp(length(n)*55.0,0.0,1.0);", "float rim=clamp(length(n)*80.0,0.0,1.0);")
open(p, 'w').write(s)
print('patched')
