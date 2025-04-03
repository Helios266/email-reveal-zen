
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
    console.log(`[DEBUG] Looking up profile for email: ${email}`);
    
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
        console.log(`[DEBUG] Found cached profile for email: ${email}`);
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
    
    // Get the Google API key and search engine ID from environment variables
    const googleApiKey = Deno.env.get("GOOGLE_API_KEY");
    const googleCx = Deno.env.get("GOOGLE_CX");
    
    if (!googleApiKey || !googleCx) {
      console.error("[ERROR] Missing Google search API credentials");
      return new Response(
        JSON.stringify({ 
          error: "Search configuration is missing",
          details: "Google API credentials not configured" 
        }),
        { 
          status: 500,
          headers: corsHeaders
        }
      );
    }
    
    console.log("[INFO] Starting two-step GitHub/LinkedIn search pipeline for email:", email);
    
    // Step 1: Find GitHub profile using the email
    const githubSearchQueries = [
      `"${email}" site:github.com`,
      `${email} github profile`,
      `"${email.replace("@", "[at]")}" site:github.com`
    ];
    
    let githubProfileUrl = null;
    let gitHubSearchQueryUsed = "";
    
    // Try to find GitHub profile
    for (const query of githubSearchQueries) {
      console.log(`[SEARCH] Trying GitHub search query: "${query}"`);
      gitHubSearchQueryUsed = query;
      
      try {
        // Call Google Custom Search API for GitHub
        const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCx}&q=${encodeURIComponent(query)}`;
        console.log(`[API] Making GitHub search API request with query: "${query}"`);
        
        const searchResponse = await fetch(searchUrl);
        if (!searchResponse.ok) {
          const errorText = await searchResponse.text();
          console.error(`[ERROR] GitHub search API error (${searchResponse.status}): ${errorText}`);
          continue;
        }
        
        const searchData = await searchResponse.json();
        
        console.log(`[RESULT] GitHub search results for "${query}": ${searchData.items?.length ?? 0} items`);
        
        if (searchData.searchInformation) {
          console.log(`[INFO] GitHub search stats: Found ${searchData.searchInformation.totalResults} results in ${searchData.searchInformation.searchTime} seconds`);
        }
        
        // Check if we have search results
        if (searchData.items && searchData.items.length > 0) {
          // Log high-level overview of results
          console.log("[RESULTS OVERVIEW] First 3 GitHub search results:");
          searchData.items.slice(0, 3).forEach((item, index) => {
            console.log(`  ${index + 1}. ${item.title} - ${item.link}`);
          });
          
          // Look for GitHub profile URLs in the search results
          for (const item of searchData.items) {
            console.log(`[EXAMINING] GitHub result: Title "${item.title}", Link: ${item.link}`);
            
            // Check in the link
            if (item.link && item.link.match(/github\.com\/[a-zA-Z0-9\-\_\.]+\/?$/)) {
              githubProfileUrl = item.link;
              console.log(`[FOUND] GitHub profile URL: ${githubProfileUrl}`);
              break;
            }
            
            // Check in the snippet
            if (item.snippet) {
              const matches = item.snippet.match(githubProfileRegex);
              if (matches && matches.length > 0) {
                githubProfileUrl = matches[0];
                console.log(`[FOUND] GitHub URL in snippet: ${githubProfileUrl}`);
                break;
              }
            }
          }
          
          if (githubProfileUrl) {
            break;
          }
        } else {
          console.log(`[INFO] No items found in GitHub search results for "${query}"`);
          if (searchData.error) {
            console.error(`[ERROR] GitHub search API error: ${JSON.stringify(searchData.error)}`);
          }
        }
      } catch (searchError) {
        console.error(`[ERROR] Exception with GitHub search query "${query}":`, searchError);
        // Continue with next query if one fails
      }
    }
    
    if (!githubProfileUrl) {
      console.log("[FAILURE] No GitHub profile URL found for email:", email);
      return new Response(
        JSON.stringify({ 
          error: "Profile not found", 
          details: "Could not find GitHub profile for the provided email"
        }),
        { 
          status: 404,
          headers: corsHeaders
        }
      );
    }
    
    console.log(`[SUCCESS] Found GitHub profile URL: ${githubProfileUrl}`);
    
    // Step 2: Extract name from GitHub profile
    let personName = null;
    
    try {
      console.log(`[FETCH] Retrieving GitHub profile page: ${githubProfileUrl}`);
      // Fetch the GitHub profile page
      const githubResponse = await fetch(githubProfileUrl);
      if (!githubResponse.ok) {
        console.error(`[ERROR] Failed to fetch GitHub profile (${githubResponse.status}): ${githubProfileUrl}`);
        throw new Error(`Failed to fetch GitHub profile: ${githubResponse.statusText}`);
      }
      
      const githubHtml = await githubResponse.text();
      console.log(`[INFO] GitHub profile page HTML length: ${githubHtml.length} characters`);
      console.log(`[SAMPLE] GitHub HTML first 200 chars: ${githubHtml.substring(0, 200).replace(/\n/g, ' ')}...`);
      
      // Parse the HTML
      const parser = new DOMParser();
      const document = parser.parseFromString(githubHtml, "text/html");
      
      if (!document) {
        console.error("[ERROR] Failed to parse GitHub HTML");
        throw new Error("Failed to parse GitHub profile HTML");
      }
      
      console.log("[INFO] Successfully parsed GitHub HTML");
      
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
        console.log(`[SELECTOR] Trying to find name with selector: ${selector}`);
        const nameElement = document?.querySelector(selector);
        if (nameElement) {
          console.log(`[FOUND] Found element with selector: ${selector}`);
          
          // For meta tags, use content attribute
          if (selector.startsWith('meta')) {
            personName = nameElement.getAttribute('content')?.trim();
            console.log(`[EXTRACT] Meta tag content: "${personName}"`);
          } else {
            personName = nameElement.textContent?.trim();
            console.log(`[EXTRACT] Element text content: "${personName}"`);
          }
          
          if (personName) {
            // Clean up the name if it's from a meta tag (might include "on GitHub")
            personName = personName.replace(/ on GitHub$/, '').trim();
            console.log(`[SUCCESS] Found name on GitHub profile: "${personName}"`);
            break;
          }
        } else {
          console.log(`[INFO] No element found with selector: ${selector}`);
        }
      }
      
      // If we still don't have a name, try other approaches
      if (!personName) {
        console.log("[FALLBACK] No name found using primary selectors, trying alternative methods");
        
        // Try to find the name from document title
        const title = document?.querySelector('title')?.textContent;
        if (title) {
          console.log(`[EXTRACT] Document title: "${title}"`);
          
          // Extract name from title like "username (Real Name) · GitHub"
          const nameMatch = title.match(/([^()]+) \(([^)]+)\)/);
          if (nameMatch && nameMatch[2]) {
            personName = nameMatch[2].trim();
            console.log(`[SUCCESS] Found name from title parentheses: "${personName}"`);
          } else if (title.includes(' · GitHub')) {
            // Extract just the username part if no real name is found
            personName = title.split(' · GitHub')[0].trim();
            console.log(`[SUCCESS] Using username as name: "${personName}"`);
          }
        }
      }
      
      // If we still don't have a name, try to get the username at least
      if (!personName && githubProfileUrl) {
        const usernameMatch = githubProfileUrl.match(/github\.com\/([a-zA-Z0-9\-\_\.]+)/);
        if (usernameMatch && usernameMatch[1]) {
          personName = usernameMatch[1];
          console.log(`[FALLBACK] Using GitHub username as name: "${personName}"`);
        }
      }
    } catch (githubError) {
      console.error("[ERROR] Exception fetching or parsing GitHub profile:", githubError);
      throw new Error(`Failed to extract name from GitHub profile: ${githubError.message}`);
    }
    
    if (!personName) {
      console.log("[FAILURE] Could not extract name from GitHub profile");
      return new Response(
        JSON.stringify({ 
          error: "Profile incomplete", 
          details: "Found GitHub profile but could not extract name"
        }),
        { 
          status: 404,
          headers: corsHeaders
        }
      );
    }
    
    console.log(`[SUCCESS] Extracted name "${personName}" from GitHub profile`);
    
    // Step 3: Find LinkedIn profile using the name
    let linkedInUrl = null;
    
    const nameSearchQueries = [
      `"${personName}" "linkedin.com/in"`,
      `"${personName}" linkedin profile`,
      `${personName} linkedin`
    ];
    
    console.log(`[SEARCH] Starting LinkedIn search using name: "${personName}"`);
    let linkedInSearchQueryUsed = "";
    
    // Try name search queries
    for (const query of nameSearchQueries) {
      console.log(`[SEARCH] Searching LinkedIn with name query: "${query}"`);
      linkedInSearchQueryUsed = query;
      
      try {
        // Call Google Custom Search API
        const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCx}&q=${encodeURIComponent(query)}`;
        console.log(`[API] Making LinkedIn name search API request with query: "${query}"`);
        
        const searchResponse = await fetch(searchUrl);
        if (!searchResponse.ok) {
          const errorText = await searchResponse.text();
          console.error(`[ERROR] LinkedIn search API error (${searchResponse.status}): ${errorText}`);
          continue;
        }
        
        const searchData = await searchResponse.json();
        
        console.log(`[RESULT] LinkedIn name search results for "${query}": ${searchData.items?.length ?? 0} items`);
        
        // Log search data structure for detailed debugging
        if (searchData.searchInformation) {
          console.log(`[INFO] LinkedIn search stats: Found ${searchData.searchInformation.totalResults} results in ${searchData.searchInformation.searchTime} seconds`);
        }
        
        // Check if we have search results
        if (searchData.items && searchData.items.length > 0) {
          // Log high-level overview of results
          console.log("[RESULTS OVERVIEW] First 3 LinkedIn search results:");
          searchData.items.slice(0, 3).forEach((item, index) => {
            console.log(`  ${index + 1}. ${item.title} - ${item.link}`);
          });
          
          // Look for LinkedIn profile URLs in the search results
          for (const item of searchData.items) {
            console.log(`[EXAMINING] LinkedIn result: Title "${item.title}", Link: ${item.link}`);
            
            // Check in the link
            if (item.link && item.link.includes("linkedin.com/in/")) {
              linkedInUrl = item.link;
              console.log(`[FOUND] LinkedIn URL in link: ${linkedInUrl}`);
              break;
            }
            
            // Check in the snippet
            if (item.snippet) {
              const matches = item.snippet.match(linkedInUrlRegex);
              if (matches && matches.length > 0) {
                linkedInUrl = matches[0];
                console.log(`[FOUND] LinkedIn URL in snippet: ${linkedInUrl}`);
                break;
              }
            }
            
            // Check in the title
            if (item.title) {
              const matches = item.title.match(linkedInUrlRegex);
              if (matches && matches.length > 0) {
                linkedInUrl = matches[0];
                console.log(`[FOUND] LinkedIn URL in title: ${linkedInUrl}`);
                break;
              }
            }
          }
          
          if (linkedInUrl) {
            break;
          } else {
            console.log(`[INFO] No LinkedIn URL found in results for "${query}"`);
          }
        } else {
          console.log(`[INFO] No items found in LinkedIn name search results for "${query}"`);
          if (searchData.error) {
            console.error(`[ERROR] LinkedIn search API error: ${JSON.stringify(searchData.error)}`);
          }
        }
      } catch (searchError) {
        console.error(`[ERROR] Exception with LinkedIn search query "${query}":`, searchError);
        // Continue with next query if one fails
      }
    }
    
    if (!linkedInUrl) {
      console.log(`[FAILURE] No LinkedIn profile found for name: "${personName}" from email: ${email}`);
      
      // Return partial data with GitHub info but no LinkedIn
      const partialData = {
        name: personName,
        github: githubProfileUrl,
        found: false,
        error: "LinkedIn profile not found",
        details: {
          emailUsed: email,
          githubFound: true,
          githubUrl: githubProfileUrl,
          nameExtracted: personName,
          githubQueryUsed: gitHubSearchQueryUsed,
          linkedinQueryUsed: linkedInSearchQueryUsed
        }
      };
      
      // If we have Supabase credentials, cache the result
      if (supabaseUrl && supabaseAnonKey) {
        try {
          const supabase = createClient(supabaseUrl, supabaseAnonKey);
          
          // Check if the email already exists in cache
          const { data: existingData, error: fetchError } = await supabase
            .from("email_lookups")
            .select("id")
            .eq("email", email);
            
          if (!fetchError && (!existingData || existingData.length === 0)) {
            // Insert partial profile data
            await supabase
              .from("email_lookups")
              .insert({
                email,
                name: personName,
                found: false
              });
              
            console.log(`[INFO] Cached partial data for ${email} in database`);
          }
        } catch (cacheError) {
          console.error("[ERROR] Exception caching search results:", cacheError);
        }
      }
      
      return new Response(
        JSON.stringify({ 
          error: "LinkedIn profile not found", 
          details: `Found GitHub profile for ${personName} but could not find LinkedIn profile`
        }),
        { 
          status: 404,
          headers: corsHeaders
        }
      );
    }
    
    console.log(`[SUCCESS] Found LinkedIn profile URL: ${linkedInUrl}`);
    
    // Extract the username from the LinkedIn URL
    const usernameMatch = linkedInUrl.match(/linkedin\.com\/in\/([a-zA-Z0-9\-\_\.]+)/);
    const username = usernameMatch ? usernameMatch[1] : null;
    
    const profileData = {
      name: personName,
      headline: null,
      linkedInUrl,
      company: null,
      location: null,
      photoUrl: null,
      summary: null,
      twitter: null,
      industry: null,
      found: true,
      github: githubProfileUrl,
      debugInfo: {
        emailUsed: email,
        githubUrl: githubProfileUrl, 
        nameExtracted: personName,
        linkedInUrl: linkedInUrl,
        githubQueryUsed: gitHubSearchQueryUsed,
        linkedinQueryUsed: linkedInSearchQueryUsed
      }
    };
    
    // If we have Supabase credentials, cache the result
    if (supabaseUrl && supabaseAnonKey && profileData) {
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
              name: profileData.name,
              linkedin: linkedInUrl,
              found: true
            });
            
          console.log(`[INFO] Cached LinkedIn URL for ${email} in database`);
        }
      } catch (cacheError) {
        console.error("[ERROR] Exception caching search results:", cacheError);
      }
    }
    
    // Return the LinkedIn data we found
    return new Response(
      JSON.stringify(profileData),
      { 
        status: 200,
        headers: corsHeaders
      }
    );
    
  } catch (error) {
    console.error("[ERROR] Unhandled exception in search-profile function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        details: error.message,
        stack: error.stack
      }),
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
});
