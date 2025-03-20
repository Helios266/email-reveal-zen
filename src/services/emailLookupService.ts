
import { supabase } from "@/integrations/supabase/client";

interface EmailLookupResult {
  name: string;
  company: string;
  linkedin?: string;
  twitter?: string;
  found: boolean;
}

// Function to lookup an email using the Reverse Contact API via our Edge Function
export const lookupEmail = async (email: string): Promise<EmailLookupResult> => {
  try {
    // First, check if we already have this email in our database
    const { data: existingLookup } = await supabase
      .from('email_lookups')
      .select('*')
      .eq('email', email)
      .single();
    
    if (existingLookup) {
      console.log('Found existing lookup in database:', existingLookup);
      return {
        name: existingLookup.name || '',
        company: existingLookup.company || '',
        linkedin: existingLookup.linkedin || undefined,
        twitter: existingLookup.twitter || undefined,
        found: existingLookup.found
      };
    }
    
    // Call our Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('email-lookup', {
      method: 'POST',
      body: { email }
    });

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(error.message);
    }

    console.log('API lookup result:', data);
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Store the result in our database for future reference
    const { error: insertError } = await supabase
      .from('email_lookups')
      .insert({
        email,
        name: data.name,
        company: data.company,
        linkedin: data.linkedin,
        twitter: data.twitter,
        found: data.found,
        user_id: user.id
      });
    
    if (insertError) {
      console.error('Error storing lookup result:', insertError);
    }
    
    return data as EmailLookupResult;
  } catch (error) {
    console.error('Email lookup error:', error);
    // Return not found on error
    return {
      name: '',
      company: '',
      found: false
    };
  }
};

// Function to process a batch of emails
export const lookupEmailBatch = async (emails: string[]): Promise<Record<string, EmailLookupResult>> => {
  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // First, check which emails we already have in our database
    const { data: existingLookups } = await supabase
      .from('email_lookups')
      .select('*')
      .in('email', emails);
    
    // Create a map of existing lookups
    const existingResults: Record<string, EmailLookupResult> = {};
    if (existingLookups) {
      existingLookups.forEach(lookup => {
        existingResults[lookup.email] = {
          name: lookup.name || '',
          company: lookup.company || '',
          linkedin: lookup.linkedin || undefined,
          twitter: lookup.twitter || undefined,
          found: lookup.found
        };
      });
    }
    
    // Filter out emails we already have
    const emailsToLookup = emails.filter(email => !existingResults[email]);
    
    if (emailsToLookup.length === 0) {
      console.log('All emails already in database');
      return existingResults;
    }
    
    // Process emails in batches of 10
    const results: Record<string, EmailLookupResult> = { ...existingResults };
    
    // Process in chunks of 10
    for (let i = 0; i < emailsToLookup.length; i += 10) {
      const batch = emailsToLookup.slice(i, i + 10);
      
      // Call our Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('email-lookup', {
        method: 'POST',
        body: { emails: batch }
      });

      if (error) {
        console.error('Edge function error for batch:', error);
        // Fill in not found for the remaining emails
        batch.forEach(email => {
          if (!results[email]) {
            results[email] = {
              name: '',
              company: '',
              found: false
            };
          }
        });
        continue;
      }
      
      // Merge the results
      Object.assign(results, data);
      
      // Store the results in our database
      const dataToInsert = Object.entries(data as Record<string, EmailLookupResult>).map(([email, result]) => ({
        email,
        name: result.name,
        company: result.company,
        linkedin: result.linkedin,
        twitter: result.twitter,
        found: result.found,
        user_id: user.id
      }));
      
      if (dataToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('email_lookups')
          .insert(dataToInsert);
        
        if (insertError) {
          console.error('Error storing batch results:', insertError);
        }
      }
    }
    
    return results;
  } catch (error) {
    console.error('Batch lookup error:', error);
    
    // Return not found for all emails on error
    const results: Record<string, EmailLookupResult> = {};
    emails.forEach(email => {
      results[email] = {
        name: '',
        company: '',
        found: false
      };
    });
    
    return results;
  }
};
