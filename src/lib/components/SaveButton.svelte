<script lang="ts">
    // bookId = het _id van het boek in MongoDB
    // saved  = true als het boek al op de leeslijst staat
    let { bookId, saved = false } = $props();

    let isSaved = $state(false);
    let loading = $state(false);
    let error = $state("");

    // Neem de waarde van de parent over (ook als die later verandert)
    $effect(() => {
        isSaved = saved;
    });

    async function toggleSaved() {
        error = "";

        const token = localStorage.getItem("access_token");

        if (!token) {
            window.location.href = "/login";
            return;
        }

        if (!bookId) {
            error = "Dit boek heeft geen ID.";
            return;
        }

        loading = true;

        try {
            const response = await fetch(
                isSaved
                    ? `http://localhost:3000/reading-list/${bookId}`
                    : "http://localhost:3000/reading-list",
                {
                    method: isSaved ? "DELETE" : "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: isSaved ? undefined : JSON.stringify({ bookId })
                }
            );

            if (response.status === 401) {
                window.location.href = "/login";
                return;
            }

            if (!response.ok) {
                error = "Opslaan is niet gelukt.";
                return;
            }

            isSaved = !isSaved;
        } catch (err) {
            console.error("Leeslijst bijwerken mislukt:", err);
            error = "Kan geen verbinding maken met de server.";
        } finally {
            loading = false;
        }
    }
</script>

<button
    type="button"
    onclick={toggleSaved}
    disabled={loading}
    aria-pressed={isSaved}
    title={isSaved ? "Haal van mijn leeslijst" : "Zet op mijn leeslijst"}
    class="rounded-lg border px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 {isSaved
        ? 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}"
>
    {#if loading}
        ...
    {:else if isSaved}
        ✓ Opgeslagen
    {:else}
        + Leeslijst
    {/if}
</button>

{#if error}
    <p role="alert" class="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
        {error}
    </p>
{/if}
