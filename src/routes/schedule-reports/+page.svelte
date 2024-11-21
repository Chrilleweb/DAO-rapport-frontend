<script>
	import { writable } from 'svelte/store';
	import SuccessModal from '$lib/components/ui/SuccessModal.svelte';
	import { page } from '$app/stores';
	import socket from '$lib/socket';
	import { onMount, onDestroy } from 'svelte';
	import EditModal from '$lib/components/ui/EditModal.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faEdit } from '@fortawesome/free-solid-svg-icons';

	let reportContent = '';
	let scheduledDateTime = '';
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

	let scheduledReports = [];
	let isEditing = false;
	let editingType = ''; // 'report' eller 'comment'
	let editingItem = null;
	let isOwner = false;

	// SuccessModal state
	let successMessage = '';
	let showSuccessModal = false;

	// Kommentarer for planlagte rapporter som en writable store
	let scheduleReportComments = writable({});
	let newScheduleReportCommentContent = {};

	function submitScheduledReport() {
		socket.emit('schedule report', {
			user_id: Number(user.id),
			content: reportContent.trim(),
			scheduled_time: scheduledDateTime,
			report_type_id: selectedReportTypeId
		});

		// Nulstil formularen
		reportContent = '';
		scheduledDateTime = '';
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

			socket.emit('edit scheduled report', payload);
		} else if (editingType === 'comment') {
			socket.emit('edit schedule report comment', {
				commentId: editingItem.id,
				userId: Number(user.id),
				updatedContent: updatedContent.trim()
			});
		}

		closeEditModal();
	}

	function submitNewScheduleReportComment(reportId) {
		const content = newScheduleReportCommentContent[reportId]?.trim();
		if (!content) {
			alert('Kommentaren kan ikke være tom.');
			return;
		}

		socket.emit('new schedule report comment', {
			schedule_report_id: reportId,
			user_id: Number(user.id),
			content
		});

		// Nulstil tekstfeltet
		newScheduleReportCommentContent[reportId] = '';
	}

	onMount(() => {
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

			successMessage = `Din rapport er blevet planlagt til ${newReport.scheduled_time}`;
			showSuccessModal = true;
		});

		socket.on('update scheduled report', (updatedReport) => {
			updatedReport = {
				...updatedReport,
				isScheduled: true
			};
			scheduledReports = scheduledReports.map((report) =>
				report.id === updatedReport.id ? updatedReport : report
			);
		});

		socket.on('edit scheduled report error', (error) => {
			alert(error.message);
		});

		// Kommentarer på planlagte rapporter
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
		socket.off('edit scheduled report error');
		socket.off('all schedule report comments');
		socket.off('new schedule report comment');
		socket.off('update schedule report comment');
		socket.off('new schedule report comment error');
	});
</script>

<div class="max-w-3xl mx-auto">
	<!-- Success Modal -->
	<SuccessModal message={successMessage} show={showSuccessModal} />

	<h2 class="text-4xl font-semibold text-center my-6">Planlæg en rapport</h2>

	<!-- Formular til at planlægge en ny rapport -->
	<form on:submit|preventDefault={submitScheduledReport}>
		<div>
			<label for="reportContent" class="sr-only">Rapportindhold</label>
			<textarea
				id="reportContent"
				bind:value={reportContent}
				placeholder="Planlæg din rapport her..."
				class="w-full h-28 p-4 bg-[#ECE0D1] rounded-lg placeholder-gray-600 text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400"
				required
			></textarea>
		</div>

		<div class="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
			<!-- Planlagt Dato og Tid -->
			<div>
				<label for="scheduledDateTime" class="block text-gray-700 font-semibold mb-2">
					Planlagt dato og tid:
				</label>
				<input
					id="scheduledDateTime"
					type="datetime-local"
					bind:value={scheduledDateTime}
					class="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
					required
				/>
			</div>

			<!-- Vælg Rapporttype -->
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

		<div class="flex justify-end">
			<button
				type="submit"
				class="px-6 py-2 bg-[#D14343] text-white font-semibold rounded-lg hover:bg-[#B23030] focus:outline-none focus:ring-2 focus:ring-red-400"
			>
				Planlæg Rapport
			</button>
		</div>
	</form>

	<h2 class="text-2xl font-semibold mb-4">Planlagte Rapporter</h2>

	<div class="report-list overflow-y-auto h-96">
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
							{#each $scheduleReportComments[report.id] || [] as comment}
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
									bind:value={newScheduleReportCommentContent[report.id]}
									placeholder="Skriv en kommentar..."
								></textarea>
								<button
									class="mt-2 px-4 py-2 bg-costumRed text-white rounded-lg hover:bg-costumRedHover"
									on:click={() => submitNewScheduleReportComment(report.id)}
								>
									Tilføj kommentar
								</button>
							</div>
						</div>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="text-center text-lg">Ingen planlagte rapporter</p>
		{/if}
	</div>

	<!-- EditModal komponent til at redigere planlagte rapporter og kommentarer -->
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
    isOwner={isOwner}
	/>
</div>
