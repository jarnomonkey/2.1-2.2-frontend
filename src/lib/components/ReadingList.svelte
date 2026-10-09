<script lang="ts">
    import { onMount } from "svelte";
    import LoadingSkeleton from "$lib/components/LoadingSkeleton.svelte";

    type Book = {
        _id: string;
        title: string;
        author: string;
        genre?: string[];
        tags?: string[];
        readingLevel?: string[];
        materialType?: string;
        sourceUrl?: string;
    };

    type ReadingListItem = {
        bookId: string;
        addedAt: string;
        isRead?: boolean;
        book: Book | null;
    };

    let items = $state<ReadingListItem[]>([]);
    let loading = $state(true);
    let error = $state("");
    let actionError = $state("");
    let needsLogin = $state(false);
    let updatingBookId = $state<string | null>(null);

    onMount(async () => {
        const token = localStorage.getItem("access_token");

        if (!token) {
            needsLogin = true;
            loading = false;
            return;
        }

        try {
            const response = await fetch("http://localhost:3000/reading-list", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.status === 401) {
                error = "De server weigerde de aanvraag (401). Log opnieuw in.";
                return;
            }

            if (!response.ok) {
                error = `De leeslijst kon niet worden opgehaald (${response.status}).`;
                return;
            }

            items = await response.json();
        } catch (err) {
            console.error("Leeslijst ophalen mislukt:", err);
            error = "Kan geen verbinding maken met de server.";
        } finally {
            loading = false;
        }
    });

    async function removeItem(bookId: string) {
        const token = localStorage.getItem("access_token");
        if (!token) return;

        try {
            const response = await fetch(
                `http://localhost:3000/reading-list/${bookId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                actionError = "Verwijderen is niet gelukt.";
                return;
            }

            actionError = "";
            items = items.filter((item) => item.bookId !== bookId);
        } catch (err) {
            console.error("Verwijderen mislukt:", err);
            actionError = "Kan geen verbinding maken met de server.";
        }
    }

    async function toggleRead(item: ReadingListItem) {
        const token = localStorage.getItem("access_token");
        if (!token || updatingBookId === item.bookId) return;

        const oldValue = item.isRead ?? false;
        const newValue = !oldValue;

        updatingBookId = item.bookId;
        actionError = "";

        items = items.map((currentItem) =>
            currentItem.bookId === item.bookId
                ? { ...currentItem, isRead: newValue }
                : currentItem
        );

        try {
            const response = await fetch(
                `http://localhost:3000/reading-list/${item.bookId}/read`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ isRead: newValue })
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (err) {
            console.error("Leesstatus aanpassen mislukt:", err);

            items = items.map((currentItem) =>
                currentItem.bookId === item.bookId
                    ? { ...currentItem, isRead: oldValue }
                    : currentItem
            );

            actionError = "De leesstatus kon niet worden aangepast.";
        } finally {
            updatingBookId = null;
        }
    }

    function label(book: Book): string {
        return book.genre?.[0] ?? book.tags?.[0] ?? "";
    }

    function level(book: Book): string {
        return book.readingLevel?.join("–") ?? "";
    }
</script>

<div class="w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-sm">
    <div class="border-b border-slate-200 px-5 py-4">
        <h2 class="text-lg font-bold text-slate-900">Mijn leeslijst</h2>
        <p class="text-sm text-slate-500">
            De boeken die je wilt lezen.
        </p>
    </div>

    {#if loading}
        <LoadingSkeleton variant="list" />
    {:else if needsLogin}
        <p class="px-5 py-8 text-center text-sm text-slate-500">
            Log in om je leeslijst te zien.
            <a
                href="/login"
                class="font-semibold text-indigo-600 underline underline-offset-4 hover:text-indigo-700"
            >
                Inloggen
            </a>
        </p>
    {:else if error}
        <div role="alert" class="m-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
        </div>
    {:else if items.length === 0}
        <p class="px-5 py-8 text-center text-sm text-slate-500">
            Je leeslijst is nog leeg.
            <a
                href="/boeken"
                class="font-semibold text-indigo-600 underline underline-offset-4 hover:text-indigo-700"
            >
                Bekijk de boeken
            </a>
        </p>
    {:else}
        {#if actionError}
            <div role="alert" class="m-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {actionError}
            </div>
        {/if}

        <div class="divide-y divide-slate-100">
            {#each items as item, i (item.bookId)}
                <div class="flex items-center gap-4 px-5 py-4 transition hover:bg-slate-50">
                    <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-sm font-bold text-indigo-600">
                        {i + 1}
                    </div>

                    {#if item.book}
                        {@const book = item.book}

                        <div class="min-w-0 flex-1">
                            <h3
                                class:line-through={item.isRead}
                                class:!text-slate-400={item.isRead}
                                class="truncate font-semibold text-slate-900"
                            >
                                {book.title}
                            </h3>

                            <p class="text-sm text-slate-500">
                                {book.author}
                            </p>
                        </div>

                        <label class="flex shrink-0 items-center gap-2 text-sm text-slate-600">
                            <input
                                type="checkbox"
                                checked={item.isRead ?? false}
                                disabled={updatingBookId === item.bookId}
                                onchange={() => toggleRead(item)}
                                class="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span class="hidden sm:inline">
                                {item.isRead ? "Gelezen" : "Niet gelezen"}
                            </span>
                        </label>

                        <div class="hidden items-center gap-2 sm:flex">
                            {#if label(book)}
                                <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                                    {label(book)}
                                </span>
                            {/if}

                            {#if level(book)}
                                <span class="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
                                    {level(book)}
                                </span>
                            {/if}
                        </div>
                    {:else}
                        <div class="min-w-0 flex-1">
                            <h3 class="truncate font-semibold text-slate-400">
                                Boek niet meer beschikbaar
                            </h3>
                        </div>
                    {/if}

                    <span class="text-lg text-slate-400">→</span>

                    <button
                        type="button"
                        onclick={() => removeItem(item.bookId)}
                        class="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                        aria-label={`Verwijder ${item.book?.title ?? "boek"}`}
                        title="Verwijderen"
                    >
                        <svg
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            class="h-5 w-5"
                        >
                            <path d="M3 6h18" />
                            <path d="M8 6V4h8v2" />
                            <path d="M19 6l-1 14H6L5 6" />
                            <path d="M10 11v5" />
                            <path d="M14 11v5" />
                        </svg>
                    </button>
                </div>
            {/each}
        </div>
    {/if}
</div>