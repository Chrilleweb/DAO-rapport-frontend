<script>
	import EditModal from '$lib/components/ui/EditModal.svelte';
	import ImageModal from '$lib/components/ui/ImageModal.svelte';
	import { onMount, onDestroy } from 'svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faEdit, faPaperclip, faArrowRight } from '@fortawesome/free-solid-svg-icons';
	import { writable } from 'svelte/store';
	import socket from '$lib/socket';
	import { page } from '$app/stores';
	import { processReportsWithAIDate } from '$lib/api/openai.js';
	import { generateStandardPDF, generateAIPDF } from '$lib/utils/pdfGenerator.js';
	import Loader from '$lib/components/ui/Loader.svelte';
	import ErrorModal from '$lib/components/ui/ErrorModal.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import { handleFileChange, handlePaste, addFiles, removeImage } from '$lib/utils/fileUtils.js';

	const reports = writable([]);
	const comments = writable({});
	let newCommentContent = {};
	let newCommentImages = writable({}); // Tilføjet til at håndtere billeder i nye kommentarer
	let isDataLoaded = false;

	$: user = $page.data.user;

	let isEditing = false;
	let editingItem = null;
	let editingType = ''; // 'report' eller 'comment'
	let isLoading = false;
	let isOwner = false;

	// Variabler til ImageModal
	let showImageModal = false;
	let currentImageSrc = '';

	// ErrorModal state
	let errorMessage = '';
	let showErrorModal = false;

	// Funktioner til ImageModal
	function openImageModal(imageSrc) {
		showImageModal = true;
		currentImageSrc = imageSrc;
	}

	function closeImageModal() {
		showImageModal = false;
		currentImageSrc = '';
	}

	let reportTypeOptionsArray = [
		{ label: 'Alle', ids: [1, 2, 3, 4, 5, 6, 7, 8] },
		{ label: 'UBD', ids: [2] },
		{ label: 'Pakkeshop', ids: [4] },
		{ label: 'Indhentning', ids: [3] },
		{ label: 'Ledelse', ids: [5] },
		{ label: 'EKL', ids: [6] },
		{ label: 'Transport', ids: [7] },
		{ label: 'IT', ids: [8] }
	];

	let reportTypeOptions = [
		{ label: 'Alle', id: 1 },
		{ label: 'UBD', id: 2 },
		{ label: 'Pakkeshop', id: 4 },
		{ label: 'Indhentning', id: 3 },
		{ label: 'Ledelse', id: 5 },
		{ label: 'EKL', id: 6 },
		{ label: 'Transport', id: 7 },
		{ label: 'IT', id: 8 }
	];

	// Initialiserer med 'Alle' valgt
	let selectedReportTypeLabels = ['Alle'];

	function toggleReportTypeSelection(label) {
    isDataLoaded = false; // Start loading state

    if (label === 'Alle') {
        // Hvis "Alle" allerede er valgt, gør intet
        if (selectedReportTypeLabels.length === 1 && selectedReportTypeLabels.includes('Alle')) {
            isDataLoaded = true; // Stop loading state
            return;
        }
        // Hvis "Alle" vælges, fjern alle andre labels og vælg kun "Alle"
        selectedReportTypeLabels = ['Alle'];
    } else {
        // Fjern "Alle", hvis en specifik type vælges
        selectedReportTypeLabels = selectedReportTypeLabels.filter((l) => l !== 'Alle');

        if (selectedReportTypeLabels.includes(label)) {
            // Fjern label, hvis den allerede er valgt
            selectedReportTypeLabels = selectedReportTypeLabels.filter((l) => l !== label);
        } else {
            // Tilføj label, hvis den ikke allerede er valgt
            selectedReportTypeLabels = [...selectedReportTypeLabels, label];
        }

        // Hvis listen bliver tom, sæt "Alle" som valgt
        if (selectedReportTypeLabels.length === 0) {
            selectedReportTypeLabels = ['Alle'];
        }
    }

    isDataLoaded = true; // Stop loading state
}

	// Opdaterer selectedReportTypeIds baseret på selectedReportTypeLabels
	$: selectedReportTypeIds = selectedReportTypeLabels.reduce((ids, label) => {
		const option = reportTypeOptionsArray.find((opt) => opt.label === label);
		if (option) {
			return [...ids, ...option.ids];
		}
		return ids;
	}, []);

	let startDate;
	let endDate;

	// Hent datoer fra localStorage, hvis vi er på klienten
	if (typeof window !== 'undefined') {
		let storedStartDate = localStorage.getItem('startDate');
		let storedEndDate = localStorage.getItem('endDate');

		startDate = storedStartDate
			? storedStartDate
			: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
		endDate = storedEndDate ? storedEndDate : new Date().toISOString().slice(0, 16);
	} else {
		// Standardværdier for SSR
		startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
		endDate = new Date().toISOString().slice(0, 16);
	}

	// Opdater localStorage, hvis datoerne ændres (kun på klienten)
	$: if (typeof window !== 'undefined') {
		localStorage.setItem('startDate', startDate);
		localStorage.setItem('endDate', endDate);
	}

	function openEditModal(item, type) {
		isEditing = true;
		editingItem = item;
		editingType = type;
		isOwner = item.user_id === Number(user.id);
	}

	function closeEditModal() {
		isEditing = false;
		editingItem = null;
		editingType = '';
	}

	async function handleEditSubmit(updatedData) {
		const { updatedContent, updatedReportTypeId, imagesToAdd, imagesToRemove } = updatedData;

		if (editingType === 'report') {
			const payload = {
				reportId: editingItem.id,
				userId: Number(user.id),
				updatedReportTypeId: Number(updatedReportTypeId)
			};

			if (isOwner) {
				showErrorModal = false;
				if (updatedContent.trim() === '') {
					errorMessage = 'Rapportens indhold kan ikke være tomt.';
					showErrorModal = true;
					return;
				}
				payload.updatedContent = updatedContent.trim();
			}

			if (isOwner && imagesToAdd && imagesToAdd.length > 0) {
				payload.imagesToAdd = imagesToAdd;
			}

			if (isOwner && imagesToRemove && imagesToRemove.length > 0) {
				payload.imagesToRemove = imagesToRemove;
			}

			socket.emit('edit report', payload);
		} else if (editingType === 'comment') {
			const payload = {
				commentId: editingItem.id,
				userId: Number(user.id),
				updatedContent: updatedContent.trim(),
				report_id: editingItem.report_id
			};

			if (isOwner && imagesToAdd && imagesToAdd.length > 0) {
				payload.imagesToAdd = imagesToAdd;
			}

			if (isOwner && imagesToRemove && imagesToRemove.length > 0) {
				payload.imagesToRemove = imagesToRemove;
			}

			socket.emit('edit comment', payload);
		}
		closeEditModal();
	}

	function submitNewComment(reportId) {
		const content = newCommentContent[reportId]?.trim();
		const images = $newCommentImages[reportId] || [];

		showErrorModal = false;
		if (!content) {
			showErrorModal = true;
			errorMessage = 'Kommentaren skal indeholde tekst.';
			return;
		}

		// Send kommentaren, da content er valid
		socket.emit('new comment', {
			report_id: reportId,
			user_id: Number(user.id),
			content,
			images // Vedhæft billeder, hvis nogen
		});

		// Ryd tekst og billeder efter afsendelse
		newCommentContent[reportId] = '';
		newCommentImages.update((currentImagesObj) => {
			const updatedImages = { ...currentImagesObj };
			delete updatedImages[reportId];
			return updatedImages;
		});
	}

	function setErrorMessage(message) {
		errorMessage = '';
		showErrorModal = false;
		errorMessage = message;
		showErrorModal = true;
	}
	// For comment images
	function handleCommentFileChange(event, reportId) {
		handleFileChange(event, (files) =>
			addFiles(files, newCommentImages, setErrorMessage, reportId)
		);
	}

	function handleCommentPaste(event, reportId) {
		handlePaste(event, (files) => addFiles(files, newCommentImages, setErrorMessage, reportId));
	}

	function removeCommentImage(index, reportId) {
		removeImage(index, newCommentImages, reportId);
	}

	function requestReports() {
		showErrorModal = false;
		if (startDate && endDate) {
			const startDateObj = new Date(startDate);
			const endDateObj = new Date(endDate);

			// Convert to UTC by adding the timezone offset
			const startDateUTC = new Date(
				startDateObj.getTime() - startDateObj.getTimezoneOffset() * 60000
			);
			const endDateUTC = new Date(endDateObj.getTime() - endDateObj.getTimezoneOffset() * 60000);

			const formattedStartDate = startDateUTC.toISOString().replace('T', ' ').slice(0, 19);
			const formattedEndDate = endDateUTC.toISOString().replace('T', ' ').slice(0, 19);

			socket.emit('get reports dates', {
				reportTypeIds: selectedReportTypeIds.length ? [...new Set(selectedReportTypeIds)] : [],
				startDate: formattedStartDate,
				endDate: formattedEndDate
			});
		} else {
			errorMessage = 'Start- og slutdato skal udfyldes.';
			showErrorModal = true;
		}
	}

	function requestAllComments() {
		socket.emit('get all comments');
	}

	function handlePreviousDelete() {
		if (editingType === 'report') {
			socket.emit('delete report', {
				reportId: editingItem.id,
				userId: Number(user.id)
			});
			closeEditModal();
		} else if (editingType === 'comment') {
			socket.emit('delete report comment', {
				commentId: editingItem.id,
				userId: Number(user.id)
			});
			closeEditModal();
		}
	}

	onMount(() => {
		isDataLoaded = false;
		if (socket.connected) {
			requestReports();
			requestAllComments();
		} else {
			socket.on('connect', () => {
				requestReports();
				requestAllComments();
			});
		}

		socket.on('previous reports', (pReports) => {
			const reportsWithNumberIds = pReports.map((report) => ({
				...report,
				report_type_id: Number(report.report_type_id),
				user_id: Number(report.user_id)
			}));
			reports.set(reportsWithNumberIds);
			isDataLoaded = true;
		});

		socket.on('new report', (newReport) => {
			const reportTypeId = Number(newReport.report_type_id);
			const userId = Number(newReport.user_id);
			if (selectedReportTypeIds.includes(reportTypeId)) {
				reports.update((currentReports) => [
					{ ...newReport, report_type_id: reportTypeId, user_id: userId },
					...currentReports
				]);
			}
		});

		socket.on('update report', (updatedReport) => {
			const reportWithNumberId = {
				...updatedReport,
				user_id: Number(updatedReport.user_id),
				report_type_id: Number(updatedReport.report_type_id)
			};
			reports.update((currentReports) => {
				const index = currentReports.findIndex((report) => report.id === reportWithNumberId.id);
				if (index !== -1) {
					currentReports[index] = reportWithNumberId;
				}
				return [...currentReports];
			});
		});

		socket.on('edit error', (error) => {
			console.error('Edit error:', error);
		});

		socket.on('all comments', (groupedComments) => {
			comments.set(groupedComments);
		});

		socket.on('delete report success', ({ reportId }) => {
			reports.update((currentReports) => currentReports.filter((report) => report.id !== reportId));
		});

		socket.on('delete report error', (error) => {
			alert(error.message);
		});

		socket.on('delete comment success', ({ commentId, report_id }) => {
			comments.update((currentComments) => {
				const updatedComments = (currentComments[report_id] || []).filter(
					(comment) => comment.id !== commentId
				);
				return { ...currentComments, [report_id]: updatedComments };
			});
		});

		socket.on('delete comment error', (error) => {
			alert(error.message);
		});

		socket.on('new comment', (newComment) => {
			comments.update((currentComments) => {
				const reportId = newComment.report_id;
				const reportComments = currentComments[reportId] || [];
				return {
					...currentComments,
					[reportId]: [...reportComments, newComment]
				};
			});
		});

		socket.on('update comment', (updatedComment) => {
			comments.update((currentComments) => {
				const reportId = updatedComment.report_id;
				const reportComments = currentComments[reportId] || [];
				const index = reportComments.findIndex((c) => c.id === updatedComment.id);
				if (index !== -1) {
					reportComments[index] = updatedComment;
					return {
						...currentComments,
						[reportId]: reportComments
					};
				}
				return currentComments;
			});
		});

		socket.on('edit comment error', (error) => {
			console.error('Edit comment error:', error);
		});

		return () => {
			socket.off('connect');
			socket.off('new report');
			socket.off('previous reports');
			socket.off('update report');
			socket.off('edit error');
			socket.off('all comments');
			socket.off('delete report success');
			socket.off('delete report error');
			socket.off('delete comment success');
			socket.off('delete comment error');
			socket.off('new comment');
			socket.off('update comment');
			socket.off('edit comment error');
		};
	});

	onDestroy(() => {
		if (socket) {
			socket.off('connect');
			socket.off('new report');
			socket.off('previous reports');
			socket.off('update report');
			socket.off('edit error');
			socket.off('delete report success');
			socket.off('delete report error');
			socket.off('delete comment success');
			socket.off('delete comment error');
			socket.off('new comment');
			socket.off('update comment');
			socket.off('edit comment error');
		}
	});

	function downloadPDF() {
		showErrorModal = false;
		const reportsData = $reports.map((report) => ({
			...report,
			comments: $comments[report.id] || []
		}));

		if (reportsData.length > 0) {
			const uniqueReportTypes = [...new Set(reportsData.map((report) => report.report_type))];
			const reportType = uniqueReportTypes.length > 1 ? 'Samlet' : uniqueReportTypes[0];
			generateStandardPDF(reportsData, reportType);
		} else {
			errorMessage = 'Ingen rapporter tilgængelige for den valgte periode.';
			showErrorModal = true;
		}
	}

	async function downloadPDFWithAI() {
		showErrorModal = false;

		if (!$reports || $reports.length === 0) {
			errorMessage = 'Ingen rapporter tilgængelige for den valgte periode.';
			showErrorModal = true;
			return;
		}
		try {
			isLoading = true;

			const startDateObj = new Date(startDate);
			const endDateObj = new Date(endDate);

			const startDateUTC = new Date(
				startDateObj.getTime() - startDateObj.getTimezoneOffset() * 60000
			);
			const endDateUTC = new Date(endDateObj.getTime() - endDateObj.getTimezoneOffset() * 60000);

			const formattedStartDate = startDateUTC.toISOString().replace('T', ' ').slice(0, 19);
			const formattedEndDate = endDateUTC.toISOString().replace('T', ' ').slice(0, 19);

			const processedData = await processReportsWithAIDate(
				selectedReportTypeIds,
				formattedStartDate,
				formattedEndDate
			);

			const uniqueReportTypes = [...new Set($reports.map((report) => report.report_type))];
			const reportType = uniqueReportTypes.length > 1 ? 'Samlet' : uniqueReportTypes[0];
			generateAIPDF(processedData, reportType);
		} catch (error) {
			console.error('Fejl ved generering af PDF med AI:', error);
			errorMessage = 'Der opstod en fejl ved generering af PDF med AI.';
			showErrorModal = true;
		} finally {
			isLoading = false;
		}
	}

	// Kald requestReports, når selectedReportTypeIds ændres
	$: if (selectedReportTypeIds) {
		requestReports();
	}

	// Kald requestReports, når startDate eller endDate ændres
	$: if (startDate && endDate) {
		requestReports();
	}
