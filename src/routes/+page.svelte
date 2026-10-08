<script lang="ts">
    import { onMount } from "svelte";
    import ReadingList from "$lib/components/ReadingList.svelte";

    let checked = $state(false);
    let isTeacher = $state(false);
    let userName = $state("");

    type Profile = {
        name?: string;
        email?: string;
        role?: string;
    };

    onMount(async () => {
        const token = localStorage.getItem("access_token");

        if (!token) {
            checked = true;
            return;
        }

        try {
            const response = await fetch("http://localhost:3000/auth/profile", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.ok) {
                const profile: Profile = await response.json();
                isTeacher = profile.role === "DOCENT";
                userName = profile.name?.trim() || profile.email?.split("@")[0] || "lezer";
            }
        } catch (error) {
            console.error("Profiel ophalen mislukt:", error);
        } finally {
            checked = true;
        }
    });
</script>

<svelte:head>
    <title>Home | Leesapp</title>
</svelte:head>

<div class="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-8 sm:px-6 sm:py-10">
    <div class="mx-auto max-w-7xl">
        <section class="overflow-hidden rounded-3xl bg-slate-900 px-5 py-8 text-white shadow-sm sm:px-8 sm:py-10">
            <div class="max-w-2xl">

                <h1 class="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                    Welkom{#if userName}, {userName}{/if}!
                </h1>

                <p class="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                    Maak van je volgende leesmoment iets om naar uit te kijken.
                    Zoek een boek, ontdek aanbevelingen of ga verder waar je gebleven was.
                </p>

            </div>
        </section>

        <section class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <a href="/boeken" class="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md">
                <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-2xl">🔎</div>
                <h2 class="mt-4 font-semibold text-slate-900">Vind een boek</h2>
                <p class="mt-1 text-sm leading-5 text-slate-500">Filter op auteur, genre, niveau of thema.</p>
                <span class="mt-4 inline-block text-sm font-semibold text-indigo-600 group-hover:text-indigo-700">Naar de boekenkast →</span>
            </a>

            {#if isTeacher}
                <a href="/leeslijsten" class="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
                    <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-2xl">📋</div>
                    <h2 class="mt-4 font-semibold text-slate-900">Volg je studenten</h2>
                    <p class="mt-1 text-sm leading-5 text-slate-500">Bekijk leeslijsten en help studenten kiezen.</p>
                    <span class="mt-4 inline-block text-sm font-semibold text-emerald-600 group-hover:text-emerald-700">Naar de leeslijsten →</span>
                </a>

                <a href="/mijnstudenten" class="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md">
                    <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-2xl">👥</div>
                    <h2 class="mt-4 font-semibold text-slate-900">Mijn studenten</h2>
                    <p class="mt-1 text-sm leading-5 text-slate-500">Beheer de leerlingen die aan jou gekoppeld zijn.</p>
                    <span class="mt-4 inline-block text-sm font-semibold text-amber-600 group-hover:text-amber-700">Studenten bekijken →</span>
                </a>
            {:else}
                <a href="/leeslijst" class="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
                    <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-2xl">📚</div>
                    <h2 class="mt-4 font-semibold text-slate-900">Jouw leeslijst</h2>
                    <p class="mt-1 text-sm leading-5 text-slate-500">Bewaar boeken en houd bij wat je al gelezen hebt.</p>
                    <span class="mt-4 inline-block text-sm font-semibold text-emerald-600 group-hover:text-emerald-700">Leeslijst openen →</span>
                </a>

                <a href="/aanbevelingen" class="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md">
                    <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-2xl">✨</div>
                    <h2 class="mt-4 font-semibold text-slate-900">Boeken voor jou</h2>
                    <p class="mt-1 text-sm leading-5 text-slate-500">Ontvang suggesties die passen bij jouw leesvoorkeuren.</p>
                    <span class="mt-4 inline-block text-sm font-semibold text-amber-600 group-hover:text-amber-700">Aanbevelingen bekijken →</span>
                </a>
            {/if}
        </section>

        {#if checked && !isTeacher}
            <section class="mt-10">
                <div class="mb-5 flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <p class="text-sm font-semibold uppercase tracking-widest text-indigo-600">Jouw boeken</p>
                        <h2 class="mt-1 text-2xl font-bold tracking-tight text-slate-900">Verder lezen</h2>
                    </div>
                    <a href="/leeslijst" class="text-sm font-semibold text-indigo-600 hover:text-indigo-700">Alles bekijken →</a>
                </div>
                <ReadingList />
            </section>
        {/if}
    </div>
</div>