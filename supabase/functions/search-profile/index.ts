
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json"
};

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
    
    // Make API request to ReverseContact API
    const response = await fetch("https://api.reversecontact.com/enrichment/linkedin", {
      method: "POST",
      headers: {
        "X-Api-Key": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`API response error (${response.status}):`, errorData);
      
      // Check if it's a "not found" response from the API
      if (response.status === 404 || errorData.includes("not found")) {
        return new Response(
          JSON.stringify({ 
            error: "Profile not found" 
          }),
          { 
            status: 404,
            headers: corsHeaders
          }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: `API error: ${response.status}` 
        }),
        { 
          status: response.status,
          headers: corsHeaders
        }
      );
    }
    
    // Process the API response
    const data = await response.json();
    
    if (!data || !data.data || !data.data.name) {
      return new Response(
        JSON.stringify({ 
          error: "Profile not found" 
        }),
        { 
          status: 404,
          headers: corsHeaders
        }
      );
    }
    
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
    
    // Return the profile data
    return new Response(
      JSON.stringify(profileData),
      { 
        status: 200,
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
