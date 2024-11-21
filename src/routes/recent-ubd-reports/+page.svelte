<script>
	import CreateReport from '../../lib/components/reports/CreateReport.svelte';
	import ReportList from '../../lib/components/reports/ReportList.svelte';

	const reportTypeIds = [2]; // UBD Report type
</script>

<svelte:head>
	<title>UBD Rapport</title>
	<meta name="description" content="UBD rapport side">
</svelte:head>

<div>
	<CreateReport reportType={2} reportTitle="UBD rapport (sidste 24 timer)" />

	<ReportList {reportTypeIds} />
</div>