/**
 * Utility functions for exporting data to CSV and JSON formats
 */

export function exportToJSON(data: any[], filename: string) {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToCSV(data: any[], filename: string, columns?: string[]) {
  if (data.length === 0) {
    return;
  }

  // Get headers from first object or use provided columns
  const headers = columns || Object.keys(data[0]);
  
  // Create CSV header row
  const csvHeaders = headers.join(',');
  
  // Create CSV data rows
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      
      // Handle different data types
      if (value === null || value === undefined) {
        return '';
      }
      
      // Convert objects/arrays to JSON string
      if (typeof value === 'object') {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }
      
      // Escape commas and quotes in strings
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      
      return value;
    }).join(',');
  });
  
  // Combine header and rows
  const csv = [csvHeaders, ...csvRows].join('\n');
  
  // Create and download file
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function formatDataForExport(data: any[]) {
  return data.map(item => {
    // Create a flat object for better CSV export
    const formatted: any = {};
    
    Object.keys(item).forEach(key => {
      const value = item[key];
      
      // Keep primitives as-is
      if (typeof value !== 'object' || value === null) {
        formatted[key] = value;
      } else if (Array.isArray(value)) {
        // Convert arrays to comma-separated strings
        formatted[key] = value.join('; ');
      } else {
        // Keep objects as JSON for CSV, will be stringified
        formatted[key] = value;
      }
    });
    
    return formatted;
  });
}

export function downloadBackup(data: {
  organizers: any[];
  events: any[];
  tickets: any[];
  settings: any;
}) {
  const backup = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    data: data
  };
  
  const jsonString = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `gopass_backup_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function parseBackupFile(file: File): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const backup = JSON.parse(content);
        
        // Validate backup structure
        if (!backup.version || !backup.timestamp || !backup.data) {
          throw new Error('Invalid backup file format');
        }
        
        if (!backup.data.organizers || !backup.data.events || !backup.data.tickets) {
          throw new Error('Backup file is missing required data');
        }
        
        resolve(backup);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
}
