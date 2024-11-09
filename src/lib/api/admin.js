export async function fetchAllUsers() {
	try {
		const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/all-users`, {
			method: 'GET',
			credentials: 'include',
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.message || 'Kunne ikke hente brugere');
		}

		return await response.json();
	} catch (error) {
		console.error('Fejl ved hentning af brugere:', error);
		throw error;
	}
}

export async function resetPassword(userId) {
	try {
		const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/reset-password`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ userId }),
			credentials: 'include',
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.message || 'Kunne ikke nulstille adgangskode');
		}

		return await response.json();
	} catch (error) {
		console.error('Fejl ved nulstilling af adgangskode:', error);
		throw error;
	}
}

export async function deleteUser(userId) {
	try {
		const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/delete-user`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ userId }),
			credentials: 'include',
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.message || 'Kunne ikke slette bruger');
		}

		return await response.json();
	} catch (error) {
		console.error('Fejl ved sletning af bruger:', error);
		throw error;
	}
}

export async function updateUserRole(userId, role) {
	try {
		const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/update-role`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ userId, role }),
			credentials: 'include',
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.message || 'Kunne ikke opdatere rolle');
		}

		return await response.json();
	} catch (error) {
		console.error('Fejl ved opdatering af brugerrolle:', error);
		throw error;
	}
}
