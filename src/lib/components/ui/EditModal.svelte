<script>
    export let show = false;
    export let title = '';
    export let content = '';
    export let onSave = () => {};
    export let onCancel = () => {};
    export let placeholder = '';
    let updatedContent = content;
  
    // Opdater 'updatedContent', når 'content' ændrer sig
    $: if (show) {
      updatedContent = content;
    }
  </script>
  
  {#if show}
    <div
      class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
      role="dialog"
      aria-modal="true"
    >
      <div class="bg-white rounded-lg overflow-hidden shadow-xl max-w-md w-full">
        <div class="p-6">
          <h2 class="text-2xl font-semibold mb-4 text-center">{title}</h2>
          <textarea
            class="w-full h-40 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
            placeholder={placeholder}
            bind:value={updatedContent}
          ></textarea>
        </div>
        <div class="flex justify-end p-4 space-x-4">
          <button
            class="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            on:click={() => onCancel()}
          >
            Annuller
          </button>
          <button
            class="px-4 py-2 bg-HeaderBg text-white rounded hover:bg-toggleBg"
            on:click={() => onSave(updatedContent)}
          >
            Gem
          </button>
        </div>
      </div>
    </div>
  {/if}
  