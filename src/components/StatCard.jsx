function formatINR(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount || 0);
}

function StatCard({ title, value, icon, color, bgColor }) {
  return (
    <div
      style={{
        background: "#fff",
        padding: "20px",
        borderRadius: "10px",
        boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <p style={{ fontSize: "14px", color: "#666" }}>{title}</p>

          <p style={{ fontSize: "24px", fontWeight: "bold", color }}>
            {formatINR(value)}
          </p>
        </div>

        <div
          style={{
            padding: "10px",
            borderRadius: "50%",
            background: bgColor,
            color: color,
          }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

export default StatCard;