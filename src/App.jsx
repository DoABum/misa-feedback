import { useState, useEffect, useCallback } from "react";

const GLOBAL_STYLE = `
  .dmf-input, .dmf-select {
    width: 100%;
    padding: 8px 10px !important;
    background: #f0f2f5 !important;
    border: 1.5px solid #9ba3af !important;
    border-radius: 6px !important;
    color: inherit !important;
    font-size: 14px !important;
    font-family: inherit !important;
    box-sizing: border-box !important;
  }
  .dmf-input:focus, .dmf-select:focus {
    outline: none !important;
    border-color: #4b7cf3 !important;
    background: #fff !important;
  }
  .dmf-input:disabled {
    opacity: 0.45 !important;
    cursor: not-allowed !important;
  }
  @media (prefers-color-scheme: dark) {
    .dmf-input, .dmf-select {
      background: #2a2d35 !important;
      border-color: #4a5060 !important;
      color: #e8eaf0 !important;
    }
    .dmf-input:focus, .dmf-select:focus {
      background: #1e2028 !important;
      border-color: #4b7cf3 !important;
    }
  }
`;

const ADMIN_PW = "misa2027";

const suupOptions = [
  { label: "21시간 이상", value: 23.0 },
  { label: "20.5시간", value: 22.75 },
  { label: "20시간", value: 22.5 },
  { label: "19.5시간", value: 22.25 },
  { label: "19시간", value: 22.0 },
  { label: "18.5시간", value: 21.75 },
  { label: "18시간", value: 21.5 },
  { label: "17.5시간", value: 21.25 },
  { label: "17시간", value: 21.0 },
  { label: "16.5시간", value: 20.75 },
  { label: "16시간", value: 20.5 },
  { label: "15.5시간", value: 20.25 },
  { label: "15시간 이하", value: 20.0 },
];

const giganDamimTable = { 12: 20.0, 11: 19.85, 10: 19.7, 9: 19.55, 8: 19.4, 7: 19.25, 6: 19.1, 5: 18.95, 4: 18.8, 3: 18.65, 0: 18.5 };
const giganByDamimTable = { 12: 18.97, 11: 18.92, 10: 18.87, 9: 18.82, 8: 18.77, 7: 18.72, 6: 18.67, 5: 18.62, 4: 18.57, 3: 18.52, 0: 18.47 };

function defaultForm() {
  return {
    name: "",
    gyokwa: "gyokwa",
    jeonggi: "jeong",
    suup: 23.0,
    aDamim: "damim",
    suupMonths: 12,
    jaean: 0,
    dongryo: 0,
    dahak: 0,
    daegyo1: 0,
    daegyo2: 0,
    sunhoe: 0,
    damim: "damim",
    haknyeon: "no",
    hakpok: "no",
    bigyokwaType: "none",
    sangdam: 0,
    yeonsu: 5.0,
    yeonguCnt: 0,
    gyonae: "miisu",
    bujangType: "담임",
    gipi: "no",
    gyosaeng: "none",
    daehoe: 0,
    teuksaek: 0,
    hongbo: 0,
    dongari: "0",
    wiwon: 1.2,
    memo: "",
  };
}

