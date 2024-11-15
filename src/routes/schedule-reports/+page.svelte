<script>
  import { page } from '$app/stores';
  import socket from '$lib/socket';

  let reportContent = '';
  let scheduledDateTime = '';
  $: user = $page.data.user;

  let reportTypeOptions = [
    { label: 'Alle', id: 1 },
    { label: 'UBD', id: 2 },
    { label: 'Pakkeshop', id: 4 },
    { label: 'Indhentning', id: 3 },
    { label: 'Ledelse', id: 5 }
  ];

  let selectedReportTypeId = reportTypeOptions[0].id;

  function submitScheduledReport() {
  if (!reportContent.trim() || !scheduledDateTime) {
    alert('Venligst udfyld både rapportindhold og planlagt tidspunkt.');
    return;
  }

  // Emit event til serveren med de nødvendige data
  socket.emit('schedule report', {
    user_id: Number(user.id),
    content: reportContent.trim(),
    scheduled_time: scheduledDateTime,
    report_type_id: selectedReportTypeId
  });

  // Nulstil formularen
  reportContent = '';
  scheduledDateTime = '';
}
</script>

<div class="max-w-3xl mx-auto">
  <h2 class="text-4xl font-semibold text-center my-6">Planlæg en rapport</h2>

  <form on:submit|preventDefault={submitScheduledReport}>
    <div>
      <label for="reportContent" class="sr-only">Rapportindhold</label>
      <textarea
        id="reportContent"
        bind:value={reportContent}
        placeholder="Planlæg din rapport her..."
        class="w-full h-28 p-4 bg-[#ECE0D1] rounded-lg placeholder-gray-600 text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400"
        required
      ></textarea>
    </div>

    <div class="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      <div>
        <label for="scheduledDateTime" class="block text-gray-700 font-semibold mb-2">
          Planlagt dato og tid:
        </label>
        <input
          id="scheduledDateTime"
          type="datetime-local"
          bind:value={scheduledDateTime}
          class="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label for="reportType" class="block text-gray-700 font-semibold mb-2">
          Vælg rapporttype:
        </label>
        <select
          id="reportType"
          bind:value={selectedReportTypeId}
          class="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          {#each reportTypeOptions as option}
            <option value={option.id}>{option.label}</option>
          {/each}
        </select>
      </div>
    </div>

    <div class="flex justify-end">
      <button
        type="submit"
        class="px-6 py-2 bg-[#D14343] text-white font-semibold rounded-lg hover:bg-[#B23030] focus:outline-none focus:ring-2 focus:ring-red-400"
      >
        Planlæg Rapport
      </button>
    </div>
  </form>
</div>
