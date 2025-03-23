
import Papa from 'papaparse';

export const parseCSV = (file: File): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (!e.target || !e.target.result) {
        reject(new Error('Failed to read CSV file'));
        return;
      }
      
      try {
        const csv = Papa.parse(e.target.result as string, { header: true });
        const emails: string[] = [];
        
        if (csv.data && csv.data.length > 0) {
          csv.data.forEach((row: any) => {
            if (row.email && /\S+@\S+\.\S+/.test(row.email)) {
              emails.push(row.email);
            }
          });
        }
        
        resolve(emails);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    reader.readAsText(file);
  });
};

export const exportSingleResultToCSV = (email: string, result: any) => {
  const data = [{
    email,
    name: result.name || '',
    company: result.company || '',
    position: result.position?.title || '',
    location: result.location || '',
    linkedin: result.linkedin || '',
    twitter: result.twitter || '',
    headline: result.headline || '',
    summary: result.summary || '',
    industry: result.industry || '',
    found: result.found ? 'Yes' : 'No'
  }];
  
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const filename = `email-lookup-${email.replace('@', '-at-')}-${new Date().toISOString().split('T')[0]}.csv`;
  
  saveAs(blob, filename);
};

export const exportBatchResultsToCSV = (results: Record<string, any>) => {
  const data = Object.entries(results).map(([email, result]) => ({
    email,
    name: result.name || '',
    company: result.company || '',
    position: result.position?.title || '',
    location: result.location || '',
    linkedin: result.linkedin || '',
    twitter: result.twitter || '',
    headline: result.headline || '',
    summary: result.summary || '',
    industry: result.industry || '',
    found: result.found ? 'Yes' : 'No'
  }));
  
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const filename = `email-lookups-batch-${new Date().toISOString().split('T')[0]}.csv`;
  
  saveAs(blob, filename);
};

export const convertToCSV = (data: any[]) => {
  // Format data to make it more readable in CSV
  const formattedData = data.map(item => ({
    email: item.email,
    name: item.name || '',
    company: item.company || '',
    position: item.position?.title || '',
    headline: item.headline || '',
    location: item.location || '',
    industry: item.industry || '',
    linkedin: item.linkedin || '',
    twitter: item.twitter || '',
    found: item.found ? 'Yes' : 'No',
    created_at: new Date(item.created_at).toISOString().split('T')[0],
  }));
  
  return Papa.unparse(formattedData);
};

function saveAs(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}
