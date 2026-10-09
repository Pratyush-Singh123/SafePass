const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const lat = url.searchParams.get("lat");
    const lng = url.searchParams.get("lng");
    const city = url.searchParams.get("city");

    const apiKey = Deno.env.get("OPENWEATHERMAP_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Weather service is not configured. Please set OPENWEATHERMAP_API_KEY in Supabase secrets." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let weatherUrl: string;
    if (lat && lng) {
      weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;
    } else if (city) {
      weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
    } else {
      return new Response(
        JSON.stringify({ error: "Provide lat/lng or city parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const weatherResponse = await fetch(weatherUrl);
    if (!weatherResponse.ok) {
      const errText = await weatherResponse.text();
      return new Response(
        JSON.stringify({ error: `Weather service error: ${weatherResponse.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const weatherData = await weatherResponse.json();

    const oneCallUrl = lat && lng
      ? `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric&exclude=minutely,hourly,daily`
      : null;

    let alerts: { event: string; description: string; severity: string }[] = [];
    if (oneCallUrl) {
      try {
        const oneCallResponse = await fetch(oneCallUrl);
        if (oneCallResponse.ok) {
          const oneCallData = await oneCallResponse.json();
          if (oneCallData.alerts && Array.isArray(oneCallData.alerts)) {
            alerts = oneCallData.alerts.map((a: { event: string; description: string; tags: string[] }) => ({
              event: a.event || "Weather Alert",
              description: a.description || "",
              severity: a.tags?.[0] || "moderate",
            }));
          }
        }
      } catch {
        // One Call may fail; continue without alerts
      }
    }

    const result = {
      temp: Math.round(weatherData.main?.temp ?? 0),
      feels_like: Math.round(weatherData.main?.feels_like ?? 0),
      description: weatherData.weather?.[0]?.description ?? "Unknown",
      icon: weatherData.weather?.[0]?.icon ?? "01d",
      city: weatherData.name ?? "Unknown",
      humidity: weatherData.main?.humidity ?? 0,
      wind_speed: Math.round((weatherData.wind?.speed ?? 0) * 3.6),
      alerts,
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
