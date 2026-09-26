exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ status: "error", message: "Method not allowed" })
    };
  }

  const backendUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
  if (!backendUrl) {
    return {
      statusCode: 500,
      body: JSON.stringify({ status: "error", message: "Backend endpoint is not configured" })
    };
  }

  try {
    const response = await fetch(backendUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: event.body || "{}"
    });

    const text = await response.text();
    return {
      statusCode: response.ok ? 200 : 502,
      headers: { "Content-Type": "application/json" },
      body: text || JSON.stringify({ status: "ok" })
    };
  } catch (error) {
    return {
      statusCode: 502,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "error", message: "Unable to reach backend service" })
    };
  }
};
