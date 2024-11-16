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
    aria-labelledby="success-modal-title"
    aria-describedby="success-modal-description"
  >
    <div class="bg-white rounded-lg overflow-hidden shadow-xl max-w-sm w-full">
      <div class="p-6 text-center">
        <h2 id="success-modal-title" class="text-2xl font-semibold mb-4 text-green-700">
          Success!
        </h2>
        <p id="success-modal-description" class="text-gray-700">{message}</p>
      </div>
      <div class="flex justify-center p-4">
        <button
          class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400"
          on:click={closeModal}
        >
          OK
        </button>
      </div>
    </div>
  </div>
  {/if}
  