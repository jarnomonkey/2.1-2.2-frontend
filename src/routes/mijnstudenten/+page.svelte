<script lang="ts">
	import { onMount } from "svelte";
	import LoadingSkeleton from "$lib/components/LoadingSkeleton.svelte";

	const API = "http://localhost:3000";

	type Student = {
		id: string;
		name: string;
		email: string;
		role: "STUDENT" | "CURSIST";
		readingList?: { bookId: string }[];
	};

	let students = $state<Student[]>([]);
	let loading = $state(true);
	let error = $state("");
	let forbidden = $state(false);
	let search = $state("");

	let filteredStudents = $derived(
		students.filter((student) => {
			const query = search.trim().toLowerCase();

			return (
				!query ||
				student.name.toLowerCase().includes(query) ||
				student.email.toLowerCase().includes(query)
			);
		})
	);

	async function loadStudents() {
		const token = localStorage.getItem("access_token");

		if (!token) {
			window.location.href = "/login";
			return;
		}

		try {
			const response = await fetch(`${API}/reading-list/all`, {
				headers: { Authorization: `Bearer ${token}` }
			});

			if (response.status === 401) {
				localStorage.removeItem("access_token");
				window.location.href = "/login";
				return;
			}

			if (response.status === 403) {
				forbidden = true;
				return;
			}

			if (!response.ok) {
				error = `Studenten konden niet worden opgehaald (${response.status}).`;
				return;
			}

			const data = await response.json();
			students = Array.isArray(data) ? data : data.students ?? [];
		} catch (err) {
			console.error("Studenten ophalen mislukt:", err);
			error = "Kan geen verbinding maken met de server.";
		} finally {
			loading = false;
		}
	}

	onMount(loadStudents);
</script>

<svelte:head>
	<title>Mijn studenten | Leesapp</title>
</svelte:head>

<div class="min-h-[calc(100vh-4rem)] w-full bg-slate-50 px-4 py-10 sm:px-6">
	<div class="mx-auto max-w-5xl">
		<div class="mb-8 flex flex-wrap items-end justify-between gap-4">
			<div>
				<h1 class="text-3xl font-bold text-slate-900">Mijn studenten</h1>
				<p class="mt-2 text-slate-600">
					Bekijk de studenten en cursisten die aan jou gekoppeld zijn.
				</p>
			</div>

			{#if students.length > 0}
				<label for="student-search" class="sr-only">Zoek studenten</label>
				<input
					id="student-search"
					type="search"
					bind:value={search}
					placeholder="Zoek op naam of e-mail"
					class="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 sm:w-72"
				/>
			{/if}
		</div>

		{#if loading}
			<LoadingSkeleton variant="teacher" />
		{:else if forbidden}
			<div role="alert" class="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
				<h2 class="text-lg font-semibold text-slate-900">Geen toegang</h2>
				<p class="mt-1 text-sm text-slate-500">Deze pagina is alleen voor docenten.</p>
				<a href="/" class="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white">
					Naar de startpagina
				</a>
			</div>
		{:else if error}
			<div role="alert" class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
				{error}
			</div>
		{:else if students.length === 0}
			<p class="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500">
				Er zijn nog geen gekoppelde studenten of cursisten.
			</p>
		{:else if filteredStudents.length === 0}
			<p class="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500">
				Niemand gevonden voor "{search}".
			</p>
		{:else}
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each filteredStudents as student (student.id)}
					<article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
						<div class="flex items-center gap-3">
							<div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700">
								{student.name.trim().charAt(0).toUpperCase() || "?"}
							</div>
							<div class="min-w-0">
								<h2 class="truncate font-semibold text-slate-900">{student.name}</h2>
								<p class="truncate text-sm text-slate-500">{student.email}</p>
							</div>
						</div>

						<div class="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
							<span class="text-slate-500">Leeslijst</span>
							<span class="font-semibold text-slate-900">
								{student.readingList?.length ?? 0} boeken
							</span>
						</div>
					</article>
				{/each}
			</div>

			<a href="/leeslijsten" class="mt-8 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
				Leeslijsten beheren
			</a>
		{/if}
	</div>
</div>