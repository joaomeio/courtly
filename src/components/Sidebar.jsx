import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const NAV_ITEMS = [
  {
    section: "Main",
    items: [
      {
        id: "dashboard",
        path: "/",
        label: "Dashboard",
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="2" width="5" height="5" rx="1.5" fill="currentColor" />
            <rect x="9" y="2" width="5" height="5" rx="1.5" fill="currentColor" opacity="0.4" />
            <rect x="2" y="9" width="5" height="5" rx="1.5" fill="currentColor" opacity="0.4" />
            <rect x="9" y="9" width="5" height="5" rx="1.5" fill="currentColor" opacity="0.4" />
          </svg>
        ),
      },
      {
        id: "schedule",
        path: "/schedule",
        label: "Schedule",
        badge: 3,
        badgeVariant: "warning",
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
            <path d="M5 2v2M11 2v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            <path d="M2 7h12" stroke="currentColor" strokeWidth="1.3" />
          </svg>
        ),
      },
      {
        id: "students",
        path: "/students",
        label: "Students",
        badge: 12,
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.3" />
            <path d="M2.5 13.5c0-2.485 2.462-4.5 5.5-4.5s5.5 2.015 5.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        ),
      },
      {
        id: "payments",
        path: "/payments",
        label: "Payments",
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1.5" y="4" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
            <path d="M1.5 7.5h13" stroke="currentColor" strokeWidth="1.3" />
            <rect x="3.5" y="9.5" width="3" height="1.5" rx="0.5" fill="currentColor" opacity="0.5" />
          </svg>
        ),
      },
    ],
  },
  {
    section: "Facility",
    items: [
      {
        id: "courts",
        path: "/courts",
        label: "Courts",
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="2" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
            <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.3" />
          </svg>
        ),
      },
      {
        id: "analytics",
        path: "/analytics",
        label: "Analytics",
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 12l3-4 2.5 2 3-4L14 12H2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          </svg>
        ),
      },
    ],
  },
  {
    section: "Training",
    items: [
      {
        id: "drills",
        path: "/drills",
        label: "Drills",
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="2" fill="currentColor" opacity="0.6" />
            <path d="M8 2v2M8 12v2M2 8h2M12 8h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            <path d="M4.1 4.1l1.4 1.4M10.5 10.5l1.4 1.4M10.5 5.5l1.4-1.4M4.1 11.9l1.4-1.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.5" />
          </svg>
        ),
      },
      {
        id: "programs",
        path: "/programs",
        label: "Programs",
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="2" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
            <path d="M5 6h6M5 8.5h4M5 11h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.7" />
          </svg>
        ),
      },
    ],
  },
];

const COLORS = {
  green: "#66b319",
  greenLight: "#edf7e0",
  greenMid: "#4e8a13",
  bgLight: "#f8fafc",
  bgDark: "#0f172a",
  textPrimary: "#0f172a",
  textSecondary: "#64748b",
  textMuted: "#94a3b8",
  border: "#e2e8f0",
  amber: "#f59e0b",
  amberLight: "#fef3c7",
};

function NavIcon({ children, active }) {
  return (
    <span
      style={{
        width: 18,
        height: 18,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        color: active ? COLORS.green : COLORS.textMuted,
        transition: "color 0.15s",
      }}
    >
      {children}
    </span>
  );
}

function Badge({ count, variant }) {
  const isWarning = variant === "warning";
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        background: isWarning ? COLORS.amberLight : COLORS.greenLight,
        color: isWarning ? "#92400e" : COLORS.greenMid,
        borderRadius: 20,
        padding: "1px 7px",
        minWidth: 18,
        textAlign: "center",
        lineHeight: "18px",
      }}
    >
      {count}
    </span>
  );
}

