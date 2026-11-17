"""Round-2 fixes: clean type on the black strips, two-line sales lines, visible acute accent."""
import os
p = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'gen.py')
s = open(p).read()


def rep(a, b):
    global s
    if a not in s:
        raise SystemExit('missing: ' + a[:80])
    s = s.replace(a, b)


# no black stroke on type that already sits on the black strip (it ate the distressed letters)
rep(""".frz{{-webkit-text-stroke:{int(BASE * 0.006)}px {C["black"]};text-shadow:0 {int(BASE * 0.012)}px 0 {C["black"]}}}""",
    """.frz{{}}""")
rep(""".why{{-webkit-text-stroke:{int(BASE * 0.005)}px {C["black"]};text-shadow:0 {int(BASE * 0.01)}px 0 {C["black"]}}}""",
    """.why{{}}""")
rep(""".bandlabel .t{{-webkit-text-stroke:{int(BASE * 0.005)}px {C["black"]}}}""",
    """.bandlabel .t{{text-shadow:0 0 {int(BASE * 0.03)}px {C["black"]},0 {int(BASE * 0.008)}px 0 {C["black"]}}}""")
# acute from the plain apostrophe (Aveinatortia has no U+2019)
rep('''.acute::after{{content:"\\\\2019";''', '''.acute::after{{content:"'";''')
# sales lines: two lines each, bigger
rep("""WHY = [('EDIÇÃO LIMITADA.', 'doomsday-stories-1.png', (50, 52)), ('ESTAMPA EXCLUSIVA.', 'doomsday-stories-3.png', (50, 45)),
       ('SEM REPOSIÇÃO.', 'doomsday-stories-2.png', (50, 40)), ('PEGA A SUA.', 'doomsday-stories-1.png', (50, 52))]""",
    """WHY = [('EDIÇÃO|LIMITADA.', 'doomsday-stories-1.png', (50, 52)), ('ESTAMPA|EXCLUSIVA.', 'doomsday-stories-3.png', (50, 45)),
       ('SEM|REPOSIÇÃO.', 'doomsday-stories-2.png', (50, 40)), ('PEGA|A SUA.', 'doomsday-stories-1.png', (50, 52))]""")
rep("""         + f'<div class="whybox">{title(txt, int(BASE * (0.15 if len(txt) < 13 else 0.12)), C["yellow"] if i % 2 == 0 else C["bone"], "why")}</div>')""",
    """         + '<div class="whybox">' + ''.join(title(line, int(BASE * 0.24), C['yellow'] if i % 2 == 0 else C['bone'], 'why')
                                           for line in txt.split('|')) + '</div>')""")
open(p, 'w').write(s)
print('patched')
