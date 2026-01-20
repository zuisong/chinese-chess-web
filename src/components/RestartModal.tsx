import type { FunctionalComponent } from "preact";
import { useStore } from "@nanostores/preact";
import { useEffect, useState } from "preact/hooks";
import type MainScene from "../game/MainScene";
import { difficulty, handicap, moveMode } from "../store";
import { locale } from "../i18n";
import type { Difficulty, Handicap, MoveMode } from "../types/ui.types";

const translations = {
  "zh-CN": {
    title: "重新开始",
    difficulty: "难度",
    difficultyLevels: ["入门", "业余", "专业"],
    firstMove: "先手",
    firstMoveOptions: ["玩家先手", "电脑先手", "双人对战"],
    handicap: "让子",
    handicapOptions: ["无", "让左马", "让双马", "让九子"],
    cancel: "取消",
    confirm: "确定",
  },
  "zh-TW": {
    title: "重新開始",
    difficulty: "難度",
    difficultyLevels: ["入門", "業餘", "專業"],
    firstMove: "先手",
    firstMoveOptions: ["玩家先手", "電腦先手", "雙人對戰"],
    handicap: "讓子",
    handicapOptions: ["無", "讓左馬", "讓雙馬", "讓九子"],
    cancel: "取消",
    confirm: "確定",
  },
  ja: {
    title: "再開",
    difficulty: "難易度",
    difficultyLevels: ["初級", "中級", "上級"],
    firstMove: "先手",
    firstMoveOptions: ["プレイヤー先手", "COM先手", "対人戦"],
    handicap: "ハンデ",
    handicapOptions: ["なし", "左馬落ち", "両馬落ち", "九子落ち"],
    cancel: "キャンセル",
    confirm: "確定",
  },
};

interface RestartModalProps {
  isOpen: boolean;
  onClose: () => void;
  scene: MainScene | null;
}

const RestartModal: FunctionalComponent<RestartModalProps> = ({ isOpen, onClose, scene }) => {
  const [localMoveMode, setLocalMoveMode] = useState<MoveMode>(0);
  const [localHandicap, setLocalHandicap] = useState<Handicap>(0);
  const [localDifficulty, setLocalDifficulty] = useState<Difficulty>(2);

  const currentLocale = useStore(locale);
  const t = translations[currentLocale];

  useEffect(() => {
    if (isOpen) {
      setLocalMoveMode(moveMode.value as MoveMode);
      setLocalHandicap(handicap.value as Handicap);
      setLocalDifficulty(difficulty.value as Difficulty);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (scene) {
      scene.setDifficulty(localDifficulty);
      scene.setMoveMode(localMoveMode);
      scene.setHandicap(localHandicap);
      scene.restart();
    }
    onClose();
  };

  if (!isOpen) return null;

  const overlayClass =
    "fixed top-0 left-0 w-full h-full bg-black/70 flex justify-center items-center z-[1000]";
  const contentClass =
    "bg-[#333] p-5 rounded-[10px] text-white w-[90%] max-w-[400px] flex flex-col gap-[15px]";

  return (
    <div className={overlayClass}>
      <div className={contentClass}>
        <h2 className="m-0 text-center">{t.title}</h2>

        <div>
          <label className="font-bold">{t.difficulty}:</label>
          <button
            onClick={() => setLocalDifficulty(((localDifficulty + 1) % 3) as Difficulty)}
            className="mt-[5px] w-full p-2.5 rounded-[4px] bg-[#555] text-white border-none text-base cursor-pointer text-left"
          >
            {t.difficultyLevels[localDifficulty]}
          </button>
        </div>

        <div>
          <label className="font-bold">{t.firstMove}:</label>
          <button
            onClick={() => setLocalMoveMode(((localMoveMode + 1) % 3) as MoveMode)}
            className="mt-[5px] w-full p-2.5 rounded-[4px] bg-[#555] text-white border-none text-base cursor-pointer text-left"
          >
            {t.firstMoveOptions[localMoveMode]}
          </button>
        </div>

        <div>
          <label className="font-bold">{t.handicap}:</label>
          <button
            onClick={() => setLocalHandicap(((localHandicap + 1) % 4) as Handicap)}
            className="mt-[5px] w-full p-2.5 rounded-[4px] bg-[#555] text-white border-none text-base cursor-pointer text-left"
          >
            {t.handicapOptions[localHandicap]}
          </button>
        </div>

        <div className="flex justify-between mt-2.5">
          <button
            onClick={onClose}
            className="px-[30px] py-2.5 cursor-pointer text-white border-none rounded-[5px] text-base bg-[#6B7280]"
          >
            {t.cancel}
          </button>
          <button
            onClick={handleConfirm}
            className="px-[30px] py-2.5 cursor-pointer text-white border-none rounded-[5px] text-base bg-[#10B981]"
          >
            {t.confirm}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RestartModal;
