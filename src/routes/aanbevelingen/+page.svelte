<script lang="ts">
    import { onMount } from "svelte";
    import Button from "$lib/components/Button.svelte";
    import BookCard from "$lib/components/BookCard.svelte";
    import Pagination from "$lib/components/Pagination.svelte";

    const API = "http://localhost:3000";
    const DRAFT_KEY = "readingProfileDraft";
    const booksPerPage = 6;

    const lengths = [
        { value: "KORT", label: "Kort" },
        { value: "MIDDEL", label: "Gemiddeld" },
        { value: "LANG", label: "Lang" }
    ];

    const goals = [
        { value: "ONTSPANNING", label: "Ontspanning" },
        { value: "TAAL_OEFENEN", label: "Mijn taal verbeteren" },
        { value: "INFORMATIE", label: "Informatie opdoen" }
    ];

    let levels = $state<{ value: string; label: string }[]>([]);
    let topicOptions = $state<string[]>([]);

    type Form = {
        readingLevel: string;
        topics: string[];
        lengthPref: string;
        readingGoal: string;
    };

    type Book = {
        _id: string;
        title: string;
        author?: string;
        description?: string;
        coverUrl?: string;
        genre?: string | string[];
        readingLevel?: string | string[];
        tags?: string | string[];
    };

    type RecommendationGroup = {
        topic: string;
        books: Book[];
    };

    const emptyForm = (): Form => ({
        readingLevel: "",
        topics: [],
        lengthPref: "",
        readingGoal: ""
    });

    let form = $state<Form>(emptyForm());
    let savedForm = $state<Form>(emptyForm());

    let status = $state<"loading" | "loggedOut" | "ready">("loading");
    let token: string | null = null;
    let saving = $state(false);
    let restored = $state(false);
    let profileCollapsed = $state(false);
    let error = $state("");

    let recommendations = $state<Book[]>([]);
    let savedBookIds = $state<Set<string>>(new Set());
    let loadingRecommendations = $state(false);
    let currentPage = $state(1);

    let recommendationPages = $derived.by(() => {
        const pages: RecommendationGroup[][] = [];
        let page: RecommendationGroup[] = [];
        let pageSize = 0;

        for (const group of groupRecommendations(recommendations)) {
            if (page.length > 0 && pageSize + group.books.length > booksPerPage) {
                pages.push(page);
                page = [];
                pageSize = 0;
            }

            page.push(group);
            pageSize += group.books.length;
        }

        if (page.length > 0) pages.push(page);

        return pages;
    });

    let totalPages = $derived(
        Math.max(1, recommendationPages.length)
    );

    let missing = $derived(
        [
            !form.readingLevel && "taalniveau",
            form.topics.length === 0 && "thema"
        ].filter(Boolean) as string[]
    );

    let hasChanges = $derived(
        JSON.stringify(form) !== JSON.stringify(savedForm)
    );

    function validTopics(topics: string[]): string[] {
        if (topicOptions.length === 0) return topics;

        const availableTopics = new Map(
            topicOptions.map((topic) => [normalise(topic), topic])
        );

        return topics
            .map((topic) => availableTopics.get(normalise(topic)))
            .filter((topic): topic is string => Boolean(topic));
    }

    function copyForm(value: Form): Form {
        return {
            readingLevel: value.readingLevel,
            topics: validTopics(value.topics),
            lengthPref: value.lengthPref,
            readingGoal: value.readingGoal
        };
    }

    function persist() {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    }

    function readDraft(): Form | null {
        try {
            const raw = localStorage.getItem(DRAFT_KEY);
            return raw ? { ...emptyForm(), ...JSON.parse(raw) } : null;
        } catch {
            return null;
        }
    }

    function pick(
        field: "readingLevel" | "lengthPref" | "readingGoal",
        value: string
    ) {
        form[field] = value;
        persist();
    }

    function toggle(field: "topics", value: string) {
        const selectedValue = form[field].find(
            (item) => normalise(item) === normalise(value)
        );

        form[field] = selectedValue
            ? form[field].filter(
                  (item) => normalise(item) !== normalise(value)
              )
            : [...form[field], value];

        persist();
    }

    function isTopicSelected(topic: string): boolean {
        return form.topics.some(
            (item) => normalise(item) === normalise(topic)
        );
    }

    function cancelChanges() {
        form = copyForm(savedForm);
        localStorage.removeItem(DRAFT_KEY);
        restored = false;
        error = "";
        profileCollapsed = true;
    }

    function sessionExpired() {
        localStorage.removeItem("access_token");
        status = "loggedOut";
    }

    async function loadSavedBookIds() {
        if (!token) return;

        try {
            const response = await fetch(`${API}/reading-list/ids`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!response.ok) return;

            const data: unknown = await response.json();

            if (Array.isArray(data)) {
                savedBookIds = new Set(data.map((id) => String(id)));
            }
        } catch (err) {
            console.error("Leeslijst ophalen mislukt:", err);
        }
    }

    function chip(active: boolean) {
        return (
            "rounded-full border px-4 py-2 text-sm font-medium transition " +
            (active
                ? "border-indigo-600 bg-indigo-600 text-white"
                : "border-slate-300 bg-white text-slate-700 hover:border-indigo-400 hover:bg-indigo-50")
        );
    }

    async function loadAvailableFilters() {
        try {
            const response = await fetch(`${API}/books`);

            if (!response.ok) return;

            const data = await response.json();
            const books: Book[] = Array.isArray(data) ? data : data.books ?? [];
            const unique = (items: string[]) => [...new Set(items)].sort();

            const levelChoices = new Map<string, { value: string; label: string }>();

            books.flatMap((book) => rawValues(book.readingLevel)).forEach((value) => {
                const backendValue = readingLevelValue(value);
                levelChoices.set(readingLevelKey(backendValue), {
                    value: backendValue,
                    label: value
                });
            });

            levels = [...levelChoices.values()].sort((a, b) =>
                a.label.localeCompare(b.label)
            );
            topicOptions = unique(
                books.flatMap((book) => rawValues(book.tags))
            );
        } catch (err) {
            console.error("Boekfilters ophalen mislukt:", err);
        }
    }

    function normalise(value: string): string {
        return value
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "");
    }

    function readingLevelValue(value: string): string {
        const normalized = normalise(value);

        if (normalized === "2f") return "NIVEAU_2F";
        if (normalized === "3f") return "NIVEAU_3F";
        if (normalized === "3fplus") return "NIVEAU_3F_PLUS";

        return value;
    }

    function readingLevelKey(value: string): string {
        return normalise(value).replace(/^niveau/, "");
    }

    function matchesSelectedLevel(book: Book): boolean {
        const selectedLevel = readingLevelKey(form.readingLevel);
        const bookLevels = values(book.readingLevel);

        return (
            !selectedLevel ||
            bookLevels.length === 0 ||
            bookLevels.some((level) => readingLevelKey(level) === selectedLevel)
        );
    }

    function values(value: string | string[] | undefined): string[] {
        return (Array.isArray(value) ? value : value ? [value] : []).map(
            normalise
        );
    }

    function rawValues(value: string | string[] | undefined): string[] {
        return Array.isArray(value) ? value : value ? [value] : [];
    }

    function matchesBook(book: Book): number {
        const bookLevels = values(book.readingLevel);
        const bookTags = values(book.tags);
        const selectedLevel = readingLevelKey(form.readingLevel);
        const selectedTopics = form.topics.map(normalise);
        const matchingTopics = selectedTopics.filter((topic) =>
            bookTags.some((tag) => tag === topic || tag.includes(topic))
        );

        let score = 0;

        if (selectedLevel && bookLevels.some((level) => readingLevelKey(level) === selectedLevel)) {
            score += 3;
        }

        score += matchingTopics.length * 2;

        return score;
    }

    function matchesSelectedTopics(book: Book): boolean {
        const bookTags = values(book.tags);
        const selectedTopics = form.topics.map(normalise);

        return selectedTopics.some((topic) =>
            bookTags.some((tag) => tag === topic || tag.includes(topic))
        );
    }

    function groupRecommendations(books: Book[]): RecommendationGroup[] {
        const groups = form.topics.map((topic) => ({
            topic,
            books: [] as Book[]
        }));

        for (const book of books) {
            const bookTags = values(book.tags);
            const group = groups.find((candidate) => {
                const normalizedTopic = normalise(candidate.topic);
                return bookTags.some(
                    (tag) => tag === normalizedTopic || tag.includes(normalizedTopic)
                );
            });

            group?.books.push(book);
        }

        return groups.filter((group) => group.books.length > 0);
    }

    async function loadFallbackRecommendations(): Promise<Book[]> {
        const response = await fetch(`${API}/books`);

        if (!response.ok) return [];

        const data = await response.json();
        const books: Book[] = Array.isArray(data) ? data : data.books ?? [];

        return books
            .filter(
                (book) =>
                    matchesSelectedLevel(book) && matchesSelectedTopics(book)
            )
            .map((book, index) => ({ book, score: matchesBook(book), index }))
            .sort((a, b) => b.score - a.score || a.index - b.index)
            .map(({ book }) => book);
    }

    async function loadRecommendations() {
        if (!token) return;

        loadingRecommendations = true;
        currentPage = 1;
        recommendations = [];

        try {
            recommendations = await loadFallbackRecommendations();
        } catch (err) {
            console.error("Aanbevelingen ophalen mislukt:", err);
            recommendations = [];
        } finally {
            loadingRecommendations = false;
        }
    }

    async function save() {
        if (missing.length > 0 || saving || !token) return;

        saving = true;
        error = "";

        try {
            const response = await fetch(`${API}/reading-profile/me`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    readingLevel: form.readingLevel,
                    topics: form.topics,
                    lengthPref: form.lengthPref || null,
                    readingGoal: form.readingGoal || null
                })
            });

            if (response.status === 401) {
                sessionExpired();
                return;
            }

            if (!response.ok) {
                const body = await response.json().catch(() => null);

                error = body?.message
                    ? [body.message].flat().join(", ")
                    : "Opslaan is niet gelukt. Probeer het opnieuw.";

                return;
            }

            savedForm = copyForm(form);
            localStorage.removeItem(DRAFT_KEY);
            restored = false;
            profileCollapsed = true;

            await loadRecommendations();
        } catch (err) {
            console.error("Leesprofiel opslaan mislukt:", err);
            error =
                "Geen verbinding met de server. Je antwoorden zijn bewaard, probeer het opnieuw.";
        } finally {
            saving = false;
        }
    }

    onMount(async () => {
        token = localStorage.getItem("access_token");

        if (!token) {
            status = "loggedOut";
            return;
        }

        try {
            const profileResponse = await fetch(`${API}/auth/profile`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (profileResponse.ok) {
                const profile = await profileResponse.json();

                if (profile.role === "DOCENT") {
                    window.location.href = "/boeken";
                    return;
                }
            }
        } catch (error) {
            console.error("Toegangscontrole mislukt:", error);
        }

        await loadSavedBookIds();
        await loadAvailableFilters();
        const draft = readDraft();

        try {
            const response = await fetch(`${API}/reading-profile/me`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.status === 401) {
                sessionExpired();
                return;
            }

            if (response.ok) {
                const text = await response.text();
                const profile = text ? JSON.parse(text) : null;

                if (profile) {
                    savedForm = {
                        readingLevel: profile.readingLevel ?? "",
                        topics: validTopics([...(profile.topics ?? [])]),
                        lengthPref: profile.lengthPref ?? "",
                        readingGoal: profile.readingGoal ?? ""
                    };

                    form = draft ? copyForm(draft) : copyForm(savedForm);
                    restored = Boolean(draft);
                    profileCollapsed = !draft;
                } else if (draft) {
                    form = copyForm(draft);
                    restored = true;
                }
            } else if (draft) {
                form = copyForm(draft);
                restored = true;
            }
        } catch (err) {
            console.error("Leesprofiel ophalen mislukt:", err);

            if (draft) {
                form = copyForm(draft);
                restored = true;
            }
        }

        status = "ready";
        await loadRecommendations();
    });
</script>

<svelte:head>
    <title>Aanbevelingen | Leesapp</title>
</svelte:head>

<div class="mx-auto max-w-7xl px-6 py-10">
    <h2 class="text-2xl font-bold tracking-tight text-slate-900">
        Aanbevelingen
    </h2>

    {#if status === "loading"}
        <p class="mt-6 text-slate-500">Laden...</p>
    {:else if status === "loggedOut"}
        <p class="mt-6 text-slate-600">
            Log in om je leesprofiel in te vullen.
            <a href="/login" class="font-medium text-indigo-600 hover:underline">
                Inloggen
            </a>
        </p>
    {:else}
        <section class="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div class="flex items-start justify-between gap-4">
                <div>
                    <h3 class="text-lg font-semibold text-slate-900">
                        Mijn leesprofiel
                    </h3>

                    <p class="mt-1 text-sm text-slate-500">
                        Met je antwoorden kiezen we boeken die bij jou passen.
                    </p>
                </div>

                <button
                    type="button"
                    onclick={() => (profileCollapsed = !profileCollapsed)}
                    class="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                    aria-expanded={!profileCollapsed}
                >
                    {profileCollapsed ? "Wijzigen" : "Inklappen"}
                </button>
            </div>

            {#if profileCollapsed}
                <p class="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
                    Je opgeslagen leesprofiel is ingeklapt.
                </p>
            {:else}
                <p class="mt-4 text-sm text-slate-500">
                    Vragen met <span class="text-red-600">*</span> zijn verplicht.
                </p>

                {#if restored}
                    <p class="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        Je hebt niet-opgeslagen wijzigingen teruggezet.
                    </p>
                {/if}

                <div class="mt-6 space-y-8">
                    <div>
                        <p class="font-medium text-slate-800">
                            Wat is je taalniveau?
                            <span class="text-red-600">*</span>
                        </p>

                        <p class="text-xs text-slate-500">
                            Weet je het niet zeker? Vraag het je docent.
                        </p>

                        <div class="mt-3 flex flex-wrap gap-2">
                            {#each levels as option}
                                <button
                                    type="button"
                                    aria-pressed={form.readingLevel === option.value}
                                    class={chip(form.readingLevel === option.value)}
                                    onclick={() => pick("readingLevel", option.value)}
                                >
                                    {option.label}
                                </button>
                            {/each}
                        </div>
                    </div>

                    <div>
                        <p class="font-medium text-slate-800">
                            Over welk thema wil je lezen?
                            <span class="text-red-600">*</span>
                        </p>

                        <p class="text-xs text-slate-500">
                            Kies er minimaal één.
                        </p>

                        <div class="mt-3 flex flex-wrap gap-2">
                            {#each topicOptions as topic}
                                <button
                                    type="button"
                                    aria-pressed={isTopicSelected(topic)}
                                    class={chip(isTopicSelected(topic))}
                                    onclick={() => toggle("topics", topic)}
                                >
                                    {topic}
                                </button>
                            {/each}
                        </div>
                    </div>

                    <div>
                        <p class="font-medium text-slate-800">
                            Hoe lang mag het zijn?
                            <span class="text-xs font-normal text-slate-400">(optioneel)</span>
                        </p>

                        <div class="mt-3 flex flex-wrap gap-2">
                            {#each lengths as option}
                                <button
                                    type="button"
                                    aria-pressed={form.lengthPref === option.value}
                                    class={chip(form.lengthPref === option.value)}
                                    onclick={() =>
                                        pick(
                                            "lengthPref",
                                            form.lengthPref === option.value ? "" : option.value
                                        )
                                    }
                                >
                                    {option.label}
                                </button>
                            {/each}
                        </div>
                    </div>

                    <div>
                        <p class="font-medium text-slate-800">
                            Wat is je doel met lezen?
                            <span class="text-xs font-normal text-slate-400">(optioneel)</span>
                        </p>

                        <div class="mt-3 flex flex-wrap gap-2">
                            {#each goals as option}
                                <button
                                    type="button"
                                    aria-pressed={form.readingGoal === option.value}
                                    class={chip(form.readingGoal === option.value)}
                                    onclick={() =>
                                        pick(
                                            "readingGoal",
                                            form.readingGoal === option.value ? "" : option.value
                                        )
                                    }
                                >
                                    {option.label}
                                </button>
                            {/each}
                        </div>
                    </div>
                </div>

                {#if error}
                    <p class="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </p>
                {/if}

                <div class="mt-6 flex flex-wrap items-center gap-3">
                    <Button
                        type="button"
                        onclick={save}
                        disabled={missing.length > 0 || saving || !hasChanges}
                        class="rounded-lg px-5 py-2.5 text-sm font-medium"
                    >
                        {saving ? "Opslaan..." : "Wijzigingen bevestigen"}
                    </Button>

                    {#if hasChanges}
                        <Button
                            type="button"
                            onclick={cancelChanges}
                            disabled={saving}
                            variant="secondary"
                            class="rounded-lg px-5 py-2.5 text-sm font-medium"
                        >
                            Annuleren
                        </Button>
                    {/if}

                    {#if missing.length > 0}
                        <span class="text-sm text-slate-500">
                            Nog invullen: {missing.join(", ")}
                        </span>
                    {/if}
                </div>
            {/if}
        </section>

        <section class="mt-8">
            <h3 class="text-xl font-semibold text-slate-900">
                Boeken voor jou
            </h3>

            {#if loadingRecommendations}
                <p class="mt-4 text-slate-500">Aanbevelingen laden...</p>
            {:else if recommendations.length === 0}
                <p class="mt-4 text-slate-500">
                    Er zijn nog geen passende boeken gevonden.
                </p>
            {:else}
                <p class="mt-1 text-sm text-slate-500">
                    {recommendations.length} resultaten
                </p>

                {#each recommendationPages[currentPage - 1] ?? [] as group}
                    <div class="mt-6">
                        <h4 class="text-lg font-semibold text-slate-900">
                            Omdat je van {group.topic} houdt
                        </h4>

                        <div class="mt-3 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {#each group.books as book (book._id)}
                                <BookCard
                                    bookId={book._id}
                                    title={book.title}
                                    author={book.author ?? "Onbekende auteur"}
                                    genre={Array.isArray(book.genre)
                                        ? book.genre[0]
                                        : book.genre}
                                    tags={Array.isArray(book.tags)
                                        ? book.tags
                                        : book.tags
                                            ? [book.tags]
                                            : []}
                                    leesniveau={Array.isArray(book.readingLevel)
                                        ? book.readingLevel[0]
                                        : book.readingLevel}
                                    saved={savedBookIds.has(book._id)}
                                />
                            {/each}
                        </div>
                    </div>
                {/each}

                <Pagination bind:currentPage {totalPages} />
            {/if}
        </section>
    {/if}
</div>