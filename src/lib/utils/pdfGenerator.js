import jsPDF from 'jspdf';

export function generateStandardPDF(reports, reportType) {
	const doc = new jsPDF();

	const title = reportType === 'Samlet' ? 'Døgnrapport Samlet' : `Døgnrapport for ${reportType}`;
	doc.setFontSize(18);
	doc.text(title, 10, 10);

	let yPosition = 20;
	const pageHeight = 297; // Højden på A4-papir i mm (standard for jsPDF)

	reports.forEach((report) => {
		const boxPadding = 8;
		const estimatedBoxHeight = calculateBoxHeight(doc, report, boxPadding);

		// Tjek, om der er plads til hele boksen på siden
		if (yPosition + estimatedBoxHeight > pageHeight - 20) {
			doc.addPage();
			yPosition = 20;
		}

		// Start en ny boks
		const boxStart = yPosition;

		// Indhold i boksen
		yPosition += boxPadding;
		doc.setFontSize(16);
		doc.text(report.created_at, 12, yPosition); // Dato og tid
		yPosition += 8;
        doc.setFontSize(12);
		doc.text(`${report.firstname} ${report.lastname}`, 12, yPosition); // Bruger
		yPosition += 8;
		doc.text(report.report_type, 12, yPosition); // Rapporttype
		yPosition += 8;
		doc.text('Indhold:', 12, yPosition); // Indhold
		yPosition += 8;

		const splitContent = doc.splitTextToSize(report.content, 180);
		splitContent.forEach((line) => {
			doc.text(line, 12, yPosition);
			yPosition += 6;
		});

		yPosition += boxPadding;

		// Tegn boksen
		const boxHeight = yPosition - boxStart;
		doc.rect(10, boxStart, 190, boxHeight);

		// Tjek om vi skal tilføje en ny side til næste rapport
		if (yPosition > pageHeight - 20) {
			doc.addPage();
			yPosition = 20;
		}
	});

	doc.save('rapporter.pdf');
}

// Funktion til at beregne højden af en boks baseret på indholdet
function calculateBoxHeight(doc, report, boxPadding) {
	const contentLines = doc.splitTextToSize(report.content, 180);
	const contentHeight = contentLines.length * 6; // Hver linje får 6 mm højde
	const fixedHeight = 26; // Højden af faste felter som dato, navn osv.
	return fixedHeight + contentHeight + boxPadding * 2; // Total højde
}

export function generateAIPDF(processedData, reportType) {
	const doc = new jsPDF();

	const title =
		reportType === 'Samlet'
			? 'Døgnrapport Samlet (Behandlet med AI)'
			: `Døgnrapport for ${reportType} (Behandlet med AI)`;
	doc.setFontSize(18);
	doc.text(title, 10, 15);

	let yPosition = 30;

	const splitContent = processedData.split('\n');
	splitContent.forEach((line) => {
		if (yPosition > 270) {
			doc.addPage();
			yPosition = 20;
		}

		if (line.startsWith('- ')) {
			doc.setFontSize(12);
			doc.text(line, 15, yPosition);
		} else if (line.startsWith('  ')) {
			doc.setFontSize(10);
			doc.text(line, 25, yPosition);
		} else {
			doc.setFontSize(14);
			doc.text(line, 10, yPosition);
		}

		yPosition += 8;
	});

	doc.save('rapporter_ai.pdf');
}