function calcScores(f) {
  const isGyo = f.gyokwa === "gyokwa";
  const isDamim = f.aDamim === "damim" && f.gyokwa !== "bigyokwa";

  const isDamimA = f.aDamim === "damim" && f.gyokwa !== "bigyokwa";
  const damimSemesters = isDamimA ? (f.suupMonths >= 10 ? 2 : f.suupMonths >= 4 ? 1 : 0) : 0;
  const damimScoreBonus = damimSemesters * 0.25;

  let rawSuupScore;
  if (f.gyokwa === "bigyokwa") {
    rawSuupScore = 21.25;
  } else {
    rawSuupScore = Math.min(f.suup + damimScoreBonus, 23.0);
  }
  const suupMonthRatio = Math.min(f.suupMonths, 12) / 12;
  const suup = Math.round(rawSuupScore * suupMonthRatio * 100) / 100;
  let openScore;
  if (isGyo) {
    openScore = 1.3 + Math.min(f.jaean * 0.7, 0.7) + Math.min(f.dongryo * 0.5, 1.0);
  } else {
    openScore = 2.0 + Math.min(f.jaean * 0.5, 1.0);
  }
  const dahak = Math.min((f.gyokwa === "bigyokwa" ? 2 : f.dahak) * 0.15, 0.3);
  const daegyoRaw = ((f.daegyo1 || 0) + (f.daegyo2 || 0)) * 0.05;
  const daegyo = Math.min(daegyoRaw, 0.2);
  const sunhoe = (f.sunhoe && f.gyokwa !== "bigyokwa") ? 0.6 : 0;
  const gonran = Math.min(3.0 + dahak + daegyo + sunhoe, 4.0);
  const scoreA = suup + openScore + gonran;

  const useDamimTable = isDamim
    || f.haknyeon === "yes"
    || f.hakpok === "yes"
    || f.bigyokwaType === "bogun_youngyyang";

  let sangdamScore;
  if (isDamim || f.bigyokwaType === "bogun_youngyyang") {
    sangdamScore = 10.0;
  } else {
    const s = f.sangdam;
    if (s >= 40) sangdamScore = 9.8;
    else if (s >= 30) sangdamScore = 9.6;
    else if (s >= 20) sangdamScore = 9.4;
    else if (s >= 10) sangdamScore = 9.2;
    else sangdamScore = 9.0;
  }
  if (f.haknyeon === "yes") sangdamScore += 0.2;
  const m = parseInt(f.suupMonths);
  const giganScore = useDamimTable
    ? (giganDamimTable[m] ?? 18.5)
    : (giganByDamimTable[m] ?? 18.47);
  const scoreB = sangdamScore + giganScore;

  const yeonsuScore = f.yeonsu;
  const yeonguAct = Math.min(f.yeonguCnt * 0.03, 0.3);
  const gyonaeBase = f.gyonae === "회장" ? 3.0 : f.gyonae === "회원" ? 2.9 : 0;
  const yeonguBase = 1.7 + gyonaeBase;
  const yeonguScore = Math.min(yeonguBase + yeonguAct, 5.0);
  const scoreC = Math.min(yeonsuScore + yeonguScore, 10.0);

  const isBujang = ["주요부장", "기타부장"].includes(f.bujangType);
  const rate = isBujang ? 0.15 : 0.1;
  const bujangScore = 21.2 + rate * f.suupMonths;
  const gonTypeScore = f.bujangType === "주요부장" ? 2.0 : ["기타부장", "담임", "보건"].includes(f.bujangType) ? 1.75 : 1.5;
  const gipi = f.gipi === "yes" ? 0.15 : 0;
  const gyosaengScore = f.gyosaeng === "both" ? 0.1 : f.gyosaeng === "gyokwa" || f.gyosaeng === "damim" ? 0.05 : 0;
  const gonnandoScore = Math.round((gonTypeScore * f.suupMonths / 12 + gipi + gyosaengScore) * 1000) / 1000;
  const daehoe = Math.min(f.daehoe * 0.1, 0.2);
  const teuksaek = Math.min(f.teuksaek * 0.25, 0.5);
  const hongboVal = Math.min(f.hongbo * 0.05, 0.5);
  const dongari = parseFloat(f.dongari) || 0;
  const hongboTotal = Math.min(2.2 + daehoe + teuksaek + hongboVal + dongari, 3.5);
  const wiwonScore = f.wiwon;
  const scoreD = bujangScore + gonnandoScore + hongboTotal + wiwonScore;

  const total = scoreA + scoreB + scoreC + scoreD;
  return { scoreA, scoreB, scoreC, scoreD, total, suup, openScore, gonran, sangdamScore, giganScore, yeonsuScore, yeonguScore, bujangScore, gonnandoScore, hongboTotal, wiwonScore };
}

