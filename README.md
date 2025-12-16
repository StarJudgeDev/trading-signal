# Future Trading Signal Analyzer

A comprehensive system to manually input, store, and analyze trading signals. Track signal performance, calculate win rates, and identify the best performing channels.

## Features

- ✍️ **Manual Signal Input**: Easy-to-use forms to manually add signals and track updates
- 📊 **Signal Tracking**: Tracks entry, targets, stop loss, and updates
- 📈 **Performance Analysis**: Calculate win rates, completion rates, and identify best channels
- 🎯 **Real-time Updates**: Tracks when targets are reached (TP1, TP2, etc.)
- 💾 **MongoDB Storage**: Persistent storage for all signals and channel data
- 🖥️ **Modern Dashboard**: Beautiful React frontend with charts and statistics

## Project Structure

```
future/
├── backend/              # Node.js/Express backend
│   ├── models/          # MongoDB models (Signal, Channel)
│   ├── routes/          # API routes (signals, channels, analysis)
│   ├── services/        # Business logic (Telegram, parser)
│   └── server.js        # Express server
├── frontend/            # Vite + React frontend
│   └── src/
│       ├── components/  # React components
│       └── App.jsx      # Main app
└── package.json         # Root package.json
```

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or cloud instance)

### Installation

1. **Install dependencies:**
   ```bash
   npm run install:all
   ```

2. **Set up environment variables:**
   
   Copy the example env file:
   ```bash
   cp backend/.env.example backend/.env
   ```
   
   Edit `backend/.env` and add your:
   - MongoDB connection string
   - Port (default: 3001)

3. **Start MongoDB:**
   
   Make sure MongoDB is running on your system or update `MONGODB_URI` in `.env` to point to your MongoDB instance.

4. **Run the application:**
   
   Development mode (runs both backend and frontend):
   ```bash
   npm run dev
   ```
   
   Or run separately:
   ```bash
   # Backend only
   npm run dev:backend
   
   # Frontend only
   npm run dev:frontend
   ```

5. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

## Usage

### Manual Signal Entry (Primary Method)

1. **Add a Channel:**
   - Go to the "Channels" tab
   - Click "+ Add Channel"
   - Enter channel name and optional details
   - Click "Create Channel"

2. **Add a Signal:**
   - Go to the "Signals" tab
   - Click "+ Add Signal"
   - Fill in the signal details:
     - Select channel
     - Choose LONG or SHORT
     - Enter symbol (e.g., BAS, BTC)
     - Enter entry range (min and max)
     - Add targets (TP1, TP2, etc.)
     - Enter stop loss
   - Click "Create Signal"

3. **Update Signal:**
   - In the Signals list, click "Update" on any signal
   - Choose update type:
     - **Target Reached (TP)**: Mark specific target or number of targets
     - **Profit Locked**: Mark profit as locked/breakeven
     - **Stop Loss Hit**: Mark stop loss as hit
     - **General Update**: Add any other update
   - Click "Update Signal"


## Signal Format Support

The system automatically parses signals in various formats:

### Format 1:
```
Long Risk $BAS (Max 2x-3x) ↗️

- Entry: 0.007035 - 0.008205
- TP: 0.009009 - 0.010556 - 0.012290 - 0.015038 - 0.017025
- SL: 0.006350
```

### Format 2:
```
ZEC/USDT LONG
Entry: 381.73 – 376.32 (my entry 380.66)

Targets: 385.16 / 390.89 / 410.74
Stop: 357.11
```

### Update Messages:
The system also tracks update messages like:
- "🔥 We've successfully hit two targets on this trade..."
- "TP1 reached"
- "Profit locked, moving to breakeven"

## API Endpoints

### Signals
- `GET /api/signals` - Get all signals (with filters)
- `GET /api/signals/:id` - Get signal by ID
- `POST /api/signals` - Create signal manually
- `PUT /api/signals/:id` - Update signal
- `POST /api/signals/:id/targets/:index/reach` - Mark target as reached

### Channels
- `GET /api/channels` - Get all channels
- `GET /api/channels/:id` - Get channel by ID
- `GET /api/channels/:id/stats` - Get channel statistics
- `POST /api/channels` - Create channel
- `PUT /api/channels/:id` - Update channel

### Analysis
- `GET /api/analysis/overview` - Get overall statistics
- `GET /api/analysis/best-channels` - Get best performing channels
- `GET /api/analysis/channel-comparison` - Compare all channels
- `GET /api/analysis/trends` - Get performance trends

## Features in Detail

### Dashboard
- Overview statistics (total signals, win rate, etc.)
- Best performing channels
- 30-day performance trends

### Signals View
- Filter by status and channel
- View all signal details
- Track target progress

### Channels View
- List all monitored channels
- View individual channel statistics
- Track channel performance

### Analysis View
- Win rate comparison charts
- Channel performance metrics
- Signal volume distribution

## Technologies Used

- **Backend:**
  - Node.js + Express
  - MongoDB + Mongoose
  - Telegraf (Telegram bot framework)

- **Frontend:**
  - React
  - Vite
  - Recharts (for data visualization)
  - Axios (for API calls)

## Tips & Best Practices

1. **Manual Entry:**
   - Use the web interface for easy signal entry
   - You can copy-paste signal details from Telegram
   - All fields are validated before submission

2. **Signal Updates:**
   - Update signals when targets are reached
   - You can mark multiple targets at once (e.g., "hit two targets")
   - The system automatically calculates win rates based on updates

3. **Performance:**
   - MongoDB indexes are set up for optimal query performance
   - Consider adding more indexes if you have specific query patterns

4. **Analysis:**
   - Win rate is calculated as: (Wins / Total Signals) × 100
   - A signal is considered a "win" if it reaches at least one target
   - A signal is a "loss" if stop loss is hit

## Troubleshooting

**Bot not receiving messages:**
- Verify bot token is correct
- Ensure bot is added as admin to channels
- Check bot has permission to read messages

**Signals not parsing:**
- Check console logs for parsing errors
- Verify signal format matches supported patterns
- You can manually create signals via API

**MongoDB connection issues:**
- Verify MongoDB is running
- Check connection string in `.env`
- Ensure MongoDB port (default: 27017) is accessible

## Future Enhancements

- [ ] Price tracking integration
- [ ] Email/Telegram notifications
- [ ] Advanced filtering and search
- [ ] Export data to CSV/Excel
- [ ] Multi-timeframe analysis
- [ ] Risk/reward ratio calculations
- [ ] Portfolio tracking

## License

ISC

## Support

For issues or questions, please check the code comments or create an issue in the repository.

