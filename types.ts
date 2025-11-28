
export interface CWAParameter {
  parameterName: string;
  parameterValue?: string;
  parameterUnit?: string;
}

export interface CWATime {
  startTime: string;
  endTime: string;
  parameter: CWAParameter;
}

export interface CWAWeatherElement {
  elementName: string;
  time: CWATime[];
}

export interface CWALocation {
  locationName: string;
  weatherElement: CWAWeatherElement[];
}

export interface CWAResponse {
  success: string;
  result: {
    resource_id: string;
    fields: Array<{
      id: string;
      type: string;
    }>;
  };
  records: {
    datasetDescription: string;
    location: CWALocation[];
  };
}

export interface FormattedWeatherTime {
  startTime: string;
  endTime: string;
  wx: string; // Weather description
  wxValue: number; // Weather code
  pop: string; // Probability of Precipitation
  minT: string; // Min Temp
  maxT: string; // Max Temp
  ci: string; // Comfort Index
}

export interface FormattedLocation {
  locationName: string;
  forecasts: FormattedWeatherTime[];
}

// --- Types for Weekly Forecast (F-D0047-091) ---

export interface WeeklyElementValue {
    Weather?: string;
    WeatherCode?: string;
    MaxTemperature?: string;
    MinTemperature?: string;
    ProbabilityOfPrecipitation?: string; // 12h
    WindSpeed?: string;
    BeaufortScale?: string;
    [key: string]: string | undefined;
}

export interface WeeklyTimeBlock {
    StartTime: string;
    EndTime: string;
    ElementValue: WeeklyElementValue[];
}

export interface WeeklyWeatherElement {
    ElementName: string;
    Time: WeeklyTimeBlock[];
}

export interface WeeklyLocation {
    LocationName: string;
    WeatherElement: WeeklyWeatherElement[];
}

export interface WeeklyApiResponse {
    success: string;
    records: {
        Locations: Array<{
            Location: WeeklyLocation[];
        }>;
    };
}

export interface DayPartForecast {
    type: 'day' | 'night';
    startTime: string;
    wx: string;
    wxCode: number;
    temp: number; // Average of Max/Min or just Max for Day, Min for Night
    pop: string;
    windLevel: string;
}

export interface DailyForecast {
    date: string; // YYYY-MM-DD
    day?: DayPartForecast;
    night?: DayPartForecast;
}
