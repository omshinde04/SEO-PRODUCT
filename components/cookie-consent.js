"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "gaavconnect-cookie-preferences-v1";
const DEFAULTS = { necessary: true, analytics: false, marketing: false };

export default function CookieConsent() {
  const pathname = usePathname();
  const [preferences, setPreferences] = useState(null);
  const [visible, setVisible] = useState(false);
  const [customizing, setCustomizing] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setPreferences({ ...DEFAULTS, ...parsed, necessary: true });
        } else {
          setVisible(true);
        }
      } catch {
        setVisible(true);
      }
    });

    const openSettings = () => { setCustomizing(true); setVisible(true); };
    window.addEventListener("gaavconnect:cookie-settings", openSettings);
    const handleClick = (event) => {
      if (event.target.closest("[data-open-cookie-settings]")) openSettings();
    };
    document.addEventListener("click", handleClick);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("gaavconnect:cookie-settings", openSettings);
      document.removeEventListener("click", handleClick);
    };
  }, []);

  function save(next) {
    const safe = { ...DEFAULTS, ...next, necessary: true, updatedAt: new Date().toISOString() };
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(safe)); } catch {}
    setPreferences(safe);
    setVisible(false);
    setCustomizing(false);
  }

  if (pathname.startsWith("/admin") || !visible) return null;

  return (
    <div className="cookie-layer" role="region" aria-label="Cookie preferences">
      <div className="cookie-card">
        <div className="cookie-icon" aria-hidden="true">✳</div>
        <div className="cookie-copy">
          <span className="info-eyebrow">YOUR PRIVACY, YOUR CHOICE</span>
          <h2>{customizing ? "Choose your preferences" : "A little note about cookies"}</h2>
          <p>GaavConnect uses essential browser storage to remember your choices. Optional analytics and marketing preferences are off by default. We do not activate optional tracking through this banner.</p>
          {customizing && <div className="cookie-options">
            <div className="cookie-option"><div><strong>Essential</strong><small>Required for core site preferences. Always on.</small></div><input type="checkbox" checked readOnly aria-label="Essential storage always enabled" /></div>
            <label className="cookie-option"><div><strong>Analytics</strong><small>Would allow anonymous usage measurement if enabled in the future.</small></div><input type="checkbox" checked={Boolean(preferences?.analytics)} onChange={(event) => setPreferences((current) => ({ ...(current || DEFAULTS), analytics: event.target.checked }))} /></label>
            <label className="cookie-option"><div><strong>Marketing</strong><small>Would allow marketing-related storage if such tools are introduced.</small></div><input type="checkbox" checked={Boolean(preferences?.marketing)} onChange={(event) => setPreferences((current) => ({ ...(current || DEFAULTS), marketing: event.target.checked }))} /></label>
          </div>}
          <p className="cookie-policy-link">Read our <a href="/cookies">cookie policy</a> and <a href="/privacy">privacy notice</a>.</p>
        </div>
        <div className="cookie-actions">
          {!customizing ? <><button className="cookie-button cookie-primary" type="button" onClick={() => save({ necessary: true, analytics: true, marketing: true })}>Accept all</button><button className="cookie-button" type="button" onClick={() => save(DEFAULTS)}>Reject optional</button><button className="cookie-text-button" type="button" onClick={() => { setPreferences((current) => current || DEFAULTS); setCustomizing(true); }}>Customise</button></> : <><button className="cookie-button cookie-primary" type="button" onClick={() => save(preferences || DEFAULTS)}>Save choices</button><button className="cookie-button" type="button" onClick={() => save(DEFAULTS)}>Reject optional</button><button className="cookie-text-button" type="button" onClick={() => setCustomizing(false)}>Back</button></>}
        </div>
      </div>
    </div>
  );
}
