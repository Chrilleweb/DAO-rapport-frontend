export async function processReportsWithAI(reportTypeIds) {
	try {
		const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/openai/process-reports`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ reportTypeIds }),
			credentials: 'include' 
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.message || 'Fejl ved behandling af data med OpenAI.');
		}

		const result = await response.json();
		return result.processedData;
	} catch (error) {
		console.error('Der var et problem med fetch operationen:', error);
		throw error; // Genkaster fejlen, så den kan fanges i komponenten
	}
}

export async function processReportsWithAIDate(reportTypeIds, startDate, endDate) {
	try {
		const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/openai/process-reports-dates`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ reportTypeIds, startDate, endDate }),
			credentials: 'include'
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.message || 'Fejl ved behandling af data med OpenAI.');
		}

		const result = await response.json();
		return result.processedData;
	} catch (error) {
		console.error('Der var et problem med fetch operationen:', error);
		throw error;
	}
}

