-- 어바웃 프리덤 응답 데이터 수집 테이블
-- 진단 응답 한 건 = 한 행
-- 작성일: 2026-05-17

CREATE TABLE IF NOT EXISTS responses (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  diagnostic     TEXT    NOT NULL,           -- 'ambition' 등 어떤 진단지인지
  version        TEXT    NOT NULL,           -- 'v3' 등 진단지 버전
  answers        TEXT    NOT NULL,           -- JSON: 24문항 응답 묶음
  dominant_fuel  TEXT    NOT NULL,           -- 'ego' | 'duty' | 'joy'
  intensity_avg  REAL    NOT NULL,           -- 강도 평균 (0~100)
  result_type    TEXT    NOT NULL,           -- 6유형 키 (guardian 등)
  referrer       TEXT                        -- 유입 출처 URL (nullable)
);

-- 시간순 조회용 인덱스 (일별·시간대별 추이)
CREATE INDEX IF NOT EXISTS idx_responses_created_at
  ON responses(created_at);

-- 유형별 분포 조회용 인덱스
CREATE INDEX IF NOT EXISTS idx_responses_result_type
  ON responses(result_type);
