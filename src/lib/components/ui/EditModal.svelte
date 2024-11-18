<script>
	export let show = false;
	export let title = '';
	export let content = '';
	export let scheduledTime = '';
	export let isScheduledReport = false;
	export let onSave = () => {};
	export let onCancel = () => {};
	export let placeholder = '';

	let updatedContent = '';
	let updatedScheduledTime = '';

	$: if (show) {
		updatedContent = content;
		updatedScheduledTime = isScheduledReport ? scheduledTime : '';
	}

	function handleSubmit(event) {
		event.preventDefault();
		if (event.target.checkValidity()) {
			onSave(updatedContent, updatedScheduledTime);
		} else {
			event.target.reportValidity();
		}
	}
</script>

{#if show}
	<div
		class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
		role="dialog"
		aria-modal="true"
	>
		<div class="bg-white rounded-lg overflow-hidden shadow-xl max-w-md w-full">
			<form on:submit={handleSubmit} class="p-6">
				<h2 class="text-2xl font-semibold mb-4 text-center">{title}</h2>

				<!-- Rapportens Indhold -->
				<textarea
					class="w-full h-40 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
					{placeholder}
					bind:value={updatedContent}
					required
				></textarea>

				{#if isScheduledReport}
					<!-- Planlagt Dato og Tid -->
					<label for="scheduledTime" class="block mt-4 text-gray-700 font-semibold mb-2">
						Planlagt dato og tid:
					</label>
					<input
						id="scheduledTime"
						type="datetime-local"
						bind:value={updatedScheduledTime}
						class="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
						required
					/>
				{/if}

				<div class="flex justify-end p-4 space-x-4">
					<button
						type="button"
						class="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
						on:click={onCancel}
					>
						Annuller
					</button>
					<button type="submit" class="px-4 py-2 bg-HeaderBg text-white rounded hover:bg-toggleBg">
						Gem
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
