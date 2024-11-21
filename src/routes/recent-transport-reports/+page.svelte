<script>
	import CreateReport from '../../lib/components/reports/CreateReport.svelte';
	import ReportList from '../../lib/components/reports/ReportList.svelte';

	const reportTypeIds = [7]; // Transport Report type
</script>

<svelte:head>
	<title>Indhentnings Rapport</title>
	<meta name="description" content="Transport rapport side">
</svelte:head>

<div>
	<CreateReport reportType={7} reportTitle="Transport rapport" />

	<ReportList {reportTypeIds} />
</div>