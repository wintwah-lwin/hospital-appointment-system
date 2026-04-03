import React from "react";

export default class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error(error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 500 }}>
          <h2>Oops</h2>
          <p style={{ color: "#b00" }}>{this.state.error?.message || "unknown error"}</p>
          <p style={{ fontSize: 14, color: "#666" }}>turn on the backend (port 5001)</p>
        </div>
      );
    }
    return this.props.children;
  }
}
