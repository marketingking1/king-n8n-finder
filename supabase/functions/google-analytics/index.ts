import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GAReportRequest {
  propertyId: string;
  startDate: string;
  endDate: string;
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

async function getAccessToken(): Promise<string> {
  const clientId = Deno.env.get("GA_CLIENT_ID");
  const clientSecret = Deno.env.get("GA_CLIENT_SECRET");
  const refreshToken = Deno.env.get("GA_REFRESH_TOKEN");

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Missing GA OAuth credentials in environment");
  }

  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Token refresh failed: ${err}`);
  }

  const data: TokenResponse = await resp.json();
  return data.access_token;
}

async function runGAReport(accessToken: string, propertyId: string, startDate: string, endDate: string) {
  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;

  const body = {
    dateRanges: [{ startDate, endDate }],
    dimensions: [
      { name: "sessionCampaignName" },
      { name: "date" },
    ],
    metrics: [
      { name: "sessions" },
      { name: "engagedSessions" },
      { name: "totalUsers" },
      { name: "newUsers" },
      { name: "conversions" },
    ],
    dimensionFilter: {
      filter: {
        fieldName: "sessionSourceMedium",
        stringFilter: {
          matchType: "EXACT",
          value: "google / cpc",
          caseSensitive: false,
        },
      },
    },
    limit: 10000,
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`GA Report failed: ${err}`);
  }

  return resp.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { propertyId, startDate, endDate }: GAReportRequest = await req.json();

    if (!propertyId || !startDate || !endDate) {
      return new Response(
        JSON.stringify({ error: "propertyId, startDate, and endDate are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accessToken = await getAccessToken();
    const report = await runGAReport(accessToken, propertyId, startDate, endDate);

    // Parse GA response into simplified format
    const rows = (report.rows || []).map((row: any) => ({
      campaign: row.dimensionValues[0].value,
      date: row.dimensionValues[1].value,
      sessions: parseInt(row.metricValues[0].value, 10),
      engagedSessions: parseInt(row.metricValues[1].value, 10),
      totalUsers: parseInt(row.metricValues[2].value, 10),
      newUsers: parseInt(row.metricValues[3].value, 10),
      conversions: parseFloat(row.metricValues[4].value),
    }));

    return new Response(
      JSON.stringify({ rows, rowCount: report.rowCount || rows.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("GA edge function error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
