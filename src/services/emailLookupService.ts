
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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
  user_id: string | null;
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
      .maybeSingle();

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

    console.log('Calling search-profile edge function for email:', email);
    
    // Call the search-profile edge function
    const { data, error } = await supabase.functions.invoke('search-profile', {
      body: { email }
    });

    if (error) {
      console.error('Error looking up email:', error);
      
      // If we got a non-2xx response, check if it contains a specific error message
      if (error.message?.includes('non-2xx status code')) {
        // Log more details about the error response if available
        console.error('Response details:', error);
        
        // The error might contain profile not found or other API errors
        // We'll still insert a record but mark it as not found
        const { data: insertedData, error: insertError } = await supabase
          .from('email_lookups')
          .insert({
            email,
            found: false,
            user_id: null
          })
          .select('*')
          .single();

        if (insertError) {
          toast.error(`Save Error: Failed to save lookup data: ${insertError.message}`);
          return null;
        }
        
        // Show a more descriptive toast based on the error
        toast.error(`No profile found for email: ${email}`);
        return {
          id: insertedData.id,
          email: insertedData.email,
          name: null,
          company: null,
          linkedin: null,
          twitter: null,
          headline: null,
          location: null,
          summary: null,
          photo_url: null,
          position: null,
          education: null,
          industry: null,
          found: false,
          created_at: insertedData.created_at,
          user_id: insertedData.user_id
        };
      }
      
      toast.error(`Lookup Error: ${error.message}`);
      return null;
    }

    console.log('Received response from search-profile:', data);
    
    // Check if profile was found
    if (data.error) {
      console.log('No profile found for email:', email, 'Reason:', data.error, 'Details:', data.details || 'No details provided');
      
      // Still insert a record but mark it as not found
      const { data: insertedData, error: insertError } = await supabase
        .from('email_lookups')
        .insert({
          email,
          found: false,
          user_id: null
        })
        .select('*')
        .single();
        
      if (insertError) {
        console.error('Error saving email lookup data:', insertError);
        toast.error(`Save Error: Failed to save lookup data: ${insertError.message}`);
        return null;
      }
      
      toast.error(`No profile found for email: ${email}${data.details ? ` (${data.details})` : ''}`);
      return {
        id: insertedData.id,
        email: insertedData.email,
        name: null,
        company: null,
        linkedin: null,
        twitter: null,
        headline: null,
        location: null,
        summary: null,
        photo_url: null,
        position: null,
        education: null,
        industry: null,
        found: false,
        created_at: insertedData.created_at,
        user_id: insertedData.user_id
      };
    }

    console.log('Profile found:', data);
    
    // Insert the result into the database
    const { data: insertedData, error: insertError } = await supabase
      .from('email_lookups')
      .insert({
        email,
        name: data.name || null,
        company: data.company || null,
        linkedin: data.linkedInUrl || null, // Note the property name change
        twitter: data.twitter || null,
        headline: data.headline || null,
        location: data.location || null,
        summary: data.summary || null,
        photo_url: data.photoUrl || null,
        position: null, // We don't have detailed position data in our implementation
        education: null, // We don't have education data in our implementation
        industry: data.industry || null,
        found: data.found || false,
        user_id: null
      })
      .select('*')
      .single();

    if (insertError) {
      console.error('Error saving email lookup data:', insertError);
      toast.error(`Save Error: Failed to save lookup data: ${insertError.message}`);
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
    toast.error(error instanceof Error ? error.message : 'Unknown error occurred');
    return null;
  }
};

export const lookupEmailBatch = async (emails: string[]): Promise<Record<string, any>> => {
  try {
    const results: Record<string, any> = {};
    
    // Process emails in batches to avoid overwhelming the server
    const batchSize = 5;
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      
      // Process each email in the current batch
      await Promise.all(batch.map(async (email) => {
        try {
          // Check if email exists in DB first
          const { data: existingData } = await supabase
            .from('email_lookups')
            .select('*')
            .eq('email', email)
            .single();

          if (existingData) {
            results[email] = {
              name: existingData.name,
              company: existingData.company,
              linkedin: existingData.linkedin,
              twitter: existingData.twitter,
              headline: existingData.headline,
              location: existingData.location,
              summary: existingData.summary,
              photoUrl: existingData.photo_url,
              position: existingData.position,
              education: existingData.education,
              industry: existingData.industry,
              found: existingData.found
            };
            return;
          }

          // Call the search-profile edge function
          const { data, error } = await supabase.functions.invoke('search-profile', {
            body: { email }
          });

          if (error) {
            console.error('Error looking up email:', error);
            results[email] = { found: false };
            return;
          }
          
          // Check if profile was found
          if (data.error) {
            // Insert record marked as not found
            await supabase
              .from('email_lookups')
              .insert({
                email,
                found: false,
                user_id: null
              });
            
            results[email] = { found: false };
            return;
          }

          // Insert the result into the database
          await supabase
            .from('email_lookups')
            .insert({
              email,
              name: data.name || null,
              company: data.company || null,
              linkedin: data.linkedInUrl || null, // Note the property name change
              twitter: data.twitter || null,
              headline: data.headline || null,
              location: data.location || null,
              summary: data.summary || null,
              photo_url: data.photoUrl || null,
              position: null,
              education: null,
              industry: data.industry || null,
              found: data.found || false,
              user_id: null
            });

          results[email] = {
            name: data.name,
            company: data.company,
            linkedin: data.linkedInUrl, // Note the property name change
            twitter: data.twitter,
            headline: data.headline,
            location: data.location,
            summary: data.summary,
            photoUrl: data.photoUrl,
            position: null,
            education: null,
            industry: data.industry,
            found: data.found
          };
        } catch (error) {
          console.error(`Error processing email ${email}:`, error);
          results[email] = { found: false };
        }
      }));
      
      // Add a small delay between batches to prevent rate limiting
      if (i + batchSize < emails.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  } catch (error) {
    console.error('Error in batch email lookup:', error);
    toast.error(error instanceof Error ? error.message : 'An unexpected error occurred');
    return {};
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
    toast.error(error instanceof Error ? error.message : 'Failed to fetch recent lookups');
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
      toast.info('No Data: There are no records to export.');
      return;
    }

    const csvData = convertToCSV(data);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, `email-lookups-${new Date().toISOString().split('T')[0]}.csv`);

    toast.success(`Export Successful: ${data.length} records exported to CSV.`);
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    toast.error(error instanceof Error ? error.message : 'Failed to export data');
  }
};
