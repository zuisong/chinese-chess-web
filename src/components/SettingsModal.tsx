import { type Component, Show } from "solid-js";
import type MainScene from "../game/MainScene";
import { locale, setLocale, type Locale } from "../i18n";
import { animated, showScore, soundEnabled } from "../store";

const translations = {
  "zh-CN": {
    title: "游戏设置",
    sound: "开启音效",
    animation: "开启动画",
    showScore: "显示评分",
    language: "语言",
    close: "关闭",
    languages: {
      "zh-CN": "简体中文",
      "zh-TW": "繁體中文",
      ja: "日本語",
    },
  },
  "zh-TW": {
    title: "遊戲設置",
    sound: "開啟音效",
    animation: "開啟動畫",
    showScore: "顯示評分",
    language: "語言",
    close: "關閉",
    languages: {
      "zh-CN": "简体中文",
      "zh-TW": "繁體中文",
      ja: "日本語",
    },
  },
  ja: {
    title: "ゲーム設定",
    sound: "効果音",
    animation: "アニメーション",
    showScore: "スコア表示",
    language: "言語",
    close: "閉じる",
    languages: {
      "zh-CN": "简体中文",
      "zh-TW": "繁體中文",
      ja: "日本語",
    },
  },
};

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  scene: MainScene | null;
}

const SettingsModal: Component<SettingsModalProps> = (props) => {
  const t = () => translations[locale()];

  const overlayClass =
    "fixed top-0 left-0 w-full h-full bg-black/70 flex justify-center items-center z-[1000]";
  const contentClass =
    "bg-[#333] p-5 rounded-[10px] text-white w-[90%] max-w-[400px] flex flex-col gap-[15px] max-h-[90vh] overflow-y-auto";
  const checkboxLabelClass = "flex items-center gap-2.5 font-bold cursor-pointer";
  const checkboxClass = "w-5 h-5";

  return (
    <Show when={props.isOpen}>
      <div class={overlayClass}>
        <div class={contentClass}>
          <h2 class="m-0 text-center">{t().title}</h2>

          <div>
            <label class="font-bold">{t().language}:</label>
            <button
              onClick={() => {
                const locales: Locale[] = ["zh-CN", "zh-TW", "ja"];
                const currentIndex = locales.indexOf(locale());
                const nextLocale = locales[(currentIndex + 1) % locales.length];
                setLocale(nextLocale);
              }}
              class="mt-[5px] w-full p-2.5 rounded-[4px] bg-[#555] text-white border-none text-base cursor-pointer text-left"
            >
              {t().languages[locale()]}
            </button>
          </div>

          <div>
            <label class={checkboxLabelClass}>
              <input
                type="checkbox"
                checked={soundEnabled()}
                onChange={(e) => props.scene?.setSound(e.currentTarget.checked)}
                class={checkboxClass}
              />
              {t().sound}
            </label>
          </div>

          <div>
            <label class={checkboxLabelClass}>
              <input
                type="checkbox"
                checked={animated()}
                onChange={(e) => props.scene?.setAnimated(e.currentTarget.checked)}
                class={checkboxClass}
              />
              {t().animation}
            </label>
          </div>

          <div>
            <label class={checkboxLabelClass}>
              <input
                type="checkbox"
                checked={showScore()}
                onChange={(e) => props.scene?.setShowScore(e.currentTarget.checked)}
                class={checkboxClass}
              />
              {t().showScore}
            </label>
          </div>

          <div class="flex justify-center mt-2.5">
            <button
              onClick={props.onClose}
              class="px-[30px] py-2.5 cursor-pointer bg-[#10B981] text-white border-none rounded-[5px] text-base"
            >
              {t().close}
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
};

export default SettingsModal;
