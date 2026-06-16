import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY")!

const PROMPT = `You are an assistant to a professional baker. Extract the recipe from the image(s) and return ONLY a valid JSON object with no markdown or extra text, in exactly this structure: {"title":"","category":"","time":"","servings":"","ingredients":["quantity unit ingredient per item"],"steps":["one step per item"],"notes":""} Rules: Keep the original language of the recipe. Do not translate. Each ingredient like "500 g bread flour". If a field is absent use "" or []. Return only the JSON.`

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS })
  const { images } = await req.json()
  const content = images.map((im: { media_type: string; data: string }) => ({
    type: "image", source: { type: "base64", media_type: im.media_type, data: im.data },
  }))
  content.push({ type: "text", text: PROMPT })
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, messages: [{ role: "user", content }] }),
  })
  const raw = await res.json()
  const text = (raw.content || []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("\n")
  try {
    let t = text.trim().replace(/^```json/i,"").replace(/^```/,"").replace(/```$/,"").trim()
    const a = t.indexOf("{"), b = t.lastIndexOf("}")
    if (a >= 0 && b > a) t = t.slice(a, b + 1)
    return new Response(JSON.stringify(JSON.parse(t)), { headers: { "Content-Type": "application/json", ...CORS } })
  } catch {
    return new Response(JSON.stringify({ error: "Could not parse recipe", raw: text }), { status: 422, headers: { "Content-Type": "application/json", ...CORS } })
  }
})
