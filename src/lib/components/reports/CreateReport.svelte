<script>
	import { page } from '$app/stores';
	import socket from '$lib/socket';

	export let reportType;
	export let reportTitle = 'Samlet rapport (sidste 24 timer)';
	let content = '';
	let images = [];

	$: user = $page.data.user;

	function handleFileChange(event) {
		const files = event.target.files;
		if (files.length > 0) {
			addFiles(files);
		}
	}

	async function handlePaste(event) {
		const clipboardItems = event.clipboardData.items;

		for (const item of clipboardItems) {
			if (item.type.startsWith('image/')) {
				const file = item.getAsFile();
				if (file) {
					addFiles([file]);
				}
			}
		}
	}

	async function addFiles(files) {
		const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
		const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
		const filePromises = [];

		for (let i = 0; i < files.length; i++) {
			const file = files[i];

			// Valider filstørrelse
			if (file.size > maxSizeInBytes) {
				alert(`Billedet ${file.name} er for stort. Maksimalt tilladt størrelse er 10MB.`);
				continue;
			}

			// Valider filtype
			if (!allowedTypes.includes(file.type)) {
				alert(`Kun JPG, PNG og GIF billeder er tilladt. Filen ${file.name} er ugyldig.`);
				continue;
			}

			const filePromise = new Promise((resolve, reject) => {
				const reader = new FileReader();
				reader.onload = function (e) {
					const base64Data = e.target.result.split(',')[1];
					resolve(base64Data);
				};
				reader.onerror = function () {
					reject(new Error(`Fejl ved læsning af fil: ${file.name}`));
				};
				reader.readAsDataURL(file);
			});

			filePromises.push(filePromise);
		}

		try {
			const newImages = await Promise.all(filePromises);
			images = [...images, ...newImages];
		} catch (error) {
			console.error(error);
			alert('Der opstod en fejl under upload af billeder.');
		}
	}

	function removeImage(index) {
		images.splice(index, 1);
		images = [...images];
	}

	function handleCreateReport() {
		const newReport = {
			content: content.trim(),
			user_id: user.id,
			report_type_id: reportType,
			images
		};

		socket.emit('new report', newReport);
		content = '';
		images = [];
	}
</script>

<div class="max-w-3xl mx-auto" on:paste={handlePaste}>
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
		<div class="mt-4">
			<label for="image">Tilføj billeder (valgfrit)</label>
			<input
				type="file"
				id="image"
				on:change={handleFileChange}
				accept="image/*"
				multiple
				class="w-full p-2 border border-gray-300 rounded-lg"
			/>
		</div>
		{#if images.length > 0}
			<div class="mt-4 grid grid-cols-3 gap-4">
				{#each images as image, index}
					<div class="relative">
						<img
							src={`data:image/*;base64,${image}`}
							alt={`Billede ${index + 1}`}
							class="w-full h-auto rounded-lg"
						/>
						<button
							type="button"
							class="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
							on:click={() => removeImage(index)}
							title="Fjern billede"
						>
							&times;
						</button>
					</div>
				{/each}
			</div>
		{/if}
		<div class="flex justify-end mt-4">
			<button
				type="submit"
				class="px-6 py-2 bg-[#D14343] text-white font-semibold rounded-lg hover:bg-[#B23030] focus:outline-none focus:ring-2 focus:ring-red-400"
			>
				Opret Rapport
			</button>
		</div>
	</form>
</div>
