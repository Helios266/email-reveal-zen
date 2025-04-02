
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json"
};

// Regular expression to extract LinkedIn URLs
const linkedInUrlRegex = /https:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9\-\_\.]+\/?/g;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    // Parse request body
    const requestData = await req.json();
    
    if (req.method !== "POST" || !requestData || !requestData.email) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid request. Please provide an email address in the request body." 
        }),
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }

    const email = requestData.email;
    console.log(`Looking up profile for email: ${email}`);
    
    // Get Supabase credentials from environment variables for caching
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    // Initialize Supabase client for caching
    if (supabaseUrl && supabaseAnonKey) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      // Check cache first
      const { data: cachedProfile } = await supabase
        .from("email_lookups")
        .select("*")
        .eq("email", email)
        .single();
        
      if (cachedProfile && cachedProfile.found) {
        console.log(`Found cached profile for email: ${email}`);
        return new Response(
          JSON.stringify({
            name: cachedProfile.name,
            headline: cachedProfile.headline,
            linkedInUrl: cachedProfile.linkedin,
            company: cachedProfile.company,
            location: cachedProfile.location,
            photoUrl: cachedProfile.photo_url,
            summary: cachedProfile.summary,
            twitter: cachedProfile.twitter,
            industry: cachedProfile.industry,
            found: true
          }),
          { 
            status: 200,
            headers: corsHeaders
          }
        );
      }
    }
    
    // For testing purposes, return a mock profile for test@example.com
    if (email === "test@example.com") {
      return new Response(
        JSON.stringify({
          name: "Test User",
          headline: "Software Developer at Test Company",
          linkedInUrl: "https://www.linkedin.com/in/testuser",
          company: "Test Company",
          location: "San Francisco, CA",
          photoUrl: "https://randomuser.me/api/portraits/men/1.jpg",
          summary: "Experienced software developer with a passion for building great products.",
          twitter: "https://twitter.com/testuser",
          industry: "Software Development",
          found: true
        }),
        { 
          status: 200,
          headers: corsHeaders
        }
      );
    }
    
    // Get the API key from environment variables
    const apiKey = Deno.env.get("REVERSECONTACT_API_KEY");
    
    if (!apiKey) {
      console.error("Missing REVERSECONTACT_API_KEY environment variable");
      return new Response(
        JSON.stringify({ 
          error: "Server configuration error: Missing API key" 
        }),
        { 
          status: 500,
          headers: corsHeaders
        }
      );
    }
    
    // Try ReverseContact API first
    try {
      // Make API request to ReverseContact API
      const response = await fetch("https://api.reversecontact.com/enrichment/linkedin", {
        method: "POST",
        headers: {
          "X-Api-Key": apiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data && data.data && data.data.name) {
          // Map the API response to our expected format
          const profileData = {
            name: data.data.name || null,
            headline: data.data.headline || null,
            linkedInUrl: data.data.linkedin_url || null,
            company: data.data.company || null,
            location: data.data.location || null,
            photoUrl: data.data.photo_url || null,
            summary: data.data.summary || null,
            twitter: data.data.twitter || null,
            industry: data.data.industry || null,
            found: true
          };
          
          // Store to cache if Supabase client is available
          if (supabaseUrl && supabaseAnonKey) {
            try {
              const supabase = createClient(supabaseUrl, supabaseAnonKey);
              // Check if email exists in cache
              const { data: existingData, error: fetchError } = await supabase
                .from("email_lookups")
                .select("id")
                .eq("email", email);
                
              if (!fetchError && existingData && existingData.length === 0) {
                // Insert new record if it doesn't exist
                await supabase
                  .from("email_lookups")
                  .insert({
                    email,
                    name: profileData.name,
                    company: profileData.company,
                    linkedin: profileData.linkedInUrl,
                    twitter: profileData.twitter,
                    headline: profileData.headline,
                    location: profileData.location,
                    summary: profileData.summary,
                    photo_url: profileData.photoUrl,
                    industry: profileData.industry,
                    found: true
                  });
              }
            } catch (cacheError) {
              console.error("Error caching profile:", cacheError);
            }
          }
          
          // Return the profile data
          return new Response(
            JSON.stringify(profileData),
            { 
              status: 200,
              headers: corsHeaders
            }
          );
        }
      }
      
      // If we get here, the API didn't return a valid profile
      console.log("ReverseContact API didn't find a profile, trying fallback search...");
    } catch (apiError) {
      console.error("Error calling ReverseContact API:", apiError);
      // Continue to fallback method if API fails
    }
    
    // Fallback web search method if API returns no results or fails
    // Generate search queries
    const searchQueries = [
      `"${email}" "linkedin.com/in"`,
      `"${email}" linkedin`,
      `"${email.replace("@", "[at]")}" linkedin profile`
    ];
    
    // Get the Google API key and search engine ID from environment variables
    const googleApiKey = Deno.env.get("GOOGLE_API_KEY");
    const googleCx = Deno.env.get("GOOGLE_CX");
    
    if (!googleApiKey || !googleCx) {
      console.error("Missing Google search API credentials");
      return new Response(
        JSON.stringify({ 
          error: "Profile not found and fallback search is not configured" 
        }),
        { 
          status: 404,
          headers: corsHeaders
        }
      );
    }
    
    let linkedInUrl = null;
    let linkedInData = null;
    
    // Try each search query until we find a LinkedIn profile
    for (const query of searchQueries) {
      console.log(`Trying search query: ${query}`);
      
      try {
        // Call Google Custom Search API
        const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCx}&q=${encodeURIComponent(query)}`;
        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();
        
        console.log(`Search results for "${query}":`, JSON.stringify(searchData.items?.length ?? 0));
        
        // Check if we have search results
        if (searchData.items && searchData.items.length > 0) {
          // Look for LinkedIn profile URLs in the search results
          for (const item of searchData.items) {
            // Check in the link
            if (item.link && item.link.includes("linkedin.com/in/")) {
              linkedInUrl = item.link;
              break;
            }
            
            // Check in the snippet
            if (item.snippet) {
              const matches = item.snippet.match(linkedInUrlRegex);
              if (matches && matches.length > 0) {
                linkedInUrl = matches[0];
                break;
              }
            }
          }
          
          if (linkedInUrl) {
            console.log(`Found LinkedIn URL: ${linkedInUrl}`);
            break;
          }
        }
      } catch (searchError) {
        console.error(`Error searching with query "${query}":`, searchError);
        // Continue with next query if one fails
      }
    }
    
    // If we found a LinkedIn URL, try to extract some basic information
    if (linkedInUrl) {
      // Extract the username from the LinkedIn URL
      const usernameMatch = linkedInUrl.match(/linkedin\.com\/in\/([a-zA-Z0-9\-\_\.]+)/);
      const username = usernameMatch ? usernameMatch[1] : null;
      
      linkedInData = {
        name: null, // We would need to scrape the page to get the actual name
        headline: null,
        linkedInUrl,
        company: null,
        location: null,
        photoUrl: null,
        summary: null,
        twitter: null,
        industry: null,
        found: true
      };
      
      // If we have Supabase credentials, cache the result
      if (supabaseUrl && supabaseAnonKey && linkedInData) {
        try {
          const supabase = createClient(supabaseUrl, supabaseAnonKey);
          
          // Check if the email already exists in cache
          const { data: existingData, error: fetchError } = await supabase
            .from("email_lookups")
            .select("id")
            .eq("email", email);
            
          if (!fetchError && existingData && existingData.length === 0) {
            // Insert new profile data
            await supabase
              .from("email_lookups")
              .insert({
                email,
                linkedin: linkedInUrl,
                found: true
              });
          }
        } catch (cacheError) {
          console.error("Error caching search results:", cacheError);
        }
      }
      
      // Return the LinkedIn data we found
      return new Response(
        JSON.stringify(linkedInData),
        { 
          status: 200,
          headers: corsHeaders
        }
      );
    }
    
    // If we couldn't find a LinkedIn profile after all methods
    console.log(`No LinkedIn profile found for email: ${email} after trying all methods`);
    
    return new Response(
      JSON.stringify({ 
        error: "Profile not found" 
      }),
      { 
        status: 404,
        headers: corsHeaders
      }
    );
    
  } catch (error) {
    console.error("Error in search-profile function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        details: error.message
      }),
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
});
