<script lang="ts">
    import { onMount } from "svelte";
    import LoadingSkeleton from "$lib/components/LoadingSkeleton.svelte";

    type Teacher = {
        _id?: string;
        id?: string;
        name?: string;
        firstName?: string;
        lastName?: string;
        email: string;
    };

    const API = "http://localhost:3000";

    let teachers = $state<Teacher[]>([]);
    let selectedTeacherId = $state("");
    let currentTeacher = $state<Teacher | null>(null);
    let loading = $state(true);
    let saving = $state(false);
    let error = $state("");
    let success = $state("");

    function teacherId(teacher: Teacher): string {
        return String(teacher._id ?? teacher.id ?? "");
    }

    function teacherName(teacher: Teacher): string {
        return (
            teacher.name ??
            [teacher.firstName, teacher.lastName].filter(Boolean).join(" ") ??
            teacher.email
        );
    }

     async function loadData() {
        const token = localStorage.getItem("access_token");

        if (!token) {
            error = "Log in om een docent te koppelen.";
            loading = false;
            return;
        }

        const headers = {
            Authorization: `Bearer ${token}`
        };

        try {
            const teachersResponse = await fetch(`${API}/users/teachers`, {
                headers
            });

            if (!teachersResponse.ok) {
                throw new Error(
                    `Docenten ophalen mislukt: ${teachersResponse.status}`
                );
            }

            const teachersData = await teachersResponse.json();

            teachers = Array.isArray(teachersData)
                ? teachersData
                : teachersData.teachers ?? teachersData.users ?? [];

            const currentResponse = await fetch(`${API}/users/me/teacher`, {
                headers
            });

            // Geen gekoppelde docent: dit is geen fout.
            if (
                currentResponse.status === 204 ||
                currentResponse.status === 404
            ) {
                currentTeacher = null;
                selectedTeacherId = "";
                return;
            }

            if (!currentResponse.ok) {
                throw new Error(
                    `Huidige docent ophalen mislukt: ${currentResponse.status}`
                );
            }

            const contentType = currentResponse.headers.get("content-type");

            if (contentType?.includes("application/json")) {
                const data = await currentResponse.json();

                currentTeacher = data?.teacher ?? data ?? null;

                if (currentTeacher) {
                    selectedTeacherId = teacherId(currentTeacher);
                }
            }
        } catch (err) {
            console.error("Docentgegevens ophalen mislukt:", err);
            error = "De docentgegevens konden niet worden opgehaald.";
        } finally {
            loading = false;
        }
    }

    async function linkTeacher() {
        const token = localStorage.getItem("access_token");

        if (!token || !selectedTeacherId) return;

        saving = true;
        error = "";
        success = "";

        try {
            const response = await fetch(
                `${API}/users/me/teacher/${selectedTeacherId}`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error("Docent koppelen mislukt.");
            }

            const data = await response.json();
            currentTeacher = data?.teacher ?? data;

            success = "Je bent succesvol aan de docent gekoppeld.";
        } catch (err) {
            console.error(err);
            error = "Het koppelen aan de docent is mislukt.";
        } finally {
            saving = false;
        }
    }

    async function unlinkTeacher() {
        const token = localStorage.getItem("access_token");

        if (!token) return;

        saving = true;
        error = "";
        success = "";

        try {
            const response = await fetch(`${API}/users/me/teacher`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error("Docent ontkoppelen mislukt.");
            }

            currentTeacher = null;
            selectedTeacherId = "";
            success = "Je bent ontkoppeld van je docent.";
        } catch (err) {
            console.error(err);
            error = "Het ontkoppelen is mislukt.";
        } finally {
            saving = false;
        }
    }

    onMount(loadData);
</script>

<section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <h2 class="text-xl font-bold text-slate-900">Docent koppelen</h2>

    <p class="mt-1 text-sm text-slate-500">
        Koppel je account aan je docent.
    </p>

    {#if loading}
        <LoadingSkeleton variant="teacher" />
    {:else}
        {#if currentTeacher}
            <div class="mt-6 rounded-xl bg-indigo-50 p-4">
                <p class="text-sm text-indigo-700">Huidige docent</p>
                <p class="mt-1 font-semibold text-indigo-900">
                    {teacherName(currentTeacher)}
                </p>
                <p class="text-sm text-indigo-700">{currentTeacher.email}</p>
            </div>
        {/if}

        <div class="mt-6">
            <label for="teacher" class="mb-2 block text-sm font-medium text-slate-700">
                Kies een docent
            </label>

            <select
                id="teacher"
                bind:value={selectedTeacherId}
                class="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
                <option value="">Selecteer een docent</option>

                {#each teachers as teacher}
                    <option value={teacherId(teacher)}>
                        {teacherName(teacher)} — {teacher.email}
                    </option>
                {/each}
            </select>
        </div>

        <div class="mt-4 flex flex-wrap gap-3">
            <button
                type="button"
                onclick={linkTeacher}
                disabled={!selectedTeacherId || saving}
                class="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {saving ? "Bezig..." : "Docent koppelen"}
            </button>

            {#if currentTeacher}
                <button
                    type="button"
                    onclick={unlinkTeacher}
                    disabled={saving}
                    class="rounded-xl border border-red-200 px-5 py-3 font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                    Ontkoppelen
                </button>
            {/if}
        </div>
    {/if}

    {#if error}
        <p role="alert" class="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
        </p>
    {/if}

    {#if success}
        <p role="status" aria-live="polite" class="mt-4 rounded-xl bg-green-50 p-3 text-sm text-green-700">
            {success}
        </p>
    {/if}
</section>