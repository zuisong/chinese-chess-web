import type { Component } from "solid-js";
import Game from "./components/Game";
import UI from "./components/UI";

const App: Component = () => {
  return (
    <div class="box-border flex min-h-[100dvh] w-full flex-col items-center justify-center gap-2 overflow-x-hidden bg-[#333] p-2 sm:gap-5 sm:p-5">
      <div class="aspect-[521/577] w-full max-w-[521px] shrink-0">
        <Game />
      </div>
      <div class="flex w-full max-w-[521px] flex-col">
        <UI />
      </div>
    </div>
  );
};

export default App;
