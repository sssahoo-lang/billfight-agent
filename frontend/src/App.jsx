import React from "react";
import { useState, useEffect, useCallback } from "react";

const API = "http://localhost:8000/api";

const STATUS_CONFIG = {
  starting: { label: "Starting", color: "#888780", bg: "#F1EFE8" },
  researching: { label: "Researching market", color: "#185FA5", bg: "#E6F1FB" },
  strategizing: { label: "Building strategy", color: "#854F0B", bg: "#FAEEDA" },
  drafting: { label: "Drafting email", color: "#3B6D11", bg: "#EAF3DE" },
  awaiting_reply: { label: "Awaiting reply", color: "#993556", bg: "#FBEAF0" },
  won: { label: "Deal won", color: "#0F6E56", bg: "#E1F5EE" },
  closed_no_deal: { label: "Closed", color: "#A32D2D", bg: "#FCEBEB" },
};

const STEP_ICONS = {
  research: "🔍",
  strategy: "🧭",
  email_draft: "✉️",
  reply_received: "📨",
  closed: "🏁",
};

const STEP_LABELS = {
  research: "Market Research",
  strategy: "Strategy Built",
  email_draft: "Email Drafted",
  reply_received: "Reply Analyzed",
  closed: "Negotiation Closed",
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.starting;
  return (
    <span style={{
      fontSize: 12, fontWeight: 500, padding: "3px 10px",
      borderRadius: 20, background: cfg.bg, color: cfg.color,
      border: `0.5px solid ${cfg.color}40`
    }}>
      {cfg.label}
    </span>
  );
}

function MetricCard({ label, value, sub, accent }) {
  return (
    <div style={{
      background: "var(--color-background-secondary)",
      borderRadius: "var(--border-radius-md)",
      padding: "1rem", flex: 1
    }}>
      <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "0 0 4px" }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 500, margin: 0, color: accent || "var(--color-text-primary)" }}>{value}</p>
      {sub && <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: "4px 0 0" }}>{sub}</p>}
    </div>
  );
}

