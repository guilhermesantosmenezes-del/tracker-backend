# Style guide — PARANOIA "doomsday" (Nike-style launch presentation)

Motion and rhythm come from the reference edit (docs/reference: adidas-style B&W montage);
colour and type come from the brand + the brief ("clear and eye-catching, like a Nike product
presentation"). No noir, no paper cut.

## Rhythm
Reference: median shot 0.17 s, 12.9 cuts / 10 s, hard cuts only, cuts on or between beats,
one long hold (1.2 s) on the logo before the end card.
Ours (128 bpm, 0.469 s/beat): montage sections cut every half beat (0.23 s) or quarter beat;
hero shots hold 2–5 s but always carry a camera move or a new type layer every 2–4 beats.

## Motion vocabulary
- Entrances: hard cut on the beat, or a whip (both shots on screen, A slides out as B slides in).
  Type slams in at 115–130 % and settles in 6–8 frames (SPRING snappy), never fades.
- Punch-ins: dry 1.6–2.6× crops on the print, held 4–6 frames, back to full on the next beat.
- Zoom-through: log-space zoom into a point of the print / the eye, accelerating, cut at the
  frame where the detail fills the screen; the next shot opens on the same detail and pulls out.
- Vertigo (dolly zoom, three.js): subject keeps its size while the camera dollies and the FOV
  compensates; the depth layers behind it (flame rings, giant type planes) stretch or collapse.
- Signature move: giant lowercase "doomsday" BEHIND the creature cut-out (subject in front of type).

## Composition
Studio look: product on clean white or flat ember fields, huge type bleeding off the frame
edges, left-aligned small UI labels. 9:16 safe area for type (top 220 px / bottom 380 px kept clear
of key words).

## Colour + texture
- paper  `#ffffff` / `#f4f2ee` — studio white, the dominant field
- ink    `#0b0b0c` — type, the shirt
- ember  `#e4532b` — the art's orange-red, the ONLY accent: full-frame colour fields, one word,
  the asterisk
- Photos graded bright: lifted, clean whites, +contrast, +saturation on the orange, no vignette.
- No grain on white fields; a light sharpen on photos (ffmpeg pass).

## Type in motion
Display: Archivo (variable width) — Black 900 at 125 % width for slams, condensed 62 % for
stacks. UI: Inter Bold for small labels. Everything lowercase. Exception the user asked for: the
finale cycles 5 faces (typewriter, normal, slab, handwritten, extended), one half-beat each.

## Do / don't
Do: cut on the beat; keep the art's real colours; let the product fill the frame.
Do: one accent colour (ember); big flat fields; type that moves with weight.
Do: logo end card on ember, held ≥ 1.5 s.
Don't: paper cut / torn edges; dark noir grading; vignettes.
Don't: fades, glows, generic particle bursts.
Don't: invent copy or specs — only the brand's words ("doomsday", "make a deal with the devil",
"paranoia", "bad vibeees").
