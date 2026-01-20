import type { FunctionalComponent } from "preact";
import { useEffect, useState } from "preact/hooks";
import type MainScene from "../game/MainScene";
import { handicap, moveMode } from "../store";
import type { Handicap, MoveMode } from "../types/ui.types";

interface RestartModalProps {
  isOpen: boolean;
  onClose: () => void;
  scene: MainScene | null;
}

const RestartModal: FunctionalComponent<RestartModalProps> = ({ isOpen, onClose, scene }) => {
  const [localMoveMode, setLocalMoveMode] = useState<MoveMode>(0);
  const [localHandicap, setLocalHandicap] = useState<Handicap>(0);

  useEffect(() => {
    if (isOpen) {
      setLocalMoveMode(moveMode.value as MoveMode);
      setLocalHandicap(handicap.value as Handicap);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (scene) {
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
        <h2 className="m-0 text-center">重新开始</h2>

        <div>
          <label className="font-bold">先手:</label>
          <button
            onClick={() => setLocalMoveMode(((localMoveMode + 1) % 3) as MoveMode)}
            className="mt-[5px] w-full p-2.5 rounded-[4px] bg-[#555] text-white border-none text-base cursor-pointer text-left"
          >
            {["玩家先手", "电脑先手", "双人对战"][localMoveMode]}
          </button>
        </div>

        <div>
          <label className="font-bold">让子:</label>
          <button
            onClick={() => setLocalHandicap(((localHandicap + 1) % 4) as Handicap)}
            className="mt-[5px] w-full p-2.5 rounded-[4px] bg-[#555] text-white border-none text-base cursor-pointer text-left"
          >
            {["无", "让左马", "让双马", "让九子"][localHandicap]}
          </button>
        </div>

        <div className="flex justify-between mt-2.5">
          <button
            onClick={onClose}
            className="px-[30px] py-2.5 cursor-pointer text-white border-none rounded-[5px] text-base bg-[#6B7280]"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="px-[30px] py-2.5 cursor-pointer text-white border-none rounded-[5px] text-base bg-[#10B981]"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
};

export default RestartModal;
