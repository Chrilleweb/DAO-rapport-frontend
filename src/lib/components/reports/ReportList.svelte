<script>
	import { onMount, onDestroy } from 'svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faEdit } from '@fortawesome/free-solid-svg-icons';
	import { writable } from 'svelte/store';
	import socket from '$lib/socket';
	import { page } from '$app/stores';

	export let reportTypeIds = [];
	const reports = writable([]);

	let user;
	$: user = $page.data.user;

	let isEditing = false;
	let editingReport = null;
	let updatedContent = '';

	function openEditModal(report) {
		isEditing = true;
		editingReport = report;
		updatedContent = report.content;
	}

	function closeEditModal() {
		isEditing = false;
		editingReport = null;
		updatedContent = '';
	}

	function handleEditSubmit() {
		if (updatedContent.trim() === '') {
			alert('Indholdet kan ikke være tomt.');
			return;
		}

		socket.emit('edit report', {
			reportId: editingReport.id,
			userId: Number(user.id),
			updatedContent: updatedContent.trim()
		});
		closeEditModal();
	}

	onMount(() => {
		function requestReports() {
			socket.emit('get reports', reportTypeIds);
		}

		if (socket.connected) {
			requestReports();
		} else {
			socket.on('connect', () => {
				requestReports();
			});
		}

		// Listen for previous reports
		socket.on('previous reports', (pReports) => {
			const reportsWithNumberIds = pReports.map((report) => ({
				...report,
				report_type_id: Number(report.report_type_id),
				user_id: Number(report.user_id)
			}));
			reports.set(reportsWithNumberIds);
		});

		// Listen for new reports
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

		// Listen for updated reports
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

		// Handle edit errors
		socket.on('edit error', (error) => {
			console.error('Edit error:', error);
		});

		return () => {
			socket.off('connect');
			socket.off('new report');
			socket.off('previous reports');
			socket.off('update report');
			socket.off('edit error');
		};
	});

	onDestroy(() => {
		if (socket) {
			socket.off('connect');
			socket.off('new report');
			socket.off('previous reports');
			socket.off('update report');
			socket.off('edit error');
		}
	});
</script>

<div class="max-w-2xl mx-auto mt-6 mb-10">
	<div class="flex justify-between items-center mb-4">
		<h2 class="text-3xl font-semibold">Rapporter</h2>
		<div class="flex space-x-4">
			<button
				class="px-6 py-2 bg-[#D14343] text-white font-semibold rounded-lg hover:bg-[#B23030] focus:outline-none focus:ring-2 focus:ring-red-400"
			>
				Sidste 24 timer
			</button>
			<button
				class="px-6 py-2 bg-[#D14343] text-white font-semibold rounded-lg hover:bg-[#B23030] focus:outline-none focus:ring-2 focus:ring-red-400"
			>
				Download PDF
			</button>
		</div>
	</div>

	<div class="report-list overflow-y-auto h-96">
		{#if $reports.length > 0}
			<ul>
				{#each $reports as report}
					<li class="bg-[#ECE0D1] py-6 px-6 rounded-lg shadow-md mb-4 flex flex-col">
						<div class="flex justify-between items-center mb-4">
							<div class="text-gray-600 text-base flex gap-5">
								<p>{report.created_at}</p>
								<p>{report.firstname} {report.lastname}</p>
							</div>

							<div class="text-gray-600 text-base">
								<p>{report.report_type}</p>
							</div>
						</div>

						<p class="text-gray-800 whitespace-pre-wrap text-lg flex-grow">
							{report.content || 'Ingen indhold tilgængeligt'}
						</p>

						{#if report.user_id === Number(user.id)}
							<div class="flex justify-end">
								<button
									class="text-gray-600 hover:text-gray-800 focus:outline-none"
									on:click={() => openEditModal(report)}
								>
									<FontAwesomeIcon icon={faEdit} class="h-6 w-6" />
								</button>
							</div>
						{/if}
					</li>
				{/each}
			</ul>
		{:else}
			<p class="text-center text-lg">Ingen rapporter tilgængelige</p>
		{/if}
	</div>

	<!-- Redigeringsmodal -->
	{#if isEditing}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
			<div class="bg-white p-8 rounded-lg w-11/12 max-w-lg shadow-xl">
				<h2 class="text-2xl font-semibold mb-4 text-HeaderBg text-center">Rediger Rapport</h2>
				<textarea
					class="w-full h-40 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-HeaderBg"
					bind:value={updatedContent}
					placeholder="Rediger rapportens indhold her..."
				></textarea>
				<div class="flex justify-end mt-4 space-x-2">
					<button
						class="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
						on:click={closeEditModal}
					>
						Annuller
					</button>
					<button
						class="px-4 py-2 bg-HeaderBg text-white rounded-lg hover:bg-toggleBg focus:outline-none focus:ring-2 focus:ring-[#004B8D]"
						on:click={handleEditSubmit}
					>
						Gem
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
