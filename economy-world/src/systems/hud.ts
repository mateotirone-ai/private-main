import { world, type ScoreboardObjective } from "@minecraft/server";
import { currentTick, every } from "../core/scheduler";
import { matrix } from "../content/matrix";
import { configureHudProviders, refreshActionbar } from "../ui/toast";
import { countCarriedCash } from "./cash";

const CASH_OBJECTIVE = "ew_cash";
const SKILL_OBJECTIVE = "ew_skill";

function objective(id: string, displayName: string): ScoreboardObjective {
  return (
    world.scoreboard.getObjective(id) ??
    world.scoreboard.addObjective(id, displayName)
  );
}

export function startHudJob(): void {
  const cash = objective(CASH_OBJECTIVE, "Cash");
  const skill = objective(SKILL_OBJECTIVE, "Skill License");
  configureHudProviders(
    (player) => countCarriedCash(player).total,
    () => currentTick()
  );
  every("hud:refresh", matrix.ui.hud.refreshTicks, (tick) => {
    for (const player of world.getAllPlayers()) {
      const identity = player.scoreboardIdentity;
      if (!identity) continue;
      cash.setScore(identity, countCarriedCash(player).total);
      const skillLevel = Math.max(0, skill.getScore(identity) ?? 0);
      if (player.level !== skillLevel) {
        player.resetLevel();
        if (skillLevel > 0) player.addLevels(skillLevel);
      }
      refreshActionbar(player, tick);
    }
  });
}
