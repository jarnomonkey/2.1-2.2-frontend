<script lang="ts">
    import Button from "$lib/components/Button.svelte";
    import FormField from "$lib/components/FormField.svelte";
    import SelectField from "$lib/components/SelectField.svelte";

    let name = $state("");
    let email = $state("");
    let password = $state("");
    let confirmPassword = $state("");
    let role = $state("");

    let error = $state("");
    let loading = $state(false);

    const roleOptions = [
        { value: "", label: "Kies een rol" },
        { value: "STUDENT", label: "Student" },
        { value: "CURSIST", label: "Cursist" },
        { value: "DOCENT", label: "Docent" }
    ];

    async function register() {
        error = "";

        if (password.length < 8) {
            error = "Het wachtwoord moet minstens 8 tekens hebben.";
            return;
        }

        if (password !== confirmPassword) {
            error = "De wachtwoorden komen niet overeen.";
            return;
        }

        loading = true;

        try {
            const response = await fetch("http://localhost:3000/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name,
                    email,
                    password,
                    role
                })
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                if (response.status === 409) {
                    error = "Dit e-mailadres is al in gebruik.";
                } else if (response.status === 400) {
                    error = Array.isArray(data.message)
                        ? data.message.join(" ")
                        : data.message || "Controleer je gegevens.";
                } else {
                    error =
                        data.message ||
                        "Er is iets misgegaan tijdens het registreren.";
                }

                return;
            }

            // Account aangemaakt: door naar inloggen
            window.location.href = "/login";
        } catch (err) {
            console.error("Register error:", err);

            error = "Kan geen verbinding maken met de server.";
        } finally {
            loading = false;
        }
    }
</script>

<svelte:head>
    <title>Registreren | Leesapp</title>
</svelte:head>

<div class="flex h-dvh items-center justify-center overflow-hidden bg-gray-50 px-4">
    <div class="w-full max-w-md">

        <!-- Logo / titel -->
        <div class="mb-4 text-center">
            <h1 class="text-2xl font-bold text-gray-900">
                Account aanmaken
            </h1>

            <p class="mt-2 text-gray-500">
                Maak een account aan voor de Leesapp.
            </p>
        </div>

        <!-- Register kaart -->
        <div class="rounded-2xl bg-white p-5 shadow-xl ring-1 ring-gray-100">
            <form
                onsubmit={(event) => {
                    event.preventDefault();
                    register();
                }}
                class="space-y-3"
            >

                <FormField
                    id="name"
                    label="Naam"
                    bind:value={name}
                    placeholder="Jouw naam"
                    autocomplete="name"
                    required
                    disabled={loading}
                />

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
                    autocomplete="new-password"
                    minlength={8}
                    hint="Minstens 8 tekens."
                    required
                    disabled={loading}
                />

                <FormField
                    id="confirmPassword"
                    label="Wachtwoord bevestigen"
                    type="password"
                    bind:value={confirmPassword}
                    placeholder="••••••••"
                    autocomplete="new-password"
                    required
                    disabled={loading}
                />

                <SelectField
                    id="role"
                    label="Rol"
                    bind:value={role}
                    options={roleOptions}
                    required
                    disabled={loading}
                />

                <!-- Error -->
                {#if error}
                    <div class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                        {error}
                    </div>
                {/if}

                <!-- Registreren -->
                <Button
                    type="submit"
                    disabled={loading}
                    fullWidth
                    class="py-2.5"
                >
                    {#if loading}
                        Account aanmaken...
                    {:else}
                        Account aanmaken
                    {/if}
                </Button>
            </form>

            <!-- Login -->
            <div class="mt-3 border-t border-gray-100 pt-3 text-center">
                <p class="text-sm text-gray-500">
                    Heb je al een account?
                    <a
                        href="/login"
                        class="font-semibold text-black underline underline-offset-4 hover:text-gray-600"
                    >
                        Inloggen
                    </a>
                </p>
            </div>
        </div>
    </div>
</div>
