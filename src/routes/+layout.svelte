<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/state";
    import "../app.css";

    let { children } = $props();

    // Let op: in Svelte 5 moeten variabelen die de pagina bijwerken $state zijn
    let isLoggedIn = $state(false);
    let checked = $state(false); // true zodra de inlogcontrole klaar is
    let mobileMenuOpen = $state(false);

    type User = {
        id?: string;
        email?: string;
        name?: string;
        role?: string;
    };

    let user = $state<User | null>(null);

    // Eerste letter van de naam (valt terug op het e-mailadres)
    let initial = $derived(
        (user?.name?.trim() || user?.email || "?").charAt(0).toUpperCase()
    );

    onMount(async () => {
        await checkAuth();
    });

    async function checkAuth() {
        const token = localStorage.getItem("access_token");

        // Geen token = gewoon uitgelogd
        if (!token) {
            isLoggedIn = false;
            user = null;
            checked = true;
            return;
        }

        try {
            const response = await fetch("http://localhost:3000/auth/profile", {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.status === 401) {
                // Token is ongeldig of verlopen
                localStorage.removeItem("access_token");
                isLoggedIn = false;
                user = null;
                return;
            }

            if (!response.ok) {
                // Andere fout (bijv. 404 of 500): token bewaren, niet uitloggen
                console.error("Profiel ophalen mislukt:", response.status);
                isLoggedIn = false;
                return;
            }

            user = await response.json();
            isLoggedIn = true;
        } catch (error) {
            console.error("Auth controle mislukt:", error);

            // Bij een netwerk/CORS-fout verwijderen we de token NIET
            isLoggedIn = false;
        } finally {
            checked = true;
        }
    }

    function logout() {
        localStorage.removeItem("access_token");

        isLoggedIn = false;
        user = null;
        mobileMenuOpen = false;

        window.location.href = "/";
    }

    function closeMobileMenu() {
        mobileMenuOpen = false;
    }
</script>

<a class="skip-link" href="#main-content">Ga naar hoofdinhoud</a>

{#if !["/login", "/register"].includes(page.url.pathname)}
    <header class="border-b border-slate-200 bg-white">
        <div class="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 md:flex-nowrap md:py-0">

        <!-- Logo -->
        <a
            href="/"
            class="flex items-center gap-3"
        >
            <div
                aria-hidden="true"
                class="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-xl text-white shadow-sm"
            >
                📚
            </div>

            <div>
                <span class="text-lg font-bold tracking-tight text-slate-900">
                    LeesApp
                </span>

                <p class="text-xs text-slate-500">
                    Ontdek jouw volgende boek
                </p>
            </div>
        </a>

        <!-- Navigatie -->
        <nav aria-label="Hoofdnavigatie" class="hidden items-center gap-1 md:flex">

            <a
                href="/"
                class="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
                Home
            </a>

            {#if user?.role !== "DOCENT"}
                <a
                    href="/aanbevelingen"
                    class="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                >
                    Aanbevelingen
                </a>
            {/if}

            <a
                href="/boeken"
                class="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
                Boeken
            </a>

            {#if user?.role !== "DOCENT"}
                <a
                    href="/leeslijst"
                    class="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                >
                    Leeslijst
                </a>
            {/if}

            {#if user?.role === "DOCENT"}
                <a
                    href="/mijnstudenten"
                    class="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                >
                    Mijn studenten
                </a>
            {/if}

            <!-- Alleen zichtbaar voor docenten (de server controleert dit ook) -->
            {#if user?.role === "DOCENT"}
                <a
                    href="/leeslijsten"
                    class="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                >
                    Leeslijsten
                </a>
            {/if}

        </nav>

        <button
            type="button"
            aria-label={mobileMenuOpen ? "Menu sluiten" : "Menu openen"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
            class="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-xl text-slate-700 hover:bg-slate-100 md:hidden"
        >
            {mobileMenuOpen ? "×" : "☰"}
        </button>

        <!-- Account -->
        <div class="flex items-center gap-1 sm:gap-3">

            {#if checked}

                {#if isLoggedIn}

                    <!-- Profiel -->
                    <a
                        href="/profiel"
                        class="flex items-center gap-2 rounded-lg px-2 py-2 transition hover:bg-slate-100 sm:px-3"
                        onclick={closeMobileMenu}
                    >
                        <div
                            aria-hidden="true"
                            class="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700"
                        >
                            {initial}
                        </div>

                        <span class="text-sm font-medium text-slate-700">
                            Profiel
                        </span>
                    </a>

                    <!-- Uitloggen -->
                    <button
                        type="button"
                        onclick={logout}
                        class="rounded-lg px-2 py-2 text-sm font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600 sm:px-3"
                    >
                        Uitloggen
                    </button>

                {:else}

                    <!-- Inloggen -->
                    <a
                        href="/login"
                        class="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 sm:px-4"
                        onclick={closeMobileMenu}
                    >
                        Inloggen
                    </a>

                {/if}

            {/if}

        </div>
        </div>

        {#if mobileMenuOpen}
            <nav id="mobile-navigation" aria-label="Mobiele navigatie" class="border-t border-slate-100 px-4 pb-4 pt-3 md:hidden sm:px-6">
                <div class="grid gap-1">
                    <a href="/" onclick={closeMobileMenu} class="rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100">Home</a>
                    {#if user?.role !== "DOCENT"}
                        <a href="/aanbevelingen" onclick={closeMobileMenu} class="rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100">Aanbevelingen</a>
                    {/if}
                    <a href="/boeken" onclick={closeMobileMenu} class="rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100">Boeken</a>
                    {#if user?.role !== "DOCENT"}
                        <a href="/leeslijst" onclick={closeMobileMenu} class="rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100">Leeslijst</a>
                    {/if}
                    {#if user?.role === "DOCENT"}
                        <a href="/mijnstudenten" onclick={closeMobileMenu} class="rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100">Mijn studenten</a>
                        <a href="/leeslijsten" onclick={closeMobileMenu} class="rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100">Leeslijsten</a>
                    {/if}
                </div>
            </nav>
        {/if}
    </header>
{/if}

<main id="main-content">
    {@render children()}
</main>
