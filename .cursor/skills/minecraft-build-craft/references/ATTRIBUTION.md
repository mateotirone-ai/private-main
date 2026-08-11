# Upstream skill sources

This project skill adapts ideas from public agent skills. It does not vendor
their Java runtimes.

## wzhaoMS/minecraft-builder-skill

- Repo: https://github.com/wzhaoMS/minecraft-builder-skill
- Taken: layered building patterns, realism/detail instincts, reference
  screenshot feedback loop, coordinate-facing awareness.
- Not taken as default: Paper server, mineflayer bot, FAWE paste workflow,
  modern skyscraper/city generators.

## mattzh72/minecraft-builder-skill

- Repo: https://github.com/mattzh72/minecraft-builder-skill
- Taken: recipe composition mindset, iteration via regenerate/inspect,
  readable geometry and palette guidance, helper-style authoring.
- Not taken as default: Lodestone NBT export/preview stack as the shipping
  path (optional scratchpad only if the user requests Java preview).

## Local pipeline skill

Registry, schematic ingestion, tests, and deploy rules live in
`.cursor/skills/minecraft-building/SKILL.md`.
