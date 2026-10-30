// Opening provider links (Booking.com / Rentalcars.com) from web vs. the app.
//
// Web: a normal <a target="_blank"> is correct — it opens a new tab and the
//      app stays where it is.
//
// Capacitor/Android: target="_blank" silently does nothing. The WebView has no
//      onCreateWindow and Capacitor never calls setSupportMultipleWindows
//      (verified against @capacitor/android 8.6.0 BridgeWebViewClient.java /
//      Bridge.java), so the tap is dropped.
//
//      Capacitor DOES intercept same-window navigations:
//        shouldOverrideUrlLoading() -> Bridge.launchIntent(url)
//      and launchIntent opens the system browser (Intent.ACTION_VIEW) whenever
//      the URL is outside the app origin AND outside server.allowNavigation.
//      That config is unset here, so HostMask defaults to NOTHING and any
//      external URL is handed to the system browser while the app stays put.
//
//      So on a native platform we cancel the no-op click and navigate the
//      WebView ourselves, which Capacitor forwards to the external browser.
//      This keeps the app dependency-free (no @capacitor/browser plugin).

export function isNativePlatform() {
  if (typeof window === "undefined") return false;
  try {
    return Boolean(window.Capacitor?.isNativePlatform?.());
  } catch {
    return false;
  }
}

// Attach to an <a href={url} onClick={(e) => openExternal(e, url)}>.
export function openExternal(e, url) {
  if (!url) return;
  if (!isNativePlatform()) return; // web: let target="_blank" run normally
  e?.preventDefault();
  window.location.assign(url); // -> shouldOverrideUrlLoading -> system browser
}
