<script lang="ts">
    import { onMount } from "svelte";
    import TeacherLink from "$lib/components/TeacherLink.svelte";

    type Role = "STUDENT" | "CURSIST" | "DOCENT";

    type Profile = {
        id: string;
        name: string;
        email: string;
        role: Role;
        createdAt?: string;
    };

    let profile = $state<Profile | null>(null);
    let bookCount = $state<number | null>(null);
    let loading = $state(true);
    let error = $state("");

    const roles: Record<
        Role,
        {
            label: string;
            emoji: string;
            text: string;
            badge: string;
        }
    > = {
        STUDENT: {
            label: "Student",
            emoji: "🎓",
            text: "Je volgt een mbo-opleiding en ontdekt boeken die bij jouw niveau passen.",
            badge: "bg-sky-100 text-sky-700"
        },
        CURSIST: {
            label: "Cursist",
            emoji: "🗣️",
            text: "Je leert Nederlands en leest boeken op jouw eigen niveau.",
            badge: "bg-emerald-100 text-emerald-700"
        },
        DOCENT: {
            label: "Docent",
            emoji: "🍎",
            text: "Je begeleidt studenten en cursisten bij hun leesplezier.",
            badge: "bg-amber-100 text-amber-700"
        }
    };

    let role = $derived(profile ? roles[profile.role] : null);

    let initial = $derived(
        (profile?.name?.trim() || profile?.email || "?")
            .charAt(0)
            .toUpperCase()
    );

    let memberSince = $derived(
        profile?.createdAt
            ? new Date(profile.createdAt).toLocaleDateString("nl-NL", {
                  day: "numeric",
                  month: "long",
                  year: "numeric"
              })
            : null
    );

    onMount(async () => {
        const token = localStorage.getItem("access_token");

        if (!token) {
            window.location.href = "/login";
            return;
        }

        try {
            const response = await fetch("http://localhost:3000/auth/profile", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.status === 401) {
                localStorage.removeItem("access_token");
                window.location.href = "/login";
                return;
            }

            if (!response.ok) {
                error = `Je profiel kon niet worden opgehaald (${response.status}).`;
                return;
            }

            profile = await response.json();

            try {
                const idsResponse = await fetch(
                    "http://localhost:3000/reading-list/ids",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                if (idsResponse.ok) {
                    const readingListIds = await idsResponse.json();

                    if (Array.isArray(readingListIds)) {
                        bookCount = readingListIds.length;
                    }
                }
            } catch (err) {
                console.error("Leeslijst-ID's ophalen mislukt:", err);
            }
        } catch (err) {
            console.error("Profiel ophalen mislukt:", err);
            error = "Kan geen verbinding maken met de server.";
        } finally {
            loading = false;
        }
    });

    function logout() {
        localStorage.removeItem("access_token");
        window.location.href = "/";
    }
</script>

<svelte:head>
    <title>Profiel | Leesapp</title>
</svelte:head>

<div class="min-h-[calc(100vh-4rem)] w-full bg-slate-50 px-4 py-10">
    <div class="mx-auto max-w-2xl">
        {#if loading}
            <p class="py-16 text-center text-sm text-slate-500">
                Profiel laden...
            </p>
        {:else if error}
            <div class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
            </div>
        {:else if profile && role}
            <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div class="h-32 bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600"></div>

                <div class="px-6 pb-6 sm:px-8">
                    <div class="-mt-12 flex items-end justify-between">
                        <div class="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-indigo-100 text-4xl font-bold text-indigo-700 shadow-md">
                            {initial}
                        </div>

                        <span class={`mb-2 rounded-full px-3 py-1 text-xs font-semibold ${role.badge}`}>
                            {role.emoji} {role.label}
                        </span>
                    </div>

                    <h1 class="mt-4 text-2xl font-bold text-slate-900">
                        {profile.name}
                    </h1>

                    <p class="text-sm text-slate-500">
                        {profile.email}
                    </p>

                    <p class="mt-3 text-sm text-slate-600">
                        {role.text}
                    </p>

                    <div class="mt-6 grid grid-cols-2 gap-3">
                        <a
                            href="/leeslijst"
                            class="rounded-xl bg-slate-50 p-4 transition hover:bg-indigo-50"
                        >
                            <p class="text-2xl font-bold text-slate-900">
                                {bookCount ?? "–"}
                            </p>

                            <p class="text-xs text-slate-500">
                                {bookCount === 1 ? "boek" : "boeken"} op mijn leeslijst
                            </p>
                        </a>

                        <div class="rounded-xl bg-slate-50 p-4">
                            <p class="text-2xl font-bold text-slate-900">
                                {role.label}
                            </p>

                            <p class="text-xs text-slate-500">
                                mijn rol
                            </p>
                        </div>
                    </div>

                    <dl class="mt-6 divide-y divide-slate-100 rounded-xl border border-slate-100">
                        <div class="flex items-center justify-between gap-4 px-4 py-3">
                            <dt class="text-sm text-slate-500">Naam</dt>
                            <dd class="truncate text-sm font-medium text-slate-900">
                                {profile.name}
                            </dd>
                        </div>

                        <div class="flex items-center justify-between gap-4 px-4 py-3">
                            <dt class="text-sm text-slate-500">E-mailadres</dt>
                            <dd class="truncate text-sm font-medium text-slate-900">
                                {profile.email}
                            </dd>
                        </div>

                        <div class="flex items-center justify-between gap-4 px-4 py-3">
                            <dt class="text-sm text-slate-500">Rol</dt>
                            <dd class="text-sm font-medium text-slate-900">
                                {role.label}
                            </dd>
                        </div>

                        {#if memberSince}
                            <div class="flex items-center justify-between gap-4 px-4 py-3">
                                <dt class="text-sm text-slate-500">Lid sinds</dt>
                                <dd class="text-sm font-medium text-slate-900">
                                    {memberSince}
                                </dd>
                            </div>
                        {/if}
                    </dl>

                    <div class="mt-6 flex flex-wrap gap-3">
                        <a
                            href="/leeslijst"
                            class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
                        >
                            Naar mijn leeslijst
                        </a>

                        {#if profile.role === "DOCENT"}
                            <a
                                href="/leeslijsten"
                                class="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                                Leeslijsten van studenten
                            </a>
                        {/if}

                        <button
                            type="button"
                            onclick={logout}
                            class="rounded-lg px-4 py-2 text-sm font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600 sm:ml-auto"
                        >
                            Uitloggen
                        </button>
                    </div>
                </div>
            </div>

            {#if profile.role === "STUDENT" || profile.role === "CURSIST"}
                <div class="mt-6">
                    <TeacherLink />
                </div>
            {/if}
        {/if}
    </div>
</div>