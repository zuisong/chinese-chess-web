import { type Component, Show, For, createSignal, createEffect } from "solid-js";
import { locale } from "../i18n";
import { chatMessages, mainScene } from "../store";

const translations = {
  "zh-CN": {
    chatTitle: "对局聊天室",
    send: "发送",
    close: "关闭",
    chatPlaceholder: "输入消息...",
    redSide: "红方",
    blackSide: "黑方",
    spectator: "观众",
  },
  "zh-TW": {
    chatTitle: "對局聊天室",
    send: "發送",
    close: "關閉",
    chatPlaceholder: "輸入消息...",
    redSide: "紅方",
    blackSide: "黑方",
    spectator: "觀眾",
  },
  ja: {
    chatTitle: "対局チャットルーム",
    send: "送信",
    close: "閉じる",
    chatPlaceholder: "メッセージを入力...",
    redSide: "赤番",
    blackSide: "黒番",
    spectator: "観戦中",
  },
};

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatModal: Component<ChatModalProps> = (props) => {
  const [chatInput, setChatInput] = createSignal("");
  let chatBoxRef: HTMLDivElement | undefined = undefined as any;

  const t = () => translations[locale()];

  const sendChatMessage = (e: SubmitEvent) => {
    e.preventDefault();
    if (!chatInput().trim()) return;
    (mainScene() as any)?.sendChat(chatInput());
    setChatInput("");
  };

  // Scroll to bottom when chat messages change or modal opens
  createEffect(
    () => [props.isOpen, chatMessages()],
    ([isOpen, messages]) => {
      if (isOpen && (messages as any[]).length > 0 && chatBoxRef) {
        setTimeout(() => {
          if (chatBoxRef) {
            chatBoxRef.scrollTop = chatBoxRef.scrollHeight;
          }
        }, 50);
      }
    },
  );

  const overlayClass =
    "fixed top-0 left-0 w-full h-full bg-black/70 flex justify-center items-center z-[1000]";
  const contentClass =
    "bg-[#333] p-4 rounded-[10px] text-white w-[90%] max-w-[400px] flex flex-col gap-3";

  return (
    <Show when={props.isOpen}>
      <div class={overlayClass} onClick={props.onClose}>
        <div class={contentClass} onClick={(e) => e.stopPropagation()}>
          <h3 class="m-0 border-b border-[#444] pb-2 text-center text-base font-bold">
            {t().chatTitle}
          </h3>

          {/* Messages list */}
          <div
            ref={chatBoxRef}
            class="flex h-60 scrollbar-thin flex-col gap-1.5 overflow-y-auto rounded bg-[#222] p-2 text-xs"
          >
            <For each={chatMessages()}>
              {(msg) => (
                <div class="leading-relaxed">
                  <span
                    class="mr-1 font-bold"
                    style={{
                      color:
                        msg.sender === "red"
                          ? "#FF6B6B"
                          : msg.sender === "black"
                            ? "#4ECDC4"
                            : "#999",
                    }}
                  >
                    {msg.sender === "red"
                      ? t().redSide
                      : msg.sender === "black"
                        ? t().blackSide
                        : t().spectator}
                    :
                  </span>
                  <span class="break-words text-gray-100">{msg.message}</span>
                </div>
              )}
            </For>
          </div>

          {/* Input & Action */}
          <form onSubmit={sendChatMessage} class="flex gap-2">
            <input
              type="text"
              placeholder={t().chatPlaceholder}
              value={chatInput()}
              onInput={(e) => setChatInput(e.currentTarget.value)}
              class="flex-1 rounded border border-[#555] bg-[#222] px-2.5 py-2 text-xs text-white placeholder-gray-500 outline-none"
            />
            <button
              type="submit"
              class="cursor-pointer rounded border-none bg-blue-600 px-4 text-xs font-bold text-white hover:bg-blue-500"
            >
              {t().send}
            </button>
          </form>

          <button
            class="mt-1 w-full cursor-pointer rounded bg-gray-600 py-2 text-xs font-bold text-white hover:bg-gray-500"
            onClick={props.onClose}
          >
            {t().close}
          </button>
        </div>
      </div>
    </Show>
  );
};

export default ChatModal;
