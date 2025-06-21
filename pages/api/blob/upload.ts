import { NextApiRequest, NextApiResponse } from "next"
import { put } from "@vercel/blob"

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const { searchParams } = new URL(req.url || "", `http://${req.headers.host}`)
    const filename = searchParams.get("filename") || "file.json"
    const blob = await put(filename, req, {
      access: "public",
    })
    return res.status(200).json(blob)
  } catch (err) {
    return res.status(500).json({ error: (err instanceof Error ? err.message : String(err)) })
  }
}
