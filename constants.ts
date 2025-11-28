
export const API_KEY = "CWA-6F1CF5DE-CC2B-4CCD-B9AB-4E872EE0A59F";
export const API_BASE_URL = "https://opendata.cwa.gov.tw/api/v1/rest/datastore";
export const DATA_ID_36H = "F-C0032-001"; // General Weather Forecast - 36 Hours
export const DATA_ID_WEEKLY = "F-D0047-091"; // Township Weather Forecast - 1 Week

// Specific sort order for locations as requested
export const LOCATION_ORDER = [
  "基隆市",
  "新北市",
  "臺北市",
  "桃園市",
  "新竹市",
  "新竹縣",
  "宜蘭縣",
  "苗栗縣",
  "臺中市",
  "彰化縣",
  "南投縣",
  "雲林縣",
  "嘉義市",
  "嘉義縣",
  "臺南市",
  "高雄市",
  "屏東縣",
  "花蓮縣",
  "臺東縣",
  "澎湖縣",
  "金門縣",
  "連江縣"
];

// Map CWA Wx codes to Lucide icon names (simplified mapping)
// Codes reference: https://opendata.cwa.gov.tw/opendatadoc/CWA_Opendata_API_V1.2.pdf
export const WEATHER_ICON_MAP: Record<string, string> = {
  "01": "Sunny", // Sunny
  "02": "CloudySun", // Mostly Sunny
  "03": "CloudySun", // Partly Cloudy
  "04": "Cloudy", // Cloudy
  "05": "Cloudy", // Overcast
  "06": "Cloudy", //
  "07": "Cloudy", //
  "08": "Rain", // Showers
  "09": "Rain",
  "10": "Rain",
  "11": "Rain",
  "12": "Rain",
  "13": "Rain",
  "14": "Rain",
  "15": "Thunder",
  "16": "Thunder",
  "17": "Thunder",
  "18": "Thunder",
  "19": "Rain", // Rain
  "20": "Rain",
  "21": "Rain",
  "22": "Rain",
};
