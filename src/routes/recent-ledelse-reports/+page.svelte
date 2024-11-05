<script>
	import CreateReport from '../../lib/components/reports/CreateReport.svelte';
	import ReportList from '../../lib/components/reports/ReportList.svelte';

	const reportTypeIds = [5]; // Ledelse Report type
</script>

<svelte:head>
	<title>Ledelses Rapport</title>
	<meta name="description" content="Ledelses rapport side">
</svelte:head>

<div>
	<CreateReport reportType={5} reportTitle="Ledelses rapport" />

	<ReportList {reportTypeIds} />
</div>