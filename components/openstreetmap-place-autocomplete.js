"use client";

import { useEffect, useRef, useState } from "react";

export default function OpenStreetMapPlaceAutocomplete({
  value = "", onChange, onSelect,
  placeholder = "Search a town, village or address",
  label = "LOCATION", inputId = "osm-location-search", className = "",
}) {
  const [input, setInput] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const selectionMade = useRef(false);

  /* eslint-disable react-hooks/set-state-in-effect -- Keep the input synchronized when a parent resets or loads a saved address. */
  useEffect(() => { setInput(value || ""); }, [value]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    function outside(event) {
      if (!root.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect -- Clear stale results when the user shortens or clears the query. */
  useEffect(() => {
    const query = input.trim();
    if (selectionMade.current) {
      selectionMade.current = false;
      return;
    }
    if (query.length < 3) {
      setSuggestions([]);
      setError("");
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ q: query });
        const response = await fetch("/api/places/autocomplete?" + params.toString(), { signal: controller.signal });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || "Location suggestions are unavailable.");
        setSuggestions(result.suggestions || []);
        setOpen(true);
      } catch (err) {
        if (err.name !== "AbortError") {
          setSuggestions([]);
          setError(err.message || "Unable to search locations.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 350);

    return () => { clearTimeout(timer); controller.abort(); };
  }, [input]);
  /* eslint-enable react-hooks/set-state-in-effect */

  function choose(suggestion) {
    const place = suggestion.place;
    if (!place || !Number.isFinite(place.latitude) || !Number.isFinite(place.longitude)) {
      setError("This location has no usable coordinates. Please choose another result.");
      return;
    }
    selectionMade.current = true;
    setInput(suggestion.description);
    onChange?.(suggestion.description);
    onSelect?.(place);
    setSuggestions([]);
    setOpen(false);
    setError("");
  }

  return (
    <div className={"location-autocomplete-field " + className} ref={root}>
      {label && <label className="location-autocomplete-label" htmlFor={inputId}>{label}</label>}
      <div className="location-autocomplete-input-wrap">
        <span className="location-autocomplete-pin" aria-hidden="true">⌖</span>
        <input id={inputId} value={input} autoComplete="off" placeholder={placeholder}
          onFocus={() => { if (suggestions.length) setOpen(true); }}
          onChange={(event) => {
            const next = event.target.value;
            selectionMade.current = false;
            setInput(next);
            onChange?.(next);
            setOpen(true);
            if (next.trim().length < 3) { setSuggestions([]); setLoading(false); setError(""); }
            if (!next.trim()) onSelect?.(null);
          }}
          aria-autocomplete="list" aria-expanded={open && suggestions.length > 0}
          aria-controls={inputId + "-suggestions"} role="combobox" />
        {loading && <span className="location-autocomplete-spinner" aria-label="Searching OpenStreetMap locations" />}
        {input && <button className="location-autocomplete-clear" type="button" aria-label="Clear location" onClick={() => {
          setInput(""); onChange?.(""); onSelect?.(null); setSuggestions([]); setError(""); setOpen(false);
        }}>×</button>}
      </div>
      {open && suggestions.length > 0 && <div className="location-autocomplete-suggestions" id={inputId + "-suggestions"} role="listbox">
        {suggestions.map((suggestion) => <button type="button" role="option" className="location-autocomplete-suggestion" key={suggestion.placeId} onClick={() => choose(suggestion)}>
          <span className="location-autocomplete-result-pin" aria-hidden="true">⌖</span>
          <span><strong>{suggestion.mainText}</strong>{suggestion.secondaryText && <small>{suggestion.secondaryText}</small>}</span>
        </button>)}
        <div className="location-autocomplete-attribution">© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a></div>
      </div>}
      {error && <p className="location-autocomplete-error" role="status">{error}</p>}
    </div>
  );
}
