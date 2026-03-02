// utils/csvDownload.js

// Escape CSV special characters
const escapeCSV = (text) => {
  if (!text) return "";
  // If text contains comma, newline or quotes, wrap in quotes and escape quotes
  if (text.includes(",") || text.includes("\n") || text.includes('"')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

// Helper function to download file
const downloadFile = (content, fileName, type = 'text/csv;charset=utf-8;') => {
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

// Simple CSV Download
export const downloadDoctorsCSV = (doctors) => {
  // CSV headers
  let csvContent = "Doctor ID,Name,Specialization,Email,Phone,Status,Registered Date\n";

  // Add each doctor as a row
  doctors.forEach((doctor) => {
    // Format date if available
    let regDate = "";
    if (doctor.created_at) {
      regDate = new Date(doctor.created_at).toLocaleDateString("en-CA");
    }

    const row = [
      escapeCSV(doctor.doctor_id),
      escapeCSV(`Dr. ${doctor.name}`),
      escapeCSV(doctor.specialization),
      escapeCSV(doctor.email),
      escapeCSV(doctor.phone || ""),
      escapeCSV(doctor.status),
      escapeCSV(regDate),
    ].join(",");

    csvContent += row + "\n";
  });

  // Add summary rows at the bottom
  csvContent += "\n";
  csvContent += `Total Doctors,,${doctors.length}\n`;

  const activeCount = doctors.filter((d) => d.status === "Active").length;
  const inactiveCount = doctors.filter((d) => d.status === "Inactive").length;
  const pendingCount = doctors.filter((d) => d.status === "Pending").length;

  csvContent += `Active Doctors,,${activeCount}\n`;
  csvContent += `Inactive Doctors,,${inactiveCount}\n`;
  csvContent += `Pending Doctors,,${pendingCount}\n`;
  csvContent += `Generated Date,,${new Date().toLocaleString()}\n`;

  // Download the file
  const fileName = `Doctors_List_${getFormattedDate()}.csv`;
  downloadFile(csvContent, fileName);
  
  return fileName;
};

// Advanced CSV with more details
export const downloadDoctorsCSVAdvanced = (doctors) => {
  // Headers with more columns
  let csvContent = "S.No,Doctor ID,Name,Specialization,Email,Phone,Status,Registered Date,Last Updated\n";

  doctors.forEach((doctor, index) => {
    let regDate = "";
    let updatedDate = "";

    if (doctor.created_at) {
      regDate = new Date(doctor.created_at).toLocaleDateString("en-CA");
    }
    if (doctor.updated_at) {
      updatedDate = new Date(doctor.updated_at).toLocaleDateString("en-CA");
    }

    const row = [
      index + 1,
      escapeCSV(doctor.doctor_id),
      escapeCSV(`Dr. ${doctor.name}`),
      escapeCSV(doctor.specialization),
      escapeCSV(doctor.email),
      escapeCSV(doctor.phone || ""),
      escapeCSV(doctor.status),
      escapeCSV(regDate),
      escapeCSV(updatedDate),
    ].join(",");

    csvContent += row + "\n";
  });

  // Add statistics section
  csvContent += "\n";
  csvContent += "STATISTICS\n";
  csvContent += `Total Doctors,${doctors.length}\n`;

  const activeCount = doctors.filter((d) => d.status === "Active").length;
  const inactiveCount = doctors.filter((d) => d.status === "Inactive").length;
  const pendingCount = doctors.filter((d) => d.status === "Pending").length;

  csvContent += `Active Doctors,${activeCount}\n`;
  csvContent += `Inactive Doctors,${inactiveCount}\n`;
  csvContent += `Pending Doctors,${pendingCount}\n`;

  // Specialization wise count
  const specCount = {};
  doctors.forEach((doctor) => {
    specCount[doctor.specialization] = (specCount[doctor.specialization] || 0) + 1;
  });

  csvContent += "\nSPECIALIZATION WISE\n";
  Object.entries(specCount).forEach(([spec, count]) => {
    csvContent += `${spec},${count}\n`;
  });

  csvContent += `\nGenerated On,${new Date().toLocaleString()}`;

  // Download the file
  const fileName = `Hospital_Doctors_Detailed_${getFormattedDate()}.csv`;
  downloadFile(csvContent, fileName);
  
  return fileName;
};