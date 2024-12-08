<script>
	export let show = false;
	export let imageSrc = '';
	export let onClose = () => {}; // callback function for closing the modal
</script>

{#if show}
	<div
		class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
		role="dialog"
		aria-modal="true"
	>
		<div class="relative bg-white rounded-lg shadow-xl max-w-4xl w-full">
			<!-- Luk knap -->
			<button
				class="absolute top-4 right-4 text-white bg-red-600 hover:bg-red-700 rounded-full p-4 focus:outline-none focus:ring-2 focus:ring-red-400"
				on:click={onClose}
				title="Luk"
				aria-label="Luk billedet"
			>
				&times;
			</button>
			<!-- Billede -->
			<img src={imageSrc} alt="Stort billede" class="w-full h-auto rounded-lg max-h-[80vh] object-contain" />
		</div>
	</div>
{/if}

