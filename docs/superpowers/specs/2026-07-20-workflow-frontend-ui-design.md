# Workflow Frontend UI Design Specification

- **Date**: 2026-07-20
- **Theme**: Premium Light Mode Dashboard (Inspired by Uploaded Mockup)
- **Frameworks**: React 19, Vite, Tailwind CSS v4, Zustand, `@xyflow/react`, Lucide React

---

## 1. Style Guide & Design Tokens

### Colors
- **App Background**: `#f0f3f8` (Soft blue-grey)
- **Card & Sidebar Background**: `#ffffff` (Pure white)
- **Primary Accent**: `#355bf5` (Royal blue)
- **Primary Hover**: `#1d4ed8`
- **Secondary Accent/Muted**: `#94a3b8` (Slate gray)
- **Border Color**: `#e2e8f0` (Light gray-blue)
- **Success Color**: `#10b981` (Emerald green)
- **Error Color**: `#ef4444` (Coral red)

### Typography
- **Primary Font**: `Outfit` or `Inter`, system-ui
- **Headers**: Semi-bold to bold, clean hierarchy

### Shadows & Borders
- **Border Radius**:
  - Cards & Panels: `1.5rem` (24px) or `1.25rem` (20px)
  - Buttons, Inputs, Nodes: `0.75rem` (12px)
- **Box Shadows**:
  - Soft Card Shadow: `0 10px 30px rgba(0, 0, 0, 0.025)`
  - Active Blue Shadow: `0 10px 25px rgba(53, 91, 245, 0.1)`

---

## 2. Layout Shell Architecture

### Sidebar (`Sidebar.tsx`)
- **Logo Zone**: Royal blue badge enclosing `.w` letter in white with "Workflows Admin" text.
- **Project Dropdown**: Rounded selection dropdown in royal blue background with chevron icon.
- **Section Dividers**: Gray uppercase headers ("Menu", "Configurations") at 11px font size with extra spacing.
- **Navigation Links**:
  - Inactive: Gray text, transparent background.
  - Active: Bold royal blue text and icon, with soft hover background.
  - Messages/Notifications display a red badge "17".
- **Bottom CTA**: Gradient "Create Project" button with cyan-blue colors (`bg-gradient-to-r from-[#00c6ff] to-[#0072ff]`).

### Header (`Header.tsx`)
- **Search input**: Pill-shaped light gray-blue background with placeholder "Type in to search...".
- **Utilities Row**: Standard icons for docs, calendar, alerts, plus notifications bells containing alert dots.
- **User Avatar**: Rounded circular frame matching profile view.

---

## 3. Workflows List Page

- **Metric Cards**: Row of 3 stats widgets displaying KPIs (Workflows, Runs, Success Rate) with soft light-cyan document icon.
- **Workflows Table**:
  - Housed in a white card with `shadow-sm` and `rounded-3xl` corners.
  - Columns:
    - `Checkbox`: Row selection.
    - `No.`: ID count.
    - `Name`: Workflow title with customized prefix icon.
    - `Status`: Color pill tags displaying status (Active/Inactive).
    - `Trend & Success Rate`: Sparkline graphs drawn dynamically using inline SVG elements displaying history trends.
    - `Actions`: Trigger, edit, delete.
- **Pagination**: Styled as `[← Previous] 1 2 3 ... 8 9 10 [Next →]`.

---

## 4. Canvas Workflow Editor

- **Canvas Board**: Dot grid background using standard React Flow background configurations on `#f0f3f8`.
- **Custom React Flow Nodes**:
  - Custom card-wrapper styling matching the dashboard aesthetic (rounded-2xl, white background, shadow-sm).
  - Colored header representing node types (Telegram = blue, Condition = orange, Approval = green).
  - Displays state parameters and clean connecting handles on hover.
- **Control Bar**: Glassmorphism action bar with blur overlays (`backdrop-blur-md bg-white/80`) containing Save, Run, Add Node, and Go Back buttons.
