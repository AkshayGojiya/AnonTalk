import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          background: "#1B34FF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#FFFFFF",
          fontSize: 20,
          fontWeight: 800,
          fontFamily: "sans-serif",
        }}
      >
        A
      </div>
    ),
    { ...size },
  );
}
