
import { saveAs } from 'file-saver';

interface LookupResult {
  name: string;
  company: string;
  linkedin?: string;
  twitter?: string;
  found: boolean;
}

// Parse CSV file
export const parseCSV = (file: File): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const csvText = event.target?.result as string;
        const lines = csvText.split(/\r\n|\n/);
        
        // Check if header exists and has "email" field
        const header = lines[0].toLowerCase();
        if (!header.includes('email')) {
          throw new Error('CSV file must have an "email" column');
        }
        
        // Find email column index
        const headerCols = header.split(',');
        const emailColIndex = headerCols.findIndex(col => col.trim() === 'email');
        
        if (emailColIndex === -1) {
          throw new Error('CSV file must have an "email" column');
        }
        
        // Extract emails
        const emails: string[] = [];
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue; // Skip empty lines
          
          const cols = lines[i].split(',');
          if (cols.length > emailColIndex) {
            const email = cols[emailColIndex].trim();
            if (email && /\S+@\S+\.\S+/.test(email)) {
              emails.push(email);
            }
          }
        }
        
        resolve(emails);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
};

// Export single result to CSV
export const exportSingleResultToCSV = (email: string, result: LookupResult) => {
  const headers = ['email', 'name', 'company', 'linkedin', 'twitter', 'found'];
  const data = [
    email,
    result.name || '',
    result.company || '',
    result.linkedin || '',
    result.twitter || '',
    result.found ? 'Yes' : 'No'
  ];
  
  const csvContent = headers.join(',') + '\r\n' + data.join(',');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  saveAs(blob, `email_lookup_${email.replace('@', '_at_')}.csv`);
};

// Export batch results to CSV
export const exportBatchResultsToCSV = (results: Record<string, LookupResult>) => {
  const headers = ['email', 'name', 'company', 'linkedin', 'twitter', 'found'];
  let csvContent = headers.join(',') + '\r\n';
  
  Object.entries(results).forEach(([email, result]) => {
    const row = [
      email,
      result.name || '',
      result.company || '',
      result.linkedin || '',
      result.twitter || '',
      result.found ? 'Yes' : 'No'
    ];
    csvContent += row.join(',') + '\r\n';
  });
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  saveAs(blob, `batch_email_lookup_${new Date().toISOString().slice(0, 10)}.csv`);
};
