import { useState, useEffect } from 'react'
import { Sun, CloudSun, CloudFog, CloudRain, Snowflake, CloudDrizzle, CloudSnow, CloudLightning } from 'lucide-react'
import './WeatherInfo.css'

export default function WeatherInfo() {
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cidade, setCidade] = useState('')

  useEffect(() => {
    initWeather()
  }, [])

  const initWeather = async () => {
    setLoading(true)

    // Tentar geolocalização do navegador (GPS)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          console.log('GPS encontrado:', latitude, longitude)
          await fetchWeatherData(latitude, longitude)
          await fetchCityName(latitude, longitude)
          setLoading(false)
        },
        async () => {
          // GPS falhou, tenta IP-based geolocation
          console.log('GPS falhou, tentando IP-based geolocation')
          await tryIPBasedGeolocation()
          setLoading(false)
        },
        { timeout: 5000, maximumAge: 0 }
      )
    } else {
      // Sem geolocation, usa IP
      console.log('Geolocation não disponível, usando IP-based')
      await tryIPBasedGeolocation()
      setLoading(false)
    }
  }

  const tryIPBasedGeolocation = async () => {
    try {
      // Usar AbortController para timeout correto
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 5000)

      // Usar ipapi.co para obter localização por IP
      const response = await fetch('https://ipapi.co/json/', {
        signal: controller.signal
      })
      clearTimeout(timer)
      const data = await response.json()

      if (data.latitude && data.longitude && !data.error) {
        console.log('IP Geolocation encontrado:', data.latitude, data.longitude, data.city)
        setCidade(data.city || '')
        await fetchWeatherData(data.latitude, data.longitude)
      } else {
        console.log('IP Geolocation falhou, usando SP como padrão')
        await useDefaultLocation()
      }
    } catch (err) {
      console.error('Erro ao buscar localização por IP:', err.message)
      await useDefaultLocation()
    }
  }

  const useDefaultLocation = async () => {
    console.log('Usando localização padrão (São Paulo)')
    setCidade('São Paulo')
    await fetchWeatherData(-23.5505, -46.6333)
  }

  const fetchWeatherData = async (lat, lon) => {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 8000)
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`
      const response = await fetch(url, { signal: controller.signal })
      clearTimeout(timer)
      const data = await response.json()

      if (data.current_weather) {
        const weatherData = {
          temperatura: Math.round(data.current_weather.temperature),
          codigo: data.current_weather.weathercode
        }
        setWeather(weatherData)
        console.log('Clima obtido:', weatherData, 'coords:', lat, lon)
      }
    } catch (err) {
      console.error('Erro ao buscar clima:', err.message)
    }
  }

  const fetchCityName = async (lat, lon) => {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 5000)
      const url = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&language=pt`
      const response = await fetch(url, { signal: controller.signal })
      clearTimeout(timer)
      const data = await response.json()
      if (data?.results?.[0]) {
        const cityName = data.results[0].name
        console.log('Cidade por GPS reverse geocoding:', cityName)
        setCidade(cityName)
      }
    } catch (e) {
      console.error('Erro ao buscar nome da cidade:', e.message)
    }
  }

  // Converter código do tempo em ícone
  const getWeatherIcon = (codigo) => {
    if (codigo === 0) return Sun
    if (codigo <= 3) return CloudSun
    if (codigo <= 48) return CloudFog
    if (codigo <= 67) return CloudRain
    if (codigo <= 77) return Snowflake
    if (codigo <= 82) return CloudDrizzle
    if (codigo <= 86) return CloudSnow
    if (codigo <= 99) return CloudLightning
    return CloudSun
  }

  if (loading) {
    return (
      <div className="weather-info weather-loading">
        <CloudSun size={18} className="weather-icon" />
      </div>
    )
  }

  if (!weather) {
    return (
      <div className="weather-info">
        <CloudSun size={18} className="weather-icon" />
      </div>
    )
  }

  const WeatherIcon = getWeatherIcon(weather.codigo)

  return (
    <div className="weather-info">
      <WeatherIcon size={18} className="weather-icon" />
      <span className="weather-temp">{weather.temperatura}°</span>
      {cidade && <span className="weather-cidade">{cidade}</span>}
    </div>
  )
}
