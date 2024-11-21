export async function loginUser({ email, password }) {
	try {
		const response = await fetch('/login', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ email, password }),
			credentials: 'include'
		});

		if (!response.ok) {
			const errorData = await response.json(); // Hent fejlmeddelelsen fra backend
			throw new Error(errorData.message || 'Der opstod en fejl'); // Brug beskeden fra backend
		}

		const data = await response.json();
		return data;
	} catch (error) {
		console.error('Der var et problem med fetch operationen:', error);
		throw error; // Genkaste fejlen, så den kan fanges i handleLogin
	}
}

export async function changePassword({ newPassword, confirmPassword }) {
	try {
		const response = await fetch('/auth/change-password', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ newPassword, confirmPassword }),
			credentials: 'include'
		});

		if (!response.ok) {
			const errorData = await response.json(); // Hent fejlmeddelelsen fra backend
			throw new Error(errorData.message || 'Kunne ikke ændre adgangskode'); // Brug beskeden fra backend
		}

		const data = await response.json();
		return data;
	} catch (error) {
		console.error('Der var et problem med fetch operationen:', error);
		throw error; // Genkaste fejlen, så den kan fanges i handleChangePassword
	}
}

export async function logoutUser() {
	try {
		const response = await fetch('/logout', {
			method: 'GET',
			credentials: 'include'
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.message || 'Kunne ikke logge ud');
		}

		return await response.json();
	} catch (error) {
		console.error('Der var et problem med logud operationen:', error);
		throw error;
	}
}
