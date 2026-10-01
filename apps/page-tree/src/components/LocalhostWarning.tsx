import React from "react";

export default function LocalhostWarning() {
  return (
    <div style={{ padding: 16 }}>
      <h3 style={{ marginTop: 0 }}>Running locally</h3>
      <p>
        This app is running on localhost. Install it in Contentful and point the
        app definition to your hosted URL when ready.
      </p>
    </div>
  );
}
