import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Same B/W monogram as app/icon.tsx, sized for the iOS home screen. */
export default function AppleIcon() {
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
        }}
      >
        <span
          style={{
            color: "#ffffff",
            fontSize: 64,
            fontWeight: 800,
            letterSpacing: -2,
          }}
        >
          BTN
        </span>
      </div>
    ),
    { ...size }
  );
}
