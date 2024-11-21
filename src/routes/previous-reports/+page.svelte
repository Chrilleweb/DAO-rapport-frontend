<script>
	import EditModal from '$lib/components/ui/EditModal.svelte';
	import { onMount, onDestroy } from 'svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faEdit } from '@fortawesome/free-solid-svg-icons';
	import { writable } from 'svelte/store';
	import socket from '$lib/socket';
	import { page } from '$app/stores';
	import { processReportsWithAIDate } from '$lib/api/openai.js';
	import { generateStandardPDF, generateAIPDF } from '$lib/utils/pdfGenerator.js';
	import Loader from '$lib/components/ui/Loader.svelte';

	const reports = writable([]);
	const comments = writable({});
	let newCommentContent = {};

	$: user = $page.data.user;

	let isEditing = false;
	let editingItem = null;
	let editingType = ''; // 'report' eller 'comment'
	let isLoading = false;
	let isOwner = false;

	let reportTypeOptionsDisplay = [
		{ label: 'Alle', ids: [1, 2, 3, 4, 5] },
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

	let selectedReportTypeIndex = 0; // Default to 'Alle'
	$: reportTypeIds = reportTypeOptionsDisplay[selectedReportTypeIndex].ids;

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

	function handleEditSubmit(updatedData) {
		const { updatedContent, updatedReportTypeId } = updatedData;

		if (editingType === 'report') {
			const payload = {
				reportId: editingItem.id,
				userId: Number(user.id),
				updatedReportTypeId: Number(updatedReportTypeId)
			};

			if (isOwner) {
				if (updatedContent.trim() === '') {
					alert('Indholdet kan ikke være tomt.');
					return;
				}
				payload.updatedContent = updatedContent.trim();
			}

			socket.emit('edit report', payload);
		} else if (editingType === 'comment') {
			socket.emit('edit comment', {
				commentId: editingItem.id,
				userId: Number(user.id),
				updatedContent: updatedContent.trim(),
				report_id: editingItem.report_id
			});
		}
		closeEditModal();
	}

	function submitNewComment(reportId) {
		const content = newCommentContent[reportId]?.trim();
		if (!content) {
			alert('Kommentaren kan ikke være tom.');
			return;
		}

		socket.emit('new comment', {
			report_id: reportId,
			user_id: Number(user.id),
			content
		});

		newCommentContent[reportId] = '';
	}

	function requestReports() {
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
				reportTypeIds,
				startDate: formattedStartDate,
				endDate: formattedEndDate
			});
		} else {
			alert('Vælg venligst både start- og slutdato/tid.');
		}
	}

	function requestAllComments() {
		socket.emit('get all comments');
	}

	onMount(() => {
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
		});

		socket.on('new report', (newReport) => {
			const reportTypeId = Number(newReport.report_type_id);
			const userId = Number(newReport.user_id);
			if (reportTypeIds.includes(reportTypeId)) {
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
			socket.off('new comment');
			socket.off('update comment');
			socket.off('edit comment error');
		}
	});

	function downloadPDF() {
		const reportsData = $reports;
		if (reportsData.length > 0) {
			const uniqueReportTypes = [...new Set(reportsData.map((report) => report.report_type))];
			const reportType = uniqueReportTypes.length > 1 ? 'Samlet' : uniqueReportTypes[0];
			generateStandardPDF(reportsData, reportType);
		} else {
			alert('Ingen rapporter tilgængelige.');
		}
	}

	async function downloadPDFWithAI() {
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
				reportTypeIds,
				formattedStartDate,
				formattedEndDate
			);

			const uniqueReportTypes = [...new Set($reports.map((report) => report.report_type))];
			const reportType = uniqueReportTypes.length > 1 ? 'Samlet' : uniqueReportTypes[0];
			generateAIPDF(processedData, reportType);
		} catch (error) {
			console.error('Fejl ved generering af PDF med AI:', error);
			alert('Der opstod en fejl ved generering af PDF med AI.');
		} finally {
			isLoading = false;
		}
	}

	// Kald requestReports, når reportTypeIds ændres
	$: if (reportTypeIds) {
		requestReports();
	}

	// Kald requestReports, når startDate eller endDate ændres
	$: if (startDate && endDate) {
		requestReports();
	}
</script>

<div class="max-w-3xl mx-auto mt-6 mb-10">
	{#if isLoading}
		<Loader />
	{/if}
	<h2 class="text-4xl font-semibold text-center my-6">Tidligere rapporter</h2>

	<!-- Rapporttype Vælger -->
	<div class="mb-4">
		<label for="report-type" class="block text-gray-700 font-semibold mb-2">Vælg rapporttype:</label
		>
		<select
			id="report-type"
			bind:value={selectedReportTypeIndex}
			class="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
		>
			{#each reportTypeOptionsDisplay as option, index}
				<option value={index}>{option.label}</option>
			{/each}
		</select>
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

	<div class="report-list overflow-y-auto h-[30rem]">
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
								<textarea
									class="w-full p-2 border border-gray-300 rounded-lg"
									bind:value={newCommentContent[report.id]}
									placeholder="Skriv en kommentar..."
								></textarea>
								<button
									class="mt-2 px-4 py-2 bg-costumRed text-white rounded-lg hover:bg-costumRedHover"
									on:click={() => submitNewComment(report.id)}
								>
									Tilføj kommentar
								</button>
							</div>
						</div>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="text-center text-lg">Ingen rapporter tilgængelige</p>
		{/if}
	</div>

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
        isOwner={isOwner}
	/>
</div>
