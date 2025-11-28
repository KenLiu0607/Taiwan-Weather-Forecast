
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { fetchWeatherForecast, fetchWeeklyForecast } from './services/weatherService';
import { FormattedLocation, DailyForecast } from './types';
import { ForecastCard } from './components/ForecastCard';
import { WeeklyForecast } from './components/WeeklyForecast';
import { Search, RefreshCw, AlertCircle, ChevronLeft, ChevronRight, MapPin, CloudLightning, Sun, Cloud } from 'lucide-react';

// --- Background Component ---
interface WeatherBackgroundProps {
  type: 'sunny' | 'cloudy' | 'rainy';
  isHot: boolean;
}

const WeatherBackground: React.FC<WeatherBackgroundProps> = ({ type, isHot }) => {
  // Determine gradient based on temperature FIRST, then texture based on weather
  let bgClass = "";
  
  if (isHot) {
    // Warm Theme (>= 28°C)
    if (type === 'sunny') {
       bgClass = "bg-gradient-to-br from-orange-500 via-red-500 to-yellow-400";
    } else if (type === 'cloudy') {
       bgClass = "bg-gradient-to-br from-orange-400 via-amber-400 to-stone-300";
    } else { // rainy
       // Warm rain (tropical storm feel)
       bgClass = "bg-gradient-to-b from-stone-600 via-orange-800/60 to-amber-900/60";
    }
  } else {
    // Cold Theme (< 28°C)
    if (type === 'sunny') {
       // Crisp cold sunny day
       bgClass = "bg-gradient-to-br from-blue-500 via-sky-400 to-cyan-300";
    } else if (type === 'cloudy') {
       bgClass = "bg-gradient-to-br from-slate-600 via-blue-400 to-sky-200";
    } else { // rainy
       // Cold rain
       bgClass = "bg-gradient-to-b from-slate-800 via-blue-900 to-indigo-900";
    }
  }

  return (
    <div className={`fixed inset-0 -z-50 transition-all duration-1000 ${bgClass}`}>
      
      {/* --- Sunny Animations --- */}
      {type === 'sunny' && (
        <>
          {/* Rotating Sun */}
          <div className="absolute top-[-100px] right-[-100px] animate-spin-slow opacity-90">
             <div className="relative">
                <Sun className={`w-[500px] h-[500px] ${isHot ? 'text-orange-200' : 'text-yellow-100'}`} />
                <div className={`absolute inset-0 blur-[80px] rounded-full opacity-60 ${isHot ? 'bg-orange-400' : 'bg-yellow-200'}`}></div>
             </div>
          </div>
          {/* Ambient Glow */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white rounded-full blur-[120px] opacity-30 animate-pulse-sun"></div>
        </>
      )}

      {/* --- Cloudy/Rainy Clouds --- */}
      {(type === 'cloudy' || type === 'rainy') && (
        <>
          <div className="absolute top-[5%] left-[5%] opacity-60 animate-float">
            <Cloud className={`w-80 h-80 ${type === 'rainy' ? 'text-gray-400' : 'text-white'}`} fill="currentColor" />
          </div>
          <div className="absolute top-[15%] right-[10%] opacity-50 animate-float-reverse">
             <Cloud className={`w-60 h-60 ${type === 'rainy' ? 'text-gray-500' : 'text-slate-100'}`} fill="currentColor" />
          </div>
          <div className="absolute bottom-[20%] left-[-5%] opacity-40 animate-float">
             <Cloud className={`w-96 h-96 ${type === 'rainy' ? 'text-gray-600' : 'text-slate-200'}`} fill="currentColor" />
          </div>
        </>
      )}

      {/* --- Rain Particles --- */}
      {type === 'rainy' && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Generate rain drops */}
          {[...Array(30)].map((_, i) => (
            <div 
              key={i}
              className={`absolute top-0 w-[2px] rounded-full animate-rain ${isHot ? 'bg-orange-100/40' : 'bg-blue-200/60'}`}
              style={{
                left: `${Math.random() * 100}%`,
                height: `${Math.random() * 20 + 10}px`,
                animationDuration: `${Math.random() * 0.5 + 0.5}s`,
                animationDelay: `${Math.random() * 2}s`
              }}
            />
          ))}
          <div className="absolute inset-0 bg-black/20"></div>
        </div>
      )}
      
      {/* Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
    </div>
  );
};


const App: React.FC = () => {
  const [data, setData] = useState<FormattedLocation[]>([]);
  const [weeklyData, setWeeklyData] = useState<DailyForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchWeatherForecast();
      setData(result);
    } catch (err) {
      setError("無法取得天氣資料，請稍後再試。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredData = useMemo(() => {
    return data.filter(loc => 
      loc.locationName.includes(filter)
    );
  }, [data, filter]);

  // Effect to fetch weekly data when active city changes
  useEffect(() => {
    const fetchWeekly = async () => {
        if (filteredData.length > 0) {
            const cityName = filteredData[currentIndex].locationName;
            const wData = await fetchWeeklyForecast(cityName);
            setWeeklyData(wData);
        }
    };
    
    // Debounce slightly or check logic to prevent double fetch on init if needed
    // But usually acceptable for this scale.
    if (!loading) {
        fetchWeekly();
    }
  }, [currentIndex, filteredData, loading]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [filter]);

  // Auto Rotation
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (isAutoPlaying && !loading && filteredData.length > 1 && !isHovered) {
      interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % filteredData.length);
      }, 5000);
    }

    return () => clearInterval(interval);
  }, [isAutoPlaying, loading, filteredData.length, isHovered]);


  // Determine Theme based on ACTIVE (Center) item
  const themeInfo = useMemo(() => {
    if (loading || filteredData.length === 0) return { isHot: false, type: 'sunny' as const };
    
    const activeItem = filteredData[currentIndex];
    const maxT = parseInt(activeItem.forecasts[0]?.maxT || "25", 10);
    // Strict threshold: >= 28 is HOT, < 28 is COLD
    const isHot = maxT >= 28;

    const wx = activeItem.forecasts[0]?.wxValue || 0;
    
    // Logic for weather type (animations)
    let type: 'sunny' | 'rainy' | 'cloudy' = 'cloudy';
    if (wx === 1 || wx === 24) type = 'sunny';
    else if ((wx >= 8 && wx <= 14) || (wx >= 19 && wx <= 22) || wx >= 29) type = 'rainy';
    else type = 'cloudy';

    return { isHot, type };
  }, [loading, filteredData, currentIndex]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % filteredData.length);
    setIsAutoPlaying(false); // Pause on interaction
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + filteredData.length) % filteredData.length);
    setIsAutoPlaying(false);
  };

  // Helper to calculate style for each card in the 3D stack
  const getCardStyle = (index: number) => {
    const total = filteredData.length;
    
    // Calculate distance from current index, handling wrap-around
    let offset = (index - currentIndex) % total;
    if (offset < 0) offset += total;
    
    // We want short paths: e.g. if total is 10, offset 9 is actually -1 (Left)
    if (offset > total / 2) offset -= total;

    // We only care about rendering -1 (Left), 0 (Center), 1 (Right). 
    // Others can be hidden or pushed far away.
    const isVisible = Math.abs(offset) <= 1;
    
    // Styles
    let transform = '';
    let zIndex = 0;
    let opacity = 0;
    let pointerEvents: 'auto' | 'none' = 'none';

    if (offset === 0) {
      // CENTER
      transform = `translateX(0) scale(1.1)`;
      zIndex = 20;
      opacity = 1;
      pointerEvents = 'auto';
    } else if (offset === -1) {
      // LEFT
      transform = `translateX(-60%) scale(0.9) perspective(1000px) rotateY(15deg)`;
      zIndex = 10;
      opacity = 0.8;
      pointerEvents = 'auto';
    } else if (offset === 1) {
      // RIGHT
      transform = `translateX(60%) scale(0.9) perspective(1000px) rotateY(-15deg)`;
      zIndex = 10;
      opacity = 0.8;
      pointerEvents = 'auto';
    } else {
      // HIDDEN (Push far away to prevent ghost clicks)
      transform = `translateX(${offset * 100}%) scale(0.5)`;
      opacity = 0;
    }

    return {
      transform,
      zIndex,
      opacity,
      pointerEvents,
      // Use absolute positioning to stack them
      position: 'absolute' as 'absolute',
      top: 0,
      left: 0,
      right: 0,
      margin: 'auto',
      width: '100%',
      maxWidth: '380px', // Matches card max width
      transition: 'all 0.7s cubic-bezier(0.25, 0.8, 0.25, 1)',
    };
  };

  return (
    <div className="min-h-screen relative flex flex-col font-sans overflow-x-hidden overflow-y-auto pb-10">
      
      {/* Dynamic Weather Background */}
      <WeatherBackground type={themeInfo.type} isHot={themeInfo.isHot} />

      {/* Glass Header */}
      <header className="pt-6 pb-2 z-30">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-4 shadow-xl flex flex-col items-center">
            <h1 className="text-2xl md:text-3xl font-black tracking-widest text-white drop-shadow-lg flex items-center gap-3">
               <MapPin className="w-8 h-8 text-white" />
               台灣天氣預報
            </h1>
            
            <div className="relative w-full mt-4">
               <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10 focus-within:bg-white/30 transition-colors">
                  <Search className="w-5 h-5 text-white/70 mr-2" />
                  <input
                    type="text"
                    placeholder="搜尋縣市..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-white placeholder-white/50 font-medium"
                  />
                  {loading && <RefreshCw className="w-4 h-4 text-white/70 animate-spin" />}
               </div>
            </div>
          </div>
        </div>
      </header>

      {/* 3D Carousel Main Content */}
      <main className="flex-shrink-0 flex flex-col items-center justify-center relative w-full z-10 py-6">
        {error ? (
          <div className="bg-red-500/80 backdrop-blur text-white px-8 py-6 rounded-2xl flex items-center shadow-2xl">
            <AlertCircle className="w-8 h-8 mr-4" />
            <span className="text-lg font-bold">{error}</span>
            <button onClick={loadData} className="ml-6 bg-white text-red-500 px-4 py-2 rounded-lg font-bold">重試</button>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center text-white my-20">
             <RefreshCw className="w-16 h-16 animate-spin mb-4" />
             <p className="text-xl font-medium tracking-widest">載入天氣資訊中...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-white text-center bg-black/30 backdrop-blur-md p-10 rounded-3xl my-10">
            <CloudLightning className="w-20 h-20 mx-auto mb-4 opacity-70" />
            <p className="text-2xl font-bold">未找到相關地區</p>
          </div>
        ) : (
          <div 
             className="relative w-full max-w-5xl h-[450px] flex justify-center items-center mb-4"
             onMouseEnter={() => setIsHovered(true)}
             onMouseLeave={() => setIsHovered(false)}
          >
             
             {/* Navigation Buttons */}
             <button 
                onClick={handlePrev} 
                className="absolute left-4 md:left-10 z-40 p-3 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-md border border-white/20 transition-all hover:scale-110 active:scale-95"
             >
                <ChevronLeft className="w-8 h-8" />
             </button>
             
             <button 
                onClick={handleNext} 
                className="absolute right-4 md:right-10 z-40 p-3 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-md border border-white/20 transition-all hover:scale-110 active:scale-95"
             >
                <ChevronRight className="w-8 h-8" />
             </button>

             {/* Cards Container */}
             <div className="relative w-full h-full flex justify-center items-center perspective-[1000px]">
                {filteredData.map((item, index) => {
                  return (
                    <div
                      key={item.locationName}
                      style={getCardStyle(index)}
                      className="origin-center"
                      onClick={() => {
                        // Click side card to navigate
                        if (index !== currentIndex) {
                            setCurrentIndex(index);
                            setIsAutoPlaying(false);
                        }
                      }}
                    >
                      <ForecastCard data={item} />
                    </div>
                  );
                })}
             </div>
          </div>
        )}
        
         {/* Navigation Dots - Moved closer with negative margin */}
        {!loading && filteredData.length > 0 && (
            <div className="w-full flex justify-center gap-2 z-30 px-4 overflow-x-auto no-scrollbar mb-6 -mt-24 relative pointer-events-auto">
            {filteredData.map((_, idx) => (
                <button
                key={idx}
                onClick={() => {
                    setCurrentIndex(idx);
                    setIsAutoPlaying(false);
                }}
                className={`h-2 rounded-full transition-all duration-300 shadow-lg ${
                    idx === currentIndex ? 'w-8 bg-white shadow-white/50' : 'w-2 bg-white/40 hover:bg-white/60'
                }`}
                />
            ))}
            </div>
        )}

        {/* Weekly Forecast Section */}
        {!loading && filteredData.length > 0 && (
            <div className="w-full z-20">
                <WeeklyForecast 
                  data={weeklyData} 
                  locationName={filteredData[currentIndex]?.locationName}
                />
            </div>
        )}

      </main>

      {/* Simple Footer */}
      <footer className="py-4 text-center z-20 mt-auto">
        <p className="text-white/60 text-xs font-medium tracking-widest">
           資料來源：中央氣象署 (CWA) | AUTO-UPDATE
        </p>
      </footer>
    </div>
  );
};

export default App;
