<script>
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faUser, faTruck, faNewspaper, faSignOutAlt, faBox, faFlag, faUserTie, faCogs, faUserPlus, faBackward, faCalendarDays, faServer } from '@fortawesome/free-solid-svg-icons';
	import { logoutUser } from '$lib/api/auth';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	$: user = $page.data.user;

	let menuItems = [
		{ name: 'Samlet rapport', link: '/', icon: faFlag },
		{ name: 'UBD', link: '/recent-ubd-reports', icon: faNewspaper },
		{ name: 'Pakkeshop', link: '/recent-pakkeshop-reports', icon: faBox },
		{ name: 'Indhentning', link: '/recent-indhentning-reports', icon: faTruck },
		{ name: 'Ledelse', link: '/recent-ledelse-reports', icon: faUserTie },
		{ name: 'EKL', link: '/recent-EKL-reports', icon: faTruck },
		{ name: 'Transport', link: '/recent-transport-reports', icon: faTruck },
		{ name: 'IT', link: '/recent-IT-reports', icon: faServer },
		{ name: 'Tidl. rapporter', link: '/previous-reports', icon: faBackward },
		{ name: 'Plan. rapporter', link: '/schedule-reports', icon: faCalendarDays },
		// Admin page 
		{ name: 'Admin', link: '/admin', icon: faCogs, roles: ['admin'] },
		{ name: 'Opret bruger', link: '/register', icon: faUserPlus, roles: ['admin'] }
	];

	async function handleLogout() {
		try {
			await logoutUser();
			goto('/login');
		} catch (error) {
			console.error('Kunne ikke logge ud:', error);
		}
	}
</script>

<div class="flex z-50">
	<aside class="bg-HeaderBg w-48 p-4 fixed h-full flex flex-col space-y-4">
		<h1 class="text-5xl font-bold text-white text-center">DAO</h1>
		<nav class="flex flex-col space-y-2 flex-grow">
			{#each menuItems as item}
				{#if !item.roles || item.roles.includes(user?.role)}
					<a
						href={item.link}
						class="text-white p-2 rounded hover:bg-toggleBg flex items-center space-x-2"
					>
						<FontAwesomeIcon icon={item.icon} class="h-5 w-5 text-white" />
						<span>{item.name}</span>
					</a>
				{/if}
			{/each}
		</nav>
		<div class="flex items-center space-x-2 mt-4 p-2 bg-toggleBg rounded shadow">
			<FontAwesomeIcon icon={faUser} class="h-5 w-5 text-white" />
			<span class="text-white font-medium text-xs">{user.firstname} {user.lastname}</span>
		</div>
		<button
			on:click={handleLogout}
			class="text-white p-2 rounded hover:bg-toggleBg flex items-center space-x-2 mt-auto"
		>
			<FontAwesomeIcon icon={faSignOutAlt} class="h-5 w-5 text-white" />
			<span>Log ud</span>
		</button>
	</aside>
</div>
