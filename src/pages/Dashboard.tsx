
import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { lookupEmail, lookupEmailBatch } from '@/services/emailLookupService';
import { parseCSV, exportSingleResultToCSV, exportBatchResultsToCSV } from '@/utils/csvUtils';
import { Search, Upload, Download, ExternalLink, FileText, Check, User, Briefcase, MapPin, FileText as FileIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface LookupResult {
  name: string;
  company: string;
  linkedin?: string;
  twitter?: string;
  headline?: string;
  location?: string;
  summary?: string;
  photoUrl?: string;
  position?: any;
  education?: any;
  industry?: string;
  found: boolean;
}

const Dashboard = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  
  // Single email lookup state
  const [email, setEmail] = useState('');
  const [searchResult, setSearchResult] = useState<LookupResult | null>(null);
  const [searching, setSearching] = useState(false);
  
  // Bulk processing state
  const [isUploading, setIsUploading] = useState(false);
  const [batchResults, setBatchResults] = useState<Record<string, LookupResult> | null>(null);
  const [uploadedEmails, setUploadedEmails] = useState<string[]>([]);
  const [fileName, setFileName] = useState('');
  const [dragActive, setDragActive] = useState(false);
  
  // Single email lookup
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      toast.error(t('Invalid email format'));
      return;
    }
    
    setSearching(true);
    setSearchResult(null);
    
    try {
      const result = await lookupEmail(email);
      setSearchResult(result);
    } catch (error) {
      console.error(error);
      toast.error(t('Something went wrong'));
    } finally {
      setSearching(false);
    }
  };
  
  // Export single result
  const handleExportSingle = () => {
    if (email && searchResult) {
      exportSingleResultToCSV(email, searchResult);
      toast.success(t('Exported successfully'));
    }
  };
  
  // Handle CSV upload
  const handleFileUpload = async (file: File) => {
    if (!file || file.type !== 'text/csv') {
      toast.error(t('File must be a CSV'));
      return;
    }
    
    setIsUploading(true);
    setBatchResults(null);
    setFileName(file.name);
    
    try {
      const emails = await parseCSV(file);
      setUploadedEmails(emails);
      
      if (emails.length === 0) {
        toast.error(t('No valid emails found in the CSV'));
        setIsUploading(false);
        return;
      }
      
      const results = await lookupEmailBatch(emails);
      setBatchResults(results);
      toast.success(t('Processing complete'));
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : t('Something went wrong'));
    } finally {
      setIsUploading(false);
    }
  };
  
  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };
  
  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  // Handle file drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };
  
  // Export batch results
  const handleExportBatch = () => {
    if (batchResults) {
      exportBatchResultsToCSV(batchResults);
      toast.success(t('Exported successfully'));
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">{t('Dashboard')}</h1>
      <p className="text-muted-foreground">{t('Welcome')}, {user?.name}.</p>
      
      <Tabs defaultValue="single" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="single">{t('Single Email Lookup')}</TabsTrigger>
          <TabsTrigger value="bulk">{t('Bulk Email Processing')}</TabsTrigger>
        </TabsList>
        
        {/* Single Email Lookup Tab */}
        <TabsContent value="single">
          <div className="grid gap-6">
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle>{t('Single Email Lookup')}</CardTitle>
                <CardDescription>
                  {t('Enter an email address to find contact details')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSearch} className="flex space-x-2">
                  <Input
                    type="email"
                    placeholder={t('Enter email address')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1"
                    disabled={searching}
                  />
                  <Button type="submit" disabled={searching}>
                    {searching ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        {t('Processing...')}
                      </div>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        {t('Search')}
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
            
            {searchResult && (
              <Card className="border-none shadow-md animate-slide-in-bottom">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>{t('Search Results')}</CardTitle>
                    <CardDescription>{email}</CardDescription>
                  </div>
                  <Button variant="outline" onClick={handleExportSingle}>
                    <Download className="mr-2 h-4 w-4" />
                    {t('Export')}
                  </Button>
                </CardHeader>
                <CardContent>
                  {searchResult.found ? (
                    <div className="space-y-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={searchResult.photoUrl} />
                          <AvatarFallback>{searchResult.name ? searchResult.name.substring(0, 2).toUpperCase() : 'UN'}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <h3 className="text-xl font-semibold">{searchResult.name}</h3>
                          {searchResult.headline && (
                            <p className="text-muted-foreground">{searchResult.headline}</p>
                          )}
                          {searchResult.location && (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <MapPin className="mr-2 h-4 w-4" />
                              {searchResult.location}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {searchResult.summary && (
                        <div className="space-y-2">
                          <div className="text-sm font-medium">{t('Summary')}</div>
                          <p className="text-sm text-muted-foreground">{searchResult.summary}</p>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {searchResult.company && (
                          <div className="space-y-2">
                            <div className="text-sm font-medium flex items-center">
                              <Briefcase className="mr-2 h-4 w-4" />
                              {t('Company')}
                            </div>
                            <div>
                              <div className="font-medium">{searchResult.company}</div>
                              {searchResult.industry && (
                                <div className="text-sm text-muted-foreground">{searchResult.industry}</div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {searchResult.position && (
                          <div className="space-y-2">
                            <div className="text-sm font-medium">{t('Current Position')}</div>
                            <div>
                              <div className="font-medium">{searchResult.position.title}</div>
                              <div className="text-sm text-muted-foreground">
                                {searchResult.position.companyName}
                                {searchResult.position.startEndDate?.start?.year && (
                                  <> • Since {searchResult.position.startEndDate.start.year}</>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {searchResult.education && (
                        <div className="space-y-2">
                          <div className="text-sm font-medium flex items-center">
                            <FileIcon className="mr-2 h-4 w-4" />
                            {t('Education')}
                          </div>
                          <div>
                            <div className="font-medium">{searchResult.education.schoolName}</div>
                            {(searchResult.education.startEndDate?.start?.year || searchResult.education.startEndDate?.end?.year) && (
                              <div className="text-sm text-muted-foreground">
                                {searchResult.education.startEndDate?.start?.year && searchResult.education.startEndDate?.end?.year 
                                  ? `${searchResult.education.startEndDate.start.year} - ${searchResult.education.startEndDate.end.year}`
                                  : searchResult.education.startEndDate?.start?.year 
                                    ? `Since ${searchResult.education.startEndDate.start.year}`
                                    : searchResult.education.startEndDate?.end?.year 
                                      ? `Until ${searchResult.education.startEndDate.end.year}`
                                      : ''
                                }
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <div className="text-sm font-medium">{t('Social Profiles')}</div>
                        <div className="flex flex-wrap gap-3">
                          {searchResult.linkedin && (
                            <a
                              href={searchResult.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center text-primary hover:underline"
                            >
                              <ExternalLink className="mr-2 h-4 w-4" />
                              {t('LinkedIn')}
                            </a>
                          )}
                          {searchResult.twitter && (
                            <a
                              href={searchResult.twitter}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center text-primary hover:underline"
                            >
                              <ExternalLink className="mr-2 h-4 w-4" />
                              {t('Twitter')}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="text-muted-foreground">{t('No results found')}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        
        {/* Bulk Email Processing Tab */}
        <TabsContent value="bulk">
          <div className="grid gap-6">
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle>{t('Bulk Email Processing')}</CardTitle>
                <CardDescription>
                  {t('Upload a CSV file with email addresses to process in bulk')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center ${
                    dragActive ? 'border-primary bg-primary/5' : 'border-muted'
                  }`}
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                >
                  <Input
                    type="file"
                    id="file-upload"
                    accept=".csv"
                    onChange={handleFileInputChange}
                    disabled={isUploading}
                    className="hidden"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex flex-col items-center justify-center cursor-pointer"
                  >
                    {isUploading ? (
                      <div className="flex flex-col items-center justify-center">
                        <div className="loader mb-4" />
                        <p className="text-lg font-medium">{t('Processing...')}</p>
                        <p className="text-sm text-muted-foreground">{fileName}</p>
                      </div>
                    ) : fileName ? (
                      <div className="flex flex-col items-center justify-center">
                        <FileText className="h-12 w-12 text-primary mb-4" />
                        <p className="text-lg font-medium">
                          <Check className="inline h-4 w-4 mr-1 text-green-500" />
                          {t('Uploaded')}
                        </p>
                        <p className="text-sm text-muted-foreground">{fileName}</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center">
                        <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-lg font-medium">{t('Drop CSV file here or click to upload')}</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          {t('CSV file should have an "email" column')}
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </CardContent>
            </Card>
            
            {batchResults && Object.keys(batchResults).length > 0 && (
              <Card className="border-none shadow-md animate-slide-in-bottom">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>{t('Results')}</CardTitle>
                    <CardDescription>
                      {t('Found')}: {Object.values(batchResults).filter(r => r.found).length} / {Object.keys(batchResults).length}
                    </CardDescription>
                  </div>
                  <Button variant="outline" onClick={handleExportBatch}>
                    <Download className="mr-2 h-4 w-4" />
                    {t('Export All')}
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-md overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-muted">
                            <th className="text-left p-3 font-medium text-muted-foreground">{t('Email')}</th>
                            <th className="text-left p-3 font-medium text-muted-foreground">{t('Name')}</th>
                            <th className="text-left p-3 font-medium text-muted-foreground">{t('Company')}</th>
                            <th className="text-left p-3 font-medium text-muted-foreground">{t('Position')}</th>
                            <th className="text-left p-3 font-medium text-muted-foreground">{t('Location')}</th>
                            <th className="text-left p-3 font-medium text-muted-foreground">{t('Social Profiles')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(batchResults).map(([email, result]) => (
                            <tr key={email} className="border-t">
                              <td className="p-3">{email}</td>
                              <td className="p-3">{result.found ? result.name : '-'}</td>
                              <td className="p-3">{result.found ? result.company : '-'}</td>
                              <td className="p-3">{result.found && result.position ? result.position.title : '-'}</td>
                              <td className="p-3">{result.found ? result.location : '-'}</td>
                              <td className="p-3">
                                <div className="flex space-x-2">
                                  {result.linkedin && (
                                    <a
                                      href={result.linkedin}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center text-primary hover:underline"
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </a>
                                  )}
                                  {result.twitter && (
                                    <a
                                      href={result.twitter}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center text-primary hover:underline"
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </a>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
