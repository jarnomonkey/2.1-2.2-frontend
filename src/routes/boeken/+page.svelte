<script lang="ts">
    import { onMount } from "svelte";
    import Button from "$lib/components/Button.svelte";
    import BookCard from "$lib/components/BookCard.svelte";
    import Pagination from "$lib/components/Pagination.svelte";
    import SelectField from "$lib/components/SelectField.svelte";

    const API = "http://localhost:3000";
    const booksPerPage = 12;

    type Book = {
        _id: string;
        title: string;
        author: string;
        genre?: string[];
        tags?: string[];
        readingLevel?: string[];
        materialType?: string;
    };

    type Profile = {
        role?: string;
    };

    type Student = {
        id: string;
        name: string;
        email: string;
        role: string;
    };

    let books = $state<Book[]>([]);
    let results = $state<Book[]>([]);
    let students = $state<Student[]>([]);
    let savedBookIds = $state<Set<string>>(new Set());

    let loading = $state(false);
    let searched = $state(false);
    let error = $state("");
    let assignmentMessage = $state("");
    let assignmentError = $state("");
    let isTeacher = $state(false);

    let selectedStudentIds = $state<Record<string, string>>({});
    let currentPage = $state(1);

    let author = $state("");
    let genre = $state("");
    let readingLevel = $state("");
    let tag = $state("");
    let materialType = $state("");

    let genres = $derived(
        [...new Set(books.flatMap((book) => book.genre ?? []))].sort()
    );

    let readingLevels = $derived(
        [...new Set(books.flatMap((book) => book.readingLevel ?? []))].sort()
    );

    let tags = $derived(
        [...new Set(books.flatMap((book) => book.tags ?? []))].sort()
    );

    let materialTypes = $derived(
        [
            ...new Set(
                books
                    .map((book) => book.materialType)
                    .filter((value): value is string => Boolean(value))
            )
        ].sort()
    );

    const selectOptions = (values: string[]) => [
        { value: "", label: "Geen voorkeur" },
        ...values.map((value) => ({ value, label: value }))
    ];

    let totalPages = $derived(
        Math.max(1, Math.ceil(results.length / booksPerPage))
    );

    let paginatedResults = $derived(
        results.slice(
            (currentPage - 1) * booksPerPage,
            currentPage * booksPerPage
        )
    );


    async function getProfile() {
        const token = localStorage.getItem("access_token");

        if (!token) return;

        try {
            const response = await fetch(`${API}/auth/profile`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!response.ok) return;

            const profile: Profile = await response.json();
            isTeacher = profile.role === "DOCENT";
        } catch (err) {
            console.error("Profiel ophalen mislukt:", err);
        }
    }

    async function getBooks() {
        loading = true;
        error = "";

        try {
            const response = await fetch(`${API}/books`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            books = Array.isArray(data) ? data : data.books ?? [];
        } catch (err) {
            console.error("Boeken ophalen mislukt:", err);
            error = "Er ging iets mis bij het ophalen van de boeken.";
        } finally {
            loading = false;
        }
    }

    async function getSavedBookIds() {
        const token = localStorage.getItem("access_token");

        if (!token || isTeacher) return;

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

    async function getStudents() {
        const token = localStorage.getItem("access_token");

        if (!token || !isTeacher) return;

        try {
            const response = await fetch(`${API}/reading-list/all`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            students = Array.isArray(data) ? data : data.students ?? [];
        } catch (err) {
            console.error("Leerlingen ophalen mislukt:", err);
            assignmentError =
                "De gekoppelde leerlingen konden niet worden opgehaald.";
        }
    }

    function selectStudent(bookId: string, studentId: string) {
        selectedStudentIds = {
            ...selectedStudentIds,
            [bookId]: studentId
        };

        assignmentError = "";
        assignmentMessage = "";
    }

    async function assignBook(bookId: string, studentId: string) {
        const token = localStorage.getItem("access_token");

        if (!token || !studentId) {
            assignmentError = "Selecteer eerst een leerling.";
            return;
        }

        assignmentMessage = "";
        assignmentError = "";

        try {
            const response = await fetch(
                `${API}/reading-list/students/${studentId}`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ bookId })
                }
            );

            if (!response.ok) {
                const message = await response.text();
                console.error("Boek toevoegen mislukt:", message);
                throw new Error(`HTTP ${response.status}`);
            }

            const student = students.find((item) => item.id === studentId);

            assignmentMessage = student
                ? `Boek toegevoegd aan de leeslijst van ${student.name}.`
                : "Boek toegevoegd aan de leeslijst.";

            selectedStudentIds = {
                ...selectedStudentIds,
                [bookId]: ""
            };
        } catch (err) {
            console.error("Boek toewijzen mislukt:", err);
            assignmentError =
                "Het boek kon niet aan de leerling worden toegevoegd.";
        }
    }

    function searchBooks() {
        searched = true;
        currentPage = 1;
        error = "";
        assignmentMessage = "";
        assignmentError = "";

        results = books.filter((book) => {
            const matchesAuthor =
                author.trim() === "" ||
                book.author.toLowerCase().includes(author.toLowerCase());

            const matchesGenre =
                genre === "" || (book.genre ?? []).includes(genre);

            const matchesReadingLevel =
                readingLevel === "" ||
                (book.readingLevel ?? []).includes(readingLevel);

            const matchesTag =
                tag === "" || (book.tags ?? []).includes(tag);

            const matchesMaterialType =
                materialType === "" ||
                book.materialType === materialType;

            return (
                matchesAuthor &&
                matchesGenre &&
                matchesReadingLevel &&
                matchesTag &&
                matchesMaterialType
            );
        });
    }

    function resetSearch() {
        author = "";
        genre = "";
        readingLevel = "";
        tag = "";
        materialType = "";
        results = [];
        currentPage = 1;
        searched = false;
        assignmentMessage = "";
        assignmentError = "";
    }

    function goToPage(page: number) {
        if (page < 1 || page > totalPages) return;

        currentPage = page;

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }

    function previousPage() {
        goToPage(currentPage - 1);
    }

    function nextPage() {
        goToPage(currentPage + 1);
    }

    onMount(async () => {
        await getProfile();
        await getBooks();
        await getSavedBookIds();
        await getStudents();
    });
