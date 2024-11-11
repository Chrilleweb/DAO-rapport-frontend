export async function processReportsWithAI(reportsData) {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/openai/process-reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reports: reportsData }),
        credentials: 'include', // Hvis du bruger cookies
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
  