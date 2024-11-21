<script>
	import CreateReport from '../../lib/components/reports/CreateReport.svelte';
	import ReportList from '../../lib/components/reports/ReportList.svelte';

	const reportTypeIds = [6]; // EKL Report type
</script>

<svelte:head>
	<title>Indhentnings Rapport</title>
	<meta name="description" content="EKL rapport side">
</svelte:head>

<div>
	<CreateReport reportType={6} reportTitle="EKL rapport" />

	<ReportList {reportTypeIds} />
</div>