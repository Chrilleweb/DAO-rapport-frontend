<script>
    import { changePassword } from '$lib/api/auth';
    import { goto } from '$app/navigation';

    let newPassword = '';
    let confirmPassword = '';
    let message = '';

    async function handleChangePassword() {
        message = '';

        if (newPassword !== confirmPassword) {
            message = "Passwords do not match";
            return;
        }

        try {
            await changePassword({ newPassword, confirmPassword });
            message = "Password changed successfully!";
            goto('/'); 
        } catch (err) {
            message = err.message || 'Der opstod en fejl';
        }
    }
</script>

<div class="flex items-center justify-center min-h-screen">
    <div class="w-full max-w-md bg-white p-8 shadow-lg rounded-lg">
        <h2 class="text-3xl font-bold text-center text-HeaderBg mb-6">Change Password</h2>

        <div class="h-6">
            {#if message}
                <p class="text-red-500 text-center mb-4">{message}</p>
            {/if}
        </div>

        <form on:submit|preventDefault={handleChangePassword} class="space-y-4">
            <div>
                <label for="new-password" class="block text-sm font-medium text-gray-700">New Password</label>
                <input
                    id="new-password"
                    type="password"
                    bind:value={newPassword}
                    class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm transition duration-200"
                    placeholder="Enter new password"
                    required
                />
            </div>

            <div>
                <label for="confirm-password" class="block text-sm font-medium text-gray-700">Confirm Password</label>
                <input
                    id="confirm-password"
                    type="password"
                    bind:value={confirmPassword}
                    class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm transition duration-200"
                    placeholder="Confirm new password"
                    required
                />
            </div>

            <button
                type="submit"
                class="w-full bg-HeaderBg text-white py-2 px-4 rounded-md hover:bg-toggleBg transition duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
            >
                Change Password
            </button>
        </form>
    </div>
</div>
