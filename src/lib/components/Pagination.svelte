<script lang="ts">
    let {
        currentPage = $bindable(1),
        totalPages,
        onPageChange
    } = $props<{
        currentPage?: number;
        totalPages: number;
        onPageChange?: (page: number) => void;
    }>();

    let items = $derived.by((): (number | "...")[] => {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, index) => index + 1);
        }

        const pages = new Set([
            1,
            2,
            currentPage - 1,
            currentPage,
            currentPage + 1,
            totalPages - 1,
            totalPages
        ]);
        const sortedPages = [...pages]
            .filter((page) => page >= 1 && page <= totalPages)
            .sort((a, b) => a - b);
        const result: (number | "...")[] = [];

        sortedPages.forEach((page, index) => {
            if (index > 0 && page - sortedPages[index - 1] > 1) {
                result.push("...");
            }

            result.push(page);
        });

        return result;
    });

    function goTo(page: number) {
        if (page < 1 || page > totalPages) return;
        currentPage = page;
        onPageChange?.(page);
    }
</script>

{#if totalPages > 1}
    <div class="mt-8 flex flex-wrap items-center justify-center gap-2 px-1">
        <button
            type="button"
            onclick={() => goTo(currentPage - 1)}
            disabled={currentPage === 1}
            class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 sm:px-4"
        >
            ← Vorige
        </button>

        {#each items as item, index (typeof item === "number" ? item : `${item}-${index}`)}
            {#if item === "..."}
                <span class="px-1 text-gray-500">...</span>
            {:else}
                <button
                    type="button"
                    onclick={() => goTo(item)}
                    class={`h-9 w-9 rounded-lg text-sm font-medium transition ${
                        currentPage === item
                            ? "bg-black text-white"
                            : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                >
                    {item}
                </button>
            {/if}
        {/each}

        <button
            type="button"
            onclick={() => goTo(currentPage + 1)}
            disabled={currentPage === totalPages}
            class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 sm:px-4"
        >
            Volgende →
        </button>
    </div>

    <p class="mt-3 text-center text-sm text-gray-500">
        Pagina {currentPage} van {totalPages}
    </p>
{/if}
