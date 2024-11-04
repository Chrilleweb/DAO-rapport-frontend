<script>
	import CreateReport from '../lib/components/reports/CreateReport.svelte';
	import ReportList from '../lib/components/reports/ReportList.svelte';

	const reportTypeIds = [1, 2, 3, 4, 5]; // ALLE Report typer
</script>

<div>
	<CreateReport reportType={1} />

	<ReportList {reportTypeIds} />
</div>
