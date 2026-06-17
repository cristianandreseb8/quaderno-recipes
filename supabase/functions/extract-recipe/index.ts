import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const KEY = Deno.env.get("ANTHROPIC_API_KEY")!

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const EXTRACT_PROMPT = `You are an assistant to a professional baker.
Extract ALL recipe content from ALL images (they may be different pages of the same recipe).
Return ONLY a valid JSON object with no markdown:
{"title":"","category":"","time":"","servings":"","ingredients":["..."],"steps":["..."],"notes":""}

RULES: Keep original language. For multi-dough recipes prefix each section with "## Section Name" (e.g. "## Primo Impasto") as a line before its ingredients. Each ingredient: "500 g  bread flour" (quantity, unit, two spaces, name). One complete step per array element. Return only JSON.`

async function callClaude(messages: object[], maxTokens = 2000) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: maxTokens, messages }),
  })
  const data = await res.json()
  const text = (data.content || []).filter((b: {type:string}) => b.type === "text").map((b: {text:string}) => b.text).join("\n")
  let t = text.trim().replace(/^```json\s*/i,"").replace(/^```\s*/,"").replace(/\s*```$/,"").trim()
  const a = t.indexOf("{"), b = t.lastIndexOf("}")
  if (a >= 0 && b > a) t = t.slice(a, b + 1)
  return JSON.parse(t)
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS })

  const body = await req.json()

  try {
    let result

    if (body.type === "translate") {
      result = await callClaude([{ role: "user", content:
        `Translate this recipe JSON to ${body.targetLang}. Keep quantities, units, technical baking terms, and the ## section header syntax. Return ONLY valid JSON, same structure, no markdown:\n\n${JSON.stringify(body.recipe)}`
      }])
    } else if (body.type === "structure") {
      result = await callClaude([{ role: "user", content:
        `You are an assistant to a professional baker. Structure this recipe text as JSON.\nReturn ONLY valid JSON, no markdown:\n{"title":"","category":"","time":"","servings":"","ingredients":["..."],"steps":["..."],"notes":""}\nRules: keep original language; for multi-dough recipes prefix each section with "## Section Name"; ingredient lines: "500 g  flour" (two spaces between unit and name); one step per element.\n\nRecipe:\n${body.text}`
      }])
    } else {
      const content = body.images.map((im: {media_type:string;data:string}) => ({
        type: "image", source: { type: "base64", media_type: im.media_type, data: im.data },
      }))
      content.push({ type: "text", text: EXTRACT_PROMPT })
      result = await callClaude([{ role: "user", content }])
    }

    return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json", ...CORS } })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return new Response(JSON.stringify({ error: msg }), { status: 422, headers: { "Content-Type": "application/json", ...CORS } })
  }
})
