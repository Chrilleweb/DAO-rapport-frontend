<script>
	import ConfirmationModal from './ConfirmationModal.svelte';
	import ErrorModal from './ErrorModal.svelte';
	export let show = false;
	export let title = '';
	export let content = '';
	export let scheduledTime = '';
	export let isScheduledReport = false;
	export let onSave = () => {};
	export let onCancel = () => {};
	export let placeholder = '';
	export let reportTypeOptions = [];
	export let selectedReportTypeId = null;
	export let isOwner = false;
	export let images = [];
	export let editingType = '';
	export let onDelete = () => {};

	let updatedContent = '';
	let updatedScheduledTime = '';
	let updatedReportTypeId = null;

	let imagesToAdd = [];
	let imagesToRemove = [];
	let existingImages = [];

	// ErrorModal state
	let errorMessage = '';
	let showErrorModal = false;

	let showConfirmDelete = false;

	let initialized = false;

	$: if (show && !initialized) {
		updatedContent = content;
		updatedScheduledTime = isScheduledReport ? scheduledTime : '';
		updatedReportTypeId = selectedReportTypeId;
		existingImages = images.slice(); // Lav en kopi
		imagesToAdd = [];
		imagesToRemove = [];
		initialized = true;
	}

	$: if (!show && initialized) {
		initialized = false;
	}

	function handleSubmit(event) {
		event.preventDefault();
		if (event.target.checkValidity()) {
			const updatedData = {
				updatedContent,
				updatedScheduledTime: isScheduledReport ? updatedScheduledTime : null,
				updatedReportTypeId,
				imagesToAdd,
				imagesToRemove
			};
			onSave(updatedData);
		} else {
			event.target.reportValidity();
		}
	}

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
					await addFiles([file]);
				}
			}
		}
	}

	async function addFiles(files) {
		showErrorModal = false;
		const maxSizeInBytes = 500 * 1024; // 500 KB
		const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
		const filePromises = [];

		for (let i = 0; i < files.length; i++) {
			const file = files[i];

			// Valider filstørrelse
			if (file.size > maxSizeInBytes) {
				errorMessage = `Filen er for stor. Maksimal filstørrelse er 500 KB.`;
				showErrorModal = true;
				continue;
			}

			// Valider filtype
			if (!allowedTypes.includes(file.type)) {
				errorMessage = `Kun JPG, PNG og GIF billeder er tilladt. Filen ${file.name} er ugyldig.`;
				showErrorModal = true;
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
			imagesToAdd = [...imagesToAdd, ...newImages];
		} catch (error) {
			console.error(error);
			alert('Der opstod en fejl under upload af billeder.');
		}
	}

	function removeExistingImage(index) {
		const imageToRemove = existingImages.splice(index, 1)[0];
		imagesToRemove.push(imageToRemove.id);
		existingImages = existingImages.slice(); // Reassign for at trigge reaktivitet
	}

	function removeNewImage(index) {
		imagesToAdd.splice(index, 1);
		imagesToAdd = imagesToAdd.slice(); // Reassign for at trigge reaktivitet
	}

	function handleDelete() {
		showConfirmDelete = true;
	}

	function confirmDelete() {
		showConfirmDelete = false;
		onDelete();
	}

	function cancelDelete() {
		showConfirmDelete = false;
	}

	function getCESTNow() {
		const now = new Date();
		const timeZone = 'Europe/Copenhagen';

		// Brug Intl.DateTimeFormat til at få tiden i dansk tidszone
		const formatter = new Intl.DateTimeFormat('en-CA', {
			timeZone,
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		});

		const parts = formatter.formatToParts(now);
		const datePart = `${parts.find((part) => part.type === 'year').value}-${parts.find((part) => part.type === 'month').value}-${parts.find((part) => part.type === 'day').value}`;
		const timePart = `${parts.find((part) => part.type === 'hour').value}:${parts.find((part) => part.type === 'minute').value}`;

		return `${datePart}T${timePart}`;
	}
</script>

{#if show}
	<div
		class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-40"
		role="dialog"
		aria-modal="true"
	>
	<!-- ErrorModal -->
	<ErrorModal message={errorMessage} show={showErrorModal} />

		<div class="bg-white rounded-lg overflow-hidden shadow-xl max-w-md w-full">
			<form on:submit={handleSubmit} class="p-6">
				<h2 class="text-2xl font-semibold mb-4 text-center">{title}</h2>

				{#if isOwner}
					<!-- Indhold -->
					<textarea
						class="w-full h-40 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
						{placeholder}
						bind:value={updatedContent}
						required
						on:paste={handlePaste}
					></textarea>

					<!-- Filinput til billeder -->
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

					<!-- Kombiner eksisterende og nye billeder -->
					<div class="mt-4 grid grid-cols-3 gap-4">
						{#each existingImages as image, index}
							<div class="relative">
								<img
									src={`data:image/*;base64,${image.image_data}`}
									alt="Eksisterende billede"
									class="w-full h-auto rounded-lg"
								/>
								<button
									type="button"
									class="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
									on:click={() => removeExistingImage(index)}
									title="Fjern billede"
								>
									&times;
								</button>
							</div>
						{/each}

						{#each imagesToAdd as image, index}
							<div class="relative">
								<img
									src={`data:image/*;base64,${image}`}
									alt="Nyt billede"
									class="w-full h-auto rounded-lg"
								/>
								<button
									type="button"
									class="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
									on:click={() => removeNewImage(index)}
									title="Fjern billede"
								>
									&times;
								</button>
							</div>
						{/each}
					</div>
				{/if}

				{#if isScheduledReport && isOwner}
					<!-- Planlagt Dato og Tid -->
					<label for="scheduledTime" class="block mt-4 text-gray-700 font-semibold mb-2">
						Planlagt dato og tid:
					</label>
					<input
						id="scheduledTime"
						type="datetime-local"
						bind:value={updatedScheduledTime}
						class="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
						min={getCESTNow()}
						required
					/>
				{/if}

				{#if editingType === 'report' && title.includes('Rapport')}
					<!-- Vælg Rapporttype -->
					<label for="reportType" class="block mt-4 text-gray-700 font-semibold mb-2">
						Vælg rapporttype:
					</label>
					<select
						id="reportType"
						bind:value={updatedReportTypeId}
						class="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
						required
					>
						{#each reportTypeOptions as option}
							<option value={option.id}>{option.label}</option>
						{/each}
					</select>
				{/if}

				<div class="flex justify-between pt-12">
					<!-- Slet-knap -->
					{#if isOwner}
						<button
							type="button"
							class="px-4 py-2 bg-HeaderBg text-white rounded hover:bg-toggleBg"
							on:click={handleDelete}
						>
							Slet
						</button>
					{/if}

					<!-- Annuller og Gem knap-->
					<div class="flex space-x-4">
						<button
							type="button"
							class="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
							on:click={onCancel}
						>
							Annuller
						</button>
						<button
							type="submit"
							class="px-4 py-2 bg-HeaderBg text-white rounded hover:bg-toggleBg"
						>
							Gem
						</button>
					</div>
				</div>
			</form>
		</div>
		<ConfirmationModal
			show={showConfirmDelete}
			title="Bekræft sletning"
			message="Er du sikker på, at du vil slette denne rapport?"
			onConfirm={confirmDelete}
			onCancel={cancelDelete}
		/>
	</div>
{/if}
