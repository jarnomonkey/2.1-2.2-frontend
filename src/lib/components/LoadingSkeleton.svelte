<script lang="ts">
    type Variant = "list" | "teacher" | "profile" | "recommendations";

    let { variant = "list" }: { variant?: Variant } = $props();
</script>

<div role="status" aria-label="Laden" class="animate-pulse p-5">
    {#if variant === "profile"}
        <div class="h-32 rounded-t-xl bg-slate-200"></div>
        <div class="mt-[-2.5rem] flex items-end justify-between px-1">
            <div class="h-24 w-24 rounded-full border-4 border-white bg-slate-200"></div>
            <div class="h-6 w-20 rounded-full bg-slate-200"></div>
        </div>
        <div class="mt-5 h-6 w-2/5 rounded bg-slate-200"></div>
        <div class="mt-3 h-4 w-3/5 rounded bg-slate-200"></div>
        <div class="mt-8 h-20 rounded-xl bg-slate-100"></div>
    {:else if variant === "teacher"}
        <div class="h-5 w-2/5 rounded bg-slate-200"></div>
        <div class="mt-3 h-4 w-3/5 rounded bg-slate-200"></div>
        <div class="mt-6 h-20 rounded-xl bg-slate-100"></div>
        <div class="mt-6 h-4 w-1/4 rounded bg-slate-200"></div>
        <div class="mt-2 h-12 rounded-xl bg-slate-100"></div>
    {:else if variant === "recommendations"}
        <div class="h-6 w-2/5 rounded bg-slate-200"></div>
        <div class="mt-3 h-4 w-4/5 rounded bg-slate-200"></div>
        <div class="mt-6 grid gap-4 sm:grid-cols-2">
            <div class="h-12 rounded-xl bg-slate-100"></div>
            <div class="h-12 rounded-xl bg-slate-100"></div>
            <div class="h-12 rounded-xl bg-slate-100"></div>
            <div class="h-12 rounded-xl bg-slate-100"></div>
        </div>
    {:else}
        <div class="h-5 w-2/5 rounded bg-slate-200"></div>
        <div class="mt-4 space-y-3">
            <div class="h-16 rounded-xl bg-slate-100"></div>
            <div class="h-16 rounded-xl bg-slate-100"></div>
            <div class="h-16 rounded-xl bg-slate-100"></div>
        </div>
    {/if}
</div>