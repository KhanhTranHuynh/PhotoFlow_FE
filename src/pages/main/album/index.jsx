import { useState } from "react";
import { Mail, ArrowUpRight, MapPin } from "lucide-react";

export default function SimplePage() {
  const [hovered, setHovered] = useState(null);

  const work = [
    {
      year: "2026",
      title: "Studio Phù Sa",
      desc: "Bộ nhận diện thương hiệu cho quán cà phê ven sông.",
    },
    {
      year: "2025",
      title: "Chợ Nổi App",
      desc: "Ứng dụng đặt hàng nông sản trực tiếp từ nhà vườn.",
    },
    {
      year: "2024",
      title: "Giấy Dó",
      desc: "Trang landing cho xưởng giấy thủ công truyền thống.",
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F6F3EE",
        color: "#2B2621",
        fontFamily: "'Georgia', 'Times New Roman', serif",
      }}>
      <div
        style={{ maxWidth: 720, margin: "0 auto", padding: "72px 24px 120px" }}>
        {/* Header */}
        <header style={{ marginBottom: 88 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 13,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#8A7F6E",
              marginBottom: 28,
              fontFamily: "'Helvetica Neue', Arial, sans-serif",
            }}>
            <MapPin size={13} strokeWidth={1.75} />
            An Giang, Việt Nam
          </div>
          <h1
            style={{
              fontSize: "clamp(40px, 7vw, 58px)",
              lineHeight: 1.08,
              margin: 0,
              fontWeight: 400,
              letterSpacing: "-0.01em",
            }}>
            Nguyễn Thảo Vy
          </h1>
          <p
            style={{
              marginTop: 18,
              fontSize: 19,
              lineHeight: 1.6,
              color: "#5C5346",
              maxWidth: 480,
            }}>
            Nhà thiết kế đồ họa, làm việc với các thương hiệu nhỏ ở miền Tây —
            nơi câu chuyện và chất liệu địa phương luôn đi trước xu hướng.
          </p>
        </header>

        {/* Divider with label */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 40,
          }}>
          <span
            style={{
              fontSize: 12,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#8A7F6E",
              fontFamily: "'Helvetica Neue', Arial, sans-serif",
              whiteSpace: "nowrap",
            }}>
            Dự án gần đây
          </span>
          <div style={{ height: 1, background: "#D8D0C2", flex: 1 }} />
        </div>

        {/* Work list */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {work.map((item, i) => (
            <div
              key={item.title}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                padding: "22px 0",
                borderBottom:
                  i < work.length - 1 ? "1px solid #E4DDD0" : "none",
                cursor: "pointer",
                transition: "padding-left 0.25s ease",
                paddingLeft: hovered === i ? 8 : 0,
              }}>
              <div>
                <div
                  style={{
                    fontSize: 22,
                    color: hovered === i ? "#B5502F" : "#2B2621",
                    transition: "color 0.2s ease",
                  }}>
                  {item.title}
                </div>
                <div
                  style={{
                    fontSize: 15,
                    color: "#8A7F6E",
                    marginTop: 4,
                    fontFamily: "'Helvetica Neue', Arial, sans-serif",
                  }}>
                  {item.desc}
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 14,
                  color: "#8A7F6E",
                  fontFamily: "'Helvetica Neue', Arial, sans-serif",
                  flexShrink: 0,
                  marginLeft: 20,
                }}>
                {item.year}
                <ArrowUpRight
                  size={15}
                  strokeWidth={1.75}
                  style={{
                    opacity: hovered === i ? 1 : 0,
                    transform:
                      hovered === i ? "translate(0,0)" : "translate(-3px,3px)",
                    transition: "all 0.2s ease",
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Footer / contact */}
        <div
          style={{
            marginTop: 72,
            paddingTop: 32,
            borderTop: "1px solid #E4DDD0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
          }}>
          <a
            href="mailto:vy.thao@example.com"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "#2B2621",
              textDecoration: "none",
              fontSize: 15,
              fontFamily: "'Helvetica Neue', Arial, sans-serif",
              borderBottom: "1px solid #2B2621",
              paddingBottom: 2,
            }}>
            <Mail size={15} strokeWidth={1.75} />
            vy.thao@example.com
          </a>
          <span
            style={{
              fontSize: 13,
              color: "#8A7F6E",
              fontFamily: "'Helvetica Neue', Arial, sans-serif",
            }}>
            © 2026
          </span>
        </div>
      </div>
    </div>
  );
}
