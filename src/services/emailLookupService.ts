
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { saveAs } from 'file-saver';
import { convertToCSV } from '@/utils/csvUtils';

interface EmailLookupResult {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
  linkedin: string | null;
  twitter: string | null;
  found: boolean;
  created_at: string;
  user_id: string;
  // New fields
  headline: string | null;
  location: string | null;
  summary: string | null;
  photo_url: string | null;
  position: any | null;
  education: any | null;
  industry: string | null;
}

export const lookupEmail = async (email: string): Promise<EmailLookupResult | null> => {
  try {
    // Check if email exists in DB first
    const { data: existingData } = await supabase
      .from('email_lookups')
      .select('*')
      .eq('email', email)
      .single();

    if (existingData) {
      console.log('Found existing email lookup:', existingData);
      return {
        id: existingData.id,
        email: existingData.email,
        name: existingData.name,
        company: existingData.company,
        linkedin: existingData.linkedin,
        twitter: existingData.twitter,
        headline: existingData.headline,
        location: existingData.location,
        summary: existingData.summary,
        photo_url: existingData.photo_url,
        position: existingData.position,
        education: existingData.education,
        industry: existingData.industry,
        found: existingData.found,
        created_at: existingData.created_at,
        user_id: existingData.user_id
      };
    }

    // If not in DB, call the edge function
    const user = supabase.auth.getUser();
    const userId = (await user).data.user?.id;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Call the edge function
    const { data, error } = await supabase.functions.invoke('email-lookup', {
      body: { email }
    });

    if (error) {
      console.error('Error looking up email:', error);
      toast({
        title: 'Lookup Error',
        description: `Failed to lookup email: ${error.message}`,
        variant: 'destructive',
      });
      return null;
    }

    // Insert the result into the database
    const { data: insertedData, error: insertError } = await supabase
      .from('email_lookups')
      .insert({
        email,
        name: data.name || null,
        company: data.company || null,
        linkedin: data.linkedin || null,
        twitter: data.twitter || null,
        headline: data.headline || null,
        location: data.location || null,
        summary: data.summary || null,
        photo_url: data.photoUrl || null,
        position: data.position || null,
        education: data.education || null,
        industry: data.industry || null,
        found: data.found || false,
        user_id: userId
      })
      .select('*')
      .single();

    if (insertError) {
      console.error('Error saving email lookup data:', insertError);
      toast({
        title: 'Save Error',
        description: `Failed to save lookup data: ${insertError.message}`,
        variant: 'destructive',
      });
      return null;
    }

    return {
      id: insertedData.id,
      email: insertedData.email,
      name: insertedData.name,
      company: insertedData.company,
      linkedin: insertedData.linkedin,
      twitter: insertedData.twitter,
      headline: insertedData.headline,
      location: insertedData.location,
      summary: insertedData.summary,
      photo_url: insertedData.photo_url,
      position: insertedData.position,
      education: insertedData.education,
      industry: insertedData.industry,
      found: insertedData.found,
      created_at: insertedData.created_at,
      user_id: insertedData.user_id
    };
  } catch (error) {
    console.error('Unexpected error in lookupEmail:', error);
    toast({
      title: 'Lookup Error',
      description: error instanceof Error ? error.message : 'Unknown error occurred',
      variant: 'destructive',
    });
    return null;
  }
};

export const getRecentLookups = async (limit = 10): Promise<EmailLookupResult[]> => {
  try {
    const { data, error } = await supabase
      .from('email_lookups')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return data.map(item => ({
      id: item.id,
      email: item.email,
      name: item.name,
      company: item.company,
      linkedin: item.linkedin,
      twitter: item.twitter,
      headline: item.headline,
      location: item.location,
      summary: item.summary,
      photo_url: item.photo_url,
      position: item.position,
      education: item.education,
      industry: item.industry,
      found: item.found,
      created_at: item.created_at,
      user_id: item.user_id
    }));
  } catch (error) {
    console.error('Error fetching recent lookups:', error);
    toast({
      title: 'Fetch Error',
      description: error instanceof Error ? error.message : 'Failed to fetch recent lookups',
      variant: 'destructive',
    });
    return [];
  }
};

export const exportToCSV = async () => {
  try {
    const { data, error } = await supabase
      .from('email_lookups')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    if (data.length === 0) {
      toast({
        title: 'No Data',
        description: 'There are no records to export.',
        variant: 'default',
      });
      return;
    }

    const csvData = convertToCSV(data);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, `email-lookups-${new Date().toISOString().split('T')[0]}.csv`);

    toast({
      title: 'Export Successful',
      description: `${data.length} records exported to CSV.`,
      variant: 'default',
    });
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    toast({
      title: 'Export Error',
      description: error instanceof Error ? error.message : 'Failed to export data',
      variant: 'destructive',
    });
  }
};