</script>

<svelte:head>
    <title>Boeken zoeken | Leesapp</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 sm:py-10">
    <div class="mx-auto max-w-7xl">
        <div class="mb-8 text-center sm:mb-10">

            <h1 class="text-3xl font-bold text-gray-900 sm:text-4xl">
                Vind jouw boek
            </h1>

            <p class="mx-auto mt-3 max-w-xl text-gray-500">
                Zoek boeken op basis van auteur, genre, leesniveau of thema.
            </p>
        </div>

        <div class="grid items-start gap-6 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-8">
            <aside class="rounded-2xl bg-white p-4 shadow-lg ring-1 ring-gray-100 sm:p-6 lg:sticky lg:top-6">
                <h2 class="text-xl font-bold text-gray-900 sm:text-2xl">Wat zoek je?</h2>

            <div class="mt-6 grid grid-cols-1 gap-5">
                <div>
                    <label
                        for="author"
                        class="mb-2 block text-sm font-semibold text-gray-700"
                    >
                        Auteur
                    </label>

                    <input
                        id="author"
                        type="text"
                        bind:value={author}
                        placeholder="Bijvoorbeeld Anne Frank"
                        class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-black focus:bg-white"
                    />
                </div>

                <SelectField
                    id="genre"
                    label="Genre"
                    bind:value={genre}
                    options={selectOptions(genres)}
                />

                <SelectField
                    id="readingLevel"
                    label="Leesniveau"
                    bind:value={readingLevel}
                    options={selectOptions(readingLevels)}
                />

                <SelectField
                    id="tag"
                    label="Thema"
                    bind:value={tag}
                    options={selectOptions(tags)}
                />

                <SelectField
                    id="materialType"
                    label="Type materiaal"
                    bind:value={materialType}
                    options={selectOptions(materialTypes)}
                />
            </div>

            <div class="mt-8 flex flex-col gap-3">
                <Button
                    type="button"
                    onclick={searchBooks}
                    disabled={loading}
                    fullWidth
                >
                    🔎 Boeken zoeken
                </Button>

                <Button
                    type="button"
                    onclick={resetSearch}
                    variant="secondary"
                    fullWidth
                >
                    Opnieuw beginnen
                </Button>
            </div>
            </aside>

            <section class="min-w-0">

        {#if error}
            <div class="mt-6 rounded-2xl bg-red-50 p-5 text-center text-red-600">
                {error}
            </div>
        {/if}

        {#if assignmentMessage}
            <div class="mt-6 rounded-2xl bg-green-50 p-5 text-green-700">
                {assignmentMessage}
            </div>
        {/if}

        {#if assignmentError}
            <div class="mt-6 rounded-2xl bg-red-50 p-5 text-red-600">
                {assignmentError}
            </div>
        {/if}

        {#if searched}
            <div class="mt-10">
                <div class="mb-6">
                    <h2 class="text-2xl font-bold text-gray-900">
                        Jouw resultaten
                    </h2>

                    <p class="mt-1 text-sm text-gray-500">
                        {results.length}
                        {results.length === 1 ? "boek" : "boeken"} gevonden
                    </p>
                </div>

                {#if results.length === 0}
                    <div class="rounded-3xl bg-white p-12 text-center shadow-sm">
                        <h3 class="text-xl font-bold text-gray-900">
                            Geen boeken gevonden
                        </h3>

                        <p class="mt-2 text-gray-500">
                            Probeer je zoekvoorkeuren aan te passen.
                        </p>
                    </div>
                {:else}
                    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {#each paginatedResults as book (book._id)}
                            <BookCard
                                bookId={book._id}
                                title={book.title}
                                author={book.author}
                                genre={book.genre?.[0]}
                                tags={book.tags}
                                leesniveau={book.readingLevel?.[0]}
                                saved={savedBookIds.has(book._id)}
                                canSave={!isTeacher}
                                canAssign={isTeacher}
                                students={students}
                                selectedStudentId={selectedStudentIds[book._id] ?? ""}
                                onAssign={(bookId, studentId) =>
                                    assignBook(bookId, studentId)}
                            />
                        {/each}
                    </div>

                    <Pagination
                        bind:currentPage
                        {totalPages}
                        onPageChange={goToPage}
                    />
                {/if}
            </div>
        {/if}
            </section>
        </div>
    </div>
</div>