function StepCard({ step }) {
  const [expanded, setExpanded] = useState(false);
  const content = typeof step.content === "object" ? step.content : {};
  const icon = STEP_ICONS[step.step_type] || "⚙️";
  const label = STEP_LABELS[step.step_type] || step.step_type;

  return (
    <div style={{
      background: "var(--color-background-primary)",
      border: "0.5px solid var(--color-border-tertiary)",
      borderRadius: "var(--border-radius-lg)",
      padding: "1rem 1.25rem",
      marginBottom: 10
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <p style={{ fontWeight: 500, fontSize: 14, margin: 0 }}>{label}</p>
            <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
              {new Date(step.created_at).toLocaleTimeString()}
            </span>
          </div>
          {step.reasoning && (
            <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "0 0 6px" }}>
              {step.reasoning}
            </p>
          )}
          {step.decision && (
            <p style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-success)", margin: 0 }}>
              → {step.decision}
            </p>
          )}

          {step.step_type === "email_draft" && content.body && (
            <div style={{ marginTop: 10 }}>
              <button onClick={() => setExpanded(!expanded)} style={{
                fontSize: 12, padding: "4px 12px", cursor: "pointer",
                background: "var(--color-background-secondary)",
                border: "0.5px solid var(--color-border-secondary)",
                borderRadius: "var(--border-radius-md)", color: "var(--color-text-primary)"
              }}>
                {expanded ? "Hide email" : "View drafted email"}
              </button>
              {expanded && (
                <div style={{
                  marginTop: 10, padding: "12px 16px",
                  background: "var(--color-background-secondary)",
                  borderRadius: "var(--border-radius-md)",
                  border: "0.5px solid var(--color-border-tertiary)"
                }}>
                  <p style={{ fontSize: 12, fontWeight: 500, margin: "0 0 4px", color: "var(--color-text-secondary)" }}>
                    Subject: {content.subject}
                  </p>
                  <p style={{ fontSize: 13, whiteSpace: "pre-wrap", margin: 0, lineHeight: 1.6 }}>{content.body}</p>
                </div>
              )}
            </div>
          )}

          {step.step_type === "research" && content.competitor_prices && (
            <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {content.competitor_prices.slice(0, 3).map((c, i) => (
                <span key={i} style={{
                  fontSize: 12, padding: "3px 10px",
                  background: "var(--color-background-info)",
                  color: "var(--color-text-info)",
                  borderRadius: 20
                }}>
                  {c.provider}: ${c.price}/mo
                </span>
              ))}
            </div>
          )}

          {step.step_type === "reply_received" && content.interpretation && (
            <div style={{ marginTop: 8 }}>
              <span style={{
                fontSize: 12, padding: "3px 10px", borderRadius: 20,
                background: "var(--color-background-warning)",
                color: "var(--color-text-warning)"
              }}>
                {content.interpretation.classification}
              </span>
              {content.interpretation.offered_amount > 0 && (
                <span style={{ fontSize: 13, marginLeft: 8, color: "var(--color-text-secondary)" }}>
                  Offered: ${content.interpretation.offered_amount}/mo
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NegotiationDetail({ negotiation, onBack, onRefresh }) {
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("");

  const handleSimulateReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    setMsg("");
    try {
      const r = await fetch(`${API}/agent/simulate-reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ negotiation_id: negotiation.id, reply_text: replyText })
      });
      const data = await r.json();
      setMsg(`Agent decided: ${data.decision}`);
      setReplyText("");
      setTimeout(onRefresh, 1000);
    } catch (e) {
      setMsg("Error sending reply");
    }
    setSending(false);
  };

  const steps = negotiation.steps || [];
  const lastEmail = steps.filter(s => s.step_type === "email_draft").slice(-1)[0];
  const savings = negotiation.savings_achieved || 0;

  return (
    <div>
      <button onClick={onBack} style={{
        background: "none", border: "none", cursor: "pointer",
        fontSize: 14, color: "var(--color-text-secondary)", marginBottom: 16, padding: 0,
        display: "flex", alignItems: "center", gap: 6
      }}>
        ← Back to dashboard
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: 20 }}>
            {negotiation.provider}
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)" }}>
            {negotiation.bill_type} • ${negotiation.current_amount}/mo
          </p>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <StatusBadge status={negotiation.status} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <MetricCard label="Original bill" value={`$${negotiation.current_amount}/mo`} />
        <MetricCard label="Target price" value={negotiation.target_price ? `$${negotiation.target_price}/mo` : "—"} />
        <MetricCard
          label="Savings achieved"
          value={savings > 0 ? `$${savings.toFixed(0)}/mo` : "—"}
          accent={savings > 0 ? "var(--color-text-success)" : undefined}
          sub={savings > 0 ? `$${(savings * 12).toFixed(0)}/year` : undefined}
        />
        <MetricCard label="Rounds" value={steps.filter(s => s.step_type === "email_draft").length} />
      </div>

      <h3 style={{ fontSize: 15, fontWeight: 500, marginBottom: 12 }}>Agent activity log</h3>
      {steps.length === 0 ? (
        <p style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>Agent is running...</p>
      ) : (
        steps.map(step => <StepCard key={step.id} step={step} />)
      )}

      {negotiation.status === "awaiting_reply" && (
        <div style={{
          marginTop: 24,
          background: "var(--color-background-primary)",
          border: "0.5px solid var(--color-border-secondary)",
          borderRadius: "var(--border-radius-lg)",
          padding: "1.25rem"
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 500, margin: "0 0 8px" }}>
            Simulate company reply
          </h3>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "0 0 12px" }}>
            Paste the company's response to let the agent decide the next move.
          </p>
          <textarea
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            placeholder={`e.g. "Thank you for reaching out. The best we can do is $65/month..."`}
            style={{
              width: "100%", minHeight: 100, fontSize: 13,
              padding: "10px 12px", boxSizing: "border-box",
              borderRadius: "var(--border-radius-md)",
              border: "0.5px solid var(--color-border-secondary)",
              background: "var(--color-background-secondary)",
              color: "var(--color-text-primary)", resize: "vertical",
              fontFamily: "var(--font-sans)"
            }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
            <button onClick={handleSimulateReply} disabled={sending || !replyText.trim()} style={{
              padding: "8px 20px", cursor: "pointer", fontSize: 14,
              borderRadius: "var(--border-radius-md)",
              background: sending ? "var(--color-background-secondary)" : "var(--color-text-primary)",
              color: sending ? "var(--color-text-secondary)" : "var(--color-background-primary)",
              border: "none", fontWeight: 500
            }}>
              {sending ? "Agent thinking..." : "Let agent respond ↗"}
            </button>
            {msg && <p style={{ fontSize: 13, color: "var(--color-text-success)", margin: 0 }}>{msg}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function UploadView({ onDone }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");
  const [extracted, setExtracted] = useState(null);
  const [billId, setBillId] = useState(null);
  const [starting, setStarting] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    setStatus("Parsing bill with Claude...");
    setExtracted(null);
    const form = new FormData();
    form.append("file", file);
    try {
      const r = await fetch(`${API}/bills/upload`, { method: "POST", body: form });
      const data = await r.json();
      if (data.bill_id) {
        setBillId(data.bill_id);
        setExtracted(data.extracted);
        setStatus("Bill parsed successfully");
      } else {
        setStatus("Error: " + (data.detail || "Could not parse bill"));
      }
    } catch (e) {
      setStatus("Upload failed. Is the backend running?");
    }
    setUploading(false);
  };

  const startNegotiation = async () => {
    setStarting(true);
    try {
      const r = await fetch(`${API}/agent/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bill_id: billId })
      });
      const data = await r.json();
      if (data.negotiation_id) onDone(data.negotiation_id);
    } catch (e) {
      setStatus("Failed to start agent");
    }
    setStarting(false);
  };

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <h2 style={{ textAlign: "center", marginBottom: 8, fontSize: 22 }}>Upload your bill</h2>
      <p style={{ textAlign: "center", color: "var(--color-text-secondary)", fontSize: 14, marginBottom: 28 }}>
        Internet, phone, insurance, subscriptions — the agent negotiates for you.
      </p>

      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
        onClick={() => document.getElementById("file-input").click()}
        style={{
          border: `1.5px dashed ${dragging ? "var(--color-border-info)" : "var(--color-border-secondary)"}`,
          borderRadius: "var(--border-radius-lg)", padding: "2.5rem",
          textAlign: "center", cursor: "pointer",
          background: dragging ? "var(--color-background-info)" : "var(--color-background-secondary)",
          transition: "all 0.15s"
        }}
      >
        <p style={{ fontSize: 32, margin: "0 0 8px" }}>📄</p>
        <p style={{ fontWeight: 500, margin: "0 0 4px" }}>Drop your bill here</p>
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>PDF or TXT • Claude will extract all details</p>
        <input id="file-input" type="file" accept=".pdf,.txt" style={{ display: "none" }}
          onChange={e => handleFile(e.target.files[0])} />
      </div>

      {status && (
        <p style={{ textAlign: "center", marginTop: 16, fontSize: 14,
          color: status.includes("Error") || status.includes("failed") ? "var(--color-text-danger)" : "var(--color-text-secondary)" }}>
          {uploading ? "⏳ " : ""}{status}
        </p>
      )}

      {extracted && (
        <div style={{
          marginTop: 20, background: "var(--color-background-primary)",
          border: "0.5px solid var(--color-border-tertiary)",
          borderRadius: "var(--border-radius-lg)", padding: "1.25rem"
        }}>
          <p style={{ fontWeight: 500, fontSize: 14, margin: "0 0 12px" }}>Claude extracted:</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              ["Provider", extracted.provider],
              ["Type", extracted.bill_type],
              ["Monthly amount", `$${extracted.current_amount}`],
              ["Account tenure", extracted.account_tenure],
              ["Contract end", extracted.contract_end || "None"],
              ["Payment history", extracted.payment_history || "Unknown"],
            ].map(([k, v]) => v && (
              <div key={k} style={{ fontSize: 13 }}>
                <span style={{ color: "var(--color-text-secondary)" }}>{k}: </span>
                <span style={{ fontWeight: 500 }}>{v}</span>
              </div>
            ))}
          </div>
          <button onClick={startNegotiation} disabled={starting} style={{
            marginTop: 16, width: "100%", padding: "10px",
            background: "var(--color-text-primary)", color: "var(--color-background-primary)",
            border: "none", borderRadius: "var(--border-radius-md)",
            fontSize: 15, fontWeight: 500, cursor: "pointer"
          }}>
            {starting ? "Launching agent..." : "Launch negotiation agent ↗"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("dashboard");
  const [negotiations, setNegotiations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchNegotiations = useCallback(async () => {
    try {
      const r = await fetch(`${API}/negotiations/`);
      const data = await r.json();
      setNegotiations(data);
    } catch (e) {
      console.log("Backend not connected");
    }
    setLoading(false);
  }, []);

  const fetchNegotiation = useCallback(async (id) => {
    try {
      const r = await fetch(`${API}/negotiations/${id}`);
      const data = await r.json();
      setSelected(data);
    } catch (e) {}
  }, []);

  useEffect(() => { fetchNegotiations(); }, [fetchNegotiations]);

  useEffect(() => {
    if (selected && ["researching", "strategizing", "drafting"].includes(selected.status)) {
      const t = setInterval(() => fetchNegotiation(selected.id), 3000);
      return () => clearInterval(t);
    }
  }, [selected, fetchNegotiation]);

  const totalSavings = negotiations.reduce((a, n) => a + (n.savings_achieved || 0), 0);
  const won = negotiations.filter(n => n.status === "won").length;
  const active = negotiations.filter(n => !["won", "closed_no_deal"].includes(n.status)).length;

  if (view === "upload") {
    return (
      <div style={{ padding: "2rem" }}>
        <button onClick={() => setView("dashboard")} style={{
          background: "none", border: "none", cursor: "pointer",
          fontSize: 14, color: "var(--color-text-secondary)", marginBottom: 24, padding: 0
        }}>← Back</button>
        <UploadView onDone={(id) => {
          setView("dashboard");
          fetchNegotiations();
          setTimeout(() => fetchNegotiation(id).then(() => setView("detail")), 500);
        }} />
      </div>
    );
  }

  if (view === "detail" && selected) {
    return (
      <div style={{ padding: "1.5rem" }}>
        <NegotiationDetail
          negotiation={selected}
          onBack={() => { setView("dashboard"); setSelected(null); fetchNegotiations(); }}
          onRefresh={() => fetchNegotiation(selected.id)}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: "1.5rem" }}>
      <h2 style={{ sr: "only", position: "absolute", opacity: 0 }}>BillFight — Autonomous negotiation dashboard</h2>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: "0 0 2px", fontSize: 20 }}>BillFight</h2>
          <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)" }}>
            Autonomous bill negotiation agent
          </p>
        </div>
        <button onClick={() => setView("upload")} style={{
          padding: "8px 18px", fontSize: 14, fontWeight: 500, cursor: "pointer",
          background: "var(--color-text-primary)", color: "var(--color-background-primary)",
          border: "none", borderRadius: "var(--border-radius-md)"
        }}>
          + Upload bill
        </button>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <MetricCard label="Total savings" value={`$${totalSavings.toFixed(0)}/mo`}
          sub={`$${(totalSavings * 12).toFixed(0)}/year`}
          accent={totalSavings > 0 ? "var(--color-text-success)" : undefined} />
        <MetricCard label="Deals won" value={won} />
        <MetricCard label="Active negotiations" value={active} />
        <MetricCard label="Total processed" value={negotiations.length} />
      </div>

      {loading ? (
        <p style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>Loading...</p>
      ) : negotiations.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "3rem",
          border: "1.5px dashed var(--color-border-tertiary)",
          borderRadius: "var(--border-radius-lg)"
        }}>
          <p style={{ fontSize: 32, margin: "0 0 8px" }}>💸</p>
          <p style={{ fontWeight: 500, margin: "0 0 4px" }}>No negotiations yet</p>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "0 0 16px" }}>
            Upload a bill to let the agent fight for a better rate.
          </p>
          <button onClick={() => setView("upload")} style={{
            padding: "8px 20px", cursor: "pointer", fontSize: 14,
            borderRadius: "var(--border-radius-md)",
            border: "0.5px solid var(--color-border-secondary)",
            background: "var(--color-background-secondary)", color: "var(--color-text-primary)"
          }}>
            Upload your first bill
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {negotiations.map(n => (
            <div key={n.id} onClick={async () => {
              await fetchNegotiation(n.id);
              setView("detail");
            }} style={{
              background: "var(--color-background-primary)",
              border: "0.5px solid var(--color-border-tertiary)",
              borderRadius: "var(--border-radius-lg)",
              padding: "1rem 1.25rem", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 16,
              transition: "border-color 0.15s"
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "var(--color-border-secondary)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "var(--color-border-tertiary)"}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <p style={{ fontWeight: 500, margin: 0, fontSize: 15 }}>{n.provider}</p>
                  <StatusBadge status={n.status} />
                </div>
                <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>
                  {n.bill_type} • ${n.current_amount}/mo original
                  {n.target_price ? ` → targeting $${n.target_price}/mo` : ""}
                </p>
              </div>
              {n.savings_achieved > 0 && (
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontWeight: 500, fontSize: 16, margin: 0, color: "var(--color-text-success)" }}>
                    −${n.savings_achieved.toFixed(0)}/mo
                  </p>
                  <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: 0 }}>saved</p>
                </div>
              )}
              <span style={{ color: "var(--color-text-secondary)", fontSize: 18 }}>→</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