</script>

<svelte:head>
	<title>Tidligere Rapporter</title>
	<meta name="description" content="Tidligere rapporter side">
</svelte:head>

<div class="max-w-3xl mx-auto mt-6 mb-10">
	{#if isLoading}
		<Loader />
	{/if}

	<!-- Error Modal -->
	<ErrorModal message={errorMessage} show={showErrorModal} />

	<h2 class="text-4xl font-semibold text-center my-6">Tidligere rapporter</h2>

	<!-- Rapporttype Vælger -->
	<div class="mb-6">
		<label for="report-type" class="block text-lg font-semibold text-gray-800 mb-4">
			Vælg rapporttyper:
		</label>
		<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
			{#each reportTypeOptionsArray as option}
				<label
					class="flex items-center space-x-3 bg-white border border-gray-300 rounded-lg shadow-sm p-3 cursor-pointer transition hover:shadow-md focus-within:ring focus-within:ring-blue-300"
				>
					<input
						type="checkbox"
						value={option.label}
						checked={selectedReportTypeLabels.includes(option.label)}
						on:change={() => toggleReportTypeSelection(option.label)}
						class="form-checkbox h-5 w-5 text-blue-500 rounded-md focus:ring focus:ring-blue-300"
					/>
					<span class="text-sm font-medium text-gray-700">{option.label}</span>
				</label>
			{/each}
		</div>
	</div>
	<div class="flex justify-between items-center mb-4">
		<!-- Dato- og tidsvælgere -->
		<div class="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
			<div>
				<label for="start-date" class="block text-gray-700 font-semibold mb-2"
					>Startdato og tid:</label
				>
				<input
					type="datetime-local"
					id="start-date"
					bind:value={startDate}
					class="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
			<div>
				<label for="end-date" class="block text-gray-700 font-semibold mb-2">Slutdato og tid:</label
				>
				<input
					type="datetime-local"
					id="end-date"
					bind:value={endDate}
					class="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
		</div>

		<div class="flex space-x-4 ml-4">
			<button
				class="px-6 py-2 bg-costumRed text-white font-semibold rounded-lg hover:bg-costumRedHover focus:outline-none focus:ring-2 focus:ring-red-400"
				on:click={downloadPDF}
			>
				Download PDF
			</button>
			<button
				class="px-6 py-2 bg-costumRed text-white font-semibold rounded-lg hover:bg-costumRedHover focus:outline-none focus:ring-2 focus:ring-red-400"
				on:click={downloadPDFWithAI}
			>
				Download PDF AI
			</button>
		</div>
	</div>

	{#if !isDataLoaded}
		<div class="flex items-center justify-center h-96">
			<Spinner />
		</div>
	{:else}
		<div class="report-list overflow-y-auto h-[35rem]">
			{#if $reports.length > 0}
				<ul>
					{#each $reports as report}
						<li class="bg-[#ECE0D1] py-6 px-6 rounded-lg shadow-md mb-4 flex flex-col">
							<div class="flex justify-between items-center mb-4">
								<div class="text-gray-600 text-base flex gap-3">
									<p>Log: {report.id}</p>
									<p>{report.firstname} {report.lastname}</p>
									<p>{report.created_at}</p>
								</div>
								<div class="text-gray-600 text-base">
									<p>{report.report_type}</p>
								</div>
							</div>

							<p class="text-gray-800 whitespace-pre-wrap text-lg flex-grow">
								{report.content || 'Ingen indhold tilgængeligt'}
							</p>

							{#if report.images && report.images.length > 0}
								<div class="mt-4 grid grid-cols-3 gap-4">
									{#each report.images as image}
										<button
											class="p-0 border-none bg-transparent cursor-pointer"
											on:click={() => openImageModal(`data:image/*;base64,${image.image_data}`)}
											aria-label="Vis billede i fuld størrelse"
										>
											<img
												src={`data:image/*;base64,${image.image_data}`}
												alt="Vedhæftet billede"
												class="mt-4 max-w-full rounded-lg"
											/>
										</button>
									{/each}
								</div>
							{/if}

							<div class="flex justify-end items-center mt-4 gap-4">
								<button
									class="text-gray-600 hover:text-gray-800 focus:outline-none flex items-center"
									on:click={() => openEditModal(report, 'report')}
								>
									<FontAwesomeIcon icon={faEdit} class="h-6 w-6 mr-2" />
									Rediger
								</button>
							</div>

							<!-- Kommentarer -->
							<div class="mt-4">
								{#each $comments[report.id] || [] as comment}
									<div class="comment bg-[#fff7ee] p-4 rounded-lg mt-2">
										<div class="flex justify-between">
											<p class="font-semibold">{comment.firstname} {comment.lastname}</p>
											<p class="text-sm text-gray-600">{comment.created_at}</p>
										</div>
										<p class="mt-2">{comment.content}</p>

										{#if comment.images && comment.images.length > 0}
											<div class="mt-4 grid grid-cols-3 gap-4">
												{#each comment.images as image}
													<button
														class="p-0 border-none bg-transparent cursor-pointer"
														on:click={() =>
															openImageModal(`data:image/*;base64,${image.image_data}`)}
														aria-label="Vis billede i fuld størrelse"
													>
														<img
															src={`data:image/*;base64,${image.image_data}`}
															alt="Vedhæftet billede"
															class="mt-4 max-w-full rounded-lg"
														/>
													</button>
												{/each}
											</div>
										{/if}

										{#if comment.user_id === Number(user.id)}
											<button
												class="text-blue-500 hover:underline text-sm mt-2"
												on:click={() => openEditModal(comment, 'comment')}
											>
												<FontAwesomeIcon icon={faEdit} class="h-4 w-4 mr-1" />
												<span>Rediger</span>
											</button>
										{/if}
									</div>
								{/each}

								<!-- Tilføj ny kommentar -->
								<div class="mt-4">
									<div class="relative">
										<textarea
											class="w-full h-28 p-4 bg-white rounded-lg placeholder-gray-600 text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 pr-14"
											bind:value={newCommentContent[report.id]}
											placeholder="Skriv en kommentar..."
											on:paste={(e) => handleCommentPaste(e, report.id)}
										></textarea>
										<div class="absolute right-4 bottom-4 flex gap-2 items-center">
											<!-- Vedhæft ikon -->
											<label for={`comment-image-${report.id}`} class="cursor-pointer">
												<FontAwesomeIcon
													icon={faPaperclip}
													class="text-gray-600 hover:text-gray-800 w-5 h-5"
												/>
												<input
													type="file"
													id={`comment-image-${report.id}`}
													on:change={(e) => handleCommentFileChange(e, report.id)}
													accept="image/*"
													multiple
													class="hidden"
												/>
											</label>
											<!-- Send ikon -->
											<button
												type="button"
												class="bg-HeaderBg text-white py-2 px-5 rounded-full hover:bg-toggleBg focus:outline-none focus:ring-2 focus:ring-red-400"
												on:click={() => submitNewComment(report.id)}
											>
												<FontAwesomeIcon icon={faArrowRight} class="w-5 h-5" />
											</button>
										</div>
									</div>

									<!-- Forhåndsvisning af billeder -->
									{#if $newCommentImages[report.id]?.length > 0}
										<div class="mt-4 grid grid-cols-3 gap-4">
											{#each $newCommentImages[report.id] as image, index}
												<div class="relative">
													<img
														src={`data:image/*;base64,${image.image_data || image}`}
														alt={`Billede ${index + 1}`}
														class="w-full h-auto rounded-lg"
													/>
													<button
														type="button"
														class="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
														on:click={() => removeCommentImage(index, report.id)}
														title="Fjern billede"
													>
														&times;
													</button>
												</div>
											{/each}
										</div>
									{/if}
								</div>
							</div>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="text-center text-lg">Ingen rapporter tilgængelige</p>
			{/if}
		</div>
	{/if}

	<!-- ImageModal komponent -->
	<ImageModal show={showImageModal} imageSrc={currentImageSrc} onClose={closeImageModal} />

	<!-- Brug af EditModal til både rapporter og kommentarer -->
	<EditModal
		show={isEditing}
		title={editingType === 'report' ? 'Rediger Rapport' : 'Rediger Kommentar'}
		content={editingItem?.content || ''}
		{reportTypeOptions}
		selectedReportTypeId={editingItem?.report_type_id || reportTypeOptions[0].id}
		placeholder={editingType === 'report'
			? 'Rediger rapportens indhold her...'
			: 'Rediger kommentarens indhold her...'}
		onSave={handleEditSubmit}
		onCancel={closeEditModal}
		{isOwner}
		images={editingItem?.images || []}
		{editingType}
		onDelete={handlePreviousDelete}
	/>
</div>
