# Global State — React Context

## Why Context?

Components in this app need to share state across the tree — for example, the map markers need to know the active filters, and the navbar needs to show the selected time. Passing this as props through every level would be messy. React Context solves this by making state available to any component without manual prop drilling.

## The Pattern

Every context follows the same three-part structure:

```
1. createContext()     → creates the "bucket"
2. Provider component → holds the useState, fills the bucket
3. Custom hook        → lets any component read from the bucket
```

Example with `FilterContext`:

```tsx
// 1. Create the bucket
const FilterContext = createContext(null);

// 2. Provider holds the actual state
export function FilterProvider({ children }) {
  const [sunnyOnly, setSunnyOnly] = useState(false);

  return (
    <FilterContext.Provider value={{ sunnyOnly, setSunnyOnly }}>
      {children}
    </FilterContext.Provider>
  );
}

// 3. Hook to read from any component
export function useFilters() {
  return useContext(FilterContext);
}
```

Usage in any component:

```tsx
function MarkerLayer() {
  const { sunnyOnly, minIntensity } = useFilters();
  // ...
}
```

## The Three Contexts

### FilterContext — `src/contexts/FilterContext.tsx`

Holds the active filter state used to filter map markers and search results.

| Field | Type | Description |
|---|---|---|
| `sunnyOnly` | `boolean` | Show only locations with sun |
| `minIntensity` | `number` | Minimum sun intensity (0–100) |
| `cuisine` | `string` | Filter restaurants by cuisine type |
| `query` | `string` | Free-text search string |

Hook: `useFilters()`

---

### TimeContext — `src/contexts/TimeContext.tsx`

Holds the datetime the user has selected with the Future-Sun-Slider. Defaults to the current time.

| Field | Type | Description |
|---|---|---|
| `selectedTime` | `string` | ISO 8601 datetime string |
| `setSelectedTime` | `function` | Update the selected time |

Hook: `useSelectedTime()`

Used by: the time slider, the shadow layer on the map, and the navbar (displays the current selection).

---

### MapContext — `src/contexts/MapContext.tsx`

Holds a reference to the Leaflet map instance plus the current viewport state. The `mapRef` lets non-map components (like the slider) call Leaflet methods directly.

| Field | Type | Description |
|---|---|---|
| `mapRef` | `RefObject<LeafletMap>` | Direct reference to the Leaflet map instance |
| `center` | `[lat, lng]` | Current map center |
| `zoom` | `number` | Current zoom level |

Hook: `useMapContext()`

Default center: Ghent, Belgium `[51.0543, 3.7174]`, zoom `14`.

---

## Provider Setup

All three providers are nested in `src/main.tsx` so every component in the app has access:

```tsx
<QueryClientProvider client={queryClient}>
  <FilterProvider>
    <TimeProvider>
      <MapProvider>
        <App />
      </MapProvider>
    </TimeProvider>
  </FilterProvider>
</QueryClientProvider>
```

`QueryClientProvider` is also included here — it is not a custom context but serves the same purpose for React Query (caching and fetching state).
