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
  const logoUrl = new URL("../../../../public/logo.png", import.meta.url).toString();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "white",
        }}
      >
        <img
          src={logoUrl}
          alt="حرف چی"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </div>
    ),
    {
      width: dim,
      height: dim,
    },
  );
}
