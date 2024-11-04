export async function load({ locals }) {
    return {
      user: locals.user // Send hele user-objektet til frontend
    };
  }
  
  export const prerender = true;
