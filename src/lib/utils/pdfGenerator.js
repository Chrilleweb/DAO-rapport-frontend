import jsPDF from 'jspdf';

export function generateStandardPDF(reports, reportType) {
	const doc = new jsPDF();

	const headerBgColor = '#E30613';
	const textColor = '#000000';
	const boxBorderColor = '#CCCCCC';
	const boxPadding = 8;
	const pageWidth = 210; // A4 bredde i mm
	const pageHeight = 297; // A4 højde i mm

	// Definér faste billeddimensioner
	const fixedImageWidth = pageWidth - 20; // Juster om nødvendigt
	const fixedImageHeight = 100; // Fast højde i mm

	// Tilføj logo og titel
	const daoPngDataUrl =
		'data:image/png;base64,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';
	const imgWidth = 40;
	const imgHeight = 20;
	const logoX = 150;
	const logoY = 10;

	const title = reportType === 'Samlet' ? 'Døgnrapport Samlet' : `Døgnrapport for ${reportType}`;
	const titleFontSize = 24;
	const titleHeight = titleFontSize * 0.35;

	// Beregn center
	const centerY = logoY + imgHeight / 2 - titleHeight / 2;

	doc.addImage(daoPngDataUrl, 'PNG', logoX, logoY, imgWidth, imgHeight);
	doc.setFontSize(titleFontSize);
	doc.setTextColor(headerBgColor);
	doc.text(title, 10, centerY);

	let yPosition = 40;

	// Beregn boksens højde inkl. kommentarer og billeder
	const calculateBoxHeight = (doc, report, padding) => {
		const splitContent = doc.splitTextToSize(report.content, pageWidth - 40);
		const contentHeight = splitContent.length * 6;

		const imagesHeight = (report.images || []).reduce((acc, image) => {
			return acc + fixedImageHeight + 5; // Fast højde + mellemrum
		}, 0);

		const commentsHeight = (report.comments || []).reduce((acc, comment) => {
			const splitComment = doc.splitTextToSize(comment.content, pageWidth - 60);
			const commentContentHeight = splitComment.length * 6 + 15; // 15 ekstra for navn, dato og mellemrum

			const commentImagesHeight = (comment.images || []).reduce((cAcc, cImage) => {
				return cAcc + fixedImageHeight + 5;
			}, 0);

			return acc + commentContentHeight + commentImagesHeight;
		}, 0);

		return contentHeight + imagesHeight + commentsHeight + 3 * 8 + padding * 2;
	};

	reports.forEach((report) => {
		const estimatedBoxHeight = calculateBoxHeight(doc, report, boxPadding);

		// Tjek sidehøjde
		if (yPosition + estimatedBoxHeight > pageHeight - 20) {
			doc.addPage();
			yPosition = 20;
		}

		// Tegn boks
		const boxStart = yPosition;
		doc.setDrawColor(boxBorderColor);
		doc.rect(10, boxStart, pageWidth - 20, estimatedBoxHeight);

		// Header
		doc.setFillColor(headerBgColor);
		doc.rect(10, boxStart, pageWidth - 20, 10, 'F');
		doc.setFontSize(14);
		doc.setTextColor('#FFFFFF');
		doc.text(`${report.created_at}`, 12, boxStart + 7);

		yPosition += 15;
		doc.setFontSize(12);
		doc.setTextColor(textColor);
		doc.text(`Log: ${report.id}`, 12, yPosition);
		yPosition += 6;
		doc.text(`${report.firstname} ${report.lastname}`, 12, yPosition);
		yPosition += 6;
		doc.text(`${report.report_type}`, 12, yPosition);
		yPosition += 12;

		const splitContent = doc.splitTextToSize(report.content, pageWidth - 40);
		splitContent.forEach((line) => {
			doc.text(line, 12, yPosition);
			yPosition += 6;
		});

		// Tilføj billeder med faste dimensioner
		if (report.images && report.images.length > 0) {
			report.images.forEach((image) => {
				// Hvis billedet ikke passer, opret en ny side
				if (yPosition + fixedImageHeight > pageHeight - 20) {
					doc.addPage();
					yPosition = 20;
				}

				// Tilføj billedet med faste dimensioner
				doc.addImage(
					`data:image/jpeg;base64,${image.image_data}`, // Base64-data
					'JPEG', // Format (ændr til 'PNG', hvis nødvendigt)
					10, // X-position (margin)
					yPosition, // Y-position
					fixedImageWidth, // Fast bredde
					fixedImageHeight // Fast højde
				);

				// Opdater yPosition for næste element
				yPosition += fixedImageHeight + 5; // Tilføj billedhøjde + mellemrum
			});
		}

		// Tilføj kommentarer
		if (report.comments && report.comments.length > 0) {
			yPosition += 5; // Ekstra mellemrum
			doc.setFontSize(12);
			doc.setTextColor(headerBgColor);
			doc.text('Kommentarer:', 12, yPosition);
			yPosition += 8;

			report.comments.forEach((comment) => {
				if (yPosition > pageHeight - 20) {
					doc.addPage();
					yPosition = 20;
				}

				doc.setFontSize(10);
				doc.setTextColor('#000000');
				doc.text(`${comment.firstname} ${comment.lastname} - ${comment.created_at}`, 15, yPosition);
				yPosition += 5;

				const splitComment = doc.splitTextToSize(comment.content, pageWidth - 60);
				splitComment.forEach((line) => {
					doc.text(line, 20, yPosition);
					yPosition += 5;
				});

				// Tilføj billeder for kommentaren med faste dimensioner
				if (comment.images && comment.images.length > 0) {
					comment.images.forEach((image) => {
						const imgWidth = pageWidth - 60; // Mindre bredde for at indrykke under kommentaren
						const imgHeight = fixedImageHeight;

						// Tjek om der er plads på siden
						if (yPosition + imgHeight > pageHeight - 20) {
							doc.addPage();
							yPosition = 20;
						}

						doc.addImage(
							`data:image/jpeg;base64,${image.image_data}`,
							'JPEG',
							30, // Indrykket X-position
							yPosition,
							imgWidth,
							imgHeight
						);

						yPosition += imgHeight + 5; // Opdater yPosition efter billedet
					});
				}

				yPosition += 5; // Ekstra mellemrum mellem kommentarer
			});
		}

		yPosition += boxPadding; // Afstand til næste rapport
	});

	// Gem PDF
	doc.save(`${title}.pdf`);
}

