<script>
	import CreateReport from '../../lib/components/reports/CreateReport.svelte';
	import ReportList from '../../lib/components/reports/ReportList.svelte';

	const reportTypeIds = [8]; // IT Report type
</script>

<svelte:head>
	<title>Indhentnings Rapport</title>
	<meta name="description" content="IT rapport side">
</svelte:head>

<div>
	<CreateReport reportType={8} reportTitle="IT rapport (sidste 24 timer)" />

	<ReportList {reportTypeIds} />
</div>