import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Ratios from the brand mark reference's home-screen icon swatch (132px
// rounded square: 11px bars, 9px gap, heights 32/64/44/78) scaled to 180px.
const BAR_HEIGHTS = [44, 87, 60, 106];

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 45,
          background: "#1B34FF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
        }}
      >
        {BAR_HEIGHTS.map((height, i) => (
          <div
            key={i}
            style={{
              width: 15,
              height,
              borderRadius: 999,
              background: i === 2 ? "#FF5A1F" : "#FFFFFF",
            }}
          />
        ))}
      </div>
    ),
    { ...size },
  );
}
