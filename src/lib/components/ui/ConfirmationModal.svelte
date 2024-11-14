<script>
  export let show = false;
  export let title = 'Bekræft handling';
  export let message = 'Er du sikker på, at du vil fortsætte?';
  export let onConfirm = () => {};
  export let onCancel = () => {};

</script>

{#if show}
  <div
    class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
    aria-describedby="modal-description"
  >
    <div class="bg-white rounded-lg overflow-hidden shadow-xl max-w-sm w-full">
      <div class="p-6 text-center">
        <h2 id="modal-title" class="text-2xl font-semibold mb-4 text-HeaderBg">{title}</h2>
        <p id="modal-description" class="text-gray-700">{message}</p>
      </div>
      <div class="flex justify-center p-4 space-x-4">
        <button
          class="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          on:click={onCancel}
        >
          Nej
        </button>
        <button
          class="px-4 py-2 bg-HeaderBg text-white rounded hover:bg-toggleBg"
          on:click={onConfirm}
        >
          Ja
        </button>
      </div>
    </div>
  </div>
{/if}