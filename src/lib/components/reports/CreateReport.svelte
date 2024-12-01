<script>
	import { page } from '$app/stores';
	import socket from '$lib/socket';
	import { faPaperclip, faArrowRight } from '@fortawesome/free-solid-svg-icons';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import ErrorModal from '../ui/ErrorModal.svelte';
	import { writable } from 'svelte/store';
	import { handleFileChange, handlePaste, addFiles, removeImage } from '$lib/utils/fileUtils.js';

	export let reportType;
	export let reportTitle = 'Samlet rapport (sidste 24 timer)';
	let content = '';
	let images = writable([]);

	// ErrorModal state
	let errorMessage = '';
	let showErrorModal = false;

	$: user = $page.data.user;

	function setErrorMessage(message) {
		errorMessage = '';
		showErrorModal = false;
		errorMessage = message;
		showErrorModal = true;
	}

	function handleCreateReport() {
		const newReport = {
			content: content.trim(),
			user_id: user.id,
			report_type_id: reportType,
			images: $images
		};

		socket.emit('new report', newReport);
		content = '';
		images.set([]);
	}
</script>

<div
	class="max-w-3xl mx-auto"
	on:paste={(e) => handlePaste(e, (files) => addFiles(files, images, setErrorMessage))}
>
	<!-- ErrorModal -->
	<ErrorModal message={errorMessage} show={showErrorModal} />

	<h2 class="text-4xl font-semibold text-center my-6">{reportTitle}</h2>

	<form on:submit|preventDefault={handleCreateReport} class="relative">
		<div class="relative">
			<label for="content" class="sr-only">Tilføj til rapporten</label>
			<textarea
				id="content"
				bind:value={content}
				placeholder="Tilføj til rapporten her..."
				class="w-full h-28 p-4 bg-[#ECE0D1] rounded-lg placeholder-gray-600 text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 pr-14"
				required
			></textarea>
			<div class="absolute right-4 bottom-4 flex gap-2 items-center">
				<label for="file-input" class="cursor-pointer">
					<FontAwesomeIcon icon={faPaperclip} class="text-gray-600 hover:text-gray-800 w-5 h-5" />
					<input
						type="file"
						id="file-input"
						on:change={(e) =>
							handleFileChange(e, (files) => addFiles(files, images, setErrorMessage))}
						accept="image/*"
						multiple
						class="hidden"
					/>
				</label>
				<button
					type="submit"
					class="bg-HeaderBg text-white py-2 px-5 rounded-full hover:bg-toggleBg focus:outline-none focus:ring-2 focus:ring-red-400"
				>
					<FontAwesomeIcon icon={faArrowRight} class="w-5 h-5" />
				</button>
			</div>
		</div>

		{#if $images.length > 0}
			<div class="mt-4 grid grid-cols-3 gap-4">
				{#each $images as image, index}
					<div class="relative">
						<img
							src={`data:image/*;base64,${image}`}
							alt={`Billede ${index + 1}`}
							class="w-full h-auto rounded-lg"
						/>
						<button
							type="button"
							class="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
							on:click={() => removeImage(index, images)}
							title="Fjern billede"
						>
							&times;
						</button>
					</div>
				{/each}
			</div>
		{/if}
	</form>
</div>
