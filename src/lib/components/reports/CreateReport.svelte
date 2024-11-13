<script>
	import { page } from '$app/stores';
	import socket from '$lib/socket';

	export let reportType; // Denne modtager rapporttypen som en prop
	export let reportTitle = 'Samlet rapport'; // Default titel
	let content = '';

	$: user = $page.data.user;

	function handleCreateReport() {
		const newReport = {
			content: content.trim(),
			user_id: user.id,
			report_type_id: reportType
		};

		socket.emit('new report', newReport);
		content = '';
	}
</script>

<div class="max-w-lg mx-auto p-4">
	<h2 class="text-4xl font-semibold text-center my-6">{reportTitle}</h2>

	<form on:submit|preventDefault={handleCreateReport}>
		<div>
			<label for="content" class="sr-only">Tilføj til rapporten</label>
			<textarea
				id="content"
				bind:value={content}
				placeholder="Tilføj til rapporten her..."
				class="w-full h-28 p-4 bg-[#ECE0D1] rounded-lg placeholder-gray-600 text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400"
				required
			></textarea>
		</div>
		<div class="flex justify-end">
			<button
				type="submit"
				class="px-6 py-2 bg-[#D14343] text-white font-semibold rounded-lg hover:bg-[#B23030] focus:outline-none focus:ring-2 focus:ring-red-400"
			>
				Opret Rapport
			</button>
		</div>
	</form>
</div>
