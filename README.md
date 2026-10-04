# Sri Balaji Sanitary & Tiles - Frontend

A React application for managing quotations, stock, and categories.

## Tech Stack
- React 18 + React Router v6
- Axios for API calls
- Plain CSS (no external UI framework required)
- react-icons for dashboard icons

## Getting Started

```bash
npm install
npm start
```

The app runs at `http://localhost:3000`.

## Login
This app uses hardcoded credentials (no backend auth call):
- **Username:** `admin`
- **Password:** `admin123`

## Backend API
The frontend expects a backend running at `http://localhost:8080` with these endpoints:

### Stock Management (`/inventory`)
- `POST /inventory` — Add stock
- `GET /inventory` — List all stock
- `GET /inventory/{id}` — View stock by ID
- `PUT /inventory/{id}` — Update stock
- `DELETE /inventory/{id}` — Delete stock

### Categories (`/discounts`)
- `POST /discounts` — Create or update a category (by brand)
- `GET /discounts` — List all categories
- `GET /discounts/{brand}` — View category by brand
- `DELETE /discounts/{brand}` — Delete category by brand

The base URL is set in `src/services/api.js` (`BASE_URL`). Change it there if your backend runs elsewhere.

## CORS Setup (Backend Side)
Since the frontend (`localhost:3000`) and backend (`localhost:8080`) run on different ports, your **backend** must allow cross-origin requests from the frontend. This must be configured on the backend server, not the frontend.

**Example — Spring Boot (Java):**
```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("http://localhost:3000")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*");
    }
}
```

**Example — Express (Node.js):**
```js
const cors = require("cors");
app.use(cors({ origin: "http://localhost:3000" }));
```

**Example — Flask (Python):**
```python
from flask_cors import CORS
CORS(app, origins=["http://localhost:3000"])
```

Once CORS is enabled on the backend, the Stock Management and Categories pages will be able to read/write data successfully.

## Project Structure
```
src/
  components/
    Header.js          # Top header: logo, business name, logout
    ProtectedRoute.js   # Guards routes behind login
  context/
    AuthContext.js      # Hardcoded login/logout state
  pages/
    Login.js
    Dashboard.js         # 4 tile buttons
    Quotations.js        # Placeholder page
    ViewQuotations.js    # Placeholder page
    StockManagement.js   # CRUD for /inventory
    Categories.js        # CRUD for /discounts
  services/
    api.js               # Axios instance + API functions
  App.js                 # Routes
  index.js
```

## Notes
- Replace the placeholder logo image URL in `Header.js` and `Login.js` with your actual logo file if desired (e.g. place it in `public/` and reference it as `/logo.png`).
- Field names in the Stock and Categories forms (`name`, `brand`, `quantity`, `price`, `category`, `discountPercent`) are assumptions based on typical inventory/discount models — adjust them in `StockManagement.js`, `Categories.js`, and your backend DTOs to match your actual API schema.
