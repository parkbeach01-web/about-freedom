// POST /api/responses
// 진단 응답 한 건을 D1 responses 테이블에 저장한다.
//
// 기대하는 요청 본문 (JSON):
//   {
//     "diagnostic":    "ambition",
//     "version":       "v3",
//     "answers":       { "q1": "a", "q2": "c", ... },
//     "dominant_fuel": "duty",            // "ego" | "duty" | "joy"
//     "intensity_avg": 52.5,              // 0~100
//     "result_type":   "guardian"
//   }

export async function onRequestPost({ request, env }) {
  // 1) JSON 파싱
  let data;
  try {
    data = await request.json();
  } catch (e) {
    return json({ error: "Invalid JSON body" }, 400);
  }

  // 2) 필수 필드 검증
  const required = [
    "diagnostic",
    "version",
    "answers",
    "dominant_fuel",
    "intensity_avg",
    "result_type",
  ];
  for (const f of required) {
    if (data[f] === undefined || data[f] === null) {
      return json({ error: `Missing field: ${f}` }, 400);
    }
  }

  // 3) 값 형식 가벼운 점검
  if (typeof data.intensity_avg !== "number") {
    return json({ error: "intensity_avg must be a number" }, 400);
  }
  if (!["ego", "duty", "joy"].includes(data.dominant_fuel)) {
    return json({ error: "dominant_fuel must be ego|duty|joy" }, 400);
  }

  // 4) 유입 출처는 요청 헤더에서 (있으면 저장, 없으면 null)
  const referrer = request.headers.get("Referer") || null;

  // 5) D1에 insert
  try {
    const result = await env.about_freedom_responses
      .prepare(
        `INSERT INTO responses
           (diagnostic, version, answers, dominant_fuel, intensity_avg, result_type, referrer)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        data.diagnostic,
        data.version,
        JSON.stringify(data.answers), // 객체를 텍스트로 변환해 저장
        data.dominant_fuel,
        data.intensity_avg,
        data.result_type,
        referrer
      )
      .run();

    return json({ ok: true, id: result.meta.last_row_id }, 201);
  } catch (e) {
    return json({ error: "DB error", detail: e.message }, 500);
  }
}

// POST 외 다른 메서드(GET 등)로 들어오면 405
export async function onRequest({ request }) {
  return json(
    { error: `Method ${request.method} not allowed` },
    405,
    { Allow: "POST" }
  );
}

// JSON 응답 헬퍼
function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...extraHeaders,
    },
  });
}
