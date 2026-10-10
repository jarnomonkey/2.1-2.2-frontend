<script lang="ts">
    import { onMount } from "svelte";
    import ReadingList from "$lib/components/ReadingList.svelte";

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

            if (response.ok) {
                const profile = await response.json();

                if (profile.role === "DOCENT") {
                    window.location.href = "/leeslijsten";
                }
            }
        } catch (error) {
            console.error("Toegangscontrole mislukt:", error);
        }
    });
</script>

<svelte:head>
    <title>Leeslijst | Leesapp</title>
</svelte:head>

<div class="min-h-[calc(100vh-4rem)] w-full bg-slate-50 p-6">
    <div class="[&>div]:!max-w-none">
        <h1 class="sr-only">Mijn leeslijst</h1>
        <ReadingList />
    </div>
</div>
