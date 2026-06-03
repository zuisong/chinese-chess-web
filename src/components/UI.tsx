import { type Component, Show, createMemo, createSignal } from "solid-js";
import { locale } from "../i18n";
import {
  mainScene,
  scores,
  showScore,
  onlineRoomId,
  onlineRole,
  onlineTurn,
  onlineRedConnected,
  onlineBlackConnected,
  chatMessages,
  onlineConnected,
} from "../store";
import RestartModal from "./RestartModal";
import SettingsModal from "./SettingsModal";
import ChatModal from "./ChatModal";

const translations = {
  "zh-CN": {
    settings: "设置",
    restart: "重开",
    undo: "悔棋",
    hint: "提示",
    onlineMatch: "联机对战",
    createRed: "创建对战(红方)",
    createBlack: "创建对战(黑方)",
    quitOnline: "退出联机",
    shareLink: "分享对战链接",
    linkCopied: "链接已复制到剪贴板！",
    chatTitle: "聊天",
    send: "发送",
    youAreRed: "你是红方 (先手)",
    youAreBlack: "你是黑方 (后手)",
    youAreSpectator: "你是观众",
    redSide: "红方",
    blackSide: "黑方",
    online: "在线",
    offline: "离线",
    turnSuffix: "的回合",
    copylink: "复制链接",
    chatPlaceholder: "输入消息...",
    noMessage: "暂无消息",
  },
  "zh-TW": {
    settings: "設置",
    restart: "重開",
    undo: "悔棋",
    hint: "提示",
    onlineMatch: "聯機對戰",
    createRed: "創建對戰(紅方)",
    createBlack: "創建對戰(黑方)",
    quitOnline: "退出聯機",
    shareLink: "分享對戰鏈接",
    linkCopied: "鏈接已複製到剪貼簿！",
    chatTitle: "聊天",
    send: "發送",
    youAreRed: "你是紅方 (先手)",
    youAreBlack: "你是黑方 (後手)",
    youAreSpectator: "你是觀眾",
    redSide: "紅方",
    blackSide: "黑方",
    online: "在線",
    offline: "離線",
    turnSuffix: "的回合",
    copylink: "複製鏈接",
    chatPlaceholder: "輸入消息...",
    noMessage: "暫無消息",
  },
  ja: {
    settings: "設定",
    restart: "再開",
    undo: "待った",
    hint: "ヒント",
    onlineMatch: "対戦機能",
    createRed: "対戦作成(赤)",
    createBlack: "対戦作成(黒)",
    quitOnline: "接続切断",
    shareLink: "対戦リンクを共有",
    linkCopied: "リンクがクリップボードにコピーされました！",
    chatTitle: "チャット",
    send: "送信",
    youAreRed: "あなたは赤番 (先手)",
    youAreBlack: "あなたは黒番 (後手)",
    youAreSpectator: "あなたは観戦中",
    redSide: "赤番",
    blackSide: "黒番",
    online: "接続中",
    offline: "オフライン",
    turnSuffix: "の手番",
    copylink: "リンクコピー",
    chatPlaceholder: "メッセージを入力...",
    noMessage: "メッセージなし",
  },
};

