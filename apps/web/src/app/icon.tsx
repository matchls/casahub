import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

const PRIMARY = "#C2603F";

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
          background: PRIMARY,
          borderRadius: 7,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: 24,
              height: 12,
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-start",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                marginTop: 4,
                background: "#FBF6EF",
                transform: "rotate(45deg)",
                flexShrink: 0,
              }}
            />
          </div>
          <div
            style={{
              width: 16,
              height: 11,
              background: "#FBF6EF",
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
