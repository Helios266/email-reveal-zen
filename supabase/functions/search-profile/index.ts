
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json"
};

// Regular expressions for extracting profile URLs
const linkedInUrlRegex = /https:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9\-\_\.]+\/?/g;
const githubProfileRegex = /https:\/\/(www\.)?github\.com\/[a-zA-Z0-9\-\_\.]+\/?/g;

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
    
    // Try ReverseContact API first
    try {
      // Get the API key from environment variables
      const apiKey = Deno.env.get("REVERSECONTACT_API_KEY");
      
      if (!apiKey) {
        console.error("Missing REVERSECONTACT_API_KEY environment variable");
        // Continue to fallback search methods
      } else {
        console.log("Attempting ReverseContact API lookup for email:", email);
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
          console.log("ReverseContact API response:", JSON.stringify(data));
          
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
                  
                if (!fetchError && (!existingData || existingData.length === 0)) {
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
        console.log("ReverseContact API didn't find a profile, trying direct LinkedIn search...");
      }
    } catch (apiError) {
      console.error("Error calling ReverseContact API:", apiError);
      // Continue to fallback method if API fails
    }
    
    // Fallback web search method - Direct LinkedIn Search
    console.log("Starting direct LinkedIn search for email:", email);
    
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
    
    // Direct LinkedIn search queries
    const directSearchQueries = [
      `"${email}" "linkedin.com/in"`,
      `"${email}" linkedin profile`,
      `"${email.replace("@", "[at]")}" "linkedin.com/in"`
    ];
    
    let linkedInUrl = null;
    let linkedInData = null;
    
    // Try direct search queries for LinkedIn
    for (const query of directSearchQueries) {
      console.log(`Trying direct LinkedIn search query: ${query}`);
      
      try {
        // Call Google Custom Search API
        const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCx}&q=${encodeURIComponent(query)}`;
        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();
        
        console.log(`Direct search results for "${query}":`, JSON.stringify(searchData.items?.length ?? 0));
        
        // Check if we have search results
        if (searchData.items && searchData.items.length > 0) {
          // Look for LinkedIn profile URLs in the search results
          for (const item of searchData.items) {
            // Check in the link
            if (item.link && item.link.includes("linkedin.com/in/")) {
              linkedInUrl = item.link;
              console.log(`Found LinkedIn URL in direct search link: ${linkedInUrl}`);
              break;
            }
            
            // Check in the snippet
            if (item.snippet) {
              const matches = item.snippet.match(linkedInUrlRegex);
              if (matches && matches.length > 0) {
                linkedInUrl = matches[0];
                console.log(`Found LinkedIn URL in snippet: ${linkedInUrl}`);
                break;
              }
            }
            
            // Check in the title
            if (item.title) {
              const matches = item.title.match(linkedInUrlRegex);
              if (matches && matches.length > 0) {
                linkedInUrl = matches[0];
                console.log(`Found LinkedIn URL in title: ${linkedInUrl}`);
                break;
              }
            }
          }
          
          if (linkedInUrl) {
            break;
          }
        }
      } catch (searchError) {
        console.error(`Error with direct LinkedIn search query "${query}":`, searchError);
        // Continue with next query if one fails
      }
    }
    
    // If direct LinkedIn search didn't find anything, try GitHub two-step search
    if (!linkedInUrl) {
      console.log("Direct LinkedIn search failed, trying two-step GitHub search");
      
      // GitHub search queries
      const githubSearchQueries = [
        `"${email}" site:github.com`,
        `${email} github profile`,
        `"${email.replace("@", "[at]")}" site:github.com`
      ];
      
      let githubProfileUrl = null;
      let personName = null;
      
      // Try to find GitHub profile
      for (const query of githubSearchQueries) {
        console.log(`Trying GitHub search query: ${query}`);
        
        try {
          // Call Google Custom Search API for GitHub
          const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCx}&q=${encodeURIComponent(query)}`;
          const searchResponse = await fetch(searchUrl);
          const searchData = await searchResponse.json();
          
          console.log(`GitHub search results for "${query}":`, JSON.stringify(searchData.items?.length ?? 0));
          
          // Check if we have search results
          if (searchData.items && searchData.items.length > 0) {
            // Look for GitHub profile URLs in the search results
            for (const item of searchData.items) {
              // Check in the link
              if (item.link && item.link.match(/github\.com\/[a-zA-Z0-9\-\_\.]+\/?$/)) {
                githubProfileUrl = item.link;
                console.log(`Found GitHub URL: ${githubProfileUrl}`);
                break;
              }
              
              // Check in the snippet
              if (item.snippet) {
                const matches = item.snippet.match(githubProfileRegex);
                if (matches && matches.length > 0) {
                  githubProfileUrl = matches[0];
                  console.log(`Found GitHub URL in snippet: ${githubProfileUrl}`);
                  break;
                }
              }
            }
            
            if (githubProfileUrl) {
              break;
            }
          }
        } catch (searchError) {
          console.error(`Error with GitHub search query "${query}":`, searchError);
          // Continue with next query if one fails
        }
      }
      
      // If we found a GitHub profile URL, try to extract the person's name
      if (githubProfileUrl) {
        try {
          console.log(`Fetching GitHub profile page: ${githubProfileUrl}`);
          // Fetch the GitHub profile page
          const githubResponse = await fetch(githubProfileUrl);
          const githubHtml = await githubResponse.text();
          
          // Parse the HTML
          const parser = new DOMParser();
          const document = parser.parseFromString(githubHtml, "text/html");
          
          // Try different selectors to find the name
          // Added more selectors including meta tags for better name extraction
          const nameSelectors = [
            'meta[name="twitter:title"]',
            'meta[property="og:title"]',
            'span[itemprop="name"]',
            '.vcard-fullname',
            '.vcard-names .p-name',
            '.p-name',
            'h1.vcard-names span'
          ];
          
          for (const selector of nameSelectors) {
            const nameElement = document?.querySelector(selector);
            if (nameElement) {
              // For meta tags, use content attribute
              if (selector.startsWith('meta')) {
                personName = nameElement.getAttribute('content')?.trim();
              } else {
                personName = nameElement.textContent?.trim();
              }
              
              if (personName) {
                // Clean up the name if it's from a meta tag (might include "on GitHub")
                personName = personName.replace(/ on GitHub$/, '').trim();
                console.log(`Found name on GitHub profile: ${personName}`);
                break;
              }
            }
          }
          
          // If we still don't have a name, try other approaches
          if (!personName) {
            // Try to find the name from document title
            const title = document?.querySelector('title')?.textContent;
            if (title) {
              // Extract name from title like "username (Real Name) · GitHub"
              const nameMatch = title.match(/([^()]+) \(([^)]+)\)/);
              if (nameMatch && nameMatch[2]) {
                personName = nameMatch[2].trim();
                console.log(`Found name from title: ${personName}`);
              } else if (title.includes(' · GitHub')) {
                // Extract just the username part if no real name is found
                personName = title.split(' · GitHub')[0].trim();
                console.log(`Using username as name: ${personName}`);
              }
            }
          }
        } catch (githubError) {
          console.error("Error fetching or parsing GitHub profile:", githubError);
        }
      }
      
      // If we found a name, search for LinkedIn profile with the name
      if (personName) {
        const nameSearchQueries = [
          `"${personName}" "linkedin.com/in"`,
          `"${personName}" linkedin profile`,
          `${personName} linkedin`
        ];
        
        // Try name search queries
        for (const query of nameSearchQueries) {
          console.log(`Searching LinkedIn with name query: ${query}`);
          
          try {
            // Call Google Custom Search API
            const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCx}&q=${encodeURIComponent(query)}`;
            const searchResponse = await fetch(searchUrl);
            const searchData = await searchResponse.json();
            
            console.log(`Name search results for "${query}":`, JSON.stringify(searchData.items?.length ?? 0));
            
            // Check if we have search results
            if (searchData.items && searchData.items.length > 0) {
              // Look for LinkedIn profile URLs in the search results
              for (const item of searchData.items) {
                // Check in the link
                if (item.link && item.link.includes("linkedin.com/in/")) {
                  linkedInUrl = item.link;
                  console.log(`Found LinkedIn URL using name search: ${linkedInUrl}`);
                  break;
                }
                
                // Check in the snippet
                if (item.snippet) {
                  const matches = item.snippet.match(linkedInUrlRegex);
                  if (matches && matches.length > 0) {
                    linkedInUrl = matches[0];
                    console.log(`Found LinkedIn URL in snippet using name search: ${linkedInUrl}`);
                    break;
                  }
                }
              }
              
              if (linkedInUrl) {
                break;
              }
            }
          } catch (searchError) {
            console.error(`Error with name search query "${query}":`, searchError);
            // Continue with next query if one fails
          }
        }
      } else {
        console.log("No name found from GitHub profile for email:", email);
      }
    }
    
    // If we found a LinkedIn URL through any method, create profile data
    if (linkedInUrl) {
      // Extract the username from the LinkedIn URL
      const usernameMatch = linkedInUrl.match(/linkedin\.com\/in\/([a-zA-Z0-9\-\_\.]+)/);
      const username = usernameMatch ? usernameMatch[1] : null;
      
      console.log(`Successfully found LinkedIn profile for ${email}: ${linkedInUrl}`);
      
      linkedInData = {
        name: personName, // This might be null if we only found LinkedIn directly
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
            
          if (!fetchError && (!existingData || existingData.length === 0)) {
            // Insert new profile data
            await supabase
              .from("email_lookups")
              .insert({
                email,
                name: linkedInData.name,
                linkedin: linkedInUrl,
                found: true
              });
              
            console.log(`Cached LinkedIn URL for ${email} in database`);
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
