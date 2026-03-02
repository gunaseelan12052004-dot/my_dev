// utils/xmlDownload.js

// Escape XML special characters
const escapeXML = (text) => {
  if (!text) return '';
  return text.toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

// Helper function to download file
const downloadFile = (content, fileName, type = 'application/xml') => {
  const blob = new Blob([content], { type });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
  
  return fileName;
};

// Format date for filename
const getFormattedDate = () => {
  const date = new Date();
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
};

// Microsoft XML Format - Excel/MS Office compatible
export const downloadMicrosoftXML = (doctors) => {
  // XML declaration
  let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xmlContent += '<?mso-application progid="Excel.Sheet"?>\n'; // This makes it open in Excel
  xmlContent += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n';
  xmlContent += '  xmlns:o="urn:schemas-microsoft-com:office:office"\n';
  xmlContent += '  xmlns:x="urn:schemas-microsoft-com:office:excel"\n';
  xmlContent += '  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"\n';
  xmlContent += '  xmlns:html="http://www.w3.org/TR/REC-html40">\n';

  // Document Properties
  xmlContent += '  <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">\n';
  xmlContent += `    <Author>Hospital Management System</Author>\n`;
  xmlContent += `    <Created>${new Date().toISOString()}</Created>\n`;
  xmlContent += `    <Company>Hospital</Company>\n`;
  xmlContent += "  </DocumentProperties>\n";

  // Excel Workbook styles
  xmlContent += "  <Styles>\n";
  xmlContent += '    <Style ss:ID="Default" ss:Name="Normal">\n';
  xmlContent += '      <Alignment ss:Vertical="Bottom"/>\n';
  xmlContent += "      <Borders/>\n";
  xmlContent += '      <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>\n';
  xmlContent += "      <Interior/>\n";
  xmlContent += "      <NumberFormat/>\n";
  xmlContent += "      <Protection/>\n";
  xmlContent += "    </Style>\n";

  // Header style
  xmlContent += '    <Style ss:ID="Header">\n';
  xmlContent += '      <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="12" ss:Color="#FFFFFF" ss:Bold="1"/>\n';
  xmlContent += '      <Interior ss:Color="#4472C4" ss:Pattern="Solid"/>\n';
  xmlContent += '      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>\n';
  xmlContent += "    </Style>\n";

  // Status styles
  xmlContent += '    <Style ss:ID="Active">\n';
  xmlContent += '      <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#006100"/>\n';
  xmlContent += '      <Interior ss:Color="#C6EFCE" ss:Pattern="Solid"/>\n';
  xmlContent += "    </Style>\n";

  xmlContent += '    <Style ss:ID="Inactive">\n';
  xmlContent += '      <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#9C0006"/>\n';
  xmlContent += '      <Interior ss:Color="#FFC7CE" ss:Pattern="Solid"/>\n';
  xmlContent += "    </Style>\n";

  xmlContent += '    <Style ss:ID="Pending">\n';
  xmlContent += '      <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#9C5700"/>\n';
  xmlContent += '      <Interior ss:Color="#FFEB9C" ss:Pattern="Solid"/>\n';
  xmlContent += "    </Style>\n";
  xmlContent += "  </Styles>\n";

  // Worksheet starts here
  xmlContent += '  <Worksheet ss:Name="Doctors List">\n';
  xmlContent += "    <Table>\n";

  // Column widths
  xmlContent += '      <Column ss:Width="100"/> <!-- Doctor ID -->\n';
  xmlContent += '      <Column ss:Width="200"/> <!-- Name -->\n';
  xmlContent += '      <Column ss:Width="150"/> <!-- Specialization -->\n';
  xmlContent += '      <Column ss:Width="200"/> <!-- Email -->\n';
  xmlContent += '      <Column ss:Width="120"/> <!-- Phone -->\n';
  xmlContent += '      <Column ss:Width="100"/> <!-- Status -->\n';
  xmlContent += '      <Column ss:Width="120"/> <!-- Registered Date -->\n';

  // Header Row
  xmlContent += "      <Row>\n";
  xmlContent += '        <Cell ss:StyleID="Header"><Data ss:Type="String">Doctor ID</Data></Cell>\n';
  xmlContent += '        <Cell ss:StyleID="Header"><Data ss:Type="String">Doctor Name</Data></Cell>\n';
  xmlContent += '        <Cell ss:StyleID="Header"><Data ss:Type="String">Specialization</Data></Cell>\n';
  xmlContent += '        <Cell ss:StyleID="Header"><Data ss:Type="String">Email</Data></Cell>\n';
  xmlContent += '        <Cell ss:StyleID="Header"><Data ss:Type="String">Phone</Data></Cell>\n';
  xmlContent += '        <Cell ss:StyleID="Header"><Data ss:Type="String">Status</Data></Cell>\n';
  xmlContent += '        <Cell ss:StyleID="Header"><Data ss:Type="String">Registered Date</Data></Cell>\n';
  xmlContent += "      </Row>\n";

  // Data Rows
  doctors.forEach((doctor) => {
    // Determine status style
    let statusStyle = "";
    if (doctor.status === "Active") statusStyle = "Active";
    else if (doctor.status === "Inactive") statusStyle = "Inactive";
    else if (doctor.status === "Pending") statusStyle = "Pending";

    xmlContent += "      <Row>\n";
    xmlContent += `        <Cell><Data ss:Type="String">${escapeXML(doctor.doctor_id)}</Data></Cell>\n`;
    xmlContent += `        <Cell><Data ss:Type="String">Dr. ${escapeXML(doctor.name)}</Data></Cell>\n`;
    xmlContent += `        <Cell><Data ss:Type="String">${escapeXML(doctor.specialization)}</Data></Cell>\n`;
    xmlContent += `        <Cell><Data ss:Type="String">${escapeXML(doctor.email)}</Data></Cell>\n`;
    xmlContent += `        <Cell><Data ss:Type="String">${escapeXML(doctor.phone || "")}</Data></Cell>\n`;
    xmlContent += `        <Cell ss:StyleID="${statusStyle}"><Data ss:Type="String">${escapeXML(doctor.status)}</Data></Cell>\n`;

    // Format date if available
    let regDate = "";
    if (doctor.created_at) {
      regDate = new Date(doctor.created_at).toLocaleDateString("en-CA");
    }
    xmlContent += `        <Cell><Data ss:Type="String">${regDate}</Data></Cell>\n`;
    xmlContent += "      </Row>\n";
  });

  // Add summary row
  xmlContent += "      <Row>\n";
  xmlContent += '        <Cell ss:Index="7" ss:StyleID="Header"><Data ss:Type="String">Total Doctors:</Data></Cell>\n';
  xmlContent += `        <Cell><Data ss:Type="Number">${doctors.length}</Data></Cell>\n`;
  xmlContent += "      </Row>\n";

  xmlContent += "    </Table>\n";
  xmlContent += "  </Worksheet>\n";

  // Add summary worksheet
  xmlContent += '  <Worksheet ss:Name="Summary">\n';
  xmlContent += "    <Table>\n";
  xmlContent += '      <Column ss:Width="200"/>\n';
  xmlContent += '      <Column ss:Width="150"/>\n';

  // Summary Header
  xmlContent += "      <Row>\n";
  xmlContent += '        <Cell ss:StyleID="Header"><Data ss:Type="String">Statistics</Data></Cell>\n';
  xmlContent += '        <Cell ss:StyleID="Header"><Data ss:Type="String">Count</Data></Cell>\n';
  xmlContent += "      </Row>\n";

  // Summary Data
  const activeCount = doctors.filter((d) => d.status === "Active").length;
  const inactiveCount = doctors.filter((d) => d.status === "Inactive").length;
  const pendingCount = doctors.filter((d) => d.status === "Pending").length;

  xmlContent += "      <Row>\n";
  xmlContent += '        <Cell><Data ss:Type="String">Total Doctors</Data></Cell>\n';
  xmlContent += `        <Cell><Data ss:Type="Number">${doctors.length}</Data></Cell>\n`;
  xmlContent += "      </Row>\n";

  xmlContent += "      <Row>\n";
  xmlContent += '        <Cell><Data ss:Type="String">Active Doctors</Data></Cell>\n';
  xmlContent += `        <Cell><Data ss:Type="Number">${activeCount}</Data></Cell>\n`;
  xmlContent += "      </Row>\n";

  xmlContent += "      <Row>\n";
  xmlContent += '        <Cell><Data ss:Type="String">Inactive Doctors</Data></Cell>\n';
  xmlContent += `        <Cell><Data ss:Type="Number">${inactiveCount}</Data></Cell>\n`;
  xmlContent += "      </Row>\n";

  xmlContent += "      <Row>\n";
  xmlContent += '        <Cell><Data ss:Type="String">Pending Doctors</Data></Cell>\n';
  xmlContent += `        <Cell><Data ss:Type="Number">${pendingCount}</Data></Cell>\n`;
  xmlContent += "      </Row>\n";

  xmlContent += "      <Row>\n";
  xmlContent += '        <Cell><Data ss:Type="String">Generated Date</Data></Cell>\n';
  xmlContent += `        <Cell><Data ss:Type="String">${new Date().toLocaleString()}</Data></Cell>\n`;
  xmlContent += "      </Row>\n";

  xmlContent += "    </Table>\n";
  xmlContent += "  </Worksheet>\n";

  xmlContent += "</Workbook>";

  // Download the file
  const fileName = `Hospital_Doctors_List_${getFormattedDate()}.xml`;
  downloadFile(xmlContent, fileName, 'application/xml');
  
  return fileName;
};