<script>
	import CreateReport from '../../lib/components/reports/CreateReport.svelte';
	import ReportList from '../../lib/components/reports/ReportList.svelte';

	const reportTypeIds = [3]; // Indhentning Report type
</script>

<svelte:head>
	<title>Indhentnings Rapport</title>
	<meta name="description" content="Indhentnings rapport side">
</svelte:head>

<div>
	<CreateReport reportType={3} reportTitle="Indhentnings rapport (sidste 24 timer)" />

	<ReportList {reportTypeIds} />
</div>