<script>
    export let message = '';
    export let show = false;
  
    function closeModal() {
      show = false;
    }
  </script>
  
  {#if show}
  <div
    class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
    role="dialog"
    aria-modal="true"
    aria-labelledby="error-modal-title"
    aria-describedby="error-modal-description"
  >
    <div class="bg-white rounded-lg overflow-hidden shadow-xl max-w-sm w-full">
      <div class="p-6 text-center">
        <h2 id="error-modal-title" class="text-2xl font-semibold mb-4 text-HeaderBg">
          Fejl!
        </h2>
        <p id="error-modal-description" class="text-gray-700">{message}</p>
      </div>
      <div class="flex justify-center p-4">
        <button
          class="px-4 py-2 bg-HeaderBg text-white rounded-lg hover:bg-toggleBg focus:outline-none focus:ring-2 focus:ring-red-400"
          on:click={closeModal}
        >
          OK
        </button>
      </div>
    </div>
  </div>
  {/if}
  