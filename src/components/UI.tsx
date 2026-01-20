import type { FunctionalComponent } from "preact";
import { useStore } from "@nanostores/preact";
import { useEffect, useState } from "preact/hooks";
import type MainScene from "../game/MainScene";
import { gameInstance, scores, showScore } from "../store";
import { locale, type Locale } from "../i18n";
import RestartModal from "./RestartModal";
import SettingsModal from "./SettingsModal";

const translations = {
  "zh-CN": {
    settings: "设置",
    restart: "重开",
    undo: "悔棋",
    hint: "提示",
  },
  "zh-TW": {
    settings: "設置",
    restart: "重開",
    undo: "悔棋",
    hint: "提示",
  },
  ja: {
    settings: "設定",
    restart: "再開",
    undo: "待った",
    hint: "ヒント",
  },
};

const UI: FunctionalComponent = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRestartOpen, setIsRestartOpen] = useState(false);
  const currentLocale = useStore(locale);

  const t = translations[currentLocale];

  // Derived state for scene actions
  const scene = gameInstance.value
    ? (gameInstance.value.scene.getScene("MainScene") as MainScene)
    : null;

  const buttonClass =
    "py-2.5 cursor-pointer bg-[#555] text-white border-none rounded-[5px] text-sm font-bold";

  return (
    <div className="w-full h-full flex flex-col p-2.5 text-white bg-[#444] box-border">
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        scene={scene}
      />
      <RestartModal isOpen={isRestartOpen} onClose={() => setIsRestartOpen(false)} scene={scene} />

      {/* Control Buttons - Grid Layout */}
      <div className="mb-[15px] grid grid-cols-4 gap-2">
        <button type="button" onClick={() => setIsSettingsOpen(true)} className={buttonClass}>
          {t.settings}
        </button>
        <button type="button" onClick={() => setIsRestartOpen(true)} className={buttonClass}>
          {t.restart}
        </button>
        <button type="button" onClick={() => scene?.retract()} className={buttonClass}>
          {t.undo}
        </button>
        <button type="button" onClick={() => scene?.recommend()} className={buttonClass}>
          {t.hint}
        </button>
      </div>

      {/* Scores */}
      {showScore.value && (
        <div className="mb-[15px] bg-[#333] p-2.5 rounded-lg">
          {(() => {
            const total = scores.value.red + scores.value.black;
            const redPercent = total === 0 ? 50 : Math.round((scores.value.red / total) * 100);
            const blackPercent = total === 0 ? 50 : 100 - redPercent;

            return (
              <div className="flex h-6 rounded-xl overflow-hidden relative bg-[#555]">
                {/* Red Bar */}
                <div
                  data-testid="score-bar-red"
                  className="bg-[#FF6B6B] flex items-center justify-start pl-2.5 transition-[width] duration-300 ease-out whitespace-nowrap overflow-hidden"
                  style={{ width: `${redPercent}%` }}
                >
                  <span className="text-xs font-bold text-white">
                    {redPercent > 10 ? `${redPercent}%` : ""}
                  </span>
                </div>

                {/* Black Bar */}
                <div
                  className="bg-[#4ECDC4] flex items-center justify-end pr-2.5 transition-[width] duration-300 ease-out whitespace-nowrap overflow-hidden"
                  style={{ width: `${blackPercent}%` }}
                >
                  <span className="text-xs font-bold text-white">
                    {blackPercent > 10 ? `${blackPercent}%` : ""}
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default UI;
