<script>
	import { loginUser } from '$lib/api/auth'; // Henter login funktionen fra auth.js
	import { invalidateAll, goto } from '$app/navigation';

	let email = '';
	let password = '';
	let message = '';

	async function handleLogin() {
		message = '';

		try {
			await loginUser({ email, password });
			await invalidateAll(); // re-run alle loads
			goto('/');
		} catch (err) {
			message = err.message || 'Der opstod en fejl';
		}
	}
</script>

<div class="flex items-center justify-center min-h-screen">
	<div class="w-full max-w-md bg-white p-8 shadow-lg rounded-lg">
		<h2 class="text-4xl font-bold text-center text-HeaderBg mb-6">Login</h2>

		<div class="h-6">
			{#if message}
				<p class="text-red-500 text-center">{message}</p>
			{/if}
		</div>

		<form on:submit|preventDefault={handleLogin} class="space-y-4 mt-4">
			<div>
				<label for="email" class="block text-sm font-medium text-gray-700">Email</label>
				<!-- on:input manuel en-vejs synkronisering så den ikke påvirker test og opdatere automatisk -->
				<input
					id="email"
					type="email"
					on:input={(e) => email = e.target.value} 
					class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm transition duration-200"
					placeholder="Indtast din email"
					required
				/>
			</div>

			<div>
				<label for="password" class="block text-sm font-medium text-gray-700">Adgangskode</label>
				<input
					id="password"
					type="password"
					bind:value={password}
					class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm transition duration-200"
					placeholder="Indtast din adgangskode"
					required
				/>
			</div>

			<button
				type="submit"
				class="w-full bg-HeaderBg text-white py-2 px-4 rounded-md hover:bg-toggleBg transition duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
			>
				Log in
			</button>
		</form>
	</div>
</div>
