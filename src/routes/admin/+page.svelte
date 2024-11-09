<script>
	import { fetchAllUsers, resetPassword, deleteUser, updateUserRole } from '$lib/api/admin';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	let users = [];
	let errorMessage = '';
	let successMessage = '';

	$: user = $page.data.user; // Dynamisk tildeling af user fra $page data

	// Hent alle brugere, når komponentet indlæses
	onMount(async () => {
		try {
			users = await fetchAllUsers();
		} catch (error) {
			errorMessage = error.message;
		}
	});

	async function handleResetPassword(userId) {
		try {
			await resetPassword(userId);
			successMessage = 'Adgangskode nulstillet!';
		} catch (error) {
			errorMessage = error.message;
		}
	}

	async function handleDeleteUser(userId) {
		try {
			await deleteUser(userId);
			users = users.filter((user) => user.id !== userId); // Fjern brugeren fra listen
			successMessage = 'Bruger slettet!';
		} catch (error) {
			errorMessage = error.message;
		}
	}

	async function handleUpdateRole(userId, newRole) {
		try {
			await updateUserRole(userId, newRole);
			users = users.map((user) => (user.id === userId ? { ...user, role: newRole } : user));
			successMessage = 'Rolle opdateret!';
		} catch (error) {
			errorMessage = error.message;
		}
	}
</script>

<div class="max-w-5xl mx-auto p-6 bg-gray-100 rounded-lg shadow-md">
	{#if user.role !== 'admin'}
		<h1 class="text-2xl font-bold text-center text-red-600">Du har ikke adgang</h1>
	{:else}
		<h1 class="text-4xl font-bold text-center mb-6">Admin Page</h1>

		{#if errorMessage}
			<p class="text-red-600 font-semibold mb-4">{errorMessage}</p>
		{/if}

		{#if successMessage}
			<p class="text-green-600 font-semibold mb-4">{successMessage}</p>
		{/if}

		<table class="w-full border-collapse border border-gray-300 bg-white">
			<thead>
				<tr class="bg-gray-200">
					<th class="border border-gray-300 p-2">ID</th>
					<th class="border border-gray-300 p-2">Navn</th>
					<th class="border border-gray-300 p-2">Email</th>
					<th class="border border-gray-300 p-2">Rolle</th>
					<th class="border border-gray-300 p-2">Handlinger</th>
				</tr>
			</thead>
			<tbody>
				{#each users as user}
					<tr>
						<td class="border border-gray-300 p-2">{user.id}</td>
						<td class="border border-gray-300 p-2">{user.firstname} {user.lastname}</td>
						<td class="border border-gray-300 p-2">{user.email}</td>
						<td class="border border-gray-300 p-2">{user.role}</td>
						<td class="border border-gray-300 p-2 space-x-2">
							<button
								class="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
								on:click={() => handleResetPassword(user.id)}
							>
								Nulstil adgangskode
							</button>
							<button
								class="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
								on:click={() => handleDeleteUser(user.id)}
							>
								Slet
							</button>
							<select
								class="px-2 py-1 border rounded"
								on:change={(e) => handleUpdateRole(user.id, e.target.value)}
							>
								<option value="user" selected={user.role === 'user'}>Bruger</option>
								<option value="admin" selected={user.role === 'admin'}>Admin</option>
							</select>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>