const UI: Component = () => {
  const [isSettingsOpen, setIsSettingsOpen] = createSignal(false);
  const [isRestartOpen, setIsRestartOpen] = createSignal(false);
  const [isChatOpen, setIsChatOpen] = createSignal(false);
  const [showOnlinePanel, setShowOnlinePanel] = createSignal(false);
  const [copySuccess, setCopySuccess] = createSignal(false);

  const t = () => translations[locale()];

  const buttonClass =
    "py-2.5 cursor-pointer bg-[#555] text-white border-none rounded-[5px] text-sm font-bold transition-colors hover:bg-[#666]";

  const redPercent = createMemo(() => {
    const total = scores.red + scores.black;
    return total === 0 ? 50 : Math.round((scores.red / total) * 100);
  });

  const blackPercent = createMemo(() => 100 - redPercent());

  const shareUrl = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("token");
    url.searchParams.set("room", onlineRoomId() || "");
    return url.toString();
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl());
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const lastMessage = createMemo(() => {
    const list = chatMessages();
    return list.length > 0 ? list[list.length - 1] : null;
  });

  return (
    <div class="box-border flex w-full flex-col overflow-hidden rounded-b-xl bg-[#444] p-2.5 text-white">
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
      <ChatModal isOpen={isChatOpen()} onClose={() => setIsChatOpen(false)} />

      {/* Control Buttons - Grid Layout */}
      <div class="mb-3 grid grid-cols-4 gap-2">
        <button onClick={() => setIsSettingsOpen(true)} class={buttonClass}>
          {t().settings}
        </button>
        <button onClick={() => setIsRestartOpen(true)} class={buttonClass}>
          {t().restart}
        </button>
        <button
          onClick={() => mainScene()?.retract()}
          class={buttonClass}
          disabled={onlineRoomId() ? !onlineConnected() : false}
          style={{ opacity: onlineRoomId() && !onlineConnected() ? 0.5 : 1 }}
        >
          {t().undo}
        </button>
        <button
          onClick={() => mainScene()?.recommend()}
          class={buttonClass}
          disabled={!!onlineRoomId()}
          style={{ opacity: onlineRoomId() ? 0.5 : 1 }}
        >
          {t().hint}
        </button>
      </div>

      {/* Online PvP Matchmaking / Status Panel */}
      <div class="mb-3 rounded-lg border border-[#555] bg-[#333] p-3">
        <Show
          when={onlineRoomId()}
          fallback={
            <div>
              <div class="flex items-center justify-between">
                <span class="text-sm font-bold text-gray-300">{t().onlineMatch}</span>
                <button
                  class="cursor-pointer rounded bg-[#FF8000] px-3 py-1 text-xs font-bold text-white transition-colors hover:bg-[#ff9933]"
                  onClick={() => setShowOnlinePanel(!showOnlinePanel())}
                >
                  {showOnlinePanel() ? "隐藏" : "展开"}
                </button>
              </div>
              <Show when={showOnlinePanel()}>
                <div class="mt-2 grid grid-cols-2 gap-2">
                  <button
                    class="cursor-pointer rounded bg-red-600 py-2 text-xs font-bold text-white transition-colors hover:bg-red-500"
                    onClick={() => (mainScene() as any)?.createOnlineGame("red")}
                  >
                    {t().createRed}
                  </button>
                  <button
                    class="cursor-pointer rounded bg-blue-600 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-500"
                    onClick={() => (mainScene() as any)?.createOnlineGame("black")}
                  >
                    {t().createBlack}
                  </button>
                </div>
              </Show>
            </div>
          }
        >
          <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between text-xs text-gray-400">
              <span>房间 ID: {onlineRoomId()?.substring(0, 8)}...</span>
              <button
                class="cursor-pointer rounded bg-green-600 px-2 py-0.5 text-[10px] text-white hover:bg-green-500"
                onClick={copyToClipboard}
              >
                {copySuccess() ? "已复制" : t().copylink}
              </button>
            </div>

            {/* Players Status */}
            <div class="grid grid-cols-2 gap-2 rounded bg-[#252525] p-1.5 text-xs">
              <div class="flex items-center justify-between">
                <span class="flex items-center gap-1">
                  <span class="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
                  {t().redSide}
                </span>
                <span class={onlineRedConnected() ? "text-green-400" : "text-gray-500"}>
                  {onlineRedConnected() ? t().online : t().offline}
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="flex items-center gap-1">
                  <span class="inline-block h-2.5 w-2.5 rounded-full bg-[#4ECDC4]" />
                  {t().blackSide}
                </span>
                <span class={onlineBlackConnected() ? "text-green-400" : "text-gray-500"}>
                  {onlineBlackConnected() ? t().online : t().offline}
                </span>
              </div>
            </div>

            {/* Turn & Identity */}
            <div class="flex items-center justify-between border-b border-[#444] py-1 pb-1 text-xs">
              <span class="font-semibold text-[#FFD700]">
                {onlineRole() === "red"
                  ? t().youAreRed
                  : onlineRole() === "black"
                    ? t().youAreBlack
                    : t().youAreSpectator}
              </span>
              <span class="font-bold text-gray-300">
                {onlineTurn() === "red" ? t().redSide : t().blackSide}
                {t().turnSuffix}
              </span>
            </div>

            {/* Simple Chat Banner (Last message only) */}
            <div
              class="flex cursor-pointer items-center justify-between rounded border border-[#444] bg-[#222] p-2 text-xs transition-colors hover:bg-[#2a2a2a]"
              onClick={() => setIsChatOpen(true)}
            >
              <div class="flex-1 truncate pr-2">
                <span class="mr-1 text-gray-400">💬</span>
                <Show
                  when={lastMessage()}
                  fallback={<span class="text-gray-500 italic">{t().noMessage}</span>}
                >
                  {(msg) => (
                    <>
                      <span
                        class="mr-1 font-bold"
                        style={{
                          color:
                            msg().sender === "red"
                              ? "#FF6B6B"
                              : msg().sender === "black"
                                ? "#4ECDC4"
                                : "#999",
                        }}
                      >
                        {msg().sender === "red"
                          ? t().redSide
                          : msg().sender === "black"
                            ? t().blackSide
                            : "观众"}
                        :
                      </span>
                      <span class="text-gray-200">{msg().message}</span>
                    </>
                  )}
                </Show>
              </div>
              <span class="shrink-0 rounded bg-blue-600 px-2 py-0.5 text-[10px] font-bold hover:bg-blue-500">
                {t().chatTitle}
              </span>
            </div>

            {/* Action buttons */}
            <button
              class="w-full cursor-pointer rounded bg-gray-700 py-1.5 text-xs font-bold text-white hover:bg-gray-600"
              onClick={() => (mainScene() as any)?.quitOnlineGame()}
            >
              {t().quitOnline}
            </button>
          </div>
        </Show>
      </div>

      {/* Scores */}
      <Show when={showScore()}>
        <div class="rounded-lg bg-[#333] p-2.5">
          <div class="relative flex h-6 overflow-hidden rounded-xl bg-[#555]">
            {/* Red Bar */}
            <div
              data-testid="score-bar-red"
              class="flex items-center justify-start overflow-hidden bg-[#FF6B6B] pl-2.5 whitespace-nowrap transition-[width] duration-300 ease-out"
              style={{ width: `${redPercent()}%` }}
            >
              <Show when={redPercent() > 10}>
                <span class="text-xs font-bold text-white">{redPercent()}%</span>
              </Show>
            </div>

            {/* Black Bar */}
            <div
              class="flex items-center justify-end overflow-hidden bg-[#4ECDC4] pr-2.5 whitespace-nowrap transition-[width] duration-300 ease-out"
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
