import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const KEY = Deno.env.get("ANTHROPIC_API_KEY")!

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

async function claudeText(messages: object[], system?: string, maxTokens = 1500): Promise<string> {
  const body: Record<string, unknown> = { model: "claude-sonnet-4-6", max_tokens: maxTokens, messages }
  if (system) body.system = system
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  return (data.content || []).filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("\n")
}

async function claudeJson(messages: object[]) {
  const text = await claudeText(messages, undefined, 2000)
  let t = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/\s*```$/, "").trim()
  const a = t.indexOf("{"), b = t.lastIndexOf("}")
  if (a >= 0 && b > a) t = t.slice(a, b + 1)
  return JSON.parse(t)
}

const EXTRACT_PROMPT = `You are an assistant to a professional baker. Extract ALL recipe content from ALL images.
Return ONLY valid JSON, no markdown:
{"title":"","category":"","time":"","servings":"","ingredients":["..."],"steps":["..."],"notes":""}
RULES: Keep original language. For multi-dough recipes prefix each section with "## Section Name" on its own line. Ingredient format: "500 g  bread flour" (quantity, unit, 2 spaces, name). One complete step per element.`

const ASSISTANT_SYSTEM = (recipe: unknown, language: string) =>
  `You are an AI assistant for Quaderno AI, a professional recipe management app for bakers.

CURRENT RECIPE:
${JSON.stringify(recipe, null, 2)}

You can modify the recipe by wrapping actions in <ACTION> tags:
<ACTION>{"type":"scale","factor":2.5}</ACTION>
<ACTION>{"type":"translate","language":"Spanish"}</ACTION>
<ACTION>{"type":"update_field","field":"title","value":"New Title"}</ACTION>
<ACTION>{"type":"update_ingredients","ingredients":["500 g  flour","300 g  water"]}</ACTION>
<ACTION>{"type":"update_steps","steps":["Step 1...","Step 2..."]}</ACTION>
<ACTION>{"type":"add_note","content":"Important tip: ..."}</ACTION>

Always be concise. If making a change, include an ACTION tag. Language: ${language || "English"}.`

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS })

  const body = await req.json()

  try {
    let result: unknown

    if (body.type === "translate") {
      result = await claudeJson([{ role: "user", content: `Translate this recipe JSON to ${body.targetLang}. Keep quantities, units, technical baking terms, and ## section headers intact. Return ONLY valid JSON, same structure, no markdown:\n\n${JSON.stringify(body.recipe)}` }])
    } else if (body.type === "structure") {
      result = await claudeJson([{ role: "user", content: `Structure this recipe text as JSON. Return ONLY valid JSON, no markdown:\n{"title":"","category":"","time":"","servings":"","ingredients":["..."],"steps":["..."],"notes":""}\nFor multi-dough recipes use ## Section Name headers. Two spaces between unit and ingredient name.\n\nRecipe text:\n${body.text}` }])
    } else if (body.type === "assistant") {
      const text = await claudeText(body.messages, ASSISTANT_SYSTEM(body.recipe, body.language || "English"), 1000)
      result = { text }
    } else if (body.type === "format_note") {
      const text = await claudeText(
        [{ role: "user", content: `Format this voice note into a concise, useful baking note for the recipe "${body.recipe?.title || ""}". Keep it brief and practical. Voice transcript: "${body.transcript}"` }],
        undefined, 400
      )
      result = { text }
    } else if (body.type === "ai_suggest_notes") {
      const text = await claudeText(
        [{ role: "user", content: `Give 3 practical baking tips or observations for this recipe. Be specific and technical. Recipe: ${JSON.stringify(body.recipe)}. Existing notes: "${body.currentNotes || ""}"` }],
        undefined, 500
      )
      result = { text }
    } else {
      const content = (body.images || []).map((im: { media_type: string; data: string }) => ({
        type: "image", source: { type: "base64", media_type: im.media_type, data: im.data },
      }))
      content.push({ type: "text", text: EXTRACT_PROMPT })
      result = await claudeJson([{ role: "user", content }])
    }

    return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json", ...CORS } })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return new Response(JSON.stringify({ error: msg }), { status: 422, headers: { "Content-Type": "application/json", ...CORS } })
  }
})
