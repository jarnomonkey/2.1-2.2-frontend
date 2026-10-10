<script lang="ts">
	import { onMount } from "svelte";
	import { page } from "$app/state";
	import LoadingSkeleton from "$lib/components/LoadingSkeleton.svelte";

	type Book = {
		_id: string;
		title: string;
		author?: string;
		description?: string;
		coverUrl?: string;
		genre?: string | string[];
		readingLevel?: string | string[];
		tags?: string | string[];
	};

	const API = "http://localhost:3000";
	let book = $state<Book | null>(null);
	let loading = $state(true);
	let notFound = $state(false);
	let error = $state("");

	function values(value: string | string[] | undefined): string[] {
		return Array.isArray(value) ? value : value ? [value] : [];
	}

	async function loadBook() {
		try {
			const response = await fetch(`${API}/books`);

			if (!response.ok) {
				error = `Het boek kon niet worden opgehaald (${response.status}).`;
				return;
			}

			const data = await response.json();
			const books: Book[] = Array.isArray(data) ? data : data.books ?? [];
			book = books.find((item) => item._id === page.params.id) ?? null;
			notFound = !book;
		} catch (err) {
			console.error("Boek ophalen mislukt:", err);
			error = "Kan geen verbinding maken met de server.";
		} finally {
			loading = false;
		}
	}

	onMount(loadBook);
</script>

<svelte:head>
	<title>{book ? `${book.title} | Leesapp` : "Boek | Leesapp"}</title>
</svelte:head>

<div class="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-10 sm:px-6">
	<div class="mx-auto max-w-4xl">
		<a href="/boeken" class="text-sm font-medium text-indigo-700 hover:underline">
			Terug naar boeken
		</a>

		{#if loading}
			<div class="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
				<LoadingSkeleton variant="profile" />
			</div>
		{:else if notFound}
			<div class="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
				<h1 class="text-2xl font-bold text-slate-900">Boek niet gevonden</h1>
				<p class="mt-2 text-slate-500">Dit boek bestaat niet of is niet meer beschikbaar.</p>
			</div>
		{:else if error}
			<div role="alert" class="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
				{error}
			</div>
		{:else if book}
			<article class="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
				<div class="grid gap-8 p-6 sm:p-8 md:grid-cols-[16rem_minmax(0,1fr)]">
					{#if book.coverUrl}
						<img src={book.coverUrl} alt={`Omslag van ${book.title}`} class="aspect-[3/4] w-full rounded-xl object-cover" />
					{:else}
						<div class="flex aspect-[3/4] items-center justify-center rounded-xl bg-indigo-50 text-center text-sm font-medium text-indigo-700">
							Geen omslag beschikbaar
						</div>
					{/if}

					<div>
						<p class="text-sm font-medium text-indigo-700">Boekdetails</p>
						<h1 class="mt-2 text-3xl font-bold text-slate-900">{book.title}</h1>
						{#if book.author}
							<p class="mt-2 text-lg text-slate-600">{book.author}</p>
						{/if}

						{#if book.description}
							<p class="mt-6 whitespace-pre-line leading-7 text-slate-700">{book.description}</p>
						{/if}

						<div class="mt-6 flex flex-wrap gap-2">
							{#each [...values(book.readingLevel), ...values(book.genre), ...values(book.tags)] as label}
								<span class="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">{label}</span>
							{/each}
						</div>
					</div>
				</div>
			</article>
		{/if}
	</div>
</div>
