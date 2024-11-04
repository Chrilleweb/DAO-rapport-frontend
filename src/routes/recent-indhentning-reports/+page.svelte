<script>
	import CreateReport from '../../lib/components/reports/CreateReport.svelte';
	import ReportList from '../../lib/components/reports/ReportList.svelte';

	const reportTypeIds = [3]; // Indhentning Report type
</script>

<div>
	<CreateReport reportType={3} reportTitle="Indhentnings rapport" />

	<ReportList {reportTypeIds} />
</div>