
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const REVERSECONTACT_API_URL = "https://api.reversecontact.com/enrichment";
const API_KEY = Deno.env.get("REVERSECONTACT_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    // Parse request body
    const requestData = await req.json().catch(() => null);
    
    if (req.method === "GET" || (requestData && requestData.email)) {
      // Single email lookup
      const email = requestData?.email;
      
      if (!email) {
        return new Response(
          JSON.stringify({ error: "Email parameter is required" }),
          { 
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }

      console.log(`Looking up email: ${email}`);
      
      const apiUrl = `${REVERSECONTACT_API_URL}?email=${encodeURIComponent(email)}`;
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      console.log("API response:", JSON.stringify(data));

      if (!response.ok) {
        return new Response(
          JSON.stringify({ 
            error: "API request failed", 
            details: data 
          }),
          { 
            status: response.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }

      // Format the response to match our application's expectations
      const formattedResponse = {
        name: data.person?.full_name || data.person?.firstName + " " + data.person?.lastName || '',
        company: data.company?.name || '',
        linkedin: data.person?.linkedInUrl || '',
        twitter: data.person?.twitter_url || '',
        found: !!data.person || false
      };

      return new Response(
        JSON.stringify(formattedResponse),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    } else if (req.method === "POST" && requestData && requestData.emails) {
      // Batch email lookup
      const emails = requestData.emails;
      
      if (!emails || !Array.isArray(emails) || emails.length === 0) {
        return new Response(
          JSON.stringify({ error: "Valid emails array is required" }),
          { 
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
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
          const apiUrl = `${REVERSECONTACT_API_URL}?email=${encodeURIComponent(email)}`;
          const response = await fetch(apiUrl, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${API_KEY}`,
              "Content-Type": "application/json",
            },
          });

          if (response.ok) {
            const data = await response.json();
            results[email] = {
              name: data.person?.full_name || (data.person?.firstName && data.person?.lastName ? `${data.person.firstName} ${data.person.lastName}` : ''),
              company: data.company?.name || '',
              linkedin: data.person?.linkedInUrl || '',
              twitter: data.person?.twitter_url || '',
              found: !!data.person || false
            };
          } else {
            results[email] = {
              name: '',
              company: '',
              found: false
            };
          }
        } catch (error) {
          console.error(`Error processing email ${email}:`, error);
          results[email] = {
            name: '',
            company: '',
            found: false
          };
        }
        
        // Add a small delay between requests
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      return new Response(
        JSON.stringify(results),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { 
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error in email-lookup function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
