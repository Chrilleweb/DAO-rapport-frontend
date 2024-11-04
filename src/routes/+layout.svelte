<script>
	import Header from '../lib/components/ui/Header.svelte';
	import '../styles/app.css';
	import Footer from '../lib/components/ui/Footer.svelte';
	import { page } from '$app/stores';

	const noHeader = ['/login']
</script>

<div class="app">
	{#if !noHeader.includes($page.url.pathname)}
		<Header />
	{/if}

	<main>
		<slot />
	</main>

	<Footer />
</div>
