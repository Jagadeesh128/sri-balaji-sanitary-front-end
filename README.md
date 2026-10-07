# Sri Balaji Sanitary & Tiles

A React frontend for managing quotations, stock, and product categories.

## Requirements

- Node.js 14 or later
- npm
- The backend API, if using stock and category management

## Getting started

Install dependencies and start the development server:

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000).

Available scripts:

| Command | Description |
| --- | --- |
| `npm start` | Start the development server |
| `npm test` | Run tests in watch mode |
| `npm run build` | Create an optimized production build in `build/` |

## Demo login

The frontend currently uses hardcoded demo credentials; authentication is not
connected to the backend:

- **Username:** `admin`
- **Password:** `admin123`

Do not use these credentials as production authentication.

## Backend API

The API client in `src/services/api.js` uses `http://localhost:8080` as its
base URL. Update `BASE_URL` there if your backend runs at a different address.
The backend must allow cross-origin requests from `http://localhost:3000`.

The frontend uses these endpoints:

| Feature | Method and path |
| --- | --- |
| List stock | `GET /inventory` |
| Add stock | `POST /inventory` |
| Get stock by ID | `GET /inventory/{id}` |
| Update stock | `PUT /inventory/{id}` |
| Delete stock | `DELETE /inventory/{id}` |
| Search stock | `GET /inventory/search?query={query}` |
| List categories | `GET /discounts` |
| Get category by brand | `GET /discounts/{brand}` |
| Create or update a category | `POST /discounts` |
| Delete category by brand | `DELETE /discounts/{brand}` |
| Save a quotation | `POST /quotations` |

Configure CORS on the backend for the frontend origin. For example, a Spring
Boot backend can allow `http://localhost:3000` for the required API routes and
HTTP methods.

## Project structure

```text
src/
  components/   Shared UI components and route guards
  context/      Authentication state
  pages/        Login, dashboard, stock, category, and quotation pages
  services/     Backend API client
  App.js        Application routes
  index.js      React entry point
```

## Notes

- Replace the placeholder logo references in `Header.js` and `Login.js` with
  your own asset if needed.
- The stock and category form fields are based on the current frontend model;
  keep them aligned with the backend API's request and response fields.
