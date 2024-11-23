<script>
	import { fetchAllUsers, resetPassword, deleteUser, updateUserRole } from '$lib/api/admin';
	import { onMount } from 'svelte';
	import ConfirmationModal from '../../lib/components/ui/ConfirmationModal.svelte';
	import { page } from '$app/stores';
	import ErrorAdmin from '../../lib/components/errorPages/ErrorAdmin.svelte';

	let users = [];
	let errorMessage = '';
	let successMessage = '';

	let userToModify = null;
	let modalAction = '';
	let modalMessage = '';
	let showModal = false;

	$: user = $page.data.user;

	onMount(async () => {
		try {
			users = await fetchAllUsers();
		} catch (error) {
			errorMessage = error.message;
		}
	});

	function openModal(action, selectedUser) {
		userToModify = selectedUser;
		modalAction = action;
		if (action === 'delete') {
			modalMessage = `Er du sikker på, at du vil slette brugeren ${selectedUser.firstname} ${selectedUser.lastname}?`;
		} else if (action === 'reset') {
			modalMessage = `Er du sikker på, at du vil nulstille adgangskoden for ${selectedUser.firstname} ${selectedUser.lastname}?`;
		}
		showModal = true;
	}

	function closeModal() {
		showModal = false;
		userToModify = null;
		modalAction = '';
		modalMessage = '';
	}

	async function confirmAction() {
		if (modalAction === 'delete') {
			await handleDeleteUser(userToModify);
		} else if (modalAction === 'reset') {
			await handleResetPassword(userToModify);
		}
		closeModal();
	}

	async function handleResetPassword(user) {
		try {
			await resetPassword(user.id);
			successMessage = `Adgangskode nulstillet for ${user.firstname} ${user.lastname}!`;
		} catch (error) {
			errorMessage = error.message;
		}
	}

	async function handleDeleteUser(user) {
		try {
			await deleteUser(user.id);
			users = users.filter((u) => u.id !== user.id);
			successMessage = `${user.firstname} ${user.lastname} er blevet slettet!`;
		} catch (error) {
			errorMessage = error.message;
		}
	}

	async function handleUpdateRole(userId, newRole) {
		try {
			await updateUserRole(userId, newRole);
			users = users.map((user) => (user.id === userId ? { ...user, role: newRole } : user));
			let updatedUser = users.find((user) => user.id === userId);
			successMessage = `Rolle opdateret for ${updatedUser.firstname} ${updatedUser.lastname}!`;
		} catch (error) {
			errorMessage = error.message;
		}
	}
</script>

<div class="max-w-7xl mx-auto p-8 ml-48">
	{#if user.role !== 'admin'}
	<ErrorAdmin />
	{:else}
		<h1 class="text-4xl font-bold text-center mb-8 text-HeaderBg">Administrationspanel</h1>

		<div class="mb-6 min-h-16">
			{#if errorMessage}
				<div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 text-center" role="alert">
					<p>{errorMessage}</p>
				</div>
			{:else if successMessage}
				<div
					class="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 text-center"
					role="alert"
				>
					<p>{successMessage}</p>
				</div>
			{/if}
		</div>

		<div class="overflow-x-auto">
			<table class="min-w-full bg-white shadow-md rounded-lg">
				<thead>
					<tr class="bg-HeaderBg text-white">
						<th class="w-2/12 text-left py-3 px-4 uppercase font-semibold text-sm">Navn</th>
						<th class="w-3/12 text-left py-3 px-4 uppercase font-semibold text-sm">Email</th>
						<th class="w-2/12 text-left py-3 px-4 uppercase font-semibold text-sm">Rolle</th>
						<th class="w-4/12 text-left py-3 px-4 uppercase font-semibold text-sm">Handlinger</th>
					</tr>
				</thead>
				<tbody class="text-gray-700">
					{#each users as user, index}
						<tr class="{index % 2 === 0 ? 'bg-gray-100' : 'bg-white'} hover:bg-gray-200">
							<td class="text-left py-3 px-4">{user.firstname} {user.lastname}</td>
							<td class="text-left py-3 px-4">{user.email}</td>
							<td class="text-left py-3 px-4 capitalize">{user.role}</td>
							<td class="text-left py-3 px-4 space-x-2">
								<button
									class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
									on:click={() => openModal('reset', user)}
								>
									Nulstil adgangskode
								</button>
								<button
									class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
									on:click={() => openModal('delete', user)}
								>
									Slet
								</button>
								<select
									class="px-4 py-2 border rounded"
									on:change={(e) => handleUpdateRole(user.id, e.target.value)}
									value={user.role}
								>
									<option value="user">User</option>
									<option value="admin">Admin</option>
								</select>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<ConfirmationModal
			bind:show={showModal}
			title="Bekræft handling"
			message={modalMessage}
			onConfirm={confirmAction}
			onCancel={closeModal}
		/>
	{/if}
</div>
