import { type Component, Show, createMemo, createSignal } from "solid-js";
import { locale } from "../i18n";
import { mainScene, scores, showScore } from "../store";
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

const UI: Component = () => {
  const [isSettingsOpen, setIsSettingsOpen] = createSignal(false);
  const [isRestartOpen, setIsRestartOpen] = createSignal(false);

  const t = () => translations[locale()];

  const buttonClass =
    "py-2.5 cursor-pointer bg-[#555] text-white border-none rounded-[5px] text-sm font-bold";

  // Derived scores
  const redPercent = createMemo(() => {
    // scores is a SolidJS Store (Proxy), so property access tracks dependencies
    const total = scores.red + scores.black;
    return total === 0 ? 50 : Math.round((scores.red / total) * 100);
  });

  const blackPercent = createMemo(() => 100 - redPercent());

  return (
    <div class="w-full h-full flex flex-col p-2.5 text-white bg-[#444] box-border">
      <SettingsModal
        isOpen={isSettingsOpen()}
        onClose={() => setIsSettingsOpen(false)}
        scene={mainScene()}
      />
      <RestartModal
        isOpen={isRestartOpen()}
        onClose={() => setIsRestartOpen(false)}
        scene={mainScene()}
      />

      {/* Control Buttons - Grid Layout */}
      <div class="mb-[15px] grid grid-cols-4 gap-2">
        <button onClick={() => setIsSettingsOpen(true)} class={buttonClass}>
          {t().settings}
        </button>
        <button onClick={() => setIsRestartOpen(true)} class={buttonClass}>
          {t().restart}
        </button>
        <button onClick={() => mainScene()?.retract()} class={buttonClass}>
          {t().undo}
        </button>
        <button onClick={() => mainScene()?.recommend()} class={buttonClass}>
          {t().hint}
        </button>
      </div>

      {/* Scores */}
      <Show when={showScore()}>
        <div class="mb-[15px] bg-[#333] p-2.5 rounded-lg">
          <div class="flex h-6 rounded-xl overflow-hidden relative bg-[#555]">
            {/* Red Bar */}
            <div
              data-testid="score-bar-red"
              class="bg-[#FF6B6B] flex items-center justify-start pl-2.5 transition-[width] duration-300 ease-out whitespace-nowrap overflow-hidden"
              style={{ width: `${redPercent()}%` }}
            >
              <Show when={redPercent() > 10}>
                <span class="text-xs font-bold text-white">{redPercent()}%</span>
              </Show>
            </div>

            {/* Black Bar */}
            <div
              class="bg-[#4ECDC4] flex items-center justify-end pr-2.5 transition-[width] duration-300 ease-out whitespace-nowrap overflow-hidden"
              style={{ width: `${blackPercent()}%` }}
            >
              <Show when={blackPercent() > 10}>
                <span class="text-xs font-bold text-white">{blackPercent()}%</span>
              </Show>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default UI;
