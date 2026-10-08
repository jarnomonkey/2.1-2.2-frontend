<script lang="ts">
    import { onMount } from "svelte";

    const API = "http://localhost:3000";

    type Book = {
        _id: string;
        title: string;
        author: string;
        readingLevel?: string[];
    };

    type ReadingListItem = {
        bookId: string;
        isRead?: boolean;
        book: Book | null;
    };

    type Student = {
        id: string;
        name: string;
        email: string;
        role: string;
        readingList: ReadingListItem[];
    };

    let students = $state<Student[]>([]);
    let books = $state<Book[]>([]);
    let loading = $state(true);
    let error = $state("");
    let forbidden = $state(false);
    let search = $state("");

    let selectedBookIds = $state<Record<string, string>>({});
    let addingForStudent = $state<string | null>(null);
    let actionError = $state("");
    let successMessage = $state("");

    let filtered = $derived(
        students.filter((student) => {
            const query = search.trim().toLowerCase();

            return (
                !query ||
                student.name.toLowerCase().includes(query) ||
                student.email.toLowerCase().includes(query)
            );
        })
    );

    const roleLabel: Record<string, string> = {
        STUDENT: "Student",
        CURSIST: "Cursist"
    };

    function setSelectedBook(studentId: string, bookId: string) {
        selectedBookIds = {
            ...selectedBookIds,
            [studentId]: bookId
        };
    }

    async function loadData() {
        const token = localStorage.getItem("access_token");

        if (!token) {
            window.location.href = "/login";
            return;
        }

        const headers = {
            Authorization: `Bearer ${token}`
        };

        try {
            const [studentsResponse, booksResponse] = await Promise.all([
                fetch(`${API}/reading-list/all`, { headers }),
                fetch(`${API}/books`)
            ]);

            if (studentsResponse.status === 401) {
                window.location.href = "/login";
                return;
            }

            if (studentsResponse.status === 403) {
                forbidden = true;
                return;
            }

            if (!studentsResponse.ok) {
                error = `De leeslijsten konden niet worden opgehaald (${studentsResponse.status}).`;
                return;
            }

            if (!booksResponse.ok) {
                error = `De boeken konden niet worden opgehaald (${booksResponse.status}).`;
                return;
            }

            const studentsData = await studentsResponse.json();
            const booksData = await booksResponse.json();

            students = Array.isArray(studentsData)
                ? studentsData
                : studentsData.students ?? [];

            books = Array.isArray(booksData)
                ? booksData
                : booksData.books ?? [];
        } catch (err) {
            console.error("Gegevens ophalen mislukt:", err);
            error = "Kan geen verbinding maken met de server.";
        } finally {
            loading = false;
        }
    }

    async function addBookToStudent(student: Student) {
        const token = localStorage.getItem("access_token");
        const bookId = selectedBookIds[student.id];

        if (!token || !bookId || addingForStudent === student.id) {
            return;
        }

        addingForStudent = student.id;
        actionError = "";
        successMessage = "";

        try {
            const response = await fetch(
                `${API}/reading-list/students/${student.id}`,
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
                const responseText = await response.text();
                console.error("Boek toevoegen mislukt:", responseText);

                actionError = `Boek toevoegen mislukt (${response.status}).`;
                return;
            }

            const selectedBook = books.find((book) => book._id === bookId);

            if (selectedBook) {
                const alreadyAdded = student.readingList.some(
                    (item) => item.bookId === selectedBook._id
                );

                if (!alreadyAdded) {
                    students = students.map((currentStudent) =>
                        currentStudent.id === student.id
                            ? {
                                  ...currentStudent,
                                  readingList: [
                                      ...currentStudent.readingList,
                                      {
                                          bookId: selectedBook._id,
                                          book: selectedBook,
                                          isRead: false
                                      }
                                  ]
                              }
                            : currentStudent
                    );
                }
            }

            selectedBookIds = {
                ...selectedBookIds,
                [student.id]: ""
            };

            successMessage = `Boek toegevoegd aan de leeslijst van ${student.name}.`;
        } catch (err) {
            console.error("Boek toevoegen mislukt:", err);
            actionError = "Kan geen verbinding maken met de server.";
        } finally {
            addingForStudent = null;
        }
    }

    onMount(loadData);
</script>

<svelte:head>
    <title>Leeslijsten | Leesapp</title>
</svelte:head>

