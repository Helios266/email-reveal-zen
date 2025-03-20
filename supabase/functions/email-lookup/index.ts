
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const REVERSECONTACT_API_URL = "https://api.reversecontact.com/enrichment";
const API_KEY = Deno.env.get("REVERSECONTACT_API_KEY");

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
    const requestData = await req.json().catch(() => null);
    
    if (req.method === "POST" && requestData && requestData.email) {
      // Single email lookup
      const email = requestData.email;
      
      if (!email) {
        return new Response(
          JSON.stringify({ error: "Email parameter is required" }),
          { 
            status: 400,
            headers: corsHeaders
          }
        );
      }

      console.log(`Looking up email: ${email}`);
      
      const apiUrl = `${REVERSECONTACT_API_URL}?apikey=${API_KEY}&email=${encodeURIComponent(email)}`;
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "API request failed" }));
        console.error("API error:", JSON.stringify(errorData));
        return new Response(
          JSON.stringify({ 
            error: "API request failed", 
            details: errorData 
          }),
          { 
            status: response.status,
            headers: corsHeaders
          }
        );
      }

      const data = await response.json();
      console.log("API response:", JSON.stringify(data));

      // Format the response to match our application's expectations
      // The new format provides more detailed information
      const formattedResponse = {
        name: data.person?.firstName && data.person?.lastName 
          ? `${data.person.firstName} ${data.person.lastName}` 
          : data.person?.full_name || '',
        company: data.company?.name || '',
        linkedin: data.person?.linkedInUrl || '',
        twitter: data.person?.twitter_url || '',
        headline: data.person?.headline || '',
        location: data.person?.location || '',
        summary: data.person?.summary || '',
        photoUrl: data.person?.photoUrl || '',
        position: data.person?.positions?.positionHistory?.[0] || null,
        education: data.person?.schools?.educationHistory?.[0] || null,
        industry: data.company?.industry || '',
        found: !!data.person || false
      };

      return new Response(
        JSON.stringify(formattedResponse),
        { headers: corsHeaders }
      );
    } else if (req.method === "POST" && requestData && requestData.emails) {
      // Batch email lookup
      const emails = requestData.emails;
      
      if (!emails || !Array.isArray(emails) || emails.length === 0) {
        return new Response(
          JSON.stringify({ error: "Valid emails array is required" }),
          { 
            status: 400,
            headers: corsHeaders
          }
        );
      }

      // Process up to 10 emails at a time to avoid timeouts
      const batch = emails.slice(0, 10);
      console.log(`Processing batch of ${batch.length} emails`);
      
      const results: Record<string, any> = {};
      
      // Sequential processing to avoid rate limits
      for (const email of batch) {
        try {
          const apiUrl = `${REVERSECONTACT_API_URL}?apikey=${API_KEY}&email=${encodeURIComponent(email)}`;
          const response = await fetch(apiUrl, {
            method: "GET",
            headers: {
              "Accept": "application/json",
              "Content-Type": "application/json"
            },
          });

          if (response.ok) {
            const data = await response.json();
            results[email] = {
              name: data.person?.firstName && data.person?.lastName 
                ? `${data.person.firstName} ${data.person.lastName}` 
                : data.person?.full_name || '',
              company: data.company?.name || '',
              linkedin: data.person?.linkedInUrl || '',
              twitter: data.person?.twitter_url || '',
              headline: data.person?.headline || '',
              location: data.person?.location || '',
              summary: data.person?.summary || '',
              photoUrl: data.person?.photoUrl || '',
              position: data.person?.positions?.positionHistory?.[0] || null,
              education: data.person?.schools?.educationHistory?.[0] || null,
              industry: data.company?.industry || '',
              found: !!data.person || false
            };
          } else {
            results[email] = {
              name: '',
              company: '',
              headline: '',
              location: '',
              summary: '',
              photoUrl: '',
              position: null,
              education: null,
              industry: '',
              found: false
            };
          }
        } catch (error) {
          console.error(`Error processing email ${email}:`, error);
          results[email] = {
            name: '',
            company: '',
            headline: '',
            location: '',
            summary: '',
            photoUrl: '',
            position: null,
            education: null,
            industry: '',
            found: false
          };
        }
        
        // Add a small delay between requests
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      return new Response(
        JSON.stringify(results),
        { headers: corsHeaders }
      );
    }
    
    return new Response(
      JSON.stringify({ error: "Method not allowed or invalid request format" }),
      { 
        status: 405,
        headers: corsHeaders
      }
    );
  } catch (error) {
    console.error("Error in email-lookup function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", message: error.message }),
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
});
