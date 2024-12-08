<script>
	import { writable } from 'svelte/store';
	import SuccessModal from '$lib/components/ui/SuccessModal.svelte';
	import ErrorModal from '$lib/components/ui/ErrorModal.svelte';
	import { page } from '$app/stores';
	import socket from '$lib/socket';
	import { onMount, onDestroy } from 'svelte';
	import EditModal from '$lib/components/ui/EditModal.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faEdit, faPaperclip, faArrowRight } from '@fortawesome/free-solid-svg-icons';
	import ImageModal from '$lib/components/ui/ImageModal.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import { handleFileChange, handlePaste, addFiles, removeImage } from '$lib/utils/fileUtils.js';

	let reportContent = '';
	let scheduledDateTime = '';
	let isDataLoaded = false;

	$: user = $page.data.user;

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

	let selectedReportTypeId = reportTypeOptions[0].id;

	let images = writable([]); // For storing images when creating a scheduled report

	let scheduledReports = [];
	let isEditing = false;
	let editingType = ''; // 'report' eller 'comment'
	let editingItem = null;
	let isOwner = false;

	// SuccessModal state
	let successMessage = '';
	let showSuccessModal = false;

	// ErrorModal state
	let errorMessage = '';
	let showErrorModal = false;

	// Kommentarer for planlagte rapporter som en writable store
	let scheduleReportComments = writable({});
	let newScheduleReportCommentContent = {};
	let newScheduleReportCommentImages = writable({});

	// Image modal state
	let showImageModal = false;
	let currentImageSrc = '';

	function openImageModal(imageSrc) {
		showImageModal = true;
		currentImageSrc = imageSrc;
	}

	function closeImageModal() {
		showImageModal = false;
		currentImageSrc = '';
	}

	function setErrorMessage(message) {
		errorMessage = '';
		showErrorModal = false;
		errorMessage = message;
		showErrorModal = true;
	}

	// For report images
	function handleReportFileChange(event) {
		handleFileChange(event, (files) => addFiles(files, images, setErrorMessage));
	}

	function handleReportPaste(event) {
		handlePaste(event, (files) => addFiles(files, images, setErrorMessage));
	}

	function removeReportImage(index) {
		removeImage(index, images);
	}

	// For comment images
	function handleCommentFileChange(event, reportId) {
		handleFileChange(event, (files) =>
			addFiles(files, newScheduleReportCommentImages, setErrorMessage, reportId)
		);
	}

	function handleCommentPaste(event, reportId) {
		handlePaste(event, (files) =>
			addFiles(files, newScheduleReportCommentImages, setErrorMessage, reportId)
		);
	}

	function removeCommentImage(index, reportId) {
		removeImage(index, newScheduleReportCommentImages, reportId);
	}

	function submitScheduledReport() {
		socket.emit('schedule report', {
			user_id: Number(user.id),
			content: reportContent.trim(),
			scheduled_time: scheduledDateTime,
			report_type_id: selectedReportTypeId,
			images: $images
		});
		// Reset the form
		reportContent = '';
		scheduledDateTime = '';
		images.set([]);
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

	function handleEditSubmit(updatedData) {
		const {
			updatedContent,
			updatedScheduledTime,
			updatedReportTypeId,
			imagesToAdd,
			imagesToRemove
		} = updatedData;

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
				payload.updatedScheduledTime = updatedScheduledTime;

				if (imagesToAdd && imagesToAdd.length > 0) {
					payload.imagesToAdd = imagesToAdd;
				}

				if (imagesToRemove && imagesToRemove.length > 0) {
					payload.imagesToRemove = imagesToRemove;
				}
			}

			socket.emit('edit scheduled report', payload);
		} else if (editingType === 'comment') {
			const payload = {
				commentId: editingItem.id,
				userId: Number(user.id),
				updatedContent: updatedContent.trim()
			};

			if (isOwner) {
				if (imagesToAdd && imagesToAdd.length > 0) {
					payload.imagesToAdd = imagesToAdd;
				}

				if (imagesToRemove && imagesToRemove.length > 0) {
					payload.imagesToRemove = imagesToRemove;
				}
			}

			socket.emit('edit schedule report comment', payload);
		}

		closeEditModal();
	}

	function submitNewScheduleReportComment(reportId) {
		const content = newScheduleReportCommentContent[reportId]?.trim();
		const images = $newScheduleReportCommentImages[reportId] || [];

		showErrorModal = false;
		if (!content) {
			showErrorModal = true;
			errorMessage = 'Kommentaren skal indeholde tekst.';
			return;
		}

		// Send kommentaren, da content er valid
		socket.emit('new schedule report comment', {
			schedule_report_id: reportId,
			user_id: Number(user.id),
			content,
			images // Vedhæft billeder, hvis nogen
		});

		// Ryd tekst og billeder efter afsendelse
		newScheduleReportCommentContent[reportId] = '';
		newScheduleReportCommentImages.update((currentImagesObj) => {
			const updatedImages = { ...currentImagesObj };
			delete updatedImages[reportId];
			return updatedImages;
		});
	}

	function handleDeleteScheduledReport() {
		if (editingType === 'report' && editingItem.isScheduled) {
			socket.emit('delete scheduled report', {
				reportId: editingItem.id,
				userId: Number(user.id)
			});
			closeEditModal();
		} else if (editingType === 'comment') {
			socket.emit('delete scheduled report comment', {
				commentId: editingItem.id,
				userId: Number(user.id)
			});
			closeEditModal();
		}
	}

	onMount(() => {
		isDataLoaded = false;
		function requestScheduledReports() {
			socket.emit('get scheduled reports');
			socket.emit('get all schedule report comments');
		}

		if (socket.connected) {
			requestScheduledReports();
		} else {
			socket.on('connect', () => {
				requestScheduledReports();
			});
		}

		socket.on('scheduled reports', (reports) => {
			scheduledReports = reports.map((report) => ({
				...report,
				user_id: Number(report.user_id),
				report_type_id: Number(report.report_type_id),
				isScheduled: true
			}));
			isDataLoaded = true;
		});

		socket.on('new scheduled report', (newReport) => {
			scheduledReports = [
				{
					...newReport,
					user_id: Number(newReport.user_id),
					report_type_id: Number(newReport.report_type_id),
					isScheduled: true
				},
				...scheduledReports
			];

			showSuccessModal = false; // vi sætter den til false igen, for at sikre at modalen vises igen
			successMessage = `Din rapport er blevet planlagt til ${newReport.scheduled_time}`;
			showSuccessModal = true;
		});

		socket.on('update scheduled report', (updatedReport) => {
			updatedReport = {
				...updatedReport,
				user_id: Number(updatedReport.user_id),
				report_type_id: Number(updatedReport.report_type_id),
				isScheduled: true
			};
			scheduledReports = scheduledReports.map((report) =>
				report.id === updatedReport.id ? updatedReport : report
			);
		});

		socket.on('edit scheduled report error', (error) => {
			alert(error.message);
		});

		socket.on('delete scheduled report success', ({ reportId }) => {
			scheduledReports = scheduledReports.filter((report) => report.id !== reportId);
		});

		socket.on('delete scheduled report error', (error) => {
			alert(error.message);
		});

		socket.on('delete scheduled report comment success', ({ commentId, schedule_report_id }) => {
			scheduleReportComments.update((current) => {
				const updatedComments = (current[schedule_report_id] || []).filter(
					(comment) => comment.id !== commentId
				);
				return { ...current, [schedule_report_id]: updatedComments };
			});
		});

		socket.on('delete scheduled report comment error', (error) => {
			alert(error.message);
		});

		// Handle comments
		socket.on('all schedule report comments', (comments) => {
			scheduleReportComments.set(comments);
		});

		socket.on('new schedule report comment', (newComment) => {
			const reportId = newComment.schedule_report_id;
			scheduleReportComments.update((current) => {
				const reportComments = current[reportId] || [];
				return { ...current, [reportId]: [...reportComments, newComment] };
			});
		});

		socket.on('update schedule report comment', (updatedComment) => {
			const reportId = updatedComment.schedule_report_id;
			scheduleReportComments.update((current) => {
				if (!current[reportId]) return current;
				const updatedComments = current[reportId].map((c) =>
					c.id === updatedComment.id ? updatedComment : c
				);
				return { ...current, [reportId]: updatedComments };
			});
		});

		socket.on('new schedule report comment error', (error) => {
			alert(error.message);
		});

		return () => {
			socket.off('connect');
			socket.off('scheduled reports');
			socket.off('new scheduled report');
			socket.off('update scheduled report');
			socket.off('edit scheduled report error');
			socket.off('delete scheduled report success');
			socket.off('delete scheduled report error');
			socket.off('delete scheduled report comment success');
			socket.off('delete scheduled report comment error');
			socket.off('all schedule report comments');
			socket.off('new schedule report comment');
			socket.off('update schedule report comment');
			socket.off('new schedule report comment error');
		};
	});

	onDestroy(() => {
		socket.off('connect');
		socket.off('scheduled reports');
		socket.off('new scheduled report');
		socket.off('update scheduled report');
		socket.off('delete scheduled report success');
		socket.off('delete scheduled report error');
		socket.off('delete scheduled report comment success');
		socket.off('delete scheduled report comment error');
		socket.off('edit scheduled report error');
		socket.off('all schedule report comments');
		socket.off('new schedule report comment');
		socket.off('update schedule report comment');
		socket.off('new schedule report comment error');
	});

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
		const datePart = `${parts.find((part) => part.type === 'year').value}-${
			parts.find((part) => part.type === 'month').value
		}-${parts.find((part) => part.type === 'day').value}`;
		const timePart = `${parts.find((part) => part.type === 'hour').value}:${
			parts.find((part) => part.type === 'minute').value
		}`;
		return `${datePart}T${timePart}`;
	}