<div class="min-h-[calc(100vh-4rem)] w-full bg-slate-50 p-6">
    <div class="mx-auto max-w-4xl">
        <div class="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
                <h1 class="text-3xl font-bold text-slate-900">
                    Leeslijsten
                </h1>

                <p class="mt-1 text-sm text-slate-500">
                    Bekijk en beheer de leeslijsten van jouw studenten en cursisten.
                </p>
            </div>

            {#if students.length > 0}
                <input
                    type="search"
                    bind:value={search}
                    placeholder="Zoek op naam of e-mail"
                    class="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 sm:w-72"
                />
            {/if}
        </div>

        {#if actionError}
            <div class="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {actionError}
            </div>
        {/if}

        {#if successMessage}
            <div class="mb-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
                {successMessage}
            </div>
        {/if}

        {#if loading}
            <p class="py-12 text-center text-sm text-slate-500">
                Leeslijsten laden...
            </p>
        {:else if forbidden}
            <div class="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
                <p class="text-lg font-semibold text-slate-900">
                    Geen toegang
                </p>

                <p class="mt-1 text-sm text-slate-500">
                    Deze pagina is alleen voor docenten.
                </p>

                <a
                    href="/"
                    class="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
                >
                    Naar de startpagina
                </a>
            </div>
        {:else if error}
            <div class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
            </div>
        {:else if students.length === 0}
            <p class="py-12 text-center text-sm text-slate-500">
                Er zijn nog geen gekoppelde studenten of cursisten.
            </p>
        {:else if filtered.length === 0}
            <p class="py-12 text-center text-sm text-slate-500">
                Niemand gevonden voor "{search}".
            </p>
        {:else}
            <div class="space-y-4">
                {#each filtered as student (student.id)}
                    <section class="rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div class="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
                            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700">
                                {student.name.trim().charAt(0).toUpperCase() || "?"}
                            </div>

                            <div class="min-w-0 flex-1">
                                <h2 class="truncate font-semibold text-slate-900">
                                    {student.name}
                                </h2>

                                <p class="truncate text-xs text-slate-500">
                                    {student.email}
                                </p>
                            </div>

                            <span class="hidden rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 sm:inline">
                                {roleLabel[student.role] ?? student.role}
                            </span>

                            <span class="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
                                {student.readingList.length}
                                {student.readingList.length === 1 ? "boek" : "boeken"}
                            </span>
                        </div>

                        <div class="border-b border-slate-100 bg-slate-50 px-5 py-4">
                            <label
                                for={`book-${student.id}`}
                                class="mb-2 block text-sm font-semibold text-slate-700"
                            >
                                Boek toevoegen aan deze leeslijst
                            </label>

                            <div class="flex flex-col gap-2 sm:flex-row">
                                <select
                                    id={`book-${student.id}`}
                                    value={selectedBookIds[student.id] ?? ""}
                                    onchange={(event) =>
                                        setSelectedBook(
                                            student.id,
                                            event.currentTarget.value
                                        )}
                                    class="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                                >
                                    <option value="">Selecteer een boek</option>

                                    {#each books as book (book._id)}
                                        <option value={book._id}>
                                            {book.title} — {book.author}
                                        </option>
                                    {/each}
                                </select>

                                <button
                                    type="button"
                                    onclick={() => addBookToStudent(student)}
                                    disabled={
                                        !selectedBookIds[student.id] ||
                                        addingForStudent === student.id
                                    }
                                    class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {addingForStudent === student.id
                                        ? "Toevoegen..."
                                        : "Boek toevoegen"}
                                </button>
                            </div>
                        </div>

                        {#if student.readingList.length === 0}
                            <p class="px-5 py-4 text-sm text-slate-400">
                                Nog niets op de leeslijst.
                            </p>
                        {:else}
                            <ul class="divide-y divide-slate-100">
                                {#each student.readingList as item (item.bookId)}
                                    {@const listedBook =
                                        item.book ??
                                        books.find(
                                            (book) =>
                                                String(book._id) === String(item.bookId)
                                        )}

                                    <li class="flex items-center gap-3 px-5 py-3">
                                        {#if listedBook}
                                            <div class="min-w-0 flex-1">
                                                <p class="truncate text-sm font-medium text-slate-900">
                                                    {listedBook.title}
                                                </p>

                                                <p class="truncate text-xs text-slate-500">
                                                    {listedBook.author}
                                                </p>
                                            </div>

                                            {#if listedBook.readingLevel?.length}
                                                <span class="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
                                                    {listedBook.readingLevel.join("–")}
                                                </span>
                                            {/if}
                                        {:else}
                                            <p class="flex-1 text-sm text-slate-400">
                                                Boek niet meer beschikbaar
                                            </p>
                                        {/if}
                                    </li>
                                {/each}
                            </ul>
                        {/if}
                    </section>
                {/each}
            </div>
        {/if}
    </div>
</div>