export function generateAIPDF(processedData, reportType) {
	const doc = new jsPDF();

	const headerBgColor = '#E30613';
	const textColor = '#000000';
	const titleFontSize = 24;
	const sectionFontSize = 16;
	const contentFontSize = 12;
	const lineSpacing = 6;

	const daoPngDataUrl =
		'data:image/png;base64,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';
	const imgWidth = 40;
	const imgHeight = 20;
	const logoX = 150; // Placering til højre
	const logoY = 10;
	doc.addImage(daoPngDataUrl, 'PNG', logoX, logoY, imgWidth, imgHeight);

	// Titel
	const title =
		reportType === 'Samlet' ? 'Døgnrapport Samlet (AI)' : `Døgnrapport for ${reportType} (AI)`;
	doc.setFontSize(titleFontSize);
	doc.setTextColor(headerBgColor);
	doc.text(title, 10, 20); // Titel placering

	// Start position til indhold
	let yPosition = 40;

	// Funktion til at tilføje sektionstitler
	const addSectionTitle = (title) => {
		doc.setFontSize(sectionFontSize);
		doc.setTextColor(headerBgColor);
		doc.text(title, 15, yPosition);
		yPosition += lineSpacing;
		doc.setDrawColor(headerBgColor);
		doc.line(15, yPosition, doc.internal.pageSize.getWidth() - 15, yPosition); // Vandret linje
		yPosition += 5; // Ekstra mellemrum
	};

	// Funktion til at tilføje tekst
	const addText = (text) => {
		doc.setFontSize(contentFontSize);
		doc.setTextColor(textColor);
		const wrappedText = doc.splitTextToSize(text, doc.internal.pageSize.getWidth() - 30); // Pak lange linjer
		wrappedText.forEach((line) => {
			if (yPosition > doc.internal.pageSize.getHeight() - 20) {
				doc.addPage();
				yPosition = 20; // Ny side starter øverst
			}
			doc.text(line, 15, yPosition);
			yPosition += lineSpacing;
		});
	};

	// Processér rapportdata
	const sections = processedData.split('\n\n'); // Del op i sektioner baseret på tomme linjer
	sections.forEach((section) => {
		const lines = section.split('\n');
		const title = lines.shift(); // Første linje er sektionstitlen
		addSectionTitle(title);
		lines.forEach((line) => addText(line));
		yPosition += 10; // Ekstra mellemrum mellem sektioner
	});

	// Gem PDF
	doc.save(`${title}.pdf`);
}
