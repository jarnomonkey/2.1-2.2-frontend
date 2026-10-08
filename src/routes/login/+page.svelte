<script lang="ts">
    import Button from "$lib/components/Button.svelte";
    import FormField from "$lib/components/FormField.svelte";

    let email = $state("");
    let password = $state("");

    let error = $state("");
    let loading = $state(false);

    async function login() {
        error = "";
        loading = true;

        try {
            const response = await fetch("http://localhost:3000/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    error = "E-mailadres of wachtwoord is onjuist.";
                } else {
                    error = data.message || "Er is iets misgegaan tijdens het inloggen.";
                }

                return;
            }

            // JWT-token opslaan
            localStorage.setItem("access_token", data.access_token);

            // Doorgaan naar de boekenpagina
            window.location.href = "/";

        } catch (err) {
            console.error("Login error:", err);

            error = "Kan geen verbinding maken met de server.";
        } finally {
            loading = false;
        }
    }
</script>

<svelte:head>
    <title>Inloggen | Leesapp</title>
</svelte:head>

<div class="flex h-dvh items-center justify-center overflow-hidden bg-gray-50 px-4">
    <div class="w-full max-w-md">

        <!-- Logo / titel -->
        <div class="mb-4 text-center">
            <h1 class="text-2xl font-bold text-gray-900">
                Welkom terug
            </h1>

            <p class="mt-2 text-gray-500">
                Log in om verder te gaan met je boeken.
            </p>
        </div>

        <!-- Login kaart -->
        <div class="rounded-2xl bg-white p-6 shadow-xl ring-1 ring-gray-100">

            <form
                onsubmit={(event) => {
                    event.preventDefault();
                    login();
                }}
                class="space-y-4"
            >

                <FormField
                    id="email"
                    label="E-mailadres"
                    type="email"
                    bind:value={email}
                    placeholder="jouw@email.nl"
                    autocomplete="email"
                    required
                    disabled={loading}
                />

                <FormField
                    id="password"
                    label="Wachtwoord"
                    type="password"
                    bind:value={password}
                    placeholder="••••••••"
                    autocomplete="current-password"
                    required
                    disabled={loading}
                />

                <!-- Foutmelding -->
                {#if error}
                    <div
                        class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600"
                    >
                        {error}
                    </div>
                {/if}

                <!-- Inloggen -->
                <Button
                    type="submit"
                    disabled={loading}
                    fullWidth
                    class="py-3.5"
                >
                    {#if loading}
                        Inloggen...
                    {:else}
                        Inloggen
                    {/if}
                </Button>

            </form>

            <!-- Register -->
            <div class="mt-4 border-t border-gray-100 pt-4 text-center">
                <p class="text-sm text-gray-500">
                    Nog geen account?
                    <a
                        href="/register"
                        class="font-semibold text-black underline underline-offset-4 hover:text-gray-600"
                    >
                        Account aanmaken
                    </a>
                </p>
            </div>
        </div>
    </div>
</div>