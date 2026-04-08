import { ImageResponse } from "next/og";

const ALLOWED = new Set(["192", "512"]);

export async function GET(
  _request: Request,
  props: { params: Promise<{ size: string }> },
) {
  const { size: sizeParam } = await props.params;
  if (!ALLOWED.has(sizeParam)) {
    return new Response("Not Found", { status: 404 });
  }
  const dim = Number(sizeParam);
  const radius = Math.round(dim * 0.22);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #630ed4 0%, #7c3aed 100%)",
          borderRadius: radius,
        }}
      />
    ),
    {
      width: dim,
      height: dim,
    },
  );
}
