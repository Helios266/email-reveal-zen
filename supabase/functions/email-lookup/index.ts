
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const REVERSECONTACT_API_URL = "https://api.reversecontact.com/enrichment";
const API_KEY = "sk_ed141ea25d06d0de6d9aaaac44a5712b4ca03f24";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json"
};

// Mock data for development
const MOCK_DATA = {
  "success": true,
  "email": "bill.gates@microsoft.com",
  "emailType": "professional",
  "credits_left": 90000,
  "rate_limit_left": 19000,
  "person": {
    "publicIdentifier": "williamhgates",
    "memberIdentifier": "251749025",
    "linkedInIdentifier": "ACoAAA8BYqEBCGLg_vT_ca6mMEqkpp9nVffJ3hc",
    "linkedInUrl": "https://www.linkedin.com/in/williamhgates",
    "firstName": "Bill",
    "lastName": "Gates",
    "headline": "Co-chair, Bill & Melinda Gates Foundation",
    "location": "Seattle, Washington, United States of America",
    "summary": "Co-chair of the Bill & Melinda Gates Foundation. Founder of Breakthrough Energy. Co-founder of Microsoft. Voracious reader. Avid traveler. Active blogger.",
    "photoUrl": "https://media.licdn.com/dms/image/D5603AQHv6LsdiUg1kw/profile-displayphoto-shrink_800_800/0/1695167344576?e=1723680000&v=beta&t=NcEpysYwCpQ_NBg0QTz_a265pEOhfGICFJUX92-KNpw",
    "backgroundUrl": "https://media.licdn.com/dms/image/v2/D5616AQHy2R5tyt2YUA/profile-displaybackgroundimage-shrink_350_1400/profile-displaybackgroundimage-shrink_350_1400/0/1672782785474?e=1731542400&v=beta&t=0HWY04xeK0kEQngJOje3yNudJ6eTvNz2Q2HrTRB4hO8",
    "openToWork": false,
    "premium": false,
    "creationDate": {
      "month": 5,
      "year": 2013
    },
    "followerCount": 35415,
    "positions": {
      "positionsCount": 3,
      "positionHistory": [
        {
          "title": "Co-chair",
          "companyName": "Bill & Melinda Gates Foundation",
          "description": "",
          "startEndDate": {
            "start": {
              "month": 1,
              "year": 2000
            },
            "end": null
          },
          "companyLogo": "https://media.licdn.com/dms/image/C4E0BAQE7Na_mKQhIJg/company-logo_400_400/0/1633731811337/bill__melinda_gates_foundation_logo?e=1726099200&v=beta&t=LIgstVg1oR5LmBl9u1kolb_xeOqs5kX1ZTcUpaEtsE4",
          "linkedInUrl": "https://www.linkedin.com/company/8736/",
          "linkedInId": "8736"
        },
        {
          "title": "Founder",
          "companyName": "Breakthrough Energy",
          "description": "",
          "startEndDate": {
            "start": {
              "month": 1,
              "year": 2015
            },
            "end": null
          },
          "companyLogo": "https://media.licdn.com/dms/image/C4D0BAQGwD9vNu044FA/company-logo_400_400/0/1630531940051/breakthrough_energy_ventures_logo?e=1726099200&v=beta&t=DIU32ElAkeY4aqcq_9uJTAhiZI-v0GoOX77409cLZRE",
          "linkedInUrl": "https://www.linkedin.com/company/19141006/",
          "linkedInId": "19141006"
        },
        {
          "title": "Co-founder",
          "companyName": "Microsoft",
          "description": "",
          "startEndDate": {
            "start": {
              "month": 1,
              "year": 1975
            },
            "end": null
          },
          "companyLogo": "https://media.licdn.com/dms/image/C560BAQE88xCsONDULQ/company-logo_400_400/0/1630652622688/microsoft_logo?e=1726099200&v=beta&t=zueWlWXcJ4WjwGSzlUWgPOnjoAm8C2KfSIcWWHxWrGg",
          "linkedInUrl": "https://www.linkedin.com/company/1035/",
          "linkedInId": "1035"
        }
      ]
    },
    "schools": {
      "educationsCount": 2,
      "educationHistory": [
        {
          "degreeName": "",
          "fieldOfStudy": "",
          "description": null,
          "linkedInUrl": "https://www.linkedin.com/company/1646/",
          "schoolLogo": "https://media.licdn.com/dms/image/C4E0BAQF5t62bcL0e9g/company-logo_400_400/0/1631318058235?e=1726099200&v=beta&t=tSGQKfAlig70DD9n2_xkYR54yBTf7K3aKsau8PMQSVM",
          "schoolName": "Harvard University",
          "startEndDate": {
            "start": {
              "month": 1,
              "year": 1973
            },
            "end": {
              "month": 1,
              "year": 1975
            }
          }
        },
        {
          "degreeName": "",
          "fieldOfStudy": "",
          "description": null,
          "linkedInUrl": "https://www.linkedin.com/company/30288/",
          "schoolLogo": "https://media.licdn.com/dms/image/D560BAQGFmOQmzpxg9A/company-logo_400_400/0/1683732883164/lakeside_school_logo?e=1726099200&v=beta&t=cylwvrQe7Q4N8oU1hotzPfrae8yxPuzdtG1ocBSuEmA",
          "schoolName": "Lakeside School",
          "startEndDate": {
            "start": {
              "month": null,
              "year": null
            },
            "end": {
              "month": null,
              "year": null
            }
          }
        }
      ]
    },
    "skills": [],
    "languages": []
  },
  "company": {
    "linkedInId": "1035",
    "name": "Microsoft",
    "universalName": "microsoft",
    "linkedInUrl": "https://www.linkedin.com/company/1035",
    "employeeCount": 228581,
    "employeeCountRange": {
      "start": 10001,
      "end": 1
    },
    "websiteUrl": "https://news.microsoft.com/",
    "tagline": null,
    "description": "Every company has a mission. What's ours? To empower every person and every organization to achieve more. We believe technology can and should be a force for good and that meaningful innovation contributes to a brighter world in the future and today. Our culture doesn't just encourage curiosity; it embraces it. Each day we make progress together by showing up as our authentic selves. We show up with a learn-it-all mentality. We show up cheering on others, knowing their success doesn't diminish our own. We show up every day open to learning our own biases, changing our behavior, and inviting in differences. Because impact matters.\n\nMicrosoft operates in 190 countries and is made up of more than 220,000 passionate employees worldwide.\n",
    "industry": "Software Development",
    "phone": null,
    "specialities": [
      "Business Software",
      "Developer Tools",
      "Home & Educational Software",
      "Tablets",
      "Search",
      "Advertising",
      "Servers",
      "Windows Operating System",
      "Windows Applications & Platforms",
      "Smartphones",
      "Cloud Computing",
      "Quantum Computing",
      "Future of Work",
      "Productivity",
      "AI",
      "Artificial Intelligence",
      "Machine Learning",
      "Laptops",
      "Mixed Reality",
      "Virtual Reality",
      "Gaming",
      "Developers",
      "IT Professional"
    ],
    "followerCount": 22736947,
    "headquarter": {
      "city": "Redmond",
      "country": "US",
      "postalCode": "98052",
      "geographicArea": "Washington",
      "street1": "1 Microsoft Way",
      "street2": null
    },
    "logo": "https://media.licdn.com/dms/image/C560BAQE88xCsONDULQ/company-logo_400_400/0/1630652622688/microsoft_logo?e=1725494400&v=beta&t=joSXHhDAEare7f9gk8MwXr2sOr84zX7HDx2h5znXEYI"
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
      
      Use mock data during development
      In production, use the real API call
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
      
      // // Use mock data instead
      // const data = MOCK_DATA;
      // console.log("Using mock data for email:", email);

      // Format the response to match our application's expectations
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
      
      // Use mock data for all emails
      for (const email of batch) {
        try {
          // In a real implementation, we would call the API
          // const apiUrl = `${REVERSECONTACT_API_URL}?apikey=${API_KEY}&email=${encodeURIComponent(email)}`;
          // const response = await fetch(apiUrl, { ... });
          
          // Use mock data instead
          const data = MOCK_DATA;
          console.log("Using mock data for email:", email);
          
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
