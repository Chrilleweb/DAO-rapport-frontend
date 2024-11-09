<script>
	import { registerUser } from '$lib/api/admin';
	import { page } from '$app/stores';
	import ErrorAdmin from '../../lib/components/errorPages/ErrorAdmin.svelte';

	let firstname = '';
	let lastname = '';
	let email = '';
	let successMessage = '';
	let errorMessage = '';

	$: user = $page.data.user;

	async function handleSubmit(event) {
		event.preventDefault();
		successMessage = '';
		errorMessage = '';

		try {
			const response = await registerUser(firstname, lastname, email);
			successMessage = response.message;
			firstname = '';
			lastname = '';
			email = '';
		} catch (error) {
			errorMessage = error.message;
		}
	}
</script>

{#if user.role !== 'admin'}
	<ErrorAdmin />
{:else}
	<div class="container mx-auto py-8 max-w-lg">
		<h1 class="text-3xl text-center text-HeaderBg mb-6">Opret ny bruger</h1>

		<div class="mb-6 min-h-16">
			{#if errorMessage}
				<div
					class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 text-center"
					role="alert"
				>
					<p>{errorMessage}</p>
				</div>
			{/if}

			{#if successMessage}
				<div
					class="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 text-center"
					role="alert"
				>
					<p>{successMessage}</p>
				</div>
			{/if}
		</div>

		<form on:submit={handleSubmit} class="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
			<div class="mb-4">
				<label class="block text-gray-700 text-sm font-bold mb-2" for="firstname">Fornavn</label>
				<input
					class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
					id="firstname"
					type="text"
					bind:value={firstname}
					required
				/>
			</div>

			<div class="mb-4">
				<label class="block text-gray-700 text-sm font-bold mb-2" for="lastname">Efternavn</label>
				<input
					class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
					id="lastname"
					type="text"
					bind:value={lastname}
					required
				/>
			</div>

			<div class="mb-4">
				<label class="block text-gray-700 text-sm font-bold mb-2" for="email">Email</label>
				<input
					class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
					id="email"
					type="email"
					bind:value={email}
					required
				/>
			</div>

			<div class="flex items-center justify-between">
				<button
					class="bg-HeaderBg hover:bg-toggleBg text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
					type="submit"
				>
					Opret Bruger
				</button>
			</div>
		</form>
	</div>
{/if}
