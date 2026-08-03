import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** Simple B/W monogram — "BTN" is already the in-app shorthand for Back to Nature. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#111111",
          borderRadius: 6,
        }}
      >
        <span
          style={{
            color: "#ffffff",
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: -0.5,
          }}
        >
          BTN
        </span>
      </div>
    ),
    { ...size }
  );
}
