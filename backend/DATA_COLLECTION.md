# Data Collection Pipeline

## Overview
The SpoilSense backend automatically collects sensor data (Temperature, Humidity, CO2) and stores it in a CSV file for historical analysis and trend visualization.

## Architecture

### Data Flow
```
ESP8266 Serial Port → Serial Reader → append_reading() + log_sensor_data() → CSV File
                                                                              ↓
                                    Analytics API → Frontend (Trends/Analytics)
```

### Components

#### 1. **Data Logger** (`app/core/data_logger.py`)
- Handles all CSV read/write operations
- Thread-safe logging with locks
- Location: `backend/data/sensor_data.csv`
- Columns: `Timestamp, Temperature, Humidity, CO2`

**Key Functions:**
- `log_sensor_data(temp, humidity, co2)` - Log a single reading
- `get_latest_data(limit=100)` - Retrieve last N data points
- `get_sensor_data_count()` - Get total data points collected
- `get_csv_file_path()` - Get CSV file location
- `clear_csv_data()` - Reset all data

#### 2. **Serial Reader Integration** (`app/core/serial_reader.py`)
- Modified to call `log_sensor_data()` after each successful reading
- Only logs data after warmup period
- Logs happen automatically, no manual intervention needed

#### 3. **Analytics API** (`app/routes/analytics.py`)
- Three new endpoints for retrieving historical data
- Designed for frontend consumption

## API Endpoints

### 1. Get Analytics Data with Trend Points
```
GET /analytics/data?limit=100
```

**Query Parameters:**
- `limit`: Number of data points (default: 100, max: 10000)

**Response:**
```json
{
  "total_points": 1523,
  "data": [
    {
      "Timestamp": "2026-04-07T14:32:01.123456",
      "Temperature": 24.5,
      "Humidity": 65.3,
      "CO2": 420.2
    },
    ...
  ],
  "csv_file": "/path/to/backend/data/sensor_data.csv"
}
```

### 2. Get Total Data Points Count
```
GET /analytics/data/count
```

**Response:**
```json
{
  "total_points": 1523
}
```

### 3. Get Statistical Summary
```
GET /analytics/data/stats
```

**Response:**
```json
{
  "total_points": 1523,
  "temperature_avg": 24.5,
  "temperature_min": 18.2,
  "temperature_max": 31.5,
  "humidity_avg": 62.1,
  "humidity_min": 45.0,
  "humidity_max": 85.3,
  "co2_avg": 425.6,
  "co2_min": 380.2,
  "co2_max": 520.8
}
```

## CSV File Structure

Located at: `backend/data/sensor_data.csv`

**Example:**
```csv
Timestamp,Temperature,Humidity,CO2
2026-04-07T14:32:01.123456,24.5,65.3,420.2
2026-04-07T14:32:11.234567,24.6,65.1,421.5
2026-04-07T14:32:21.345678,24.7,64.9,422.1
...
```

## Frontend Integration (Future)

The Analytics section in the frontend can consume these endpoints to:
- Display historical trends (line charts)
- Show statistics and averages
- Allow date range filtering
- Export data as CSV

### Example Frontend Hook (to be implemented):
```javascript
// pages/Analytics.jsx
const [trendData, setTrendData] = useState([]);

useEffect(() => {
  const fetchTrendData = async () => {
    const res = await api.get("/analytics/data?limit=500");
    setTrendData(res.data);
  };
  fetchTrendData();
}, []);
```

## Thread Safety

All CSV operations are protected by `threading.Lock` to ensure:
- No data corruption from concurrent access
- Safe logging while API reads data
- Safe reads while serial reader writes

## Logging Behavior

- **Before Warmup**: Data not logged (only buffered in memory)
- **After Warmup**: Every ESP8266 reading is logged to CSV
- **On Error**: Failed writes logged, doesn't crash the system
- **On Disconnect**: CSV continues to exist with historical data

## Data Retention

- CSV file persists even after device disconnects
- Data accumulated over the lifetime of the application
- Frontend can compute trends across weeks/months
- Manual reset available via API if needed

## Performance Considerations

- CSV append is **O(1)** operation (not full rewrite)
- Thread-safe but may have small lock overhead
- Reading API loads data into memory (adjustable limit)
- For very large datasets (100k+ rows), consider pagination

## Example Usage

**Populate data for testing:**
```bash
# Run backend with ESP8266
python run.py

# Wait for data to accumulate
# Then retrieve in frontend:
GET http://localhost:8000/analytics/data?limit=50
```

## Future Enhancements

- [ ] Database migration (SQLite/PostgreSQL)
- [ ] Data compression for old entries
- [ ] Date range filtering in API
- [ ] Bulk data export/import
- [ ] Time-based aggregation (hourly, daily)
- [ ] Anomaly detection on historical data
