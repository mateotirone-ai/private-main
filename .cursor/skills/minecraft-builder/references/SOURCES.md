# Source index

Ingest status for links listed in the minecraft-builder skill brief.

## Rules & fundamentals

| Source | Status | Digest |
|---|---|---|
| https://www.ardacraft.me/resources/gradient-guide | Ingested | `gradients-and-palettes.md` |
| https://wiki.ardacraft.me/index.php/Gradient_Guide | Ingested (same core text) | `gradients-and-palettes.md` |
| https://www.switchbladegaming.com/minecraft/building-tips/ | Ingested | `fundamentals.md` |
| https://buildingguide.app/minecraft-building-tips | Ingested | `fundamentals.md` |
| https://www.thegamer.com/minecraft-build-tips-tricks-methods-detail-realistic/ | Ingested (partial; page long) | `fundamentals.md` |
| https://teamvisionary.net/minecraft-building-tips/ | Ingested | `fundamentals.md` |
| https://item4gamer.com/blog/minecraft-building-tips/ | Timed out | retry later |

## Palettes & gradients

| Source | Status | Digest |
|---|---|---|
| https://minecraftgradient.blog/minecraft-color-palette/ | Ingested | `gradients-and-palettes.md` |
| https://minecraftgradient.blog/ | Ingested | `gradients-and-palettes.md` |
| https://blockblend.app/guides | Index ingested; deep combo URLs 404 with guessed slugs | use index themes + gradient blog recipes |
| https://www.minecraftplot.com/minecraft-block-gradient-generator/ | Ingested (tool page) | `gradients-and-palettes.md` |

## Roofs

| Source | Status | Digest |
|---|---|---|
| https://buildingguide.app/minecraft-roof-designs | Ingested | `roofs.md` |
| https://www.exitlag.com/blog/minecraft-roof-designs/ | Timed out | covered via BuildingGuide + G15 |
| https://g15tools.com/minecraft-roof-ideas-25-creative-designs-to-elevate-your-builds-in-2026/ | Ingested | `roofs.md` |
| https://minecraft.fandom.com/wiki/Tutorials/Roof_construction_guidelines | Cloudflare blocked | use `roofs.md` |

## Libraries

| Source | Status | Notes |
|---|---|---|
| https://wbuilds.app/ | Not fully scraped | External step-by-step library; consult live when copying a specific build type |

## Videos transcribed

| Video | Status |
|---|---|
| Grian — How NOT to Build (`HUzggMjVze8`) | Transcript → `video-techniques.md` |
| Grian — 5 Easy Steps (`TRVIFdGT1eY`) | Transcript → `video-techniques.md` |
| elodie — Why Hermitcraft Builds look so good (`SsXt23bd8ik`) | Transcript → `video-techniques.md` |
| soujju — 25 Tips (`1p_DylEdXEE`) | Transcript → `video-techniques.md` |
| fWhip town videos | Mostly no captions in search results; techniques deferred |

## Project constraints (from skill brief)

- Output `.mcstructure` Bedrock little-endian
- Naming `name_L#` vs `home_#`
- Include below-grade excavation; exclude pad markers
- Ship layer-by-layer blueprint sheet with legend + counts + front/back renders
