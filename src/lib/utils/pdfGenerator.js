import jsPDF from 'jspdf';

export function generateStandardPDF(reports) {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text('Rapporter', 10, 10);

  let yPosition = 20;

  reports.forEach((report, index) => {
    doc.setFontSize(12);
    doc.text(`Rapport ${index + 1}`, 10, yPosition);
    yPosition += 10;
    doc.setFontSize(10);
    doc.text(`Dato: ${report.created_at}`, 10, yPosition);
    yPosition += 10;
    doc.text(`Bruger: ${report.firstname} ${report.lastname}`, 10, yPosition);
    yPosition += 10;
    doc.text(`Type: ${report.report_type}`, 10, yPosition);
    yPosition += 10;
    doc.text(`Indhold:`, 10, yPosition);
    yPosition += 10;

    const splitContent = doc.splitTextToSize(report.content, 180);
    doc.text(splitContent, 10, yPosition);
    yPosition += splitContent.length * 10 + 10;

    if (yPosition > 270) {
      doc.addPage();
      yPosition = 20;
    }
  });

  doc.save('rapporter.pdf');
}

export function generateAIPDF(processedData) {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text('Rapporter (Behandlet med AI)', 10, 15);

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
