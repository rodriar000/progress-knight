# Continuous character motion

The clips show the same illustrated character throughout work, study and combat. They are rendered once from `hero-source.webp` using the textured mesh in `tools/render-actor.py`, then served as transparent VP9 WebM at 24 fps. The browser does not run a 3D scene or redraw a Canvas. Animated WebP provides a playback fallback.

To regenerate one cycle with Blender 4 and FFmpeg:

```sh
blender -b -noaudio --python tools/render-actor.py -- /tmp/hero-walk walk
ffmpeg -framerate 24 -i /tmp/hero-walk/%03d.png -c:v libvpx-vp9 -b:v 0 -crf 32 -pix_fmt yuva420p -auto-alt-ref 0 art/actors/walk.webm
```

The `hero-source.webp` lossless illustration was generated for this project.