const s = {
  card: { background: "var(--color-background-primary)", border: "1.5px solid #9ba3af", borderRadius: "var(--border-radius-lg)", marginBottom: "1.25rem", overflow: "hidden" },
  cardHeader: { background: "#1a1a2e", padding: "10px 20px", display: "flex", alignItems: "center", gap: 8 },
  cardBody: { padding: "1.5rem 2rem" },
  label: { fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 4, display: "block" },
  sectionTitle: { fontSize: 13, fontWeight: 500, color: "#fff", letterSpacing: ".05em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 8, flex: 1 },
  scoreBadge: { fontSize: 12, background: "rgba(255,255,255,0.18)", color: "#fff", padding: "2px 8px", borderRadius: 20 },
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 16 },
  scoreRow: { display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 13 },
  btn: { padding: "9px 18px", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", background: "var(--color-background-primary)", color: "var(--color-text-primary)", fontSize: 14, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 },
  btnPrimary: { padding: "11px 0", width: "100%", background: "var(--color-text-primary)", color: "var(--color-background-primary)", border: "none", borderRadius: "var(--border-radius-md)", fontSize: 15, fontWeight: 500, cursor: "pointer", marginTop: "1rem", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },
  tab: (active) => ({ padding: "8px 16px", fontSize: 14, cursor: "pointer", border: "none", background: "none", color: active ? "var(--color-text-primary)" : "var(--color-text-secondary)", borderBottom: active ? "2px solid var(--color-text-primary)" : "2px solid transparent", fontWeight: active ? 500 : 400, marginBottom: -1 }),
};

function Field({ label, children }) {
  return (
    <div>
      <label style={s.label}>{label}</label>
      {children}
    </div>
  );
}

function ScoreRow({ label, value }) {
  return (
    <div style={s.scoreRow}>
      <span style={{ color: "var(--color-text-secondary)" }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{value.toFixed(2)}점</span>
    </div>
  );
}

function FormView({ initial, onSubmit, isEdit, onCancel, onPrint }) {
  const [f, setF] = useState(initial || defaultForm());
  const sc = calcScores(f);
  const isDamim = f.aDamim === "damim" && f.gyokwa !== "bigyokwa";
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const num = (k) => (e) => set(k, parseFloat(e.target.value) || 0);
  const sel = (k) => (e) => set(k, e.target.value);

  const grid2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 16 };

  return (
    <div>
      <div style={{ display: "flex", gap: 16, alignItems: "stretch", marginBottom: "1.5rem" }}>
        <div style={{ flex: 1, background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-lg)", padding: "1rem 1.5rem", display: "flex", alignItems: "center", gap: 12 }}>
          <label style={{ fontSize: 14, color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>선생님 성함</label>
          <input className="dmf-input" style={{ maxWidth: 200 }} value={f.name} onChange={e => set("name", e.target.value)} placeholder="홍길동" />
          <div style={{ width: 40, height: 40, borderRadius: "50%", border: "1.5px solid #9ba3af", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "var(--color-text-secondary)", flexShrink: 0 }}>인</div>
        </div>
        <div style={{ background: "#1a1a2e", borderRadius: "var(--border-radius-lg)", padding: "1rem 2rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minWidth: 180 }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>예상 총점</span>
          <span style={{ fontSize: 28, fontWeight: 700, color: "#fff" }}>{sc.total.toFixed(2)}</span>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>/ 100점</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        <div style={s.card}>
          <div style={s.cardHeader}>
            <div style={s.sectionTitle}>기초 자료</div>
          </div>
          <div style={s.cardBody}>
            <div style={grid2}>
              <Field label="교과/비교과 구분">
                <select className="dmf-select" value={f.gyokwa} onChange={e => { sel("gyokwa")(e); if (e.target.value === "bigyokwa") setF(p => ({ ...p, gyokwa: "bigyokwa", suup: 21.25, aDamim: "bydamim" })); else setF(p => ({ ...p, gyokwa: "gyokwa" })); }}>
                  <option value="gyokwa">교과</option>
                  <option value="bigyokwa">비교과</option>
                </select>
              </Field>
              <Field label="정교사/기간제 구분">
                <select className="dmf-select" value={f.jeonggi} onChange={sel("jeonggi")}>
                  <option value="jeong">정교사</option>
                  <option value="gigan">기간제교사</option>
                </select>
              </Field>
            </div>
            <div style={grid2}>
              <Field label="담임 여부">
                <select className="dmf-select" value={f.gyokwa === "bigyokwa" ? "bydamim" : f.aDamim} onChange={sel("aDamim")} disabled={f.gyokwa === "bigyokwa"}>
                  <option value="damim">담임</option>
                  <option value="bydamim">비담임</option>
                </select>
              </Field>
              <Field label="근무 개월 수">
                <select className="dmf-select" value={f.suupMonths} onChange={e => set("suupMonths", parseInt(e.target.value))}>
                  {[12,11,10,9,8,7,6,5,4,3,2,1].map(m => <option key={m} value={m}>{m}개월</option>)}
                </select>
              </Field>
            </div>
            <div style={grid2}>
              <Field label="학년부장 여부">
                <select className="dmf-select" value={f.haknyeon} onChange={sel("haknyeon")}>
                  <option value="no">해당없음</option>
                  <option value="yes">학년부장</option>
                </select>
              </Field>
              <Field label="학폭책임교사 여부">
                <select className="dmf-select" value={f.hakpok} onChange={sel("hakpok")}>
                  <option value="no">해당없음</option>
                  <option value="yes">학폭책임교사</option>
                </select>
              </Field>
            </div>
          </div>
        </div>

        <div style={s.card}>
          <div style={s.cardHeader}>
            <div style={s.sectionTitle}>가. 학습 지도</div>
            <span style={s.scoreBadge}>{sc.scoreA.toFixed(2)} / 30점</span>
          </div>
          <div style={s.cardBody}>
            <div style={grid2}>
              <Field label="주당 수업시수 (1,2학기 평균)">
                <select className="dmf-select" value={f.suup} onChange={e => set("suup", parseFloat(e.target.value))} disabled={f.gyokwa === "bigyokwa"}>
                  {suupOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
              <Field label={f.gyokwa === "gyokwa" ? "너른강 공개수업 횟수" : "공개연수/프로그램 운영 횟수"}>
                <input className="dmf-input" type="number" min={0} value={f.jaean} onChange={num("jaean")} />
              </Field>
            </div>
            <div style={grid2}>
              <Field label={f.gyokwa === "gyokwa" ? "동료/학부모 수업공개 횟수" : "(교과교사만 해당)"}>
                <input className="dmf-input" type="number" min={0} value={f.dongryo} onChange={num("dongryo")} disabled={f.gyokwa !== "gyokwa"} />
              </Field>
              <Field label="다학년 지도 학기 수">
                <select className="dmf-select" value={f.gyokwa === "bigyokwa" ? 2 : f.dahak} onChange={e => set("dahak", parseFloat(e.target.value))} disabled={f.gyokwa === "bigyokwa"}>
                  <option value={0}>해당없음</option>
                  <option value={1}>한 학기</option>
                  <option value={2}>두 학기</option>
                </select>
              </Field>
            </div>
            <div style={grid2}>
              <Field label="다교과 — 1학년 주제선택">
                <select className="dmf-select" value={f.daegyo1} onChange={e => set("daegyo1", parseFloat(e.target.value))}>
                  <option value={0}>해당없음</option>
                  <option value={1}>한 학기</option>
                  <option value={2}>두 학기</option>
                </select>
              </Field>
              <Field label="다교과 — 2,3학년 동아리">
                <select className="dmf-select" value={f.daegyo2} onChange={e => set("daegyo2", parseFloat(e.target.value))}>
                  <option value={0}>해당없음</option>
                  <option value={1}>한 학기</option>
                  <option value={2}>두 학기</option>
                </select>
              </Field>
            </div>
            <div style={{ ...grid2, marginBottom: 0 }}>
              <Field label="순회지도">
                <select className="dmf-select" value={f.gyokwa === "bigyokwa" ? 0 : f.sunhoe} onChange={e => set("sunhoe", parseFloat(e.target.value))} disabled={f.gyokwa === "bigyokwa"}>
                  <option value={0}>해당없음</option>
                  <option value={1}>해당</option>
                </select>
              </Field>
              <div />
            </div>
            <div style={{ borderTop: "0.5px solid var(--color-border-tertiary)", paddingTop: 8, marginTop: 12 }}>
              <ScoreRow label={"수업시수 (" + f.suupMonths + "개월" + (isDamim ? "+담임가산" : "") + ")"} value={sc.suup} />
              <ScoreRow label="공개수업" value={sc.openScore} />
              <ScoreRow label="학습지도 곤란도" value={sc.gonran} />
            </div>
          </div>
        </div>

        <div style={s.card}>
          <div style={s.cardHeader}>
            <div style={s.sectionTitle}>나. 생활 지도</div>
            <span style={s.scoreBadge}>{sc.scoreB.toFixed(2)} / 30점</span>
          </div>
          <div style={s.cardBody}>
            <div style={{ marginBottom: 12, fontSize: 12, color: "var(--color-text-secondary)", padding: "5px 10px", background: "var(--color-background-secondary)", borderRadius: 6 }}>
              담임: <strong>{isDamim ? "담임" : "비담임"}</strong>
              {" / "}근무: <strong>{f.suupMonths}개월</strong>
              {" / "}테이블: <strong>{(isDamim || f.haknyeon === "yes" || f.hakpok === "yes" || f.bigyokwaType === "bogun_youngyyang") ? "담임 기준" : "비담임 기준"}</strong>
            </div>
            {f.gyokwa === "bigyokwa" && (
              <div style={{ marginBottom: 12 }}>
                <Field label="비교과 교사 구분">
                  <select className="dmf-select" value={f.bigyokwaType} onChange={sel("bigyokwaType")}>
                    <option value="none">선택하세요</option>
                    <option value="bogun_youngyyang">보건,영양 (담임 기준)</option>
                    <option value="saso_sangdam">사서,전문상담 (비담임 기준)</option>
                  </select>
                </Field>
              </div>
            )}
            <div style={{ marginBottom: 16 }}>
              <Field label="나이스 상담 횟수 (출력물 제출 필요)">
                <input className="dmf-input" type="number" min={0} value={f.sangdam} onChange={num("sangdam")} disabled={isDamim || f.bigyokwaType === "bogun_youngyyang"} placeholder={isDamim || f.bigyokwaType === "bogun_youngyyang" ? "자동 10점" : ""} />
              </Field>
            </div>
            <div style={{ borderTop: "0.5px solid var(--color-border-tertiary)", paddingTop: 8 }}>
              <ScoreRow label="나이스 상담 실적" value={sc.sangdamScore} />
              <ScoreRow label="생활지도 기간" value={sc.giganScore} />
            </div>
          </div>
        </div>

        <div style={s.card}>
          <div style={s.cardHeader}>
            <div style={s.sectionTitle}>다. 전문성 개발</div>
            <span style={s.scoreBadge}>{sc.scoreC.toFixed(2)} / 10점</span>
          </div>
          <div style={s.cardBody}>
            <div style={grid2}>
              <Field label="직무연수 이수 시간 (출력물 제출 필요)">
                <select className="dmf-select" value={f.yeonsu} onChange={e => set("yeonsu", parseFloat(e.target.value))}>
                  <option value={5.0}>60시간 이상</option>
                  <option value={4.5}>45~59시간</option>
                  <option value={4.0}>30~44시간</option>
                  <option value={3.5}>30시간 미만</option>
                </select>
              </Field>
              <Field label="연구회 활동 횟수 (공문+복무 상황 제출)">
                <input className="dmf-input" type="number" min={0} value={f.yeonguCnt} onChange={num("yeonguCnt")} />
              </Field>
            </div>
            <div style={{ marginBottom: 12 }}>
              <Field label="교내 전문적 학습 공동체">
                <select className="dmf-select" value={f.gyonae} onChange={sel("gyonae")}>
                  <option value="miisu">미이수 (기본점수 없음)</option>
                  <option value="회장">이수 — 회장</option>
                  <option value="회원">이수 — 회원</option>
                </select>
              </Field>
            </div>
            <div style={{ borderTop: "0.5px solid var(--color-border-tertiary)", paddingTop: 8 }}>
              <ScoreRow label="직무연수" value={sc.yeonsuScore} />
              <ScoreRow label="연구회 활동" value={sc.yeonguScore} />
            </div>
          </div>
        </div>

        <div style={s.card}>
          <div style={s.cardHeader}>
            <div style={s.sectionTitle}>라. 담당 업무</div>
            <span style={s.scoreBadge}>{sc.scoreD.toFixed(2)} / 30점</span>
          </div>
          <div style={s.cardBody}>
            <div style={{ marginBottom: 12, fontSize: 12, color: "var(--color-text-secondary)", padding: "4px 10px" }}>
              근무 개월 수: <strong>{f.suupMonths}개월</strong> — 기초자료 자동 적용
            </div>
            <div style={grid2}>
              <Field label="교사 구분">
                <select className="dmf-select" value={f.bujangType} onChange={sel("bujangType")}>
                  <option value="주요부장">교무/학생/교육과정/학년/교육연구부장</option>
                  <option value="기타부장">기타 부장교사</option>
                  <option value="담임">담임교사</option>
                  <option value="보건">보건교사1</option>
                  <option value="기타">그 외 교사</option>
                </select>
              </Field>
              <Field label="기피업무 담당 (인사/성적)">
                <select className="dmf-select" value={f.gipi} onChange={sel("gipi")}>
                  <option value="no">해당없음</option>
                  <option value="yes">해당</option>
                </select>
              </Field>
            </div>
            <div style={grid2}>
              <Field label="교생지도">
                <select className="dmf-select" value={f.gyosaeng} onChange={sel("gyosaeng")}>
                  <option value="none">해당없음</option>
                  <option value="gyokwa">교과 (0.05점)</option>
                  <option value="damim">담임 (0.05점)</option>
                  <option value="both">모두 해당 (0.1점)</option>
                </select>
              </Field>
              <Field label="시도전국대회 학생지도">
                <select className="dmf-select" value={f.daehoe} onChange={e => set("daehoe", parseFloat(e.target.value))}>
                  <option value={0}>해당없음</option>
                  <option value={1}>1회 (0.1점)</option>
                  <option value={2}>2회 (0.2점)</option>
                </select>
              </Field>
            </div>
            <div style={grid2}>
              <Field label="학교특색사업">
                <select className="dmf-select" value={f.teuksaek} onChange={e => set("teuksaek", parseFloat(e.target.value))}>
                  <option value={0}>해당없음</option>
                  <option value={1}>1개 (0.25점)</option>
                  <option value={2}>2개 (0.5점)</option>
                </select>
              </Field>
              <Field label="교육활동 홍보 건수">
                <input className="dmf-input" type="number" min={0} value={f.hongbo} onChange={num("hongbo")} />
              </Field>
            </div>
            <div style={grid2}>
              <Field label="위원회 활동 수">
                <select className="dmf-select" value={f.wiwon} onChange={e => set("wiwon", parseFloat(e.target.value))}>
                  <option value={1.2}>없음</option>
                  <option value={1.3}>1개</option>
                  <option value={1.4}>2개</option>
                  <option value={1.5}>3개 이상</option>
                </select>
              </Field>
              <Field label="학생 자율동아리 지도">
                <select className="dmf-select" value={f.dongari} onChange={sel("dongari")}>
                  <option value="0">없음</option>
                  <option value="0.1">연단위 (0.1점)</option>
                  <option value="0.05">학기단위 (0.05점)</option>
                </select>
              </Field>
            </div>
            <div style={{ borderTop: "0.5px solid var(--color-border-tertiary)", paddingTop: 8 }}>
              <ScoreRow label="보직교사 점수" value={sc.bujangScore} />
              <ScoreRow label="업무 곤란도" value={sc.gonnandoScore} />
              <ScoreRow label="홍보,기여도" value={sc.hongboTotal} />
              <ScoreRow label="위원회 활동" value={sc.wiwonScore} />
            </div>
          </div>
        </div>

        <div style={s.card}>
          <div style={s.cardHeader}>
            <div style={s.sectionTitle}>담당자에게 전달 사항</div>
          </div>
          <div style={s.cardBody}>
            <Field label="점수 계산 오류 또는 업무 담당자에게 하고 싶은 말을 적어주세요">
              <textarea
                className="dmf-input"
                style={{ resize: "vertical", minHeight: 120, lineHeight: 1.6 }}
                value={f.memo || ""}
                onChange={e => set("memo", e.target.value)}
                placeholder="예) 수업시수 산정 기준이 다를 수 있어 별도 확인 요청드립니다."
              />
            </Field>
          </div>
        </div>

      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
        {isEdit && (
          <button style={{ ...s.btn, flex: 1 }} onClick={onCancel}>취소</button>
        )}
        <button style={{ ...s.btnPrimary, flex: isEdit ? 2 : 1, marginTop: 0 }} onClick={() => {
          if (!f.name.trim()) { alert("성함을 입력해주세요"); return; }
          onSubmit(f, sc);
        }}>
          {isEdit ? "수정 완료" : "제출하기"}
        </button>
        {!isEdit && (
          <button style={{ ...s.btn, flex: 1, justifyContent: "center" }} onClick={() => {
            if (!f.name.trim()) { alert("성함을 입력해주세요"); return; }
            onPrint(f, sc);
          }}>
            PDF로 저장
          </button>
        )}
      </div>
    </div>
  );
}

function PrintOverlay({ f, sc, onClose }) {
  const row = (label, val) =>
    `<tr><td style="padding:6px 12px;color:#555;font-size:13px;border-bottom:1px solid #eef0f2;width:55%">${label}</td><td style="padding:6px 12px;font-size:13px;border-bottom:1px solid #eef0f2;text-align:right;font-weight:500">${val}</td></tr>`;

  const damimLabel = f.aDamim === "damim" && f.gyokwa !== "bigyokwa" ? "담임" : "비담임";
  const suupMap = {"23":"21시간 이상","22.75":"20.5시간","22.5":"20시간","22.25":"19.5시간","22":"19시간","21.75":"18.5시간","21.5":"18시간","21.25":"17.5시간","21":"17시간","20.75":"16.5시간","20.5":"16시간","20.25":"15.5시간","20":"15시간 이하"};
  const suupLabel = f.gyokwa === "bigyokwa" ? "17.5시간 (비교과 자동)" : (suupMap[String(f.suup)] || f.suup + "점");
  const bujangLabels = {"주요부장":"교무/학생/교육과정/학년/교육연구부장","기타부장":"기타 부장교사","담임":"담임교사","보건":"보건교사1","기타":"그 외 교사"};
  const gyonaeLabel = f.gyonae === "miisu" ? "미이수" : f.gyonae === "회장" ? "회장" : "회원";
  const dongariLabel = f.dongari === "0" ? "없음" : f.dongari === "0.1" ? "연단위" : "학기단위";
  const wiwonLabel = f.wiwon >= 1.5 ? "3개 이상" : f.wiwon >= 1.4 ? "2개" : f.wiwon >= 1.3 ? "1개" : "없음";
  const gyosaengLabel = f.gyosaeng === "both" ? "모두 해당" : f.gyosaeng === "gyokwa" ? "교과" : f.gyosaeng === "damim" ? "담임" : "해당없음";

  const printStyle = `
    @media print { .no-print { display: none !important; } body { margin: 0; } .print-area { display: block !important; } }
    .print-area { font-family: 'Malgun Gothic', sans-serif; font-size: 13px; color: #1a1a2e; padding: 20px; }
    .total-box { background: #1a1a2e; color: #fff; border-radius: 8px; padding: 14px 20px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .p-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
    .p-section { border: 1px solid #dde3ea; border-radius: 6px; overflow: hidden; }
    .p-head { background: #1a1a2e; color: #fff; padding: 8px 12px; font-size: 13px; font-weight: 600; display: flex; justify-content: space-between; }
    .p-head span { font-weight: 400; opacity: 0.8; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; }
    .note { font-size: 11px; color: #888; margin-top: 16px; text-align: center; }
  `;

  useEffect(() => {
    const styleEl = document.createElement("style");
    styleEl.id = "print-style";
    styleEl.textContent = printStyle;
    document.head.appendChild(styleEl);
    return () => { const el = document.getElementById("print-style"); if (el) el.remove(); };
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#fff", zIndex: 9999, overflowY: "auto" }}>
      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderBottom: "1px solid #dde3ea", background: "#f8f9fa" }}>
        <span style={{ fontSize: 14, fontWeight: 500 }}>인쇄 미리보기 — {f.name}</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => {
            const noprint = document.querySelectorAll(".no-print");
            noprint.forEach(el => el.style.display = "none");
            window.print();
            setTimeout(() => { noprint.forEach(el => el.style.display = ""); }, 1000);
          }} style={{ padding: "8px 20px", background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 6, fontSize: 14, cursor: "pointer", fontWeight: 500 }}>인쇄 / PDF 저장</button>
          <button onClick={onClose} style={{ padding: "8px 16px", border: "1px solid #ccc", borderRadius: 6, fontSize: 14, cursor: "pointer", background: "#fff" }}>닫기</button>
        </div>
      </div>
      <div className="print-area" style={{ maxWidth: 800, margin: "0 auto", padding: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 2px" }}>미사강변중학교 다면평가 결과</h2>
        <p style={{ fontSize: 12, color: "#666", marginBottom: 16 }}>2027년 2월 28일 기준 정량평가 / 출력일: {new Date().toLocaleDateString("ko-KR")}</p>
        <div style={{ background: "#f0f4f8", border: "1.5px solid #dde3ea", borderRadius: 10, padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>성명</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#1a1a2e" }}>{f.name}</div>
            </div>
            <div style={{ width: 56, height: 56, borderRadius: "50%", border: "2px solid #9ba3af", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#ccc", flexShrink: 0 }}>인</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>총점</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#1a1a2e" }}>{sc.total.toFixed(2)}점</div>
          </div>
        </div>
        <div className="p-grid">
          <div className="p-section">
            <div className="p-head">가. 학습 지도 <span>{sc.scoreA.toFixed(2)} / 30점</span></div>
            <table><tbody dangerouslySetInnerHTML={{ __html:
              row("교과/비교과", f.gyokwa === "gyokwa" ? "교과" : "비교과") +
              row("담임 여부", damimLabel) +
              row("근무 개월", f.suupMonths + "개월") +
              row("주당 수업시수", suupLabel) +
              row(f.gyokwa === "gyokwa" ? "너른강 공개수업" : "공개연수", f.jaean + "회") +
              (f.gyokwa === "gyokwa" ? row("동료/학부모 수업공개", f.dongryo + "회") : "") +
              row("▸ 수업시수 점수", sc.suup.toFixed(2) + "점") +
              row("▸ 공개수업 점수", sc.openScore.toFixed(2) + "점") +
              row("▸ 곤란도 점수", sc.gonran.toFixed(2) + "점")
            }} /></table>
          </div>
          <div className="p-section">
            <div className="p-head">나. 생활 지도 <span>{sc.scoreB.toFixed(2)} / 30점</span></div>
            <table><tbody dangerouslySetInnerHTML={{ __html:
              row("담임 여부", damimLabel) +
              row("학년부장", f.haknyeon === "yes" ? "해당" : "해당없음") +
              row("학폭책임교사", f.hakpok === "yes" ? "해당" : "해당없음") +
              row("나이스 상담 횟수", (f.aDamim === "damim" && f.gyokwa !== "bigyokwa") || f.bigyokwaType === "bogun_youngyyang" ? "자동 10점" : f.sangdam + "회") +
              row("생활지도 기간", f.suupMonths + "개월") +
              row("▸ 상담 실적 점수", sc.sangdamScore.toFixed(2) + "점") +
              row("▸ 기간 점수", sc.giganScore.toFixed(2) + "점")
            }} /></table>
          </div>
          <div className="p-section">
            <div className="p-head">다. 전문성 개발 <span>{sc.scoreC.toFixed(2)} / 10점</span></div>
            <table><tbody dangerouslySetInnerHTML={{ __html:
              row("직무연수", f.yeonsu >= 5 ? "60시간 이상" : f.yeonsu >= 4.5 ? "45~59시간" : f.yeonsu >= 4 ? "30~44시간" : "30시간 미만") +
              row("연구회 활동 횟수", f.yeonguCnt + "회") +
              row("전문적 학습 공동체", gyonaeLabel) +
              row("▸ 직무연수 점수", sc.yeonsuScore.toFixed(2) + "점") +
              row("▸ 연구회 점수", sc.yeonguScore.toFixed(2) + "점")
            }} /></table>
          </div>
          <div className="p-section">
            <div className="p-head">라. 담당 업무 <span>{sc.scoreD.toFixed(2)} / 30점</span></div>
            <table><tbody dangerouslySetInnerHTML={{ __html:
              row("교사 구분", bujangLabels[f.bujangType] || f.bujangType) +
              row("기피업무", f.gipi === "yes" ? "해당" : "해당없음") +
              row("교생지도", gyosaengLabel) +
              row("시도전국대회", f.daehoe + "회") +
              row("학교특색사업", f.teuksaek + "개") +
              row("교육활동 홍보", f.hongbo + "건") +
              row("위원회 활동", wiwonLabel) +
              row("자율동아리 지도", dongariLabel) +
              row("▸ 보직 점수", sc.bujangScore.toFixed(2) + "점") +
              row("▸ 곤란도 점수", sc.gonnandoScore.toFixed(2) + "점") +
              row("▸ 홍보,기여 점수", sc.hongboTotal.toFixed(2) + "점") +
              row("▸ 위원회 점수", sc.wiwonScore.toFixed(2) + "점")
            }} /></table>
          </div>
        </div>
        <p className="note">본 출력물은 자동 계산 결과이며, 최종 점수는 관리자 검토 후 확정됩니다.</p>
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("form");
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [editIdx, setEditIdx] = useState(null);
  const [printData, setPrintData] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await window.storage.get("submissions", true);
      if (res) setSubmissions(JSON.parse(res.value));
    } catch (_) {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (data) => {
    await window.storage.set("submissions", JSON.stringify(data), true);
    setSubmissions(data);
  };

  const handleSubmit = async (f, sc) => {
    const entry = {
      id: Date.now(),
      date: new Date().toLocaleDateString("ko-KR"),
      name: f.name,
      form: f,
      총점: sc.total.toFixed(2),
      학습지도: sc.scoreA.toFixed(2),
      생활지도: sc.scoreB.toFixed(2),
      전문성개발: sc.scoreC.toFixed(2),
      담당업무: sc.scoreD.toFixed(2),
    };
    const next = [...submissions, entry];
    await save(next);
    showToast("제출이 완료되었습니다!");
  };

  const handleEdit = async (idx, f, sc) => {
    const entry = {
      ...submissions[idx],
      form: f,
      name: f.name,
      date: new Date().toLocaleDateString("ko-KR") + " (수정)",
      총점: sc.total.toFixed(2),
      학습지도: sc.scoreA.toFixed(2),
      생활지도: sc.scoreB.toFixed(2),
      전문성개발: sc.scoreC.toFixed(2),
      담당업무: sc.scoreD.toFixed(2),
    };
    const next = submissions.map((s, i) => i === idx ? entry : s);
    await save(next);
    setEditIdx(null);
    showToast("수정이 완료되었습니다.");
  };

  const handleDelete = async (idx) => {
    if (!window.confirm(`"${submissions[idx].name}" 선생님 데이터를 삭제할까요?`)) return;
    const next = submissions.filter((_, i) => i !== idx);
    await save(next);
    showToast("삭제되었습니다.");
  };

  const exportCSV = () => {
    if (!submissions.length) { alert("데이터가 없습니다"); return; }
    const cols = ["성함", "제출일", "총점", "학습지도", "생활지도", "전문성개발", "담당업무"];
    let csv = "﻿" + cols.join(",") + "\n";
    submissions.forEach(d => {
      csv += [d.name, d.date, d.총점, d.학습지도, d.생활지도, d.전문성개발, d.담당업무].map(v => `"${v}"`).join(",") + "\n";
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "다면평가_수합결과.csv"; a.click();
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "1.5rem 2rem", fontFamily: "var(--font-sans)" }}>
      <style>{GLOBAL_STYLE}</style>
      {printData && <PrintOverlay f={printData.f} sc={printData.sc} onClose={() => setPrintData(null)} />}
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 6px" }}>미사강변중학교 다면평가</h1>
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>2027년 2월 28일 기준 정량평가 입력 시스템</p>
      </div>

      {toast && (
        <div style={{ background: "var(--color-background-success)", color: "var(--color-text-success)", borderRadius: "var(--border-radius-md)", padding: "10px 16px", fontSize: 14, marginBottom: "1rem" }}>
          {toast}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginBottom: "1.5rem", justifyContent: "center" }}>
        <button onClick={() => { setTab("form"); setEditIdx(null); }} style={{ padding: "10px 32px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 15, fontWeight: 500, background: tab === "form" ? "#1a1a2e" : "var(--color-background-secondary)", color: tab === "form" ? "#fff" : "var(--color-text-primary)", transition: "all .15s" }}>
          입력 폼
        </button>
        <button onClick={() => setTab("admin")} style={{ padding: "10px 32px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 15, fontWeight: 500, background: tab === "admin" ? "#1a1a2e" : "var(--color-background-secondary)", color: tab === "admin" ? "#fff" : "var(--color-text-primary)", transition: "all .15s", display: "flex", alignItems: "center", gap: 8 }}>
          관리자 수합
          {submissions.length > 0 && <span style={{ fontSize: 12, background: tab === "admin" ? "rgba(255,255,255,0.25)" : "#dde3ea", borderRadius: 10, padding: "1px 8px" }}>{submissions.length}</span>}
        </button>
      </div>

      {tab === "form" && (
        <FormView onSubmit={handleSubmit} onPrint={(f, sc) => setPrintData({ f, sc })} />
      )}

      {tab === "admin" && (
        <div>
          {!adminUnlocked ? (
            <div style={{ ...s.card, maxWidth: 360, margin: "2rem auto" }}>
              <div style={{ ...s.cardBody }}>
                <div style={{ marginBottom: 16, fontSize: 14, color: "var(--color-text-secondary)" }}>
                  관리자 비밀번호를 입력하세요
                </div>
                <input className="dmf-input" style={{ marginBottom: 12 }} type="password" value={pwInput} onChange={e => setPwInput(e.target.value)} placeholder="비밀번호" onKeyDown={e => { if (e.key === "Enter") { if (pwInput === ADMIN_PW) { setAdminUnlocked(true); setPwInput(""); } else alert("비밀번호가 맞지 않습니다"); } }} />
                <button style={{ ...s.btnPrimary, marginTop: 0 }} onClick={() => { if (pwInput === ADMIN_PW) { setAdminUnlocked(true); setPwInput(""); } else alert("비밀번호가 맞지 않습니다"); }}>확인</button>
              </div>
            </div>
          ) : editIdx !== null ? (
            <div>
              <p style={{ fontSize: 14, color: "var(--color-text-secondary)", marginBottom: "1rem" }}>
                {submissions[editIdx]?.name} 선생님 데이터 수정 중
              </p>
              <FormView
                initial={submissions[editIdx]?.form}
                isEdit
                onSubmit={(f, sc) => handleEdit(editIdx, f, sc)}
                onCancel={() => setEditIdx(null)}
              />
            </div>
          ) : (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <span style={{ fontSize: 14, color: "var(--color-text-secondary)" }}>총 {submissions.length}명 제출</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={s.btn} onClick={exportCSV}>CSV 다운로드</button>
                  <button style={{ ...s.btn, color: "var(--color-text-danger)" }} onClick={async () => { if (window.confirm("모든 데이터를 초기화할까요?")) { await save([]); showToast("초기화 완료"); } }}>
                    초기화
                  </button>
                </div>
              </div>

              {loading ? (
                <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-tertiary)", fontSize: 14 }}>불러오는 중...</div>
              ) : submissions.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-tertiary)", fontSize: 14 }}>
                  아직 제출된 데이터가 없습니다
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, tableLayout: "fixed" }}>
                    <colgroup>
                      <col style={{ width: "15%" }} />
                      <col style={{ width: "13%" }} />
                      <col style={{ width: "10%" }} />
                      <col style={{ width: "10%" }} />
                      <col style={{ width: "10%" }} />
                      <col style={{ width: "10%" }} />
                      <col style={{ width: "10%" }} />
                      <col style={{ width: "12%" }} />
                    </colgroup>
                    <thead>
                      <tr>
                        {["성함","제출일","총점","학습지도","생활지도","전문성","업무",""].map((h, i) => (
                          <th key={i} style={{ textAlign: "left", padding: "8px 10px", borderBottom: "0.5px solid var(--color-border-tertiary)", color: "var(--color-text-secondary)", fontWeight: 500 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map((d, i) => (
                        <tr key={d.id} style={{ borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
                          <td style={{ padding: "8px 10px", fontWeight: 500 }}>{d.name}</td>
                          <td style={{ padding: "8px 10px", color: "var(--color-text-secondary)", fontSize: 12 }}>{d.date}</td>
                          <td style={{ padding: "8px 10px", fontWeight: 500, color: "var(--color-text-info)" }}>{d.총점}</td>
                          <td style={{ padding: "8px 10px" }}>{d.학습지도}</td>
                          <td style={{ padding: "8px 10px" }}>{d.생활지도}</td>
                          <td style={{ padding: "8px 10px" }}>{d.전문성개발}</td>
                          <td style={{ padding: "8px 10px" }}>{d.담당업무}</td>
                          <td style={{ padding: "8px 4px" }}>
                            <div style={{ display: "flex", gap: 4 }}>
                              <button style={{ ...s.btn, padding: "4px 8px", fontSize: 12 }} onClick={() => setEditIdx(i)}>수정</button>
                              <button style={{ ...s.btn, padding: "4px 8px", fontSize: 12, color: "var(--color-text-danger)" }} onClick={() => handleDelete(i)}>삭제</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