export default function Sidebar({ session, onAddClick }) {
  const [hovered, setHovered] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  const coachName = session?.user?.user_metadata?.full_name || 'Joao Meio';
  
  // Extract initials properly
  const nameParts = coachName.trim().split(' ');
  const initials = nameParts.length > 1 
    ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
    : coachName.substring(0, 2).toUpperCase();

  return (
    <div
      style={{
        width: 224,
        minHeight: "100vh",
        background: "#ffffff",
        borderRight: `1px solid ${COLORS.border}`,
        display: "flex",
        flexDirection: "column",
        padding: "16px 12px",
        fontFamily: "'Inter', system-ui, sans-serif",
        boxSizing: "border-box",
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <Link
        to="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          padding: "4px 8px 16px",
          borderBottom: `1px solid ${COLORS.border}`,
          marginBottom: 8,
          textDecoration: "none"
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: COLORS.green,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="5" r="2.5" stroke="white" strokeWidth="1.5" />
            <path d="M2 13c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <span
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: COLORS.textPrimary,
            letterSpacing: "-0.3px",
          }}
        >
          Courtly
        </span>
      </Link>

      {/* Nav sections */}
      <nav style={{ flex: 1 }}>
        {NAV_ITEMS.map(({ section, items }) => (
          <div key={section} style={{ marginBottom: 4 }}>
            <p
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: COLORS.textMuted,
                padding: "10px 10px 4px",
                margin: 0,
              }}
            >
              {section}
            </p>
            {items.map((item) => {
              // Mark active based on actual location
              const isActive = item.path === '/' 
                ? location.pathname === '/' 
                : location.pathname.startsWith(item.path);
              
              const isHovered = hovered === item.id && !isActive;
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  onMouseEnter={() => setHovered(item.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 10px",
                    borderRadius: 8,
                    cursor: "pointer",
                    marginBottom: 1,
                    width: "100%",
                    border: "none",
                    background: isActive
                      ? COLORS.greenLight
                      : isHovered
                      ? COLORS.bgLight
                      : "transparent",
                    transition: "background 0.1s",
                    textAlign: "left",
                    textDecoration: "none",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                >
                  <NavIcon active={isActive}>{item.icon}</NavIcon>
                  <span
                    style={{
                      fontSize: 13.5,
                      fontWeight: isActive ? 500 : 400,
                      color: isActive ? COLORS.greenMid : COLORS.textSecondary,
                      flex: 1,
                      transition: "color 0.15s",
                    }}
                  >
                    {item.label}
                  </span>
                  {item.badge && (
                    <Badge count={item.badge} variant={item.badgeVariant} />
                  )}
                </Link>
              );
            })}
            <div
              style={{
                height: 1,
                background: COLORS.border,
                margin: "8px 0",
                opacity: 0.6,
              }}
            />
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 12 }}>
        <button
          onClick={onAddClick}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            width: "100%",
            padding: "9px",
            borderRadius: 8,
            background: COLORS.green,
            color: "white",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            border: "none",
            marginBottom: 10,
            fontFamily: "inherit",
            letterSpacing: "-0.1px",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = COLORS.greenMid)}
          onMouseLeave={(e) => (e.currentTarget.style.background = COLORS.green)}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2v10M2 7h10" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          New Session
        </button>

        <div
          onClick={() => navigate('/settings')}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px",
            borderRadius: 8,
            cursor: "pointer",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = COLORS.bgLight)}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: COLORS.greenLight,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700,
              color: COLORS.greenMid,
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: COLORS.textPrimary,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {coachName}
            </div>
            <div style={{ fontSize: 11, color: COLORS.textMuted }}>
              Elite Instructor
            </div>
          </div>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: COLORS.textMuted, flexShrink: 0 }}>
            <circle cx="7" cy="7" r="1.5" fill="currentColor" />
            <circle cx="7" cy="2.5" r="1.5" fill="currentColor" />
            <circle cx="7" cy="11.5" r="1.5" fill="currentColor" />
          </svg>
        </div>
      </div>
    </div>
  );
}
