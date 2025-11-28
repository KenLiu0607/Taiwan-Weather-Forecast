
import { API_BASE_URL, API_KEY, DATA_ID_36H, DATA_ID_WEEKLY, LOCATION_ORDER } from '../constants';
import { CWAResponse, FormattedLocation, FormattedWeatherTime, CWALocation, WeeklyApiResponse, DailyForecast, DayPartForecast } from '../types';

export const fetchWeatherForecast = async (): Promise<FormattedLocation[]> => {
  try {
    const url = `${API_BASE_URL}/${DATA_ID_36H}?Authorization=${API_KEY}&format=JSON&sort=time`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Error fetching weather data: ${response.statusText}`);
    }

    const data: CWAResponse = await response.json();
    
    if (data.success !== "true") {
      throw new Error("API returned unsuccessful status");
    }

    return formatWeatherData(data.records.location);
  } catch (error) {
    console.error("Weather fetch failed:", error);
    throw error;
  }
};

const formatWeatherData = (locations: CWALocation[]): FormattedLocation[] => {
  const formatted = locations.map((location) => {
    // We expect 3 time periods (12h each) for 36h forecast
    const periods = 3;
    const forecasts: FormattedWeatherTime[] = [];

    // Extract elements
    const wx = location.weatherElement.find(e => e.elementName === "Wx");
    const pop = location.weatherElement.find(e => e.elementName === "PoP");
    const minT = location.weatherElement.find(e => e.elementName === "MinT");
    const maxT = location.weatherElement.find(e => e.elementName === "MaxT");
    const ci = location.weatherElement.find(e => e.elementName === "CI");

    if (!wx || !pop || !minT || !maxT || !ci) {
        return { locationName: location.locationName, forecasts: [] };
    }

    for (let i = 0; i < periods; i++) {
        // Ensure data exists for this period
        if (wx.time[i] && pop.time[i] && minT.time[i] && maxT.time[i] && ci.time[i]) {
            forecasts.push({
                startTime: wx.time[i].startTime,
                endTime: wx.time[i].endTime,
                wx: wx.time[i].parameter.parameterName,
                wxValue: parseInt(wx.time[i].parameter.parameterValue || "0", 10),
                pop: pop.time[i].parameter.parameterName,
                minT: minT.time[i].parameter.parameterName,
                maxT: maxT.time[i].parameter.parameterName,
                ci: ci.time[i].parameter.parameterName,
            });
        }
    }

    return {
      locationName: location.locationName,
      forecasts,
    };
  });

  // Sort locations based on the defined order
  return formatted.sort((a, b) => {
    let indexA = LOCATION_ORDER.indexOf(a.locationName);
    let indexB = LOCATION_ORDER.indexOf(b.locationName);
    
    if (indexA === -1) indexA = 999;
    if (indexB === -1) indexB = 999;
    
    return indexA - indexB;
  });
};

// --- Weekly Forecast Logic ---

export const fetchWeeklyForecast = async (locationName: string): Promise<DailyForecast[]> => {
  try {
    const url = `${API_BASE_URL}/${DATA_ID_WEEKLY}?Authorization=${API_KEY}&format=JSON`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Weekly fetch failed");
    
    const data: WeeklyApiResponse = await response.json();
    
    // Find the specific location (Note: Structure is Records -> Locations -> Location[])
    const locationData = data.records.Locations[0].Location.find(
        l => l.LocationName === locationName
    );

    if (!locationData) return [];

    return parseWeeklyData(locationData);

  } catch (error) {
    console.error("Error fetching weekly forecast:", error);
    return [];
  }
};

const parseWeeklyData = (location: any): DailyForecast[] => {
    const dailyMap = new Map<string, DailyForecast>();

    // Helper to get element data
    const getElement = (name: string) => location.WeatherElement.find((e: any) => e.ElementName === name);

    const wxData = getElement("天氣現象")?.Time || [];
    const maxTData = getElement("最高溫度")?.Time || [];
    const minTData = getElement("最低溫度")?.Time || [];
    const popData = getElement("12小時降雨機率")?.Time || [];
    const wsData = getElement("風速")?.Time || [];

    // Iterate through time blocks (usually Wx has the most consistent time blocks)
    wxData.forEach((block: any, index: number) => {
        const startTime = new Date(block.StartTime);
        const hour = startTime.getHours();
        const dateStr = startTime.toISOString().split('T')[0];

        // Determine if it's Day (approx 06:00) or Night (approx 18:00)
        // CWA API typically aligns 06-18 and 18-06.
        const isDay = hour >= 6 && hour < 18;
        const type = isDay ? 'day' : 'night';

        if (!dailyMap.has(dateStr)) {
            dailyMap.set(dateStr, { date: dateStr });
        }

        const dayPart: DayPartForecast = {
            type,
            startTime: block.StartTime,
            wx: block.ElementValue[0].Weather || "",
            wxCode: parseInt(block.ElementValue[0].WeatherCode || "0", 10),
            temp: 0, // Placeholder
            pop: "0",
            windLevel: "-"
        };

        // Match other elements by index (assuming arrays are aligned, which they usually are in CWA data)
        // A safer way is finding matching StartTime, but index usually suffices for this API structure.
        // Let's try to match by StartTime for robustness.
        
        const findValue = (source: any[]) => source.find((item: any) => item.StartTime === block.StartTime);

        const maxTItem = findValue(maxTData);
        const minTItem = findValue(minTData);
        const popItem = findValue(popData);
        const wsItem = findValue(wsData);

        // For Temp: Day use MaxT, Night use MinT (or average, but Max/Min is better for display)
        // Actually, prompt asks for "Temp". Usually Day=Max, Night=Min is convention for simple view.
        if (isDay) {
             dayPart.temp = parseInt(maxTItem?.ElementValue[0].MaxTemperature || "0", 10);
        } else {
             dayPart.temp = parseInt(minTItem?.ElementValue[0].MinTemperature || "0", 10);
        }

        dayPart.pop = popItem?.ElementValue[0].ProbabilityOfPrecipitation === "-" ? "0" : (popItem?.ElementValue[0].ProbabilityOfPrecipitation || "0");
        dayPart.windLevel = wsItem?.ElementValue[0].BeaufortScale || "-";

        const entry = dailyMap.get(dateStr)!;
        if (isDay) entry.day = dayPart;
        else entry.night = dayPart;
    });

    // Convert map to array and sort by date
    return Array.from(dailyMap.values())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 7); // Limit to 7 days
};
