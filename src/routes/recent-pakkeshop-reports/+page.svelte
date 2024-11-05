<script>
	import CreateReport from '../../lib/components/reports/CreateReport.svelte';
	import ReportList from '../../lib/components/reports/ReportList.svelte';

	const reportTypeIds = [4]; // Pakkeshop Report type
</script>

<svelte:head>
	<title>Pakkeshop Rapport</title>
	<meta name="description" content="Pakkeshop rapport side">
</svelte:head>

<div>
	<CreateReport reportType={4} reportTitle="Pakkeshop rapport" />

	<ReportList {reportTypeIds} />
</div>