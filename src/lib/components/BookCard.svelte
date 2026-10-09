<script lang="ts">
    import SaveButton from "./SaveButton.svelte";

    type Student = {
        id: string;
        name: string;
        email: string;
    };

    let {
        bookId,
        title,
        author,
        genre,
        tags = [],
        leesniveau,
        saved = false,
        canSave = true,
        canAssign = false,
        students = [],
        selectedStudentId = "",
        onAssign
    } = $props<{
        bookId: string;
        title: string;
        author: string;
        genre?: string;
        tags?: string[];
        leesniveau?: string;
        saved?: boolean;
        canSave?: boolean;
        canAssign?: boolean;
        students?: Student[];
        selectedStudentId?: string;
        onAssign?: (bookId: string, studentId: string) => void;
    }>();
</script>

<article class="w-full min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5">
    <div class="mb-4 flex h-40 items-center justify-center rounded-lg bg-indigo-100">
        <span aria-hidden="true" class="text-5xl">📚</span>
    </div>

    <h2 class="break-words text-xl font-bold text-slate-900">{title}</h2>

    <p class="mt-1 text-sm text-slate-500">{author}</p>

    <div class="mt-4 flex flex-wrap gap-2">
        {#if genre}
            <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {genre}
            </span>
        {/if}

        {#if leesniveau}
            <span class="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
                Niveau {leesniveau}
            </span>
        {/if}

        {#each tags as tag}
            <span class="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                {tag}
            </span>
        {/each}
    </div>

    {#if canSave}
        <div class="mt-5 flex justify-end">
            <SaveButton {bookId} {saved} />
        </div>
    {/if}

    {#if canAssign}
        <div class="mt-5 border-t border-slate-100 pt-4">
            <label
                for={`student-${bookId}`}
                class="mb-2 block text-xs font-semibold text-slate-600"
            >
                Toevoegen aan leerling
            </label>

            <select
                id={`student-${bookId}`}
                value={selectedStudentId}
                onchange={(event) =>
                    onAssign?.(bookId, event.currentTarget.value)}
                class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
                <option value="">Selecteer een leerling</option>

                {#each students as student}
                    <option value={student.id}>
                        {student.name} — {student.email}
                    </option>
                {/each}
            </select>
        </div>
    {/if}
</article>