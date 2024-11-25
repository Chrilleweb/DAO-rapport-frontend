<script>
	import EditModal from '../ui/EditModal.svelte';
	import { onMount, onDestroy } from 'svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faEdit } from '@fortawesome/free-solid-svg-icons';
	import { writable } from 'svelte/store';
	import socket from '$lib/socket';
	import { page } from '$app/stores';
	import { processReportsWithAI } from '$lib/api/openai.js';
	import { generateStandardPDF, generateAIPDF } from '$lib/utils/pdfGenerator.js';
	import Loader from '../ui/Loader.svelte';
	import ImageModal from '../ui/ImageModal.svelte';

	export let reportTypeIds = [];
	const reports = writable([]);
	const comments = writable({});
	let newCommentContent = {};

	$: user = $page.data.user;

	let isEditing = false;
	let editingItem = null;
	let editingType = ''; // 'report' eller 'comment'
	let isLoading = false;
	let isOwner = false;

	let showImageModal = false; // Styrer om modal skal vises
	let currentImageSrc = ''; // Kilde for det billede, der skal vises i modal

	function openImageModal(imageSrc) {
		showImageModal = true;
		currentImageSrc = imageSrc;
	}

	function closeImageModal() {
		showImageModal = false;
		currentImageSrc = '';
	}

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
				if (updatedContent.trim() === '') {
					alert('Indholdet kan ikke være tomt.');
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

	onMount(() => {
		function requestReports() {
			socket.emit('get reports', reportTypeIds);
		}

		function requestAllComments() {
			socket.emit('get all comments');
		}

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
				// Opdater rapporter
				reports.update((currentReports) => [
					{
						...newReport,
						report_type_id: reportTypeId,
						user_id: userId
					},
					...currentReports
				]);

				// Opdater kommentarer for den nye rapport
				if (newReport.comments) {
					comments.update((currentComments) => ({
						...currentComments,
						[newReport.id]: newReport.comments
					}));
				}
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
			comments.set(groupedComments); // Initialiser kommentarer for alle rapporter
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
			socket.off('comments');
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
			socket.off('comments');
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

			// Send kun reportTypeIds til backend
			const processedData = await processReportsWithAI(reportTypeIds);

			// Generer AI PDF med det behandlede data
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
</script>

<div class="max-w-3xl mx-auto mt-6 mb-10">
	{#if isLoading}
		<Loader />
	{/if}
	<div class="flex justify-between items-center mb-4">
		<p class="text-2xl font-bold text-gray-800 tracking-wide">Rapporter</p>
		<div class="flex space-x-4">
			<button
				class="px-6 py-2 bg-[#D14343] text-white font-semibold rounded-lg hover:bg-[#B23030] focus:outline-none focus:ring-2 focus:ring-red-400"
				on:click={downloadPDF}
			>
				Download PDF
			</button>
			<button
				class="px-6 py-2 bg-[#D14343] text-white font-semibold rounded-lg hover:bg-[#B23030] focus:outline-none focus:ring-2 focus:ring-red-400"
				on:click={downloadPDFWithAI}
			>
				Download PDF AI
			</button>
		</div>
	</div>

	<div class="report-list overflow-y-auto h-96">
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
										on:keydown={(event) => {
											if (event.key === 'Enter' || event.key === ' ') {
												openImageModal(`data:image/*;base64,${image.image_data}`);
												event.preventDefault();
											}
										}}
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
	/>
</div>
