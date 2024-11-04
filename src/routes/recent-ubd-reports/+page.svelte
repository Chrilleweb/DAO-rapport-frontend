<script>
	import CreateReport from '../../lib/components/reports/CreateReport.svelte';
	import ReportList from '../../lib/components/reports/ReportList.svelte';

	const reportTypeIds = [2]; // UBD Report type
</script>

<div>
	<CreateReport reportType={2} reportTitle="UBD rapport" />

	<ReportList {reportTypeIds} />
</div>