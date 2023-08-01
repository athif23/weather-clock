const clock = document.getElementById('clock') as HTMLElement;
const date = document.getElementById('date') as HTMLElement;
const loc = document.getElementById('location') as HTMLElement;
const temp = document.getElementById('temperature') as HTMLElement;
const wIcon = document.getElementById('w_icon') as HTMLImageElement;
const wStatus = document.getElementById('w_status') as HTMLImageElement;

const nextDate1 = document.getElementById('nd1_date') as HTMLElement;
const nextTemp1 = document.getElementById('nd1_temperature') as HTMLElement;
const nextIcon1 = document.getElementById('nd1_w_icon') as HTMLImageElement;
const nextStatus1 = document.getElementById('nd1_w_status') as HTMLImageElement;

const nextDate2 = document.getElementById('nd2_date') as HTMLElement;
const nextTemp2 = document.getElementById('nd2_temperature') as HTMLElement;
const nextIcon2 = document.getElementById('nd2_w_icon') as HTMLImageElement;
const nextStatus2 = document.getElementById('nd2_w_status') as HTMLImageElement;

const template = document.getElementById('wmo_codes') as HTMLTemplateElement;

const API = `https://api.open-meteo.com/v1/forecast?hourly=temperature_2m,weathercode,is_day&daily=weathercode,temperature_2m_min&timezone=auto&`;

const CODE_STATUS = {
  0: 'Clear Sky',
  1: 'Mainly Clear',
  2: 'Partly Cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Rime Fog',
  51: 'Drizzle',
  53: 'Moderate Drizzle',
  55: 'Dense Drizzle',
  56: 'Freezing Drizzle',
  57: 'Dense Freezing Drizzle',
  61: 'Slight Rain',
  63: 'Rain',
  65: 'Heavy Rain',
  66: 'Light Freezing Rain',
  67: 'Heavy Freezing Rain',
  71: 'Slight Snow Falls',
  73: 'Snow Falls',
  75: 'Heavy Snow Falls',
  77: 'Snow Grains',
  80: 'Slight Rain Showers',
  81: 'Rain Showers',
  82: 'Violent Rain Showers',
  85: 'Slight Snow Showers',
  86: 'Heavy Snow Showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm',
  99: 'Heavy Hail'
}

function setDate () {
  date.textContent = getCurrentDateFormatted(0, true);
  nextDate1.textContent = getCurrentDateFormatted(1);
  nextDate2.textContent = getCurrentDateFormatted(2);
}

function setClock() {
  clock.textContent = getCurrentTime24HourFormat();
}

setDate();
interval(setDate, 86400000 /** Every day */);
setClock();
interval(setClock, 60000 /** Every minute */);

let latitude = '-5.25';
let longitude = '119.375';

async function fetchData () {
  const data = await fetch(`${API}latitude=${latitude}&longitude=${longitude}`).then((data) => data.json());

  const hourlyDate = data.hourly.time.map((d: string) => dateHours(new Date(d)));
  const dailyDate = data.daily.time.map((d: string) => new Date(d).getDate());

  const isDayOrNight = (currentWCode: number, idx: string | number) => currentWCode > 2 && Math.trunc(currentWCode / 10) !== 8 ? '' : data.hourly.is_day[idx] ? '_day' : '_night';
  return { data, hourlyDate, dailyDate, isDayOrNight }
}

main();

async function main () {
  let currentData = await fetchData();
  interval(async () => {
    currentData = await fetchData();
  }, 172800000 /** Every 2 day */);

  function setWeather() {
    const index = currentData.hourlyDate.indexOf(dateHours(new Date()));
    const currentTemperatur = Math.floor(currentData.data.hourly.temperature_2m[index]);
    const currentWCode = currentData.data.hourly.weathercode[index];

    const iconName = `${currentWCode}${currentData.isDayOrNight(currentWCode, index)}`;
    wIcon.src = (template.content.getElementById(iconName)  as HTMLImageElement).src;
    wStatus.textContent = CODE_STATUS[currentWCode];
    temp.textContent = `${currentTemperatur}`;
  }
  setWeather();
  interval(setWeather, 3600000 /** For every hour */);

  function setWeatherNextDay() {
    const nextDate1 = new Date();
    nextDate1.setDate(nextDate1.getDate() + 1);
    const nextIndex1 = currentData.dailyDate.indexOf(new Date(nextDate1).getDate());
    const nextTemperatur1 = Math.floor(currentData.data.daily.temperature_2m_min[nextIndex1]);
    const nextCode1 = currentData.data.hourly.weathercode[nextIndex1];
  
    nextTemp1.textContent = `${nextTemperatur1}`;
    const nextIconName1 = `${nextCode1}${currentData.isDayOrNight(nextCode1, nextIndex1)}`;
    nextIcon1.src = template.content.getElementById(nextIconName1).src;
    nextStatus1.textContent = CODE_STATUS[nextCode1];
  
    const nextDate2 = new Date();
    nextDate2.setDate(nextDate2.getDate() + 2);
    const nextIndex2 = currentData.dailyDate.indexOf(new Date(nextDate2).getDate());
    const nextTemperatur2 = Math.floor(currentData.data.daily.temperature_2m_min[nextIndex2]);
    const nextCode2 = currentData.data.hourly.weathercode[nd2idx];
  
    nextTemp2.textContent = `${nextTemperatur2}`;
    const nextIconName2 = `${nextCode2}${currentData.isDayOrNight(nextCode2, nd2idx)}`;
    nextIcon2.src = template.content.getElementById(nextIconName2).src;
    nextStatus2.textContent = CODE_STATUS[nextCode2];
  }

  setWeatherNextDay();
  interval(setWeatherNextDay, 86400000 /** For every day */);
}

function dateHours(date) {
  return date.getDate() + ' ' + date.getHours();
}

async function getCurrentLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (position: GeolocationPosition) => {
      latitude = position.coords.latitude + '';
      longitude = position.coords.longitude + '';
    
      const mapbox = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?types=place&access_token=pk.eyJ1IjoiYXRoaWYyMyIsImEiOiJjaWYyNHUyN3MxNWp3dGltNWUzMm1wZTB3In0.x9Va1J9Ai0zs35eKvzqsXg`).then(j => j.json());
    
      loc.textContent = mapbox.features[0].place_name;
    });
  } else {
    console.error("Geolocation is not supported by this browser.");
  }
}

function getCurrentTime24HourFormat() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function getCurrentDateFormatted(daysToAdd: number = 0, showYear = false) {
  const now = new Date();
  now.setDate(now.getDate() + daysToAdd);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = days[now.getDay()];
  const date = now.getDate();
  const month = months[now.getMonth()];
  const year = now.getFullYear();
  return `${day}, ${date} ${month}${showYear ? ' ' + year : ''}`;
}

function interval(fn: () => void, milisecond: number) {
  const time = milisecond - (Date.now() % milisecond);

  setTimeout(function () {
    fn();
    interval(fn, milisecond);
  }, time);
}
