<template>
  <div class="w-full xl:w-[28rem] relative max-h-[calc(100%-32px)]">
    <div class="p-0.5 flex flex-col relative overflow-hidden rounded-2xl border border-gray-950/10 dark:border-white/10 my-0 dark:text-gray-50">
      <div class="flex items-center justify-between gap-2 relative px-2.5">
        <slot name="header" />
      </div>
      <div class="flex flex-1 overflow-hidden">
        <div class="w-full min-w-full max-w-full h-full max-h-full">
          <div class="w-0 min-w-full max-w-full py-3.5 px-4 h-full bg-muted relative text-sm leading-6 children:!my-0 children:!shadow-none children:!bg-transparent transition-[height] duration-300 ease-in-out [&_*]:ring-0 [&_*]:outline-none [&_*]:focus:ring-0 [&_*]:focus:outline-none [&_pre>code]:pr-[3rem] [&_pre>code>span.line-highlight]:min-w-[calc(100%+3rem)] [&_pre>code>span.line-diff]:min-w-[calc(100%+3rem)] rounded-[14px] verflow-auto overflow-x-auto scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-black/15 hover:scrollbar-thumb-black/20 active:scrollbar-thumb-black/20 dark:scrollbar-thumb-white/20 dark:hover:scrollbar-thumb-white/25 dark:active:scrollbar-thumb-white/25">
            <div class="font-mono whitespace-pre flex-none h-full text-xs leading-[1.35rem]">
              <slot name="panel" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