</script>

<div class="max-w-3xl mx-auto">
	<!-- Success Modal -->
	<SuccessModal message={successMessage} show={showSuccessModal} />

	<!-- Error Modal -->
	<ErrorModal message={errorMessage} show={showErrorModal} />

	<h2 class="text-4xl font-semibold text-center my-6">Planlæg en rapport</h2>

	<!-- Form to schedule a new report -->
	<form on:submit|preventDefault={submitScheduledReport} class="relative">
		<div class="relative">
			<label for="reportContent" class="sr-only">Rapportindhold</label>
			<textarea
				id="reportContent"
				bind:value={reportContent}
				placeholder="Planlæg din rapport her..."
				class="w-full h-28 p-4 bg-[#ECE0D1] rounded-lg placeholder-gray-600 text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 pr-14"
				on:paste={handleReportPaste}
				required
			></textarea>
			<div class="absolute right-4 bottom-4 flex gap-2 items-center">
				<label for="file-input" class="cursor-pointer">
					<FontAwesomeIcon icon={faPaperclip} class="text-gray-600 hover:text-gray-800 w-5 h-5" />
					<input
						type="file"
						id="file-input"
						on:change={handleReportFileChange}
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
							on:click={() => removeReportImage(index)}
							title="Fjern billede"
						>
							&times;
						</button>
					</div>
				{/each}
			</div>
		{/if}

		<div class="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
			<!-- Scheduled Date and Time -->
			<div>
				<label for="scheduledDateTime" class="block text-gray-700 font-semibold mb-2">
					Planlagt dato og tid:
				</label>
				<input
					id="scheduledDateTime"
					type="datetime-local"
					bind:value={scheduledDateTime}
					class="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
					min={getCESTNow()}
					required
				/>
			</div>

			<!-- Select Report Type -->
			<div>
				<label for="reportType" class="block text-gray-700 font-semibold mb-2">
					Vælg rapporttype:
				</label>
				<select
					id="reportType"
					bind:value={selectedReportTypeId}
					class="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
					required
				>
					{#each reportTypeOptions as option}
						<option value={option.id}>{option.label}</option>
					{/each}
				</select>
			</div>
		</div>
	</form>

	<h2 class="text-2xl font-semibold mb-4">Planlagte Rapporter</h2>

	{#if !isDataLoaded}
		<div class="flex items-center justify-center h-96">
			<Spinner />
		</div>
	{:else}
		<div class="report-list overflow-y-auto h-[35rem]">
			{#if scheduledReports.length > 0}
				<ul>
					{#each scheduledReports as report}
						<li class="bg-[#ECE0D1] py-6 px-6 rounded-lg shadow-md mb-4 flex flex-col">
							<div class="flex justify-between items-center mb-4">
								<div class="text-gray-600 text-base flex gap-3">
									<p>{report.firstname} {report.lastname}</p>
									<p>{report.scheduled_time}</p>
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

							<!-- Comments -->
							<div class="mt-4">
								{#each $scheduleReportComments[report.id] || [] as comment}
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

								<!-- Add new comment -->
								<div class="mt-4">
									<div class="relative">
										<textarea
											class="w-full h-28 p-4 bg-white rounded-lg placeholder-gray-600 text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 pr-14"
											bind:value={newScheduleReportCommentContent[report.id]}
											placeholder="Skriv en kommentar..."
											on:paste={(e) => handleCommentPaste(e, report.id)}
										></textarea>
										<div class="absolute right-4 bottom-4 flex gap-2 items-center">
											<!-- Attach icon -->
											<label for={`schedule-comment-image-${report.id}`} class="cursor-pointer">
												<FontAwesomeIcon
													icon={faPaperclip}
													class="text-gray-600 hover:text-gray-800 w-5 h-5"
												/>
												<input
													type="file"
													id={`schedule-comment-image-${report.id}`}
													on:change={(e) => handleCommentFileChange(e, report.id)}
													accept="image/*"
													multiple
													class="hidden"
												/>
											</label>
											<!-- Send icon -->
											<button
												type="button"
												class="bg-HeaderBg text-white py-2 px-5 rounded-full hover:bg-toggleBg focus:outline-none focus:ring-2 focus:ring-red-400"
												on:click={() => submitNewScheduleReportComment(report.id)}
											>
												<FontAwesomeIcon icon={faArrowRight} class="w-5 h-5" />
											</button>
										</div>
									</div>

									<!-- Preview images -->
									{#if $newScheduleReportCommentImages[report.id]?.length > 0}
										<div class="mt-4 grid grid-cols-3 gap-4">
											{#each $newScheduleReportCommentImages[report.id] as image, index}
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
				<p class="text-center text-lg">Ingen planlagte rapporter</p>
			{/if}
		</div>
	{/if}

	<ImageModal show={showImageModal} imageSrc={currentImageSrc} onClose={closeImageModal} />

	<!-- EditModal component for editing scheduled reports and comments -->
	<EditModal
		show={isEditing}
		title={editingType === 'report' ? 'Rediger Planlagt Rapport' : 'Rediger Kommentar'}
		content={editingItem?.content || ''}
		scheduledTime={editingItem?.scheduled_time || ''}
		isScheduledReport={editingType === 'report' && editingItem?.isScheduled}
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
		onDelete={handleDeleteScheduledReport}
	/>
</div>
