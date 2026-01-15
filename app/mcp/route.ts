import { createMcpHandler } from "mcp-handler";
import { NextRequest } from "next/server";
import { z } from "zod";

interface WeatherResponse {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  hourly_units: {
    time: string;
    temperature_2m: string;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
  };
}

// Store headers globally for access in tools
let currentRequestHeaders: Headers | null = null;

// StreamableHttp server
const handler = createMcpHandler(
  async (server) => {
    server.registerTool(
      "get_coordinates",
      "Get the latitude and longitude for a given city name. Provide only the city, without including the state, province, or country. Example: If the full address is 'San Francisco, CA', use 'San Francisco' as the input.",
      {
        address: z.string().describe("The city name to get coordinates for"),
      },
      async ({ address }) => {
        try {
          console.log("address", address);

          // Access headers in the tool
          if (currentRequestHeaders) {
            console.log("=== Headers available in geocode tool ===");
            currentRequestHeaders.forEach((value, key) => {
              console.log(`  ${key}: ${value}`);
            });

            // Example: Use authorization header if present
            const authHeader = currentRequestHeaders.get("authorization");
            if (authHeader) {
              console.log("Authorization header found:", authHeader);
            }

            // Example: Use user-agent for logging
            const userAgent = currentRequestHeaders.get("user-agent");
            if (userAgent) {
              console.log("Request from:", userAgent);
            }
          }

          const encodedAddress = encodeURIComponent(address);

          console.log("encodedAddress", encodedAddress);

          const url = `https://customer-geocoding-api.open-meteo.com/v1/search?apikey=&name=${encodedAddress}&count=1`;

          const response = await fetch(url);

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();

          if (!data.results || data.results.length === 0) {
            return {
              content: [
                {
                  type: "text",
                  text: `No geocoding results found for address: ${address}`,
                },
              ],
            };
          }

          console.log("data", data);

          // If count is 1, return just the coordinates of the first result
          const firstResult = data.results[0];
          const coordinates = {
            latitude: firstResult.latitude,
            longitude: firstResult.longitude,
          };

          console.log("firstResult", firstResult);
          console.log("coordinates", coordinates);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(coordinates, null, 2),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error geocoding address "${address}": ${
                  error instanceof Error ? error.message : "Unknown error"
                }`,
              },
            ],
          };
        }
      }
    );
    server.registerTool(
      "get_weather_forecast",
      "Get hourly temperature forecast for a given location using longitude and latitude coordinates",
      {
        latitude: z
          .number()
          .min(-90)
          .max(90)
          .describe("Latitude coordinate (-90 to 90)"),
        longitude: z
          .number()
          .min(-180)
          .max(180)
          .describe("Longitude coordinate (-180 to 180)"),
      },
      async ({ latitude, longitude }) => {
        try {
          console.log("latitude", latitude);
          console.log("longitude", longitude);

          const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,weather_code&temperature_unit=fahrenheit`;
          const response = await fetch(url);

          console.log("response", response);

          if (!response.ok) {
            throw new Error(
              `Weather API request failed: ${response.status} ${response.statusText}`
            );
          }

          const weatherData: WeatherResponse = await response.json();

          console.log("weatherData", weatherData);

          const currentTime = new Date().toISOString();
          const currentHourIndex = weatherData.hourly.time.findIndex(
            (time) => time >= currentTime.slice(0, 13)
          );
          const nextHours = Math.min(
            24,
            weatherData.hourly.time.length - Math.max(0, currentHourIndex)
          );

          const forecast = weatherData.hourly.time
            .slice(
              Math.max(0, currentHourIndex),
              Math.max(0, currentHourIndex) + nextHours
            )
            .map((time, index) => ({
              time,
              temperature:
                weatherData.hourly.temperature_2m[
                  Math.max(0, currentHourIndex) + index
                ],
              weatherCode:
                weatherData.hourly.weather_code[
                  Math.max(0, currentHourIndex) + index
                ],
              unit: weatherData.hourly_units.temperature_2m,
            }));

          console.log("forecast", forecast);

          const text =
            `Weather Forecast for coordinates (${latitude}, ${longitude}):\n\n` +
            `Next ${forecast.length} Hours Temperature Forecast:\n` +
            forecast
              .map(
                (f) =>
                  `- ${f.time}: ${f.temperature}${f.unit} (weatherCode: ${f.weatherCode})`
              )
              .join("\n");

          console.log("text", text);

          return {
            content: [
              {
                type: "text",
                text: text,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error fetching weather data: ${
                  error instanceof Error ? error.message : "Unknown error"
                }`,
              },
            ],
          };
        }
      }
    );

    server.registerTool(
      "get_weather_forecast_for_date_range",
      "Get hourly temperature forecast for a specific location and date range using latitude and longitude coordinates",
      {
        latitude: z
          .number()
          .min(-90)
          .max(90)
          .describe("Latitude coordinate (-90 to 90)"),
        longitude: z
          .number()
          .min(-180)
          .max(180)
          .describe("Longitude coordinate (-180 to 180)"),
        start_date: z
          .string()
          .describe("Start date to get the weather forecast for"),
        end_date: z
          .string()
          .describe("End date to get the weather forecast for"),
      },
      async ({ latitude, longitude, start_date, end_date }) => {
        try {
          console.log("latitude", latitude);
          console.log("longitude", longitude);
          console.log("start_date", start_date);
          console.log("end_date", end_date);

          const formattedStartDate = start_date
            ? new Date(start_date).toISOString().split("T")[0]
            : undefined;
          const formattedEndDate = end_date
            ? new Date(end_date).toISOString().split("T")[0]
            : undefined;

          console.log("formattedStartDate", formattedStartDate);
          console.log("formattedEndDate", formattedEndDate);

          const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,weather_code&temperature_unit=fahrenheit${
            formattedStartDate ? `&start_date=${formattedStartDate}` : ""
          }${formattedEndDate ? `&end_date=${formattedEndDate}` : ""}`;
          const response = await fetch(url);

          console.log("response", response);

          if (!response.ok) {
            throw new Error(
              `Weather API request failed: ${response.status} ${response.statusText}`
            );
          }

          const weatherData: WeatherResponse = await response.json();

          console.log("weatherData", weatherData);

          const currentTime = new Date().toISOString();
          const currentHourIndex = weatherData.hourly.time.findIndex(
            (time) => time >= currentTime.slice(0, 13)
          );
          const nextHours = Math.min(
            24,
            weatherData.hourly.time.length - Math.max(0, currentHourIndex)
          );

          const forecast = weatherData.hourly.time
            .slice(
              Math.max(0, currentHourIndex),
              Math.max(0, currentHourIndex) + nextHours
            )
            .map((time, index) => ({
              time,
              temperature:
                weatherData.hourly.temperature_2m[
                  Math.max(0, currentHourIndex) + index
                ],
              weatherCode:
                weatherData.hourly.weather_code[
                  Math.max(0, currentHourIndex) + index
                ],
              unit: weatherData.hourly_units.temperature_2m,
            }));

          console.log("forecast", forecast);

          const text =
            `Weather Forecast for coordinates (${latitude}, ${longitude}):\n\n` +
            `Next ${forecast.length} Hours Temperature Forecast:\n` +
            forecast
              .map(
                (f) =>
                  `- ${f.time}: ${f.temperature}${f.unit} (weatherCode: ${f.weatherCode})`
              )
              .join("\n");

          console.log("text", text);

          return {
            content: [
              {
                type: "text",
                text: text,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error fetching weather data: ${
                  error instanceof Error ? error.message : "Unknown error"
                }`,
              },
            ],
          };
        }
      }
    );
  },
  {
    capabilities: {
      tools: {
        get_coordinates: {
          description:
            "Get latitude and longitude coordinates for a given address",
        },
        get_weather_forecast: {
          description:
            "Get hourly temperature forecast for a given location using longitude and latitude coordinates",
        },
      },
    },
  },
  {
    basePath: "",
    verboseLogs: true,
    maxDuration: 60,
    disableSse: true,
  }
);

// Wrap the handler to capture headers and pass them to tools
const wrappedHandler = async (request: NextRequest) => {
  console.log("=== MCP Server Headers ===");
  console.log("Method:", request.method);
  console.log("URL:", request.url);
  console.log("Headers:");

  // Store headers globally so tools can access them
  currentRequestHeaders = request.headers;

  // Log all headers
  request.headers.forEach((value, key) => {
    console.log(`  ${key}: ${value}`);
  });

  console.log("=== End Headers ===");

  return handler(request);
};

export {
  wrappedHandler as GET,
  wrappedHandler as POST,
  wrappedHandler as DELETE,
};
