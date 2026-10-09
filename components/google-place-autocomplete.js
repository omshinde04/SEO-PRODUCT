"use client";

import { useEffect, useRef, useState } from "react";

function newSessionToken() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().replace(/-/g, "");
  }
  return `gc${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
}

export default function GooglePlaceAutocomplete({
  value = "",
  onChange,
  onSelect,
  placeholder = "Search a town, village or address",
  label = "LOCATION",
  inputId = "google-location-search",
  className = "",
}) {
  const [input, setInput] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [configured, setConfigured] = useState(true);
  const sessionToken = useRef(newSessionToken());
  const root = useRef(null);
  const selectionMade = useRef(false);

  useEffect(() => {
    setInput(value || "");
  }, [value]);

  useEffect(() => {
    function outside(event) {
      if (!root.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, []);

  useEffect(() => {
    const query = input.trim();
    if (selectionMade.current) {
      selectionMade.current = false;
      return;
    }
    if (query.length < 3) {
      setSuggestions([]);
      setLoading(false);
      setError("");
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ q: query, sessionToken: sessionToken.current });
        const response = await fetch(`/api/places/autocomplete?${params}`, { signal: controller.signal, cache: "no-store" });
        const result = await response.json();
        if (response.status === 503) setConfigured(false);
        if (!response.ok || !result.success) throw new Error(result.message || "Location suggestions are unavailable.");
        setConfigured(true);
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
    }, 280);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [input]);

  async function choose(suggestion) {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ placeId: suggestion.placeId, sessionToken: sessionToken.current });
      const response = await fetch(`/api/places/details?${params}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.success || !result.place) throw new Error(result.message || "Unable to load this location.");
      const place = { ...result.place, description: suggestion.description, mainText: suggestion.mainText };
      selectionMade.current = true;
      setInput(suggestion.description);
      onChange?.(suggestion.description);
      onSelect?.(place);
      setSuggestions([]);
      setOpen(false);
      sessionToken.current = newSessionToken();
    } catch (err) {
      setError(err.message || "Please select the location again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`google-place-field ${className}`} ref={root}>
      {label && <label className="google-place-label" htmlFor={inputId}>{label}</label>}
      <div className="google-place-input-wrap">
        <span className="google-place-pin" aria-hidden="true">⌖</span>
        <input id={inputId} value={input} autoComplete="off" placeholder={placeholder}
          onFocus={() => { if (suggestions.length) setOpen(true); }}
          onChange={(event) => {
            const next = event.target.value;
            setInput(next);
            onChange?.(next);
            setOpen(true);
            if (!next.trim()) onSelect?.(null);
          }}
          aria-autocomplete="list" aria-expanded={open && suggestions.length > 0} aria-controls={`${inputId}-suggestions`} role="combobox" />
        {loading && <span className="google-place-spinner" aria-label="Searching locations" />}
        {input && <button className="google-place-clear" type="button" aria-label="Clear location" onClick={() => {
          setInput(""); onChange?.(""); onSelect?.(null); setSuggestions([]); setError(""); setOpen(false); sessionToken.current = newSessionToken();
        }}>×</button>}
      </div>
      {open && suggestions.length > 0 && <div className="google-place-suggestions" id={`${inputId}-suggestions`} role="listbox">
        {suggestions.map((suggestion) => <button type="button" role="option" className="google-place-suggestion" key={suggestion.placeId} onClick={() => choose(suggestion)}>
          <span className="google-place-result-pin" aria-hidden="true">⌖</span><span><strong>{suggestion.mainText}</strong>{suggestion.secondaryText && <small>{suggestion.secondaryText}</small>}</span>
        </button>)}
        <div className="google-place-attribution"><img src="https://maps.gstatic.com/mapfiles/api-3/images/powered-by-google-on-white3.png" alt="Powered by Google" width="120" height="14" /></div>
      </div>}
      {error && <p className="google-place-error" role="status">{!configured ? "Google location search needs server configuration. " : ""}{error}</p>}
    </div>
  );
}
