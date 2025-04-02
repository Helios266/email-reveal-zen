
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json"
};

// Mock data - in a real implementation this would query an external API or database
const mockProfiles = {
  "bill.gates@microsoft.com": {
    name: "Bill Gates",
    headline: "Co-chair, Bill & Melinda Gates Foundation",
    linkedInUrl: "https://www.linkedin.com/in/williamhgates",
    company: "Microsoft",
    location: "Seattle, Washington",
    photoUrl: "https://media.licdn.com/dms/image/D5603AQHv6LsdiUg1kw/profile-displayphoto-shrink_800_800/0/1695167344576?e=1723680000&v=beta&t=NcEpysYwCpQ_NBg0QTz_a265pEOhfGICFJUX92-KNpw",
    summary: "Co-chair of the Bill & Melinda Gates Foundation. Founder of Breakthrough Energy. Co-founder of Microsoft.",
    twitter: "https://twitter.com/BillGates",
    industry: "Software Development"
  },
  "elon.musk@tesla.com": {
    name: "Elon Musk",
    headline: "CEO of Tesla and SpaceX",
    linkedInUrl: "https://www.linkedin.com/in/elonmusk",
    company: "Tesla",
    location: "Austin, Texas",
    photoUrl: "https://example.com/elon_musk.jpg",
    summary: "Entrepreneur and business magnate.",
    twitter: "https://twitter.com/elonmusk",
    industry: "Automotive and Aerospace"
  },
  "satya.nadella@microsoft.com": {
    name: "Satya Nadella",
    headline: "CEO of Microsoft",
    linkedInUrl: "https://www.linkedin.com/in/satyanadella",
    company: "Microsoft",
    location: "Redmond, Washington",
    photoUrl: "https://example.com/satya_nadella.jpg",
    summary: "Business executive serving as the chairman and CEO of Microsoft.",
    twitter: "https://twitter.com/satyanadella",
    industry: "Software Development"
  }
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
    
    // In a real implementation, this would be a call to an external API or database
    // For this example, we'll use mock data
    const profile = mockProfiles[email.toLowerCase()];
    
    if (!profile) {
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
    
    // Return the profile data
    return new Response(
      JSON.stringify({
        name: profile.name,
        headline: profile.headline,
        linkedInUrl: profile.linkedInUrl,
        company: profile.company,
        location: profile.location,
        photoUrl: profile.photoUrl,
        summary: profile.summary,
        twitter: profile.twitter,
        industry: profile.industry,
        found: true
      }),
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
