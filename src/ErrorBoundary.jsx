import React from "react";

export default class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("App error:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 500 }}>
          <h2>Something went wrong</h2>
          <p style={{ color: "#b00" }}>{this.state.error?.message || "Unknown error"}</p>
          <p style={{ fontSize: 14, opacity: 0.8 }}>Make sure the backend is running on port 5001.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
